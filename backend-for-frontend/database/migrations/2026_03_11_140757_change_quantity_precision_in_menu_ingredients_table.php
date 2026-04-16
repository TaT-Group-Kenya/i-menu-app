<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_ingredients', function (Blueprint $table) {
            $table->decimal('quantity', 10, 4)->change();
        });
    }

    public function down(): void
    {
        Schema::table('menu_ingredients', function (Blueprint $table) {
            $table->decimal('quantity', 8, 2)->change(); // revert to previous precision
        });
    }
};