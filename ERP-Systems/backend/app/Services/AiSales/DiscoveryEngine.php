<?php

namespace App\Services\AiSales;

use App\Models\AiSalesCatalogProfile;
use App\Models\AiSalesCompany;
use App\Models\AiSalesDiscoveryRun;
use App\Services\AiSales\Providers\GooglePlacesDiscoveryProvider;
use Illuminate\Support\Facades\DB;
use Throwable;

class DiscoveryEngine
{
    public function __construct(
        private GooglePlacesDiscoveryProvider $provider,
        private ScoringEngine $scoringEngine
    ) {
    }

    /**
     * Run real market discovery using configured providers.
     */
    public function run(array $criteria): AiSalesDiscoveryRun
    {
        $run = AiSalesDiscoveryRun::create([
            'status' => 'running',
            'criteria' => $criteria,
            'started_at' => now(),
        ]);

        try {
            $profiles = AiSalesCatalogProfile::query()
                ->where('is_active', true)
                ->when(
                    !empty($criteria['catalog_profile_ids']),
                    fn ($query) => $query->whereIn(
                        'id',
                        $criteria['catalog_profile_ids']
                    )
                )
                ->get();

            if ($profiles->isEmpty()) {
                throw new \RuntimeException(
                    'No active catalog profiles were found.'
                );
            }

            $providerCriteria = $criteria;

            $providerCriteria['catalog_profiles'] = $profiles
                ->map(fn ($profile) => [
                    'id' => $profile->id,
                    'name' => $profile->name,
                    'type' => $profile->type,
                    'keywords' => $profile->keywords ?? [],
                    'buying_signals' => $profile->buying_signals ?? [],
                ])
                ->values()
                ->all();

            $companies = $this->provider->search($providerCriteria);

            $accepted = 0;
            $rejected = 0;

            foreach ($companies as $item) {
                try {
                    DB::transaction(function () use (
                        $item,
                        $criteria,
                        &$accepted
                    ) {
                        $company = $this->saveCompany($item);

                        $score = $this->scoringEngine->score($company);

                        $company->scores()->create([
                            'fit_score' => $score['fit'],
                            'intent_score' => $score['intent'],
                            'timing_score' => $score['timing'],
                            'confidence_score' => $score['confidence'],
                            'overall_score' => $score['overall'],

                            'service_matches' =>
                                $criteria['catalog_profile_ids'] ?? [],

                            'reasons' => $score['reasons'],
                            'model_version' => 'rules-v1',
                            'scored_at' => now(),
                        ]);

                        $accepted++;
                    });
                } catch (Throwable $e) {
                    report($e);
                    $rejected++;
                }
            }

            $run->update([
                'status' => 'completed',
                'found_count' => count($companies),
                'accepted_count' => $accepted,
                'rejected_count' => $rejected,
                'finished_at' => now(),
            ]);

            return $run->fresh();

        } catch (Throwable $e) {
            $run->update([
                'status' => 'failed',
                'notes' => $e->getMessage(),
                'finished_at' => now(),
            ]);

            throw $e;
        }
    }

    /**
     * Keep the existing ingest workflow for imports/integrations.
     */
    public function ingest(
        array $companies,
        array $criteria = []
    ): AiSalesDiscoveryRun {
        $run = AiSalesDiscoveryRun::create([
            'status' => 'running',
            'criteria' => $criteria,
            'started_at' => now(),
        ]);

        $accepted = 0;
        $rejected = 0;

        foreach ($companies as $item) {
            if (empty($item['name'])) {
                $rejected++;
                continue;
            }

            try {
                $this->saveCompany($item);
                $accepted++;
            } catch (Throwable $e) {
                report($e);
                $rejected++;
            }
        }

        $run->update([
            'status' => 'completed',
            'found_count' => count($companies),
            'accepted_count' => $accepted,
            'rejected_count' => $rejected,
            'finished_at' => now(),
        ]);

        return $run->fresh();
    }

    private function saveCompany(array $item): AiSalesCompany
    {
        $lookup = [];

        if (!empty($item['website'])) {
            $lookup['website'] = $item['website'];
        } else {
            $lookup['name'] = $item['name'];

            if (!empty($item['region'])) {
                $lookup['region'] = $item['region'];
            }
        }

        $company = AiSalesCompany::firstOrNew($lookup);

        $company->fill([
            'name' => $item['name'],
            'website' => $item['website'] ?? null,
            'industry' => $item['industry'] ?? null,
            'country' => $item['country'] ?? null,
            'region' => $item['region'] ?? null,
            'city' => $item['city'] ?? null,
            'company_size' => $item['company_size'] ?? null,
            'source' => $item['source'] ?? 'discovery',
            'source_url' => $item['source_url'] ?? null,
            'data_confidence' => $item['data_confidence'] ?? 50,
            'enrichment' => $item['enrichment'] ?? [],
            'status' => $item['status'] ?? 'discovered',
        ]);

        if (!$company->discovered_at) {
            $company->discovered_at = now();
        }

        $company->save();

        return $company;
    }
}