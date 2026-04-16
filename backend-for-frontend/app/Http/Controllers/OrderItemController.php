<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderItemController extends Controller
{
    /**
     * GET ALL ORDER ITEMS
     */
    public function index()
    {
        $orderItems = OrderItem::with(['order', 'menu'])
            ->latest()
            ->get();

        return response()->json($orderItems);
    }

    /**
     * GET SINGLE ORDER ITEM
     */
    public function show($id)
    {
        $orderItem = OrderItem::with(['order', 'menu'])
            ->findOrFail($id);

        return response()->json($orderItem);
    }

    /**
     * CREATE NEW ORDER (with items)
     */
    public function store(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($request) {

            $cost = 0;

            $orderNumber = 'ORD-' . now()->format('YmdHis') . '-' . rand(100, 999);

            $order = Order::create([
                'order_number' => $orderNumber,
                'status' => 'PENDING',
                'cost' => 0,
                'tax' => 0.00,
                'total' => 0,
                'created_by' => auth()->id(),
            ]);

            foreach ($request->items as $item) {

                $menu = Menu::findOrFail($item['menu_id']);
                $quantity = $item['quantity'];

                $price = $menu->price;
                $subtotal = $price * $quantity;

                $cost += $subtotal;

                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_id' => $menu->id,
                    'quantity' => $quantity,
                    'price' => $price,
                    'tax_rate' => 0,
                    'tax_amount' => 0.00,
                    'subtotal' => $subtotal,
                ]);
            }

            $order->update([
                'cost' => $cost,
                'tax' => 0.00,
                'total' => $cost,
            ]);

            return response()->json([
                'message' => 'Order placed successfully',
                'order' => $order->load('items.menu')
            ]);
        });
    }

    /**
     * UPDATE ORDER ITEM
     */
    public function update(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {

            $orderItem = OrderItem::findOrFail($id);

            $request->validate([
                'menu_id' => 'sometimes|required|exists:menus,id',
                'quantity' => 'sometimes|required|integer|min:1',
            ]);

            if ($request->has('menu_id')) {
                $orderItem->menu_id = $request->menu_id;
            }

            if ($request->has('quantity')) {
                $orderItem->quantity = $request->quantity;
            }

            $menu = Menu::findOrFail($orderItem->menu_id);

            $price = $menu->price;
            $subtotal = $price * $orderItem->quantity;

            $orderItem->price = $price;
            $orderItem->subtotal = $subtotal;

            $orderItem->save();

            $order = Order::findOrFail($orderItem->order_id);

            $cost = OrderItem::where('order_id', $order->id)->sum('subtotal');

            $order->update([
                'cost' => $cost,
                'total' => $cost,
            ]);

            return response()->json([
                'message' => 'Order item updated successfully',
                'order_item' => $orderItem,
                'order_total' => $order->total
            ]);
        });
    }

    /**
     * DELETE ORDER ITEM
     */
    public function destroy($id)
    {
        return DB::transaction(function () use ($id) {

            $orderItem = OrderItem::findOrFail($id);
            $orderId = $orderItem->order_id;

            $orderItem->delete();

            $order = Order::findOrFail($orderId);

            $cost = OrderItem::where('order_id', $order->id)->sum('subtotal');

            $order->update([
                'cost' => $cost,
                'total' => $cost,
            ]);

            return response()->json([
                'message' => 'Order item deleted',
                'order_total' => $order->total
            ]);
        });
    }
}