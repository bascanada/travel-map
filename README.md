# TravelMap site

## Introduction

TravelMap is a template SvelteKit site for sharing travel timelines with pictures. Users can import the Docker image, modify a configuration file, build the static site, and host the output (e.g., on GitHub Pages).

### Features

* View the itinerary used during the trip.
* See clusters of pictures at each stop, with links or names of places visited.
* Track the travel day by day using a timeline.
* Data conversion from providers (e.g., Google Takeout) is mostly automated via scripts, with manual review/editing for display accuracy. These scripts can be run with GitHub Actions.
* Photo clustering is automatic (based on a configurable radius), with manual override options for special cases.
* All data (timeline, images, clusters, etc.) is stored as static files (YAML or JSON) and accessed client-side.

### Usage Workflow

1. Import the Docker image and modify the configuration file to match your trip details and preferences.
2. Use provided scripts to convert provider datasets (e.g., Google Takeout exports) into the required static data format. Scripts can be run locally or via GitHub Actions.
3. Manually review and edit the generated data files for display accuracy if needed.
4. Build the SvelteKit site to generate static output.
5. Host the static site (e.g., on GitHub Pages).

### Technical Details

* No backend or paid infrastructure required; relies on existing services and static hosting.
* Distributed as a Docker image for easy setup and reproducibility.
* Written with SvelteKit, Tailwind, Skeleton, and TypeScript.
* All data is stored as static YAML or JSON files and loaded client-side.

### Requirements

* The source code is deployable to a Docker image for others to build their website and deploy it to GitHub Pages.
* Does not require any backend services, relies on existing infrastructure.
* Written with SvelteKit, Tailwind and Skeleton.
* Language is Typescript for all components.
* All design must be fully responsive and work equally well on desktop and mobile devices.

## Development Guidelines

### For AI/Copilot Assistance

When working on this project, please follow these guidelines:

#### **Design System & Styling**
- **Always use Skeleton UI components** and Tailwind CSS instead of custom CSS
- Check [Skeleton documentation](https://skeleton.dev) for available components before implementing custom solutions
- Use Skeleton's built-in classes: `card`, `btn`, `variant-*`, `h1-h6`, `badge`, etc.
- Minimize custom CSS - only use when absolutely necessary (e.g., map-specific styles)
- Prefer Tailwind utility classes over custom styles

#### **Component Architecture**
- Keep components focused and single-purpose
- Use TypeScript for all components and proper type definitions
- Follow the established patterns in `src/lib/types/travel-dataset.ts`
- Maintain responsive design for mobile and desktop

#### **Code Organization**
- Components go in `src/lib/`
- Export new components in `src/lib/index.ts`
- Use semantic file names and clear component structure
- Prefer composition over large monolithic components

#### **Technology Stack**
- SvelteKit for the framework
- TypeScript for type safety
- Skeleton UI for components
- Tailwind CSS for utilities
- MapLibre GL for maps
- No backend dependencies - static site only
