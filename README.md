# InventoryPro Cloud

A modern inventory management system with barcode scanning, QR code support, and cloud synchronization.

## Features

- 📊 Real-time inventory tracking
- 📦 Product management
- 🛍️ Order management
- 📈 Stock adjustments
- 📊 Analytics and reporting
- 🔔 Low stock alerts
- 🔒 Secure authentication
- 🌐 Cloud-based storage

## Tech Stack

- React 18
- TypeScript
- Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- Supabase
- Headless UI
- Heroicons

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- Supabase account

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/inventorypro-cloud.git
   cd inventorypro-cloud
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Supabase project:
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key

4. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values with your Supabase credentials

5. Set up the database:
   ```sql
   -- Create products table
   create table products (
     id uuid default uuid_generate_v4() primary key,
     name text not null,
     sku text unique not null,
     price decimal(10,2) not null,
     quantity integer not null default 0,
     min_quantity integer not null default 0,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Create orders table
   create table orders (
     id uuid default uuid_generate_v4() primary key,
     supplier text not null,
     status text not null default 'pending',
     total_items integer not null default 0,
     total_amount decimal(10,2) not null default 0,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Create order_items table
   create table order_items (
     id uuid default uuid_generate_v4() primary key,
     order_id uuid references orders(id) on delete cascade,
     product_id uuid references products(id) on delete cascade,
     quantity integer not null,
     price decimal(10,2) not null,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Create stock_adjustments table
   create table stock_adjustments (
     id uuid default uuid_generate_v4() primary key,
     product_id uuid references products(id) on delete cascade,
     quantity integer not null,
     type text not null,
     reason text not null,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Create RLS policies
   alter table products enable row level security;
   alter table orders enable row level security;
   alter table order_items enable row level security;
   alter table stock_adjustments enable row level security;

   create policy "Enable read access for all users" on products
     for select using (true);

   create policy "Enable insert for authenticated users only" on products
     for insert with check (auth.role() = 'authenticated');

   create policy "Enable update for authenticated users only" on products
     for update using (auth.role() = 'authenticated');

   create policy "Enable delete for authenticated users only" on products
     for delete using (auth.role() = 'authenticated');

   -- Similar policies for other tables...
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── store/         # Redux store and slices
├── types/         # TypeScript type definitions
├── lib/           # Utility functions and configurations
├── App.tsx        # Main App component
└── main.tsx       # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Deployment Guide

### Prerequisites

- Node.js 18+ and npm installed
- A Supabase account with the project set up
- OAuth credentials for social login providers (Google, GitHub, etc.)

### Local Development

1. Clone the repository
```bash
git clone https://github.com/yourusername/inventorypro-cloud.git
cd inventorypro-cloud
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
   - Copy `.env.example` to `.env` and update the variables with your credentials

4. Start the development server
```bash
npm run dev
```

### Production Deployment

#### Deploying to Vercel

1. Push your code to a GitHub repository

2. Visit [Vercel](https://vercel.com) and create a new project from your GitHub repository

3. Configure the build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. Add the following environment variables (from your `.env.production` file):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_GITHUB_CLIENT_ID`
   - `SITE_URL` - Set to your production domain
   - `REDIRECT_URL` - Set to `https://your-domain.vercel.app/auth/callback`

5. Deploy the project

6. Update Supabase Authentication Settings:
   - Go to your Supabase project
   - Navigate to Authentication > URL Configuration
   - Set the Site URL to your production domain
   - Add your domain to the Redirect URLs (include both `/auth/callback` and `/` paths)

7. Update OAuth Provider Redirect URIs:
   - For each OAuth provider (Google, GitHub, etc.), update the redirect URI in their developer consoles to point to your production Supabase URL: `https://your-project.supabase.co/auth/v1/callback`

### Important Deployment Notes

1. **Email Verification**: Ensure Supabase email templates are properly configured for production.

2. **Social Login**: Verify that all OAuth providers have the correct production redirect URLs.

3. **Security Headers**: The Vercel deployment includes security headers configured in `vercel.json`.

4. **Performance Optimizations**: The build is configured to split code into chunks for better performance.

5. **Authentication Flow**: Test the complete authentication flow after deployment to ensure everything works correctly.

## Troubleshooting Deployment

- **Blank Page**: Check if environment variables are properly configured
- **Authentication Errors**: Verify OAuth redirect URIs and Supabase URL configuration
- **API Errors**: Ensure Supabase permissions are properly configured
- **Route Not Found**: The application uses client-side routing, so verify the Vercel configuration includes proper rewrites

## Contact

For support with deployment, contact us at support@inventorypro-cloud.com 