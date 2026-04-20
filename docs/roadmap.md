# 🧭 Luno Roadmap

## ✅ Phase 1 — Foundation (Completed)
- [x] Onboarding flow (Welcome → Profile → Account)
- [x] 50+ pre-defined categories
- [x] Transaction management (add/edit/delete)
- [x] Multi-account tracking
- [x] Dashboard (net position + recent transactions)
- [x] Basic filtering
- [x] Advanced analytics engine (metrics ready)
- [x] Local-first storage (SQLite)
- [x] Theme support (light/dark/system)
- [x] Brutalist UI foundation

---

## 🚀 Phase 2 — Freemium Setup (Completed)

### Free Tier (Core Usage)
- [x] Transaction tracking (full access)
- [x] Basic dashboard (totals + recent activity)
- [x] Basic filters
- [x] Category & account management

### Premium Tier (Monetization)
- [x] Savings rate (Pulse Screen)
- [x] Avg daily burn (Pulse Screen)
- [x] Financial runway (Dashboard & Pulse)
- [x] In/Out ratio (Pulse Screen)
- [x] Time filters (7D / 30D / 90D / All-time)
- [x] Category breakdown analytics
- [x] Comparative insights (period vs period)

### Paywall System
- [x] Feature-based locking (PremiumGuard)
- [x] Usage-based triggers (after engagement)
- [x] Upgrade prompts (non-intrusive Pro badges)
- [x] Lifetime purchase option (Native Store Support)

---

## ⚡ Phase 3 — Insights Layer (Completed)
- [x] Weekly financial summary
- [x] Spending alerts (e.g. "You spent 20% more this week")
- [x] Runway insights (increase/decrease tracking)
- [x] Savings feedback ("You saved ₹X")
- [x] Contextual insight cards inside dashboard

---

## 🔁 Phase 4 — Retention System (Completed)
- [x] Weekly report view
- [x] Monthly summary view
- [x] Usage streak / consistency tracking
- [x] Lightweight reminders (Settings and logic integrated)

---

## 💎 Phase 5 — Power Features (Completed)
- [x] Advanced filters (multi-select, deep filtering)
- [x] Global search across transactions

---

## 🗂️ Phase 6 — Navigation Overhaul (Next)

- [ ] **Bottom app bar — 4 tabs + FAB**
  - Replace existing navigation with a persistent bottom app bar containing 4 tabs and a floating action button.
  - Tab structure (left to right): Home, Accounts, Pulse, Settings.
  - FAB: positioned on the right side of the bottom bar (not centered). Tapping FAB opens the Add Transaction sheet. FAB uses Luno's lime accent color (`#86C53C`) with a `+` icon. FAB stays visible on all 4 tab screens.
  - Implementation: use Expo Router tab layout (`_layout.tsx` with `Tabs` from `expo-router`). Define 4 tab screens: `index` (Home), `accounts`, `pulse`, `settings`. Hide the default tab bar and build a custom `BottomAppBar` component rendered via `tabBar` prop. FAB is rendered inside the custom bar as an absolutely positioned pressable on the right end.
  - Active tab: filled icon + lime accent color (`#86C53C`) on active label. Inactive tabs: outlined icon + muted color.
  - Tab icons: Home → `house`, Accounts → `wallet`, Pulse → `activity`, Settings → `cog` (use `@expo/vector-icons` Ionicons or MaterialCommunityIcons).
  - The bottom bar has a solid background matching the app's current theme surface color. No blur, no transparency — brutalist aesthetic.

- [ ] **Screen-to-tab mapping**
  - Home tab → existing Dashboard screen (net position, insight cards, recent transactions, donut chart).
  - Accounts tab → existing multi-account list screen. Tapping an account opens account detail with its filtered transaction list.
  - Pulse tab → existing Stats screen merged with Weekly Summary (Phase 7 optimization). Contains all charts: trend line, category breakdown bar chart, income vs expense bar chart.
  - Settings tab → existing Settings screen (theme, reminders, biometric lock, premium).

---

## 🔧 Phase 7 — In-App Optimization + Charts

### Redundancy Fixes

- [ ] **Merge Weekly Summary screens**
  - Delete the Phase 4 weekly report screen. Expand into a single `WeeklySummaryScreen` showing: total income, total expenses, savings delta, top 3 spending categories, period-over-period comparison, and an income vs expense pie chart.
  - Entry point: dashboard insight card tap → navigates to `WeeklySummaryScreen`. No separate nav tab.

- [ ] **Merge streak + consistency tracking**
  - Keep one `streakCount` field in the user profile table (SQLite). Increments when at least one transaction is logged on a given calendar day. Display in a single location (Settings or Profile screen). Remove duplicate streak calculation logic.

- [ ] **Unify filter UX into one sheet**
  - Single bottom sheet `FilterSheet` component. Structure: date range picker at top, multi-select accounts, multi-select categories, amount range slider, search input. Premium-only fields rendered with inline `PremiumGuard` lock overlay — not hidden. One filter button in the transaction list header triggers this sheet.

- [ ] **Consolidate spending alerts into insight cards**
  - Alerts are a data-generation layer returning `InsightPayload[]` (`{ type, title, body, severity }`). The insight card component consumes this array and renders all cards uniformly. Alert types: overspend vs last period, high single-category spend, low runway warning, positive savings feedback.

- [ ] **Remove Monthly Summary as a standalone screen**
  - Add a period selector (Week / Month / Year) to the Pulse screen header. Deep-link existing "monthly summary" entry to Pulse screen with Month pre-selected.

### UX Tightening

- [ ] **Audit dashboard metric overlap**
  - Show only a runway status chip on Dashboard (e.g. "~23 days runway") that taps through to Pulse screen. Remove the full runway card from Dashboard.

- [ ] **Trim onboarding flow**
  - Target 3 steps max: Welcome → Create Profile → Create First Account. Defer everything else to contextual in-app prompts.

- [ ] **Standardise PremiumGuard UI**
  - Single `PremiumGuard` wrapper component accepting `feature: string` and `children: ReactNode`. Identical badge style, copy pattern, and upgrade CTA across all locked features. No one-off implementations.

### Charts — Dashboard (Home tab)

- [ ] **Income vs Expense bar chart**
  - Location: Dashboard, below net position summary, above recent transactions.
  - Grouped bar chart: income (green) vs expense (coral) for last 7 days (free) or last 30 days (premium). X-axis: days or weeks. Y-axis: amount. Tapping a bar navigates to filtered transaction list for that period.
  - Library: `react-native-gifted-charts` BarChart. Flat fills, no rounded bars, no shadows.
  - Tier: 7-day free, 30-day premium.

- [ ] **Spending category donut chart**
  - Location: Dashboard, inside or replacing existing category breakdown section.
  - Top 5 spending categories by amount for current month. Center shows total spend figure. Legend below: category name + amount + percentage. Tapping a segment navigates to filtered transaction list for that category.
  - Library: `react-native-gifted-charts` PieChart with `donut` prop.
  - Tier: free.

### Charts — Pulse tab

- [ ] **Monthly trend line chart**
  - Location: Pulse screen, top section.
  - Two lines — income and expense — over last 6 months. X-axis: month labels. Y-axis: amount. Tappable points show tooltip with exact figure.
  - Library: `react-native-gifted-charts` LineChart.
  - Tier: premium. Free users see blurred version with upgrade prompt.

- [ ] **Category breakdown horizontal bar chart**
  - Location: Pulse screen, below trend line chart.
  - All spending categories for selected period sorted by amount descending. Bar width = proportion of total spend. Amount and percentage shown inline on each bar.
  - Library: `react-native-gifted-charts` BarChart with `horizontal` prop.
  - Tier: premium.

- [ ] **Income vs Expense pie chart (Weekly Summary screen)**
  - Location: `WeeklySummaryScreen`, top of screen.
  - Two-segment pie: income (green) vs expense (coral) for selected week. Center shows net figure. Below: three stat pills — total in, total out, savings rate.
  - Library: `react-native-gifted-charts` PieChart.
  - Tier: free.

---

## 🏦 Phase 8 — Core Finance Primitives

- [ ] **Account transfers**
  - Data model: add `transfer` transaction type to existing transactions table with fields `fromAccountId`, `toAccountId`, `amount`, `date`, `note`. On save, create two linked records (debit + credit) tagged with the same `transferGroupId` UUID. Exclude all transfer transactions from income/expense/analytics calculations.
  - UI: "Transfer" tab in Add Transaction sheet alongside Income/Expense. From/to account pickers + amount field. Distinct double-arrow icon in transaction lists.
  - Tier: free.

- [ ] **Recurring transactions**
  - Data model: `recurring_templates` table with fields `id`, `title`, `amount`, `type` (income/expense), `categoryId`, `accountId`, `frequency` (daily/weekly/monthly/yearly), `nextDueDate`, `isActive`. On app open, background job checks `nextDueDate` — if past due, auto-create transaction and advance `nextDueDate` by frequency interval.
  - UI: "Recurring" section in Settings listing all templates with next due date. Add/edit/pause/delete supported. Auto-created transactions surface a dashboard insight card ("3 recurring transactions logged today").
  - Tier: premium.

- [ ] **Biometric lock**
  - Implementation: `expo-local-authentication`. Toggle in Settings → Privacy ("Require biometrics to open app"). Store preference in SQLite user settings table. On `AppState` change `background → active`, if enabled show full-screen lock overlay and call `LocalAuthentication.authenticateAsync()`. Dismiss on success, show "Try Again" on failure.
  - Tier: free.

---

## 🎯 Phase 9 — Planning Layer

- [ ] **Budget system**
  - Data model: `budgets` table with fields `id`, `categoryId`, `amount`, `period` (weekly/monthly), `startDate`, `notifyAt` (percentage threshold e.g. 80%). Progress calculated at query time — sum transactions matching `categoryId` within current period window. No stored running totals.
  - UI: "Budgets" screen accessible from Pulse tab or main nav. Each budget shows category label, progress bar (spent / limit), percentage used, amount remaining. Bar turns amber at `notifyAt` threshold, red when exceeded. Tapping a budget shows filtered transactions counted toward it. Insight card triggered when `notifyAt` threshold is crossed ("You've used 80% of your Food budget").
  - Chart: each budget card contains a spark bar chart — one bar per day of current period, height proportional to daily spend, dotted average line overlay. Uses `react-native-gifted-charts` BarChart in compact mode.
  - Tier: free up to 2 budgets, unlimited for premium.

- [ ] **Savings goals**
  - Data model: `goals` table with fields `id`, `title`, `targetAmount`, `currentAmount`, `targetDate`, `linkedAccountId` (optional), `isCompleted`. Goal deposits are a special transaction type that debits the linked account and credits the goal. `currentAmount` can also be updated directly without a linked transaction.
  - UI: "Goals" screen listing active goals. Each goal shows title, circular progress ring (currentAmount / targetAmount), amount remaining, days until target date. Completed goals archived. Tapping a goal shows deposit history.
  - Chart: goal detail screen shows a line chart of `currentAmount` over time (one point per deposit) to visualise savings trajectory. Uses `react-native-gifted-charts` LineChart.
  - Tier: free up to 1 goal, unlimited for premium.

---

## 📦 Phase 10 — Data Portability

- [ ] **Export data (CSV)**
  - Allows users to export their transaction history as a CSV file with filters applied.
  - UI: Export option in Settings → Data. User selects date range, accounts (multi-select), and categories (multi-select) before exporting. Generated CSV columns: date, type, amount, currency, category, account, note. File is saved to device via `expo-file-system` and shared via `expo-sharing`.
  - Tier: free.

- [ ] **Backup & restore (local)**
  - Allows users to export a full JSON snapshot of all app data and restore from it.
  - Backup: serialise all SQLite tables (transactions, accounts, categories, recurring templates, budgets, goals, settings) into a single JSON file. Save via `expo-file-system`, share via `expo-sharing`. File named `luno-backup-YYYY-MM-DD.json`.
  - Restore: user picks a `.json` backup file via `expo-document-picker`. App validates the file structure, wipes existing SQLite data, and re-inserts all records. Show a confirmation prompt before wiping. Restore option available on the onboarding screen (for fresh installs) and in Settings → Data.
  - Tier: free.

---

## 🎯 Core Principle

**Free = Tracking**
**Premium = Insights + Control**