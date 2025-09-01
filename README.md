# FIDE Rating Calculator

A simple and efficient web application to calculate FIDE chess rating changes and track your rating progress over time. Built with Next.js, Tailwind CSS, and Supabase for data persistence and user authentication.

## Features

- **User Authentication**: Secure signup and login with Supabase Auth
- **Profile Management**: Create and manage your chess player profile
- **Multi-Rating Support**: Track standard, rapid, and blitz ratings separately
- **Calculate rating changes** based on FIDE rules
- **Support for different K-factors** (10, 20, 40)
- **Track game results and rating changes** with cloud storage
- **View rating history** with accumulated changes
- **Backup System**: Monthly backups of your game data
- **Responsive design** for desktop and mobile
- **Real-time data sync** across devices

## Live Demo

Visit the live application at: [FIDE Calculator](https://truongnguyen.github.io/fide-calculator)

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/truongnguyen/fide-calculator.git
cd fide-calculator
```

2. Set up Supabase (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions):
   - Create a Supabase project
   - Copy your project URL and anon key
   - Create `.env.local` with your credentials
   - Run the database migrations

3. Install dependencies:
```bash
npm install
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

See `env.example` for the complete list of environment variables.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Supabase Documentation](https://supabase.com/docs) - learn about Supabase features and API.
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about Tailwind CSS.

## Architecture

This application uses:

- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Backend**: Supabase for authentication, database, and real-time features
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with email/password
- **State Management**: React hooks with custom Supabase hooks

## Contributing

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
