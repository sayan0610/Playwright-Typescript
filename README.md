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
```

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.

## License

This project is licensed under the MIT License.