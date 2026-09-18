<?php

namespace App\Services\AiSales\Providers;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class GooglePlacesDiscoveryProvider
{
    private string $baseUrl = 'https://places.googleapis.com/v1/places:searchText';

    public function search(array $criteria): array
    {
        $apiKey = config('services.google_places.api_key');

        if (!$apiKey) {
            throw new RuntimeException(
                'Google Places API key is not configured.'
            );
        }

        $queries = $this->buildQueries($criteria);

        $companies = [];

        foreach ($queries as $query) {
            $response = Http::timeout(20)
                ->retry(2, 500)
                ->withHeaders([
                    'X-Goog-Api-Key' => $apiKey,
                    'X-Goog-FieldMask' => implode(',', [
                        'places.id',
                        'places.displayName',
                        'places.websiteUri',
                        'places.formattedAddress',
                        'places.primaryType',
                        'places.types',
                        'places.location',
                        'places.businessStatus',
                    ]),
                ])
                ->post($this->baseUrl, [
                    'textQuery' => $query,
                    'pageSize' => 20,
                ]);

            if ($response->failed()) {
                throw new RuntimeException(
                    'Google Places discovery failed: ' .
                    $response->body()
                );
            }

            foreach ($response->json('places', []) as $place) {
                $company = $this->normalize($place, $criteria);

                if (!$company['name']) {
                    continue;
                }

                $key = $place['id']
                    ?? $company['website']
                    ?? mb_strtolower($company['name']);

                $companies[$key] = $company;
            }
        }

        return array_values($companies);
    }

    private function buildQueries(array $criteria): array
    {
        $region = trim($criteria['region'] ?? '');
        $profiles = $criteria['catalog_profiles'] ?? [];

        $queries = [];

        foreach ($profiles as $profile) {
            $name = trim($profile['name'] ?? '');

            if (!$name) {
                continue;
            }

            $queries[] = trim(
                "{$name} companies businesses {$region}"
            );
        }

        if (!$queries) {
            $queries[] = trim("businesses companies {$region}");
        }

        return array_values(array_unique($queries));
    }

    private function normalize(array $place, array $criteria): array
    {
        $displayName = $place['displayName']['text'] ?? null;

        return [
            'name' => $displayName,
            'website' => $place['websiteUri'] ?? null,

            'industry' => $this->industry(
                $place['primaryType'] ?? null
            ),

            'country' => $criteria['country'] ?? 'Saudi Arabia',
            'region' => $criteria['region'] ?? null,
            'city' => null,

            'source' => 'google_places',

            'source_url' => isset($place['id'])
                ? 'https://www.google.com/maps/search/?api=1&query_place_id=' .
                    $place['id']
                : null,

            'data_confidence' => 75,

            'enrichment' => [
                'google_place_id' => $place['id'] ?? null,
                'formatted_address' =>
                    $place['formattedAddress'] ?? null,

                'primary_type' =>
                    $place['primaryType'] ?? null,

                'types' =>
                    $place['types'] ?? [],

                'business_status' =>
                    $place['businessStatus'] ?? null,

                'location' =>
                    $place['location'] ?? null,
            ],
        ];
    }

    private function industry(?string $type): ?string
    {
        if (!$type) {
            return null;
        }

        return ucwords(
            str_replace('_', ' ', $type)
        );
    }
}