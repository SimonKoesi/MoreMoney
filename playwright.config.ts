import { defineConfig } from '@playwright/test';
import path from 'node:path';
export default defineConfig({testDir:'e2e',fullyParallel:false,workers:1,use:{baseURL:'http://127.0.0.1:3210',channel:'msedge',trace:'retain-on-failure'},webServer:{command:'npm run dev -- --port 3210',url:'http://127.0.0.1:3210',reuseExistingServer:false,env:{FINOVA_DATA_DIR:path.resolve('test-results/database-'+Date.now())},timeout:120000}});
