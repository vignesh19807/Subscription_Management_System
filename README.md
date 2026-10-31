# Subscription Management System (LoopBill)

> **Unified Subscription Lifecycle, Recurring Billing & Financial Management Platform**  
> Built for **Brightloop Software** as part of the **Odoo Hackathon** Master Build Specification.

---

[![Project Status: Phase 0 - Scaffolding & Architecture](https://img.shields.io/badge/Status-Phase%200%3A%20Scaffolding%20%26%20Design-blue?style=flat-square)](#17-current-project-status--audit-certification)
[![Implementation Stage](https://img.shields.io/badge/Stage-Early%20Development%20(Planning)-orange?style=flat-square)](#17-current-project-status--audit-certification)
[![Version Control: Git](https://img.shields.io/badge/VCS-Git-F05032?style=flat-square&logo=git&logoColor=white)](#7-verified-vs-planned-technology-stack)
[![Documentation: Master Spec Audited](https://img.shields.io/badge/Docs-Master%20Spec%20Audited-success?style=flat-square)](#17-current-project-status--audit-certification)
[![License: Proprietary / TBD](https://img.shields.io/badge/License-Proprietary%20%2F%20TBD-lightgrey?style=flat-square)](#)

---

## Table of Contents

- [1. Project Identity & Context](#1-project-identity--context)
- [2. Executive Overview](#2-executive-overview)
- [3. Problem Statement & Proposed Solution](#3-problem-statement--proposed-solution)
- [4. The Seven Mandatory Business Scenes](#4-the-seven-mandatory-business-scenes)
- [5. Core Architectural & Financial Invariants](#5-core-architectural--financial-invariants)
- [6. Feature Matrix & Implementation Classification](#6-feature-matrix--implementation-classification)
- [7. Verified vs. Planned Technology Stack](#7-verified-vs-planned-technology-stack)
- [8. System Architecture & Data Flow](#8-system-architecture--data-flow)
- [9. Actual vs. Target Directory Structure](#9-actual-vs-target-directory-structure)
- [10. Database Schema & Business Entities](#10-database-schema--business-entities)
- [11. Development Roadmap](#11-development-roadmap)
- [12. Team Structure & Work Allocation](#12-team-structure--work-allocation)
- [13. Development & Collaboration Workflow](#13-development--collaboration-workflow)
- [14. Preliminary Installation & Setup Guide](#14-preliminary-installation--setup-guide)
- [15. Acceptance Criteria & 17-Step Demo Journey](#15-acceptance-criteria--17-step-demo-journey)
- [16. Scope Exclusions & Future Improvements](#16-scope-exclusions--future-improvements)
- [17. Current Project Status & Audit Certification](#17-current-project-status--audit-certification)

---

## 1. Project Identity & Context

- **Official Repository Name:** `Subscription_Management_System`
- **Working / Brand Title:** LoopBill
- **Hackathon Context:** Odoo Hackathon Challenge — Subscription Management & Recurring Billing Platform
- **Target Organization:** Brightloop Software (Fictional subscription software provider)
- **Authoritative Reference:** Brightloop Software Master Build Specification
- **Implementation Status:** **Phase 0 (Initial Scaffolding)**. The repository currently contains version control tracking and audited technical documentation. Application codebases (frontend, backend, database migrations) are in design and scheduled for immediate Phase 1 implementation.

---

## 2. Executive Overview

### What LoopBill Is
**LoopBill** is an automated, API-driven subscription lifecycle and recurring billing management platform. It centralizes customer onboarding, product catalog definitions, recurring plan scheduling, quotation conversion, automated invoice generation, payment ledger tracking, customer self-service, and financial analytics into a single authoritative system of record.

### Why Brightloop Software Needs This System
Brightloop Software sells recurring software subscriptions (monthly, yearly, and custom cycles). Manual operations relying on spreadsheets, disconnected invoicing, and manual payment follow-ups cause severe revenue leakage, billing duplication, missed renewal deadlines, pricing errors, and administrative drag. LoopBill replaces these fragile workflows with an automated digital manager engineered with strict mathematical accuracy and auditability.

### Operational Principles
- **Offline / Local-First Operation:** The platform runs entirely in local development without mandatory external CDN dependencies. All fonts, styles, and icons are bundled locally.
- **Transactional Precision:** Eliminates rounding errors by enforcing exact fixed-point decimal arithmetic across all financial transactions.
- **Tenant Isolation:** Enforces customer-level data isolation via backend ownership validation, preventing Insecure Direct Object References (IDOR).
- **Zero-Friction Email Verification:** Includes an internal simulated email outbox for development and auditing, making external SMTP integration optional.

---

## 3. Problem Statement & Proposed Solution

### The Core Challenges
Brightloop Software currently suffers from six operational failure points:
1. **Missed Renewals & Revenue Leakage:** Subscriptions lapse silently without automated renewals or billing generation.
2. **Duplicate or Skipped Invoices:** Manual billing execution results in human errors where customers are billed twice or omitted.
3. **Product & Variant Pricing Errors:** Manual calculations fail to accurately reflect complex variant price deltas (e.g., brand-specific licensing surcharges).
4. **Unintended Permanent Discounts:** Expired introductory discounts remain active indefinitely due to missed calendar reminders.
5. **Payment Reconciliation Gaps:** Inability to track partial payments, reconcile outstanding receivables, or distinguish overdue debt.
6. **Absence of Customer Self-Service:** Inability for clients to review invoices, manage recurring add-ons, or request plan pauses.

### The Unified Solution Lifecycle
LoopBill connects all billing touchpoints into a unified, auditable lifecycle:

$$\text{Product Catalog} \longrightarrow \text{Billing Plans} \longrightarrow \text{Quotations} \longrightarrow \text{Subscriptions} \longrightarrow \text{Recurring Invoices} \longrightarrow \text{Payments} \longrightarrow \text{Financial Analytics}$$

```mermaid
flowchart LR
    A["1. Catalog & Variants<br/>(Base + Delta)"] --> B["2. Billing Plans<br/>(Daily/Weekly/Monthly/Yearly)"]
    B --> C["3. Quotation Templates<br/>(Draft → Confirmed)"]
    C --> D["4. Active Subscriptions<br/>(State Machine)"]
    D --> E["5. Billing Day Engine<br/>(Idempotent Invoicing)"]
    E --> F["6. Payment Ledger<br/>(Full/Partial Settlements)"]
    F --> G["7. Financial Analytics<br/>(MRR / Aging Debt)"]
    D -.-> H["Customer Portal<br/>(Isolated Self-Service)"]
    H -.-> D
```

---

## 4. The Seven Mandatory Business Scenes

The Master Build Specification defines seven mandatory end-to-end operational scenes. Each scene is detailed below with its inputs, processing rules, outputs, and current implementation status.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SEVEN MANDATORY BUSINESS SCENES                      │
├───────────────────────────────────┬────────────────────────────────────┤
│ Scene 1: Onboarding & RBAC        │ Scene 5: Billing Day & Invoicing   │
│ Scene 2: Product & Variant Catalog│ Scene 6: Payment Ledger & Settling │
│ Scene 3: Recurring Billing Plans  │ Scene 7: Customer Portal & Finance │
│ Scene 4: Quotations & Lifecycle   │                                    │
└───────────────────────────────────┴────────────────────────────────────┘
```

### Scene 1: Customer Onboarding, Role-Based Access Control & Outbox Authentication
- **Business Purpose:** Provide secure, multi-tier authentication for Administrators, Internal Staff, and Customers.
- **Workflow & Rules:**
  - Public registration provision accounts strictly with the `CUSTOMER` role.
  - Creation of `STAFF` accounts is an administrative privilege restricted exclusively to `ADMIN`.
  - Password policy enforcement: Minimum 9 characters, requiring at least one uppercase letter, one lowercase letter, and one special character, verified with a live UI validation checklist.
  - Authentication sessions use secure HTTP-only cookies and CSRF protection.
  - Password reset requests trigger automated reset tokens logged to the local **Email Outbox** drawer for verification without requiring external mail servers.
- **Implementation Status:** `[Planned - Phase 1 / Phase 2]`

### Scene 2: Product & Multi-Attribute Variant Catalog
- **Business Purpose:** Maintain a centralized catalog of products, cost/sales margins, and variant surcharges.
- **Workflow & Rules:**
  - Supports multiple product types (`SERVICE`, `SOFTWARE`, `HARDWARE`) with independent tracking of sales price and cost price.
  - Variant configuration applies attribute-based price deltas:
    $$\text{Final Unit Price} = \text{Product Base Sales Price} + \text{Variant Price Delta}$$
  - **Authoritative Benchmark Example:**
    - Base Product Sales Price: **₹1,000.00**
    - Odoo Variant Surcharge Delta: **+₹560.00**
    - Authoritative Calculated Unit Price: **₹1,560.00**
  - Prices are calculated authoritatively by the backend; frontend displays provide advisory previews only.
- **Implementation Status:** `[Planned - Phase 2 / Phase 4]`

### Scene 3: Recurring Billing Plan Scheduling & Rule Governance
- **Business Purpose:** Define recurring billing cycles, commitment minimums, and customer lifecycle governance flags.
- **Workflow & Rules:**
  - Supported recurring intervals: **Daily**, **Weekly**, **Monthly**, and **Yearly**.
  - Minimum commitment quantity validation.
  - Validity timeframe gating (`valid_from` to `valid_until`).
  - Automatic closure enforcement upon contract term completion.
  - Explicit plan governance flags enforced authoritatively by the backend:
    - `allow_early_closure`: Permits customer/staff early termination.
    - `allow_pause`: Controls whether active subscriptions may enter the `PAUSED` state.
    - `allow_renewal`: Governs manual and self-service contract extension.
- **Implementation Status:** `[Planned - Phase 2 / Phase 4]`

### Scene 4: Quotation Templates & Subscription Lifecycle State Machine
- **Business Purpose:** Streamline quotation generation, template-driven line item populating, and formal contract activation.
- **Workflow & Rules:**
  - Quotation templates predefine standard line items, terms, and default plan bindings.
  - Automatic non-colliding sequential subscription numbering (e.g., `SUB-2026-0001`).
  - Strict subscription state machine transitions:
    $$\text{DRAFT} \longrightarrow \text{QUOTATION} \longrightarrow \text{CONFIRMED} \longrightarrow \text{ACTIVE} \longrightarrow \text{CLOSED}$$
  - The bidirectional transition $\text{ACTIVE} \rightleftharpoons \text{PAUSED}$ is permitted **only** when the assigned plan has `allow_pause = true`.
  - Expired quotations cannot be confirmed. Recurring add-on modifications take effect starting from the subsequent billing period.
- **Implementation Status:** `[Planned - Phase 3 / Phase 5]`

### Scene 5: Billing Day Execution, Dry-Run Previews & Idempotent Invoicing
- **Business Purpose:** Execute scheduled recurring billing runs without duplicate invoicing or human calculation errors.
- **Workflow & Rules:**
  - **Dry-Run Mode:** Executes full billing simulation, validates contract eligibility, applies discounts and taxes, and produces a complete summary (invoices to create, skips, auto-closures) **without writing any records to the database**.
  - **Real Billing Execution:** Generates official invoices, advances billing periods, and records cycle IDs.
  - **Idempotency Guarantee:** Composite unique constraint on `(subscription_id, billing_cycle_id)` ensures that repeated billing runs on the same date will never create duplicate invoices or skip eligible cycles.
  - **Snapshot Preservation:** Invoices freeze and preserve historical snapshots of product names, variant deltas, base prices, discounts, and tax rates. Future catalog or tax rate changes never alter historical invoices.
  - **Discount Reservation:** Discount usage limits are reserved transactionally upon invoice creation and released back if the invoice is cancelled.
- **Implementation Status:** `[Planned - Phase 4 / Phase 6]`

### Scene 6: Multi-Channel Payment Recording & Balance Reconciliation
- **Business Purpose:** Manage receivables, support multiple payment channels, handle partial payments, and track overdue debt.
- **Workflow & Rules:**
  - Internal payment ledger supporting five payment methods: `BANK_TRANSFER`, `CARD`, `UPI`, `CASH`, and `CHEQUE`.
  - Payments are accepted only against `CONFIRMED` invoices.
  - **Validation Constraint:** Recorded payment amounts cannot exceed the outstanding invoice balance.
  - Supports incremental partial payments.
  - **Derived Invariants:**
    - `PAID` status is never manually assigned; it is dynamically derived when cumulative payments equal the total invoice amount.
    - `OVERDUE` is dynamically computed whenever $\text{current\_date} > \text{due\_date}$ and $\text{outstanding\_balance} > 0$.
  - **Scope Limitation:** Operates as an internal accounting ledger; no cardholder data is collected or stored, and live payment gateway webhooks are excluded from v1.
- **Implementation Status:** `[Planned - Phase 5 / Phase 7]`

### Scene 7: Customer Self-Service Portal & Financial Analytics Workspace
- **Business Purpose:** Empower customers with self-service capabilities while providing management with real-time financial telemetry.
- **Workflow & Rules:**
  - **Customer Portal:** Dedicated views for My Account, My Subscriptions, and My Invoices. Customers can toggle recurring add-ons ("Changes apply from your next invoice") and request pause/renew/close actions strictly when permitted by plan flags.
  - **Strict Tenant Isolation:** Backend enforces `WHERE customer_id = authenticated_user_id` on all customer endpoints.
  - **Finance Dashboard:** Aggregates real-time KPIs: Active Subscriptions, Total Invoiced Revenue, Total Collected Payments, Outstanding Receivables, Overdue Counts, Overdue Amounts, and Monthly Recurring Revenue (MRR).
  - Calculations are executed via database aggregation queries—never by downloading entire datasets into the client browser.
- **Implementation Status:** `[Planned - Phase 6 / Phase 7 / Phase 8]`

---

## 5. Core Architectural & Financial Invariants

To maintain enterprise integrity, LoopBill enforces seventeen non-negotiable architectural and financial rules across all modules:

1. **Variant Surcharge Pricing:** $\text{Unit Price} = \text{Product Base Sales Price} + \text{Variant Price Delta}$.
2. **Authoritative Example:** Selecting the *Odoo Brand* variant adds exactly **₹560.00** to the base price (e.g., ₹1,000.00 base + ₹560.00 delta = ₹1,560.00).
3. **Exact Decimal Arithmetic:** All monetary fields (`sales_price`, `cost_price`, `price_delta`, `subtotal`, `tax_total`, `total_amount`, `amount_paid`) must use `DECIMAL(12, 2)` or `NUMERIC(12, 2)` and fixed-point math libraries (e.g., `decimal.js`). Floating-point IEEE-754 arithmetic is strictly prohibited.
4. **Immutable Invoice Snapshots:** Existing invoices preserve frozen snapshots of line item descriptions, unit prices, variant surcharges, discounts, and applied taxes. Subsequent catalog modifications never mutate historical invoices.
5. **Conditional Discount Rules:** Discounts enforce start/end dates, minimum order quantity, minimum purchase amount, scope (product or subscription), and maximum usage limits.
6. **Transactional Discount Reservation:** Discount usage counts are incremented atomically during invoice generation and released if the invoice is cancelled.
7. **Strict State Machines:** Subscriptions follow $\text{DRAFT} \rightarrow \text{QUOTATION} \rightarrow \text{CONFIRMED} \rightarrow \text{ACTIVE} \rightarrow \text{CLOSED}$. Invoices follow $\text{DRAFT} \rightarrow \text{CONFIRMED} \rightarrow \text{PAID}$ (with $\text{CANCELLED}$ as terminal cancellation).
8. **Authoritative Plan Flag Enforcement:** Plan governance flags (`allow_pause`, `allow_early_closure`, `allow_renewal`) are validated by backend business services, never trusted via frontend UI visibility alone.
9. **Idempotent Billing Runs:** Repeated execution of the billing engine on the same date will never create duplicate invoices or skip eligible renewals.
10. **Zero-Write Dry Runs:** Billing dry-run mode simulates invoice calculations and returns comprehensive projections without writing or altering any database records.
11. **Balance Capping on Payments:** A payment entry cannot exceed the remaining outstanding balance of the target invoice ($\text{Amount} \le \text{Total} - \text{Paid}$).
12. **Derived Settlement Status:** `PAID` status is derived strictly when cumulative verified payments equal the invoice total.
13. **Dynamic Overdue Computation:** `OVERDUE` is calculated dynamically when $\text{today} > \text{due\_date}$ and $\text{amount\_paid} < \text{total\_amount}$.
14. **Backend Customer Data Isolation:** All customer data queries enforce customer ID ownership checks in backend SQL/ORM queries to eliminate IDOR vulnerabilities.
15. **No Live Payment Gateway / Card Storage:** Version 1 operates as an auditable payment ledger; no cardholder data (PAN, CVV) is captured, processed, or stored.
16. **Local Simulated Email Outbox:** System emails (password resets, invoice notices) are written to a local database outbox table, allowing complete local verification without mandatory external SMTP.
17. **Zero CDN Dependencies:** The application must build and run completely offline in local environments; external CDN scripts, styles, or web fonts are prohibited.

---

## 6. Feature Matrix & Implementation Classification

In strict compliance with technical documentation standards, every capability is classified under one of three verified states:
- **Planned:** Fully specified in architecture blueprints; implementation not yet committed.
- **Implemented:** Source code committed in the repository, but testing/verification is incomplete.
- **Verified:** Implemented and validated through automated test suites and operational verification.

| Feature Area | Module / Capability | Target Role | Classification | Verification Notes |
|---|---|---|---|---|
| **Repository & Docs** | Git VCS, Scaffolding, Specification README | All | **Verified** | Committed in repo; audited against Master Spec |
| **Authentication** | Customer Registration (Customer role only) | Customer | **Planned** | Spec Phase 1; 9+ char password policy |
| **Authentication** | Admin Staff Provisioning (Admin only) | Admin | **Planned** | Spec Phase 1; admin-exclusive route |
| **Authentication** | Password Reset & Local Outbox Logging | All | **Planned** | Spec Phase 1; local simulated outbox |
| **Catalog** | Product Creation (Service, Software, Hardware) | Admin/Staff | **Planned** | Spec Phase 2; sales/cost price tracking |
| **Catalog** | Multi-Attribute Variants (+₹560 Odoo delta) | Admin/Staff | **Planned** | Spec Phase 2; additive delta arithmetic |
| **Plans** | Recurring Plans (Daily, Weekly, Monthly, Yearly) | Admin/Staff | **Planned** | Spec Phase 2; min qty, interval governance |
| **Plans** | Plan Flags (`allow_pause`, `allow_early_closure`) | Admin/Staff | **Planned** | Spec Phase 2; backend-enforced policies |
| **Taxes & Discounts** | Tax Rules & Conditional Discounts (Limits/Dates) | Admin/Staff | **Planned** | Spec Phase 2; transactional usage reservation |
| **Quotations** | Quotation Templates & Auto-Numbering (`SUB-...`) | Staff | **Planned** | Spec Phase 3; validity expiration |
| **Subscriptions** | Subscription State Machine & Pausing | Staff/Customer | **Planned** | Spec Phase 3; plan flag checks |
| **Billing Engine** | Dry-Run Mode (Zero database writes) | Admin/Staff | **Planned** | Spec Phase 4; preview simulation |
| **Billing Engine** | Idempotent Scheduled Invoicing | System | **Planned** | Spec Phase 4; cycle constraint guarantee |
| **Invoices** | Immutable Snapshots & Print View | Staff/Customer | **Planned** | Spec Phase 5; print CSS stylesheet |
| **Invoices** | Formal Invoice Cancellation & Reversal | Staff | **Planned** | Spec Phase 5; releases reserved discounts |
| **Payments** | Ledger Entry (Bank, Card, UPI, Cash, Cheque) | Staff | **Planned** | Spec Phase 5; balance limit enforcement |
| **Customer Portal** | Self-Service Dashboard (Isolated View) | Customer | **Planned** | Spec Phase 6; backend tenant isolation |
| **Customer Portal** | Add-on Management ("Next Invoice" rule) | Customer | **Planned** | Spec Phase 6; next-cycle scheduling |
| **Dashboard** | Financial KPIs (MRR, Receivables, Overdue) | Admin/Staff | **Planned** | Spec Phase 7; database aggregations |
| **Outbox Drawer** | Local Simulated Email Outbox Viewer | Admin/Staff | **Planned** | Spec Phase 9; development inspection UI |

---

## 7. Verified vs. Planned Technology Stack

| Layer | Technology | Function & Purpose | Classification |
|---|---|---|---|
| **Version Control** | Git / GitHub | Code hosting, branch isolation, collaboration | **Verified in Repository** |
| **Documentation** | GitHub Flavored Markdown | Authoritative specifications, architecture docs | **Verified in Repository** |
| **Frontend Framework** | React 18 + Vite | Component-based client SPA | *Planned (Phase 1)* |
| **Frontend Language** | TypeScript | Strict type safety, shared domain interfaces | *Planned (Phase 1)* |
| **Styling & Design System**| Tailwind CSS + Local Fonts | Custom design tokens (`#0F172A`, `#F8FAFC`, `#4F46E5`) | *Planned (Phase 1)* |
| **State & Server Cache** | TanStack Query (React Query) | Query caching, refetching, mutation states | *Planned (Phase 1)* |
| **Form Validation** | React Hook Form + Zod | Schema-based client form validation | *Planned (Phase 1)* |
| **Iconography** | Lucide React | Local SVG icons (zero external CDN dependency) | *Planned (Phase 1)* |
| **Backend Framework** | Node.js (Express / TypeScript) | RESTful API controllers, middleware, services | *Planned (Phase 1)* |
| **Database Engine** | PostgreSQL (v14+) / SQLite (dev) | ACID-compliant relational data persistence | *Planned (Phase 1)* |
| **ORM & Migrations** | Prisma ORM | Type-safe schema definition and migration runners | *Planned (Phase 1)* |
| **Financial Arithmetic** | `decimal.js` / Fixed-Point Numeric | Exact decimal calculations without float drift | *Planned (Phase 1)* |
| **Authentication** | HTTP-Only Cookies + JWT + CSRF | Secure session management without localStorage tokens | *Planned (Phase 1)* |
| **Testing Suites** | Vitest, React Testing Library, Supertest| Unit, integration, and API contract test runners | *Planned (Phase 8)* |

---

## 8. System Architecture & Data Flow

LoopBill is architected as a clean four-tier system ensuring strict decoupling between presentation, routing, business services, and relational persistence.

```mermaid
graph TD
    subgraph Tier1 ["1. Client Presentation Tier (React 18 SPA)"]
        CP["Customer Self-Service Portal<br/>(Tenant-Isolated)"]
        AP["Admin & Internal Staff Console<br/>(Full Back-Office)"]
        OUTBOX_UI["Local Email Outbox Drawer<br/>(Audit & Testing)"]
    end

    subgraph Tier2 ["2. Gateway & Security Middleware Tier"]
        ROUTER["REST API Gateway / Express Router"]
        AUTH_MW["Auth Middleware<br/>(Cookie & JWT Validation)"]
        RBAC_MW["RBAC Guard<br/>(ADMIN, STAFF, CUSTOMER)"]
        CSRF_MW["CSRF & Latency Interceptor<br/>(X-Response-Time Tracking)"]
    end

    subgraph Tier3 ["3. Domain Logic & Processing Engine Tier"]
        AUTH_SVC["Identity & User Service"]
        CAT_SVC["Catalog & Variant Service<br/>(Price Delta Calculation)"]
        SUB_SVC["Subscription State Engine<br/>(Lifecycle Transitions)"]
        BILL_ENG["Automated Billing Engine<br/>(Dry-Run & Idempotent Runner)"]
        INV_SVC["Invoice Service<br/>(Snapshot & Calculation Engine)"]
        PAY_SVC["Payment Ledger Service<br/>(Balance Reconciliation)"]
        DASH_SVC["Financial Aggregator<br/>(MRR / Aging Debt)"]
        OUTBOX_SVC["Simulated Email Outbox Service"]
    end

    subgraph Tier4 ["4. Relational Data & Persistence Tier"]
        DB[("PostgreSQL Database<br/>(ACID Transactions / DECIMAL)")]
        MIGRATIONS["Prisma Schema & Migrations"]
    end

    CP -->|"HTTPS / REST (Credentials)"| ROUTER
    AP -->|"HTTPS / REST (Credentials)"| ROUTER
    OUTBOX_UI -->|"HTTPS / REST"| ROUTER

    ROUTER --> CSRF_MW
    CSRF_MW --> AUTH_MW
    AUTH_MW --> RBAC_MW

    RBAC_MW --> AUTH_SVC
    RBAC_MW --> CAT_SVC
    RBAC_MW --> SUB_SVC
    RBAC_MW --> INV_SVC
    RBAC_MW --> PAY_SVC
    RBAC_MW --> DASH_SVC
    RBAC_MW --> OUTBOX_SVC

    BILL_ENG -.->|"Scheduled / Manual Trigger"| SUB_SVC
    BILL_ENG -.->|"Generate Verified Invoices"| INV_SVC
    AUTH_SVC -.->|"Log System Emails"| OUTBOX_SVC
    INV_SVC -.->|"Log Invoice Notices"| OUTBOX_SVC

    AUTH_SVC --> DB
    CAT_SVC --> DB
    SUB_SVC --> DB
    INV_SVC --> DB
    PAY_SVC --> DB
    DASH_SVC --> DB
    OUTBOX_SVC --> DB
    MIGRATIONS -.-> DB
```

---

## 9. Actual vs. Target Directory Structure

### Actual Repository Structure (Current State)
The repository currently contains the root version control files and master technical documentation:
```
Subscription_Management_System/
├── .git/
└── README.md
```

### Proposed Target Directory Structure (Phases 1–10 Blueprint)
The modular monorepo structure below separates frontend, backend, shared types, and documentation:

```
Subscription_Management_System/
├── .github/                       # CI/CD workflows, pull request templates
│   └── workflows/
│       └── ci.yml
├── docs/                          # Architecture specs, API contracts, ER diagrams
├── backend/                       # Backend REST API Application
│   ├── src/
│   │   ├── config/                # Environment variables, database connection
│   │   ├── controllers/           # HTTP controllers (Auth, Catalog, Subscriptions, Billing, Payments)
│   │   ├── middlewares/           # Auth cookie validation, RBAC guards, CSRF, error handler
│   │   ├── models/                # Prisma client instantiation and model delegates
│   │   ├── routes/                # Route definitions (/api/v1/...)
│   │   ├── services/              # Domain services (BillingEngine, PricingCalculator, PaymentLedger)
│   │   └── utils/                 # Exact decimal helpers, date utilities, outbox logger
│   ├── prisma/                    # Schema definition, migrations, and seed scripts
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── tests/                     # Unit, integration, and idempotency test suites
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── server.ts
├── frontend/                      # Frontend Single Page Application
│   ├── public/                    # Favicon, static assets (local fonts)
│   ├── src/
│   │   ├── api/                   # Typed API client, queryClient, response interceptors
│   │   ├── assets/                # Local SVGs and icons
│   │   ├── components/            # Reusable UI primitives
│   │   │   ├── layout/            # AppSidebar, TopNavbar, Breadcrumbs, PageHeader
│   │   │   ├── ui/                # DataTable, StatusBadge, StatusStepper, Modal, MetricCard
│   │   │   └── forms/             # FormField, SearchInput, FilterBar, PasswordChecklist
│   │   ├── features/              # Modular feature domains
│   │   │   ├── auth/              # Login, Register, ResetPassword screens and hooks
│   │   │   ├── catalog/           # Products, Variant deltas (+₹560), Tax rules
│   │   │   ├── plans/             # Recurring plan scheduler, governance flags
│   │   │   ├── subscriptions/     # Quotation builder, Subscription lifecycle stepper
│   │   │   ├── billing/           # Billing Day workspace, Dry-Run preview modal
│   │   │   ├── invoices/          # Invoice list, snapshot breakdown, print view
│   │   │   ├── payments/          # Payment recording modal, balance validator
│   │   │   ├── portal/            # Customer self-service views (tenant isolated)
│   │   │   ├── finance/           # MRR, ARR, Aging overdue charts and filters
│   │   │   └── outbox/            # Email Outbox inspection drawer
│   │   ├── hooks/                 # Shared React hooks (useAuth, useBilling, useLatency)
│   │   ├── types/                 # Shared domain interfaces matching backend models
│   │   ├── App.tsx                # Route definitions, ProtectedRoute guards
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md                      # Audited Master Documentation
```

---

## 10. Database Schema & Business Entities

*Classification: Planned Architecture. The schema below documents the 12 core business entities and the system outbox entity.*

```mermaid
erDiagram
    USERS ||--o{ SUBSCRIPTIONS : "holds as customer"
    USERS ||--o{ INVOICES : "billed to"
    USERS ||--o{ PAYMENTS : "remitted by"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "defines variants"
    PRODUCTS ||--o{ SUBSCRIPTION_LINES : "referenced in"
    PLANS ||--o{ SUBSCRIPTIONS : "dictates terms"
    QUOTATION_TEMPLATES ||--o{ SUBSCRIPTIONS : "instantiates"
    SUBSCRIPTIONS ||--o{ SUBSCRIPTION_LINES : "contains items"
    SUBSCRIPTIONS ||--o{ INVOICES : "generates recurring"
    INVOICES ||--o{ INVOICE_LINES : "contains billed items"
    INVOICES ||--o{ PAYMENTS : "settled by"
    TAX_RULES ||--o{ INVOICE_LINES : "applied to"
    DISCOUNT_RULES ||--o{ SUBSCRIPTION_LINES : "applied to"
    USERS ||--o{ EMAIL_OUTBOX : "recipient of"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        string role "ADMIN | STAFF | CUSTOMER"
        datetime created_at
    }

    PRODUCTS {
        uuid id PK
        string name
        string product_type "SERVICE | SOFTWARE | HARDWARE"
        decimal sales_price "DECIMAL(12,2)"
        decimal cost_price "DECIMAL(12,2)"
        boolean is_active
    }

    PRODUCT_VARIANTS {
        uuid id PK
        uuid product_id FK
        string variant_name "e.g., Odoo Brand"
        decimal price_delta "DECIMAL(12,2) e.g., +560.00"
        string sku
    }

    PLANS {
        uuid id PK
        string name
        string billing_interval "DAILY | WEEKLY | MONTHLY | YEARLY"
        integer interval_count
        integer min_quantity
        datetime valid_from
        datetime valid_until
        boolean auto_close
        boolean allow_early_closure
        boolean allow_pause
        boolean allow_renewal
    }

    SUBSCRIPTIONS {
        uuid id PK
        string subscription_number UK "e.g., SUB-2026-0001"
        uuid customer_id FK
        uuid plan_id FK
        string status "DRAFT | QUOTATION | CONFIRMED | ACTIVE | PAUSED | CLOSED"
        datetime start_date
        datetime next_billing_date
        datetime end_date
    }

    SUBSCRIPTION_LINES {
        uuid id PK
        uuid subscription_id FK
        uuid product_id FK
        uuid variant_id FK
        integer quantity
        decimal unit_price "DECIMAL(12,2)"
        decimal discount_amount "DECIMAL(12,2)"
    }

    INVOICES {
        uuid id PK
        string invoice_number UK "e.g., INV-2026-0001"
        uuid subscription_id FK
        uuid customer_id FK
        datetime issue_date
        datetime due_date
        string billing_cycle_id "e.g., 2026-10"
        decimal subtotal "DECIMAL(12,2)"
        decimal tax_total "DECIMAL(12,2)"
        decimal total_amount "DECIMAL(12,2)"
        decimal amount_paid "DECIMAL(12,2)"
        string status "DRAFT | CONFIRMED | PAID | CANCELLED"
    }

    INVOICE_LINES {
        uuid id PK
        uuid invoice_id FK
        uuid product_id FK
        string description
        integer quantity
        decimal unit_price "DECIMAL(12,2)"
        decimal tax_rate "DECIMAL(5,2)"
        decimal line_total "DECIMAL(12,2)"
    }

    PAYMENTS {
        uuid id PK
        uuid invoice_id FK
        uuid customer_id FK
        datetime payment_date
        decimal amount "DECIMAL(12,2)"
        string payment_method "BANK_TRANSFER | CARD | UPI | CASH | CHEQUE"
        string reference_note
        string status "COMPLETED | REVERSED"
    }

    DISCOUNT_RULES {
        uuid id PK
        string code UK
        decimal percentage "DECIMAL(5,2)"
        decimal fixed_amount "DECIMAL(12,2)"
        datetime valid_from
        datetime valid_until
        integer max_usage_count
        integer current_usage_count
        boolean is_active
    }

    TAX_RULES {
        uuid id PK
        string name
        decimal percentage "DECIMAL(5,2)"
        boolean is_active
    }

    EMAIL_OUTBOX {
        uuid id PK
        uuid recipient_user_id FK
        string recipient_email
        string subject
        text body_content
        string email_type "PASSWORD_RESET | INVOICE_NOTICE"
        datetime sent_at
    }
```

---

## 11. Development Roadmap

| Phase | Milestone | Key Deliverables | Status |
|---|---|---|---|
| **Phase 0** | **Repository Audit & Master Spec** | Audited README, architecture blueprints, environment specifications | **In Progress** |
| **Phase 1** | **Foundation & Authentication** | Monorepo scaffolding, PostgreSQL setup, JWT/cookie auth, RBAC, Outbox | *Planned* |
| **Phase 2** | **Catalog, Variants & Plans** | Products, variant surcharges (+₹560), plan scheduling, tax & discount rules | *Planned* |
| **Phase 3** | **Quotations & Subscriptions** | Templates, sequential numbering, state machine transitions | *Planned* |
| **Phase 4** | **Automated Billing Engine** | Dry-run mode, idempotent scheduled execution, snapshot generation | *Planned* |
| **Phase 5** | **Invoices & Payment Ledger** | Invoice lifecycle, multi-channel payment entries, balance calculation | *Planned* |
| **Phase 6** | **Customer Self-Service Portal** | Isolated customer portal, add-on management ("next invoice" rule) | *Planned* |
| **Phase 7** | **Financial Analytics Dashboard** | Real-time KPI aggregation (MRR, collections, aging receivables) | *Planned* |
| **Phase 8** | **Integration & End-to-End Testing** | 17-step demo test suite, automated regression verification | *Planned* |
| **Phase 9** | **Optimization & Accessibility** | Responsive layout, WCAG AA compliance, latency tracking (<2s SLA) | *Planned* |
| **Phase 10** | **Deployment & Hackathon Delivery** | Final production build, seed data script, submission package | *Planned* |

---

## 12. Team Structure & Work Allocation

The LoopBill engineering team comprises four developers. Currently, two developers are actively driving foundation development, while two members are temporarily completing college examinations. All four engineers will contribute to the finalized hackathon delivery.

```
┌────────────────────────────────────────────────────────┐
│                   LoopBill Team                        │
├──────────────────────────┬─────────────────────────────┤
│   Active Developers (2)  │  Exam Leave / Upcoming (2)  │
│  - Developer 1 (Backend) │  - Developer 3 (TBD Module) │
│  - Developer 2 (Frontend)│  - Developer 4 (TBD Module) │
└──────────────────────────┴─────────────────────────────┘
```

### Developer 1 – Backend & Architecture Lead *(Active)*
- Design Prisma schema, database migrations, and PostgreSQL indexes.
- Implement REST API gateway, cookie session handling, and RBAC authorization middleware.
- Build domain services for product catalog, variant price deltas, and plan scheduling.
- Engineer the core Automated Billing Engine with dry-run mode and idempotency guarantees.
- Implement exact decimal calculations for discounts, variant surcharges, and taxes.
- Build payment ledger, balance decrementing logic, and financial aggregation query APIs.
- Construct the local simulated email outbox service.

### Developer 2 – Frontend & UI/UX Lead *(Active)*
- Design and implement the React 18 + Vite SPA architecture with TypeScript.
- Establish the custom design system (Tailwind CSS, design tokens `#0F172A`, `#F8FAFC`, `#4F46E5`).
- Construct reusable UI primitives (DataTable, StatusStepper, StatusBadge, Modal, ConfirmDialog).
- Build authentication interfaces with live password policy validation.
- Develop Admin back-office interfaces (Catalog, Variants, Plans, Quotations, Invoices, Payments).
- Build the Billing Day execution workspace with Dry-Run preview modal.
- Create the tenant-isolated Customer Self-Service Portal.
- Build the Financial Analytics Dashboard and real-time latency indicator (`X-Response-Time`).

### Developer 3 – Modular Feature Engineer *(Upcoming Post-Exams)*
- Assigned an independent domain module upon return from examinations.
- Candidate allocations: Customer Self-Service Portal extensions, browser print stylesheet optimization, or simulated Outbox inspection drawer.
- Execution of cross-module integration tests.

### Developer 4 – Performance & QA Engineer *(Upcoming Post-Exams)*
- Assigned an independent domain module upon return from examinations.
- Candidate allocations: Large dataset benchmark simulator, automated end-to-end integration test runner, or cohort analytics.
- Verification of the sub-2-second SLA under simulated load.

---

## 13. Development & Collaboration Workflow

### Branching Model
Work proceeds strictly on isolated feature branches off `main`:
```
main (Production-ready Hackathon delivery)
  │
  ├── feature/backend-foundation    (Developer 1)
  ├── feature/frontend-foundation   (Developer 2)
  ├── feature/backend-catalog       (Developer 1)
  ├── feature/frontend-catalog      (Developer 2)
  ├── feature/backend-billing       (Developer 1)
  └── feature/frontend-billing      (Developer 2)
```

### Collaboration Standards
1. **Never Commit Directly to `main`:** All changes must originate on a feature branch (`feature/module-name`) and merge via Pull Request.
2. **Prior API Contract Agreement:** Frontend and backend leads must align on request/response JSON contracts before writing code.
3. **Conventional Commit Messages:** Commits must follow standard semantic prefixes (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
4. **Zero Secrets in Repository:** Credentials and keys are configured via `.env` files derived from `.env.example`. Secret commits are strictly blocked.
5. **Mandatory Peer Code Review:** Pull requests require review and test verification before merging into `main`.

---

## 14. Preliminary Installation & Setup Guide

> **Note on Implementation State:** The commands below represent the standard workflow for Phase 1 execution once application scaffolding has been initialized.

### 1. Prerequisites
- **Git:** v2.30+
- **Node.js:** v18 LTS or v20 LTS
- **Package Manager:** `npm` (v9+)
- **Database:** PostgreSQL (v14+) or local SQLite for sandbox development

### 2. Clone Repository
```bash
git clone https://github.com/vignesh19807/Subscription_Management_System.git
cd Subscription_Management_System
```

### 3. Environment Setup *(Planned - Phase 1)*
```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration
cp frontend/.env.example frontend/.env
```

**Sample Backend `.env.example`:**
```ini
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/loopbill_dev?schema=public"
JWT_SECRET="dev_jwt_secret_change_in_production"
COOKIE_SECRET="dev_cookie_secret"
CLIENT_URL="http://localhost:3000"
```

### 4. Dependency Installation *(Planned - Phase 1)*
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 5. Database Migration & Seeding *(Planned - Phase 1)*
```bash
cd backend
npx prisma migrate dev --name init
npm run seed
```

### 6. Development Server Execution *(Planned - Phase 1)*
```bash
# Terminal 1 - Backend API (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 - Frontend SPA (http://localhost:3000)
cd frontend && npm run dev
```

---

## 15. Acceptance Criteria & 17-Step Demo Journey

To validate end-to-end functionality for hackathon presentation, LoopBill implements and tests the following 17-step operational journey:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Staff
    actor Customer as Customer
    participant FE as Frontend (React)
    participant BE as Backend (API)
    participant DB as Database (Postgres)
    participant Outbox as Local Outbox

    Customer->>FE: 1. Register Account
    FE->>BE: Submit registration (Customer role)
    BE->>DB: Persist user (9+ char password policy)
    Admin->>FE: 2. Admin Login & 3. Create Staff Account
    FE->>BE: Admin creates Staff
    Admin->>FE: 4. Create Product & 5. Create Odoo Variant (+₹560)
    FE->>BE: Save Product & Variant (+₹560 delta)
    Admin->>FE: 6. Create Plan & 7. Create Discount
    Admin->>FE: 8. Create Quotation & 9. Confirm to Active Subscription
    FE->>BE: Generate Subscription (SUB-2026-0001)
    Admin->>FE: 10. Trigger Billing Dry-Run
    FE->>BE: Execute preview simulation (Zero DB writes)
    Admin->>FE: 11. Execute Real Billing
    FE->>BE: Generate Invoices (INV-2026-0001) with snapshots
    Admin->>FE: 12. Repeat Billing Execution
    FE->>BE: Confirm Idempotency (Zero duplicate invoices)
    Admin->>FE: 13. Confirm Invoice & Print View
    Admin->>FE: 14. Record Partial Payment & 15. Record Full Settlement
    FE->>BE: Update balance; derive PAID status
    Customer->>FE: 16. Customer Portal Inspection (Isolated view)
    Admin->>FE: 17. Finance Dashboard Review (MRR, Overdue debt)
```

### Performance Benchmark SLA
- **Page Load Response Time:** Sub-2.0 seconds for all views under standard load.
- **API Response Latency (p95):** Target $< 300\text{ ms}$, monitored in real time via the `X-Response-Time` HTTP response header.
- *Status Note:* Benchmark measurements will be officially recorded and documented during Phase 9 load testing.

---

## 16. Scope Exclusions & Future Improvements

To ensure timely delivery of a robust hackathon core, the following items are explicitly excluded from Version 1:
- **No Live Payment Gateway Integration:** LoopBill operates an internal accounting payment ledger; external gateway integrations (Stripe, Razorpay webhooks) and cardholder data storage are excluded.
- **No Live External SMTP Relay:** Automated emails are written to the local database outbox for auditability; external SMTP relay is optional.
- **No Unnecessary AI / Microservice Overhead:** The application uses a modular, maintainable monolithic architecture rather than premature microservice decomposition.

### Post-Hackathon Future Enhancements
1. **Automated PDF Rendering:** Server-side generation of branded PDF invoices.
2. **External Gateway Adapters:** Webhook handlers for automated online card/UPI settlement.
3. **Cohort Retention Analytics:** Visual analysis of customer churn and lifetime value (LTV).

---

## 17. Current Project Status & Audit Certification

- **Current Stage:** **Phase 0 (Repository Scaffolding & Architecture Blueprint)**
- **Implemented & Verified Items:**
  - Git version control initialized.
  - Master technical specification audited and aligned with the Brightloop Software problem statement.
- **Items in Immediate Development:**
  - Phase 1 scaffolding: Backend Express/TypeScript setup, Prisma schema definition, and Frontend Vite/Tailwind configuration.
- **Known Operational Blockers:**
  - Two developers are on temporary university examination leave. Development tasks are balanced between the two active leads to establish core architecture prior to modular handoff.

---

*LoopBill is developed for the Brightloop Software Subscription Billing Challenge — Odoo Hackathon.*