<?php

namespace App\Services\AiSales;

use App\Models\AiSalesCatalogProfile;
use App\Models\Product;
use Illuminate\Support\Str;

class CatalogSyncService
{
    /**
     * Minimum length for a standalone keyword.
     */
    private const MIN_KEYWORD_LENGTH = 3;

    /**
     * Maximum keywords stored per catalog profile.
     */
    private const MAX_KEYWORDS = 100;

    /**
     * Sync all active ERP products with AI Sales.
     */
    public function syncProducts(): array
    {
        $products = Product::query()
            ->where('is_active', true)
            ->get();

        $created = 0;
        $updated = 0;
        $deactivated = 0;

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
         * Any profile linked to a missing or inactive ERP
         * product must no longer participate in AI matching.
         */
        $deactivated = AiSalesCatalogProfile::query()
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
            'profiles_deactivated' => $deactivated,

            'total_profiles' =>
                AiSalesCatalogProfile::query()
                    ->where('is_active', true)
                    ->count(),
        ];
    }

    /**
     * Sync a single ERP product with its AI Sales
     * catalog intelligence profile.
     */
    public function syncProduct(Product $product): array
    {
        $profile = AiSalesCatalogProfile::query()
            ->where('product_id', $product->id)
            ->first();

        /*
         * Inactive ERP products must not be considered
         * by discovery, tender or matching engines.
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
            'name' => trim((string) $product->name),

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

        $profile = AiSalesCatalogProfile::create($data);

        return [
            'action' => 'created',
            'profile' => $profile,
        ];
    }

    /**
     * Build a clean human-readable description used
     * by AI Sales intelligence engines.
     */
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
            ->filter(
                fn ($value) =>
                    $value !== null &&
                    trim((string) $value) !== ''
            )
            ->map(
                fn ($value) =>
                    trim((string) $value)
            )
            ->unique(
                fn ($value) =>
                    Str::lower($value)
            )
            ->implode(' | ');
    }

    /**
     * Generate meaningful catalog keywords.
     *
     * Priority:
     * 1. Product name
     * 2. Model
     * 3. Brand
     * 4. Category
     * 5. Product description
     *
     * Short and generic words are excluded to reduce
     * false-positive tender/discovery matches.
     */
    private function buildKeywords(
        Product $product
    ): array {
        $keywords = [];

        /*
         * Product identity fields receive priority.
         */
        $identityValues = [
            $product->name,
            $product->model,
            $product->brand,
            $product->category,
        ];

        foreach ($identityValues as $value) {
            $this->appendKeywords(
                $keywords,
                $value,
                true
            );
        }

        /*
         * Description can contain useful capabilities,
         * specifications and product terminology, but
         * should not dominate the profile.
         */
        $this->appendKeywords(
            $keywords,
            $product->description,
            false
        );

        return collect($keywords)
            ->map(
                fn ($keyword) =>
                    $this->normalizeKeyword($keyword)
            )
            ->filter(
                fn ($keyword) =>
                    $this->isValidKeyword($keyword)
            )
            ->unique()
            ->values()
            ->take(self::MAX_KEYWORDS)
            ->all();
    }

    /**
     * Add a full phrase plus meaningful words.
     */
    private function appendKeywords(
        array &$keywords,
        mixed $value,
        bool $keepFullPhrase = true
    ): void {
        if ($value === null) {
            return;
        }

        $value = $this->normalizeKeyword(
            (string) $value
        );

        if ($value === '') {
            return;
        }

        /*
         * Full phrases are valuable because they are
         * more specific than individual words.
         *
         * Example:
         * "network security appliance"
         * is stronger than "network".
         */
        if (
            $keepFullPhrase &&
            $this->isValidPhrase($value)
        ) {
            $keywords[] = $value;
        }

        $words = preg_split(
            '/[^\p{L}\p{N}\-_]+/u',
            $value,
            -1,
            PREG_SPLIT_NO_EMPTY
        );

        foreach ($words as $word) {
            $word = $this->normalizeKeyword(
                $word
            );

            if (
                $this->isValidKeyword($word)
            ) {
                $keywords[] = $word;
            }
        }

        /*
         * Description itself is not stored as one huge
         * keyword. Only meaningful terms are extracted.
         */
    }

    /**
     * Normalize catalog terms before storing/matching.
     */
    private function normalizeKeyword(
        string $value
    ): string {
        $value = Str::lower(
            trim($value)
        );

        /*
         * Collapse repeated whitespace.
         */
        $value = preg_replace(
            '/\s+/u',
            ' ',
            $value
        );

        return trim(
            (string) $value
        );
    }

    /**
     * Validate a complete phrase.
     */
    private function isValidPhrase(
        string $phrase
    ): bool {
        if ($phrase === '') {
            return false;
        }

        if (
            mb_strlen($phrase) <
            self::MIN_KEYWORD_LENGTH
        ) {
            return false;
        }

        /*
         * A phrase made entirely from stop words
         * provides no useful matching signal.
         */
        $words = preg_split(
            '/[^\p{L}\p{N}\-_]+/u',
            $phrase,
            -1,
            PREG_SPLIT_NO_EMPTY
        );

        if (!$words) {
            return false;
        }

        foreach ($words as $word) {
            if (
                $this->isValidKeyword(
                    $this->normalizeKeyword($word)
                )
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Validate a standalone keyword.
     */
    private function isValidKeyword(
        string $keyword
    ): bool {
        if ($keyword === '') {
            return false;
        }

        if (
            mb_strlen($keyword) <
            self::MIN_KEYWORD_LENGTH
        ) {
            return false;
        }

        /*
         * Ignore values containing only punctuation.
         */
        if (
            !preg_match(
                '/[\p{L}\p{N}]/u',
                $keyword
            )
        ) {
            return false;
        }

        if ($this->isStopWord($keyword)) {
            return false;
        }

        return true;
    }

    /**
     * Generic terms that should not independently
     * influence opportunity/tender matching.
     */
    private function isStopWord(
        string $word
    ): bool {
        $word = $this->normalizeKeyword(
            $word
        );

        return in_array(
            $word,
            [
                /*
                 * English.
                 */
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
                'can',
                'has',
                'have',
                'had',

                /*
                 * Generic commercial words.
                 */
                'product',
                'products',
                'service',
                'services',
                'item',
                'items',
                'solution',
                'solutions',
                'system',
                'systems',
                'supply',
                'supplies',
                'supplier',
                'suppliers',
                'company',
                'project',
                'projects',
                'required',
                'requirement',
                'requirements',

                /*
                 * Common Arabic filler / generic words.
                 */
                'من',
                'في',
                'على',
                'الى',
                'إلى',
                'عن',
                'مع',
                'هذا',
                'هذه',
                'ذلك',
                'تلك',
                'التي',
                'الذي',

                /*
                 * Generic Arabic commercial terms.
                 */
                'منتج',
                'منتجات',
                'خدمة',
                'خدمات',
                'توريد',
                'مورد',
                'المورد',
                'شركة',
                'مشروع',
                'مشاريع',
                'نظام',
                'انظمة',
                'أنظمة',
                'حل',
                'حلول',
                'مطلوب',
                'المطلوب',
            ],
            true
        );
    }
}