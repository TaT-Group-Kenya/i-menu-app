<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menus', function (Blueprint $table) {
            $table->id();

            $table->string('name')->index();
            $table->text('description')->nullable();
            $table->decimal('tax_rate', 5, 2)->default(0.00);
            $table->enum('tax_type', ['VAT', 'ZERO', 'EXEMPT'])->default('VAT');

            $table->decimal('price', 12, 2);

            // Track who created/updated the menu
            $table->foreignId('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->foreignId('updated_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamps(); // handles created_at & updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menus');
    }
};