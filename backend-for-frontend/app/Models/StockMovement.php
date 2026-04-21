<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Stock;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class StockMovement extends Model
{
    protected $table = 'stock_movements';

    protected $fillable = [
        'stock_id',
        'stock_item_id',  // Added for direct reference
        'type',
        'quantity',
        'old_quantity',   // Renamed from 'before' for clarity
        'new_quantity',   // Renamed from 'after' for clarity
        'order_id',
        'performed_by',   // Renamed from 'created_by' for consistency
        'reason',
        'reference'       // Added for tracking references
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'old_quantity' => 'decimal:4',
        'new_quantity' => 'decimal:4',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Movement Types
    |--------------------------------------------------------------------------
    */

    const TYPE_DEDUCTION = 'DEDUCTION';    // Stock removed (sales, usage)
    const TYPE_RESTORATION = 'RESTORATION'; // Stock returned (cancellations)
    const TYPE_ADJUSTMENT = 'ADJUSTMENT';   // Manual adjustments
    const TYPE_PURCHASE = 'PURCHASE';       // New stock added
    
    // Legacy support for old type names
    const TYPE_IN = 'IN';
    const TYPE_OUT = 'OUT';

    /*
    |--------------------------------------------------------------------------
    | Accessors & Mutators
    |--------------------------------------------------------------------------
    */

    /**
     * Get the type label with proper formatting
     */
    public function getTypeLabelAttribute(): string
    {
        return match($this->type) {
            self::TYPE_DEDUCTION, self::TYPE_OUT => 'Stock Out',
            self::TYPE_RESTORATION => 'Stock Restored',
            self::TYPE_PURCHASE, self::TYPE_IN => 'Stock In',
            self::TYPE_ADJUSTMENT => 'Adjustment',
            default => ucfirst(strtolower($this->type))
        };
    }

    /**
     * Get the type icon (for UI)
     */
    public function getTypeIconAttribute(): string
    {
        return match($this->type) {
            self::TYPE_DEDUCTION, self::TYPE_OUT => '📉',
            self::TYPE_RESTORATION => '↩️',
            self::TYPE_PURCHASE, self::TYPE_IN => '📦',
            self::TYPE_ADJUSTMENT => '⚙️',
            default => '📊'
        };
    }

    /**
     * Get the quantity change with sign
     */
    public function getQuantityChangeAttribute(): string
    {
        $change = $this->new_quantity - $this->old_quantity;
        return ($change > 0 ? '+' : '') . number_format($change, 2);
    }

    /**
     * Get CSS class for quantity change
     */
    public function getQuantityChangeClassAttribute(): string
    {
        $change = $this->new_quantity - $this->old_quantity;
        if ($change > 0) return 'text-green-600';
        if ($change < 0) return 'text-red-600';
        return 'text-gray-600';
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get the stock record (for compatibility with Stock model)
     */
    public function stock(): BelongsTo
    {
        return $this->belongsTo(Stock::class, 'stock_id');
    }

    /**
     * Get the stock item directly (if stock_item_id is used)
     */
    public function stockItem(): BelongsTo
    {
        return $this->belongsTo(StockItem::class, 'stock_item_id');
    }

    /**
     * Get the order associated with this movement
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the user who performed the movement
     */
    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    /**
     * Alias for performedBy (legacy support)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope a query to only include deduction movements
     */
    public function scopeDeductions($query)
    {
        return $query->whereIn('type', [self::TYPE_DEDUCTION, self::TYPE_OUT]);
    }

    /**
     * Scope a query to only include addition movements
     */
    public function scopeAdditions($query)
    {
        return $query->whereIn('type', [self::TYPE_PURCHASE, self::TYPE_IN, self::TYPE_RESTORATION]);
    }

    /**
     * Scope a query to only include movements for a specific stock item
     */
    public function scopeForStockItem($query, $stockItemId)
    {
        return $query->where('stock_item_id', $stockItemId);
    }

    /**
     * Scope a query to only include movements for a specific order
     */
    public function scopeForOrder($query, $orderId)
    {
        return $query->where('order_id', $orderId);
    }

    /**
     * Scope a query to only include movements within a date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope a query to only include today's movements
     */
    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    /**
     * Scope a query to only include this week's movements
     */
    public function scopeThisWeek($query)
    {
        return $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
    }

    /*
    |--------------------------------------------------------------------------
    | Core Methods
    |--------------------------------------------------------------------------
    */

    /**
     * Record a stock movement with validation
     * 
     * @param Stock $stock
     * @param string $type
     * @param float $quantity
     * @param int|null $orderId
     * @param string|null $reason
     * @param string|null $reference
     * @return StockMovement
     * @throws \Exception
     */
    public static function record(
        Stock $stock,
        string $type,
        float $quantity,
        ?int $orderId = null,
        ?string $reason = null,
        ?string $reference = null
    ): self {
        
        // Validate quantity
        if ($quantity <= 0) {
            throw new \Exception("Movement quantity must be greater than zero.");
        }

        $oldQuantity = $stock->quantity;
        $newQuantity = $oldQuantity;

        // Calculate new quantity based on movement type
        if (in_array($type, [self::TYPE_DEDUCTION, self::TYPE_OUT])) {
            // Stock deduction
            if ($stock->quantity < $quantity) {
                $itemName = $stock->stockItem->name ?? 'Unknown item';
                throw new \Exception(
                    "Insufficient stock for {$itemName}. Required: {$quantity}, Available: {$stock->quantity}"
                );
            }
            $newQuantity = $oldQuantity - $quantity;
        } elseif (in_array($type, [self::TYPE_PURCHASE, self::TYPE_IN, self::TYPE_RESTORATION])) {
            // Stock addition
            $newQuantity = $oldQuantity + $quantity;
        } elseif ($type === self::TYPE_ADJUSTMENT) {
            // Manual adjustment - quantity becomes the new value
            $newQuantity = $quantity;
            $quantity = abs($newQuantity - $oldQuantity);
        } else {
            throw new \Exception("Invalid movement type: {$type}");
        }

        // Ensure new quantity is not negative
        if ($newQuantity < 0) {
            throw new \Exception("Movement would result in negative stock quantity.");
        }

        // Create movement record
        $movement = self::create([
            'stock_id' => $stock->id,
            'stock_item_id' => $stock->stock_item_id,
            'type' => $type,
            'quantity' => $quantity,
            'old_quantity' => $oldQuantity,
            'new_quantity' => $newQuantity,
            'order_id' => $orderId,
            'performed_by' => auth()->id(),
            'reason' => $reason,
            'reference' => $reference
        ]);

        // Update stock quantity
        $stock->update(['quantity' => $newQuantity]);

        // Log the movement (optional)
        Log::info("Stock movement recorded", [
            'movement_id' => $movement->id,
            'stock_item_id' => $stock->stock_item_id,
            'type' => $type,
            'quantity' => $quantity,
            'old_quantity' => $oldQuantity,
            'new_quantity' => $newQuantity,
            'order_id' => $orderId,
            'performed_by' => auth()->id()
        ]);

        return $movement;
    }

    /**
     * Legacy method for backward compatibility
     * Maps old TYPE_IN/TYPE_OUT to new types
     */
    public static function recordLegacy(
        Stock $stock,
        string $type,
        float $quantity,
        ?int $orderId = null,
        ?string $reason = null
    ): self {
        
        // Map legacy types to new types
        $newType = match($type) {
            self::TYPE_IN => self::TYPE_PURCHASE,
            self::TYPE_OUT => self::TYPE_DEDUCTION,
            default => $type
        };

        return self::record($stock, $newType, $quantity, $orderId, $reason);
    }

    /**
     * Reverse a movement (useful for cancellations)
     */
    public function reverse(?string $reason = null): self
    {
        $reverseType = match($this->type) {
            self::TYPE_DEDUCTION, self::TYPE_OUT => self::TYPE_RESTORATION,
            self::TYPE_PURCHASE, self::TYPE_IN, self::TYPE_RESTORATION => self::TYPE_DEDUCTION,
            self::TYPE_ADJUSTMENT => self::TYPE_ADJUSTMENT,
            default => $this->type
        };

        $reason = $reason ?? "Reversal of movement #{$this->id}";

        return self::record(
            $this->stock,
            $reverseType,
            $this->quantity,
            $this->order_id,
            $reason,
            "reversal_of_{$this->id}"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */

    /**
     * Check if movement is a deduction
     */
    public function isDeduction(): bool
    {
        return in_array($this->type, [self::TYPE_DEDUCTION, self::TYPE_OUT]);
    }

    /**
     * Check if movement is an addition
     */
    public function isAddition(): bool
    {
        return in_array($this->type, [self::TYPE_PURCHASE, self::TYPE_IN, self::TYPE_RESTORATION]);
    }

    /**
     * Get formatted date
     */
    public function getFormattedDateAttribute(): string
    {
        return $this->created_at->format('M d, Y h:i A');
    }

    /**
     * Get relative time (e.g., "2 hours ago")
     */
    public function getRelativeTimeAttribute(): string
    {
        return $this->created_at->diffForHumans();
    }

    /*
    |--------------------------------------------------------------------------
    | Boot Method
    |--------------------------------------------------------------------------
    */

    protected static function boot()
    {
        parent::boot();

        // Add validation before creating
        static::creating(function ($movement) {
            if (!$movement->performed_by && auth()->check()) {
                $movement->performed_by = auth()->id();
            }
        });
    }
}