<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Seeder;

class OrderItemSeeder extends Seeder
{
    public function run(): void
    {
        $order = Order::first();

        if (!$order) {
            return;
        }

        $items = [
            [1, 2400],
            [2, 2974],
            [3, 2400],
            [4, 1440],
            [5, 960],
        ];

        foreach ($items as [$menuId, $qty]) {
            OrderItem::create([
                'order_id' => $order->id,
                'menu_id'  => $menuId,
                'quantity' => $qty,
                'price'    => 220, // must match migration column name
            ]);
        }
    }
}