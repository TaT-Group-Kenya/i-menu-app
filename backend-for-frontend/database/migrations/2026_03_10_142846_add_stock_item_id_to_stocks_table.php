<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stocks', function (Blueprint $table) {

            $table->foreignId('stock_item_id')
                ->after('id')
                ->constrained('stock_items')
                ->cascadeOnDelete();

        });
    }

    public function down(): void
    {
        Schema::table('stocks', function (Blueprint $table) {

            $table->dropForeign(['stock_item_id']);
            $table->dropColumn('stock_item_id');

        });
    }
};