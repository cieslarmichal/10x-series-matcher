# Frontend

Modern minimalist black & white frontend application built with React, TypeScript, and Tailwind CSS.

## Tech Stack

### Core
- **React 18.3** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **React Router 7** - Client-side routing

### Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Inter Font** - Modern, clean typography
- **OKLCH Colors** - Perceptually uniform color space
- **CSS Variables** - Theme system with dark mode support

### UI Components
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Re-usable component patterns
- **Lucide Icons** - Clean, consistent icons
- **tailwindcss-animate** - Animation utilities

### Forms & Validation
- **React Hook Form** - Performant form management
- **Zod** - Schema validation
- **@hookform/resolvers** - Form validation integration

### State Management
- **React Context** - Global auth state
- **React Hooks** - Local component state

## Design System

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for complete design guidelines.

### Key Features
- 🎨 **Minimalist Black & White** - Clean, professional aesthetic
- 🌓 **Dark Mode Ready** - Full dark mode support
- ♿ **Accessible** - Built with Radix UI primitives
- 📱 **Responsive** - Mobile-first design
- ⚡ **Performance** - Optimized with Vite
- 🎭 **Type-Safe** - Full TypeScript coverage

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

From the root of the monorepo:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev --workspace=@apps/frontend
```

Or from the frontend directory:
```bash
cd apps/frontend
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Production build:
```bash
npm run build --workspace=@apps/frontend
```

Development build:
```bash
npm run build:dev --workspace=@apps/frontend
```

### Preview

Preview production build:
```bash
npm run preview --workspace=@apps/frontend
```

## Project Structure

```
apps/frontend/
├── src/
│   ├── api/              # API client & queries
│   ├── auth/             # Authentication logic
│   ├── components/       # React components
│   │   └── ui/          # Reusable UI components
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── pages/            # Route pages
│   ├── App.tsx           # App component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles & theme
├── public/               # Static assets
├── index.html            # HTML template
├── tailwind.config.js    # Tailwind configuration
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript configuration
```

## Code Style

### ESLint & Prettier
```bash
# Lint
npm run lint

# Lint & fix
npm run lint:fix
```

### Tailwind Classes
- Use semantic color tokens: `bg-background`, `text-foreground`
- Avoid hardcoded colors
- Use consistent spacing scale
- Mobile-first responsive design

### TypeScript
- Strict mode enabled
- No `any` types allowed
- No `ts-ignore` allowed
- Prefer interfaces over types for objects

## Environment Variables

The frontend uses configuration from `src/config.ts`:

```typescript
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
};
```

Create `.env.local` for local overrides:
```env
VITE_API_URL=http://localhost:3000
```

## Authentication

Authentication is handled via:
- **Access Token**: Stored in memory
- **Refresh Token**: HTTP-only cookie
- **Silent Refresh**: Automatic token renewal

See `src/context/AuthContext.tsx` for implementation.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## Deployment

### Docker

Build image:
```bash
docker build -t frontend .
```

Run container:
```bash
docker run -p 80:80 frontend
```

### Fly.io

Deploy to Fly.io:
```bash
fly deploy
```

Configuration in `fly.toml`.

## Contributing

1. Follow the design system guidelines
2. Use CSS variables for colors
3. Ensure TypeScript types are correct
4. Add proper error handling
5. Test responsive design
6. Run linter before committing

## License

See LICENSE in the repository root.
