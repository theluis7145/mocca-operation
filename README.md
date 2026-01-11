# Mocca Operation

A web-based operation manual and work session management system,  
designed with **stability, testability, and long-term maintainability** in mind.

This project demonstrates a production-ready setup with **unit tests, E2E tests, and CI automation**.

---

## ✨ Features

- 🔐 Authentication & protected routes (NextAuth)
- 📘 Operation manuals with structured content
- 🕒 Work session tracking (start / complete)
- 📷 Photo upload & preview support
- 🧠 API caching for performance and stability
- 🧪 Comprehensive automated testing

---

## 🧱 Tech Stack

- **Framework**: Next.js (App Router)
- **Authentication**: NextAuth
- **Database**: Prisma
- **Testing**
  - Jest (Unit & integration tests)
  - Playwright (E2E tests)
- **Quality & Automation**
  - ESLint
  - GitHub Actions (CI)

---

## 🧪 Testing Strategy

This project prioritizes *“not breaking existing behavior”*.

- **Unit Tests (Jest)**
  - Business logic
  - Hooks & utilities
- **E2E Tests (Playwright)**
  - Authentication flow
  - Protected routes
  - Core user workflows
- **CI**
  - Automatically runs lint, unit tests, and E2E tests on every push

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all

```

npm install
npm run dev

This project is currently published without an open-source license.
Commercial use, redistribution, or resale may require permission from the author.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

> Note: Some pages intentionally use `<img>` (instead of `next/image`) due to viewer/preview behavior and compatibility needs. ESLint warnings are allowed for this case.
