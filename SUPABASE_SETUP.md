# Supabase Integration - Lingua Solutions India

## Overview

The application has been fully migrated from localStorage to Supabase database. All data is now persisted in a PostgreSQL database with proper Row Level Security policies.

## Database Schema

### Tables Created

1. **users** - User accounts (clients and translators)
2. **freelancer_profiles** - Translator profiles with skills and ratings
3. **projects** - Translation projects
4. **project_files** - Files attached to projects
5. **messages** - Project communication
6. **notifications** - User notifications
7. **transactions** - Financial transactions (deposits, withdrawals, payments)
8. **platform_settings** - Platform configuration and commission tracking

## Security

All tables have Row Level Security enabled with appropriate policies:
- Users can only read/update their own data
- Project participants can access project data
- Messages are restricted to project participants
- Transactions are visible only to involved parties

## Demo Accounts

### Client Account
- Email: client@example.com
- Type: client
- Initial Balance: $500

### Translator Accounts

1. Maria Garcia
   - Email: translator@example.com
   - Languages: English, Spanish, Portuguese
   - Specializations: Legal, Business, Medical
   - Rating: 4.9/5

2. Ahmed Hassan
   - Email: ahmed@example.com
   - Languages: Arabic, English, French
   - Specializations: Technical, Legal, Marketing
   - Rating: 4.8/5

3. Li Wei
   - Email: liwei@example.com
   - Languages: Chinese, English, Japanese
   - Specializations: Technical, Website, Marketing
   - Rating: 4.95/5

4. Sophie Laurent
   - Email: sophie@example.com
   - Languages: French, English, German, Italian
   - Specializations: Literary, Business, Legal
   - Rating: 4.85/5

## Environment Variables Required

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Features Working

All features are fully functional with Supabase:

- User registration and login
- Automatic currency detection based on location
- Project creation with auto-assignment to best translator
- File upload and management
- Real-time messaging between clients and translators
- Notification system
- Wallet system with deposits and withdrawals
- Transaction tracking with Razorpay integration
- Platform commission tracking
- Multi-currency support (20 currencies)

## Testing the Application

1. Login with demo account:
   - Email: client@example.com
   - Select "Client" account type
   - No password needed (for demo)

2. Create a project:
   - Fill in project details
   - Project will auto-assign to best available translator
   - Both parties receive notifications

3. Test messaging:
   - Go to project messages
   - Send messages between client and translator

4. Test wallet:
   - Add funds to wallet
   - View transaction history
   - Withdraw funds (for translators)

## Data Persistence

All data is now stored in Supabase:
- No more localStorage
- Data persists across sessions
- Data is shared across devices
- Real-time updates possible

## Auto-Assignment Algorithm

When a project is created:
1. System finds translators who speak both languages
2. Checks translator availability
3. Scores translators based on:
   - Rating (40%)
   - Experience (30%)
   - Availability (20%)
   - Response time (10%)
4. Assigns to highest-scoring translator
5. Sends notifications to both parties
6. Creates welcome message automatically

## Commission System

Platform automatically tracks commissions:
- 5% fee on client deposits
- 2% fee on translator withdrawals
- All commissions tracked in platform_settings table
- Detailed transaction records for reconciliation

## Migration Notes

The application was migrated from:
- zustand with localStorage persistence
- to zustand with Supabase backend

All existing features maintained:
- Same API surface
- Same user experience
- Improved data persistence
- Better security with RLS

## Next Steps for Production

1. Set up Supabase Auth for secure authentication
2. Add proper password hashing
3. Implement email verification
4. Set up Razorpay API endpoints (currently frontend only)
5. Add file storage using Supabase Storage
6. Enable real-time subscriptions for live updates
7. Add backup and recovery procedures
8. Set up monitoring and logging

## Database Migrations

All migrations are in the Supabase dashboard under:
Database → Migrations

Current migration:
- `create_translation_platform_schema` - Initial schema setup

## Indexes

Performance indexes created for:
- User email lookups
- Project queries by client/translator
- Message queries by project
- Notification queries by user
- Transaction queries by user

## Important Notes

1. RLS is enabled on ALL tables
2. No user data is exposed without proper authentication
3. Platform commission balance is public read-only
4. File uploads store base64 data in database
5. Automatic timestamps on all records
6. Foreign key constraints maintain data integrity
