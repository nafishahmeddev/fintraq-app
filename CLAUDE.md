# Luno Application Architecture & Context

This document serves as the core system memory for the AI assistant working on the **Luno** codebase. It outlines the project's technical stack, aesthetic guidelines, and folder structure.

**For roadmap and feature status, see `docs/roadmap.md`.**

## 1. App Aesthetic: "Editorial Brutalist"
Luno aims to be a top-tier, premium financial tracker. The design system rigidly adheres to an **Editorial Brutalist** aesthetic:
- **Flawless Minimalism**: No aggressive drop shadows, no soft blurry borders, just stark, flat, elegant surfaces.
- **Micro-borders**: Heavy reliance on 1px solid borders (`colors.border`) to demarcate components and cards.
- **Typography & Casing**: High-contrast, sophisticated typography. Action buttons and primary text elements must use **Sentence case** (e.g., "Upgrade to Pro", not "UPGRADE TO PRO") to feel mature and journalistic rather than salesy.
- **Shape Language**: **Buttons and interactive chips use pill shape (`radius('full')` = 999px)**. Cards and content containers use **28px rounded corners** (`radius('3xl')`). Icon containers and color/icon pickers are always fully round (999px). Progress bars and accent bars stay small (2–4px).

### 1.1 Design Token System
All styling MUST use the design tokens in `/src/theme/tokens.ts`:
- **Spacing**: `spacing('1')` through `spacing('12')` - 4px base grid
- **Radius**: `radius('xs')` through `radius('3xl')` and `radius('full')` - Never use arbitrary values
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
  - `account/create.tsx` - Create new account
  - `account/edit/[id].tsx` - Edit existing account
  - `category/create.tsx` - Create new category
  - `category/edit/[id].tsx` - Edit existing category
- `src/components/core/` - Universal, generic, pure components (`PremiumGuard`, `MoneyText`, `TransactionRow`, `IconPickerDialog`, etc).
- `src/features/` - Domain-specific layers containing their own `api/`, `components/`, `hooks/`, and `screens/` (e.g., `dashboard`, `transactions`, `accounts`, `categories`).
- `src/providers/` - React Context providers (`ThemeProvider`, `PremiumProvider`).
- `src/theme/` - Design tokens (`colors.ts`, `typography.ts`).

## 4. The `PremiumGuard` Pattern
Monetization is driven by `src/components/core/PremiumGuard.tsx`. 
- **Rule**: Non-premium users must *never* see premium data elements. The `PremiumGuard` completely hides its children and renders an elegant "Teaser Card" placeholder containing a watermark and a call-to-action to natively convert the user.
- **Philosophy**: **Free = Tracking.** **Premium = Insights + Control.**

## 5. Current Status

**Completed**: Phases 1-6 (Core tracking through Account Types, Transfer Transactions, Page-based Forms)

**Next**: Phase 7 - Recurring & Budgeting

**See `docs/roadmap.md` for full feature roadmap and phase details.**

## 6. Transfer Transaction Pattern

When implementing transfer transactions:

```typescript
// Transfer affects two accounts, no income/expense impact
if (data.type === 'TRANSFER') {
  // Decrease from source account
  await tx.update(accounts).set({ 
    balance: sql`${accounts.balance} - ${data.amount}`,
  }).where(eq(accounts.id, data.accountId));
  
  // Increase to destination account
  await tx.update(accounts).set({ 
    balance: sql`${accounts.balance} + ${data.amount}`,
  }).where(eq(accounts.id, data.toAccountId));
} else {
  // Regular transaction affects single account
  const balanceChange = data.type === 'CR' ? data.amount : -data.amount;
  const incomeChange = data.type === 'CR' ? data.amount : 0;
  const expenseChange = data.type === 'DR' ? data.amount : 0;
  
  await tx.update(accounts).set({ 
    balance: sql`${accounts.balance} + ${balanceChange}`,
    income: sql`${accounts.income} + ${incomeChange}`,
    expense: sql`${accounts.expense} + ${expenseChange}`,
  }).where(eq(accounts.id, data.accountId));
}
```

## 7. Cross-Platform File Export Pattern
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

## 8. How to Collaborate
1. Before modifying UI, cross-reference the components against the "Editorial Brutalist" rules.
2. Avoid generic tools (like using typical mapping inside FlatList `renderItem` without React native best practices).
3. Always update `docs/roadmap.md` if significant features are introduced.

## References
- Agent instructions: `AGENTS.md`
- Feature roadmap: `docs/roadmap.md`
- Database schema: `src/db/schema.ts`
- Drizzle config: `drizzle.config.ts`
