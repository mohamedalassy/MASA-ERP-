<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiSalesCompany;
use App\Models\AiSalesSignal;
use App\Services\AiSales\ScoringEngine;
use Illuminate\Http\Request;

class AiSalesSignalController extends Controller
{
    public function index(Request $request)
    {
        $now = now();

        $query = AiSalesSignal::query()
            ->with([
                'company:id,name,industry,city,region,country,status',
                'company.latestScore',
            ])
            ->where(function ($q) use ($now) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', $now);
            });

        if ($request->filled('type')) {
            $query->where(
                'type',
                $this->normalizeType(
                    $request->string('type')->toString()
                )
            );
        }

        if ($request->filled('company_id')) {
            $query->where(
                'company_id',
                (int) $request->company_id
            );
        }

        if ($request->filled('min_strength')) {
            $query->where(
                'strength',
                '>=',
                max(
                    0,
                    min(
                        100,
                        (int) $request->min_strength
                    )
                )
            );
        }

        if ($request->boolean('high_intent')) {
            $query
                ->where('strength', '>=', 70)
                ->where('confidence', '>=', 60);
        }

        $signals = $query
            ->orderByDesc('detected_at')
            ->orderByDesc('strength')
            ->get();

        $allActive = AiSalesSignal::query()
            ->where(function ($q) use ($now) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', $now);
            })
            ->get();

        $types = $allActive
            ->groupBy('type')
            ->map(function ($items, $type) {
                return [
                    'type' => $type,
                    'count' => $items->count(),

                    'average_strength' => round(
                        (float) $items->avg('strength'),
                        1
                    ),

                    'average_confidence' => round(
                        (float) $items->avg('confidence'),
                        1
                    ),
                ];
            })
            ->sortByDesc('count')
            ->values();

        $companies = AiSalesCompany::query()
            ->select(
                'id',
                'name',
                'industry',
                'city',
                'region',
                'country'
            )
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $signals
                ->map(
                    fn (AiSalesSignal $signal) =>
                        $this->signalRow($signal)
                )
                ->values(),

            'summary' => [
                'active_signals' =>
                    $allActive->count(),

                'high_intent' => $allActive
                    ->filter(
                        fn ($signal) =>
                            (int) ($signal->strength ?? 0) >= 70
                            &&
                            (int) ($signal->confidence ?? 0) >= 60
                    )
                    ->count(),

                'companies_with_signals' => $allActive
                    ->pluck('company_id')
                    ->unique()
                    ->count(),

                'average_strength' => $allActive->count()
                    ? round(
                        (float) $allActive->avg('strength'),
                        1
                    )
                    : 0,

                'average_confidence' => $allActive->count()
                    ? round(
                        (float) $allActive->avg('confidence'),
                        1
                    )
                    : 0,
            ],

            'types' => $types,

            'companies' => $companies,

            'filters' => [
                'type' =>
                    $request->input('type'),

                'company_id' =>
                    $request->input('company_id'),

                'min_strength' =>
                    (int) $request->input(
                        'min_strength',
                        0
                    ),

                'high_intent' =>
                    $request->boolean('high_intent'),
            ],

            'meta' => [
                'generated_at' =>
                    now()->toISOString(),

                'active_definition' =>
                    'expires_at is empty or has not passed',
            ],
        ]);
    }

    public function store(
        Request $request,
        AiSalesCompany $company,
        ScoringEngine $scoringEngine
    ) {
        $data = $request->validate([
            'type' =>
                'required|string|max:100',

            'title' =>
                'required|string|max:255',

            'description' =>
                'nullable|string',

            'strength' =>
                'nullable|integer|min:0|max:100',

            'confidence' =>
                'nullable|integer|min:0|max:100',

            'source' =>
                'nullable|string|max:120',

            'source_url' =>
                'nullable|string|max:2048',

            'evidence' =>
                'nullable|array',

            'detected_at' =>
                'nullable|date',

            'expires_at' =>
                'nullable|date|after_or_equal:detected_at',
        ]);

        $data['type'] =
            $this->normalizeType(
                $data['type']
            );

        $data['detected_at'] =
            $data['detected_at']
            ?? now();

        $data['strength'] =
            $data['strength']
            ?? 50;

        $data['confidence'] =
            $data['confidence']
            ?? 50;

        $signal = $company
            ->signals()
            ->create($data);

        /*
        |--------------------------------------------------------------------------
        | Refresh Company AI Score
        |--------------------------------------------------------------------------
        |
        | Buying signals directly affect Intent and Timing.
        | Refresh the persisted score immediately so Company 360,
        | Map and other AI Sales workspaces use the updated intelligence.
        |
        */

        $score =
            $scoringEngine->scoreCompany(
                $company->fresh()
            );

        $signal->load([
            'company:id,name,industry,city,region,country,status',
            'company.latestScore',
        ]);

        return response()->json([
            'message' =>
                'Buying signal created and company score refreshed.',

            'data' =>
                $this->signalRow($signal),

            'score' => [
                'fit_score' =>
                    (int) $score->fit_score,

                'intent_score' =>
                    (int) $score->intent_score,

                'timing_score' =>
                    (int) $score->timing_score,

                'confidence_score' =>
                    (int) $score->confidence_score,

                'overall_score' =>
                    (int) $score->overall_score,

                'scored_at' =>
                    optional(
                        $score->scored_at
                    )?->toISOString(),
            ],
        ], 201);
    }

    private function signalRow(
        AiSalesSignal $signal
    ): array {
        $company =
            $signal->company;

        $latestScore =
            $company?->latestScore;

        return [
            'id' =>
                $signal->id,

            'company_id' =>
                $signal->company_id,

            'type' =>
                $signal->type,

            'title' =>
                $signal->title,

            'description' =>
                $signal->description,

            'strength' =>
                (int) ($signal->strength ?? 0),

            'confidence' =>
                (int) ($signal->confidence ?? 0),

            'source' =>
                $signal->source,

            'source_url' =>
                $signal->source_url,

            'evidence' =>
                $signal->evidence ?? [],

            'detected_at' =>
                optional(
                    $signal->detected_at
                )?->toISOString(),

            'expires_at' =>
                optional(
                    $signal->expires_at
                )?->toISOString(),

            'company' => $company
                ? [
                    'id' =>
                        $company->id,

                    'name' =>
                        $company->name,

                    'industry' =>
                        $company->industry,

                    'city' =>
                        $company->city,

                    'region' =>
                        $company->region,

                    'country' =>
                        $company->country,

                    'status' =>
                        $company->status,

                    'ai_score' =>
                        $latestScore
                            ? (int) $latestScore->overall_score
                            : 0,
                ]
                : null,
        ];
    }

    private function normalizeType(
        string $type
    ): string {
        return str($type)
            ->lower()
            ->trim()
            ->replace(
                [' ', '-'],
                '_'
            )
            ->replaceMatches(
                '/[^a-z0-9_]+/',
                ''
            )
            ->toString();
    }
}