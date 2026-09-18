<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_quotations', function (Blueprint $table) {
            $table->foreignId('parent_quotation_id')
                ->nullable()
                ->after('version')
                ->constrained('project_quotations')
                ->nullOnDelete();

            $table->text('revision_reason')
                ->nullable()
                ->after('parent_quotation_id');
        });
    }

    public function down(): void
    {
        Schema::table('project_quotations', function (Blueprint $table) {
            $table->dropForeign(['parent_quotation_id']);
            $table->dropColumn([
                'parent_quotation_id',
                'revision_reason',
            ]);
        });
    }
};
