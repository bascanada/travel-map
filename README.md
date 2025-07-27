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










# How to use the template


1. Create the root config file
2. Provide a travel-index (ref in the root config file)
3. Provide a custom color theme for skeleton