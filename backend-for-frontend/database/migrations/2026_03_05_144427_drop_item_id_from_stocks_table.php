<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stocks', function (Blueprint $table) {

            // drop foreign key first
            $table->dropForeign(['item_id']);

            // then drop column
            $table->dropColumn('item_id');
        });
    }

    public function down(): void
    {
        Schema::table('stocks', function (Blueprint $table) {

            $table->unsignedBigInteger('item_id')->nullable();

            $table->foreign('item_id')
                ->references('id')
                ->on('stock_items')
                ->cascadeOnDelete();
        });
    }
};
