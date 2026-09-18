#!/usr/bin/env bash
set -euo pipefail
php artisan optimize:clear
php artisan migrate:status
for f in $(find database/migrations -maxdepth 1 -type f -name '*ai_sales*.php' | sort); do php artisan migrate --path="$f" --force; done
php artisan route:list --path=api/ai-sales
