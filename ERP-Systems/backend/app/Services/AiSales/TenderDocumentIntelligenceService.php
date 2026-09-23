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
                'engine' => 'rules_catalog_v1',
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
            '/\b\d{2}\/\d{2}\/\d{4}\b/u',
            '/\b\d{2}-\d{2}-\d{4}\b/u',
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
            $keywords = $this->profileKeywords(
                $profile
            );

            $matchedKeywords = [];

            foreach ($keywords as $keyword) {
                $normalizedKeyword = $this->normalize(
                    $keyword
                );

                if (
                    $normalizedKeyword !== '' &&
                    mb_strlen($normalizedKeyword) >= 2 &&
                    mb_stripos(
                        $normalizedText,
                        $normalizedKeyword
                    ) !== false
                ) {
                    $matchedKeywords[] = $keyword;
                }
            }

            $matchedKeywords = array_values(
                array_unique($matchedKeywords)
            );

            if (!$matchedKeywords) {
                continue;
            }

            $keywordCount = max(
                count($keywords),
                1
            );

            $coverage = min(
                100,
                (int) round(
                    (
                        count($matchedKeywords) /
                        $keywordCount
                    ) * 100
                )
            );

            $confidence = min(
                100,
                45 +
                (count($matchedKeywords) * 12) +
                (int) round($coverage * 0.25)
            );

            $matches[] = [
                'id' => $profile->id,

                'name' => $profile->name,

                'type' => $profile->type,

                'description' => $profile->description,

                'matched_keywords' => $matchedKeywords,

                'keyword_matches' => count(
                    $matchedKeywords
                ),

                'coverage' => $coverage,

                'confidence' => $confidence,
            ];
        }

        usort(
            $matches,
            fn ($a, $b) =>
                $b['confidence'] <=> $a['confidence']
        );

        return array_slice(
            $matches,
            0,
            20
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