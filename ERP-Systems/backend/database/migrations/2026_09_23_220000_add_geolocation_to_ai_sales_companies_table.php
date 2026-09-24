<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_sales_companies', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('city');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->timestamp('geocoded_at')->nullable()->after('longitude');
            $table->string('geocoding_source', 60)->nullable()->after('geocoded_at');

            $table->index(['latitude', 'longitude'], 'ai_sales_companies_geo_idx');
        });
    }

    public function down(): void
    {
        Schema::table('ai_sales_companies', function (Blueprint $table) {
            $table->dropIndex('ai_sales_companies_geo_idx');
            $table->dropColumn([
                'latitude',
                'longitude',
                'geocoded_at',
                'geocoding_source',
            ]);
        });
    }
};
