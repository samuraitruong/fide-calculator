# Mobile Neo-Brutalist Industrial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire FIDE Calculator mobile application into a modern, robust, graphic-heavy neo-brutalist industrial chess tournament app with first-class Dark Mode support.

**Architecture:** A reactive `ThemeContext` providing dynamic `'dark' | 'light' | 'system'` modes (defaulting to dark) feeds semantic tokens into reusable tactical UI primitives (`TacticalCard`, `StatHeroCard`, `TacticalButton`, `WinDrawLossSelector`, `ChessInsignia`). These primitives power all screens (`FideCalculator`, `HomeScreen`, `HistoryScreen`, `ProfileScreen`) and modals with high-contrast borders, tabular typography, and tactile press interactions.

**Tech Stack:** React Native 0.81.5, Expo 54, React 19, `@expo/vector-icons`, `@react-native-async-storage/async-storage`, `@react-navigation/bottom-tabs`, Jest / Testing Library.

**Spec:** [docs/superpowers/specs/2026-10-14-mobile-neo-brutalist-redesign-design.md](file:///Users/truongnguyen/source/fide-calculator/docs/superpowers/specs/2026-10-14-mobile-neo-brutalist-redesign-design.md)

## Global Constraints
- Target platform: iOS and Android via Expo.
- Touch targets: Minimum 48x48pt for interactive elements.
- Typography: Tabular numerals (`fontVariant: ['tabular-nums']`) for rating values and deltas to prevent layout jitter.
- Contrast: WCAG AA (≥ 4.5:1) for body/secondary text against card/canvas surfaces in both dark and light modes.
- Compatibility: Zero breaking changes to `@fide-calculator/shared` calculation math or Supabase sync.
- Default theme: Dark mode first.

---

### Task 1: Semantic Theme Tokens & ThemeContext Engine

**Files:**
- Create: `apps/mobile/src/contexts/ThemeContext.tsx`
- Create: `apps/mobile/src/contexts/__tests__/ThemeContext.test.tsx`
- Modify: `apps/mobile/src/theme/tokens.ts`

**Interfaces:**
- Produces:
  ```typescript
  export type ThemeMode = 'dark' | 'light' | 'system';
  export interface ThemeContextValue {
    themeMode: ThemeMode;
    isDark: boolean;
    colors: ThemeColors;
    typography: typeof typography;
    radii: typeof radii;
    spacing: typeof spacing;
    touchTargets: typeof touchTargets;
    shadows: ThemeShadows;
    setThemeMode: (mode: ThemeMode) => Promise<void>;
  }
  export const useTheme: () => ThemeContextValue;
  export const ThemeProvider: React.FC<{ children: React.ReactNode }>;
  ```

- [ ] **Step 1: Write the failing test for ThemeContext**

Create `apps/mobile/src/contexts/__tests__/ThemeContext.test.tsx` testing that:
1. `ThemeProvider` defaults to `'dark'` mode.
2. `useTheme` returns dark semantic colors (canvas `#0B0F17`, primary `#10B981`).
3. Calling `setThemeMode('light')` switches `isDark` to `false` and persists mode to AsyncStorage.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web exec jest --runInBand src/contexts/__tests__/ThemeContext.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Update `tokens.ts` with complete Dark & Light semantic palettes**

Update `apps/mobile/src/theme/tokens.ts`:
- Define `darkColors`, `lightColors`, and export fallback `colors` for backwards compatibility.
- Define `radii` (sm: 6, md: 10, lg: 14, pill: 999), `borderWidth` (1.5, 2).
- Define `darkShadows` and `lightShadows` with neo-brutalist offset shadow specifications.
- Define `typography` with `tabular-nums` support.

- [ ] **Step 4: Implement `ThemeContext.tsx`**

Implement `ThemeProvider` with:
- State initialized to `'dark'`.
- Storage persistence via `@fide-calc-theme-mode` in `AsyncStorage`.
- `Appearance.addChangeListener` listener when `themeMode === 'system'`.
- Export `useTheme()` hook.

- [ ] **Step 5: Run tests and verify they pass**

Run: `pnpm --filter web exec jest --runInBand src/contexts/__tests__/ThemeContext.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/theme/tokens.ts apps/mobile/src/contexts/ThemeContext.tsx apps/mobile/src/contexts/__tests__/ThemeContext.test.tsx
git commit -m "feat(mobile): add dynamic ThemeContext and neo-brutalist design tokens"
```

---

### Task 2: Core Tactical UI Primitives

**Files:**
- Create: `apps/mobile/src/components/ui/TacticalCard.tsx`
- Create: `apps/mobile/src/components/ui/TacticalButton.tsx`
- Create: `apps/mobile/src/components/ui/ChessInsignia.tsx`
- Create: `apps/mobile/src/components/ui/WinDrawLossSelector.tsx`
- Create: `apps/mobile/src/components/ui/ThemeToggle.tsx`
- Create: `apps/mobile/src/components/ui/__tests__/TacticalPrimitives.test.tsx`

**Interfaces:**
- Produces:
  - `<TacticalCard variant="default" | "elevated" | "accent" hasOffsetShadow cornerAccents />`
  - `<TacticalButton title="Add Game" variant="primary" | "accent" | "secondary" | "danger" onPress={...} />`
  - `<ChessInsignia piece="knight" | "rook" | "king" | "queen" | "pawn" size={...} color={...} />`
  - `<WinDrawLossSelector value={1 | 0.5 | 0 | null} onChange={(val) => void} />`
  - `<ThemeToggle compact={true | false} />`

- [ ] **Step 1: Write failing tests for Tactical Primitives**

Create `apps/mobile/src/components/ui/__tests__/TacticalPrimitives.test.tsx`:
- Test `TacticalCard` renders children and applies border & shadow styles.
- Test `WinDrawLossSelector` fires `onChange` with `1`, `0.5`, `0` when segments are pressed.
- Test `ThemeToggle` cycles through `'dark'`, `'light'`, and `'system'`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web exec jest --runInBand src/components/ui/__tests__/TacticalPrimitives.test.tsx`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement Tactical UI Primitives**

1. `TacticalCard.tsx`:
   - 1.5px/2px solid mechanical border using `colors.border`.
   - Optional corner crosshair brackets `[+]` or subtle badge header.
   - Neo-brutalist offset shadow support.
2. `TacticalButton.tsx`:
   - Pressable component with 2px border.
   - Physical press translation `{ transform: [{ translateX: 2 }, { translateY: 2 }] }` on active press.
   - Minimum 48pt height, prominent font.
3. `ChessInsignia.tsx`:
   - High-resolution chess piece emblems using `@expo/vector-icons` (`MaterialCommunityIcons` / `FontAwesome6`) inside stylized geometric badges.
4. `WinDrawLossSelector.tsx`:
   - Industrial 3-way toggle (`[ 1.0 WIN ]`, `[ ½ DRAW ]`, `[ 0.0 LOSS ]`) with active colors, accessible labels, and 48pt touch area.
5. `ThemeToggle.tsx`:
   - Accessible header toggle cycling through dark 🌙, light ☀️, and device 📱.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter web exec jest --runInBand src/components/ui/__tests__/TacticalPrimitives.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/ui/
git commit -m "feat(mobile): add tactical UI primitives (Card, Button, WinDrawLossSelector, Insignia, ThemeToggle)"
```

---

### Task 3: App Shell, Header & Navigation Redesign

**Files:**
- Modify: `apps/mobile/App.tsx`
- Modify: `apps/mobile/src/navigation/MainTabs.tsx`
- Modify: `apps/mobile/src/components/MenuModal.tsx`
- Modify: `apps/mobile/src/components/ProfileMenuContent.tsx`

**Interfaces:**
- Consumes: `ThemeProvider`, `useTheme`, `ThemeToggle`, `TacticalCard`, `ChessInsignia`.

- [ ] **Step 1: Wrap `App.tsx` in `ThemeProvider`**

- Wrap root component tree in `<ThemeProvider>`.
- Dynamically set `<StatusBar style={isDark ? "light" : "dark"} />`.
- Apply `colors.canvas` to root background views.
- Update loading and guest landing views with tactical dark styling and knight graphic badge.

- [ ] **Step 2: Redesign `MainTabs.tsx` Navigation & Header**

- Replace static header colors with dynamic `colors.surface` and `colors.border`.
- Update `HeaderBrand` with neo-brutalist typography and chess knight insignia badge.
- Mount `ThemeToggle` in `headerRight` alongside `HeaderMenuButton`.
- Redesign bottom tab bar with 1.5px top border, active indicator pills, and theme-aware icons.

- [ ] **Step 3: Redesign `MenuModal.tsx` & `ProfileMenuContent.tsx`**

- Redesign drawer sheet with tactical card containers.
- Add dedicated **Theme Mode** radio selector (Dark / Light / System) with instant preview.
- Add Storage Mode badge (`[ CLOUD SYNC ]` vs `[ LOCAL DEVICE ]`).
- Style profile action buttons with `TacticalButton`.

- [ ] **Step 4: Verify navigation and app shell**

Run: `pnpm --filter mobile exec tsc --noEmit && pnpm --filter mobile lint`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/App.tsx apps/mobile/src/navigation/MainTabs.tsx apps/mobile/src/components/MenuModal.tsx apps/mobile/src/components/ProfileMenuContent.tsx
git commit -m "feat(mobile): redesign app shell, header, theme toggle, and menu drawer"
```

---

### Task 4: StatHeroCard & FideCalculator Screen Redesign

**Files:**
- Create: `apps/mobile/src/components/ui/StatHeroCard.tsx`
- Modify: `apps/mobile/src/components/FideCalculator.tsx`
- Modify: `apps/mobile/src/screens/HomeScreen.tsx`
- Modify: `apps/mobile/src/components/WinDrawLossBar.tsx`

**Interfaces:**
- Consumes: `useTheme`, `StatHeroCard`, `TacticalCard`, `TacticalButton`, `WinDrawLossSelector`, `ChessInsignia`.

- [ ] **Step 1: Implement `StatHeroCard.tsx`**

- Create DGT chess clock-inspired tournament scoreboard banner:
  - Current Rating ➔ Projected Rating in 36px bold tabular numerals.
  - Large dynamic rating delta badge: `▲ +14.2` in emerald or `▼ -8.0` in crimson.
  - Mini summary chips: games count, performance rating (TPR).
  - High-contrast LCD/scoreboard dark styling.

- [ ] **Step 2: Redesign `WinDrawLossBar.tsx`**

- Update bar with crisp borders, vibrant segment fills (`colors.win`, `colors.draw`, `colors.loss`), and clean tabular count labels.

- [ ] **Step 3: Redesign `FideCalculator.tsx`**

- Replace old light-only styles with `useTheme()` tokens.
- Replace manual rating inputs with tactical numeric card fields.
- Integrate `WinDrawLossSelector` for fast game logging.
- Render logged games as `TacticalCard` items featuring round numbers `[ RD 01 ]`, opponent ratings, result badges, and rating deltas.
- Replace generic buttons with `TacticalButton` ("Add Game", "Save to History", "Reset").

- [ ] **Step 4: Update `HomeScreen.tsx`**

- Ensure safe-area containers and scrollviews adopt `colors.canvas`.

- [ ] **Step 5: Run tests and type check**

Run: `pnpm --filter mobile test && pnpm --filter mobile exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/components/ui/StatHeroCard.tsx apps/mobile/src/components/FideCalculator.tsx apps/mobile/src/screens/HomeScreen.tsx apps/mobile/src/components/WinDrawLossBar.tsx
git commit -m "feat(mobile): redesign tournament calculator screen and stat hero display"
```

---

### Task 5: HistoryScreen & Career Timeline Redesign

**Files:**
- Modify: `apps/mobile/src/screens/HistoryScreen.tsx`

**Interfaces:**
- Consumes: `useTheme`, `TacticalCard`, `TacticalButton`, `ChessInsignia`.

- [ ] **Step 1: Add Career Overview Stat Header**

- Implement 3-tile career banner at top of History screen:
  - Peak Rating `[ PEAK: 2180 ]`
  - Current Official Rating `[ CURRENT: 2145 ]`
  - Total Career Games `[ 142 GAMES ]`

- [ ] **Step 2: Redesign Monthly Tournament Rating Cards**

- Redesign month headers (e.g., `OCTOBER 2026`) as mechanical card accordions with net delta tag (`▲ +28.4`).
- Modernize nested game items with tabular opponent data, date badges, and result pills.
- Style empty state with an illustrative chess piece graphic and clear call to action.

- [ ] **Step 3: Redesign Export & History Actions**

- Update PDF export and share actions with tactile styling and status indicators.

- [ ] **Step 4: Verify test suite and type safety**

Run: `pnpm --filter mobile test && pnpm --filter mobile exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/screens/HistoryScreen.tsx
git commit -m "feat(mobile): redesign career progress banner and monthly tournament timeline"
```

---

### Task 6: Profile & Account Management Redesign

**Files:**
- Modify: `apps/mobile/src/screens/ProfileScreen.tsx`
- Modify: `apps/mobile/src/components/CreateProfileModal.tsx`
- Modify: `apps/mobile/src/components/EditProfileModal.tsx`
- Modify: `apps/mobile/src/components/FideSearchInput.tsx`

**Interfaces:**
- Consumes: `useTheme`, `TacticalCard`, `TacticalButton`, `ChessInsignia`.

- [ ] **Step 1: Redesign `ProfileScreen.tsx`**

- Player identity card:
  - Large Knight insignia emblem with gold tournament border.
  - Player name, FIDE ID tag, Federation badge, and rating category tiles (Standard, Rapid, Blitz).
- Settings console:
  - Theme mode toggle (Dark / Light / System).
  - Storage mode card (Cloud sync vs Local device).
  - Account actions (Edit Profile, Refresh from FIDE, Switch Account).

- [ ] **Step 2: Redesign `CreateProfileModal.tsx` & `EditProfileModal.tsx`**

- Theme-aware inputs with 1.5px borders, clear label typography, and active focus highlights.
- Modernized FIDE Search suggestions list with tabular ratings and country badges.

- [ ] **Step 3: Redesign `FideSearchInput.tsx`**

- Search input with tactical keyboard accessories, clear button, and high-contrast dropdown results.

- [ ] **Step 4: Run tests and type check**

Run: `pnpm --filter mobile test && pnpm --filter mobile exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/screens/ProfileScreen.tsx apps/mobile/src/components/CreateProfileModal.tsx apps/mobile/src/components/EditProfileModal.tsx apps/mobile/src/components/FideSearchInput.tsx
git commit -m "feat(mobile): redesign player profile screen, FIDE search, and profile modals"
```

---

### Task 7: Game & Authentication Modals Redesign

**Files:**
- Modify: `apps/mobile/src/components/EditGameModal.tsx`
- Modify: `apps/mobile/src/components/AuthModal.tsx`
- Modify: `apps/mobile/src/components/LocalStorageModal.tsx`
- Modify: `apps/mobile/src/components/ForgotPasswordModal.tsx`
- Modify: `apps/mobile/src/components/ChangePasswordModal.tsx`
- Modify: `apps/mobile/src/components/DatePickerModal.tsx`

**Interfaces:**
- Consumes: `useTheme`, `TacticalCard`, `TacticalButton`, `WinDrawLossSelector`.

- [ ] **Step 1: Redesign `EditGameModal.tsx`**

- Migrate to `useTheme()` tokens.
- Implement `WinDrawLossSelector` for result editing.
- Ensure all inputs and buttons meet 48pt touch targets.

- [ ] **Step 2: Redesign Authentication & Storage Modals**

- `AuthModal.tsx`: High-contrast login/signup forms with Knight branding, clear error alerts, and tactile primary buttons.
- `LocalStorageModal.tsx`: Device-first onboarding modal with tactical card selector for creating or restoring local player profiles.
- `ForgotPasswordModal.tsx` & `ChangePasswordModal.tsx`: Consistent secure input fields and confirmation buttons.
- `DatePickerModal.tsx`: Theme-aware calendar/month selector with tournament slate styling.

- [ ] **Step 3: Run existing modal tests**

Run: `pnpm --filter mobile test`
Expected: PASS (all tests including `EditGameModal.test.tsx` pass).

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/EditGameModal.tsx apps/mobile/src/components/AuthModal.tsx apps/mobile/src/components/LocalStorageModal.tsx apps/mobile/src/components/ForgotPasswordModal.tsx apps/mobile/src/components/ChangePasswordModal.tsx apps/mobile/src/components/DatePickerModal.tsx
git commit -m "feat(mobile): redesign game edit modal, auth modals, and date picker"
```

---

### Task 8: Verification, Lint & Visual Polish

**Files:**
- Modify: Any files needing theme polishing or accessibility adjustments.

- [ ] **Step 1: Run complete mobile test suite**

Run: `pnpm --filter mobile test`
Expected: PASS with 0 failures.

- [ ] **Step 2: Run TypeScript compile verification**

Run: `pnpm --filter mobile exec tsc --noEmit`
Expected: Exit code 0, 0 type errors.

- [ ] **Step 3: Run linter across mobile workspace**

Run: `pnpm --filter mobile lint`
Expected: Exit code 0, 0 lint warnings/errors.

- [ ] **Step 4: Verify dark and light mode contrast & touch target checklist**

- Verify contrast ratios ≥ 4.5:1 across dark and light palettes.
- Verify safe area compliance on iOS notch and Android navigation bars.
- Verify zero emoji icons used as structural navigation elements.

- [ ] **Step 5: Final commit**

```bash
git commit --allow-empty -m "chore(mobile): complete verification of neo-brutalist redesign"
```
