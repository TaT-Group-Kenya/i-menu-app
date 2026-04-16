<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\StockMovement;
use App\Models\StockItem;

class Stock extends Model
{
    use HasFactory;

    protected $table = 'stocks';

    protected $fillable = [
        'stock_item_id',
        'quantity',
        'stock_warning_count',
        'stock_duration_forecast_day',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'stock_warning_count' => 'integer',
        'stock_duration_forecast_day' => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * Stock belongs to a StockItem
     */
    public function stockItem()
    {
        return $this->belongsTo(StockItem::class, 'stock_item_id');
    }

    /**
     * Stock has many movements
     */
    public function movements()
    {
        return $this->hasMany(StockMovement::class, 'stock_item_id', 'stock_item_id');
    }

    /*
    |--------------------------------------------------------------------------
    | STOCK STATUS HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Check if stock is low
     */
    public function isLowStock()
    {
        return $this->quantity <= $this->stock_warning_count;
    }

    /**
     * Check if stock is critical
     */
    public function isCriticalStock()
    {
        return $this->quantity <= 0;
    }

    /**
     * Check if enough stock exists
     */
    public function hasEnough($requiredQuantity)
    {
        return $this->quantity >= $requiredQuantity;
    }

    /**
     * Return stock error message for UI
     */
    public function stockError($requiredQuantity)
    {
        return [
            'stock_item' => $this->stockItem->name,
            'required_quantity' => (float) $requiredQuantity,
            'available_quantity' => (float) $this->quantity
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | STOCK OPERATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * Increase stock
     */
    public function increaseStock($quantity, $referenceType = null, $referenceId = null)
    {
        $this->increment('quantity', $quantity);

        StockMovement::create([
            'stock_item_id' => $this->stock_item_id,
            'type' => 'IN',
            'quantity' => $quantity,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'created_by' => auth()->id()
        ]);
    }

    /**
     * Decrease stock safely
     */
    public function decreaseStock($quantity, $referenceType = null, $referenceId = null)
    {
        if ($this->quantity < $quantity) {

            throw new \Exception(
                "{$this->stockItem->name} requires {$quantity} but only {$this->quantity} available"
            );
        }

        $this->decrement('quantity', $quantity);

        StockMovement::create([
            'stock_item_id' => $this->stock_item_id,
            'type' => 'OUT',
            'quantity' => $quantity,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'created_by' => auth()->id()
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | FORECASTING
    |--------------------------------------------------------------------------
    */

    public function forecastDepletionDate()
    {
        if ($this->quantity <= 0) {
            return now();
        }

        $dailyUsage = $this->calculateDailyUsage();

        if ($dailyUsage <= 0) {
            return null;
        }

        $daysUntilDepletion = $this->quantity / $dailyUsage;

        return now()->addDays(ceil($daysUntilDepletion));
    }

    public function calculateDailyUsage()
    {
        return 10;
    }

    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeLowStock($query)
    {
        return $query->whereColumn('quantity', '<=', 'stock_warning_count');
    }

    public function scopeCriticalStock($query)
    {
        return $query->where('quantity', '<=', 0);
    }
}