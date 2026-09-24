<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiSalesActivity;
use App\Models\AiSalesAiDraft;
use App\Models\AiSalesCompany;
use App\Models\AiSalesLead;
use App\Models\AiSalesOpportunity;
use App\Models\AiSalesSignal;
use App\Models\AiSalesTerritory;
use App\Services\AiSales\CommandCenterService;
use App\Services\AiSales\MessageComposerService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AiSalesAdvancedController extends Controller
{
    public function territories()
    {
        $territories = AiSalesTerritory::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $companies = AiSalesCompany::query()
            ->with([
                'latestScore',
                'leads:id,company_id,status,priority,qualification_score',
                'opportunities:id,company_id,stage,value,currency,probability',
                'signals:id,company_id,type,strength,confidence,detected_at',
            ])
            ->get();

        $territoryRows = $territories
            ->map(function (AiSalesTerritory $territory) use ($companies) {
                $matchedCompanies = $companies
                    ->filter(fn (AiSalesCompany $company) =>
                        $this->companyMatchesTerritory($company, $territory))
                    ->values();

                return $this->buildTerritoryRow($territory, $matchedCompanies);
            })
            ->values();

        $assignedCompanyIds = $territories
            ->flatMap(function (AiSalesTerritory $territory) use ($companies) {
                return $companies
                    ->filter(fn (AiSalesCompany $company) =>
                        $this->companyMatchesTerritory($company, $territory))
                    ->pluck('id');
            })
            ->unique()
            ->values();

        $unassignedCompanies = $companies
            ->whereNotIn('id', $assignedCompanyIds)
            ->values();

        $allOpportunities = $companies->flatMap(fn ($company) => $company->opportunities);
        $allLeads = $companies->flatMap(fn ($company) => $company->leads);
        $allSignals = $companies->flatMap(fn ($company) => $company->signals);

        $pipelineValue = $allOpportunities
            ->sum(fn ($opportunity) => (float) $opportunity->value);

        $weightedValue = $allOpportunities
            ->sum(fn ($opportunity) =>
                (float) $opportunity->value *
                ((float) $opportunity->probability / 100));

        $scoredCompanies = $companies->filter(fn ($company) => $company->latestScore);

        return response()->json([
            'data' => $territoryRows,
            'summary' => [
                'territories' => $territories->count(),
                'companies' => $companies->count(),
                'leads' => $allLeads->count(),
                'opportunities' => $allOpportunities->count(),
                'signals' => $allSignals->count(),
                'pipeline_value' => round($pipelineValue, 2),
                'weighted_value' => round($weightedValue, 2),
                'average_ai_score' => $scoredCompanies->count()
                    ? round($scoredCompanies->avg(
                        fn ($company) => (float) $company->latestScore->overall_score
                    ), 1)
                    : 0,
            ],
            'unassigned' => [
                'companies' => $unassignedCompanies->count(),
                'leads' => $unassignedCompanies->flatMap(fn ($company) => $company->leads)->count(),
                'opportunities' => $unassignedCompanies->flatMap(fn ($company) => $company->opportunities)->count(),
                'signals' => $unassignedCompanies->flatMap(fn ($company) => $company->signals)->count(),
                'cities' => $this->buildCityRows($unassignedCompanies),
            ],
            'meta' => [
                'generated_at' => now()->toISOString(),
                'matching' => 'country_region_city',
            ],
        ]);
    }

    public function storeTerritory(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'country' => 'nullable|string|max:120',
            'region' => 'nullable|string|max:120',
            'cities' => 'nullable|array',
            'cities.*' => 'nullable|string|max:120',
            'industries' => 'nullable|array',
            'industries.*' => 'nullable|string|max:160',
            'owner_id' => 'nullable|exists:users,id',
            'target_value' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        return response()->json(AiSalesTerritory::create($data), 201);
    }

    public function updateTerritory(Request $request, AiSalesTerritory $territory)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'country' => 'nullable|string|max:120',
            'region' => 'nullable|string|max:120',
            'cities' => 'nullable|array',
            'cities.*' => 'nullable|string|max:120',
            'industries' => 'nullable|array',
            'industries.*' => 'nullable|string|max:160',
            'owner_id' => 'nullable|exists:users,id',
            'target_value' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $territory->update($data);

        return response()->json([
            'message' => 'Territory updated successfully.',
            'data' => $territory->fresh(),
        ]);
    }

    public function activities(Request $request)
    {
        $query = AiSalesActivity::query();

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->company_id);
        }

        return response()->json($query->latest()->paginate(50));
    }

    public function compose(
        Request $request,
        AiSalesCompany $company,
        MessageComposerService $service
    ) {
        $data = $request->validate([
            'channel' => 'nullable|in:email,whatsapp,sms,other',
            'purpose' => 'nullable|string|max:100',
            'tone' => 'nullable|in:professional,concise,consultative,friendly',
            'subject' => 'nullable|string|max:255',
        ]);

        return response()->json($service->compose($company, $data), 201);
    }

    public function drafts()
    {
        return response()->json(
            AiSalesAiDraft::with('company')->latest()->paginate(25)
        );
    }

    public function approveDraft(AiSalesAiDraft $draft)
    {
        $draft->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return response()->json($draft);
    }

    public function command(Request $request, CommandCenterService $service)
    {
        $data = $request->validate([
            'command' => 'required|string|max:1000',
        ]);

        return response()->json($service->execute($data['command']));
    }

    public function analytics()
    {
        return response()->json([
            'funnel' => [
                'companies' => AiSalesCompany::count(),
                'leads' => AiSalesLead::count(),
                'opportunities' => AiSalesOpportunity::count(),
                'won' => AiSalesOpportunity::where('stage', 'won')->count(),
            ],
            'pipeline_by_stage' =>
                AiSalesOpportunity::select(
                    'stage',
                    DB::raw('COUNT(*) count'),
                    DB::raw('SUM(value) value')
                )->groupBy('stage')->get(),
            'companies_by_region' =>
                AiSalesCompany::select(
                    'region',
                    DB::raw('COUNT(*) count')
                )->whereNotNull('region')
                    ->groupBy('region')
                    ->orderByDesc('count')
                    ->get(),
            'signals_by_type' =>
                AiSalesSignal::select(
                    'type',
                    DB::raw('COUNT(*) count')
                )->groupBy('type')
                    ->orderByDesc('count')
                    ->get(),
            'monthly_discovery' =>
                AiSalesCompany::selectRaw(
                    "DATE_FORMAT(discovered_at,'%Y-%m') month, COUNT(*) count"
                )->whereNotNull('discovered_at')
                    ->groupBy('month')
                    ->orderBy('month')
                    ->get(),
        ]);
    }

    private function companyMatchesTerritory(
        AiSalesCompany $company,
        AiSalesTerritory $territory
    ): bool {
        if (
            $territory->country &&
            !$this->sameLocation($company->country, $territory->country)
        ) {
            return false;
        }

        if (
            $territory->region &&
            !$this->sameLocation($company->region, $territory->region)
        ) {
            return false;
        }

        $cities = collect($territory->cities ?? [])->filter()->values();

        if (
            $cities->isNotEmpty() &&
            !$cities->contains(
                fn ($city) => $this->sameLocation($company->city, $city)
            )
        ) {
            return false;
        }

        $industries = collect($territory->industries ?? [])->filter()->values();

        if (
            $industries->isNotEmpty() &&
            !$industries->contains(
                fn ($industry) => $this->sameLocation($company->industry, $industry)
            )
        ) {
            return false;
        }

        return (bool) (
            $territory->country ||
            $territory->region ||
            $cities->isNotEmpty() ||
            $industries->isNotEmpty()
        );
    }

    private function sameLocation(?string $left, ?string $right): bool
    {
        if (!$left || !$right) {
            return false;
        }

        return mb_strtolower(trim($left)) === mb_strtolower(trim($right));
    }

    private function companyPipeline(AiSalesCompany $company): array
    {
        $pipeline = $company->opportunities
            ->sum(fn ($opportunity) => (float) $opportunity->value);

        $weighted = $company->opportunities
            ->sum(fn ($opportunity) =>
                (float) $opportunity->value *
                ((float) $opportunity->probability / 100));

        $currencies = $company->opportunities
            ->pluck('currency')
            ->filter()
            ->unique()
            ->values();

        return [
            'pipeline_value' => round($pipeline, 2),
            'weighted_pipeline' => round($weighted, 2),
            'currency' => $currencies->count() === 1 ? $currencies->first() : null,
        ];
    }

    private function companyMapRow(AiSalesCompany $company): array
    {
        $pipeline = $this->companyPipeline($company);

        return [
            'id' => $company->id,
            'name' => $company->name,
            'industry' => $company->industry,
            'city' => $company->city,
            'region' => $company->region,
            'country' => $company->country,
            'status' => $company->status,
            'ai_score' => (float) optional($company->latestScore)->overall_score,
            'leads' => $company->leads->count(),
            'opportunities' => $company->opportunities->count(),
            'signals' => $company->signals->count(),
            'pipeline_value' => $pipeline['pipeline_value'],
            'weighted_pipeline' => $pipeline['weighted_pipeline'],
            'currency' => $pipeline['currency'],
            'latitude' => $company->latitude !== null ? (float) $company->latitude : null,
            'longitude' => $company->longitude !== null ? (float) $company->longitude : null,
            'geocoding_source' => $company->geocoding_source,
        ];
    }

    private function buildTerritoryRow(
        AiSalesTerritory $territory,
        Collection $companies
    ): array {
        $leads = $companies->flatMap(fn ($company) => $company->leads);
        $opportunities = $companies->flatMap(fn ($company) => $company->opportunities);
        $signals = $companies->flatMap(fn ($company) => $company->signals);

        $pipelineValue = $opportunities
            ->sum(fn ($opportunity) => (float) $opportunity->value);

        $weightedValue = $opportunities
            ->sum(fn ($opportunity) =>
                (float) $opportunity->value *
                ((float) $opportunity->probability / 100));

        $scoredCompanies = $companies->filter(fn ($company) => $company->latestScore);

        return [
            'id' => $territory->id,
            'name' => $territory->name,
            'country' => $territory->country,
            'region' => $territory->region,
            'cities_filter' => $territory->cities ?? [],
            'industries' => $territory->industries ?? [],
            'owner_id' => $territory->owner_id,
            'target_value' => (float) $territory->target_value,
            'companies' => $companies->count(),
            'leads' => $leads->count(),
            'opportunities' => $opportunities->count(),
            'signals' => $signals->count(),
            'pipeline_value' => round($pipelineValue, 2),
            'weighted_value' => round($weightedValue, 2),
            'target_achievement' =>
                (float) $territory->target_value > 0
                    ? min(
                        100,
                        round(
                            ($pipelineValue / (float) $territory->target_value) * 100,
                            1
                        )
                    )
                    : null,
            'average_ai_score' => $scoredCompanies->count()
                ? round(
                    $scoredCompanies->avg(
                        fn ($company) => (float) $company->latestScore->overall_score
                    ),
                    1
                )
                : 0,
            'cities' => $this->buildCityRows($companies),
            'top_companies' => $companies
                ->sortByDesc(
                    fn ($company) => (float) optional($company->latestScore)->overall_score
                )
                ->take(5)
                ->map(fn ($company) => $this->companyMapRow($company))
                ->values(),
            'map_companies' => $companies
                ->filter(
                    fn ($company) =>
                        $company->latitude !== null &&
                        $company->longitude !== null
                )
                ->map(fn ($company) => $this->companyMapRow($company))
                ->values(),
        ];
    }

    private function buildCityRows(Collection $companies): array
    {
        return $companies
            ->filter(fn ($company) => filled($company->city))
            ->groupBy(fn ($company) => trim((string) $company->city))
            ->map(function (Collection $cityCompanies, string $city) {
                $leads = $cityCompanies->flatMap(fn ($company) => $company->leads);
                $opportunities = $cityCompanies->flatMap(fn ($company) => $company->opportunities);
                $signals = $cityCompanies->flatMap(fn ($company) => $company->signals);

                return [
                    'city' => $city,
                    'companies' => $cityCompanies->count(),
                    'leads' => $leads->count(),
                    'opportunities' => $opportunities->count(),
                    'signals' => $signals->count(),
                    'pipeline_value' => round(
                        $opportunities->sum(
                            fn ($opportunity) => (float) $opportunity->value
                        ),
                        2
                    ),
                ];
            })
            ->sortByDesc('companies')
            ->values()
            ->all();
    }
}
