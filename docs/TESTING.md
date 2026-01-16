# Testing

This project uses:

- **Vitest** for unit tests
- **Playwright** for end-to-end (E2E) tests

## Local setup

Install dependencies:

```bash
npm install
```

Install Playwright browsers (first time only):

```bash
npx playwright install
```

## Run tests

Unit tests:

```bash
npm run test:unit
```

E2E tests:

```bash
npm run test:e2e
```

Run everything:

```bash
npm test
```

## Helpful commands

Open Playwright UI mode:

```bash
npm run test:e2e:ui
```

View the last HTML report after an E2E run:

```bash
npx playwright show-report
```
