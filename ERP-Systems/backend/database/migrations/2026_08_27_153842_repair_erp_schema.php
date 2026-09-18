<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | PROJECT NOTES
        |--------------------------------------------------------------------------
        */
        Schema::table('project_notes', function (Blueprint $table) {
            if (!Schema::hasColumn('project_notes', 'project_id')) {
                $table->foreignId('project_id')
                    ->after('id')
                    ->constrained('projects')
                    ->cascadeOnDelete();
            }

            if (!Schema::hasColumn('project_notes', 'user_id')) {
                $table->foreignId('user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('project_notes', 'note')) {
                $table->text('note')->nullable();
            }

            if (!Schema::hasColumn('project_notes', 'is_internal')) {
                $table->boolean('is_internal')->default(true);
            }
        });

        /*
        |--------------------------------------------------------------------------
        | PROJECT ATTACHMENTS
        |--------------------------------------------------------------------------
        */
        Schema::table('project_attachments', function (Blueprint $table) {
            if (!Schema::hasColumn('project_attachments', 'project_id')) {
                $table->foreignId('project_id')
                    ->after('id')
                    ->constrained('projects')
                    ->cascadeOnDelete();
            }

            if (!Schema::hasColumn('project_attachments', 'uploaded_by')) {
                $table->foreignId('uploaded_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('project_attachments', 'file_name')) {
                $table->string('file_name')->nullable();
            }

            if (!Schema::hasColumn('project_attachments', 'original_name')) {
                $table->string('original_name')->nullable();
            }

            if (!Schema::hasColumn('project_attachments', 'file_path')) {
                $table->string('file_path')->nullable();
            }

            if (!Schema::hasColumn('project_attachments', 'file_type')) {
                $table->string('file_type')->nullable();
            }

            if (!Schema::hasColumn('project_attachments', 'file_size')) {
                $table->unsignedBigInteger('file_size')->nullable();
            }

            if (!Schema::hasColumn('project_attachments', 'category')) {
                $table->string('category')->default('general');
            }

            if (!Schema::hasColumn('project_attachments', 'description')) {
                $table->text('description')->nullable();
            }

            if (!Schema::hasColumn('project_attachments', 'is_internal')) {
                $table->boolean('is_internal')->default(true);
            }
        });

        /*
        |--------------------------------------------------------------------------
        | PROJECT QUOTATIONS
        |--------------------------------------------------------------------------
        */
        Schema::table('project_quotations', function (Blueprint $table) {
            if (!Schema::hasColumn('project_quotations', 'project_id')) {
                $table->foreignId('project_id')
                    ->after('id')
                    ->constrained('projects')
                    ->cascadeOnDelete();
            }

            if (!Schema::hasColumn('project_quotations', 'quotation_number')) {
                $table->string('quotation_number')->nullable()->unique();
            }

            if (!Schema::hasColumn('project_quotations', 'status')) {
                $table->string('status')->default('draft');
            }

            if (!Schema::hasColumn('project_quotations', 'subtotal')) {
                $table->decimal('subtotal', 15, 2)->default(0);
            }

            if (!Schema::hasColumn('project_quotations', 'discount')) {
                $table->decimal('discount', 15, 2)->default(0);
            }

            if (!Schema::hasColumn('project_quotations', 'tax')) {
                $table->decimal('tax', 15, 2)->default(0);
            }

            if (!Schema::hasColumn('project_quotations', 'total')) {
                $table->decimal('total', 15, 2)->default(0);
            }

            if (!Schema::hasColumn('project_quotations', 'version')) {
                $table->unsignedInteger('version')->default(1);
            }

            if (!Schema::hasColumn('project_quotations', 'valid_until')) {
                $table->date('valid_until')->nullable();
            }

            if (!Schema::hasColumn('project_quotations', 'created_by')) {
                $table->foreignId('created_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('project_quotations', 'approved_by')) {
                $table->foreignId('approved_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('project_quotations', 'approved_at')) {
                $table->timestamp('approved_at')->nullable();
            }

            if (!Schema::hasColumn('project_quotations', 'notes')) {
                $table->text('notes')->nullable();
            }
        });

        /*
        |--------------------------------------------------------------------------
        | FINANCE
        |--------------------------------------------------------------------------
        */
        Schema::table('project_financial_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('project_financial_transactions', 'project_id')) {
                $table->foreignId('project_id')
                    ->after('id')
                    ->constrained('projects')
                    ->cascadeOnDelete();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'type')) {
                $table->string('type')->nullable();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'direction')) {
                $table->string('direction')->nullable();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'reference_number')) {
                $table->string('reference_number')->nullable();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'title')) {
                $table->string('title')->nullable();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'description')) {
                $table->text('description')->nullable();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'subtotal')) {
                $table->decimal('subtotal', 15, 2)->default(0);
            }

            if (!Schema::hasColumn('project_financial_transactions', 'tax')) {
                $table->decimal('tax', 15, 2)->default(0);
            }

            if (!Schema::hasColumn('project_financial_transactions', 'total')) {
                $table->decimal('total', 15, 2)->default(0);
            }

            if (!Schema::hasColumn('project_financial_transactions', 'paid_amount')) {
                $table->decimal('paid_amount', 15, 2)->default(0);
            }

            if (!Schema::hasColumn('project_financial_transactions', 'remaining_amount')) {
                $table->decimal('remaining_amount', 15, 2)->default(0);
            }

            if (!Schema::hasColumn('project_financial_transactions', 'status')) {
                $table->string('status')->default('pending');
            }

            if (!Schema::hasColumn('project_financial_transactions', 'payment_method')) {
                $table->string('payment_method')->nullable();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'transaction_date')) {
                $table->date('transaction_date')->nullable();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'due_date')) {
                $table->date('due_date')->nullable();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'paid_at')) {
                $table->timestamp('paid_at')->nullable();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'quotation_id')) {
                $table->foreignId('quotation_id')
                    ->nullable()
                    ->constrained('project_quotations')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'purchase_order_id')) {
                $table->foreignId('purchase_order_id')
                    ->nullable()
                    ->constrained('purchase_orders')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'created_by')) {
                $table->foreignId('created_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'approved_by')) {
                $table->foreignId('approved_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'approved_at')) {
                $table->timestamp('approved_at')->nullable();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'notes')) {
                $table->text('notes')->nullable();
            }
        });
    }

    public function down(): void
    {
        // Repair migration - no automatic destructive rollback.
    }
};