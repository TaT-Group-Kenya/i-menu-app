<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;


class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::Class,
            StockItemSeeder::Class, 
            MenuSeeder::Class,
            OrderSeeder::Class,
            OrderItemSeeder::Class,
            MenuIngredientSeeder::Class
                    
        ]);
    }
}