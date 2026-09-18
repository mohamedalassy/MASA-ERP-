<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SalesAI\SalesExecutiveCommandService;
use Illuminate\Http\Request;

class SalesExecutiveCommandController extends Controller
{
    public function summary(
        Request $request,
        SalesExecutiveCommandService $service
    ) {
        return response()->json([
            'success' => true,
            'data' => $service->summary(
                $request->filled('branch_id')
                    ? $request->integer('branch_id')
                    : null
            ),
        ]);
    }
}
