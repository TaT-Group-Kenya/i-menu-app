<?php

namespace Database\Seeders;

use App\Models\Stock;
use App\Models\StockItem;
use Illuminate\Database\Seeder;

class StockSeeder extends Seeder
{
    public function run(): void
    {
        $stockItems = StockItem::all();

        foreach ($stockItems as $item) {

            Stock::updateOrCreate(
                ['stock_item_id' => $item->id],
                [
                    'quantity' => rand(5000, 20000),
                    'stock_warning_count' => 100,
                    'stock_duration_forecast_day' => 7,
                    'created_by' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

        }
    }
}