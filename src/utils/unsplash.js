const UNSPLASH_API_URL = 'https://api.unsplash.com';
const ACCESS_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

// Cache for storing image URLs
const imageCache = new Map();

export const getUnsplashImage = async (query, options = {}) => {
  const cacheKey = `${query}-${options.orientation || 'landscape'}`;
  
  // Check cache first
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  try {
    if (!ACCESS_KEY) {
      console.error('Unsplash API key is not configured');
      throw new Error('Unsplash API key is missing');
    }

    const searchParams = new URLSearchParams({
      query: `pc computer ${query}`,
      orientation: options.orientation || 'landscape',
      client_id: ACCESS_KEY,
      per_page: 1
    });

    // Use search endpoint instead of random for more reliable results
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?${searchParams.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image from Unsplash: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Get the first result from the search
    const imageUrl = data.results[0]?.urls?.regular;
    
    if (!imageUrl) {
      throw new Error('No image found for the query');
    }

    // Cache the result
    imageCache.set(cacheKey, imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
    // Return a default placeholder image if the API call fails
    const fallbackUrl = `https://via.placeholder.com/400x300/1a1a1a/ffffff?text=${encodeURIComponent(query)}`;
    imageCache.set(cacheKey, fallbackUrl);
    return fallbackUrl;
  }
};

// Function to get multiple images at once
export const getUnsplashImages = async (queries) => {
  try {
    if (!ACCESS_KEY) {
      throw new Error('Unsplash API key is missing');
    }

    const results = await Promise.all(
      queries.map(query => getUnsplashImage(query))
    );

    return results;
  } catch (error) {
    console.error('Error fetching multiple Unsplash images:', error);
    return queries.map(query => 
      `https://via.placeholder.com/400x300/1a1a1a/ffffff?text=${encodeURIComponent(query)}`
    );
  }
}; 