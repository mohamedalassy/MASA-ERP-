<?php

namespace App\Services\AiSales;

use App\Models\AiSalesCatalogProfile;
use Illuminate\Support\Collection;

class TenderDocumentIntelligenceService
{
    public function analyze(string $text): array
    {
        $originalText = trim($text);
        $normalizedText = $this->normalize($originalText);

        $catalog = AiSalesCatalogProfile::query()
            ->where('is_active', true)
            ->get();

        $dates = $this->extractDates($originalText);
        $requirements = $this->extractRequirements($originalText);
        $catalogMatches = $this->matchCatalog($normalizedText, $catalog);
        $risks = $this->detectRisks($normalizedText, $dates);
        $commercial = $this->extractCommercialData($originalText);

        $fitScore = $this->calculateFitScore(
            $catalogMatches,
            $requirements,
            $risks
        );

        return [
            'summary' => $this->buildSummary($originalText),

            'dates' => $dates,

            'requirements_detected' => count($requirements),

            'requirements' => $requirements,

            'catalog_matches' => $catalogMatches,

            'fit_score' => $fitScore,

            'fit_level' => $this->fitLevel($fitScore),

            'risks' => $risks,

            'commercial' => $commercial,

            'recommendation' => $this->buildRecommendation(
                $fitScore,
                $catalogMatches,
                $risks
            ),

            'needs_human_review' => true,

            'analysis_meta' => [
                'engine' => 'rules_catalog_v2',
                'catalog_profiles_scanned' => $catalog->count(),
                'matched_catalog_profiles' => count($catalogMatches),
                'requirements_count' => count($requirements),
                'risk_count' => count($risks),
                'text_length' => mb_strlen($originalText),
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize
    |--------------------------------------------------------------------------
    */

    private function normalize(string $text): string
    {
        $text = mb_strtolower($text);

        $text = preg_replace('/\s+/u', ' ', $text);

        return trim($text ?? '');
    }

    /*
    |--------------------------------------------------------------------------
    | Summary
    |--------------------------------------------------------------------------
    */

    private function buildSummary(string $text): string
    {
        $clean = preg_replace('/\s+/u', ' ', trim($text));

        if (!$clean) {
            return '';
        }

        return mb_substr($clean, 0, 1200);
    }

    /*
    |--------------------------------------------------------------------------
    | Dates
    |--------------------------------------------------------------------------
    */

    private function extractDates(string $text): array
    {
        $dates = [];

        $patterns = [
            '/\b\d{4}-\d{2}-\d{2}\b/u',
            '/\b\d{1,2}\/\d{1,2}\/\d{4}\b/u',
            '/\b\d{1,2}-\d{1,2}-\d{4}\b/u',
            '/\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/iu',
            '/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/iu',
        ];

        foreach ($patterns as $pattern) {
            preg_match_all(
                $pattern,
                $text,
                $matches
            );

            foreach ($matches[0] ?? [] as $date) {
                $dates[] = $date;
            }
        }

        return array_values(
            array_unique($dates)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Requirements
    |--------------------------------------------------------------------------
    */

    private function extractRequirements(string $text): array
    {
        $lines = preg_split(
            '/[\r\n]+/u',
            $text
        );

        $requirements = [];

        foreach ($lines as $line) {
            $line = trim($line);

            if (!$line) {
                continue;
            }

            if (
                preg_match(
                    '/\b(required|requirement|requirements|shall|must|mandatory|should|provide|supply|deliver|install|implement|support)\b/i',
                    $line
                )
            ) {
                $requirements[] = mb_substr(
                    preg_replace('/\s+/u', ' ', $line),
                    0,
                    500
                );
            }

            if (count($requirements) >= 50) {
                break;
            }
        }

        return array_values(
            array_unique($requirements)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Catalog Matching
    |--------------------------------------------------------------------------
    */

    private function matchCatalog(
        string $normalizedText,
        Collection $catalog
    ): array {
        $matches = [];

        foreach ($catalog as $profile) {
            $keywords = $this->profileKeywords($profile);
            $matchedKeywords = [];
            $matchedWeight = 0.0;
            $totalWeight = 0.0;

            foreach ($keywords as $keyword) {
                $normalizedKeyword = $this->normalize($keyword);

                if (
                    $normalizedKeyword === '' ||
                    mb_strlen($normalizedKeyword) < 3
                ) {
                    continue;
                }

                $weight = $this->keywordWeight(
                    $normalizedKeyword,
                    $profile
                );

                $totalWeight += $weight;

                if (
                    $this->textContainsTerm(
                        $normalizedText,
                        $normalizedKeyword
                    )
                ) {
                    $matchedKeywords[] = $keyword;
                    $matchedWeight += $weight;
                }
            }

            $matchedKeywords = array_values(
                array_unique($matchedKeywords)
            );

            if (!$matchedKeywords) {
                continue;
            }

            $weightedCoverage = $totalWeight > 0
                ? ($matchedWeight / $totalWeight) * 100
                : 0;

            /*
             * Evidence strength rewards several independent
             * matching signals but does not allow a few generic
             * words to produce an automatic 100% match.
             */
            $evidenceStrength = min(
                100,
                count($matchedKeywords) * 12
            );

            $identityBonus = $this->identityMatchBonus(
                $normalizedText,
                $profile
            );

            $confidence = min(
                100,
                (int) round(
                    ($weightedCoverage * 0.65) +
                    ($evidenceStrength * 0.25) +
                    $identityBonus
                )
            );

            /*
             * A weak one-word match is not enough to qualify
             * a catalog item unless it is a strong identity term.
             */
            if (
                count($matchedKeywords) === 1 &&
                $identityBonus === 0 &&
                $confidence < 45
            ) {
                continue;
            }

            $matches[] = [
                'id' => $profile->id,
                'name' => $profile->name,
                'type' => $profile->type,
                'description' => $profile->description,
                'matched_keywords' => $matchedKeywords,
                'keyword_matches' => count($matchedKeywords),
                'coverage' => min(
                    100,
                    (int) round($weightedCoverage)
                ),
                'confidence' => $confidence,
                'identity_bonus' => $identityBonus,
            ];
        }

        usort(
            $matches,
            fn ($a, $b) =>
                $b['confidence'] <=> $a['confidence']
        );

        return array_slice($matches, 0, 20);
    }

    private function textContainsTerm(
        string $text,
        string $term
    ): bool {
        $quoted = preg_quote($term, '/');

        /*
         * Unicode letter/number boundaries prevent a short
         * catalog term from matching inside an unrelated word.
         */
        return preg_match(
            '/(?<![\p{L}\p{N}])' .
            $quoted .
            '(?![\p{L}\p{N}])/iu',
            $text
        ) === 1;
    }

    private function keywordWeight(
        string $keyword,
        $profile
    ): float {
        $name = $this->normalize(
            (string) ($profile->name ?? '')
        );

        if ($keyword === $name) {
            return 4.0;
        }

        /*
         * Codes/models and multi-word phrases are normally
         * more discriminating than generic standalone words.
         */
        if (
            preg_match('/[\d\-_]/u', $keyword) &&
            preg_match('/\p{L}/u', $keyword)
        ) {
            return 3.5;
        }

        if (str_contains($keyword, ' ')) {
            return 3.0;
        }

        if ($this->isGenericCatalogTerm($keyword)) {
            return 0.5;
        }

        return 1.5;
    }

    private function identityMatchBonus(
        string $text,
        $profile
    ): int {
        $bonus = 0;

        $name = $this->normalize(
            (string) ($profile->name ?? '')
        );

        if (
            mb_strlen($name) >= 3 &&
            $this->textContainsTerm($text, $name)
        ) {
            $bonus += 12;
        }

        $description = $this->normalize(
            (string) ($profile->description ?? '')
        );

        /*
         * CatalogSyncService builds the description from
         * product identity fields separated by pipes.
         * Matching distinctive identity segments earns a
         * small bonus, capped to avoid score inflation.
         */
        $segments = preg_split(
            '/\s*\|\s*/u',
            $description,
            -1,
            PREG_SPLIT_NO_EMPTY
        );

        foreach ($segments as $segment) {
            $segment = $this->normalize($segment);

            if (
                mb_strlen($segment) >= 4 &&
                !$this->isGenericCatalogTerm($segment) &&
                $this->textContainsTerm($text, $segment)
            ) {
                $bonus += 4;
            }

            if ($bonus >= 20) {
                break;
            }
        }

        return min(20, $bonus);
    }

    private function isGenericCatalogTerm(
        string $term
    ): bool {
        return in_array(
            $this->normalize($term),
            [
                'camera',
                'cameras',
                'network',
                'surveillance',
                'system',
                'systems',
                'product',
                'products',
                'service',
                'services',
                'solution',
                'solutions',
                'supply',
                'project',
                'projects',
            ],
            true
        );
    }

    private function profileKeywords($profile): array
    {
        $keywords = $profile->keywords ?? [];

        if (is_string($keywords)) {
            $decoded = json_decode(
                $keywords,
                true
            );

            if (is_array($decoded)) {
                $keywords = $decoded;
            } else {
                $keywords = preg_split(
                    '/[,;]+/',
                    $keywords
                );
            }
        }

        if (!is_array($keywords)) {
            $keywords = [];
        }

        $values = [
            $profile->name,
            ...$keywords,
        ];

        if (!empty($profile->description)) {
            $descriptionWords = preg_split(
                '/[\s,;\/|]+/u',
                $profile->description
            );

            foreach ($descriptionWords as $word) {
                $word = trim($word);

                if (mb_strlen($word) >= 4) {
                    $values[] = $word;
                }
            }
        }

        return array_values(
            array_unique(
                array_filter(
                    array_map(
                        fn ($value) =>
                            trim((string) $value),
                        $values
                    )
                )
            )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Risks
    |--------------------------------------------------------------------------
    */

    private function detectRisks(
        string $text,
        array $dates
    ): array {
        $risks = [];

        $rules = [
            [
                'pattern' => '/\bpenalty\b|\bliquidated damages\b/i',
                'type' => 'contractual',
                'severity' => 'high',
                'message' => 'Penalty or liquidated damages clause detected.',
            ],
            [
                'pattern' => '/\bperformance bond\b|\bbank guarantee\b/i',
                'type' => 'financial',
                'severity' => 'medium',
                'message' => 'Performance bond or bank guarantee requirement detected.',
            ],
            [
                'pattern' => '/\bbid bond\b|\btender bond\b/i',
                'type' => 'financial',
                'severity' => 'medium',
                'message' => 'Bid bond requirement detected.',
            ],
            [
                'pattern' => '/\bmandatory site visit\b|\bsite visit is mandatory\b/i',
                'type' => 'compliance',
                'severity' => 'high',
                'message' => 'Mandatory site visit detected.',
            ],
            [
                'pattern' => '/\bcertified\b|\bcertification\b|\baccreditation\b/i',
                'type' => 'compliance',
                'severity' => 'medium',
                'message' => 'Certification or accreditation requirement detected.',
            ],
            [
                'pattern' => '/\b24\/7\b|\b24x7\b|\baround the clock\b/i',
                'type' => 'operational',
                'severity' => 'medium',
                'message' => '24/7 operational or support commitment detected.',
            ],
            [
                'pattern' => '/\bwarranty\b/i',
                'type' => 'commercial',
                'severity' => 'low',
                'message' => 'Warranty obligation detected.',
            ],
        ];

        foreach ($rules as $rule) {
            if (
                preg_match(
                    $rule['pattern'],
                    $text
                )
            ) {
                $risks[] = [
                    'type' => $rule['type'],
                    'severity' => $rule['severity'],
                    'message' => $rule['message'],
                ];
            }
        }

        if (!$dates) {
            $risks[] = [
                'type' => 'data_quality',
                'severity' => 'low',
                'message' => 'No structured tender date was detected automatically.',
            ];
        }

        return $risks;
    }

    /*
    |--------------------------------------------------------------------------
    | Commercial Data
    |--------------------------------------------------------------------------
    */

    private function extractCommercialData(
        string $text
    ): array {
        $currency = null;
        $amount = null;

        $patterns = [
            '/\bSAR\s*([\d,]+(?:\.\d+)?)\b/i',
            '/\bUSD\s*([\d,]+(?:\.\d+)?)\b/i',
            '/\bAED\s*([\d,]+(?:\.\d+)?)\b/i',
            '/\bEUR\s*([\d,]+(?:\.\d+)?)\b/i',
            '/\b([\d,]+(?:\.\d+)?)\s*(SAR|USD|AED|EUR)\b/i',
        ];

        foreach ($patterns as $pattern) {
            if (
                preg_match(
                    $pattern,
                    $text,
                    $match
                )
            ) {
                if (
                    isset($match[2]) &&
                    in_array(
                        strtoupper($match[2]),
                        ['SAR', 'USD', 'AED', 'EUR'],
                        true
                    )
                ) {
                    $currency = strtoupper(
                        $match[2]
                    );

                    $amount = $match[1];
                } else {
                    preg_match(
                        '/SAR|USD|AED|EUR/i',
                        $match[0],
                        $currencyMatch
                    );

                    $currency = strtoupper(
                        $currencyMatch[0] ?? 'SAR'
                    );

                    $amount = $match[1] ?? null;
                }

                break;
            }
        }

        if ($amount !== null) {
            $amount = (float) str_replace(
                ',',
                '',
                $amount
            );
        }

        return [
            'estimated_value' => $amount,
            'currency' => $currency,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Fit Score
    |--------------------------------------------------------------------------
    */

    private function calculateFitScore(
        array $matches,
        array $requirements,
        array $risks
    ): int {
        if (!$matches) {
            return 0;
        }

        $topMatches = array_slice(
            $matches,
            0,
            5
        );

        $averageConfidence = array_sum(
            array_column(
                $topMatches,
                'confidence'
            )
        ) / max(count($topMatches), 1);

        $score = $averageConfidence;

        if (count($matches) >= 3) {
            $score += 5;
        }

        if (count($requirements) > 0) {
            $score += 3;
        }

        $highRisks = count(
            array_filter(
                $risks,
                fn ($risk) =>
                    ($risk['severity'] ?? null) === 'high'
            )
        );

        $score -= $highRisks * 5;

        return max(
            0,
            min(
                100,
                (int) round($score)
            )
        );
    }

    private function fitLevel(int $score): string
    {
        return match (true) {
            $score >= 85 => 'high',
            $score >= 65 => 'good',
            $score >= 40 => 'medium',
            default => 'low',
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Recommendation
    |--------------------------------------------------------------------------
    */

    private function buildRecommendation(
        int $fitScore,
        array $matches,
        array $risks
    ): array {
        if (!$matches) {
            return [
                'action' => 'review',
                'label' => 'Manual Review Required',
                'reason' => 'No active ERP catalog profile matched the tender text.',
            ];
        }

        $highRiskCount = count(
            array_filter(
                $risks,
                fn ($risk) =>
                    ($risk['severity'] ?? null) === 'high'
            )
        );

        if ($fitScore >= 80 && $highRiskCount === 0) {
            return [
                'action' => 'pursue',
                'label' => 'Strong Candidate',
                'reason' => 'Strong catalog alignment was detected with no high-severity rule-based risks.',
            ];
        }

        if ($fitScore >= 55) {
            return [
                'action' => 'review',
                'label' => 'Review Before Pursuing',
                'reason' => 'The tender has meaningful catalog alignment but requires commercial and technical review.',
            ];
        }

        return [
            'action' => 'review',
            'label' => 'Low Confidence Match',
            'reason' => 'Only limited catalog alignment was detected. Human qualification is recommended.',
        ];
    }
}