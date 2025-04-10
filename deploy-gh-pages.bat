@echo off
echo Setting environment variables...
set PUBLIC_URL=https://safi1000.github.io/e-commerce

echo Building the project...
call npm run build

echo Ensuring 404.html is properly set up...
copy public\404.html build\404.html

echo Adding .nojekyll file...
type nul > build\.nojekyll

echo Checking if gh-pages is installed...
call npm list gh-pages || call npm install --save-dev gh-pages

echo Deploying to GitHub Pages...
call npx gh-pages -d build

echo.
echo Deployment complete! Your site should be available at https://safi1000.github.io/e-commerce/
echo Note: It may take a few minutes for changes to propagate.
echo If you encounter routing issues, make sure your 404.html and index.html scripts are properly set up. 