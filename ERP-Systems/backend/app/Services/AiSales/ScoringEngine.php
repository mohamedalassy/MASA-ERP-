<?php

namespace App\Services\AiSales;

use App\Models\AiSalesCompany;
use App\Models\AiSalesScore;

class ScoringEngine
{
    /**
     * Calculate score only.
     *
     * Kept for backward compatibility with any existing
     * code that already calls:
     *
     * $scoringEngine->score($company)
     */
    public function score(AiSalesCompany $company): array
    {
        $signals = $company->signals()->get();

        $signalStrength = (int) round(
            $signals->avg('strength') ?? 0
        );

        $signalConfidence = (int) round(
            $signals->avg('confidence') ?? 0
        );

        $enrichment = $company->enrichment ?? [];

        if (!is_array($enrichment)) {
            $enrichment = [];
        }

        /*
        |--------------------------------------------------------------------------
        | FIT SCORE
        |--------------------------------------------------------------------------
        */

        $fit = $this->clamp(
            25
            + ($company->industry ? 15 : 0)
            + ($company->website ? 10 : 0)
            + ($company->city ? 10 : 0)
            + min(40, count($enrichment) * 5)
        );

        /*
        |--------------------------------------------------------------------------
        | INTENT SCORE
        |--------------------------------------------------------------------------
        */

        $intent = $this->clamp(
            $signalStrength
        );

        /*
        |--------------------------------------------------------------------------
        | TIMING SCORE
        |--------------------------------------------------------------------------
        */

        $timingSignals = [
            'expansion',
            'new_branch',
            'funding',
            'tender',
            'hiring',
            'procurement',
        ];

        $timing = $this->clamp(
            $signals
                ->whereIn('type', $timingSignals)
                ->max('strength') ?? 20
        );

        /*
        |--------------------------------------------------------------------------
        | CONFIDENCE SCORE
        |--------------------------------------------------------------------------
        */

        $companyConfidence = (int) (
            $company->data_confidence ?? 0
        );

        /*
         * If there are no external signals yet,
         * don't punish development/discovery data
         * by averaging against zero.
         */
        if ($signals->isEmpty()) {
            $confidence = $this->clamp(
                $companyConfidence
            );
        } else {
            $confidence = $this->clamp(
                (int) round(
                    (
                        $companyConfidence
                        + $signalConfidence
                    ) / 2
                )
            );
        }

        /*
        |--------------------------------------------------------------------------
        | OVERALL SCORE
        |--------------------------------------------------------------------------
        */

        $overall = $this->clamp(
            (int) round(
                ($fit * 0.35)
                + ($intent * 0.30)
                + ($timing * 0.20)
                + ($confidence * 0.15)
            )
        );

        /*
        |--------------------------------------------------------------------------
        | SCORE REASONS
        |--------------------------------------------------------------------------
        */

        $reasons = [];

        if ($signals->count()) {
            $reasons[] =
                $signals->count()
                . ' active buying signal(s) detected';
        }

        if ($company->industry) {
            $reasons[] =
                'Industry profile is available';
        }

        if ($company->website) {
            $reasons[] =
                'Company website is available for enrichment';
        }

        if ($company->city) {
            $reasons[] =
                'Company location is available';
        }

        if ($timing >= 70) {
            $reasons[] =
                'Strong timing signal detected';
        }

        if (
            $companyConfidence >= 75
        ) {
            $reasons[] =
                'Company data confidence is high';
        }

        return [
            'fit' => $fit,
            'intent' => $intent,
            'timing' => $timing,
            'confidence' => $confidence,
            'overall' => $overall,
            'reasons' => $reasons,
        ];
    }

    /**
     * Calculate and persist the company score.
     */
    public function scoreCompany(
        AiSalesCompany $company
    ): AiSalesScore {
        $result = $this->score($company);

        /*
         * One current score record per company.
         * Re-running Discovery updates it instead
         * of creating endless duplicate scores.
         */
        return AiSalesScore::updateOrCreate(
            [
                'company_id' => $company->id,
            ],
            [
                'fit_score' =>
                    $result['fit'],

                'intent_score' =>
                    $result['intent'],

                'timing_score' =>
                    $result['timing'],

                'confidence_score' =>
                    $result['confidence'],

                'overall_score' =>
                    $result['overall'],

                'reasons' =>
                    $result['reasons'],

                'scored_at' =>
                    now(),
            ]
        );
    }

    /**
     * Force value between 0 and 100.
     */
    private function clamp($value): int
    {
        return max(
            0,
            min(
                100,
                (int) $value
            )
        );
    }
}