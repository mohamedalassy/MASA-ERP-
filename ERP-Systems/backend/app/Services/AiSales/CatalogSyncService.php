<?php

namespace App\Services\AiSales;

use App\Models\AiSalesCatalogProfile;
use App\Models\Product;
use Illuminate\Support\Str;

class CatalogSyncService
{
    /**
     * Sync all active ERP products.
     */
    public function syncProducts(): array
    {
        $products = Product::query()
            ->where('is_active', true)
            ->get();

        $created = 0;
        $updated = 0;

        foreach ($products as $product) {
            $result = $this->syncProduct($product);

            if ($result['action'] === 'created') {
                $created++;
            }

            if ($result['action'] === 'updated') {
                $updated++;
            }
        }

        /*
         * If an ERP product was deactivated,
         * deactivate its AI catalog profile too.
         */
        AiSalesCatalogProfile::query()
            ->whereNotNull('product_id')
            ->whereDoesntHave('product', function ($query) {
                $query->where('is_active', true);
            })
            ->update([
                'is_active' => false,
            ]);

        return [
            'products_scanned' => $products->count(),
            'profiles_created' => $created,
            'profiles_updated' => $updated,

            'total_profiles' =>
                AiSalesCatalogProfile::query()
                    ->where('is_active', true)
                    ->count(),
        ];
    }

    /**
     * Sync one ERP product.
     */
    public function syncProduct(Product $product): array
    {
        $profile = AiSalesCatalogProfile::query()
            ->where('product_id', $product->id)
            ->first();

        /*
         * Product disabled:
         * disable its AI profile.
         */
        if (!$product->is_active) {
            if ($profile) {
                $profile->update([
                    'is_active' => false,
                ]);

                return [
                    'action' => 'deactivated',
                    'profile' => $profile->fresh(),
                ];
            }

            return [
                'action' => 'ignored',
                'profile' => null,
            ];
        }

        $data = [
            'name' => $product->name,

            'type' => 'product',

            'product_id' => $product->id,

            'description' =>
                $this->buildDescription($product),

            'keywords' =>
                $this->buildKeywords($product),

            'target_industries' => [],

            'target_company_sizes' => [],

            'buying_signals' => [
                'request for quotation',
                'request for proposal',
                'tender',
                'procurement',
                'supplier required',
                'vendor required',
                'project requirement',
                'expansion',
                'new project',
            ],

            'pain_points' => [],

            'is_active' => true,
        ];

        if ($profile) {
            $profile->update($data);

            return [
                'action' => 'updated',
                'profile' => $profile->fresh(),
            ];
        }

        $profile =
            AiSalesCatalogProfile::create($data);

        return [
            'action' => 'created',
            'profile' => $profile,
        ];
    }

    private function buildDescription(
        Product $product
    ): string {
        return collect([
            $product->name,
            $product->category,
            $product->brand,
            $product->model,
            $product->description,
        ])
            ->filter()
            ->map(
                fn ($value) =>
                    trim((string) $value)
            )
            ->unique()
            ->implode(' | ');
    }

    private function buildKeywords(
        Product $product
    ): array {
        $values = collect([
            $product->name,
            $product->category,
            $product->brand,
            $product->model,
            $product->description,
        ])
            ->filter()
            ->map(
                fn ($value) =>
                    Str::lower(
                        trim((string) $value)
                    )
            );

        $keywords = [];

        foreach ($values as $value) {
            /*
             * Keep complete phrases.
             */
            if (mb_strlen($value) >= 3) {
                $keywords[] = $value;
            }

            /*
             * Extract meaningful individual words.
             */
            $words = preg_split(
                '/[^\p{L}\p{N}]+/u',
                $value
            );

            foreach ($words as $word) {
                $word = trim($word);

                if (
                    mb_strlen($word) >= 3 &&
                    !$this->isStopWord($word)
                ) {
                    $keywords[] = $word;
                }
            }
        }

        return collect($keywords)
            ->filter()
            ->unique()
            ->values()
            ->take(100)
            ->all();
    }

    private function isStopWord(
        string $word
    ): bool {
        return in_array(
            Str::lower($word),
            [
                'the',
                'and',
                'for',
                'with',
                'from',
                'this',
                'that',
                'into',
                'your',
                'our',
                'are',
                'was',
                'were',
                'will',
                'product',
                'products',
                'service',
                'services',
            ],
            true
        );
    }
}