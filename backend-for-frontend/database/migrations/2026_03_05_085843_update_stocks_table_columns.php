<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stocks', function (Blueprint $table) {

            // rename quantity -> stock
            $table->renameColumn('quantity', 'stock');

            // add quantity column for stock adjustments
            $table->decimal('quantity', 10, 2)->default(0)->after('stock');
        });
    }

    public function down(): void
    {
        Schema::table('stocks', function (Blueprint $table) {

            $table->renameColumn('stock', 'quantity');

            $table->dropColumn('quantity');
        });
    }
};
