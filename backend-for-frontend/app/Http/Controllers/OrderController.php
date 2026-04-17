<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Menu;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class OrderController extends Controller
{

    public function index()
    {
        return response()->json(
            Order::with('cashier')->latest()->get()
        );
    }

    public function show($id)
    {
        $order = Order::with([
            'items.menu',
            'cashier'
        ])->findOrFail($id);

        return response()->json($order);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE ORDER
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        try {

            if (!in_array(auth()->user()->role, ['CASHIER', 'ADMIN'])) {
                return response()->json([
                    'message' => 'Unauthorized.'
                ], 403);
            }

            $request->validate([
                'items' => 'required|array|min:1',
                'items.*.menu_id' => 'required|exists:menus,id',
                'items.*.quantity' => 'required|integer|min:1',
            ]);

            return DB::transaction(function () use ($request) {

                $errors = [];
                $ingredientErrors = [];
                $insufficientStockItems = [];

                $stockRequirements = [];

                foreach ($request->items as $itemData) {

                    $menu = Menu::with('ingredients.stockItem')
                        ->findOrFail($itemData['menu_id']);

                    if ($menu->ingredients->isEmpty()) {
                        $errors[] = "Menu '{$menu->name}' has no ingredients configured.";
                        continue;
                    }

                    foreach ($menu->ingredients as $ingredient) {

                        if (!$ingredient->stockItem) {
                            $errors[] = "Ingredient in '{$menu->name}' is not linked.";
                            continue;
                        }

                        $required = $ingredient->quantity * $itemData['quantity'];

                        if (!isset($stockRequirements[$ingredient->stock_item_id])) {
                            $stockRequirements[$ingredient->stock_item_id] = [
                                'required' => 0,
                                'menu_id' => $menu->id,
                                'menu_name' => $menu->name,
                                'ingredient_name' => $ingredient->stockItem->name,
                                'unit' => $ingredient->stockItem->unit ?? 'units',
                                'requested_quantity' => $itemData['quantity']
                            ];
                        }

                        $stockRequirements[$ingredient->stock_item_id]['required'] += $required;
                    }
                }

                $stocks = Stock::whereIn('stock_item_id', array_keys($stockRequirements))
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('stock_item_id');

                foreach ($stockRequirements as $stockItemId => $requirement) {

                    $stock = $stocks[$stockItemId] ?? null;

                    if (!$stock) {
                        $errors[] = "Missing stock for {$requirement['ingredient_name']}";
                        continue;
                    }

                    if ($stock->quantity < $requirement['required']) {
                        $insufficientStockItems[] = $stockItemId;
                        
                        $ingredientErrors[] = [
                            'menu_id' => $requirement['menu_id'],
                            'menu_name' => $requirement['menu_name'],
                            'ingredient_id' => $stockItemId,
                            'ingredient_name' => $requirement['ingredient_name'],
                            'required_quantity' => $requirement['required'],
                            'available_quantity' => $stock->quantity,
                            'unit' => $requirement['unit'],
                            'requested_menu_quantity' => $requirement['requested_quantity']
                        ];
                    }
                }

                if (!empty($errors) || !empty($ingredientErrors)) {
                    return response()->json([
                        'message' => 'Insufficient stock for ingredients',
                        'errors' => $errors,
                        'stock_errors' => $ingredientErrors,
                        'error_type' => 'ingredient_shortage'
                    ], 422);
                }

                $orderNumber =
                    'ORD-' . now()->format('Ymd') . '-' .
                    str_pad(Order::count() + 1, 4, '0', STR_PAD_LEFT);

                $order = Order::create([
                    'order_number' => $orderNumber,
                    'status' => Order::STATUS_PENDING,
                    'created_by' => auth()->id(),
                    'cost' => 0,
                    'tax' => 0,
                    'discounts' => 0,
                    'total' => 0,
                ]);

                $profitMessages = [];

                foreach ($request->items as $itemData) {

                    $menu = Menu::with('ingredients.stockItem')
                        ->findOrFail($itemData['menu_id']);

                    $subtotal = $menu->price * $itemData['quantity'];

                    OrderItem::create([
                        'order_id' => $order->id,
                        'menu_id' => $menu->id,
                        'quantity' => $itemData['quantity'],
                        'price' => $menu->price,
                        'subtotal' => $subtotal,
                        'tax_amount' => 0,
                    ]);

                    $totalIngredientCost = 0;

                    foreach ($menu->ingredients as $ingredient) {

                        $stockItem = $ingredient->stockItem;
                        if (!$stockItem) continue;

                        $unitCost = (float) ($stockItem->unit_cost ?? 0);
                        $unitQuantity = max((float) ($stockItem->unit_quantity ?? 1), 1);

                        $costPerUnit = $unitCost / $unitQuantity;

                        $totalIngredientCost +=
                            $ingredient->quantity *
                            $itemData['quantity'] *
                            $costPerUnit;
                    }

                    $profit = round(
                        ($menu->price * $itemData['quantity']) - $totalIngredientCost,
                        2
                    );

                    $profitMessages[] = [
                        'menu' => $menu->name,
                        'profit' => $profit,
                        'type' => $profit >= 0 ? 'profit' : 'loss',
                    ];
                }

                // Deduct stock AND record movements using the StockMovement model
                foreach ($stockRequirements as $stockItemId => $requirement) {

                    $stock = $stocks[$stockItemId];

                    if ($stock->quantity < $requirement['required']) {
                        throw new \Exception("Stock changed during processing.");
                    }

                    // Use the StockMovement::record() method
                    StockMovement::record(
                        $stock,
                        StockMovement::TYPE_DEDUCTION,
                        $requirement['required'],
                        $order->id,
                        "Order #{$order->order_number} - {$requirement['menu_name']} (x{$requirement['requested_quantity']})",
                        "order_{$order->id}"
                    );
                }

                $order->recalculateTotals();

                return response()->json([
                    'message' => 'Order created and stock deducted successfully.',
                    'profit_analysis' => $profitMessages,
                    'order' => $order->load('items.menu', 'cashier')
                ], 201);
            });

        } catch (Throwable $e) {
            \Log::error('Order creation failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Server Error',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | MARK AS PAID 
    |--------------------------------------------------------------------------
    */

    public function markAsPaid($id)
    {
        return $this->approve($id);
    }

    /*
    |--------------------------------------------------------------------------
    | APPROVE ORDER 
    |--------------------------------------------------------------------------
    */

    public function approve($id)
    {
        try {

            $order = Order::findOrFail($id);

            if ($order->status === Order::STATUS_PAID) {
                return response()->json([
                    'message' => 'Order already approved.'
                ], 400);
            }

            if ($order->status === Order::STATUS_CANCELLED) {
                return response()->json([
                    'message' => 'Cancelled order cannot be approved.'
                ], 400);
            }

            $order->update([
                'status' => Order::STATUS_PAID
            ]);

            return response()->json([
                'message' => 'Order approved successfully.',
                'order' => $order
            ]);

        } catch (Throwable $e) {
            \Log::error('Order approval failed: ' . $e->getMessage());
            
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CANCEL ORDER
    |--------------------------------------------------------------------------
    */

    public function cancel($id)
    {
        try {

            return DB::transaction(function () use ($id) {

                $order = Order::with('items.menu.ingredients')
                    ->findOrFail($id);

                if ($order->status === Order::STATUS_CANCELLED) {
                    return response()->json([
                        'message' => 'Order already cancelled.'
                    ], 400);
                }

                if ($order->status === Order::STATUS_PAID) {

                    foreach ($order->items as $orderItem) {

                        $menu = $orderItem->menu;

                        if (!$menu) continue;

                        foreach ($menu->ingredients as $ingredient) {

                            $stock = Stock::where(
                                'stock_item_id',
                                $ingredient->stock_item_id
                            )->lockForUpdate()->first();

                            if (!$stock) continue;

                            $restoreAmount =
                                $ingredient->quantity *
                                $orderItem->quantity;

                            // Use the StockMovement::record() method for restoration
                            StockMovement::record(
                                $stock,
                                StockMovement::TYPE_RESTORATION,
                                $restoreAmount,
                                $order->id,
                                "Order cancelled - #{$order->order_number} - Menu: {$menu->name}",
                                "cancelled_order_{$order->id}"
                            );
                        }
                    }
                }

                $order->update([
                    'status' => Order::STATUS_CANCELLED
                ]);

                return response()->json([
                    'message' => 'Order cancelled successfully.'
                ]);
            });

        } catch (Throwable $e) {
            \Log::error('Order cancellation failed: ' . $e->getMessage(), [
                'order_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
}