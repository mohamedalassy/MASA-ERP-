<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiSalesCatalogProfile;
use App\Models\AiSalesCompany;
use App\Models\AiSalesDiscoveryRun;
use App\Services\AiSales\CatalogIntelligenceService;
use App\Services\AiSales\CompanyEnrichmentService;
use App\Services\AiSales\DiscoveryEngine;
use App\Services\AiSales\ScoringEngine;
use Illuminate\Http\Request;
use Throwable;

class AiSalesIntelligenceController extends Controller
{
    public function syncCatalog(CatalogIntelligenceService $svc)
    {
        return response()->json([
            'success' => true,
            'result' => $svc->syncProducts(),
        ]);
    }

    public function catalogProfiles()
    {
        return response()->json(
            AiSalesCatalogProfile::with('product')
                ->where('is_active', true)
                ->get()
        );
    }

    public function storeCatalogProfile(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',

            'type' =>
                'required|in:product,service,subscription,project,solution',

            'product_id' => 'nullable|exists:products,id',
            'description' => 'nullable|string',
            'target_industries' => 'nullable|array',
            'target_company_sizes' => 'nullable|array',
            'keywords' => 'nullable|array',
            'buying_signals' => 'nullable|array',
            'pain_points' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        return response()->json(
            AiSalesCatalogProfile::create($data),
            201
        );
    }

    public function discoveryRuns()
    {
        return response()->json(
            AiSalesDiscoveryRun::latest()->paginate(25)
        );
    }

    /**
     * Start real external market discovery.
     */
    public function runDiscovery(
        Request $request,
        DiscoveryEngine $engine
    ) {
        $data = $request->validate([
            'catalog_profile_ids' => 'required|array|min:1',

            'catalog_profile_ids.*' =>
                'integer|exists:ai_sales_catalog_profiles,id',

            'country' => 'nullable|string|max:120',
            'region' => 'required|string|max:120',
            'city' => 'nullable|string|max:120',

            'signals' => 'nullable|array',

            'signals.*' => 'string|in:' .
                'new_business,' .
                'expansion,' .
                'new_branch,' .
                'hiring,' .
                'projects,' .
                'funding,' .
                'tender,' .
                'procurement',
        ]);

        $data['country'] =
            $data['country'] ?? 'Saudi Arabia';

        try {
            $run = $engine->run($data);

            return response()->json([
                'success' => true,

                'message' =>
                    'AI Sales discovery completed successfully.',

                'run' => $run,
            ], 201);

        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Discovery failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Existing ingest endpoint.
     */
    public function ingest(
        Request $request,
        DiscoveryEngine $engine
    ) {
        $data = $request->validate([
            'companies' => 'required|array|min:1|max:500',
            'companies.*.name' => 'required|string|max:255',
            'companies.*.website' => 'nullable|string|max:255',
            'companies.*.industry' => 'nullable|string|max:255',
            'companies.*.country' => 'nullable|string|max:120',
            'companies.*.region' => 'nullable|string|max:120',
            'companies.*.city' => 'nullable|string|max:120',
            'companies.*.company_size' => 'nullable|string|max:100',
            'companies.*.source' => 'nullable|string|max:120',
            'companies.*.source_url' => 'nullable|string|max:2048',

            'companies.*.data_confidence' =>
                'nullable|integer|min:0|max:100',

            'criteria' => 'nullable|array',
        ]);

        return response()->json(
            $engine->ingest(
                $data['companies'],
                $data['criteria'] ?? []
            ),
            201
        );
    }

    public function enrich(
        Request $request,
        AiSalesCompany $company,
        CompanyEnrichmentService $svc
    ) {
        $data = $request->validate([
            'industry' => 'nullable|string|max:255',
            'website' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:120',
            'region' => 'nullable|string|max:120',
            'city' => 'nullable|string|max:120',
            'company_size' => 'nullable|string|max:100',

            'data_confidence' =>
                'nullable|integer|min:0|max:100',

            'enrichment' => 'nullable|array',
        ]);

        return response()->json(
            $svc->merge($company, $data)
        );
    }

    public function score(
        AiSalesCompany $company,
        ScoringEngine $engine
    ) {
        $score = $engine->score($company);

        $record = $company->scores()->create([
            'fit_score' => $score['fit'],
            'intent_score' => $score['intent'],
            'timing_score' => $score['timing'],
            'confidence_score' => $score['confidence'],
            'overall_score' => $score['overall'],
            'reasons' => $score['reasons'],
            'model_version' => 'rules-v1',
            'scored_at' => now(),
        ]);

        return response()->json($record, 201);
    }

    public function scoreAll(ScoringEngine $engine)
    {
        $count = 0;

        AiSalesCompany::chunkById(
            100,
            function ($companies) use ($engine, &$count) {
                foreach ($companies as $company) {
                    $score = $engine->score($company);

                    $company->scores()->create([
                        'fit_score' => $score['fit'],
                        'intent_score' => $score['intent'],
                        'timing_score' => $score['timing'],
                        'confidence_score' => $score['confidence'],
                        'overall_score' => $score['overall'],
                        'reasons' => $score['reasons'],
                        'model_version' => 'rules-v1',
                        'scored_at' => now(),
                    ]);

                    $count++;
                }
            }
        );

        return response()->json([
            'success' => true,
            'scored' => $count,
        ]);
    }
}