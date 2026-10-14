# FIDE Calculator Mobile App — Neo-Brutalist Industrial Redesign

## 1. Overview & Goals
The goal of this redesign is to transform the FIDE Calculator mobile application into a modern, robust, graphic-heavy, neo-brutalist chess tournament tool with first-class Dark Mode support.

### Key Objectives
1. **Visual Style**: Neo-Brutalist Industrial ("Precision Chess Engine") inspired by physical DGT chess clocks, tournament scoreboards, and tactile gear.
2. **First-Class Dark Mode**: Dark mode as the default experience with a dynamic 3-way toggle (Dark / Light / System), persisted via `AsyncStorage`.
3. **High-Impact Graphic Elements**: Oversized tabular typography, 1.5–2px mechanical borders, offset tactile shadows, chess piece vector insignias (Knight, Rook, King, Pawn), and tournament status chips.
4. **Enhanced UX**: Clear touch targets (≥48pt), tactile press feedback, zero layout-shift during rapid rating calculations, and safe-area compliance.

---

## 2. Architecture & Design Tokens

### 2.1 Theme Management System
* **Location**: `apps/mobile/src/contexts/ThemeContext.tsx`
* **Hook**: `useTheme()` providing:
  * `themeMode`: `'dark' | 'light' | 'system'`
  * `isDark`: `boolean` (computed based on mode and device `Appearance`)
  * `colors`: semantic color tokens for active theme
  * `setThemeMode(mode: 'dark' | 'light' | 'system')`
* **Storage Key**: `@fide-calc-theme-mode`
* **Default Mode**: `'dark'`

### 2.2 Semantic Color Tokens
```typescript
export interface ThemeColors {
  canvas: string;           // Base app background
  surface: string;          // Cards, headers, navigation bars
  surfaceElevated: string;  // Active game cards, floating sheets
  surfaceMuted: string;     // Inactive badges, muted input backgrounds
  border: string;           // Primary structural border (1.5px - 2px)
  borderAccent: string;     // Active focus, primary selection highlight
  primary: string;          // Tournament Emerald
  primaryHover: string;     // Pressed primary state
  accent: string;           // Chess Clock Amber Gold
  textPrimary: string;      // Main heading & number text
  textSecondary: string;    // Subtext, metadata, labels
  textMuted: string;        // Inactive / placeholder text
  win: string;              // Win text / icon color
  winBg: string;            // Win badge background
  loss: string;             // Loss text / icon color
  lossBg: string;           // Loss badge background
  draw: string;             // Draw text / icon color
  drawBg: string;           // Draw badge background
  shadow: string;           // Tactile offset shadow color
}
```

#### Palette Values:
* **Dark Theme (Default)**:
  * `canvas`: `#0B0F17` (Deep Obsidian)
  * `surface`: `#141B26` (Tactical Slate)
  * `surfaceElevated`: `#1B2433` (Raised Metal)
  * `surfaceMuted`: `#18202C`
  * `border`: `#2B3648` (Mechanical Slate Border)
  * `borderAccent`: `#10B981` (Tournament Emerald Border)
  * `primary`: `#10B981` (Tournament Emerald)
  * `primaryHover`: `#059669`
  * `accent`: `#F59E0B` (Chess Clock Amber Gold)
  * `textPrimary`: `#F8FAFC` (Stark White)
  * `textSecondary`: `#94A3B8` (Industrial Silver)
  * `textMuted`: `#64748B` (Steel Gray)
  * `win`: `#10B981` | `winBg`: `rgba(16, 185, 129, 0.16)`
  * `loss`: `#EF4444` | `lossBg`: `rgba(239, 68, 68, 0.16)`
  * `draw`: `#94A3B8` | `drawBg`: `rgba(148, 163, 184, 0.16)`
  * `shadow`: `#000000`

* **Light Theme**:
  * `canvas`: `#F4F5F0` (Ivory Linen Paper)
  * `surface`: `#FFFFFF` (Crisp White)
  * `surfaceElevated`: `#F8FAFC`
  * `surfaceMuted`: `#E2E8F0`
  * `border`: `#1E293B` (Bold Graphite Border)
  * `borderAccent`: `#059669`
  * `primary`: `#047857` (Classic Felt Green)
  * `primaryHover`: `#065F46`
  * `accent`: `#D97706` (Tournament Amber)
  * `textPrimary`: `#0F172A` (Obsidian Black)
  * `textSecondary`: `#475569` (Slate Gray)
  * `textMuted`: `#64748B`
  * `win`: `#059669` | `winBg`: `#DCFCE7`
  * `loss`: `#DC2626` | `lossBg`: `#FEE2E2`
  * `draw`: `#475569` | `drawBg`: `#F1F5F9`
  * `shadow`: `#1E293B`

### 2.3 Typography & Tabular Tokens
* `heroRating`: `36px`, `fontWeight: '800'`, `fontVariant: ['tabular-nums']`
* `heading`: `24px`, `fontWeight: '800'`
* `subheading`: `18px`, `fontWeight: '700'`
* `body`: `15px`, `fontWeight: '500'`
* `monoBadge`: `13px`, `fontWeight: '700'`, monospace font family
* `caption`: `12px`, `fontWeight: '600'`

### 2.4 Tactile Elevation & Spacing
* `radii.sm`: 6
* `radii.md`: 10
* `radii.lg`: 14
* `radii.pill`: 999
* `borderWidth`: 1.5 to 2
* `tactileShadow`: `shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3`

---

## 3. UI Primitives (`apps/mobile/src/components/ui/`)

### 3.1 `TacticalCard`
* Encapsulates solid mechanical border, background theming, and optional tactile offset drop shadow.
* Supports subtle bracket decorations `[+]` or header tags for tournament flair.

### 3.2 `StatHeroCard`
* Physical DGT clock-style display for current rating, projected rating, and total rating change.
* Tabular numeral rendering to prevent layout jitter during calculations.
* Integrated tournament performance rating (TPR) and games count.

### 3.3 `TacticalButton`
* Mechanical button with 2px border and active translation state (`{ translateX: 2, translateY: 2 }`) to close the shadow gap on press.
* Variants: `primary` (emerald), `accent` (amber), `secondary` (slate), `danger` (crimson).

### 3.4 `WinDrawLossSelector`
* 3-segment mechanical toggle for logging game outcomes:
  * `[ 1.0 WIN ]`
  * `[ ½ DRAW ]`
  * `[ 0.0 LOSS ]`
* Touch targets ≥ 48pt with clear color and icon states.

### 3.5 `ChessInsignia`
* Scalable vector emblems for chess pieces (Knight ♞, Rook ♜, King ♚, Pawn ♟) using `@expo/vector-icons`.

### 3.6 `ThemeToggle`
* Fast toggle component in the navigation bar cycling between Dark 🌙, Light ☀️, and System 📱 modes.

---

## 4. Screen Specifications

### 4.1 Header & MainTabs Navigation
* **Header**:
  * Knight icon badge with bold neo-brutalist `FIDE CALCULATOR` title.
  * Theme toggle icon button + Menu drawer icon button.
  * 1.5px border separating header from content.
* **Tab Bar**:
  * Calculator & History tabs with custom icon states, active border/indicator, and theme-aware colors.

### 4.2 HomeScreen (`FideCalculator`)
* **Top Banner**: `StatHeroCard` showing live tournament rating projection, net delta, and W/D/L bar.
* **Input Section**: Opponent rating numeric input, White/Black piece selector, K-Factor chip selector, and `WinDrawLossSelector`.
* **Tournament Games List**: Each game presented as a `TacticalCard` with round badge (`[ RD 01 ]`), opponent rating, result tag, and rating change.
* **Actions**: High-impact "Add Game" button and tournament batch actions ("Save to History", "Reset Tournament").

### 4.3 HistoryScreen
* **Career Progress Header**: Highest Rating, Current Rating, and Total Rated Games in a 3-tile grid.
* **Monthly Groupings**: Accordion cards per month with net rating change badge (`[ Δ +24.0 ]`) and game count.
* **Expanded Game Log**: Tabular breakdown of individual matches with opponent FIDE ID/name, result, and rating impact.

### 4.4 ProfileScreen & Storage Modals
* **Player ID Badge**: Prominent Knight insignia, FIDE ID tag, Federation code, and official Standard / Rapid / Blitz rating breakdown.
* **Settings Console**: In-depth theme picker (Dark / Light / System), Storage Mode indicator (Cloud vs Local), sync controls, and account management.

### 4.5 Modals & Dialogs
* Redesign `EditGameModal`, `CreateProfileModal`, `EditProfileModal`, `AuthModal`, `LocalStorageModal`, and `MenuModal` with the unified tactical theme tokens and inputs.

---

## 5. Non-Functional Requirements & Accessibility
* **WCAG Contrast**: All primary and secondary text achieves ≥ 4.5:1 contrast against surface backgrounds in both dark and light modes.
* **Touch Targets**: All interactive controls maintain ≥ 48x48dp touch targets.
* **Reduced Motion**: Tactile button presses and modal transitions degrade gracefully if `prefers-reduced-motion` is active.
* **No Breaking Changes**: Core chess rating math (`@fide-calculator/shared`), Supabase cloud sync, and AsyncStorage data schemas remain 100% backward-compatible.

---

## 6. Testing & Verification
* **Unit & Component Testing**: Run existing mobile/shared tests with Jest to guarantee zero logic regressions.
* **Visual & Theme Verification**: Verify both Dark and Light themes across all screens, modals, and input states.
* **Linting & Type Safety**: Ensure zero ESLint or TypeScript compile errors (`pnpm --filter mobile lint` and `tsc --noEmit`).
