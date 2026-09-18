<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();

            // المشروع
            $table->foreignId('project_id')
                ->constrained('projects')
                ->cascadeOnDelete();

            // المورد
            $table->foreignId('supplier_id')
                ->nullable()
                ->constrained('suppliers')
                ->nullOnDelete();

            // رقم أمر الشراء
            $table->string('po_number')->unique();

            // الحالة
            $table->string('status')->default('draft');

            /*
                draft
                pending
                approved
                ordered
                partially_received
                received
                cancelled
            */

            // القيم المالية
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('tax', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);

            // التواريخ
            $table->date('order_date')->nullable();
            $table->date('expected_delivery_date')->nullable();
            $table->date('actual_delivery_date')->nullable();

            // شروط الدفع
            $table->string('payment_terms')->nullable();

            // من أنشأ أمر الشراء
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // من اعتمد أمر الشراء
            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('approved_at')->nullable();

            // ملاحظات
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index('project_id');
            $table->index('supplier_id');
            $table->index('status');
            $table->index('po_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};