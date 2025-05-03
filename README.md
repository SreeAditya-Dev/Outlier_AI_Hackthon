
# Last Mile - Freight Route Optimization Platform

Last Mile is an intelligent route optimization platform designed specifically for logistics and freight transportation in India. The application provides real-time route planning and optimization for cargo transport, helping companies save time, fuel, and money.

## DEMO VIDEO OF PROTOTYPE : https://drive.google.com/file/d/1tb42MZdLGpUthAohpzlwSH1Un5_q5T4h/view?usp=sharing

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [API Integrations](#api-integrations)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Features

- **Real-Time Traffic Integration**: Access live traffic data to get accurate road conditions and plan efficiently
- **Route Optimization**: Advanced algorithms optimize routes considering distance, traffic, toll costs, and road suitability for heavy cargo trucks
- **Dynamic Rerouting**: Instantly adjust routes when facing unexpected events like traffic jams or road closures
- **Vehicle Management**: Track and manage different vehicle types (lorry, truck, 10-wheeler, 14-wheeler)
- **Trip Planning & Execution**: Plan routes, schedule trips, and track actual trip execution
- **Cost Optimization**: Track and analyze fuel costs, toll expenses, and overall trip efficiency
- **Multi-tenant Architecture**: Organization-based access control with various user roles
- **Analytics Dashboard**: Comprehensive trip history and performance metrics

## Tech Stack

- **Frontend**: React (v18) with TypeScript
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Query for data fetching
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router v6

## API Integrations

### 1. Mapbox GL JS

Mapbox GL JS is used for interactive maps, route visualization, and navigation. The application uses the following Mapbox APIs:

```typescript
// Geocoding API - Convert addresses to coordinates
const geocodeAddress = async (address: string) => {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&country=in&limit=1`
  );
  // Process response
};

// Directions API - Get route between points
const getRoute = async (startCoords: number[], endCoords: number[]) => {
  const query = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?alternatives=true&geometries=geojson&steps=true&access_token=${mapboxToken}`;
  const response = await fetch(query);
  // Process response
};
```

The application uses Mapbox for:
- Geocoding addresses to coordinates
- Generating optimized routes
- Visualizing routes on interactive maps
- Displaying turn-by-turn directions

### 2. Supabase

Supabase provides the backend database and authentication services:

```typescript
// Supabase client initialization
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Supabase is used for:
- User authentication and management
- Storing and retrieving route data
- Managing organization data in multi-tenant setup
- Storing vehicle, location, and trip records

### 3. DiceBear API

DiceBear is used for generating user avatars:

```typescript
// Generate user avatars based on user initials
<AvatarImage 
  src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserInitials()}`} 
  alt="User avatar" 
/>
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lastmile
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following environment variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
📦 Last Mile
 ┣ 📂 public/             # Static assets
 ┣ 📂 src/                # Source code
 ┃ ┣ 📂 components/       # Reusable UI components
 ┃ ┣ 📂 context/          # React context providers
 ┃ ┣ 📂 hooks/            # Custom React hooks
 ┃ ┣ 📂 integrations/     # Integration with external services
 ┃ ┃ ┗ 📂 supabase/       # Supabase client and types
 ┃ ┣ 📂 lib/              # Utility functions and shared code
 ┃ ┣ 📂 pages/            # Application pages
 ┃ ┣ 📂 types/            # TypeScript type definitions
 ┃ ┣ 📜 App.tsx           # Main application component
 ┃ ┣ 📜 main.tsx          # Application entry point
 ┃ ┗ 📜 index.css         # Global styles
 ┣ 📜 index.html          # HTML entry point
 ┣ 📜 package.json        # Project dependencies and scripts
 ┣ 📜 tailwind.config.ts  # Tailwind CSS configuration
 ┣ 📜 tsconfig.json       # TypeScript configuration
 ┣ 📜 vite.config.ts      # Vite configuration
 ┗ 📜 .env                # Environment variables
```

## Database Schema

The database schema includes the following main tables:

### Organizations
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL
);
```

### User Profiles
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL -- admin, dispatcher, driver
);
```

### Vehicles
```sql
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    registration_number TEXT NOT NULL UNIQUE,
    type vehicle_type NOT NULL,
    max_weight DECIMAL(10,2) NOT NULL,
    capacity_volume DECIMAL(10,2),
    fuel_type TEXT DEFAULT 'Diesel',
    status TEXT
);
```

### Locations
```sql
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_toll_plaza BOOLEAN DEFAULT FALSE,
    is_warehouse BOOLEAN DEFAULT FALSE
);
```

### Routes
```sql
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES user_profiles(id),
    origin_id UUID REFERENCES locations(id),
    destination_id UUID REFERENCES locations(id),
    vehicle_id UUID REFERENCES vehicles(id),
    cargo_weight DECIMAL(8,2),
    cargo_type TEXT,
    distance_km DECIMAL(8,2),
    estimated_time_mins INTEGER,
    status route_status DEFAULT 'PLANNED'
);
```

### Trips
```sql
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id),
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES user_profiles(id),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    actual_distance_km DECIMAL(8,2),
    fuel_used_liters DECIMAL(8,2),
    status TEXT
);
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Deployment

The application can be deployed using:

1. Vercel, Netlify, or any other static hosting service (for the frontend)
2. Supabase (for backend and database)

To deploy:
1. Create a production build: `npm run build`
2. Upload the contents of the `dist` folder to your hosting service
3. Set up environment variables for your Supabase credentials

## API Keys and Security

Make sure to secure your API keys and never expose them in client-side code. The application uses environment variables to store sensitive information. In production, these should be set up as proper environment variables on your hosting platform.

For local development, you can use a `.env` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Submit a pull request

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
