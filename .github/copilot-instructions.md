# GitHub Copilot Instructions for TravelMap Project

## Project Context
This is a SvelteKit travel mapping application that creates static sites for sharing travel photos and timelines. Built with Skeleton UI design system and Tailwind CSS.

## Core Principles
1. **Static-only architecture** - No backend, no server dependencies
2. **Skeleton UI first** - Always check Skeleton components before custom solutions
3. **TypeScript everywhere** - Full type safety with proper interfaces
4. **Responsive design** - Mobile-first, works on all screen sizes
5. **Component composition** - Small, focused components over monoliths

## Technology Stack
- SvelteKit (SSG mode)
- TypeScript
- Skeleton UI design system
- Tailwind CSS
- MapLibre GL for maps

## When suggesting code:
### DO:
- Use Skeleton UI components (card, btn, variant-*, h1-h6, badge)
- Use Tailwind utility classes for styling
- Follow TypeScript interfaces in `src/lib/types/travel-dataset.ts`
- Keep components small and focused
- Use semantic HTML and proper accessibility
- Maintain responsive layouts

### DON'T:
- Write custom CSS when Skeleton/Tailwind alternatives exist
- Suggest backend solutions or server dependencies
- Create large monolithic components
- Ignore TypeScript types
- Use non-responsive designs

## File Patterns
- Components: `src/lib/ComponentName.svelte`
- Types: `src/lib/types/`
- Routes: `src/routes/`
- Always export new components in `src/lib/index.ts`

## Design System Reference
Use Skeleton's component library: https://skeleton.dev
- Cards: `class="card p-4"`
- Buttons: `class="btn variant-filled-primary"`
- Typography: `class="h1"`, `class="h2"`, etc.
- Badges: `class="badge variant-soft-primary"`
- Layout: Tailwind grid/flex utilities
