#!/bin/bash

# Exit on error
set -e

# Build the project
echo "Building the project..."
npm run build

# Create or update the 404.html file in the build directory 
# (should already be there from public/, but just in case)
echo "Ensuring 404.html is properly set up..."
cp public/404.html build/404.html

# Include a .nojekyll file to bypass Jekyll processing
echo "Adding .nojekyll file..."
touch build/.nojekyll

# Check if gh-pages is installed
echo "Checking if gh-pages is installed..."
if ! npm list -g gh-pages > /dev/null 2>&1; then
  echo "Installing gh-pages package..."
  npm install -g gh-pages
fi

# Deploy to GitHub Pages
echo "Deploying to GitHub Pages..."
npx gh-pages -d build

echo ""
echo "Deployment complete! Your site should be available at https://safi1000.github.io/e-commerce/"
echo "Note: It may take a few minutes for changes to propagate."
echo "If you encounter routing issues, make sure your 404.html and index.html scripts are properly set up."
