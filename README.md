# InventoryPro Cloud

A modern inventory management system built with React, TypeScript, and Supabase.

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