<?php
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema;
return new class extends Migration { public function up():void {
 Schema::table('ai_sales_leads',function(Blueprint $t){$t->unsignedTinyInteger('qualification_score')->default(0)->after('priority');$t->json('qualification_reasons')->nullable()->after('qualification_score');$t->timestamp('last_qualified_at')->nullable();});
 Schema::table('ai_sales_opportunities',function(Blueprint $t){$t->unsignedTinyInteger('health_score')->default(0)->after('probability');$t->string('risk_level')->default('medium')->after('health_score');$t->json('risk_reasons')->nullable();$t->json('recommended_items')->nullable();$t->timestamp('last_analyzed_at')->nullable();});
 } public function down():void {
 Schema::table('ai_sales_leads',function(Blueprint $t){$t->dropColumn(['qualification_score','qualification_reasons','last_qualified_at']);});
 Schema::table('ai_sales_opportunities',function(Blueprint $t){$t->dropColumn(['health_score','risk_level','risk_reasons','recommended_items','last_analyzed_at']);});
 }};