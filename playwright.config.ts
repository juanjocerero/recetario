import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI
	},
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry', // Record trace for the first retry of a failed test
		screenshot: 'only-on-failure', // Capture screenshot on test failure
		video: 'on-first-retry', // Record video of the test run on first retry
		// launchOptions: { devtools: true } // Enable devtools (can be noisy for automated runs)
	},
	testDir: 'e2e',
	reporter: 'html', // Changed to html reporter
	outputDir: 'playwright-report' // Explicitly set output directory
});