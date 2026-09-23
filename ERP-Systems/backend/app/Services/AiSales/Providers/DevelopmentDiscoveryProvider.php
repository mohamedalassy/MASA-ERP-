<?php

namespace App\Services\AiSales\Providers;

use Illuminate\Support\Collection;

class DevelopmentDiscoveryProvider
{
    public function search(
        Collection $profiles,
        array $criteria = []
    ): array {
        $region = $criteria['region'] ?? 'Eastern Province';
        $country = $criteria['country'] ?? 'Saudi Arabia';

        $targets = $profiles
            ->pluck('name')
            ->filter()
            ->values()
            ->all();

        $targetIds = $profiles
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        /*
         * Fixed development dataset.
         * These records are intentionally generic so AI Sales remains
         * industry-independent.
         */
        $companies = [
            [
                'name' => 'North Gate Trading',
                'industry' => 'Trading',
                'city' => 'Dammam',
                'website' => 'https://example.com/north-gate',
                'source' => 'development',
                'source_ref' => 'dev-company-001',
                'data_confidence' => 82,
            ],
            [
                'name' => 'Horizon Business Solutions',
                'industry' => 'Business Services',
                'city' => 'Khobar',
                'website' => 'https://example.com/horizon',
                'source' => 'development',
                'source_ref' => 'dev-company-002',
                'data_confidence' => 78,
            ],
            [
                'name' => 'Eastern Manufacturing Group',
                'industry' => 'Manufacturing',
                'city' => 'Dammam',
                'website' => 'https://example.com/eastern-manufacturing',
                'source' => 'development',
                'source_ref' => 'dev-company-003',
                'data_confidence' => 88,
            ],
            [
                'name' => 'Vertex Projects',
                'industry' => 'Projects & Contracting',
                'city' => 'Jubail',
                'website' => 'https://example.com/vertex',
                'source' => 'development',
                'source_ref' => 'dev-company-004',
                'data_confidence' => 84,
            ],
            [
                'name' => 'Nova Retail Company',
                'industry' => 'Retail',
                'city' => 'Dhahran',
                'website' => 'https://example.com/nova-retail',
                'source' => 'development',
                'source_ref' => 'dev-company-005',
                'data_confidence' => 75,
            ],
            [
                'name' => 'Summit Logistics',
                'industry' => 'Logistics',
                'city' => 'Dammam',
                'website' => 'https://example.com/summit-logistics',
                'source' => 'development',
                'source_ref' => 'dev-company-006',
                'data_confidence' => 86,
            ],
        ];

        return array_map(
            function (array $company) use (
                $region,
                $country,
                $targets,
                $targetIds
            ) {
                $company['country'] = $country;
                $company['region'] = $region;

                $company['service_matches'] = $targetIds;

                $company['enrichment'] = [
                    'provider' => 'development',
                    'development_record' => true,
                    'matched_targets' => $targets,
                    'generated_for_testing' => true,
                ];

                return $company;
            },
            $companies
        );
    }
}