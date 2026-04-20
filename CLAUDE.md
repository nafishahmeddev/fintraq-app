# Luno Application Architecture & Context

This document serves as the core system memory for the AI assistant working on the **Luno** codebase. It outlines the project's technical stack, aesthetic guidelines, folder structure, and current roadmap state.

## 1. App Aesthetic: "Editorial Brutalist"

Luno aims to be a top-tier, premium financial tracker. The design system rigidly adheres to an **Editorial Brutalist** aesthetic:
- **Flawless Minimalism**: No blur effects, no transparency. Solid colors only.
- **Flat Design**: White cards (`#FFFFFF`) on warm off-white background (`#F7F4EF`) in light mode
- **Micro-borders**: Heavy reliance on 1px solid borders (`colors.border`) to demarcate components
- **Typography & Casing**: High-contrast, sophisticated typography. Use **Sentence case** everywhere.
- **Shape Language**: 
  - Cards: 16px-20px radius (`lg` to `xl`)
  - Buttons: 12px-16px radius (`md` to `lg`)
  - Circular buttons: 36px size with `radius('full')`

### 1.1 Design Token System

All styling MUST use the design tokens in `/src/theme/tokens.ts`:
- **Spacing**: `spacing('1')` through `spacing('12')` - 4px base grid
- **Radius**: `radius('xs')` through `radius('2xl')` - Never use arbitrary values
- **Colors**: Always solid, no alpha. Light: warm off-white bg, white cards. Dark: near-black bg, dark gray cards.
- **Typography**: Bricolage Grotesque for UI, JetBrains Mono for numbers

See `AGENTS.md` for complete design token reference.

## 2. Technology Stack & Rules

- **Framework**: React Native + Expo + Expo Router (File-based navigation in `/app`).
- **Language**: Strict TypeScript. Always define clear interfaces for props and API returns.
- **State & Data**: Local-first storage using **SQLite**. Async orchestration managed via **React Query** hooks.
- **Styling**: `StyleSheet.create` relying strictly on the app's internal `useTheme()` provider.
- **Performance**: See Performance Patterns section below - mandatory React.memo, useCallback, useMemo usage.

## 2.0 Code Quality Standards (Mandatory)

All code must be **production-ready**, **well-structured**, and **type-safe**. No exceptions.

### Non-Negotiables
- **Strict TypeScript**: Zero `any` types. All functions, props, and state must be fully typed.
- **Well-Structured**: Follow existing architecture patterns. Domain-driven folder structure.
- **Production Ready**: No TODOs, no hacks, no temporary fixes. Every line of code must be shippable.
- **No Patchwork**: Don't add quick fixes or workarounds. Solve the root cause properly.
- **Self-Documenting**: Clear naming, logical structure, minimal comments.

### Architecture Rules
- One component per file (React.memo wrapped)
- One feature per domain folder (`src/features/{domain}/`)
- Shared utilities only in `src/utils/` or `src/components/ui/`
- Never duplicate logic - abstract to hooks or services
- Database changes require migrations (`npm run db:generate`)

## 2.1 TypeScript Standards (Zero `any` Policy)

**No `as any` or `: any` is permitted anywhere in the codebase.**

### Ionicons icon names
Database stores icon strings as `string`. Use `resolveIcon()` from `src/utils/icons.ts`:
```typescript
import { resolveIcon, IoniconName } from '@/src/utils/icons';
<Ionicons name={resolveIcon(category.icon, 'grid-outline')} />
```

### Error handling in catch blocks
Never annotate `catch (e: any)`. Use `toErrorMessage()`:
```typescript
import { toErrorMessage } from '@/src/utils/errors';
try { ... } catch (e) {
  Alert.alert("Error", toErrorMessage(e, "Default fallback message"));
}
```

### Expo Router navigation
All app routes are already typed in `.expo/types/router.d.ts`. Never use `router.push('/path' as any)`.

## 2.2 Performance Patterns (Mandatory)

### React.memo for All Components
**Every** component must be wrapped with `React.memo`:
```typescript
export const MyComponent = React.memo(function MyComponent(props: Props) {
  // component body
});
```

### useCallback for All Event Handlers
```typescript
const handlePress = useCallback(() => {
  onPress(item);
}, [onPress, item]);

<TouchableOpacity onPress={handlePress} />
```

### useMemo for Expensive Computations
Always memoize:
- Style objects from `createStyles(colors)`
- Color/formatting calculations
- Mapped arrays for rendering
- Derived state
- Context values

```typescript
const styles = useMemo(() => createStyles(colors), [colors]);
const contextValue = useMemo(() => ({ colors, isDark }), [colors, isDark]);
```

### List Optimization
All FlatList/SectionList must have:
```typescript
<FlatList
  data={data}
  renderItem={renderItem}        // memoized callback
  keyExtractor={keyExtractor}     // memoized callback
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
/>
```

## 3. Directory Structure (Domain-Driven)

- `app/` - Expo Router configuration and Screen definitions.
- `app/reports/` - Weekly and Monthly report pages (separate from stats)
- `src/components/ui/` - Universal, generic, pure components (`PremiumGuard`, `MoneyText`, `TransactionRow`, `BottomTabBar`).
- `src/features/` - Domain-specific layers containing their own `api/`, `components/`, `hooks/`, and `screens/`.
- `src/providers/` - React Context providers (`ThemeProvider`, `PremiumProvider`).
- `src/theme/` - Design tokens (`colors.ts`, `typography.ts`, `tokens.ts`).

## 4. The `PremiumGuard` Pattern

Monetization is driven by `src/components/ui/PremiumGuard.tsx`. 
- **Rule**: Non-premium users must *never* see premium data elements.
- **Philosophy**: **Free = Tracking.** **Premium = Insights + Control.**

## 5. Current Roadmap Status

**Phases 1-8 Complete** — Core app is stable with redesigned flat UI.

### Completed Phases

- **Phase 1 (Done)**: Foundation — Onboarding, transactions, accounts, categories, SQLite.
- **Phase 2 (Done)**: Freemium Setup — Premium gating, subscriptions, lifetime purchases.
- **Phase 3 (Done)**: Insights Layer — Weekly summaries, spending alerts, runway tracking.
- **Phase 4 (Done)**: Retention System — Monthly reports, streak tracking, reminders.
- **Phase 5 (Done)**: Power Features — Advanced filters, global search.
- **Phase 6 (Done)**: Navigation Overhaul — Floating pill bottom tab bar with 4 tabs + FAB.
- **Phase 7 (Done)**: Charts & Reports — Bar charts in stats, separate weekly/monthly report pages.
- **Phase 8 (Done)**: UI Polish — Flat design (no blur), global currency pickers, consistent header buttons, mono font for numbers.

### In Progress & Upcoming

- **Phase 9 (Next)**: Core Finance — Account transfers, recurring transactions, biometric lock.
- **Phase 10 (Planned)**: Planning Layer — Budget system, savings goals.
- **Phase 11 (Planned)**: Data Portability — CSV export, backup & restore.

### Key Feature Locations

- **Dashboard** (`app/(main)/index.tsx`): Home tab with net position, accounts carousel, recent transactions, global currency picker
- **Accounts** (`app/(main)/accounts.tsx`): Accounts list with balances, global currency picker
- **Stats** (`app/(main)/stats.tsx`): Analytics with 7-day bar chart, practical insights, period delta, report buttons
- **Reports** (`app/reports/`): Separate weekly and monthly report pages with detailed analysis
- **Advanced Filters** (`src/features/filters/`): Transaction filtering with multi-select
- **Global Search** (`src/features/search/`): Cross-entity search (Premium)
- **CSV Export** (`src/features/export/`): Settings > Data > Export CSV

## 6. Key Patterns

### Bottom Tab Bar (Floating Pill)
```typescript
// Floating pill design with 4 tabs + center FAB
// Active tab shows filled pill background
// 36px circular tab buttons
```

### Global Currency Picker
All main pages have currency picker below header:
```typescript
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
```

### Header Action Buttons
Standard 36px circular buttons:
```typescript
iconButton: {
  width: 36,
  height: 36,
  borderRadius: radius('full'),
  backgroundColor: colors.surface,
}
```

### MoneyText for Amounts
Always use mono font for numbers:
```typescript
<MoneyText
  amount={amount}
  currency={currency}
  type="CR" | "DR" | "NONE"
  showSign={false}
  style={styles.amount}
/>
```

### Bar Charts
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

## 7. Cross-Platform File Export Pattern

```typescript
// Android: Storage Access Framework
// iOS: Share sheet with "Save to Files" option
static async exportFile(content: string, filename: string): Promise<void> {
  if (Platform.OS === 'android') {
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return;
    const fileUri = await StorageAccessFramework.createFileAsync(
      permissions.directoryUri, filename, mimeType
    );
    await StorageAccessFramework.writeAsStringAsync(fileUri, content);
  } else {
    const tempFile = new File(Paths.cache, filename);
    await tempFile.write(content);
    await Sharing.shareAsync(tempFile.uri, { mimeType, UTI });
  }
}
```

## 8. How to Collaborate

1. Before modifying UI, cross-reference the components against the "Editorial Brutalist" rules.
2. Always use design tokens - never hardcode values.
3. Update this document if significant architectural patterns are introduced.
