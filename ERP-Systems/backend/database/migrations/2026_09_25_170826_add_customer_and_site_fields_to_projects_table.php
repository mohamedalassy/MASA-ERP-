<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | Customer Snapshot
            |--------------------------------------------------------------------------
            |
            | customer_id هو الرابط الأساسي مع Customer.
            | الحقول التالية Snapshot لبيانات العميل وقت إنشاء المشروع.
            |
            */

            if (!Schema::hasColumn('projects', 'customer_name_en')) {
                $table->string('customer_name_en')
                    ->nullable()
                    ->after('customer_name');
            }

            if (!Schema::hasColumn('projects', 'customer_industry')) {
                $table->string('customer_industry')
                    ->nullable()
                    ->after('customer_code');
            }

            if (!Schema::hasColumn('projects', 'customer_website')) {
                $table->string('customer_website')
                    ->nullable()
                    ->after('email');
            }

            if (!Schema::hasColumn('projects', 'customer_city')) {
                $table->string('customer_city')
                    ->nullable()
                    ->after('address');
            }

            if (!Schema::hasColumn('projects', 'customer_region')) {
                $table->string('customer_region')
                    ->nullable()
                    ->after('customer_city');
            }

            if (!Schema::hasColumn('projects', 'customer_country')) {
                $table->string('customer_country')
                    ->nullable()
                    ->after('customer_region');
            }

            /*
            |--------------------------------------------------------------------------
            | Project Customer Contact
            |--------------------------------------------------------------------------
            */

            if (!Schema::hasColumn('projects', 'customer_contact_id')) {
                $table->foreignId('customer_contact_id')
                    ->nullable()
                    ->after('customer_id')
                    ->constrained('customer_contacts')
                    ->nullOnDelete();
            }

            /*
            |--------------------------------------------------------------------------
            | Customer Contact Snapshot
            |--------------------------------------------------------------------------
            */

            if (!Schema::hasColumn('projects', 'contact_name')) {
                $table->string('contact_name')
                    ->nullable();
            }

            if (!Schema::hasColumn('projects', 'contact_job_title')) {
                $table->string('contact_job_title')
                    ->nullable();
            }

            if (!Schema::hasColumn('projects', 'contact_department')) {
                $table->string('contact_department')
                    ->nullable();
            }

            if (!Schema::hasColumn('projects', 'contact_phone')) {
                $table->string('contact_phone', 100)
                    ->nullable();
            }

            if (!Schema::hasColumn('projects', 'contact_mobile')) {
                $table->string('contact_mobile', 100)
                    ->nullable();
            }

            if (!Schema::hasColumn('projects', 'contact_email')) {
                $table->string('contact_email')
                    ->nullable();
            }

            /*
            |--------------------------------------------------------------------------
            | Project Site
            |--------------------------------------------------------------------------
            */

            if (!Schema::hasColumn('projects', 'site_name')) {
                $table->string('site_name')
                    ->nullable();
            }

            if (!Schema::hasColumn('projects', 'site_address')) {
                $table->text('site_address')
                    ->nullable();
            }

            if (!Schema::hasColumn('projects', 'site_city')) {
                $table->string('site_city')
                    ->nullable();
            }

            if (!Schema::hasColumn('projects', 'site_region')) {
                $table->string('site_region')
                    ->nullable();
            }

            /*
            |--------------------------------------------------------------------------
            | Project Geofence
            |--------------------------------------------------------------------------
            |
            | تستخدم لاحقًا للتحقق من حضور الموظف من موقع المشروع.
            |
            */

            if (!Schema::hasColumn('projects', 'latitude')) {
                $table->decimal(
                    'latitude',
                    10,
                    7
                )->nullable();
            }

            if (!Schema::hasColumn('projects', 'longitude')) {
                $table->decimal(
                    'longitude',
                    10,
                    7
                )->nullable();
            }

            if (!Schema::hasColumn('projects', 'attendance_radius')) {
                $table->unsignedInteger(
                    'attendance_radius'
                )
                    ->default(100);
            }
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {

            if (
                Schema::hasColumn(
                    'projects',
                    'customer_contact_id'
                )
            ) {
                $table->dropConstrainedForeignId(
                    'customer_contact_id'
                );
            }

            $columns = [
                'customer_name_en',
                'customer_industry',
                'customer_website',

                'customer_city',
                'customer_region',
                'customer_country',

                'contact_name',
                'contact_job_title',
                'contact_department',
                'contact_phone',
                'contact_mobile',
                'contact_email',

                'site_name',
                'site_address',
                'site_city',
                'site_region',

                'latitude',
                'longitude',
                'attendance_radius',
            ];

            foreach ($columns as $column) {
                if (
                    Schema::hasColumn(
                        'projects',
                        $column
                    )
                ) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};