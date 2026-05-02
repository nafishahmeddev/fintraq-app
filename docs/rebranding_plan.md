# Luno — Complete Wise-Inspired Rebranding Plan

Full-app rebranding to strict Wise design language. Every file, every component.

---

## Design Rules (Reference)

| Token | Value | Rule |
|-------|-------|------|
| `radius.full` | 9999 | Buttons, chips, pills, FABs, icon circles, progress bars |
| `radius['3xl']` | 28px | Cards, containers, sheets, modals, form sections |
| `radius['2xl']` | 20px | Sub-cards only (inside a `3xl` container) |
| `colors.primary` | `#9FE870` | ALL active/selected bg — no other green |
| `colors.onPrimary` | `#163300` | Text/icons on `colors.primary` bg |
| `colors.card` | theme card | Card backgrounds — never `colors.surface` or `colors.background` for cards |
| `shadow.*` | none on cards | No default shadow on cards. `shadow.md` only on FABs and primary CTAs |
| `sansMedium` 12px | labels | Section labels, field labels — no letterSpacing, no uppercase |
| `sansSemiBold` 14px | list titles | Row/item titles |
| `letterSpacing` | 0 | Never set letterSpacing on labels/badges — only on display hero text |
| `activeOpacity` | 0.75 | All `TouchableOpacity` interactive elements |
| Progress bar | 4px height | `radius.full`, `colors.primary` fill, `colors.border+'40'` track |
| FAB | 56×56px | `radius.full`, `colors.primary`, `shadow.md`, `colors.onPrimary` icon |
| Save buttons | lg, full | `radius.full` 56px, `colors.primary`, `colors.onPrimary`, `shadow.md` |
| Empty state CTA | primary pill | `radius.full`, `colors.primary`, `colors.onPrimary` |
| `ActivityIndicator` | on primary | `color={colors.onPrimary}` when inside primary-bg button |
| Modal sheet top | `radius['3xl']` | `borderTopLeftRadius`, `borderTopRightRadius` |
| Modal dialog | `radius['3xl']` | Container radius — not `radius['2xl']` |
| Selected chip/cell | primary | `colors.primary` bg + `colors.onPrimary` text — never `colors.text` bg |
| `colors.primaryDark` | replace | Use `colors.primary` for bg, `colors.onPrimary` for text on primary |

---

## Phase 1 — Foundation (Tokens & Colors)

### `src/theme/tokens.ts`
- [x] `layout.sectionGap` → `spacing[32]`
- [x] `layout.cardPadding` → `spacing[20]`
- [x] `layout.listItemHeight` → `56`

### `src/theme/colors.ts`
- [x] Add `onPrimary` (`#163300`) to `ThemePalette`
- [x] Add `backgroundNeutral` token
- [ ] Audit dark mode `danger` / `warning` / `success` — verify WCAG AAA on `#163300` background
- [ ] Eliminate all `colors.primaryDark` references app-wide → replace with `colors.primary` (bg) or `colors.onPrimary` (text on green)

---

## Phase 2 — Core UI Library

### `src/components/ui/Button.tsx`
- [x] All variants → `radius.full`
- [x] Primary: `colors.onPrimary` text
- [x] Heights: sm=32, md=44, lg=56
- [x] `tertiary` variant added
- [x] `secondary`/`outline` border → 1.5px
- [x] No `shadow.sm` on primary

### `src/components/ui/Card.tsx`
- [x] All variants → `radius['3xl']`
- [x] No auto `shadow.sm`
- [x] `sm=spacing[16]`, `md=spacing[20]`, `lg=spacing[24]`
- [x] `pressable` prop added

### `src/components/ui/Input.tsx`
- [x] Focus border → green 1.5px
- [x] Label → 13px `sansSemiBold`
- [x] `helperText` prop
- [x] `leadingIcon` prop
- [x] `trailingElement` prop
- [x] `filled`/`default` bg → `colors.card`

### `src/components/ui/ListItem.tsx`
- [x] Min height 56px
- [x] Bg → `colors.card`
- [x] Auto chevron when `onPress`
- [x] Icon container → `radius.full`
- [x] Title 14px `sansSemiBold`, subtitle 12px `sans`
- [x] Selected → primary tint bg

### `src/components/ui/TransactionRow.tsx`
- [x] Icon box → `radius.full`
- [x] No border on icon box
- [x] Icon 20px
- [x] Row min-height 64px
- [x] Date 11px

### `src/components/ui/MoneyText.tsx`
- [x] `display` prop (40px, tight letterSpacing)
- [x] CR → success, DR → danger, TRANSFER → text

### `src/components/ui/Badge.tsx`
- [x] `radius.full` pill
- [x] Padding 3/10
- [x] Font 11px `sansSemiBold`, no uppercase

### `src/components/ui/Chip.tsx`
- [x] `radius.full`
- [x] Selected: `colors.primary` + `colors.onPrimary`
- [x] Unselected: `colors.card`

### `src/components/ui/IconBox.tsx`
- [x] Default shape → `'circle'`
- [x] Sizes: xs=28, sm=32, md=40, lg=48, xl=56
- [x] No default border

### `src/components/ui/Header.tsx`
- [x] Back → bare `chevron-back`, `variant="ghost"`
- [ ] Add `titleAlign` prop for modal headers (center alignment)

### `src/components/ui/EmptyState.tsx`
- [x] Icon container → `colors.primary+'1A'`, no border
- [x] Icon color → `colors.primary`
- [x] CTA → `Button` primary pill

### `src/components/ui/Divider.tsx`
- [x] `StyleSheet.hairlineWidth`
- [x] `label` prop

### `src/components/ui/SectionLabel.tsx`
- [x] Font → `sansMedium`
- [ ] Audit all callers that pass `uppercase` prop and remove it

### `src/components/ui/KPICard.tsx`
- [x] `radius['3xl']`
- [x] Labels sentence case, `sansMedium` 12px/11px
- [x] No border, bg → `colors.card`
- [x] Active currency tab → `colors.primary` + `colors.onPrimary`
- [ ] Primary metric → `MoneyText` with `display` prop

### `src/components/ui/Typography.tsx`
- [x] `display` variant (40px, heading, letterSpacing −1.5)
- [x] `caption` variant (11px, `sans`, textMuted)
- [x] `label` variant — no uppercase, `sansMedium`

### `src/components/ui/AlertModal.tsx`
- [ ] Container → `radius['3xl']` (currently `radius['2xl']`)
- [ ] Confirm button: `colors.primary` bg → `colors.onPrimary` text (currently `colors.text` bg)
- [ ] Cancel button: `radius.full`
- [ ] Remove `letterSpacing` from title

### `src/components/ui/ConfirmDialog.tsx`
- [ ] Container → `radius['3xl']` (currently `radius['2xl']`)
- [ ] Confirm button: `colors.primary` bg + `colors.onPrimary` text (currently `colors.background`)
- [ ] Destructive button: keep `colors.danger` bg
- [ ] Cancel button: `colors.card` bg, `radius.full`
- [ ] Remove `letterSpacing` from title

### `src/components/ui/OptionsDialog.tsx`
- [ ] Sheet top → `radius['3xl']`
- [ ] Search bar → `radius.full`, `colors.card` bg
- [ ] Option rows: `colors.card` bg, `radius['3xl']`
- [ ] Selected: `colors.primary+'08'` bg (already close — verify `onPrimary` for checkmark)
- [ ] Remove `letterSpacing` from section headers

### `src/components/ui/CurrencyPickerModal.tsx`
- [ ] Sheet container top → `radius['3xl']`
- [ ] Search bar → `radius.full`, `colors.card` bg
- [ ] Selected item → `colors.primary+'15'` + `colors.primary` border (currently `colors.surface`)
- [ ] Remove `letterSpacing` on section labels
- [ ] Currency item rows → `colors.card` bg

### `src/components/ui/IconPickerDialog.tsx`
- [ ] Sheet container top → `radius['3xl']`
- [ ] Search bar → `radius.full`, `colors.card` bg
- [ ] Selected icon cell → `colors.primary` bg (currently `colors.text` bg)
- [ ] Selected icon color → `colors.onPrimary` (currently `'#000100'`)
- [ ] Remove `letterSpacing` from category headers
- [ ] Done/close button → `radius.full`, `colors.primary`, `colors.onPrimary`

### `src/components/ui/PersonPickerDialog.tsx`
- [ ] Sheet top → `radius['3xl']`
- [ ] Search bar → `radius.full`, `colors.card` bg
- [ ] Selected item → `colors.primary+'08'` bg + `colors.primary` checkmark
- [ ] Avatar → `radius.full`, `colors.primary+'15'` bg
- [ ] Remove `letterSpacing` from title

### `src/components/ui/PlacePickerDialog.tsx`
- [ ] Same as PersonPickerDialog above (identical structure)

### `src/components/ui/PremiumGuard.tsx`
- [ ] Teaser card → `radius['3xl']`, no shadow, `colors.card` bg
- [ ] CTA button → `radius.full`, `colors.primary`, `colors.onPrimary`

### `src/components/ui/IconButton.tsx`
- [ ] Ghost variant → no background by default (audit current bg values)
- [ ] Active/filled → `colors.primary` bg + `colors.onPrimary` icon

---

## Phase 3 — Navigation & Layout

### `app/(main)/_layout.tsx` (Tab bar)
- [ ] Tab bar bg → `colors.card`
- [ ] Active tab icon/label → `colors.primary`
- [ ] Inactive tab → `colors.textMuted`
- [ ] Tab bar border top → `colors.border`
- [ ] No tab bar shadow
- [ ] FAB in tab bar (if any) → 56px, `radius.full`, `colors.primary`, `shadow.md`, `colors.onPrimary` icon

### `app/_layout.tsx` (Root layout)
- [ ] Verify `StatusBar` style matches theme (light content on dark bg)
- [ ] No unexpected background colors

### `app/(onboarding)/_layout.tsx`
- [ ] Onboarding container bg → `colors.background`

---

## Phase 4 — Dashboard

### `src/features/dashboard/screens/DashboardScreen.tsx`
- [x] Hero card → `radius['3xl']`, `colors.card`, sentence case, no shadow
- [x] KPI cards → `radius['3xl']`, `colors.card`, `sansMedium` labels
- [x] Account cards → `radius['3xl']`, `radius.full` icon boxes, no shadow
- [x] Quick actions → `radius.full` pills, `colors.primary`, `colors.onPrimary`
- [x] FAB → 56px, `colors.primary`, `shadow.md`, `colors.onPrimary`
- [x] Currency tab selector → `colors.primary` active + `colors.onPrimary`
- [ ] Summary cards scroll row → `spacing[12]` gap between cards

### `src/features/dashboard/components/TopExpenseCategoriesCard.tsx`
- [x] Tab active → `colors.primary` + `colors.onPrimary`
- [ ] Card container → `radius['3xl']` (verify — currently `radius.xl`)
- [ ] Removed `...shadow.xs` on card
- [ ] Category bar fill → `colors.primary`

### `src/features/dashboard/components/InsightCard.tsx`
- [ ] Card → `radius['3xl']` (currently `radius.xl`)
- [ ] Remove `...shadow.xs`
- [ ] Label → `sansMedium` 12px, no `letterSpacing`
- [ ] Remove `colors.primaryDark` reference → `colors.primary`
- [ ] Icon box → `radius.full`

### `src/features/dashboard/components/GoalsSummaryCard.tsx`
- [ ] Card → `radius['3xl']` (currently `radius.xl`)
- [ ] Remove `...shadow.xs`
- [ ] Progress bar → 4px, `radius.full`, `colors.primary` fill
- [ ] "View all" link → `colors.primary` (remove `colors.primaryDark`)
- [ ] Empty state icon → `radius.full`, `colors.primary+'1A'` bg

### `src/features/dashboard/components/BudgetSummaryCard.tsx`
- [ ] Card → `radius['3xl']` (currently `radius.xl`)
- [ ] Remove `...shadow.xs`
- [ ] Progress bar → 4px, `radius.full`, `colors.primary` fill (danger/warning stay)
- [ ] Remove `letterSpacing` from any labels
- [ ] "View all" link → `colors.primary` (remove `colors.primaryDark`)

### `src/features/dashboard/components/LoansSummaryCard.tsx`
- [ ] Card → `radius['3xl']` (currently `radius.xl`)
- [ ] Remove `...shadow.xs`
- [ ] Remove `letterSpacing: 1` from label
- [ ] "View all" link → `colors.primary` (remove `colors.primaryDark`)
- [ ] Progress bar → 4px, `radius.full`

### `src/features/dashboard/components/PeopleSummaryCard.tsx`
- [ ] Card → `radius['3xl']` (currently `radius.xl`)
- [ ] Remove `...shadow.xs` (if present)
- [ ] Avatar → `radius.full`, `colors.primary+'15'` bg
- [ ] Font labels → `sansMedium` 12px, no `letterSpacing`
- [ ] "View all" / add → `colors.primary` (remove `colors.primaryDark`)

### `src/features/dashboard/components/PlacesSummaryCard.tsx`
- [ ] Card → `radius['3xl']` (currently `radius.xl`)
- [ ] Avatar → `radius.full`, `colors.primary+'15'` bg
- [ ] Font labels → `sansMedium` 12px, no `letterSpacing`
- [ ] "View all" / add → `colors.primary` (remove `colors.primaryDark`)

### `src/features/dashboard/components/SectionHeader.tsx`
- [x] Sentence case, remove `letterSpacing`

---

## Phase 5 — Transactions

### `src/features/transactions/screens/TransactionsScreen.tsx`
- [x] Date section headers → 12px `sansMedium`, sentence case
- [x] Empty state → `colors.primary+'1A'` icon box, pill CTA
- [x] FAB → 56px, `colors.primary`, `shadow.md`, `colors.onPrimary`
- [x] Filter labels → sentence case, `sansMedium` 12px

### `src/features/transactions/screens/TransactionFormPage.tsx`
- [x] All labels sentence case, `sansMedium`
- [x] Header titles sentence case
- [x] Date/time buttons → `radius['3xl']`, no shadow
- [x] Note container → `radius['3xl']`, no shadow
- [x] Save button → `radius.full`, `colors.primary`, `colors.onPrimary`, `shadow.md`

### `src/features/transactions/components/TransactionTypePicker.tsx`
- [x] Pills → `radius.full`
- [x] Transfer selected → `colors.primary` + `colors.onPrimary`
- [x] DR/CR selected → danger/success bg with `colors.background` text

### `src/features/transactions/components/TransactionAmountInput.tsx`
- [x] Label → sentence case, `sansMedium` 12px, no `letterSpacing`

### `src/features/transactions/components/TransactionAccountPicker.tsx`
- [x] Label → sentence case, `sansMedium` 12px

### `src/features/transactions/components/TransactionCategoryPicker.tsx`
- [x] Label → sentence case, `sansMedium` 12px

### `src/features/transactions/components/TransactionBudgetPicker.tsx`
- [x] Label → sentence case, `sansMedium` 12px

### `src/features/transactions/components/TransactionGoalPicker.tsx`
- [x] Label sentence case, selected → `colors.primary` + `colors.onPrimary`

### `src/features/transactions/components/TransactionLoanPicker.tsx`
- [x] Label sentence case, selected → `colors.primary` + `colors.onPrimary`

### `src/features/filters/components/AdvancedFilterSheet.tsx`
- [x] Sheet top → `radius['3xl']`
- [x] Search bar → `radius.full`, `colors.card` bg + border
- [x] All section labels → `sansMedium` 12px, no `letterSpacing`
- [x] Card surfaces → `radius['3xl']`, `colors.card`
- [x] Type cards → `radius['3xl']`, `radius.full` icon boxes
- [x] Category chips → `radius.full`, `colors.card`
- [x] Sort toggles + checkboxes → `radius.full`, `colors.primary` active, `colors.onPrimary`
- [x] Apply button → `radius.full`, `colors.primary`, `colors.onPrimary`
- [x] Count badge → `colors.onPrimary`
- [x] Reset/close → `radius.full`

---

## Phase 6 — Accounts

### `app/account/create.tsx`
- [x] Header → "New account" (sentence case)
- [x] Labels → `sansMedium` 12px, no `letterSpacing`
- [x] Card → `radius['3xl']`, no shadow
- [x] Type chips → `radius.full`
- [x] Visual button → `radius['3xl']`
- [x] Icon box → `radius.full`
- [x] Color active ring → `colors.primary`
- [x] Save button → `radius.full`, `colors.primary`, `colors.onPrimary`, `shadow.md`

### `app/account/edit/[id].tsx`
- [x] Header → "Edit account"
- [x] Same as create above
- [x] Loading indicator → `colors.primary`

### `src/features/accounts/components/AccountFormModal.tsx`
- [ ] Modal sheet top → `radius['3xl']`
- [ ] Labels → `sansMedium` 12px, no `letterSpacing`
- [ ] Type chips → `radius.full` pills
- [ ] Icon type selector → `radius.full`, `colors.primary` active + `colors.onPrimary`
- [ ] Icon grid → selected cell: `colors.primary` bg + `colors.onPrimary` icon (not `colorHex`)
- [ ] Color active ring → `colors.primary` border
- [ ] Save button → `radius.full`, `colors.primary`, `colors.onPrimary`, `shadow.md`
- [ ] Close/cancel → `radius.full`
- [ ] Remove `letterSpacing` from title

---

## Phase 7 — Categories

### `src/features/categories/screens/CategoriesScreen.tsx`
- [x] Search bar → `radius.full`, `colors.card`
- [x] Filter meta → `sansMedium` 11px, no `letterSpacing`
- [x] Empty state CTA → `radius.full`, `colors.primary`, `colors.onPrimary`
- [x] FAB → 56px, `colors.primary`, `shadow.md`, `colors.onPrimary`

### `src/features/categories/components/CategoryTypeSelector.tsx`
- [x] Rail container → `radius['3xl']`, `colors.card`
- [x] Active segment → `colors.primary` + `colors.onPrimary`
- [x] No `letterSpacing`

### `src/features/categories/components/CategoryCard.tsx`
- [x] Badge font 10px, no `letterSpacing`
- [x] Footer text no `letterSpacing`
- [ ] Card container → `radius['3xl']` (currently `radius.xl`)
- [ ] Icon box → remove `borderWidth`/`borderColor`

### `app/category/create.tsx`
- [x] Labels → `sansMedium` 12px, no `letterSpacing`
- [x] Type tabs → `radius.full`, `colors.primary` active, `colors.onPrimary`
- [x] Icon preview → `radius.full`, no border
- [x] Color active ring → `colors.primary`
- [x] Save button → `radius.full`, `shadow.md`, `colors.onPrimary`

### `app/category/edit/[id].tsx`
- [x] Same as create above

---

## Phase 8 — Goals

### `src/features/goals/screens/GoalsScreen.tsx`
- [ ] FAB → 56px, `colors.primary`, `shadow.md`, `colors.onPrimary` icon (currently `colors.primary` icon on wrong bg)
- [ ] Progress bar → 4px height, `radius.full`, `colors.primary` fill, `colors.border+'40'` track
- [ ] Status badge → `radius.full`, sentence case, `sansMedium`
- [ ] Card → confirm `radius['3xl']` via `Card` component

### `src/features/goals/screens/GoalFormPage.tsx`
- [ ] Account selector chips: selected → `colors.primary` bg + `colors.onPrimary` (currently `colors.text` bg)
- [ ] Status chips: selected → `colors.primary` + `colors.onPrimary` (currently `colors.text` bg)
- [ ] Card containers → `radius['3xl']` (currently `radius.lg`)
- [ ] Color cells → active ring `colors.primary` (currently `colors.text` border)
- [ ] Section containers → `colors.card` bg (currently `colors.surface`)
- [ ] Date buttons → `radius['3xl']`, no shadow
- [ ] Save button → `radius.full`, `colors.primary`, `colors.onPrimary`, `shadow.md`
- [ ] Labels → `sansMedium` 12px, no `letterSpacing`

### `src/features/goals/screens/GoalDetailsScreen.tsx`
- [ ] Hero card → `radius['3xl']`, `colors.card`, no shadow
- [ ] Progress bar → 4px, `radius.full`, `colors.primary` fill
- [ ] Remove `letterSpacing: -1` from hero amount
- [ ] Meta labels → `sansMedium` 12px

---

## Phase 9 — Loans

### `src/features/loans/screens/LoansScreen.tsx`
- [ ] FAB → 56px, `colors.primary`, `shadow.md`, `colors.onPrimary` icon
- [ ] Progress bar → 4px, `radius.full`, danger/success fill stays
- [ ] Status badge → `radius.full`, sentence case, `sansMedium`
- [ ] Card → confirm `radius['3xl']` via `Card` component

### `src/features/loans/screens/LoanFormPage.tsx`
- [ ] Loan type chips: BORROW stays danger, LEND stays success — but selected text → `colors.background`
- [ ] Account selector chips: selected → `colors.primary` bg + `colors.onPrimary` (currently `colors.text` bg)
- [ ] Status chips: selected → `colors.primary` + `colors.onPrimary` (currently `colors.text` bg)
- [ ] Card containers → `radius['3xl']` (currently `radius.lg`)
- [ ] Color cells → active ring `colors.primary` (currently `colors.text` border)
- [ ] Section containers → `colors.card` bg (currently `colors.surface`)
- [ ] Date buttons → `radius['3xl']`, no shadow
- [ ] Save button → `radius.full`, `colors.primary`, `colors.onPrimary`, `shadow.md`
- [ ] Labels → `sansMedium` 12px

### `src/features/loans/screens/LoanDetailsScreen.tsx`
- [ ] Hero card → `radius['3xl']`, `colors.card`, no shadow
- [ ] Progress bar → 4px, `radius.full`
- [ ] Remove `letterSpacing: -1` from hero amount
- [ ] "Add payment" FAB/button → `colors.primary`, `colors.onPrimary`

---

## Phase 10 — Budgets

### `src/features/budgets/screens/BudgetsScreen.tsx`
- [x] FAB icon → `colors.onPrimary`
- [ ] FAB → verify 56px, `colors.primary`, `shadow.md`
- [ ] Progress bar → 4px, `radius.full`, danger/warning fill stays
- [ ] Status badge → `radius.full`, sentence case
- [ ] Card → confirm `radius['3xl']` via `Card` component
- [ ] FAB bubble on item (selected state) → `colors.primary` bg text
- [ ] Period label → `sansMedium` 11px, no `letterSpacing`

### `src/features/budgets/screens/BudgetFormPage.tsx`
- [x] Save button → `colors.primary`, `colors.onPrimary`, `shadow.md`
- [x] ActivityIndicator → `colors.onPrimary`
- [ ] Category/period selector chips: selected → `colors.primary` + `colors.onPrimary` (currently `colors.text` bg)
- [ ] Card containers → `radius['3xl']`
- [ ] Labels → `sansMedium` 12px, no `letterSpacing`
- [ ] Section bg → `colors.card` (currently `colors.surface`)

### `src/features/budgets/screens/BudgetDetailsScreen.tsx`
- [ ] Hero card → `radius['3xl']`, `colors.card`, no shadow
- [ ] Progress bar → 4px, `radius.full`
- [ ] Remove `letterSpacing: -1` from hero amount
- [ ] Labels → `sansMedium` 12px
- [ ] Transaction list → section headers sentence case, `sansMedium`

---

## Phase 11 — Recurring

### `src/features/recurring/screens/RecurringScreen.tsx`
- [x] FAB → 56px, `colors.primary`, `shadow.md`, `colors.onPrimary`
- [x] Empty state CTA → `colors.primary`, `colors.onPrimary`
- [x] Active tab → `colors.primary` border + text
- [x] "PAUSED" badge → "Paused" sentence case

### `src/features/recurring/screens/RecurringFormPage.tsx`
- [x] Save button → `colors.primary`, `colors.onPrimary`, `shadow.md`
- [x] ActivityIndicator → `colors.onPrimary`
- [ ] Frequency/interval chips: selected → `colors.primary` + `colors.onPrimary` (currently `colors.text` bg)
- [ ] Card containers → `radius['3xl']`
- [ ] Labels → `sansMedium` 12px, no `letterSpacing`
- [ ] Section bg → `colors.card` (currently `colors.surface`)

---

## Phase 12 — People

### `src/features/people/screens/PeopleScreen.tsx`
- [ ] FAB → 56px, `colors.primary`, `shadow.md`, `colors.onPrimary`
- [ ] Avatar → `radius.full`, `colors.primary+'20'` bg (already has bg — verify color)
- [ ] Empty state → `colors.primary+'1A'` icon box, pill CTA
- [ ] Card row → `radius['3xl']`, `colors.card`, no shadow

### `src/features/people/screens/PersonFormPage.tsx`
- [ ] Card container → `radius['3xl']` (currently `radius.lg`)
- [ ] Color active ring → `colors.primary` border (currently `colors.text`)
- [ ] Icon preview box → `radius.full`, no border
- [ ] Save button → `radius.full`, `colors.primary`, `colors.onPrimary`, `shadow.md`
- [ ] Labels → `sansMedium` 12px
- [ ] Color cell hardcoded `borderRadius: 14` → `radius.full`

### `src/features/people/screens/PersonDetailsScreen.tsx`
- [ ] Avatar → `radius.full`, `colors.primary+'20'` bg
- [ ] Hero stats card → `radius['3xl']`, `colors.card`, no shadow
- [ ] Separator → `StyleSheet.hairlineWidth`, `colors.border`
- [ ] Loan row icon → `radius.full`, `colors.primary+'20'` bg
- [ ] "Add" FAB → 56px, `colors.primary`, `shadow.md`, `colors.onPrimary`

---

## Phase 13 — Places

### `src/features/places/screens/PlacesScreen.tsx`
- [ ] FAB → 56px, `colors.primary`, `shadow.md`, `colors.onPrimary`
- [ ] Avatar → `radius.full`, `colors.primary+'20'` bg
- [ ] Empty state → pill CTA, `colors.primary`, `colors.onPrimary`
- [ ] Card row → `radius['3xl']`, `colors.card`

### `src/features/places/screens/PlaceFormPage.tsx`
- [ ] Card container → `radius['3xl']` (currently `radius.lg`)
- [ ] Color active ring → `colors.primary` border (currently `colors.text`)
- [ ] Icon preview → `radius.full`, no border
- [ ] Save button → `radius.full`, `colors.primary`, `colors.onPrimary`, `shadow.md`
- [ ] Labels → `sansMedium` 12px
- [ ] Color cell hardcoded `borderRadius: 14` → `radius.full`

### `src/features/places/screens/PlaceDetailsScreen.tsx`
- [ ] Avatar → `radius.full`, `colors.primary+'20'` bg
- [ ] Stats card → `radius['3xl']`, `colors.card`, no shadow
- [ ] Separator → `StyleSheet.hairlineWidth`, `colors.border`
- [ ] "Add" FAB → 56px, `colors.primary`, `shadow.md`, `colors.onPrimary`

---

## Phase 14 — Reports

### `app/(main)/reports/index.tsx`
- [ ] All card containers → `radius['3xl']` (currently `radius.xl`, `radius.lg`, `24px`)
- [ ] Remove all `letterSpacing` from labels/badges
- [ ] Report type selector → `radius.full` pills, `colors.primary` active, `colors.onPrimary`
- [ ] Remove raw `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius` → use `theme.shadow.*` or remove
- [ ] Category/item bg chips → `colors.card` (currently `colors.surface+'80'`)
- [ ] Section labels → `sansMedium` 12px, no `letterSpacing`
- [ ] Progress/bar indicators → `colors.primary` fill
- [ ] "View" buttons → `radius.full`, `colors.primary`, `colors.onPrimary`

### `src/features/reports/components/ReportHeader.tsx`
- [ ] Container → `radius['3xl']` (currently hardcoded `borderRadius: 22`)
- [ ] Remove `letterSpacing: -1` from title
- [ ] Back button → bare chevron, ghost style
- [ ] Bg → `colors.card` (currently `colors.surface`)

### `src/features/reports/components/MetricCard.tsx`
- [x] Container → `radius['3xl']`, `colors.card`, no shadow
- [x] Label → `sansMedium` 11px, no `letterSpacing`

### `src/features/reports/components/StreakBadge.tsx`
- [x] No `letterSpacing`, font 11px

---

## Phase 15 — Search

### `src/features/search/screens/SearchScreen.tsx`
- [x] Search input → `radius.full` pill, 48px
- [x] Prompt icon boxes → `radius.full`, `colors.primary+'1A'`
- [x] Section headers → `sansMedium` 12px, no `letterSpacing`
- [x] Account/category rows → `colors.card`, `radius['3xl']`, `radius.full` icon boxes

---

## Phase 16 — Settings & Premium

### `app/(main)/settings.tsx`
- [x] Hero panel → `radius['3xl']`, `colors.card`
- [x] All labels → sentence case, `sansMedium`
- [x] Card containers → `radius['3xl']`, `colors.card`
- [x] Modal buttons → `radius.full`, `colors.primary`/`onPrimary`

### `app/premium.tsx`
- [x] All uppercase labels removed
- [x] `heroKicker` → `sansMedium` 12px, no `letterSpacing`
- [x] `lifetimeCard` → `radius['3xl']`, `colors.card`
- [x] `settingsCard` → `radius['3xl']`, `colors.card`
- [x] `buyBtn` / `actionBtn` → `radius.full` 56px, `colors.primary`, `colors.onPrimary`, `shadow.md`
- [x] `statusPill` → `radius.full`, sentence case
- [x] `cardBadgeText` → `colors.onPrimary`

---

## Phase 17 — Export & Backup

### `src/features/export/screens/ExportScreen.tsx`
- [x] Export button → `radius.full`, `colors.primary`, `shadow.md`, `colors.onPrimary`
- [x] Icon + ActivityIndicator → `colors.onPrimary`

### `src/features/backup/screens/BackupScreen.tsx`
- [ ] Card containers → `radius['3xl']` (currently `radius.xl`)
- [ ] Section label → `sansMedium` 12px, no `letterSpacing` (currently has `letterSpacing: 2`)
- [ ] Icon boxes → `radius['2xl']` → `radius.full`
- [ ] Warning banner → `radius['3xl']` (currently `radius.lg`)
- [ ] Row items → `colors.card` bg (currently `colors.surface`)

---

## Phase 18 — Stats & Developer

### `app/(main)/stats.tsx`
- [ ] All card containers → `radius['3xl']` (currently `radius.xl`, `radius.lg`)
- [ ] Remove `letterSpacing` from all badge/label text (`letterSpacing: 1`, `0.8`, `0.5`)
- [ ] Bar chart backgrounds → `radius.full` corners
- [ ] Section labels → `sansMedium` 12px
- [ ] Selected state bg → `colors.primary` (currently `colors.text+'08'`)
- [ ] `colors.surface` → `colors.card` for row backgrounds

### `app/(main)/developer.tsx`
- [ ] Card containers → `radius['3xl']`
- [ ] Section labels → `sansMedium` 12px, sentence case
- [ ] Test buttons → `radius.full`, `colors.primary`, `colors.onPrimary`

---

## Phase 19 — Onboarding

### `src/features/onboarding/components/WelcomeStep.tsx`
- [ ] Hero badge → `colors.primary` bg + `colors.onPrimary` text (currently `colors.primaryDark`)
- [ ] Feature card → `radius['3xl']` (currently `radius.lg`), no `shadow.xs`
- [ ] Feature icon box → `radius.full`, `colors.primary+'15'` bg (currently `colors.primary+'15'` — verify)
- [ ] Continue button → `radius.full`, `colors.primary`, `colors.onPrimary`, 56px
- [ ] Remove `letterSpacing` from badge/feature label text

### `src/features/onboarding/components/ProfileStep.tsx`
- [ ] Remove `letterSpacing` from feature badge text
- [ ] Card → `radius['3xl']` (currently `radius.lg`)
- [ ] Input field → `colors.card` bg, `radius['3xl']` container
- [ ] Currency picker row → `radius['3xl']`, `colors.card`
- [ ] Save button → `radius.full`, `colors.primary`, `colors.onPrimary`, 56px

---

## Phase 20 — Global Polish

- [ ] All `TouchableOpacity` → `activeOpacity={0.75}` (audit inconsistencies)
- [ ] All `colors.primaryDark` references → replace with `colors.primary` (bg) or `colors.onPrimary` (text on green)
- [ ] All `colors.surface` card backgrounds → `colors.card`
- [ ] All bottom sheet drag handles → 4px × 32px, `radius.full`, `colors.border`
- [ ] Loading skeletons → 3 grey `ListItem`-height placeholder rows (replace `ActivityIndicator` on list screens)
- [ ] FAB audit — verify ALL FABs: 56×56, `radius.full`, `colors.primary`, `shadow.md`, `colors.onPrimary` icon
- [ ] Progress bar audit — ALL progress bars: height 4, `radius.full`, `colors.primary` fill, `colors.border+'40'` track
- [ ] Icon box border audit — remove all `borderWidth`/`borderColor` from icon boxes unless explicitly needed
- [ ] `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on primary button presses
- [ ] Dark mode contrast audit — `danger`/`warning`/`success` on `#163300` bg at WCAG AAA

---

## Completion Tracking

| Phase | Section | Total Items | Done |
|-------|---------|-------------|------|
| 1 | Foundation tokens | 5 | 4 |
| 2 | Core UI library | 60 | 38 |
| 3 | Navigation/layout | 5 | 0 |
| 4 | Dashboard | 18 | 6 |
| 5 | Transactions | 22 | 22 |
| 6 | Accounts | 13 | 10 |
| 7 | Categories | 12 | 10 |
| 8 | Goals | 12 | 0 |
| 9 | Loans | 12 | 0 |
| 10 | Budgets | 13 | 2 |
| 11 | Recurring | 9 | 4 |
| 12 | People | 13 | 0 |
| 13 | Places | 12 | 0 |
| 14 | Reports | 15 | 5 |
| 15 | Search | 4 | 4 |
| 16 | Settings & Premium | 16 | 16 |
| 17 | Export & Backup | 6 | 3 |
| 18 | Stats & Developer | 9 | 0 |
| 19 | Onboarding | 9 | 0 |
| 20 | Global polish | 10 | 0 |
| **Total** | | **~275** | **~124** |
