<?php

namespace Tests\Feature;

use Tests\TestCase;

class SalesSystemSmokeTest extends TestCase
{
    public function test_sales_system_health_endpoint_responds(): void
    {
        $response = $this->getJson('/api/sales/system-health');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'database',
                'tables',
                'missing',
            ]);
    }

    public function test_core_sales_routes_exist(): void
    {
        foreach ([
            '/api/branches',
            '/api/customers',
            '/api/sales/leads',
            '/api/sales/opportunities',
            '/api/sales/pipeline/summary',
            '/api/sales/orders',
            '/api/sales/contracts',
            '/api/sales/forecast',
            '/api/sales/credit-control',
            '/api/sales/renewals',
            '/api/sales/ai/command-center',
        ] as $uri) {
            $response = $this->getJson($uri);
            $this->assertNotEquals(404, $response->status(), "Missing route: {$uri}");
        }
    }
}
