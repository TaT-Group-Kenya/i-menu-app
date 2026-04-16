<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MenuIngredient;

class MenuIngredientSeeder extends Seeder
{
    public function run(): void
    {
        // Menu 4 (Ugali / Beef Stew & Chicken Stew / Vegies)

        MenuIngredient::create([
            'menu_id' => 4,
            'stock_item_id' => 1,
            'quantity' => 400,
        ]);

        MenuIngredient::create([
            'menu_id' => 4,
            'stock_item_id' => 2,
            'quantity' => 250,
        ]);

        MenuIngredient::create([
            'menu_id' => 4,
            'stock_item_id' => 5,
            'quantity' => 150,
        ]);

        // Menu 5 (Ugali / Fried Chicken / Vegies)

        MenuIngredient::create([
            'menu_id' => 5,
            'stock_item_id' => 3,
            'quantity' => 350,
        ]);

        MenuIngredient::create([
            'menu_id' => 5,
            'stock_item_id' => 4,
            'quantity' => 300,
        ]);

        MenuIngredient::create([
            'menu_id' => 5,
            'stock_item_id' => 5,
            'quantity' => 150,
        ]);
    }
}