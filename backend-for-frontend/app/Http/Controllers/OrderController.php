<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Menu;
use App\Models\Stock;
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

                        $required =
                            $ingredient->quantity * $itemData['quantity'];

                        if (!isset($stockRequirements[$ingredient->stock_item_id])) {
                            $stockRequirements[$ingredient->stock_item_id] = 0;
                        }

                        $stockRequirements[$ingredient->stock_item_id] += $required;
                    }
                }

                $stocks = Stock::whereIn('stock_item_id', array_keys($stockRequirements))
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('stock_item_id');

                foreach ($stockRequirements as $stockItemId => $required) {

                    $stock = $stocks[$stockItemId] ?? null;

                    if (!$stock) {
                        $errors[] = "Missing stock for item ID {$stockItemId}";
                        continue;
                    }

                    if ($stock->quantity < $required) {
                        $insufficientStockItems[] = $stockItemId;
                    }
                }

                if (!empty($errors) || !empty($insufficientStockItems)) {
                    return response()->json([
                        'message' => 'Insufficient stock.',
                        'errors' => $errors,
                        'stock_errors' => array_values(array_unique($insufficientStockItems)),
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

                //  Deduct stock ONCE
                foreach ($stockRequirements as $stockItemId => $required) {

                    $stock = $stocks[$stockItemId];

                    if ($stock->quantity < $required) {
                        throw new \Exception("Stock changed during processing.");
                    }

                    $stock->quantity -= $required;
                    $stock->save();
                }

                $order->recalculateTotals();

                return response()->json([
                    'message' => 'Order created and stock deducted successfully.',
                    'profit_analysis' => $profitMessages,
                    'order' => $order->load('items.menu', 'cashier')
                ], 201);
            });

        } catch (Throwable $e) {

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

                            $stock->quantity += $restoreAmount;
                            $stock->save();
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

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
}