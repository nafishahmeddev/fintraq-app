# Wise-Inspired UI Refinement Plan

Tracks visual alignment with [wise.design](https://wise.design) principles across every layer of the app.
This is a **refinement pass** on top of the completed theme migration — not a migration from scratch.

---

## Wise Design Principles Applied to Luno

| Principle | Wise Rule | Current Gap |
|-----------|-----------|-------------|
| **Pill buttons** | `radius.full` (9999) on all buttons & chips | ✅ Fixed |
| **28px cards** | `radius['3xl']` on all cards & containers | ✅ Fixed |
| **Circular icon containers** | `radius.full` on icon boxes, avatars | ✅ Fixed |
| **Green as pure accent** | Bright Green (#9FE870) for interactive only | ✅ Fixed — `colors.onPrimary` added |
| **Background-first separation** | Card bg vs screen bg — no decorative shadows | ✅ Fixed — no default shadow |
| **Generous spacing** | 24px screen padding, 32px between sections | ✅ Fixed — `sectionGap=32` |
| **Clear type hierarchy** | Size + weight contrast, sentence case only | ✅ Fixed — no uppercase in tokens |
| **AAA color contrast** | All text meets WCAG AAA on its background | ⏳ Dark mode audit pending |

---

## Phase 1 — Foundation (Tokens & Colors)

### `src/theme/tokens.ts`
- [x] `layout.sectionGap` → `spacing[32]`
- [x] Add `layout.cardPadding` → `spacing[20]`
- [x] Add `layout.listItemHeight` → `56`

### `src/theme/colors.ts`
- [x] Add `onPrimary` to `ThemePalette`
- [ ] Audit dark mode `danger` / `warning` / `success` — verify legible on `#163300` bg at AAA contrast
- [x] Add `backgroundNeutral` token

---

## Phase 2 — Core UI Library

### `src/components/ui/Button.tsx`
- [x] All size variants → `radius.full` (9999)
- [x] Primary variant: text color → `colors.onPrimary`
- [x] Resize heights: `sm=32px`, `md=44px`, `lg=56px`
- [x] Add `tertiary` variant
- [x] `secondary` / `outline` border → 1.5px
- [x] Remove `shadow.sm` on primary buttons

### `src/components/ui/Card.tsx`
- [x] All variants → `radius['3xl']` (28px)
- [x] Remove auto `shadow.sm` on `default` variant
- [x] `sm=spacing[16]`, `md=spacing[20]`, `lg=spacing[24]` padding
- [x] Add `pressable` boolean prop

### `src/components/ui/Input.tsx`
- [x] Focus state — green border 1.5px on focus
- [x] Label → 13px, `sansSemiBold`, `colors.text`
- [x] Add `helperText?: string` prop
- [x] Add `leadingIcon?: IoniconName` prop
- [x] Add `trailingElement?: React.ReactNode` prop
- [x] `filled` / `default` variant bg → `colors.card`

### `src/components/ui/ListItem.tsx`
- [x] Min height → 56px
- [x] Background → `colors.card`
- [x] Auto-show `chevron-forward` when `onPress` and no `rightElement`
- [x] Icon container shape → `radius.full` circle
- [x] Title 14px `sansSemiBold`, Subtitle 12px `sans`
- [x] Selected state → primary tint bg

### `src/components/ui/TransactionRow.tsx`
- [x] Icon box → `radius.full` (circle)
- [x] Remove `borderWidth` / `borderColor` from icon box
- [x] Icon size → 20px
- [x] Row min-height → 64px
- [x] Date → 11px

### `src/components/ui/MoneyText.tsx`
- [x] Add `display` prop (40px, tight letter-spacing)
- [x] `CR` → success, `DR` → danger, `NONE`/`TRANSFER` → text color

### `src/components/ui/Badge.tsx`
- [x] `radius.full` pill — was already correct
- [x] Compact padding: 3/10
- [x] Font 11px, `sansSemiBold`, no uppercase

### `src/components/ui/Chip.tsx`
- [x] `radius.full`
- [x] Selected: `colors.primary` bg + `colors.onPrimary` text
- [x] Unselected: `colors.card` bg

### `src/components/ui/IconBox.tsx`
- [x] Default `shape` → `'circle'`
- [x] Sizes: xs=28, sm=32, md=40, lg=48, xl=56
- [x] No default border — only when `borderColor` explicitly passed

### `src/components/ui/Header.tsx`
- [x] Back button → bare `chevron-back`, `variant="ghost"`
- [ ] Title alignment → center for modal headers (future: add `titleAlign` prop)

### `src/components/ui/EmptyState.tsx`
- [x] Icon container → `colors.primary + '1A'` tint, no border
- [x] Icon color → `colors.primary`
- [x] CTA → `Button` component (primary pill)

### `src/components/ui/Divider.tsx`
- [x] `StyleSheet.hairlineWidth` for pixel-perfect line
- [x] Add `label?: string` prop

### `src/components/ui/SectionLabel.tsx`
- [x] Font → `sansMedium` (was `sansBold`)
- [ ] `uppercase` prop default already `false` — callers using it need audit

### `src/components/ui/KPICard.tsx`
- [x] Radius → `radius['3xl']`
- [x] Labels → sentence case, `sansMedium`, 12px/11px
- [x] Removed border, bg → `colors.card`
- [x] Active currency tab text → `colors.onPrimary`
- [ ] Primary metric → `MoneyText` with `display` prop (future enhancement)

### `src/components/ui/Typography.tsx`
- [x] Add `display` variant (40px, `heading`, letterSpacing −1.5)
- [x] Add `caption` variant (11px, `sans`, textMuted)
- [x] `label` variant — no uppercase, `sansMedium`

---

## Phase 3 — Feature Screens

### Dashboard (`src/features/dashboard/screens/DashboardScreen.tsx`)
- [x] Hero card → `radius['3xl']`, `colors.card` bg, sentence case labels, no shadow
- [x] KPI cards → `radius['3xl']`, `colors.card`, sansMedium labels
- [x] Account cards → `radius['3xl']`, `radius.full` icon boxes, no shadow
- [x] Quick actions → `radius.full` pills, `colors.primary` bg, `colors.onPrimary` text/icons
- [x] FAB → 56px, `colors.primary`, `shadow.md`, `colors.onPrimary` icon
- [x] Currency tab selector → `colors.primary` active bg, `colors.onPrimary` active text
- [x] `TopExpenseCategoriesCard` → tab active uses `colors.primary` + `colors.onPrimary`
- [ ] Summary cards row → horizontal scroll, `spacing[12]` gap (dashboard cards: goals, loans, budgets, people, places)

### Transactions Screen (`src/features/transactions/screens/TransactionsScreen.tsx`)
- [x] Date section headers → 12px, `sansMedium`, sentence case
- [x] Empty state → circle icon box `colors.primary + '1A'`, pill CTA button
- [x] FAB → 56px, `colors.primary`, `shadow.md`, `colors.onPrimary` icon
- [x] Filter labels → sentence case, sansMedium 12px

### Transaction Form (`src/features/transactions/screens/TransactionFormPage.tsx`)
- [x] Amount input label → sentence case, sansMedium
- [x] Type selector → pill chips `radius.full`, `colors.primary`/`onPrimary` for Transfer
- [x] Section labels → sentence case, sansMedium 12px
- [x] Date/time buttons → `radius['3xl']`, no shadow
- [x] Note container → `radius['3xl']`, no shadow
- [x] Save button → `radius.full`, `colors.primary`, `colors.onPrimary`

### Transaction Sub-Components
- [x] `TransactionTypePicker` → `radius.full` pills, Transfer uses `colors.primary`/`onPrimary`
- [x] `TransactionAmountInput` → sentence case label, sansMedium
- [x] `TransactionAccountPicker` → sentence case default label, sansMedium
- [x] `TransactionCategoryPicker` → sentence case label, sansMedium
- [x] `TransactionBudgetPicker` → sentence case label, sansMedium
- [x] `TransactionGoalPicker` → sentence case label, `colors.primary` selected, `colors.onPrimary` text
- [x] `TransactionLoanPicker` → sentence case label, `colors.primary` selected, `colors.onPrimary` text

### Account Screens (`app/account/create.tsx`, `app/account/edit/[id].tsx`)
- [x] All labels → sentence case, sansMedium 12px
- [x] Account type chips → `radius.full` pills
- [x] Card containers → `radius['3xl']`, no shadow
- [x] Visual buttons → `radius['3xl']`, no shadow
- [x] Icon boxes → `radius.full`
- [x] Color picker active ring → `colors.primary`
- [x] Save button → `radius.full`, `colors.primary`, `colors.onPrimary`

### Categories Screen (`src/features/categories/screens/CategoriesScreen.tsx`)
- [x] Search bar → `radius.full`, `colors.card` bg
- [x] Filter meta → sansMedium 11px, no letterSpacing
- [x] Empty state CTA → `radius.full`, `colors.primary`, `colors.onPrimary`
- [x] FAB → 56px, `colors.primary`, `shadow.md`, `colors.onPrimary`
- [x] `CategoryTypeSelector` → `radius['3xl']` container, `colors.primary` active, `colors.onPrimary`
- [x] `CategoryCard` → removed letterSpacing from badges/footer

### Category Forms (`app/category/create.tsx`, `app/category/edit/[id].tsx`)
- [x] Labels → sansMedium 12px, no letterSpacing
- [x] Type tabs → `radius.full`, `colors.primary` active, `colors.onPrimary`
- [x] Icon preview → `radius.full`, no border
- [x] Color picker active ring → `colors.primary`
- [x] Save button → `radius.full`, `shadow.md`, `colors.onPrimary`

### Goals / Loans / Budgets Screens
- [ ] List screens: items in a single grouped `Card` (`radius['3xl']`) like Wise's summary blocks
- [ ] Progress bar component → 4px height, `radius.full`, `colors.primary` fill on `colors.card` track

### People / Places Screens
- [ ] Avatar/icon → circle `IconBox` (40px, `radius.full`)
- [ ] Card → `radius['3xl']`, `colors.card` bg

### Recurring Screen (`src/features/recurring/screens/RecurringScreen.tsx`)
- [x] FAB → 56px, `colors.primary`, `shadow.md`, `colors.onPrimary`
- [x] Empty state CTA → `colors.primary`, `colors.onPrimary`
- [x] Active tab indicator → `colors.primary`
- [x] "PAUSED" badge → "Paused" (sentence case)

### Reports Screen (`src/features/reports/`)
- [x] `MetricCard` → `radius['3xl']`, `colors.card` bg, no shadow, sansMedium label
- [x] `StreakBadge` → removed letterSpacing

### Search Screen (`src/features/search/screens/SearchScreen.tsx`)
- [x] Search input → `radius.full` pill, 48px height
- [x] Prompt icon boxes → `radius.full`, `colors.primary + '1A'`
- [x] Section headers → sansMedium 12px, no letterSpacing
- [x] Account/Category rows → `colors.card` bg, `radius['3xl']` corners, `radius.full` icon boxes

### Settings Screen (`app/(main)/settings.tsx`)
- [x] Hero panel → `radius['3xl']`, `colors.card` bg
- [x] All labels → sentence case, sansMedium
- [x] Card containers → `radius['3xl']`, `colors.card`
- [x] Modal buttons → `radius.full`, `colors.primary`/`onPrimary`

### Premium Screen (`app/premium.tsx`)
- [x] Hero kicker → sansMedium 12px, no letterSpacing/uppercase
- [x] Lifetime card → `radius['3xl']`, `colors.card`
- [x] Features card → `radius['3xl']`, `colors.card`
- [x] Section label → sansMedium 12px, no letterSpacing
- [x] Buy button → `radius.full` 56px, `colors.primary`, `colors.onPrimary`
- [x] Action button (success state) → `radius.full` 56px, `colors.primary`, `colors.onPrimary`
- [x] Legal links → sansMedium 12px, no letterSpacing/uppercase
- [x] Status pill → `radius.full`, sentence case text
- [x] Badge text → `colors.onPrimary`

### Filters (`src/features/filters/components/AdvancedFilterSheet.tsx`)
- [x] Sheet → `radius['3xl']` top corners
- [x] Search bar → `radius.full`, `colors.card` bg + border
- [x] Section labels → sansMedium 12px, no letterSpacing
- [x] Card surfaces → `radius['3xl']`, `colors.card`
- [x] Type cards → `radius['3xl']`, `radius.full` icon boxes
- [x] Category chips → `radius.full`, `colors.card`
- [x] Sort toggles → `radius.full`, `colors.primary` active, `colors.onPrimary`
- [x] Checkboxes → `radius.full`, `colors.primary` active, `colors.onPrimary` checkmark
- [x] Apply button → `radius.full`, `colors.primary`, `colors.onPrimary`
- [x] Count badge → `colors.onPrimary`
- [x] Reset/close buttons → `radius.full`

---

## Phase 4 — Interaction & Polish

- [ ] All `TouchableOpacity` → `activeOpacity: 0.75` (currently inconsistent between 0.7 and 0.75)
- [ ] Bottom sheets — drag handle: 4px height, 32px width, `radius.full`, `colors.border` color
- [ ] Pressed card states → `activeOpacity: 0.85` (lighter press on cards vs buttons)
- [ ] Add `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on primary button presses
- [ ] Loading skeleton — replace `ActivityIndicator` on list screens with placeholder rows (3 grey skeleton rows matching `ListItem` height)
- [ ] FAB (floating action button) — verify `radius.full`, 56px, `colors.primary` bg, `colors.onPrimary` icon

---

## Tracking Summary

| Phase | Total | Done |
|-------|-------|------|
| 1 — Foundation | 5 | 4 |
| 2 — Core UI Library | ~45 | ~42 |
| 3 — Feature Screens | ~40 | 0 |
| 4 — Polish | 6 | 0 |
| **Total** | **~96** | **~46** |
