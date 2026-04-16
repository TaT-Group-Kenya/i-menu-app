<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Stock;
use App\Models\Order;
use App\Models\User;

class StockMovement extends Model
{
    protected $table = 'stock_movements';

    protected $fillable = [
        'stock_id',
        'type',
        'quantity',
        'before',
        'after',
        'order_id',
        'created_by',
        'reason'
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'before' => 'decimal:4',
        'after' => 'decimal:4',
    ];

    /*
    |--------------------------------------------------------------------------
    | Movement Types
    |--------------------------------------------------------------------------
    */

    const TYPE_IN = 'IN';
    const TYPE_OUT = 'OUT';
    const TYPE_ADJUSTMENT = 'ADJUSTMENT';

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function stock()
    {
        return $this->belongsTo(Stock::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Create Movement
    |--------------------------------------------------------------------------
    */

    public static function record(
        Stock $stock,
        string $type,
        float $quantity,
        ?int $orderId = null,
        ?string $reason = null
    ) {

        $before = $stock->quantity;

        if ($type === self::TYPE_IN) {
            $after = $before + $quantity;
        } elseif ($type === self::TYPE_OUT) {
            $after = $before - $quantity;

            if ($after < 0) {
                throw new \Exception(
                    "{$stock->stockItem->name} requires {$quantity} but only {$before} available"
                );
            }
        } else {
            $after = $quantity;
        }

        $movement = self::create([
            'stock_id' => $stock->id,
            'type' => $type,
            'quantity' => $quantity,
            'before' => $before,
            'after' => $after,
            'order_id' => $orderId,
            'created_by' => auth()->id(),
            'reason' => $reason
        ]);

        $stock->update([
            'quantity' => $after
        ]);

        return $movement;
    }
}