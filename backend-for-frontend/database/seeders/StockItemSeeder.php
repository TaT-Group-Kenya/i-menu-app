<?php

namespace Database\Seeders;

use App\Models\StockItem;
use Illuminate\Database\Seeder;

class StockItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            'MEAT' => 'GRAMS',
            'SALT' => 'GRAMS',
            'TOMATOES' => 'GRAMS',
            'ONIONS' => 'GRAMS',
            'COOKING GAS' => 'GRAMS',
            'CHARCOAL' => 'BAGS',
            'WATER' => 'MILLILITERS',
            'COOKING OIL' => 'MILLILITERS',
            'SPICES' => 'GRAMS',
            'VEGETABLES' => 'GRAMS',
            'SUGAR' => 'GRAMS',
            'TEA LEAVES' => 'GRAMS',
            'MILK' => 'MILLILITERS',
            'COFFEE' => 'GRAMS',
            'MAIZE FLOUR' => 'GRAMS',
            'WHEAT FLOUR' => 'GRAMS',
            'CHICKEN' => 'GRAMS',
            'BEANS' => 'GRAMS',
            'KAMANDE' => 'GRAMS',
            'POJO/GREEN GRAMS' => 'GRAMS',
            'POTATOES' => 'GRAMS',
            'RICE' => 'GRAMS',
            'CORIANDER' => 'GRAMS',
            'PEPPER' => 'GRAMS',
            'BLACK PEPPER' => 'GRAMS',
            'CUCUMBER' => 'GRAMS',
            'CARROTS' => 'GRAMS',
            'AVOCADO' => 'GRAMS',
            'PERSONNEL' => 'NUMBER',
            'RENT' => 'NUMBER',
            'FUEL' => 'MILLILITERS',
            'ELECTRICITY' => 'TOKENS'
        ];

        $createdBy = 1; // Assuming user ID 1 is the creator
    

        foreach ($items as $name => $unitOfMeasure) {
            StockItem::create([
                'name' => $name,
                'unit_of_measure' => $unitOfMeasure,
                'created_by' => $createdBy,
                'created_at' => now(),
            ]);
        }

        $this->command->info('Successfully seeded ' . count($items) . ' stock items.');
    }
}