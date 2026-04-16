<?php

namespace App\Services;

use App\Models\Menu;

class MenuCostCalculator
{
    public static function calculate(Menu $menu)
    {
        $menu->load('ingredients.stockItem');

        $totalCost = 0;

        foreach ($menu->ingredients as $ingredient) {

            $stock = $ingredient->stockItem;

            if (!$stock) continue;

            $unitCost = $stock->unit_cost ?? 0;
            $unitQty = $stock->unit_quantity ?: 1;

            $costPerUnit = $unitCost / $unitQty;

            $ingredientCost =
                $ingredient->quantity * $costPerUnit;

            $totalCost += $ingredientCost;
        }

        return round($totalCost, 2);
    }
}