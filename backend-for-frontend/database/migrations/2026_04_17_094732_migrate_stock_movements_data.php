<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if the old columns exist and new columns are empty
        if (Schema::hasTable('stock_movements') && 
            Schema::hasColumn('stock_movements', 'before') && 
            Schema::hasColumn('stock_movements', 'after')) {
            
            // Migrate old quantity fields to new fields
            DB::statement('
                UPDATE stock_movements 
                SET old_quantity = `before`,
                    new_quantity = `after`
                WHERE old_quantity IS NULL AND `before` IS NOT NULL
            ');
            
            echo "Migrated quantity fields (before/after) to (old_quantity/new_quantity)\n";
        }
        
        // Migrate stock_item_id from stocks table
        if (Schema::hasTable('stock_movements') && 
            Schema::hasColumn('stock_movements', 'stock_item_id')) {
            
            DB::statement('
                UPDATE stock_movements sm
                JOIN stocks s ON sm.stock_id = s.id
                SET sm.stock_item_id = s.stock_item_id
                WHERE sm.stock_item_id IS NULL AND s.stock_item_id IS NOT NULL
            ');
            
            echo "Migrated stock_item_id from stocks relationship\n";
        }
        
        // Migrate created_by to performed_by
        if (Schema::hasTable('stock_movements') && 
            Schema::hasColumn('stock_movements', 'performed_by')) {
            
            DB::statement('
                UPDATE stock_movements
                SET performed_by = created_by
                WHERE performed_by IS NULL AND created_by IS NOT NULL
            ');
            
            echo "Migrated created_by to performed_by\n";
        }
        
        // Convert legacy type values to new format
        if (Schema::hasTable('stock_movements')) {
            DB::statement('
                UPDATE stock_movements
                SET type = "DEDUCTION"
                WHERE type = "OUT"
            ');
            
            DB::statement('
                UPDATE stock_movements
                SET type = "PURCHASE"
                WHERE type = "IN"
            ');
            
            echo "Converted legacy type values (IN→PURCHASE, OUT→DEDUCTION)\n";
        }
        
        // Add reference for orders
        if (Schema::hasTable('stock_movements') && 
            Schema::hasColumn('stock_movements', 'reference')) {
            
            DB::statement('
                UPDATE stock_movements
                SET reference = CONCAT("order_", order_id)
                WHERE order_id IS NOT NULL AND reference IS NULL
            ');
            
            echo "Added references for order-related movements\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse data migration
        echo "Data migration cannot be reversed automatically\n";
    }
};