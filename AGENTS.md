# Luno - AI Agent Instructions

A React Native financial tracker built with Expo, following an "Editorial Brutalist" design system.

## Quick Commands

```bash
# Dev server
npm start              # Expo dev server (iOS/Android/web)
npm run ios            # Start with iOS simulator
npm run android        # Start with Android emulator

# Database (Drizzle ORM + SQLite)
npm run db:generate    # Generate migrations after schema changes
npm run db:studio      # Open Drizzle Studio for local DB inspection

# Quality
npm run lint           # ESLint via expo config
```

## Architecture

**Stack**: React Native 0.81 + Expo 54 + Expo Router 6 + TypeScript (strict)
**Data**: SQLite local-first via `expo-sqlite`, Drizzle ORM, React Query for async state
**Routing**: File-based in `/app` - `(main)` has tab nav, `(onboarding)` flow, `premium.tsx` standalone

### Directory Ownership

- `app/` - Expo Router screens and layouts
- `app/reports/` - Weekly and Monthly report pages (separate from stats)
- `src/features/{domain}/` - Domain-driven modules (dashboard, transactions, accounts, categories, insights, stats, backup, export, filters, search)
- `src/components/ui/` - Universal components: `PremiumGuard`, `MoneyText`, `TransactionRow`, `KPICard`, `BottomTabBar`
- `src/providers/` - Context providers: `ThemeProvider`, `PremiumProvider`, `QueryProvider`, `DatabaseProvider`
- `src/theme/` - Design tokens: `colors.ts`, `typography.ts`, `tokens.ts`
- `src/db/` - Schema and migrations (Drizzle config at root)

## Design System

### Flat Design Language (No Blur/Transparency)

Luno uses a refined flat design system with solid colors only:

**Key Principles:**
- **No Blur Effects**: All backgrounds use solid `colors.background` or `colors.surface`
- **No Transparency in Theme**: `colors.card`, `colors.surface`, `colors.border` are all solid hex values
- **Flat Cards**: White cards (`#FFFFFF`) on warm off-white background (`#F7F4EF`) in light mode
- **Solid Borders**: Visible dividers using `colors.border` (`#E8E5E0` light, `#2d2d2d` dark)

### Design Tokens

**Spacing Scale (4px base grid):**
```typescript
import { spacing } from '@/src/theme/tokens';

spacing('0')    // 0px
spacing('1')    // 4px
spacing('2')    // 8px
spacing('3')    // 12px
spacing('4')    // 16px
spacing('5')    // 20px
spacing('6')    // 24px
spacing('7')    // 32px
spacing('8')    // 40px
```

**Border Radius Scale:**
```typescript
import { radius } from '@/src/theme/tokens';

radius('md')    // 12px - Buttons, inputs
radius('lg')    // 16px - Cards
radius('xl')    // 20px - Large cards
radius('2xl')   // 24px - Bottom nav container
radius('full')  // 999px - Circular buttons only
```

**Colors (Solid Only):**
```typescript
// Light Theme
background: '#F7F4EF'  // Warm off-white
card: '#FFFFFF'        // Pure white cards
surface: '#FAFAF8'      // Slightly warm surfaces
border: '#E8E5E0'       // Visible dividers
text: '#1a1a1a'        // Near-black text
textMuted: '#6b6b5f'   // Muted text

// Dark Theme
background: '#0a0a0a'  // Near-black
card: '#141414'         // Slightly lighter
surface: '#1a1a1a'     // Card backgrounds
border: '#2d2d2d'       // Subtle dividers
text: '#f5f5f0'        // Off-white text
```

### Typography

**Font Families:**
- **Display**: Bricolage Grotesque (headings, UI text)
- **Monospace**: JetBrains Mono (amounts, percentages, numerical data)

```typescript
// For UI text
fontFamily: TYPOGRAPHY.fonts.semibold

// For amounts and numbers
fontFamily: TYPOGRAPHY.fonts.monoBold
```

## Code Quality Standards

### Non-Negotiables
- **Strict TypeScript**: Zero `any` types
- **Well-Structured**: Domain-driven folder structure
- **Production Ready**: No TODOs, no temporary fixes
- **Self-Documenting**: Clear naming, minimal comments

### Architecture Rules
- One component per file (React.memo wrapped)
- One feature per domain folder
- Shared utilities only in `src/utils/` or `src/components/ui/`
- Database changes require migrations

## Critical Patterns

### 1. Theming (Mandatory)

Always use `useTheme()` hook. Never hardcode colors.

```typescript
const { colors } = useTheme();
// colors.background, colors.primary, colors.text, colors.border
```

### 2. PremiumGuard Pattern

Monetization is enforced via `PremiumGuard` component.

```typescript
import { PremiumGuard } from '@/src/components/ui/PremiumGuard';

<PremiumGuard label="Insights">
  <AdvancedChart data={premiumData} />
</PremiumGuard>
```

### 3. MoneyText Component

Use `MoneyText` for all currency displays with proper mono font:

```typescript
<MoneyText
  amount={amount}
  currency={currency}
  type="CR" | "DR" | "NONE"
  showSign={false}  // Only show +/- where meaningful
  style={styles.amount}
/>
```

### 4. Global Currency Picker

All main pages (Dashboard, Accounts, Stats, Reports) have a global currency picker below the header:

```typescript
// In page component
{currencyKeys.length > 1 && (
  <View style={styles.currencyPickerContainer}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {currencyKeys.map(curr => (
        <TouchableOpacity
          key={curr}
          style={[styles.currencyTab, selectedCurrency === curr && styles.currencyTabActive]}
          onPress={() => setSelectedCurrency(curr)}
        >
          <Text style={styles.currencyTabText}>{curr}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}
```

### 5. Header Action Buttons

Standard 36px circular buttons in header right action:

```typescript
headerActions: {
  flexDirection: 'row',
  gap: spacing('2'),
},
iconButton: {
  width: 36,
  height: 36,
  borderRadius: radius('full'),
  backgroundColor: colors.surface,
}
```

## Navigation Structure

### Bottom Tab Bar (Floating Pill Design)

- **Floating Style**: Rounded pill container with shadow
- **4 Tabs**: Home, Accounts, Stats, Settings
- **Center FAB**: Primary action button for adding transactions
- **Active State**: Pill-shaped background on active tab

```typescript
// app/(main)/_layout.tsx
<Tabs
  screenOptions={{ headerShown: false }}
  tabBar={(props) => <BottomTabBar {...props} />}
>
  <Tabs.Screen name="index" />
  <Tabs.Screen name="accounts" />
  <Tabs.Screen name="stats" />
  <Tabs.Screen name="settings" />
</Tabs>
```

### Report Pages (Separate from Stats)

Reports are separate pages accessible from Stats overview:
- `/reports/weekly` - Weekly detailed report
- `/reports/monthly` - Monthly detailed report

## Current Status

**Phases 1–8 Complete** — Core app stable with redesigned UI.

### Completed Features

**Phase 1 (Done)**: Core Tracking — Onboarding, transactions, accounts, categories, SQLite.  
**Phase 2 (Done)**: Freemium Setup — Premium gating, subscriptions, lifetime purchases.  
**Phase 3 (Done)**: Insights Layer — Weekly summaries, spending alerts.  
**Phase 4 (Done)**: Retention System — Monthly reports, streak tracking, reminders.  
**Phase 5 (Done)**: Power Features — Advanced filters, global search.  
**Phase 6 (Done)**: Navigation Overhaul — Floating pill bottom tab bar with 4 tabs + FAB.  
**Phase 7 (Done)**: Charts & Reports — Bar charts in stats, separate weekly/monthly report pages with accounts.  
**Phase 8 (Done)**: UI Polish — Flat design (no blur), global currency pickers, consistent header buttons, mono font for numbers.

### Key Feature Locations

- **Dashboard** (`app/(main)/index.tsx`): Home tab — net position, accounts carousel, recent transactions, top categories, global currency picker
- **Accounts** (`app/(main)/accounts.tsx`): Account list with balances, week/month activity, global currency picker
- **Stats** (`app/(main)/stats.tsx`): Overview with 7-day bar chart, net position, practical insights, period delta, report buttons
- **Weekly Report** (`app/reports/weekly.tsx`): Detailed weekly analysis with accounts, 7-day trend, category breakdown
- **Monthly Report** (`app/reports/monthly.tsx`): Monthly audit with accounts, weekly breakdown, sector analysis
- **Reports Components** (`src/features/stats/components/`): `WeeklyPanel.tsx`, `MonthlyPanel.tsx`
- **Advanced Filters** (`src/features/filters/`): Transaction filtering with multi-select
- **Global Search** (`src/features/search/`): Cross-entity search (Premium)
- **CSV Export** (`src/features/export/`): Settings > Data > Export CSV

### Charts Pattern (react-native-gifted-charts)

```typescript
import { BarChart } from 'react-native-gifted-charts';

<BarChart
  data={chartData}
  barWidth={16}
  height={160}
  maxValue={trendMax}
  yAxisThickness={0}
  xAxisThickness={1}
  xAxisColor={colors.border}
  hideYAxisText
  disableScroll
  width={screenWidth - 80}
  isAnimated
  animationDuration={400}
  backgroundColor="transparent"
  barBorderRadius={8}
/>
```

## No Test Suite

This project has no automated tests. All verification is manual via the dev server.

## Reference

- Detailed architecture: `CLAUDE.md`
- Database schema: `src/db/schema.ts`
- Design tokens: `src/theme/tokens.ts`, `src/theme/colors.ts`
- Typography: `src/theme/typography.ts`
