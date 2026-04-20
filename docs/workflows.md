# 💎 Luno - Features & Workflows Guide

This document outlines the core features of the Luno app and the step-by-step workflows users experience, mapped directly to the local codebase architecture.

## 1. Onboarding & Initial Setup
**Feature:** A guided first-time experience to get the user ready for offline-first tracking.
**Codebase Domain:** `app/(onboarding)` and `src/features/onboarding`

**Workflow:**
1. User launches the app for the first time.
2. The app detects their device locale to automatically assign a base currency.
3. User navigates through a clean 3-step wizard (Welcome ➝ Profile ➝ Account Creation).
4. **Data Seeding:** In the background, the app uses Drizzle + SQLite to pre-populate 50+ common transaction categories (e.g., Transport, Health, Lifestyle) with predefined colors and icons.
5. User is seamlessly transitioned to the main `(main)` router stack.

---

## 2. Transaction Management
**Feature:** The core engine for tracking financial inputs (credits) and outputs (debits).
**Codebase Domain:** `app/transactions`, `src/features/transactions`

**Workflow:**
1. **Creation:** User taps the primary 'Add' interaction on the Dashboard.
2. User is routed to the `create.tsx` screen.
3. User toggles the **Type** (`CR` for Income, `DR` for Expense).
4. User inputs the Amount, selects the relevant Account, and assigns a Category.
5. Optional contextual metadata (Notes, custom Datetime) can be applied.
6. **Integrity Update:** On save, the `transactions` table is updated locally. A trigger hook automatically adjusts the selected account's balance to accurately reflect the change.
7. **Modification:** Users can swipe to edit/delete from the transaction list. Reversals are automatically calculated to ensure dashboard balances are perfectly restored to prior states.

---

## 3. Pulse (Analytics)
**Feature:** Deep insights into spending behavior segmented by time cohorts and currencies.
**Codebase Domain:** `app/(main)/stats.tsx` (being renamed to Pulse)

**Workflow:**
1. User navigates to the 'Pulse' tab from the bottom app bar.
2. User selects a specific **Currency** and **Window** (7D, 30D, 90D, or ALL TIME). 
3. **Free Tier Flow:** Limited to the basic 7-day sliding window. Users see Summary tabs featuring Net Position, total Income, total Expense, and Balance. 
4. **Premium Tier Workflow:** If the free user attempts to select 30D, 90D, or ALL TIME, or triggers a locked advanced insight, the `PremiumGuard` intercepts the tap and opens the Paywall presentation.
5. **Insights Engine:** The app dynamically calculates practical metrics:
   - *Avg Daily Burn*: Standardized daily expense rate.
   - *Savings Rate*: Net Position / Income.
   - *Runway*: Balance / Avg Daily Burn.
   - *In/Out Ratio*: Income / Expense.
6. **Visual Output:** Charts powered by react-native-gifted-charts including trend lines, category breakdowns, and income vs expense visualizations.

---

## 4. Monetization & Paywall 
**Feature:** Strategic feature-based gating meant to incentivize upgrading to Luno Pro.
**Codebase Domain:** `app/premium.tsx`, `src/services/iap.service.ts`, `src/components/ui/PremiumGuard.tsx`

**Workflow:**
1. A user interacts with an analysis feature flagged as premium (e.g., Period Delta comparisons, long-form history).
2. The `PremiumGuard` wrapper interrupts the gesture and triggers a modal layer.
3. The user is presented with the Brutalist-themed Lifetime Paywall screen (`premium.tsx`).
4. The system communicates via `iap.service.ts` to surface the configured standard or early-adopter Lifetime tier.
5. Upon successful purchase, the local state engine (`usePremium`) triggers a global re-render, unlocking all `PremiumGuard` instances seamlessly without a restart.

---

## 5. Dashboard (Home Tab)
**Feature:** The primary home hub providing at-a-glance financial health.
**Codebase Domain:** `app/(main)/index.tsx`, `src/features/dashboard`

**Workflow:**
1. User is on the 'Home' tab of the bottom app bar.
2. Dashboard mounts fetching real-time balances across all created accounts.
3. Aggregates a master 'Net Position' hero unit at the very top.
4. Streams a 'Recent Transactions' live feed constrained to the most recent elements.
5. Charts section shows Income vs Expense bars and Spending category donut (Phase 7).
6. FAB (Floating Action Button) visible on all tabs for quick transaction creation.

---

## 6. Accounts Tab
**Feature:** Multi-account management and detailed account views.
**Codebase Domain:** `app/(main)/accounts.tsx` (Phase 6)

**Workflow:**
1. User navigates to the 'Accounts' tab from the bottom app bar.
2. Views list of all created accounts with balances.
3. Tapping an account opens detail view with filtered transaction list.
4. FAB visible for adding new transactions to selected account.

---

## 7. Navigation Structure (Phase 6)
**Feature:** Bottom app bar with 4 tabs + FAB for unified navigation.
**Codebase Domain:** `app/(main)/_layout.tsx`

**Tab Structure (left to right):**
1. **Home** (`house` icon) → Dashboard screen
2. **Accounts** (`wallet` icon) → Accounts list screen
3. **Pulse** (`activity` icon) → Analytics screen (formerly Stats)
4. **Settings** (`cog` icon) → Settings screen

**FAB:** Positioned on the right side of the bottom bar. Lime accent color (`#86C53C`). Opens Add Transaction sheet. Visible on all 4 tabs.

---

## 8. Personalization & Settings
**Feature:** User control over aesthetics, localization, and data management.
**Codebase Domain:** `app/(main)/settings.tsx`

**Workflow:**
1. User navigates to the 'Settings' tab from the bottom app bar.
2. User toggles the App Theme (Light, Dark, System Adaptive) applying to the global context instantly.
3. Configure Reminder notifications (time and enable/disable).
4. Access Premium status and upgrade options.
5. Data management: Export CSV (Phase 10), Backup & Restore (Phase 10 - hidden for now).
