# Playwright Testing Project

This project is set up for web and API testing using Playwright, with Allure reporting integrated for better test reporting and visualization.

## Project Structure

```
playwright-testing-project
├── src
│   ├── tests
│   │   ├── web
│   │   │   └── example-web-test.spec.ts
│   │   ├── api
│   │   │   └── example-api-test.spec.ts
│   ├── utils
│   │   └── helpers.ts
│   └── config
│       └── test-config.ts
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── README.md
└── allure-results
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd playwright-testing-project
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Configure your environment:**
   Update the `src/config/test-config.ts` file with your specific settings, such as base URLs and timeouts.

## Running Tests

To run the tests, use the following command:

```
npx playwright test
```

## Generating Allure Reports

After running the tests, you can generate the Allure report by executing:

```
npx allure generate allure-results --clean -o allure-report
```

To view the report, use:

```
npx allure open allure-report

## Allure Aggregation (Cross-Browser / CI)

The CI workflow runs the Playwright test suite separately for each browser (Chromium, Firefox, WebKit) and uploads a distinct raw results artifact per browser (named `allure-results-<browser>`). A follow-up aggregation job downloads all of these artifacts, merges them, and generates a unified HTML report artifact (`allure-report-merged`).

### How It Works in CI

1. Matrix job executes for each browser and saves its `allure-results` as `allure-results-<browser>`.
2. The `aggregate-allure` job (always runs, even on failures) downloads all matching artifacts with a glob pattern and merges them by placing contents into a single directory (`merged-allure-results`).
3. Allure CLI generates a combined report published as the `allure-report-merged` artifact.

### Local Aggregation (Optional)

If you want to reproduce a merged multi-run report locally:

1. Run each browser separately directing results to distinct folders:
   ```bash
   npx playwright test --project=chromium --output=playwright-report/chromium --reporter=line,allure-playwright
   mv allure-results allure-results-chromium
   npx playwright test --project=firefox --output=playwright-report/firefox --reporter=line,allure-playwright
   mv allure-results allure-results-firefox
   npx playwright test --project=webkit --output=playwright-report/webkit --reporter=line,allure-playwright
   mv allure-results allure-results-webkit
   ```
2. Merge the result directories:
   ```bash
   mkdir merged-allure-results
   cp -R allure-results-*/* merged-allure-results/
   ```
3. Generate & open the unified report:
   ```bash
   npx allure generate merged-allure-results --clean -o merged-allure-report
   npx allure open merged-allure-report
   ```

### Troubleshooting

* Missing merged report: ensure at least one `allure-results-<browser>` artifact contained files (failures early in tests may still produce results; if no tests ran, directory can be empty).
* Duplicate test cases: Allure groups by test full name + suite path; if you intentionally want per-browser differentiation, include the project name in the test title or add a label via a Playwright test hook.
* Large history retention: Add a `history` folder inside `merged-allure-results` before generation to preserve trend data across runs.

### Custom Labels / Metadata

You can enrich results with labels (e.g., severity, feature) using Allure annotations inside tests. Example:
```ts
import { test } from '@playwright/test';
// @ts-ignore
import { allure } from 'allure-playwright';

test('critical feature flow', async ({ page }) => {
  allure.label('feature', 'Tasks');
  allure.severity('critical');
  // test steps...
});
```

This metadata will appear automatically in the aggregated report.
```

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.

## License

This project is licensed under the MIT License.