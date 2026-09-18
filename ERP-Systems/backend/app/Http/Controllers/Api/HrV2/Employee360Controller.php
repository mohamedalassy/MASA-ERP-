<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller; use App\Models\HrEmployee;
class Employee360Controller extends Controller { public function show(HrEmployee $hrEmployee){return response()->json($hrEmployee->load(['branch','department','jobTitle','shift','manager','contracts','documents']));} }