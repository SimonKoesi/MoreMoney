import { defineConfig } from '@playwright/test';
import path from 'node:path';
const requestedBrowser = process.env.MOREMONEY_TEST_BROWSER;
const browser: { browserName?: 'chromium' | 'firefox' | 'webkit'; channel?: string } = requestedBrowser === 'webkit' || requestedBrowser === 'firefox' || requestedBrowser === 'chromium'
  ? {browserName:requestedBrowser}
  : {channel:'msedge'};

export default defineConfig({testDir:'e2e',fullyParallel:false,workers:1,use:{baseURL:'http://127.0.0.1:3210',...browser,trace:'retain-on-failure'},webServer:{command:'npm run dev -- --port 3210',url:'http://127.0.0.1:3210',reuseExistingServer:false,env:{FINOVA_DATA_DIR:path.resolve('test-results/database-'+Date.now())},timeout:120000}});
