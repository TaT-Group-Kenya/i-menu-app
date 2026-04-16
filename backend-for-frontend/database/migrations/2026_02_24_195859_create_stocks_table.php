<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
Schema::create('stocks', function (Blueprint $table) {
    $table->id();

    $table->foreignId('item_id')
        ->constrained('stock_items')
        ->cascadeOnDelete();

    $table->decimal('stock', 12, 2);
    $table->integer('stock_warning_count')->default(10);
    $table->integer('stock_duration_forecast_day')->nullable();

    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

    $table->timestamps();
    $table->softDeletes();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock');
    }
};