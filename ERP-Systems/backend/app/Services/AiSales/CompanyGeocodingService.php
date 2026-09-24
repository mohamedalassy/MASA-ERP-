<?php

namespace App\Services\AiSales;

use App\Models\AiSalesCompany;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class CompanyGeocodingService
{
    public function geocode(AiSalesCompany $company, bool $force = false): array
    {
        if (
            !$force &&
            $company->latitude !== null &&
            $company->longitude !== null
        ) {
            return [
                'success' => true,
                'status' => 'cached',
                'company_id' => $company->id,
                'latitude' => (float) $company->latitude,
                'longitude' => (float) $company->longitude,
                'source' => $company->geocoding_source,
            ];
        }

        $query = $this->buildQuery($company);

        if (!$query) {
            return [
                'success' => false,
                'status' => 'missing_location',
                'company_id' => $company->id,
                'message' => 'Company has no city, region or country to geocode.',
            ];
        }

        $provider = config('services.ai_sales_geocoding.provider', 'nominatim');

        return match ($provider) {
            'nominatim' => $this->geocodeWithNominatim($company, $query),
            default => throw new RuntimeException(
                "Unsupported AI Sales geocoding provider: {$provider}"
            ),
        };
    }

    public function geocodePending(int $limit = 50, bool $force = false): array
    {
        $query = AiSalesCompany::query()
            ->orderBy('id');

        if (!$force) {
            $query->where(function ($q) {
                $q->whereNull('latitude')
                    ->orWhereNull('longitude');
            });
        }

        $companies = $query
            ->limit(max(1, min($limit, 100)))
            ->get();

        $results = [];
        $success = 0;
        $failed = 0;

        foreach ($companies as $company) {
            try {
                $result = $this->geocode($company, $force);
            } catch (Throwable $e) {
                report($e);

                $result = [
                    'success' => false,
                    'status' => 'error',
                    'company_id' => $company->id,
                    'message' => $e->getMessage(),
                ];
            }

            $results[] = $result;

            if ($result['success'] ?? false) {
                $success++;
            } else {
                $failed++;
            }

            /*
             * Nominatim's public service has a strict usage policy.
             * Keep bulk requests deliberately slow.
             */
            if (
                config('services.ai_sales_geocoding.provider', 'nominatim')
                === 'nominatim'
            ) {
                usleep(1100000);
            }
        }

        return [
            'processed' => count($results),
            'success' => $success,
            'failed' => $failed,
            'results' => $results,
        ];
    }

    private function geocodeWithNominatim(
        AiSalesCompany $company,
        string $query
    ): array {
        $baseUrl = rtrim(
            config(
                'services.ai_sales_geocoding.nominatim_url',
                'https://nominatim.openstreetmap.org'
            ),
            '/'
        );

        $userAgent = config(
            'services.ai_sales_geocoding.user_agent',
            'MASA-ERP-AI-Sales/1.0'
        );

        $response = Http::acceptJson()
            ->withHeaders([
                'User-Agent' => $userAgent,
            ])
            ->timeout(15)
            ->retry(2, 700)
            ->get("{$baseUrl}/search", [
                'q' => $query,
                'format' => 'jsonv2',
                'limit' => 1,
                'addressdetails' => 1,
            ]);

        if (!$response->successful()) {
            throw new RuntimeException(
                'Geocoding provider returned HTTP ' . $response->status()
            );
        }

        $match = collect($response->json())->first();

        if (!$match || !isset($match['lat'], $match['lon'])) {
            return [
                'success' => false,
                'status' => 'not_found',
                'company_id' => $company->id,
                'query' => $query,
                'message' => 'No geocoding result found.',
            ];
        }

        $company->forceFill([
            'latitude' => (float) $match['lat'],
            'longitude' => (float) $match['lon'],
            'geocoded_at' => now(),
            'geocoding_source' => 'nominatim',
        ])->save();

        return [
            'success' => true,
            'status' => 'geocoded',
            'company_id' => $company->id,
            'company' => $company->name,
            'query' => $query,
            'latitude' => (float) $company->latitude,
            'longitude' => (float) $company->longitude,
            'source' => 'nominatim',
            'display_name' => $match['display_name'] ?? null,
        ];
    }

    private function buildQuery(AiSalesCompany $company): ?string
    {
        $parts = collect([
            $company->city,
            $company->region,
            $company->country,
        ])
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->unique(fn ($value) => mb_strtolower($value))
            ->values();

        return $parts->isEmpty()
            ? null
            : $parts->implode(', ');
    }
}
