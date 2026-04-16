<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    Schema::table('menu_ingredients', function (Blueprint $table) {
        $table->dropColumn('stock_item_measure');

        $table->decimal('quantity', 10, 2);
        $table->string('unit');
    });
}

};
