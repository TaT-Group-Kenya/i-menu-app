<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Stock;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'menu_id',
        'quantity',
        'price',
        'tax_rate',
        'tax_amount',
        'subtotal',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'quantity' => 'integer',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {

            $menu = $item->menu;

            if (!$menu) {
                return;
            }

            $item->tax_rate = $menu->tax_rate ?? 0;

            $subtotal = $item->price * $item->quantity;

            if (($menu->tax_type ?? null) === 'VAT') {
                $taxAmount = ($subtotal * $item->tax_rate) / 100;
            } else {
                $taxAmount = 0;
            }

            $item->tax_amount = $taxAmount;
            $item->subtotal = $subtotal;
        });

        /*
        |--------------------------------------------------------------------------
        | AFTER ORDER ITEM CREATED
        | Deduct stock based on recipe
        |--------------------------------------------------------------------------
        */

        static::created(function ($item) {

            $menu = $item->menu()->with('ingredients')->first();

            if (!$menu) {
                return;
            }

            foreach ($menu->ingredients as $ingredient) {

                $stock = Stock::where('stock_item_id', $ingredient->stock_item_id)->first();

                if (!$stock) {
                    continue;
                }

                $deductQty = $ingredient->quantity * $item->quantity;

                $stock->quantity = $stock->quantity - $deductQty;

                if ($stock->quantity < 0) {
                    $stock->quantity = 0;
                }

                $stock->save();
            }

            if ($item->order) {
                $item->order->recalculateTotals();
            }
        });

        static::updated(function ($item) {

            if ($item->order) {
                $item->order->recalculateTotals();
            }
        });

        static::deleted(function ($item) {

            if ($item->order) {
                $item->order->recalculateTotals();
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }
}