<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('stock_movements')) {
            
            // First, modify the type column to accept new values
            DB::statement("ALTER TABLE stock_movements MODIFY COLUMN type ENUM('DEDUCTION', 'RESTORATION', 'ADJUSTMENT', 'PURCHASE', 'IN', 'OUT') NOT NULL");
            
            // Now update the values
            DB::statement("UPDATE stock_movements SET type = 'DEDUCTION' WHERE type = 'OUT'");
            DB::statement("UPDATE stock_movements SET type = 'PURCHASE' WHERE type = 'IN'");
            
            echo "Successfully converted type values: OUT→DEDUCTION, IN→PURCHASE\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('stock_movements')) {
            // Revert type values back
            DB::statement("UPDATE stock_movements SET type = 'OUT' WHERE type = 'DEDUCTION'");
            DB::statement("UPDATE stock_movements SET type = 'IN' WHERE type = 'PURCHASE'");
            
            // Revert the ENUM definition
            DB::statement("ALTER TABLE stock_movements MODIFY COLUMN type ENUM('IN', 'OUT') NOT NULL");
        }
    }
};