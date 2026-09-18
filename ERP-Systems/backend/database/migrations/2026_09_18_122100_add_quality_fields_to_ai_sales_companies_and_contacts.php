<?php
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema;
return new class extends Migration {public function up():void{
Schema::table('ai_sales_companies',function(Blueprint $t){$t->unsignedTinyInteger('quality_score')->default(0)->index();$t->json('quality_issues')->nullable();$t->string('dedupe_key')->nullable()->index();});
Schema::table('ai_sales_contacts',function(Blueprint $t){$t->unsignedTinyInteger('quality_score')->default(0);$t->json('quality_issues')->nullable();});
}public function down():void{
Schema::table('ai_sales_companies',function(Blueprint $t){$t->dropColumn(['quality_score','quality_issues','dedupe_key']);});
Schema::table('ai_sales_contacts',function(Blueprint $t){$t->dropColumn(['quality_score','quality_issues']);});
}};