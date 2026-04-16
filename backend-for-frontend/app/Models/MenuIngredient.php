<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuIngredient extends Model
{
    protected $table = 'menu_ingredients';

    protected $fillable = [
        'menu_id',
        'stock_item_id',
        'quantity',
        'unit',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'quantity' => 'decimal:4'
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    public function menu()
    {
        return $this->belongsTo(Menu::class, 'menu_id', 'id');
    }

    public function stockItem()
    {
        return $this->belongsTo(StockItem::class, 'stock_item_id', 'id');
    }

    public function stock()
    {
        return $this->hasOneThrough(
            Stock::class,
            StockItem::class,
            'id',
            'stock_item_id',
            'stock_item_id',
            'id'
        );
    }
}