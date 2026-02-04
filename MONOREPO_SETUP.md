# Monorepo Setup Guide

This document explains the monorepo structure and how to set it up.

## Structure

```
fide-calculator/
├── apps/
│   ├── web/              # Next.js web application
│   │   ├── src/          # Source code
│   │   ├── public/       # Static assets
│   │   └── package.json  # Web app dependencies
│   └── mobile/           # React Native mobile application
│       ├── src/          # Source code
│       └── package.json  # Mobile app dependencies
├── packages/
│   └── shared/           # Shared code package
│       ├── src/          # Shared source code
│       │   ├── types.ts  # TypeScript types
│       │   ├── utils.ts  # Utility functions
│       │   ├── database.ts # Database operations
│       │   └── fide.ts   # FIDE data utilities
│       └── package.json  # Shared package dependencies
└── package.json          # Root package.json with workspaces
```

## Initial Setup

1. **Install pnpm** (if not already installed):
```bash
npm install -g pnpm
```

2. **Install all dependencies**:
```bash
pnpm install
```

3. **Build the shared package**:
```bash
pnpm build:shared
```

## Shared Package

The `packages/shared` package contains reusable code used by both web and mobile apps:

- **Types** (`types.ts`): All TypeScript interfaces and types
- **Utilities** (`utils.ts`): Rating calculation functions, data transformation helpers
- **Database** (`database.ts`): Supabase client creation and profile operations
- **FIDE** (`fide.ts`): FIDE player search and parsing utilities

### Building the Shared Package

The shared package must be built before it can be used by the apps:

```bash
# Build once
pnpm build:shared

# Watch for changes during development
cd packages/shared && pnpm dev
```

## Development Workflow

### Working on Shared Code

1. Make changes in `packages/shared/src/`
2. Rebuild: `pnpm build:shared` (or use `pnpm dev` in the shared package)
3. Changes will be available in both web and mobile apps

### Working on Web App

1. Ensure shared package is built: `pnpm build:shared`
2. Navigate to web app: `cd apps/web`
3. Run dev server: `pnpm dev`
4. Or from root: `pnpm dev:web`

### Working on Mobile App

1. Ensure shared package is built: `pnpm build:shared`
2. Navigate to mobile app: `cd apps/mobile`
3. Start Metro bundler: `pnpm start`
4. In another terminal, run on device/emulator:
   - iOS: `pnpm ios`
   - Android: `pnpm android`

## Importing from Shared Package

Both apps import from the shared package using:

```typescript
import { 
  UserProfile, 
  calculateRatingChange,
  createSupabaseClient 
} from '@fide-calculator/shared';
```

## Environment Variables

### Web App
Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### Mobile App
Create `apps/mobile/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=your-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
```

Or use `react-native-config` for more advanced configuration.

## Troubleshooting

### "Module not found: @fide-calculator/shared"

1. Make sure you've built the shared package: `pnpm build:shared`
2. Check that `packages/shared/dist/` exists
3. Try reinstalling dependencies: `pnpm install`

### TypeScript errors in shared package

1. Make sure TypeScript is installed: `pnpm add -D typescript`
2. Check `packages/shared/tsconfig.json` is correct
3. Rebuild: `cd packages/shared && pnpm build`

### Metro bundler not finding shared package

1. Clear Metro cache: `cd apps/mobile && pnpm start --reset-cache`
2. Check `babel.config.js` has the module-resolver plugin configured
3. Restart Metro bundler

## Adding New Shared Code

1. Add your code to `packages/shared/src/`
2. Export it from `packages/shared/src/index.ts`
3. Build: `pnpm build:shared`
4. Import in your app: `import { yourExport } from '@fide-calculator/shared'`

## Scripts

From the root directory:

- `pnpm dev:web` - Start web dev server
- `pnpm dev:mobile` - Start mobile Metro bundler
- `pnpm build:web` - Build web app
- `pnpm build:shared` - Build shared package
- `pnpm test` - Run tests in all packages
- `pnpm lint` - Lint all packages

