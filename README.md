# FIDE Calculator Monorepo

A monorepo containing both web and mobile versions of the FIDE Chess Rating Calculator. Built with Next.js for web and React Native for mobile, sharing common logic through a shared package.

## Project Structure

```
fide-calculator/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # React Native mobile application
├── packages/
│   └── shared/       # Shared types, utilities, and database logic
└── supabase/         # Database migrations and types
```

## Features

- **User Authentication**: Secure signup and login with Supabase Auth
- **Profile Management**: Create and manage chess player profiles
- **Multi-Rating Support**: Track standard, rapid, and blitz ratings separately
- **Calculate rating changes** based on FIDE rules
- **Support for different K-factors** (10, 20, 40)
- **Track game results and rating changes** with cloud storage
- **View rating history** with accumulated changes
- **Backup System**: Monthly backups of your game data
- **Cross-platform**: Web and mobile apps sharing the same logic

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- For mobile development: React Native development environment set up

### Installation

1. Clone the repository:
```bash
git clone https://github.com/truongnguyen/fide-calculator.git
cd fide-calculator
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up Supabase (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions):
   - Create a Supabase project
   - Copy your project URL and anon key
   - Create `.env.local` in `apps/web/` with your credentials
   - Create `.env` in `apps/mobile/` with your credentials
   - Run the database migrations

### Environment Variables

#### Web App (`apps/web/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Mobile App (`apps/mobile/.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Development

### Build Shared Package

First, build the shared package:
```bash
pnpm build:shared
```

Or watch for changes:
```bash
cd packages/shared && pnpm dev
```

### Run Web App

```bash
pnpm dev:web
# or
cd apps/web && pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Run Mobile App

```bash
pnpm dev:mobile
# or
cd apps/mobile && pnpm start
```

Then run on iOS or Android:
```bash
cd apps/mobile
pnpm ios    # for iOS
pnpm android # for Android
```

## Building

### Build Shared Package
```bash
pnpm build:shared
```

### Build Web App
```bash
pnpm build:web
```

### Build Mobile App
```bash
cd apps/mobile
pnpm android  # Build Android
pnpm ios      # Build iOS
```

## Testing

Run tests for all packages:
```bash
pnpm test
```

Run tests for a specific package:
```bash
cd apps/web && pnpm test
cd apps/mobile && pnpm test
cd packages/shared && pnpm test
```

## Shared Package

The `packages/shared` package contains:

- **Types**: All TypeScript interfaces and types (`types.ts`)
- **Utilities**: Rating calculation functions and helpers (`utils.ts`)
- **Database**: Supabase client creation and profile operations (`database.ts`)
- **FIDE**: FIDE player search and parsing utilities (`fide.ts`)

Both web and mobile apps import from this shared package to ensure consistency.

## Architecture

### Web App (Next.js)
- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Backend**: Supabase for authentication, database, and real-time features

### Mobile App (React Native)
- **Framework**: React Native 0.74
- **Navigation**: React Navigation (to be added)
- **State Management**: React Context API
- **Backend**: Supabase for authentication, database, and real-time features

### Shared Package
- **Types**: Common TypeScript types and interfaces
- **Utilities**: Business logic (rating calculations, data transformations)
- **Database**: Supabase client and database operations

## Contributing

1. Make changes in the appropriate app or shared package
2. If changing shared code, rebuild the shared package: `pnpm build:shared`
3. Test your changes in both web and mobile apps
4. Submit a pull request

## License

See [LICENSE](./LICENSE) file for details.
