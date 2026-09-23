<?php

namespace App\Services\AiSales;

use App\Models\AiSalesCatalogProfile;
use App\Models\AiSalesCompany;
use App\Models\AiSalesDiscoveryRun;
use App\Services\AiSales\Providers\DevelopmentDiscoveryProvider;
use Throwable;

class DiscoveryEngine
{
    public function __construct(
        protected DevelopmentDiscoveryProvider $developmentProvider,
        protected ScoringEngine $scoringEngine,
    ) {
    }

    /**
     * Run AI Sales discovery.
     */
    public function run(array $criteria = []): AiSalesDiscoveryRun
    {
        $run = AiSalesDiscoveryRun::create([
            'status' => 'running',
            'criteria' => $criteria,
            'started_at' => now(),
        ]);

        try {
            $profileIds = $criteria['catalog_profile_ids'] ?? [];

            $profiles = AiSalesCatalogProfile::query()
                ->where('is_active', true)
                ->when(
                    !empty($profileIds),
                    fn ($query) => $query->whereIn('id', $profileIds)
                )
                ->get();

            if ($profiles->isEmpty()) {
                throw new \RuntimeException(
                    'No active catalog profiles selected.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Select Discovery Provider
            |--------------------------------------------------------------------------
            */
            $provider = $this->provider();

            /*
            |--------------------------------------------------------------------------
            | Discover Companies
            |--------------------------------------------------------------------------
            */
            $results = $provider->search(
                $profiles,
                $criteria
            );

            $accepted = 0;
            $rejected = 0;

            foreach ($results as $item) {

                if (empty($item['name'])) {
                    $rejected++;
                    continue;
                }

                /*
                |--------------------------------------------------------------------------
                | Create / Update Company
                |--------------------------------------------------------------------------
                */
                $company = AiSalesCompany::updateOrCreate(
                    [
                        'name' => $item['name'],
                        'website' => $item['website'] ?? null,
                    ],
                    array_merge(
                        $item,
                        [
                            'status' => $item['status'] ?? 'discovered',
                            'discovered_at' =>
                                $item['discovered_at'] ?? now(),
                        ]
                    )
                );

                /*
                |--------------------------------------------------------------------------
                | Score Company
                |--------------------------------------------------------------------------
                */
                $this->scoringEngine->scoreCompany($company);

                $accepted++;
            }

            /*
            |--------------------------------------------------------------------------
            | Complete Discovery Run
            |--------------------------------------------------------------------------
            */
            $run->update([
                'status' => 'completed',
                'accepted_count' => $accepted,
                'rejected_count' => $rejected,
                'finished_at' => now(),
            ]);

            return $run->fresh();

        } catch (Throwable $e) {

            /*
            |--------------------------------------------------------------------------
            | Failed Discovery Run
            |--------------------------------------------------------------------------
            */
            $run->update([
                'status' => 'failed',
                'notes' => $e->getMessage(),
                'finished_at' => now(),
            ]);

            throw $e;
        }
    }

    /**
     * Ingest companies supplied manually or by an external source.
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

        try {
            $accepted = 0;
            $rejected = 0;

            foreach ($companies as $item) {

                if (empty($item['name'])) {
                    $rejected++;
                    continue;
                }

                $company = AiSalesCompany::updateOrCreate(
                    [
                        'name' => $item['name'],
                        'website' => $item['website'] ?? null,
                    ],
                    array_merge(
                        $item,
                        [
                            'status' => $item['status'] ?? 'discovered',
                            'discovered_at' =>
                                $item['discovered_at'] ?? now(),
                        ]
                    )
                );

                $this->scoringEngine->scoreCompany($company);

                $accepted++;
            }

            $run->update([
                'status' => 'completed',
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
     * Resolve the currently configured discovery provider.
     *
     * Google Places will be added here later when its API
     * credentials are available.
     */
    protected function provider(): object
    {
        $provider = config(
            'ai_sales.discovery_provider',
            'development'
        );

        return match ($provider) {
            'development' => $this->developmentProvider,

            default => throw new \RuntimeException(
                'Unsupported AI Sales discovery provider: ' . $provider
            ),
        };
    }
}