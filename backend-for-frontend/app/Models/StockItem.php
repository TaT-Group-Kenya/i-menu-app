<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockItem extends Model
{
    use HasFactory;

    protected $table = 'stock_items';

    protected $fillable = [
        'name',
        'unit_of_measure',
        'unit_cost',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'name' => 'string',
        'unit_of_measure' => 'string',
        'unit_cost' => 'decimal:4'
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * Stock quantity record
     */public function stock()
    {
    return $this->hasOne(Stock::class, 'stock_item_id');
    }

    /**
     * Recipe entries
     */
    public function menuIngredients()
    {
        return $this->hasMany(MenuIngredient::class, 'stock_item_id', 'id');
    }

    /**
     * Menus using this stock item
     */
    public function menus()
    {
        return $this->belongsToMany(
            Menu::class,
            'menu_ingredients',
            'stock_item_id',
            'menu_id'
        )
        ->withPivot('quantity', 'unit')
        ->withTimestamps();
    }

    /**
     * Creator
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    /**
     * Updater
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by', 'id');
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER METHODS
    |--------------------------------------------------------------------------
    */

    /**
     * Get stock quantity
     */
    public function getQuantity()
    {
        return $this->stock?->quantity ?? 0;
        load('stock');
        return $this->stock ? $this->stock->quantity : 0;
    }

    /**
     * Deduct stock safely
     */
    public function deductStock($amount)
    {
        if (!$this->stock) {
            throw new \Exception("Stock record missing for {$this->name}");
        }

        if ($this->stock->quantity < $amount) {
            throw new \Exception(
                "Insufficient stock for {$this->name}. Required {$amount} {$this->unit_of_measure}, Available {$this->stock->quantity} {$this->unit_of_measure}"
            );
        }

        $this->stock->decrement('quantity', $amount);
    }
}