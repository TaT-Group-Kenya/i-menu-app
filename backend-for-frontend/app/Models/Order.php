<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_number',
        'etr_number',
        'cu_serial',
        'qr_code',
        'fiscal_status',
        'fiscal_datetime',
        'status',
        'cost',
        'tax',
        'discounts',
        'total',
        'created_by'
    ];

    protected $casts = [
        'cost' => 'decimal:2',
        'tax' => 'decimal:2',
        'discounts' => 'decimal:2',
        'total' => 'decimal:2',
        'fiscal_datetime' => 'datetime'
    ];

    /*
    |--------------------------------------------------------------------------
    | STATUS CONSTANTS
    |--------------------------------------------------------------------------
    */

    public const STATUS_PENDING   = 'PENDING';
    public const STATUS_PAID      = 'PAID';
    public const STATUS_CANCELLED = 'CANCELLED';

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /*
    |--------------------------------------------------------------------------
    | AGGREGATE STOCK REQUIREMENTS (NEW - IMPORTANT)
    |--------------------------------------------------------------------------
    */

    public static function getStockRequirements(array $items)
    {
        $requirements = [];

        foreach ($items as $item) {

            $menu = Menu::with('ingredients.stockItem')
                ->find($item['menu_id']);

            if (!$menu) continue;

            foreach ($menu->ingredients as $ingredient) {

                $required =
                    $ingredient->quantity * $item['quantity'];

                if (!isset($requirements[$ingredient->stock_item_id])) {
                    $requirements[$ingredient->stock_item_id] = 0;
                }

                $requirements[$ingredient->stock_item_id] += $required;
            }
        }

        return $requirements;
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE STOCK (UPDATED - MATCHES CONTROLLER)
    |--------------------------------------------------------------------------
    */

    public static function validateStock(array $requirements)
    {
        $errors = [];

        $stocks = Stock::whereIn('stock_item_id', array_keys($requirements))
            ->get()
            ->keyBy('stock_item_id');

        foreach ($requirements as $stockItemId => $required) {

            $stock = $stocks[$stockItemId] ?? null;

            if (!$stock) {
                $errors[] = "Missing stock for item ID {$stockItemId}";
                continue;
            }

            if ($stock->quantity < $required) {
                $errors[] = "Insufficient stock for item ID {$stockItemId}";
            }
        }

        return $errors;
    }

    /*
    |--------------------------------------------------------------------------
    | DEDUCT STOCK (SAFE)
    |--------------------------------------------------------------------------
    */

    public static function deductStock(array $requirements)
    {
        $stocks = Stock::whereIn('stock_item_id', array_keys($requirements))
            ->lockForUpdate()
            ->get()
            ->keyBy('stock_item_id');

        foreach ($requirements as $stockItemId => $required) {

            $stock = $stocks[$stockItemId];

            if ($stock->quantity < $required) {
                throw new \Exception("Stock changed during deduction.");
            }

            $stock->quantity -= $required;
            $stock->save();
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE STOCK (USED ON CANCEL)
    |--------------------------------------------------------------------------
    */

    public function restoreStock()
    {
        foreach ($this->items as $item) {

            $menu = $item->menu;

            if (!$menu) continue;

            foreach ($menu->ingredients as $ingredient) {

                $stock = Stock::where(
                    'stock_item_id',
                    $ingredient->stock_item_id
                )->lockForUpdate()->first();

                if (!$stock) continue;

                $restore =
                    $ingredient->quantity * $item->quantity;

                $stock->quantity += $restore;
                $stock->save();
            }
        }
    }

    /*
    |--------------------------------------------------------------------------
    | BUSINESS LOGIC
    |--------------------------------------------------------------------------
    */

    public function recalculateTotals()
    {
        $this->load('items');

        $cost = $this->items->sum('subtotal');

        $this->cost = $cost;
        $this->total = $cost + ($this->tax ?? 0) - ($this->discounts ?? 0);

        $this->save();
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS METHODS (SAFE)
    |--------------------------------------------------------------------------
    */

    public function approve()
    {
        if ($this->status === self::STATUS_PAID) {
            throw new \Exception("Order already approved.");
        }

        if ($this->status === self::STATUS_CANCELLED) {
            throw new \Exception("Cannot approve cancelled order.");
        }

        $this->update([
            'status' => self::STATUS_PAID
        ]);
    }

    public function cancelOrder()
    {
        if ($this->status === self::STATUS_CANCELLED) {
            throw new \Exception("Order already cancelled.");
        }

        DB::transaction(function () {

            if ($this->status === self::STATUS_PAID) {
                $this->restoreStock();
            }

            $this->update([
                'status' => self::STATUS_CANCELLED
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS LIST
    |--------------------------------------------------------------------------
    */

    public static function getStatuses()
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_PAID,
            self::STATUS_CANCELLED
        ];
    }
}