# 🏠 Rentify - Peer-to-Peer Rental Platform

A modern, full-stack rental marketplace built with Next.js, Supabase, and Stripe. Users can list items for rent and book rentals from other users with AI-generated rental agreements.

## ✨ Features

### 🔐 Authentication & User Management
- **Secure Authentication** - Email/password and OAuth (Google, GitHub) via Supabase Auth
- **User Profiles** - Complete profile management with avatars and verification
- **Role-based Access** - Admin panel for platform management

### 📦 Item Management
- **List Items** - Upload multiple images, set pricing, and manage availability
- **Categories** - Organized item categorization system
- **Search & Filter** - Advanced search with location and category filters
- **Item Reviews** - Rating and review system for items and users

### 💰 Rental System
- **Smart Booking** - Date selection with availability checking
- **Pricing Calculator** - Automatic calculation of fees, insurance, and delivery costs
- **Delivery Options** - Pickup or delivery with address management
- **Rental Status** - Track rental lifecycle from booking to completion

### 🤖 AI-Powered Agreements
- **DeepSeek AI Integration** - Automatically generate legal rental agreements
- **Malaysian Compliance** - Agreements tailored for Malaysian rental laws
- **Digital Signatures** - Electronic signature capture and storage
- **Agreement Storage** - Secure storage of signed agreements

### 💳 Payment Processing
- **Stripe Integration** - Secure payment processing with test and live modes
- **Stripe Connect** - Split payments between platform and item owners
- **Multiple Payment Methods** - Support for various payment options
- **Payment Tracking** - Complete payment history and status tracking

### 📱 Communication
- **Telegram Integration** - Automated notifications via Telegram bot
- **In-app Messaging** - Direct communication between renters and owners
- **Email Notifications** - Automated email updates for important events

### 🛡️ Security & Safety
- **Row Level Security** - Database-level security with Supabase RLS
- **Input Validation** - Comprehensive form validation and sanitization
- **Secure File Upload** - Protected image upload with validation
- **Audit Trails** - Complete activity logging for transparency

## 🚀 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern UI component library
- **Lucide Icons** - Beautiful icon library

### Backend
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Stripe** - Payment processing and Connect for marketplaces
- **DeepSeek AI** - AI-powered agreement generation
- **Telegram Bot API** - Notification system

### Database
- **PostgreSQL** - Robust relational database via Supabase
- **Row Level Security** - Database-level access control
- **Real-time Subscriptions** - Live updates for messaging and notifications

## 🛠️ Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Stripe account (with Connect enabled)
- DeepSeek AI API key
- Telegram Bot (optional)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/rentify.git
cd rentify
npm install
```

### 2. Environment Setup
Create `.env.local` file:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# DeepSeek AI Configuration
DEEPSEEK_API_KEY=sk-...

# Telegram Bot Configuration (Optional)
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup
Run the SQL scripts in order in your Supabase SQL Editor:
```bash
scripts/01-create-tables.sql
scripts/02-setup-rls.sql
scripts/03-add-stripe-fields.sql
scripts/04-add-agreement-fields.sql
scripts/05-add-telegram-fields.sql
scripts/06-create-profile-trigger.sql
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## 📁 Project Structure

```
rentify/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── checkout/          # Rental checkout flow
│   ├── dashboard/         # User dashboard
│   └── items/             # Item listing and details
├── components/            # Reusable UI components
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase client configuration
│   ├── stripe/           # Stripe configuration
│   └── utils/            # Helper functions
├── scripts/              # Database setup scripts
└── public/               # Static assets
```

## 🔧 Configuration

### Stripe Setup
1. Enable Stripe Connect in your dashboard
2. Configure webhook endpoints for production
3. Set up test data for development

### Supabase Setup
1. Create new project in Supabase
2. Run database scripts in order
3. Configure authentication providers
4. Set up storage buckets for images

### DeepSeek AI Setup
1. Get API key from DeepSeek
2. Configure rate limits and usage monitoring

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Environment Variables
Set all production environment variables in your deployment platform.

### Database Migration
Ensure all SQL scripts are run in your production database.

## 🧪 Testing

### Development Testing
- Demo items (IDs: 1, 2, 3) for UI testing
- Stripe test mode with test cards
- Local Supabase development

### Production Testing
- Real Stripe Connect accounts
- Live payment processing
- Production database

## 📝 API Documentation

### Key Endpoints
- `POST /api/create-checkout-session` - Create Stripe checkout
- `POST /api/generate-agreement` - Generate AI rental agreement
- `POST /api/create-connect-account` - Setup Stripe Connect
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact via Telegram bot integration
- Email support (if configured)

## 🙏 Acknowledgments

- **Supabase** - Backend infrastructure
- **Stripe** - Payment processing
- **DeepSeek** - AI agreement generation
- **Shadcn/ui** - UI components
- **Next.js** - React framework

---

Built with ❤️ using modern web technologies
