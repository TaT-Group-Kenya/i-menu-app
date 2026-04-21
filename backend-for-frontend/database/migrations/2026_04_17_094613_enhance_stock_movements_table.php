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
            Schema::table('stock_movements', function (Blueprint $table) {
                
                // Add new columns if they don't exist
                if (!Schema::hasColumn('stock_movements', 'stock_item_id')) {
                    $table->unsignedBigInteger('stock_item_id')->nullable()->after('stock_id');
                }
                
                if (!Schema::hasColumn('stock_movements', 'old_quantity')) {
                    $table->decimal('old_quantity', 12, 4)->nullable()->after('quantity');
                }
                
                if (!Schema::hasColumn('stock_movements', 'new_quantity')) {
                    $table->decimal('new_quantity', 12, 4)->nullable()->after('old_quantity');
                }
                
                if (!Schema::hasColumn('stock_movements', 'performed_by')) {
                    $table->unsignedBigInteger('performed_by')->nullable()->after('created_by');
                }
                
                if (!Schema::hasColumn('stock_movements', 'reference')) {
                    $table->string('reference')->nullable()->after('reason');
                }
                
                if (!Schema::hasColumn('stock_movements', 'notes')) {
                    $table->text('notes')->nullable()->after('reference');
                }
                
                if (!Schema::hasColumn('stock_movements', 'ip_address')) {
                    $table->string('ip_address')->nullable()->after('notes');
                }
                
                if (!Schema::hasColumn('stock_movements', 'user_agent')) {
                    $table->string('user_agent')->nullable()->after('ip_address');
                }
                
                if (!Schema::hasColumn('stock_movements', 'deleted_at')) {
                    $table->softDeletes();
                }
                
                // Add indexes for performance
                if (!Schema::hasIndex('stock_movements', ['stock_item_id', 'created_at'])) {
                    $table->index(['stock_item_id', 'created_at']);
                }
                
                if (!Schema::hasIndex('stock_movements', ['performed_by'])) {
                    $table->index('performed_by');
                }
                
                if (!Schema::hasIndex('stock_movements', ['reference'])) {
                    $table->index('reference');
                }
                
                if (!Schema::hasIndex('stock_movements', ['deleted_at'])) {
                    $table->index('deleted_at');
                }
                
                if (!Schema::hasIndex('stock_movements', ['created_at'])) {
                    $table->index('created_at');
                }
                
                // Add composite index for common queries
                if (!Schema::hasIndex('stock_movements', ['stock_id', 'type', 'created_at'])) {
                    $table->index(['stock_id', 'type', 'created_at']);
                }
                
                // Add foreign keys if they don't exist
                $foreignKeys = $this->getForeignKeys('stock_movements');
                
                if (!in_array('stock_movements_stock_item_id_foreign', $foreignKeys)) {
                    $table->foreign('stock_item_id')->references('id')->on('stock_items')->nullOnDelete();
                }
                
                if (!in_array('stock_movements_performed_by_foreign', $foreignKeys)) {
                    $table->foreign('performed_by')->references('id')->on('users')->nullOnDelete();
                }
            });
        }
    }
    
    /**
     * Get foreign keys for a table.
     */
    private function getForeignKeys($table)
    {
        $conn = Schema::getConnection();
        $databaseName = $conn->getDatabaseName();
        $tableName = $table;
        
        $result = $conn->select("
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            AND REFERENCED_TABLE_NAME IS NOT NULL
        ", [$databaseName, $tableName]);
        
        return array_column($result, 'CONSTRAINT_NAME');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('stock_movements')) {
            Schema::table('stock_movements', function (Blueprint $table) {
                // Drop foreign keys first
                $table->dropForeign(['stock_item_id']);
                $table->dropForeign(['performed_by']);
                
                // Drop columns
                $columns = ['stock_item_id', 'old_quantity', 'new_quantity', 'performed_by', 
                           'reference', 'notes', 'ip_address', 'user_agent', 'deleted_at'];
                
                foreach ($columns as $column) {
                    if (Schema::hasColumn('stock_movements', $column)) {
                        $table->dropColumn($column);
                    }
                }
                
                // Drop indexes
                $table->dropIndex(['stock_item_id', 'created_at']);
                $table->dropIndex(['performed_by']);
                $table->dropIndex(['reference']);
                $table->dropIndex(['deleted_at']);
                $table->dropIndex(['created_at']);
                $table->dropIndex(['stock_id', 'type', 'created_at']);
            });
        }
    }
};