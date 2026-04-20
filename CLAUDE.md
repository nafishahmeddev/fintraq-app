# Luno Application Architecture & Context

This document serves as the core system memory for the AI assistant working on the **Luno** codebase. It outlines the project's technical stack, aesthetic guidelines, folder structure, and current roadmap state.

## 1. App Aesthetic: "Editorial Brutalist"
Luno aims to be a top-tier, premium financial tracker. The design system rigidly adheres to an **Editorial Brutalist** aesthetic:
- **Flawless Minimalism**: No aggressive drop shadows, no soft blurry borders, just stark, flat, elegant surfaces.
- **Micro-borders**: Heavy reliance on 1px solid borders (`colors.border`) to demarcate components and cards.
- **Typography & Casing**: High-contrast, sophisticated typography. Action buttons and primary text elements must use **Sentence case** (e.g., "Upgrade to Pro", not "UPGRADE TO PRO") to feel mature and journalistic rather than salesy.
- **Shape Language**: Interactive elements and buttons strictly use **12px - 16px rounded corners**. Avoid pill-shaped (999px) buttons unless they are tiny micro-badges.

### 1.1 Design Token System
All styling MUST use the design tokens in `/src/theme/tokens.ts`:
- **Spacing**: `spacing('1')` through `spacing('12')` - 4px base grid
- **Radius**: `radius('xs')` through `radius('2xl')` - Never use arbitrary values
- **Component Sizes**: `COMPONENT_SIZES.button|card|input.{size}.{property}`
- **Shadows**: `shadow('sm')` for cards, `shadow('md')` for elevated elements
- **Layout**: `LAYOUT.screenPadding`, `LAYOUT.minTouchTarget`

See `AGENTS.md` for complete design token reference.

## 2. Technology Stack & Rules
- **Framework**: React Native + Expo + Expo Router (File-based navigation in `/app`).
- **Language**: Strict TypeScript. Always define clear interfaces for props and API returns.
- **State & Data**: Local-first storage using **SQLite**. Async orchestration managed via **React Query** hooks (to handle threading and caching cleanly).
- **Styling**: `StyleSheet.create` relying strictly on the app's internal `useTheme()` provider. Never use hardcoded colors.
- **Performance**: See Performance Patterns section below - mandatory React.memo, useCallback, useMemo usage.

## 2.1 TypeScript Standards (Zero `any` Policy)

**No `as any` or `: any` is permitted anywhere in the codebase.** Use these patterns instead:

### Ionicons icon names
Database stores icon strings as `string`. Use `resolveIcon()` from `src/utils/icons.ts` to narrow to `IoniconName` with a safe fallback. Never cast `name={x as any}`.
```typescript
import { resolveIcon, IoniconName } from '@/src/utils/icons';

// In JSX:
<Ionicons name={resolveIcon(category.icon, 'grid-outline')} />

// In prop interfaces:
icon: IoniconName;  // not: icon: string

// In constant arrays:
export const MY_ICONS = ['cash-outline', 'wallet-outline'] as const;
```

### Error handling in catch blocks
Never annotate `catch (e: any)`. Use the `toErrorMessage()` utility from `src/utils/errors.ts`:
```typescript
import { toErrorMessage } from '@/src/utils/errors';

try { ... } catch (e) {
  Alert.alert("Error", toErrorMessage(e, "Default fallback message"));
}
```

For IAP error code checks, narrow the unknown error explicitly:
```typescript
const code = (err as { code?: string })?.code;
if (code !== IAP.ErrorCode.UserCancelled) { ... }
```

### Expo Router navigation
All app routes are already typed in `.expo/types/router.d.ts`. Never use `router.push('/path' as any)` — just `router.push('/path')`. For data in REPORT_TYPES arrays, use `Href` from `expo-router`:
```typescript
import { Href } from 'expo-router';
route: '/(main)/reports/weekly' as Href,
```

### SectionList typing
Always provide both type params to avoid untyped render callbacks:
```typescript
import { SectionListRenderItemInfo, SectionListData } from 'react-native';

type MySection = { title: string; data: MyItem[] };

renderItem={({ item }: SectionListRenderItemInfo<MyItem, MySection>) => ...}
renderSectionHeader={({ section }: { section: SectionListData<MyItem, MySection> }) => ...}
```

### Platform-specific property casts
Define a typed interface rather than casting to `any`:
```typescript
interface AndroidDiscountOffer { fullPriceMicrosAndroid?: string; currency?: string; }
const offer = (p as unknown as { discountOffers?: AndroidDiscountOffer[] }).discountOffers?.[0];
```

## 2.2 Performance Patterns (Mandatory)

Following React Native best practices for 60fps UI:

### React.memo for All Components
**Every** component must be wrapped with `React.memo`:
```typescript
export const MyComponent = React.memo(function MyComponent(props: Props) {
  // component body
});
```

### useCallback for All Event Handlers
All event handlers must use `useCallback`:
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
  getItemLayout={getItemLayout}   // for fixed height items
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
/>
```

## 3. Directory Structure (Domain-Driven)
- `app/` - Expo Router configuration and Screen definitions.
- `src/components/ui/` - Universal, generic, pure components (`PremiumGuard`, `MoneyText`, `TransactionRow`, etc).
- `src/features/` - Domain-specific layers containing their own `api/`, `components/`, `hooks/`, and `screens/` (e.g., `dashboard`, `transactions`, `accounts`, `categories`).
- `src/providers/` - React Context providers (`ThemeProvider`, `PremiumProvider`).
- `src/theme/` - Design tokens (`colors.ts`, `typography.ts`).

## 4. The `PremiumGuard` Pattern
Monetization is driven by `src/components/ui/PremiumGuard.tsx`. 
- **Rule**: Non-premium users must *never* see premium data elements. The `PremiumGuard` completely hides its children and renders an elegant "Teaser Card" placeholder containing a watermark and a call-to-action to natively convert the user.
- **Philosophy**: **Free = Tracking.** **Premium = Insights + Control.**

## 5. Current Roadmap Status

**Phases 1-5 Complete** — Core app is stable.  
**Phase 6 In Progress** — Navigation overhaul with bottom app bar.

### Completed Phases

- **Phase 1 (Done)**: Foundation — Onboarding, transactions, accounts, categories, SQLite.
- **Phase 2 (Done)**: Freemium Setup — Premium gating, subscriptions, lifetime purchases.
- **Phase 3 (Done)**: Insights Layer — Weekly summaries, spending alerts, runway tracking.
- **Phase 4 (Done)**: Retention System — Monthly reports, streak tracking, reminders.
- **Phase 5 (Done)**: Power Features — Advanced filters, global search.

### In Progress & Upcoming

- **Phase 6 (In Progress)**: Navigation Overhaul — Bottom app bar with 4 tabs (Home, Accounts, Pulse, Settings) + FAB.
- **Phase 7 (Next)**: Charts & Optimization — react-native-gifted-charts, merge redundant screens.
- **Phase 8 (Planned)**: Core Finance — Account transfers, recurring transactions, biometric lock.
- **Phase 9 (Planned)**: Planning Layer — Budget system, savings goals.
- **Phase 10 (Planned)**: Data Portability — CSV export, backup & restore.

### Key Feature Locations

- **Dashboard** (`app/(main)/index.tsx`): Home tab with net position, recent transactions
- **Stats/Pulse** (`app/(main)/stats.tsx`): Analytics screen (being merged with Weekly Summary)
- **Advanced Filters** (`src/features/filters/`): Transaction filtering with multi-select
- **Global Search** (`src/features/search/`): Cross-entity search (Premium)
- **CSV Export** (`src/features/export/`): Settings > Data > Export CSV
- **Backup & Restore** (`src/features_backup/`): Code preserved, UI hidden

## 6. Cross-Platform File Export Pattern
When implementing file export features (CSV, Backup), use this pattern:

```typescript
// Android: Storage Access Framework for direct folder selection
// iOS: Share sheet with "Save to Files" option
static async exportFile(content: string, filename: string): Promise<void> {
  if (Platform.OS === 'android') {
    // Request directory permissions - opens native folder picker
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return;
    
    const fileUri = await StorageAccessFramework.createFileAsync(
      permissions.directoryUri, filename, mimeType
    );
    await StorageAccessFramework.writeAsStringAsync(fileUri, content);
  } else {
    // iOS: Write to cache and share
    const tempFile = new File(Paths.cache, filename);
    await tempFile.write(content);
    await Sharing.shareAsync(tempFile.uri, { mimeType, UTI });
  }
}
```

## 6. How to Collaborate
1. Before modifying UI, cross-reference the components against the "Editorial Brutalist" rules.
2. Avoid generic tools (like using typical mapping inside FlatList `renderItem` without React native best practices).
3. Always update this document or `roadmap.md` if significant architectural patterns are introduced.
