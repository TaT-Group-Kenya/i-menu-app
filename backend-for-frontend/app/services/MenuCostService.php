<?php

namespace App\Services;

use App\Models\Menu;

class MenuCostService
{
    public function calculateMenuProfit($menuId, $quantity = 1)
    {
        $menu = Menu::with('ingredients.stockItem')
            ->findOrFail($menuId);

        $totalIngredientCost = 0;

        foreach ($menu->ingredients as $ingredient) {

            $stockItem = $ingredient->stockItem;

            if (!$stockItem) {
                continue;
            }

            $costPerUnit =
                $stockItem->unit_cost /
                max($stockItem->unit_quantity, 1);

            $ingredientCost =
                $ingredient->quantity *
                $quantity *
                $costPerUnit;

            $totalIngredientCost += $ingredientCost;
        }

        $sellingPrice =
            $menu->price * $quantity;

        $profit =
            $sellingPrice - $totalIngredientCost;

        return [
            'menu' => $menu->name,
            'selling_price' => $sellingPrice,
            'cost' => round($totalIngredientCost, 2),
            'profit' => round($profit, 2),
            'type' => $profit >= 0 ? 'profit' : 'loss',
            'message' => $profit >= 0
                ? "You are making a profit of +" . round($profit, 2) . " KES"
                : "You are making a loss of " . round($profit, 2) . " KES"
        ];
    }
}