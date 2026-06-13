#!/usr/bin/env ts-node
/**
 * Activity Aggregation Script
 *
 * Run via cron every 5 minutes:
 */5 * * * * cd /app && npx ts-node scripts/aggregate.ts
 *
 * Or via Docker:
 *   docker compose exec api npx ts-node scripts/aggregate.ts
 */

import { getActivityAggregator } from '../services/activity-aggregator';

async function main() {
  const aggregator = getActivityAggregator();
  await aggregator.runAll();
  process.exit(0);
}

main().catch(err => {
  console.error('Aggregation failed:', err);
  process.exit(1);
});
