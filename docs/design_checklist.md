# Design System Migration Checklist

Tracking the migration from legacy monolithic styling to the new unified **Theme System** (Wise-inspired).

## Core Principles
- [x] Remove `TYPOGRAPHY`, `spacing`, `radius`, `LAYOUT` legacy imports.
- [x] Use `useTheme()` hook in every component.
- [x] Use `theme` object in `createStyles(theme)`.
- [x] Ensure atomic token consumption (e.g., `theme.spacing[16]`, `theme.radius.lg`).

---

## 1. Dashboard Migration
- [x] **Main Screen**: `src/features/dashboard/screens/DashboardScreen.tsx`
- [x] **Summary Cards**:
  - `PeopleSummaryCard.tsx`
  - `PlacesSummaryCard.tsx`
  - `BudgetSummaryCard.tsx`
  - `GoalsSummaryCard.tsx`
  - `LoansSummaryCard.tsx`
- [x] **Data Visualization**:
  - `TopExpenseCategoriesCard.tsx`
  - `InsightCard.tsx`
  - `SectionHeader.tsx`

## 2. Transactions Migration
- [x] **Transactions List**: `src/features/transactions/screens/TransactionsScreen.tsx`
- [x] **Transaction Form**: `src/features/transactions/screens/TransactionFormPage.tsx`
- [x] **Transaction Pickers**:
  - `TransactionAccountPicker.tsx`
  - `TransactionCategoryPicker.tsx`
  - `TransactionTypePicker.tsx`
  - `TransactionGoalPicker.tsx`
  - `TransactionLoanPicker.tsx`
  - `TransactionBudgetPicker.tsx`
  - `TransactionAmountInput.tsx`

## 3. Accounts Flow
- [x] **Account Create**: `app/account/create.tsx`
- [x] **Account Edit**: `app/account/edit/[id].tsx`

## 4. Pending Feature Flows (Screens & Feature Components)
- [x] **Category Flow**: 
  - `app/category/create.tsx`, `app/category/edit/[id].tsx`
  - `src/features/categories/screens/CategoriesScreen.tsx`
  - `src/features/categories/components/CategoryCard.tsx`
  - `src/features/categories/components/CategoryTypeSelector.tsx`
- [x] **Goals Flow**:
  - `src/features/goals/screens/GoalsScreen.tsx`
  - `src/features/goals/screens/GoalDetailsScreen.tsx`
  - `src/features/goals/screens/GoalFormPage.tsx`
- [x] **Loans Flow**:
  - `src/features/loans/screens/LoansScreen.tsx`
  - `src/features/loans/screens/LoanDetailsScreen.tsx`
  - `src/features/loans/screens/LoanFormPage.tsx`
- [x] **Budgets Flow**:
  - `src/features/budgets/screens/BudgetsScreen.tsx`
  - `src/features/budgets/screens/BudgetDetailsScreen.tsx`
  - `src/features/budgets/screens/BudgetFormPage.tsx`
- [x] **People Flow**:
  - `src/features/people/screens/PeopleScreen.tsx`
  - `src/features/people/screens/PersonDetailsScreen.tsx`
  - `src/features/people/screens/PersonFormPage.tsx`
- [x] **Places Flow**:
  - `src/features/places/screens/PlacesScreen.tsx`
  - `src/features/places/screens/PlaceDetailsScreen.tsx`
  - `src/features/places/screens/PlaceFormPage.tsx`
- [x] **Recurring Flow**:
  - `src/features/recurring/screens/RecurringScreen.tsx`
  - `src/features/recurring/screens/RecurringFormPage.tsx`
- [x] **Reports & Insights**:
  - `src/features/reports/components/ReportHeader.tsx`
  - `src/features/reports/components/MetricCard.tsx`
  - `src/features/reports/components/StreakBadge.tsx`
- [x] **Search Flow**: `app/search.tsx`, `src/features/search/screens/SearchScreen.tsx`
- [x] **Filters**: `src/features/filters/components/AdvancedFilterSheet.tsx`
- [x] **Premium Screen**: `app/premium.tsx`
- [x] **Onboarding**: 
  - `app/(onboarding)/index.tsx`
  - `src/features/onboarding/components/WelcomeStep.tsx`
  - `src/features/onboarding/components/ProfileStep.tsx`
- [x] **Backup/Export**:
  - `src/features/backup/screens/BackupScreen.tsx`
  - `src/features/export/screens/ExportScreen.tsx`
- [x] **Settings**: `src/features/settings/screens/SettingsScreen.tsx`

## 5. Core UI Library (Audit & Refactor)
- [x] **MoneyText**: `src/components/core/MoneyText.tsx`
- [x] **TransactionRow**: `src/components/core/TransactionRow.tsx`
- [x] **Header**: `src/components/core/Header.tsx`
- [x] **Card**: `src/components/core/Card.tsx`
- [x] **Typography**: `src/components/core/Typography.tsx`
- [x] **Button**: `src/components/core/Button.tsx`
- [x] **IconButton**: `src/components/core/IconButton.tsx`
- [x] **ConfirmDialog**: `src/components/core/ConfirmDialog.tsx`
- [x] **OptionsDialog**: `src/components/core/OptionsDialog.tsx`
- [x] **IconPickerDialog**: `src/components/core/IconPickerDialog.tsx`
- [x] **EmptyState**: `src/components/core/EmptyState.tsx`
- [x] **Badge**: `src/components/core/Badge.tsx`
- [x] **Input**: `src/components/core/Input.tsx`
- [x] **KPICard**: `src/components/core/KPICard.tsx`
- [x] **ListItem**: `src/components/core/ListItem.tsx`
- [x] **PremiumGuard**: `src/components/core/PremiumGuard.tsx`
- [x] **AlertModal**: `src/components/core/AlertModal.tsx`
- [x] **Chip**: `src/components/core/Chip.tsx`
- [x] **CurrencyPickerModal**: `src/components/core/CurrencyPickerModal.tsx`
- [x] **Divider**: `src/components/core/Divider.tsx`
- [x] **IconBox**: `src/components/core/IconBox.tsx`
- [x] **PersonPickerDialog**: `src/components/core/PersonPickerDialog.tsx`
- [x] **PlacePickerDialog**: `src/components/core/PlacePickerDialog.tsx`
- [x] **SectionLabel**: `src/components/core/SectionLabel.tsx`
