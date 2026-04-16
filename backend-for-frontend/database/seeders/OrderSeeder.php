<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\User;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();

        if (!$user) {
            return;
        }

        Order::create([
            'order_number' => 'ORD-0001',
            'etr_number'   => null,
            'cost'         => 100000,
            'tax'          => 0.00,
            'discounts'    => 0.00,
            'total'        => 100000,
            'created_by'   => $user->id,
        ]);
    }
}