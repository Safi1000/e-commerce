# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

# ShopEase E-commerce Platform

## GitHub Pages Deployment Guide

If you're deploying this app to GitHub Pages, follow these steps to ensure proper routing:

### Automatic Deployment

1. Run the deployment script:
   - On Windows: `.\deploy-gh-pages.bat`
   - On macOS/Linux: `bash deploy-gh-pages.sh`

2. Wait for the deployment to complete. Your site will be available at https://safi1000.github.io/e-commerce/

### Manual Deployment

1. Build the project:
   ```
   npm run build
   ```

2. Copy the 404.html file to the build directory:
   ```
   cp public/404.html build/
   ```

3. Add a .nojekyll file to bypass GitHub Pages processing:
   ```
   touch build/.nojekyll
   ```

4. Deploy using gh-pages:
   ```
   npm run deploy
   ```

### Fixing Routing Issues

If you encounter the "There isn't a GitHub Pages site here" error when navigating to different pages or after refreshing, the issue is due to GitHub Pages not handling client-side routing correctly. This happens because:

1. GitHub Pages serves a 404 page when it can't find a file that matches the requested URL
2. React Router is a client-side routing solution, so GitHub Pages doesn't know how to handle routes like `/shop` or `/product/123`

Our solution uses these techniques:

1. A custom `404.html` page that redirects to the main page with the requested path in the URL
2. A script in `index.html` that reads this path and passes it to React Router
3. Using HashRouter instead of BrowserRouter (which uses the `#` symbol in URLs)

If you still encounter issues:
- Make sure your browser isn't blocking the redirect scripts
- Try clearing your browser cache
- Verify that your repository settings are correctly set up for GitHub Pages deployment

### Testing Locally

To test the GitHub Pages build locally, you can use a simple HTTP server:

```
npm install -g serve
serve -s build
```

This will serve your built application on `http://localhost:3000`.
