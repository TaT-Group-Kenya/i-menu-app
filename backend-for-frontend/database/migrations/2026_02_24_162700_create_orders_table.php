<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
 Schema::create('orders', function (Blueprint $table) {
    $table->id();

    $table->string('order_number')->unique();
    $table->string('etr_number')->nullable()->unique();

    // Business Status
    $table->enum('status', [
        'PENDING',
        'PAID',
        'CANCELLED'
    ])->default('PENDING');

    // Fiscal Status (ETR)
    $table->enum('fiscal_status', [
        'NOT_SENT',
        'SUCCESS',
        'FAILED'
    ])->default('NOT_SENT');

    $table->string('cu_serial')->nullable();
    $table->string('qr_code')->nullable();
    $table->timestamp('fiscal_datetime')->nullable();

    // Financials
    $table->decimal('cost', 12, 2);
    $table->decimal('tax', 12, 2);
    $table->decimal('discounts', 12, 2)->default(0);
    $table->decimal('total', 12, 2);

    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};