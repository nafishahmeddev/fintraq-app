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
- [x] Savings rate (Stats Screen)
- [x] Avg daily burn (Stats Screen)
- [x] Financial runway (Dashboard & Stats)
- [x] In/Out ratio (Stats Screen)
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

- [x] Advanced filters (multi-select, deep filtering) - Multi-select accounts/categories, date range, amount range, search
- [x] Global search across transactions - Full-text search, dedicated results screen, deep-linking to filtered results

---

## 🔧 Phase 6 — Core Enhancements (Completed)

### Transfer Transaction Type
- [x] Add "transfer" as first-class transaction type (income/expense/transfer)
- [x] Source and destination account linking
- [x] Transfers only allowed between accounts with same currency
- [x] Transfer-specific category handling (optional / system categories)
- [x] Exclude from income/expense totals (no income/expense impact)

### Account Types
- [x] Add account type field: cash, card, savings, investment, loan, other
- [x] Account number field (optional) - for card/bank accounts
- [x] Type-specific icons and visual indicators
- [x] Filter accounts by type
- [x] Type-based insights (cash vs card spending)

---

## ✅ Phase 7 — Recurring & Budgeting (Completed)

### Recurring Transactions
- [x] Create recurring transaction templates
- [x] Frequencies: daily, weekly, bi-weekly, monthly, quarterly, yearly, custom
- [x] End conditions: never, after N occurrences, on date
- [x] Auto-generate instances on schedule (Manual process verified)
- [x] Reminders before due date
- [x] Skip/pause individual occurrences
- [x] Edit series vs single instance (Handled via template)
- [x] **Free tier**: Up to 3 recurring transactions
- [x] **Premium**: Unlimited recurring transactions

### Advanced Budgeting
- [x] Budget types:
  - Income budgets (track expected income)
  - Expense budgets (spending limits)
  - Category-wise budgets
  - Overall budgets (all spending)
- [x] Budget modes:
  - Auto: automatic tracking based on rules
  - Manual: select specific transactions to include
- [x] Budget periods: daily, weekly, monthly, yearly, custom range
- [x] Rolling budgets: carry forward unused amounts
- [x] Overspend adjustment: redistribute or carry deficit
- [x] Account filters: budget scoped to specific accounts
- [x] Deep historical tracking: via Budget Details screen
- [x] Category grouping: multi-category budgets
- [x] Progress visualization with alerts: via Dashboard & Details
- [x] **Free tier**: Up to 2 active budgets
- [x] **Premium**: Unlimited budgets + advanced insights

---

## ✅ Phase 8 — Goals & Loans (Completed)

### Goals
- [x] Create financial goals with target amount and deadline
- [x] Goal types: savings target, debt payoff, spending limit
- [x] Link transactions to goals (manual assignment)
- [x] Progress tracking with visual indicators
- [x] Projected completion date based on pace
- [x] Goal contributions from recurring transactions
- [x] Multiple active goals with priority ranking
- [x] **Free tier**: Up to 2 active goals
- [x] **Premium**: Unlimited goals + advanced projections

### Loan Tracking
- [x] Lend/borrow recording with person association
- [x] Loan types: given (lent), taken (borrowed)
- [x] Optional link to transactions (when loan is created/repaid)
- [x] Installment tracking for partial repayments
- [x] Interest calculation (simple/compound, optional)
- [x] Reminders for due dates
- [x] Loan history and settlement tracking
- [x] Net loan position (total lent - total borrowed)
- [x] **Free tier**: Up to 2 active loans
- [x] **Premium**: Unlimited loans + interest analytics

---

## ✅ Phase 9 — Person Linking (Completed)

### Person Management
- [x] Attach contacts to transactions
- [x] Person management (add/edit/delete contacts)
- [x] Transaction history per person
- [x] Deep-link to contact details
- [x] Search/filter by person
- [x] Person summary (total lent/borrowed/net position)
- [x] **Free tier**: Up to 5 people
- [x] **Premium**: Unlimited people + relationship insights

---

## 📍 Phase 10 — Location Tracking (Completed)

### Location Tracking
- [x] Attach places/locations to transactions
- [x] Place search and saved places
- [x] Transaction history by location
- [x] Frequent places suggestions
- [ ] Location-based insights ("You spend most at...")
- [x] **Free tier**: Up to 5 saved places, basic location tag
- [x] **Premium**: Unlimited places + map view + insights

---

## 📊 Phase 11 — Analytics & Reporting (Premium)

### Unified Stats System
- [ ] Merge weekly/monthly reports into single flexible stats engine
- [ ] Configurable periods: daily, weekly, monthly, quarterly, yearly, custom
- [ ] Same underlying data - no duplication, period-agnostic queries
- [ ] Comparative analysis across any two periods
- [ ] Trend detection and visualization

### Advanced Reporting
- [ ] PDF report generation
- [ ] Custom report builder
- [ ] Scheduled reports (weekly/monthly email)
- [ ] Cross-account analytics
- [ ] Category trend analysis
- [ ] **Premium**: Full reporting suite

---

## ☁️ Phase 12 — Data Portability & Cloud Sync (Premium)

### Bills & Receipts
- [ ] Attach photos/PDFs to transactions
- [ ] Camera capture for receipts
- [ ] Gallery upload support
- [ ] Cloud sync for attachments
- [ ] **Free tier**: Up to 10 attachments total
- [ ] **Premium**: Unlimited attachments + cloud sync

### Export & Import
- [ ] Export data (CSV) - Date range, filters, cross-platform save
- [ ] Data export with visual charts (PDF/Images)
- [ ] Backup & restore (local) - JSON export/import, onboarding restore option
- [ ] Automated cloud backup (iCloud/Google Drive)
- [ ] Cross-device data synchronization
- [ ] **Free tier**: Manual local backups + CSV export
- [ ] **Premium**: Automated cloud sync + PDF reports + unlimited backups

---

## 🎯 Core Principle

**Free = Tracking**  
**Premium = Insights + Control + Automation**
