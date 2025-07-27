#!/bin/sh
set -e

# Build to a temp directory inside the container
npm run build -- --output /app/.output

# Clean the output mount if it exists (ignore errors)
rm -rf /app/build/* || true

# Copy the built site to the mounted build directory
cp -r /app/.output/* /app/build/
