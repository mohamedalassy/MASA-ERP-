<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AiSalesCompanyController;
use App\Http\Controllers\Api\AiSalesSignalController;
use App\Http\Controllers\Api\AiSalesScoreController;
use App\Http\Controllers\Api\AiSalesLeadController;
use App\Http\Controllers\Api\AiSalesOpportunityController;
use App\Http\Controllers\Api\AiSalesDashboardController;
use App\Http\Controllers\Api\AiSalesWorkspaceController;
use App\Http\Controllers\Api\AiSalesAdvancedController;
use App\Http\Controllers\Api\AiSalesAutomationController;
use App\Http\Controllers\Api\AiSalesDataController;
use App\Http\Controllers\Api\AiSalesExpansionOneController;
use App\Http\Controllers\Api\AiSalesExpansionAllController;
use App\Http\Controllers\Api\AiSalesIntelligenceController;

Route::prefix('ai-sales')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Catalog & Dashboard
    |--------------------------------------------------------------------------
    */

    Route::get('/catalog', [
        AiSalesWorkspaceController::class,
        'catalog'
    ]);

    Route::get('/dashboard', [
        AiSalesDashboardController::class,
        'index'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Companies
    |--------------------------------------------------------------------------
    */

    Route::get('/companies', [
        AiSalesCompanyController::class,
        'index'
    ]);

    Route::post('/companies', [
        AiSalesCompanyController::class,
        'store'
    ]);

    Route::get('/companies/{company}', [
        AiSalesCompanyController::class,
        'show'
    ]);

    Route::put('/companies/{company}', [
        AiSalesCompanyController::class,
        'update'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Buying Signals Radar
    |--------------------------------------------------------------------------
    */

    Route::get('/signals', [
        AiSalesSignalController::class,
        'index'
    ]);

    Route::post('/companies/{company}/signals', [
        AiSalesSignalController::class,
        'store'
    ]);

    Route::post('/companies/{company}/score', [
        AiSalesScoreController::class,
        'store'
    ]);

    Route::post('/companies/{company}/leads', [
        AiSalesLeadController::class,
        'store'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Leads
    |--------------------------------------------------------------------------
    */

    Route::get('/leads', [
        AiSalesLeadController::class,
        'index'
    ]);

    Route::get('/leads/{lead}', [
        AiSalesLeadController::class,
        'show'
    ]);
/*
|--------------------------------------------------------------------------
| Company Geocoding
|--------------------------------------------------------------------------
*/

Route::post('/companies/{company}/geocode', [
    AiSalesIntelligenceController::class,
    'geocodeCompany'
]);

Route::post('/geocoding/run', [
    AiSalesIntelligenceController::class,
    'geocodePending'
]);
    /*
    |--------------------------------------------------------------------------
    | Opportunities
    |--------------------------------------------------------------------------
    */

    Route::get('/opportunities', [
        AiSalesOpportunityController::class,
        'index'
    ]);

    Route::post('/opportunities', [
        AiSalesOpportunityController::class,
        'store'
    ]);

    Route::get('/opportunities/{opportunity}', [
        AiSalesOpportunityController::class,
        'show'
    ]);

    Route::put('/opportunities/{opportunity}', [
        AiSalesOpportunityController::class,
        'update'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Contacts
    |--------------------------------------------------------------------------
    */

    Route::get('/contacts', [
        AiSalesWorkspaceController::class,
        'contacts'
    ]);

    Route::post('/contacts', [
        AiSalesWorkspaceController::class,
        'storeContact'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Tasks
    |--------------------------------------------------------------------------
    */

    Route::get('/tasks', [
        AiSalesWorkspaceController::class,
        'tasks'
    ]);

    Route::post('/tasks', [
        AiSalesWorkspaceController::class,
        'storeTask'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Communications
    |--------------------------------------------------------------------------
    */

    Route::get('/communications', [
        AiSalesWorkspaceController::class,
        'communications'
    ]);

    Route::post('/communications', [
        AiSalesWorkspaceController::class,
        'storeCommunication'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Tenders
    |--------------------------------------------------------------------------
    */

    Route::get('/tenders', [
        AiSalesWorkspaceController::class,
        'tenders'
    ]);

    Route::post('/tenders', [
        AiSalesWorkspaceController::class,
        'storeTender'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Playbooks
    |--------------------------------------------------------------------------
    */

    Route::get('/playbooks', [
        AiSalesWorkspaceController::class,
        'playbooks'
    ]);

    Route::post('/playbooks', [
        AiSalesWorkspaceController::class,
        'storePlaybook'
    ]);

    /*
    |--------------------------------------------------------------------------
    | AI Sales Settings
    |--------------------------------------------------------------------------
    */

    Route::get('/settings', [
        AiSalesWorkspaceController::class,
        'settings'
    ]);

    Route::put('/settings', [
        AiSalesWorkspaceController::class,
        'saveSetting'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Territories & Activities
    |--------------------------------------------------------------------------
    */

    Route::get('/territories', [
        AiSalesAdvancedController::class,
        'territories'
    ]);

    Route::post('/territories', [
        AiSalesAdvancedController::class,
        'storeTerritory'
    ]);

    Route::put('/territories/{territory}', [
        AiSalesAdvancedController::class,
        'updateTerritory'
    ]);

    Route::get('/activities', [
        AiSalesAdvancedController::class,
        'activities'
    ]);

    /*
    |--------------------------------------------------------------------------
    | AI Messages
    |--------------------------------------------------------------------------
    */

    Route::post('/companies/{company}/compose-message', [
        AiSalesAdvancedController::class,
        'compose'
    ]);

    Route::get('/message-drafts', [
        AiSalesAdvancedController::class,
        'drafts'
    ]);

    Route::post('/message-drafts/{draft}/approve', [
        AiSalesAdvancedController::class,
        'approveDraft'
    ]);

    /*
    |--------------------------------------------------------------------------
    | AI Command Center & Analytics
    |--------------------------------------------------------------------------
    */

    Route::post('/command', [
        AiSalesAdvancedController::class,
        'command'
    ]);

    Route::get('/analytics', [
        AiSalesAdvancedController::class,
        'analytics'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Automation
    |--------------------------------------------------------------------------
    */

    Route::get('/automation-rules', [
        AiSalesAutomationController::class,
        'rules'
    ]);

    Route::post('/automation-rules', [
        AiSalesAutomationController::class,
        'storeRule'
    ]);

    Route::post('/automation/run', [
        AiSalesAutomationController::class,
        'run'
    ]);

    Route::post('/leads/{lead}/qualify', [
        AiSalesAutomationController::class,
        'qualify'
    ]);

    Route::post('/opportunities/{opportunity}/analyze', [
        AiSalesAutomationController::class,
        'analyze'
    ]);

    Route::post('/companies/{company}/next-best-action', [
        AiSalesAutomationController::class,
        'nextAction'
    ]);

    Route::get('/recommendations', [
        AiSalesAutomationController::class,
        'recommendations'
    ]);

    Route::put('/recommendations/{recommendation}', [
        AiSalesAutomationController::class,
        'updateRecommendation'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Data Quality
    |--------------------------------------------------------------------------
    */

    Route::post('/companies/{company}/quality-check', [
        AiSalesDataController::class,
        'qualityCompany'
    ]);

    Route::get('/companies/{company}/duplicates', [
        AiSalesDataController::class,
        'duplicates'
    ]);

    Route::post('/contacts/{contact}/quality-check', [
        AiSalesDataController::class,
        'qualityContact'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Import / Export
    |--------------------------------------------------------------------------
    */

    Route::post('/imports/csv', [
        AiSalesDataController::class,
        'importCsv'
    ]);

    Route::get('/imports', [
        AiSalesDataController::class,
        'importBatches'
    ]);

    Route::get('/exports/companies.csv', [
        AiSalesDataController::class,
        'exportCompanies'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Integrations
    |--------------------------------------------------------------------------
    */

    Route::get('/integrations', [
        AiSalesDataController::class,
        'integrations'
    ]);

    Route::post('/integrations', [
        AiSalesDataController::class,
        'storeIntegration'
    ]);

    /*
    |--------------------------------------------------------------------------
    | ICP & Product Market Matching
    |--------------------------------------------------------------------------
    */

    Route::get('/icp-profiles', [
        AiSalesExpansionOneController::class,
        'icps'
    ]);

    Route::post('/icp-profiles', [
        AiSalesExpansionOneController::class,
        'storeIcp'
    ]);

    Route::post('/companies/{company}/market-match', [
        AiSalesExpansionOneController::class,
        'match'
    ]);

    Route::get('/companies/{company}/market-matches', [
        AiSalesExpansionOneController::class,
        'matches'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Intent / Buying Committee / Relationships
    |--------------------------------------------------------------------------
    */

    Route::get('/companies/{company}/intent-timeline', [
        AiSalesExpansionOneController::class,
        'timeline'
    ]);

    Route::get('/companies/{company}/buying-committee', [
        AiSalesExpansionOneController::class,
        'committee'
    ]);

    Route::post('/companies/{company}/buying-committee', [
        AiSalesExpansionOneController::class,
        'storeCommittee'
    ]);

    Route::get('/companies/{company}/relationship-graph', [
        AiSalesExpansionOneController::class,
        'graph'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Competitors & Watchlists
    |--------------------------------------------------------------------------
    */

    Route::get('/competitors', [
        AiSalesExpansionOneController::class,
        'competitors'
    ]);

    Route::post('/competitors', [
        AiSalesExpansionOneController::class,
        'storeCompetitor'
    ]);

    Route::get('/watchlists', [
        AiSalesExpansionOneController::class,
        'watchlists'
    ]);

    Route::post('/watchlists', [
        AiSalesExpansionOneController::class,
        'storeWatchlist'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Revenue Intelligence
    |--------------------------------------------------------------------------
    */

    Route::post('/companies/{company}/revenue-scan', [
        AiSalesExpansionAllController::class,
        'revenue'
    ]);

    Route::get('/forecast', [
        AiSalesExpansionAllController::class,
        'forecast'
    ]);

    Route::get('/daily-brief', [
        AiSalesExpansionAllController::class,
        'dailyBrief'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Deal Intelligence
    |--------------------------------------------------------------------------
    */

    Route::get('/opportunities/{opportunity}/deal-room', [
        AiSalesExpansionAllController::class,
        'dealRoom'
    ]);

    Route::post('/opportunities/{opportunity}/win-loss', [
        AiSalesExpansionAllController::class,
        'winLoss'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Targets
    |--------------------------------------------------------------------------
    */

    Route::get('/targets', [
        AiSalesExpansionAllController::class,
        'targets'
    ]);

    Route::post('/targets', [
        AiSalesExpansionAllController::class,
        'storeTarget'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Meetings
    |--------------------------------------------------------------------------
    */

    Route::get('/meetings', [
        AiSalesExpansionAllController::class,
        'meetings'
    ]);

    Route::post('/meetings', [
        AiSalesExpansionAllController::class,
        'storeMeeting'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Feedback / Governance / Consent
    |--------------------------------------------------------------------------
    */

    Route::post('/feedback', [
        AiSalesExpansionAllController::class,
        'feedback'
    ]);

    Route::get('/governance', [
        AiSalesExpansionAllController::class,
        'governance'
    ]);

    Route::post('/consent', [
        AiSalesExpansionAllController::class,
        'consent'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Knowledge Base
    |--------------------------------------------------------------------------
    */

    Route::get('/knowledge', [
        AiSalesExpansionAllController::class,
        'knowledge'
    ]);

    Route::post('/knowledge', [
        AiSalesExpansionAllController::class,
        'storeKnowledge'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Webhooks
    |--------------------------------------------------------------------------
    */

    Route::get('/webhooks', [
        AiSalesExpansionAllController::class,
        'webhooks'
    ]);

    Route::post('/webhooks', [
        AiSalesExpansionAllController::class,
        'storeWebhook'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Tender Intelligence
    |--------------------------------------------------------------------------
    */

    Route::post('/tenders/analyze-text', [
        AiSalesExpansionAllController::class,
        'tenderAnalyze'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Catalog Intelligence
    |--------------------------------------------------------------------------
    */

    Route::post('/catalog/sync', [
        AiSalesIntelligenceController::class,
        'syncCatalog'
    ]);

    Route::get('/catalog-profiles', [
        AiSalesIntelligenceController::class,
        'catalogProfiles'
    ]);

    Route::post('/catalog-profiles', [
        AiSalesIntelligenceController::class,
        'storeCatalogProfile'
    ]);

    /*
    |--------------------------------------------------------------------------
    | AI Discovery
    |--------------------------------------------------------------------------
    */

    Route::get('/discovery-runs', [
        AiSalesIntelligenceController::class,
        'discoveryRuns'
    ]);

    // Real external market discovery
    Route::post('/discovery/run', [
        AiSalesIntelligenceController::class,
        'runDiscovery'
    ]);

    // Manual / integration ingestion
    Route::post('/discovery/ingest', [
        AiSalesIntelligenceController::class,
        'ingest'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Enrichment & Scoring
    |--------------------------------------------------------------------------
    */

    Route::post('/companies/{company}/enrich', [
        AiSalesIntelligenceController::class,
        'enrich'
    ]);

    Route::post('/companies/{company}/auto-score', [
        AiSalesIntelligenceController::class,
        'score'
    ]);

    Route::post('/score-all', [
        AiSalesIntelligenceController::class,
        'scoreAll'
    ]);
});
