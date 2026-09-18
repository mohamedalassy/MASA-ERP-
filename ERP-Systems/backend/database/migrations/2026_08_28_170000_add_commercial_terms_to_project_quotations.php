<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_quotations', function (Blueprint $table) {
            if (!Schema::hasColumn('project_quotations', 'commercial_terms')) {
                $table->json('commercial_terms')
                    ->nullable()
                    ->after('extra_costs');
            }
        });
    }

    public function down(): void
    {
        Schema::table('project_quotations', function (Blueprint $table) {
            if (Schema::hasColumn('project_quotations', 'commercial_terms')) {
                $table->dropColumn('commercial_terms');
            }
        });
    }
};
