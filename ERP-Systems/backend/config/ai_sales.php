<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Discovery Provider
    |--------------------------------------------------------------------------
    |
    | development  -> Local development dataset
    | google_places -> Google Places API
    |
    */

    'discovery_provider' => env(
        'AI_SALES_DISCOVERY_PROVIDER',
        'development'
    ),

];