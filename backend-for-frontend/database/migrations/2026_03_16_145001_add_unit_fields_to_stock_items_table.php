<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_items', function (Blueprint $table) {
            $table->decimal('unit_quantity', 10, 4)->default(1)->after('unit_of_measure');
            $table->decimal('unit_cost', 10, 4)->default(0)->after('unit_quantity');
            $table->string('currency', 3)->default('KES')->after('unit_cost');
        });
    }

    public function down(): void
    {
        Schema::table('stock_items', function (Blueprint $table) {
            $table->dropColumn(['unit_quantity', 'unit_cost', 'currency']);
        });
    }
};