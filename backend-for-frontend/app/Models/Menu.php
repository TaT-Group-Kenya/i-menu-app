<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $table = 'menus';

    protected $fillable = [
        'name',
        'description',
        'price',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'price' => 'decimal:2'
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * A menu can appear in many order items
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'menu_id', 'id');
    }

    /**
     * Menu recipe ingredients
     */
    public function ingredients()
    {
        return $this->hasMany(MenuIngredient::class, 'menu_id', 'id')
            ->with('stockItem');
    }

    /**
     * Direct access to stock items through ingredients
     */
    public function stockItems()
    {
        return $this->belongsToMany(
            StockItem::class,
            'menu_ingredients',
            'menu_id',
            'stock_item_id'
        )->withPivot('quantity', 'unit');
    }

    /*
    |--------------------------------------------------------------------------
    | BUSINESS LOGIC
    |--------------------------------------------------------------------------
    */

    /**
     * Calculate production cost of this menu item
     */
    public function calculateCost()
    {
        $cost = 0;

        foreach ($this->ingredients as $ingredient) {

            if (!$ingredient->stockItem) {
                continue;
            }

            $unitCost = (float) ($ingredient->stockItem->unit_cost ?? 0);

            $cost += $unitCost * $ingredient->quantity;
        }

        return round($cost, 2);
    }

    /**
     * Calculate profit for one unit of this menu item
     */
    public function profitPerItem()
    {
        return round($this->price - $this->calculateCost(), 2);
    }

    /**
     * Profit percentage
     */
    public function profitMargin()
    {
        $cost = $this->calculateCost();

        if ($cost == 0) {
            return 100;
        }

        return round((($this->price - $cost) / $cost) * 100, 2);
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER METHODS
    |--------------------------------------------------------------------------
    */

    /**
     * Check if menu has ingredients
     */
    public function hasIngredients()
    {
        return $this->ingredients()->exists();
    }

    /**
     * Return ingredient usage summary
     */
    public function ingredientSummary()
    {
        return $this->ingredients->map(function ($ingredient) {

            return [
                'ingredient' => $ingredient->stockItem?->name,
                'quantity_required' => $ingredient->quantity,
                'unit_cost' => $ingredient->stockItem?->unit_cost,
                'total_cost' =>
                    ($ingredient->stockItem?->unit_cost ?? 0)
                    * $ingredient->quantity
            ];
        });
    }
}