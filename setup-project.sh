#!/bin/bash

echo "Setting up TenantOps project..."

# Clean up
rm -rf node_modules **/node_modules 2>/dev/null || true

# Create root package.json
cat > package.json << 'ROOTJSON'
{
  "name": "tenantops",
  "private": true,
  "scripts": {
    "web:dev": "cd apps/web && npm run dev",
    "web:build": "cd apps/web && npm run build",
    "api:dev": "cd apps/api && npm run dev",
    "api:build": "cd apps/api && npm run build",
    "dev": "concurrently \"npm run web:dev\" \"npm run api:dev\"",
    "build": "concurrently \"npm run web:build\" \"npm run api:build\""
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
ROOTJSON

echo "Root package.json created"

# Set up web app
cd apps/web

# Create web package.json
cat > package.json << 'WEBJSON'
{
  "name": "web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "@types/node": "20.0.0",
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0",
    "typescript": "5.0.0",
    "eslint": "8.0.0",
    "eslint-config-next": "14.0.0"
  }
}
WEBJSON

echo "Web package.json created"

# Create Next.js config files
cat > next.config.js << 'NEXTCONFIG'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
NEXTCONFIG

cat > tsconfig.json << 'TSCONFIG'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
TSCONFIG

# Create app structure
mkdir -p src/app
cat > src/app/layout.tsx << 'LAYOUT'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TenantOps - Multi-Tenant SaaS',
  description: 'Multi-tenant SaaS platform built with Next.js and NestJS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
LAYOUT

cat > src/app/page.tsx << 'PAGE'
export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          TenantOps SaaS Platform
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Multi-tenant SaaS built with Next.js and NestJS
        </p>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Architecture Features:</h2>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="mr-2">✅</span>
              React + Next.js Frontend
            </li>
            <li className="flex items-center">
              <span className="mr-2">✅</span>
              NestJS Backend with DDD
            </li>
            <li className="flex items-center">
              <span className="mr-2">✅</span>
              Hexagonal Architecture
            </li>
            <li className="flex items-center">
              <span className="mr-2">✅</span>
              Multi-tenant SaaS
            </li>
            <li className="flex items-center">
              <span className="mr-2">✅</span>
              Monorepo Structure
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
PAGE

cat > src/app/globals.css << 'CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}
CSS

cat > tailwind.config.js << 'TAILWIND'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
TAILWIND

cat > postcss.config.js << 'POSTCSS'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
POSTCSS

echo "Web app setup complete!"
echo ""
echo "To start:"
echo "1. cd /d/Professional_Plus/6. Full Stack/Projects/tenantops"
echo "2. npm install"
echo "3. cd apps/web"
echo "4. npm install"
echo "5. npm run dev"
