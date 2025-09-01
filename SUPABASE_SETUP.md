# Supabase Setup Guide

This guide will help you set up Supabase for the FIDE Calculator app.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `fide-calculator` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Choose the closest region to your users
5. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## 3. Set Up Environment Variables

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 4. Run Database Migrations

1. Install the Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-id
   ```

4. Run the migration:
   ```bash
   supabase db push
   ```

Alternatively, you can run the SQL manually in the Supabase SQL Editor:

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run the SQL

## 5. Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Configure your site URL:
   - For development: `http://localhost:3000`
   - For production: `https://your-domain.com`
3. Add redirect URLs:
   - `http://localhost:3000/**` (for development)
   - `https://your-domain.com/**` (for production)

## 6. Install Dependencies

```bash
npm install
```

## 7. Start the Development Server

```bash
npm run dev
```

## Database Schema

The app uses the following tables:

### `profiles`
- Stores user chess player profiles
- One profile per user
- Contains ratings for standard, rapid, and blitz

### `games`
- Stores individual game results
- Linked to user profiles
- Contains `month_key` field for monthly organization (format: "2025-Aug")
- Games are automatically grouped by month
- Previous months become read-only (serving as backups)

## Monthly Organization

The app organizes games by month for better data management:

- **Current Month**: Games can be added, edited, and deleted
- **Previous Months**: Games become read-only (serving as automatic backups)
- **Month Keys**: Format is "YYYY-MMM" (e.g., "2025-Aug", "2025-Sep")
- **Data Persistence**: All data is stored in the cloud with automatic monthly grouping

## Security

- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data
- Authentication is handled by Supabase Auth

## Features

- **User Authentication**: Email/password signup and login
- **Profile Management**: Create and edit chess player profiles
- **Rating Tracking**: Track games and rating changes for standard, rapid, and blitz
- **Monthly Organization**: Games are automatically grouped by month
- **Automatic Backups**: Previous months become read-only
- **Data Persistence**: All data is stored in Supabase database
- **Multi-rating Support**: Manage different rating types separately
- **Real-time Sync**: Data syncs across devices

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**: Check that your environment variables are set correctly
2. **"Table doesn't exist" error**: Make sure you've run the database migrations
3. **Authentication not working**: Verify your site URL and redirect URLs in Supabase settings

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Review the [Next.js documentation](https://nextjs.org/docs)
- Check the app logs for detailed error messages
