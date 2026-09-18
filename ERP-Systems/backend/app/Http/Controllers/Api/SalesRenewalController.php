<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesRenewal;
use App\Services\Sales\SalesRenewalService;
use Illuminate\Http\Request;

class SalesRenewalController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesRenewal::query()
            ->with([
                'branch:id,code,name',
                'customer:id,code,name',
                'contract:id,contract_number,type,status,end_date,value',
                'opportunity:id,opportunity_number,name,stage,status',
                'owner:id,name',
            ])
            ->latest('expiry_date');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return response()->json([
            'success' => true,
            'data' => $query->limit(250)->get(),
        ]);
    }

    public function generate(Request $request, SalesRenewalService $service)
    {
        $rows = $service->generate(
            $request->filled('branch_id')
                ? $request->integer('branch_id')
                : null
        );

        return response()->json([
            'success' => true,
            'count' => $rows->count(),
            'data' => $rows,
        ]);
    }

    public function convert(
        Request $request,
        SalesRenewal $renewal,
        SalesRenewalService $service
    ) {
        $opportunity = $service->convertToOpportunity(
            $renewal,
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تحويل التجديد إلى Opportunity.',
            'data' => $opportunity,
        ], 201);
    }
}
