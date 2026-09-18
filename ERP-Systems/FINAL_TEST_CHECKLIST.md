# MASA ERP Sales — Final Integration Test

## 1. Install all backend phases in order
Phase 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> Phase 7.

## 2. Route setup
At bottom of `backend/routes/api.php`:
```php
require __DIR__ . '/sales-all.php';
require __DIR__ . '/sales-health.php';
```

Remove the duplicate quotation submit-for-approval route.

## 3. Backend commands
```bat
cd ERP-Systems\backend
php artisan optimize:clear
composer dump-autoload
php artisan migrate
php artisan route:list
php artisan test
```

## 4. Health endpoint
Open:
`GET http://127.0.0.1:8000/api/sales/system-health`

Expected:
- `success: true`
- `missing: []`

## 5. Seed/basic foundation verification
Check:
- `/api/branches`
- `/api/departments`
- `/api/customers`

## 6. Full workflow test
Create:
1. Lead
2. Convert Lead -> Opportunity
3. Create Project from Opportunity
4. Create/approve quotation in existing Pricing module
5. Convert approved quotation -> Sales Order
6. Confirm Sales Order
7. If shortage exists -> create Purchase Order
8. Receive PO through `/receive-branch`
9. Deliver Sales Order
10. Create invoice
11. Post invoice
12. Collect payment
13. Verify project closes when invoice is fully paid

## 7. Intelligence test
Run:
- POST `/api/sales/deal-health/refresh`
- POST `/api/sales/revenue-leakage/detect`
- POST `/api/sales/credit-control/refresh`
- POST `/api/sales/renewals/generate`
- POST `/api/sales/ai/opportunities/score-all`

Then view:
- `/api/sales/ai/command-center`

## 8. Frontend
```bat
cd ERP-Systems\frontend
npm.cmd install
npm.cmd run build
npm.cmd run dev
```

## 9. Browser validation
Open Sales and switch:
- All Branches
- Dammam branch

Verify every Sales page refreshes with the selected branch.

## 10. Production hardening after successful workflow
- Wire Login/Sanctum
- Protect mutation routes
- Add roles/permissions
- Remove `/sales/system-health` or protect it
- Add scheduled jobs for intelligence refresh
- Add DB backups before deployment
