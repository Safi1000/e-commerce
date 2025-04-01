const PIXABAY_API_URL = 'https://pixabay.com/api/';
const API_KEY = process.env.REACT_APP_PIXABAY_API_KEY;

// Cache for storing image URLs
const imageCache = new Map();

export const getImage = async (query, options = {}) => {
  const cacheKey = `${query}-${options.orientation || 'horizontal'}`;
  
  // Check cache first
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  try {
    if (!API_KEY) {
      console.error('Pixabay API key is not configured');
      throw new Error('Pixabay API key is missing');
    }

    const searchParams = new URLSearchParams({
      key: API_KEY,
      q: `computer ${query}`,
      orientation: options.orientation || 'horizontal',
      image_type: 'photo',
      safesearch: true,
      per_page: 3,
      category: 'computer'
    });

    const response = await fetch(
      `${PIXABAY_API_URL}?${searchParams.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image from Pixabay: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Get a random image from the results
    const images = data.hits;
    if (!images || images.length === 0) {
      throw new Error('No image found for the query');
    }

    const randomIndex = Math.floor(Math.random() * Math.min(images.length, 3));
    const imageUrl = images[randomIndex].largeImageURL;

    // Cache the result
    imageCache.set(cacheKey, imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Error fetching Pixabay image:', error);
    // Return a default placeholder image if the API call fails
    const fallbackUrl = `https://via.placeholder.com/400x300/1a1a1a/ffffff?text=${encodeURIComponent(query)}`;
    imageCache.set(cacheKey, fallbackUrl);
    return fallbackUrl;
  }
};

// Function to get multiple images at once
export const getImages = async (queries) => {
  try {
    if (!API_KEY) {
      throw new Error('Pixabay API key is missing');
    }

    const results = await Promise.all(
      queries.map(query => getImage(query))
    );

    return results;
  } catch (error) {
    console.error('Error fetching multiple Pixabay images:', error);
    return queries.map(query => 
      `https://via.placeholder.com/400x300/1a1a1a/ffffff?text=${encodeURIComponent(query)}`
    );
  }
}; 