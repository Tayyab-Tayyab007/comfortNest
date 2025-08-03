/**
 * ComfortNest - Index Page JavaScript (Optimized)
 *
 * Main frontend controller for the property search and filtering system.
 * Handles real-time search, property display, and user interactions.
 *
 * CORE FEATURES:
 * - Real-time property search with debouncing
 * - Desktop and mobile search interfaces
 * - Property card rendering and filtering
 * - URL parameter handling for shareable searches
 * - Exact matching for bedrooms/bathrooms
 * - Filter reset functionality
 * - API integration with error handling
 *
 * SEARCH SYSTEM:
 * - Universal search (property title, location, description)
 * - Price range filtering (min/max with smart parsing)
 * - City/location filtering (partial matching)
 * - Bedroom filtering (exact count matching)
 * - Bathroom filtering (exact count matching)
 * - Combined filters with AND logic
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Debounced input events (300-600ms delays)
 * - Client-side filtering for instant results
 * - Efficient DOM manipulation
 * - Lazy loading and caching
 *
 * @author ComfortNest Development Team
 * @version 1.0.0
 */

// ======== GLOBAL VARIABLES ========
let allAdminProperties = [];    // Store all properties for client-side filtering
let loadingTimeout;             // Timeout ID for debouncing API calls

// ======== UTILITY FUNCTIONS ========

/**
 * Debounce function to prevent excessive API calls and improve performance
 * Delays function execution until after specified wait time has elapsed
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(func, wait) {
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(loadingTimeout);
      func(...args);
    };
    clearTimeout(loadingTimeout);
    loadingTimeout = setTimeout(later, wait);
  };
}

// Helper function to format phone number for tel: links (E.164 format)
function formatForTel(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  if (!cleaned.startsWith('92')) {
    cleaned = '92' + cleaned;
  }
  return `tel:+${cleaned}`;
}

// Helper function to format phone number for WhatsApp links
function formatForWhatsApp(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  if (!cleaned.startsWith('92')) {
    cleaned = '92' + cleaned;
  }
  return cleaned;
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Content Loaded - Index page initializing...');

  const propertyContainer = document.getElementById('property-container');
  const universalSearchForm = document.getElementById('universal-search-form');
  const universalSearchInput = document.getElementById('universal-search-input');
  const clearUniversalSearchBtn = document.getElementById('clear-universal-search');

  // Initialize mobile filter toggle
  initializeMobileFilterToggle();

  // Initialize input validation
  initializeInputValidation();

  // Filter elements
  const clearAllBtn = document.getElementById('clear-all-btn');
  const minPriceFilter = document.getElementById('min-price-filter');
  const maxPriceFilter = document.getElementById('max-price-filter');
  const cityFilter = document.getElementById('city-filter');
  const roomsFilter = document.getElementById('rooms-filter');
  const bathsFilter = document.getElementById('baths-filter');

  console.log('Property container found:', !!propertyContainer);
  console.log('Universal search form found:', !!universalSearchForm);
  console.log('Universal search input found:', !!universalSearchInput);
  console.log('PropertyAPI available:', !!window.propertyAPI);

  // Mobile menu is now handled by navbar.js - removed duplicate code

  // Update auth UI based on login status
  if (window.updateAuthUI) {
    updateAuthUI();
  }

  // Simple property loading function that always works
  function loadSimpleProperties() {
    console.log('Loading simple properties...');

    if (!propertyContainer) {
      console.error('Property container not found!');
      return;
    }

    const simpleProperties = [
      {
        _id: 'simple_1',
        title: 'Modern Downtown Apartment',
        location: 'Downtown, City Center',
        price: 250000,
        propertyType: 'apartment',
        bedrooms: 2,
        bathrooms: 2,
        images: ['./images/pic1.jpg'],
        owner: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          displayId: 'USER_001',
          isVerified: true
        }
      },
      {
        _id: 'simple_2',
        title: 'Luxury Villa with Pool',
        location: 'Suburbs, Green Valley',
        price: 750000,
        propertyType: 'house',
        bedrooms: 4,
        bathrooms: 3,
        images: ['./images/pic1.jpg'],
        owner: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1234567891',
          displayId: 'USER_002',
          isVerified: true
        }
      },
      {
        _id: 'simple_3',
        title: 'Cozy Family Home',
        location: 'Residential Area, Oak Street',
        price: 450000,
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 2,
        images: ['./images/pic1.jpg'],
        owner: {
          name: 'Mike Johnson',
          email: 'mike@example.com',
          phone: '+1234567892',
          displayId: 'USER_003',
          isVerified: true
        }
      },
      {
        _id: 'simple_4',
        title: 'Studio Apartment',
        location: 'University District',
        price: 180000,
        propertyType: 'apartment',
        bedrooms: 1,
        bathrooms: 1,
        images: ['./images/pic1.jpg'],
        owner: {
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          phone: '+1234567893',
          displayId: 'USER_004',
          isVerified: true
        }
      },
      {
        _id: 'simple_5',
        title: 'Commercial Office Space',
        location: 'Business District',
        price: 1200000,
        propertyType: 'commercial',
        bedrooms: 0,
        bathrooms: 2,
        images: ['./images/pic1.jpg'],
        owner: {
          name: 'Business Corp',
          email: 'contact@business.com',
          phone: '+1234567894',
          displayId: 'USER_005',
          isVerified: true
        }
      }
    ];

    // Clear container
    propertyContainer.innerHTML = '';

    // Add each property
    simpleProperties.forEach((property, index) => {
      console.log(`Adding simple property ${index + 1}: ${property.title}`);

      const propertyCard = document.createElement('div');
      propertyCard.className = 'box';
      propertyCard.style.cursor = 'pointer';
      propertyCard.innerHTML = `
        <div class="top">
          <div class="overlay">
            <img src="${property.images[0]}" alt="${property.title}" loading="lazy" />
          </div>
        </div>
        <div class="bottom">
          <div class="property-title">
            <h3>${property.title}</h3>
          </div>
          <div class="contact-buttons">
            <a href="tel:${property.owner.phone}" class="call-btn">
              <i class="fas fa-phone"></i>
            </a>
            <a href="https://api.whatsapp.com/send?phone=${property.owner.phone.replace(/\D/g, '')}" target="_blank" class="whatsapp-btn">
              <i class="fab fa-whatsapp"></i>
              <span>WhatsApp</span>
            </a>
            <a href="mailto:${property.owner.email}" class="email-btn">
              <i class="fas fa-envelope"></i>
            </a>
          </div>
          <div class="location">
            <i class="fas fa-map-marker-alt"></i> ${property.location}
          </div>
          <div class="owner-info" style="font-size: 0.9em; color: #666; margin: 0.5rem 0;">
            <i class="fas fa-user"></i> ${property.owner.name} (ID: ${property.owner.displayId})
          </div>
          <div class="price-view">
            <div class="price">PKR ${property.price.toLocaleString()}</div>
          </div>
        </div>
      `;

      propertyCard.addEventListener('click', (e) => {
        if (e.target.closest('.contact-buttons')) {
          return;
        }
        window.location.href = `/detail.html?id=${property._id}`;
      });

      propertyContainer.appendChild(propertyCard);
    });

    console.log(`Simple properties loaded successfully! Added ${simpleProperties.length} properties.`);
  }

  // Function to load real properties from database
  async function loadRealProperties() {
    console.log('Loading real properties from database...');

    if (!propertyContainer) {
      console.error('Property container not found!');
      return;
    }

    try {
      // Show loading state
      propertyContainer.innerHTML = `
        <div class="loading-container" style="text-align: center; padding: 40px; grid-column: 1 / -1;">
          <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #6abf00; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
          <p style="color: #666; font-size: 1.1em;">Loading properties from database...</p>
        </div>
      `;

      // Check if API is available
      if (!window.propertyAPI) {
        console.warn('PropertyAPI not available, trying to load it...');
        // Wait a bit for API to load
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!window.propertyAPI) {
          throw new Error('PropertyAPI still not available');
        }
      }

      console.log('Making API call to get properties...');
      const response = await window.propertyAPI.getAllProperties('?limit=50');
      console.log('API Response:', response);

      // Handle different response formats
      let properties = [];
      if (response && response.success && response.data && Array.isArray(response.data)) {
        properties = response.data;
      } else if (response && response.data && Array.isArray(response.data)) {
        properties = response.data;
      } else if (response && Array.isArray(response)) {
        properties = response;
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('Invalid response format from API');
      }

      console.log(`Found ${properties.length} properties from database`);

      if (properties.length === 0) {
        propertyContainer.innerHTML = `
          <div class="no-properties" style="text-align: center; padding: 40px; grid-column: 1 / -1;">
            <i class="fas fa-home" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
            <h3 style="color: #666; margin-bottom: 10px;">No Properties Available</h3>
            <p style="color: #888;">No properties have been added to the database yet.</p>
            <p style="color: #888;">Please check back later or contact the administrator.</p>
          </div>
        `;
        return;
      }

      // Clear loading and render properties
      propertyContainer.innerHTML = '';
      renderProperties(properties);
      console.log(`Successfully loaded ${properties.length} real properties from database`);

      // Check for URL parameters and apply filters
      const urlParams = getURLParameters();
      if (Object.keys(urlParams).length > 0) {
        console.log('URL parameters detected, applying filters:', urlParams);

        // Convert URL parameters to filter format
        const filters = {};
        if (urlParams.city) filters.city = urlParams.city;
        if (urlParams.minPrice) filters.minPrice = parseFloat(urlParams.minPrice);
        if (urlParams.maxPrice) filters.maxPrice = parseFloat(urlParams.maxPrice);
        if (urlParams.rooms || urlParams.bedrooms) filters.bedrooms = parseInt(urlParams.rooms || urlParams.bedrooms);
        if (urlParams.bathrooms) filters.bathrooms = parseInt(urlParams.bathrooms);
        if (urlParams.where) filters.searchTerm = urlParams.where;

        // Populate filter inputs with URL values
        if (urlParams.city) {
          const cityFilter = document.getElementById('city-filter');
          if (cityFilter) cityFilter.value = urlParams.city;
        }
        if (urlParams.minPrice) {
          const minPriceFilter = document.getElementById('min-price-filter');
          if (minPriceFilter) minPriceFilter.value = urlParams.minPrice;
        }
        if (urlParams.maxPrice) {
          const maxPriceFilter = document.getElementById('max-price-filter');
          if (maxPriceFilter) maxPriceFilter.value = urlParams.maxPrice;
        }
        if (urlParams.rooms || urlParams.bedrooms) {
          const roomsFilter = document.getElementById('rooms-filter');
          if (roomsFilter) roomsFilter.value = urlParams.rooms || urlParams.bedrooms;
        }
        if (urlParams.bathrooms) {
          const bathsFilter = document.getElementById('baths-filter');
          if (bathsFilter) bathsFilter.value = urlParams.bathrooms;
        }

        // Apply the filters directly
        setTimeout(() => {
          console.log('Applying URL-based filters:', filters);
          applyURLFilters(filters);
        }, 500);
      }

    } catch (error) {
      console.error('Error loading real properties:', error);

      // Show error message
      propertyContainer.innerHTML = `
        <div class="error-container" style="text-align: center; padding: 40px; grid-column: 1 / -1; background: #ffebee; border-radius: 10px; border: 1px solid #ffcdd2;">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #d32f2f; margin-bottom: 20px;"></i>
          <h3 style="color: #d32f2f; margin-bottom: 10px;">Unable to Load Properties</h3>
          <p style="color: #666; margin-bottom: 15px;">There was an error connecting to the database.</p>
          <p style="color: #888; font-size: 0.9em;">Error: ${error.message}</p>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #6abf00; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Try Again
          </button>
        </div>
      `;
    }
  }

  // Clear all filters functionality
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      console.log('Clearing all filters and search...');

      // Clear all filter inputs and search
      if (minPriceFilter) minPriceFilter.value = '';
      if (maxPriceFilter) maxPriceFilter.value = '';
      if (cityFilter) cityFilter.value = '';
      if (roomsFilter) roomsFilter.value = '';
      if (bathsFilter) bathsFilter.value = '';
      if (universalSearchInput) universalSearchInput.value = '';

      // Visual feedback
      clearAllBtn.style.transform = 'scale(0.9)';
      setTimeout(() => {
        clearAllBtn.style.transform = 'scale(1)';
      }, 150);

      // Show loading state
      if (propertyContainer) {
        propertyContainer.innerHTML = `
          <div class="loading-container" style="text-align: center; padding: 40px; grid-column: 1 / -1;">
            <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #6abf00; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p style="color: #666; font-size: 1.1em;">Clearing filters and reloading properties...</p>
          </div>
        `;
      }

      // Reload all properties after a short delay
      setTimeout(() => {
        loadRealProperties();
      }, 300);
    });
  }

  // Load real properties from database
  if (propertyContainer) {
    console.log('Initializing real property loading...');
    loadRealProperties();
  }

  // Get URL parameters for filtering
  function getURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};

    // Get all possible filter parameters
    const filterKeys = ['where', 'minPrice', 'maxPrice', 'city', 'rooms', 'bathrooms', 'bedrooms'];

    filterKeys.forEach(key => {
      const value = urlParams.get(key);
      if (value && value.trim()) {
        params[key] = value.trim();
      }
    });

    console.log('URL parameters found:', params);
    return params;
  }

  // Reset all filters function
  function resetAllFilters() {
    console.log('Resetting all filters...');

    // Clear all filter inputs
    if (universalSearchInput) {
      universalSearchInput.value = '';
    }
    if (minPriceFilter) {
      minPriceFilter.value = '';
    }
    if (maxPriceFilter) {
      maxPriceFilter.value = '';
    }
    if (cityFilter) {
      cityFilter.value = '';
    }
    if (roomsFilter) {
      roomsFilter.value = '';
    }
    if (bathsFilter) {
      bathsFilter.value = '';
    }

    // Clear mobile filter inputs
    const mobileInputs = [
      'mobile-where-filter',
      'mobile-min-price-filter',
      'mobile-max-price-filter',
      'mobile-city-filter',
      'mobile-rooms-filter',
      'mobile-bathrooms-filter'
    ];

    mobileInputs.forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) {
        input.value = '';
      }
    });

    // Add visual feedback animation
    const resetButton = document.querySelector('.reset-filters-button');
    if (resetButton) {
      resetButton.style.transform = 'scale(0.9)';
      resetButton.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
      setTimeout(() => {
        resetButton.style.transform = 'scale(1)';
        resetButton.style.background = 'linear-gradient(135deg, #6c757d, #5a6268)';
      }, 200);
    }

    // Clear URL parameters
    const url = new URL(window.location);
    url.search = '';
    window.history.replaceState({}, '', url);

    // Show all properties
    console.log('Loading all properties after reset...');
    loadRealProperties();

    // Show success message briefly
    showResetConfirmation();
  }

  // Show reset confirmation
  function showResetConfirmation() {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.className = 'reset-notification';
    notification.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>Filters reset successfully</span>
    `;

    // Add notification styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Apply filters directly from URL parameters
  function applyURLFilters(filters) {
    console.log('Applying URL filters directly:', filters);

    const propertyCards = document.querySelectorAll('.box');
    console.log(`Filtering ${propertyCards.length} property cards with URL filters`);

    let visibleCount = 0;

    propertyCards.forEach((card, index) => {
      // Get stored property data
      let propertyData = null;
      try {
        propertyData = JSON.parse(card.dataset.propertyData || '{}');
      } catch (e) {
        console.warn('Failed to parse property data for card', index);
        propertyData = {};
      }

      // Get text content for text-based filtering
      const title = card.querySelector('.bottom h3')?.textContent?.toLowerCase() || '';
      const location = card.querySelector('.bottom .location')?.textContent?.toLowerCase() || '';
      const priceText = card.querySelector('.bottom .price')?.textContent || '';

      let matches = true;

      // City filter
      if (filters.city) {
        const cityMatches = location.includes(filters.city.toLowerCase()) ||
                           title.includes(filters.city.toLowerCase());
        matches = matches && cityMatches;
        console.log(`Card ${index + 1}: City filter (${filters.city}): ${cityMatches}`);
      }

      // Price filters
      if (filters.minPrice || filters.maxPrice) {
        const priceMatch = priceText.match(/PKR\s*([\d,]+)/);
        if (priceMatch) {
          const price = parseInt(priceMatch[1].replace(/,/g, ''));

          if (filters.minPrice) {
            const minPriceMatches = price >= filters.minPrice;
            matches = matches && minPriceMatches;
            console.log(`Card ${index + 1}: Min price filter (>= ${filters.minPrice}): ${minPriceMatches}`);
          }

          if (filters.maxPrice) {
            const maxPriceMatches = price <= filters.maxPrice;
            matches = matches && maxPriceMatches;
            console.log(`Card ${index + 1}: Max price filter (<= ${filters.maxPrice}): ${maxPriceMatches}`);
          }
        }
      }

      // Bedroom filter - EXACT MATCH
      if (filters.bedrooms) {
        if (propertyData && propertyData.bedrooms !== undefined) {
          const bedroomMatches = propertyData.bedrooms === filters.bedrooms;
          matches = matches && bedroomMatches;
          console.log(`Card ${index + 1}: Bedroom filter (exactly ${filters.bedrooms}): ${bedroomMatches} (property has ${propertyData.bedrooms})`);
        }
      }

      // Bathroom filter - EXACT MATCH
      if (filters.bathrooms) {
        if (propertyData && propertyData.bathrooms !== undefined) {
          const bathroomMatches = propertyData.bathrooms === filters.bathrooms;
          matches = matches && bathroomMatches;
          console.log(`Card ${index + 1}: Bathroom filter (exactly ${filters.bathrooms}): ${bathroomMatches} (property has ${propertyData.bathrooms})`);
        }
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchMatches = title.includes(filters.searchTerm.toLowerCase()) ||
                             location.includes(filters.searchTerm.toLowerCase());
        matches = matches && searchMatches;
        console.log(`Card ${index + 1}: Search term filter (${filters.searchTerm}): ${searchMatches}`);
      }

      // Show/hide the card
      if (matches) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    console.log(`URL filtering complete: ${visibleCount} of ${propertyCards.length} properties match the criteria`);

    // Update results count if there's a results counter
    const resultsCounter = document.querySelector('.results-count');
    if (resultsCounter) {
      resultsCounter.textContent = `${visibleCount} properties found`;
    }
  }

  // Fetch and display properties - Optimized
  async function loadProperties(queryParams = '') {
    try {
      console.log('loadProperties called with queryParams:', queryParams);
      if (!propertyContainer) {
        console.error('Property container not found!');
        return;
      }

      // Show loading state
      propertyContainer.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading properties...</p>
        </div>
      `;

      // Check if API is available
      if (!window.propertyAPI) {
        console.warn('PropertyAPI not available, loading fallback properties');
        loadFallbackProperties();
        return;
      }

      // Add limit parameter to get more properties
      const finalQuery = queryParams || '?limit=50';
      console.log('Fetching properties with query:', finalQuery);

      const response = await window.propertyAPI.getAllProperties(finalQuery);
      console.log('API response for properties:', response);

      // Handle different response formats
      let properties = [];
      if (response && response.success && response.data && Array.isArray(response.data)) {
        properties = response.data;
      } else if (response && response.data && Array.isArray(response.data)) {
        properties = response.data;
      } else if (response && Array.isArray(response)) {
        properties = response;
      } else if (response && response.properties && Array.isArray(response.properties)) {
        properties = response.properties;
      } else {
        console.error('Unexpected response format:', response);
        console.log('Loading fallback properties due to unexpected response format');
        loadFallbackProperties();
        return;
      }

      console.log('Processed properties array:', properties);
      console.log('Number of properties to display:', properties.length);

      if (properties.length === 0) {
        console.log('No properties from API, loading fallback properties');
        loadFallbackProperties();
        return;
      }

      renderProperties(properties);

    } catch (error) {
      console.error('Error loading properties:', error);
      console.log('Falling back to sample properties due to error...');
      loadFallbackProperties();
    }
  }

  // Separate function to render properties
  function renderProperties(properties) {
    console.log('Rendering', properties.length, 'properties');
    propertyContainer.innerHTML = ''; // Clear previous content

    properties.forEach((property, index) => {
      console.log(`Rendering property ${index + 1}:`, property.title);
      const propertyCard = document.createElement('div');
      // SVG placeholder for missing images
      const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA0MEg2NVY2MEgzNVY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+CjwvcGF0aD4KPHRleHQgeD0iNTAiIHk9IjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2QjcyODAiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';

      propertyCard.className = 'box';
      propertyCard.style.cursor = 'pointer';

      // Store property data for filtering (with fallback values for testing)
      const propertyDataForFiltering = {
        bedrooms: property.bedrooms !== undefined ? property.bedrooms : Math.floor(Math.random() * 4) + 1, // 1-4 bedrooms
        bathrooms: property.bathrooms !== undefined ? property.bathrooms : Math.floor(Math.random() * 3) + 1, // 1-3 bathrooms
        price: property.price,
        location: property.location,
        title: property.title
      };

      console.log(`Property ${index + 1} data for filtering:`, propertyDataForFiltering);
      propertyCard.dataset.propertyData = JSON.stringify(propertyDataForFiltering);

      propertyCard.innerHTML = `
        <div class="top">
          <div class="overlay">
            <img src="${property.images && property.images.length > 0 ? property.images[0] : defaultImage}"
                 alt="${property.title || 'Property'}"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='${defaultImage}'; console.warn('Failed to load property image');"
                 decoding="async" />
          </div>
        </div>
        <div class="bottom">
          <div class="property-title">
            <h3>${property.title || 'Property Title'}</h3>
          </div>
          <div class="contact-buttons">
            ${property.owner && property.owner.isVerified ? `
            <a href="${formatForTel(property.owner.phone)}" class="call-btn">
              <i class="fas fa-phone"></i>
            </a>
            <a href="https://api.whatsapp.com/send?phone=${formatForWhatsApp(property.owner.phone)}" target="_blank" class="whatsapp-btn">
              <i class="fab fa-whatsapp"></i>
              <span>WhatsApp</span>
            </a>
            ` : ''}
            <a href="mailto:${property.owner?.email || 'contact@example.com'}" class="email-btn">
              <i class="fas fa-envelope"></i>
            </a>
          </div>
          <div class="location">
            <i class="fas fa-map-marker-alt"></i> ${property.location || 'FG Degree College, Okara Cantt'}
          </div>
          <div class="property-details" style="font-size: 0.9em; color: #666; margin: 0.5rem 0; display: flex; gap: 1rem;">
            ${property.bedrooms !== undefined ? `<span><i class="fas fa-bed"></i> ${property.bedrooms} ${property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>` : ''}
            ${property.bathrooms !== undefined ? `<span><i class="fas fa-bath"></i> ${property.bathrooms} ${property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>` : ''}
          </div>
          <div class="owner-info" style="font-size: 0.9em; color: #666; margin: 0.5rem 0;">
            <i class="fas fa-user"></i> ${property.owner?.name || 'Owner'}
            ${property.owner?.displayId ? `(ID: ${property.owner.displayId})` : ''}
          </div>
          <div class="price-view">
            <div class="price">PKR ${property.price ? property.price.toLocaleString() : '700000'}</div>
          </div>
        </div>
      `;

      propertyCard.addEventListener('click', (e) => {
          if (e.target.closest('.contact-buttons')) {
              return;
          }
          window.location.href = `/detail.html?id=${property._id}`;
      });

      propertyContainer.appendChild(propertyCard);
    });

    console.log('Properties HTML rendered successfully.');

    // Add heart toggle functionality
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const icon = btn.querySelector('i');
        if (icon.classList.contains('far')) {
          icon.classList.remove('far');
          icon.classList.add('fas');
          btn.classList.add('active');
        } else {
          icon.classList.remove('fas');
          icon.classList.add('far');
          btn.classList.remove('active');
        }
      });
    });
  }

  // Fallback property loading function
  function loadFallbackProperties() {
    console.log('Loading fallback properties...');

    const sampleProperties = [
      {
        _id: 'sample_1',
        title: 'Modern Downtown Apartment',
        location: 'Downtown, City Center',
        price: 250000,
        propertyType: 'apartment',
        bedrooms: 2,
        bathrooms: 2,
        images: ['./images/pic1.jpg'],
        owner: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          displayId: 'USER_001',
          isVerified: true
        }
      },
      {
        _id: 'sample_2',
        title: 'Luxury Villa with Pool',
        location: 'Suburbs, Green Valley',
        price: 750000,
        propertyType: 'house',
        bedrooms: 4,
        bathrooms: 3,
        images: ['./images/pic1.jpg'],
        owner: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1234567891',
          displayId: 'USER_002',
          isVerified: true
        }
      },
      {
        _id: 'sample_3',
        title: 'Cozy Family Home',
        location: 'Residential Area, Oak Street',
        price: 450000,
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 2,
        images: ['./images/pic1.jpg'],
        owner: {
          name: 'Mike Johnson',
          email: 'mike@example.com',
          phone: '+1234567892',
          displayId: 'USER_003',
          isVerified: true
        }
      },
      {
        _id: 'sample_4',
        title: 'Studio Apartment',
        location: 'University District',
        price: 180000,
        propertyType: 'apartment',
        bedrooms: 1,
        bathrooms: 1,
        images: ['./images/pic1.jpg'],
        owner: {
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          phone: '+1234567893',
          displayId: 'USER_004',
          isVerified: true
        }
      },
      {
        _id: 'sample_5',
        title: 'Commercial Office Space',
        location: 'Business District',
        price: 1200000,
        propertyType: 'commercial',
        bedrooms: 0,
        bathrooms: 2,
        images: ['./images/pic1.jpg'],
        owner: {
          name: 'Business Corp',
          email: 'contact@business.com',
          phone: '+1234567894',
          displayId: 'USER_005',
          isVerified: true
        }
      }
    ];

    console.log('Rendering fallback properties...');
    renderProperties(sampleProperties);
  }
  
  // Universal search function (moved inside DOMContentLoaded)
  async function performUniversalSearch(searchTerm) {
    console.log('performUniversalSearch called with term:', searchTerm);

    if (!searchTerm.trim()) {
      console.log('Empty search term, loading all properties');
      loadProperties(); // Show all properties if search is empty
      return;
    }

    try {
      // Show loading state
      if (propertyContainer) {
        propertyContainer.innerHTML = `
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Searching properties...</p>
          </div>
        `;
      }

      // Check if propertyAPI is available
      if (!window.propertyAPI) {
        console.error('propertyAPI not available, falling back to client-side search');
        performClientSideSearch(searchTerm);
        return;
      }

      // Build comprehensive search query
      let queryString = `?universalSearch=${encodeURIComponent(searchTerm)}`;

      console.log('Performing universal search with query:', queryString);
      const response = await window.propertyAPI.getAllProperties(queryString);
      console.log('Universal search API response:', response);

      // Handle different response formats
      let properties = [];
      if (response && response.success && response.data && Array.isArray(response.data)) {
        properties = response.data;
      } else if (response && response.data && Array.isArray(response.data)) {
        properties = response.data;
      } else if (response && Array.isArray(response)) {
        properties = response;
      } else {
        console.error('Unexpected search response format:', response);
        performClientSideSearch(searchTerm);
        return;
      }

      if (properties.length === 0) {
        propertyContainer.innerHTML = `
          <div class="no-results">
            <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
            <h3>No properties found</h3>
            <p>Try searching with different keywords like location, property type, price, or owner name.</p>
            <button onclick="location.reload()" class="btn btn-primary mt-3">Show All Properties</button>
          </div>
        `;
        return;
      }

      // Use the renderProperties function
      renderProperties(properties);
      console.log('Universal search results rendered.');
    } catch (error) {
      console.error('Error performing universal search:', error);
      console.log('Falling back to client-side search...');

      // Fallback to client-side search
      performClientSideSearch(searchTerm);
    }
  }

  // Client-side search fallback with enhanced AND logic
  function performClientSideSearch(searchTerm) {
    console.log('Performing client-side search with AND logic for:', searchTerm);
    const propertyCards = document.querySelectorAll('#property-container .box');
    const filters = getCurrentFilters();
    let visibleCount = 0;

    // Remove any existing no-results messages
    const existingNoResults = document.querySelectorAll('.no-results, .error-container');
    existingNoResults.forEach(el => el.remove());

    if (propertyCards.length === 0) {
      console.log('No properties loaded yet, loading properties first');
      loadProperties();
      return;
    }

    console.log(`Searching through ${propertyCards.length} property cards with filters (AND logic):`, filters);

    // Log specific bedroom/bathroom filter values
    if (filters.bedrooms) {
      console.log('Bedroom filter active:', filters.bedrooms);
    }
    if (filters.bathrooms) {
      console.log('Bathroom filter active:', filters.bathrooms);
    }

    propertyCards.forEach((card, index) => {
      const title = card.querySelector('.bottom h3')?.textContent?.toLowerCase() || '';
      const location = card.querySelector('.bottom .location')?.textContent?.toLowerCase() || '';
      const ownerInfo = card.querySelector('.bottom .owner-info')?.textContent?.toLowerCase() || '';
      const priceText = card.querySelector('.bottom .price')?.textContent || '';

      // Get stored property data
      let propertyData = null;
      try {
        propertyData = JSON.parse(card.dataset.propertyData || '{}');
      } catch (e) {
        console.warn('Failed to parse property data for card', index);
        propertyData = {};
      }

      // Start with true - all conditions must pass (AND logic)
      let matches = true;
      let filterResults = {};

      // Search term matching (case-insensitive)
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        const titleLower = title.toLowerCase();
        const locationLower = location.toLowerCase();
        const ownerInfoLower = ownerInfo.toLowerCase();
        const priceTextLower = priceText.toLowerCase();

        const searchMatches = titleLower.includes(searchLower) ||
                             locationLower.includes(searchLower) ||
                             ownerInfoLower.includes(searchLower) ||
                             priceTextLower.includes(searchLower);
        matches = matches && searchMatches;
        filterResults.searchTerm = searchMatches;
        console.log(`Card ${index}: Search term "${searchTerm}" matches (case-insensitive): ${searchMatches}`);
      }

      // Price filtering (both min and max must pass if specified)
      if (filters.minPrice || filters.maxPrice) {
        const priceValue = parsePrice(priceText);
        let priceMatches = true;

        if (priceValue !== null) {
          if (filters.minPrice && priceValue < filters.minPrice) {
            priceMatches = false;
          }
          if (filters.maxPrice && priceValue > filters.maxPrice) {
            priceMatches = false;
          }
        } else {
          priceMatches = false; // If price can't be parsed, exclude it
        }

        matches = matches && priceMatches;
        filterResults.price = priceMatches;
        console.log(`Card ${index}: Price ${priceValue} matches range [${filters.minPrice || 'any'} - ${filters.maxPrice || 'any'}]: ${priceMatches}`);
      }

      // City/Location filtering (case-insensitive)
      if (filters.city && filters.city.trim()) {
        const cityLower = filters.city.toLowerCase().trim();
        const locationLower = location.toLowerCase();
        const locationMatches = locationLower.includes(cityLower);
        matches = matches && locationMatches;
        filterResults.city = locationMatches;
        console.log(`Card ${index}: Location "${location}" contains "${filters.city}" (case-insensitive): ${locationMatches}`);
      }

      // Bedrooms filtering - using actual property data
      if (filters.bedrooms && filters.bedrooms > 0) {
        const requiredBedrooms = parseInt(filters.bedrooms.toString().replace('+', ''));
        let bedroomMatches = false;

        if (propertyData && propertyData.bedrooms !== undefined) {
          // Use actual property data - EXACT MATCH
          const actualBedrooms = parseInt(propertyData.bedrooms);
          bedroomMatches = actualBedrooms === requiredBedrooms;
          console.log(`Card ${index}: Using property data - Bedrooms: ${actualBedrooms} === ${requiredBedrooms} = ${bedroomMatches}`);
        } else {
          // Fallback to regex parsing if property data not available - EXACT MATCH
          const bedroomMatch = title.match(/(\d+)\s*(bed|bedroom|br)/i) ||
                              ownerInfo.match(/(\d+)\s*(bed|bedroom|br)/i) ||
                              card.textContent.match(/(\d+)\s*(bed|bedroom|br)/i);

          if (bedroomMatch) {
            const bedroomCount = parseInt(bedroomMatch[1]);
            bedroomMatches = bedroomCount === requiredBedrooms;
            console.log(`Card ${index}: Using regex parsing - Bedrooms: ${bedroomCount} === ${requiredBedrooms} = ${bedroomMatches}`);
          } else {
            bedroomMatches = false;
            console.log(`Card ${index}: No bedroom info found, excluding from results`);
          }
        }

        matches = matches && bedroomMatches;
        filterResults.bedrooms = bedroomMatches;
      }

      // Bathrooms filtering - using actual property data
      if (filters.bathrooms && filters.bathrooms > 0) {
        const requiredBathrooms = parseInt(filters.bathrooms.toString().replace('+', ''));
        let bathroomMatches = false;

        if (propertyData && propertyData.bathrooms !== undefined) {
          // Use actual property data - EXACT MATCH
          const actualBathrooms = parseInt(propertyData.bathrooms);
          bathroomMatches = actualBathrooms === requiredBathrooms;
          console.log(`Card ${index}: Using property data - Bathrooms: ${actualBathrooms} === ${requiredBathrooms} = ${bathroomMatches}`);
        } else {
          // Fallback to regex parsing if property data not available - EXACT MATCH
          const bathroomMatch = title.match(/(\d+)\s*(bath|bathroom|br)/i) ||
                               ownerInfo.match(/(\d+)\s*(bath|bathroom|br)/i) ||
                               card.textContent.match(/(\d+)\s*(bath|bathroom|br)/i);

          if (bathroomMatch) {
            const bathroomCount = parseInt(bathroomMatch[1]);
            bathroomMatches = bathroomCount === requiredBathrooms;
            console.log(`Card ${index}: Using regex parsing - Bathrooms: ${bathroomCount} === ${requiredBathrooms} = ${bathroomMatches}`);
          } else {
            bathroomMatches = false;
            console.log(`Card ${index}: No bathroom info found, excluding from results`);
          }
        }

        matches = matches && bathroomMatches;
        filterResults.bathrooms = bathroomMatches;
      }

      // Final result logging
      console.log(`Card ${index}: Final match result: ${matches}`, filterResults);

      // Show/hide card based on match
      if (matches) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    console.log(`Found ${visibleCount} matching properties`);

    // Show no results message if no matches found
    if (visibleCount === 0) {
      const noResultsDiv = document.createElement('div');
      noResultsDiv.className = 'no-results';
      noResultsDiv.innerHTML = `
        <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
        <h3>No properties found</h3>
        <p>Try searching with different keywords or adjusting your filters.</p>
        <button onclick="location.reload()" class="btn btn-primary mt-3">Show All Properties</button>
      `;
      propertyContainer.appendChild(noResultsDiv);
    }
  }

  // Smart price parsing function
  function parsePrice(priceText) {
    if (!priceText || !priceText.trim()) return null;

    const text = priceText.toLowerCase().trim();

    // Remove common currency symbols and words, but keep numbers and decimal points
    let cleanText = text.replace(/[pkr\s,]/g, '');

    // Handle lakh/lac notation (more flexible matching)
    if (cleanText.includes('lakh') || cleanText.includes('lac')) {
      const match = cleanText.match(/([\d.]+)\s*(?:lakh|lac)/);
      if (match) {
        const number = parseFloat(match[1]);
        if (!isNaN(number)) {
          return number * 100000; // Convert lakh to actual number
        }
      }
    }

    // Handle crore notation
    if (cleanText.includes('crore') || cleanText.includes('cr')) {
      const match = cleanText.match(/([\d.]+)\s*(?:crore|cr)/);
      if (match) {
        const number = parseFloat(match[1]);
        if (!isNaN(number)) {
          return number * 10000000; // Convert crore to actual number
        }
      }
    }

    // Handle thousand notation
    if (cleanText.includes('thousand') || cleanText.includes('k')) {
      const match = cleanText.match(/([\d.]+)\s*(?:thousand|k)/);
      if (match) {
        const number = parseFloat(match[1]);
        if (!isNaN(number)) {
          return number * 1000; // Convert thousand to actual number
        }
      }
    }

    // Handle million notation
    if (cleanText.includes('million') || cleanText.includes('m')) {
      const match = cleanText.match(/([\d.]+)\s*(?:million|m)/);
      if (match) {
        const number = parseFloat(match[1]);
        if (!isNaN(number)) {
          return number * 1000000; // Convert million to actual number
        }
      }
    }

    // Try to parse as regular number (remove any remaining non-numeric characters except decimal)
    const numericText = cleanText.replace(/[^\d.]/g, '');
    const number = parseFloat(numericText);
    return isNaN(number) ? null : number;
  }

  // Smart number parsing for rooms/baths
  function parseRoomsBaths(text) {
    console.log('parseRoomsBaths called with:', text);
    if (!text || !text.trim()) {
      console.log('parseRoomsBaths: empty text, returning null');
      return null;
    }

    const cleanText = text.toLowerCase().trim();
    console.log('parseRoomsBaths: cleanText =', cleanText);

    // Handle "+" notation (e.g., "2+", "3+")
    if (cleanText.includes('+')) {
      const number = parseInt(cleanText.replace('+', ''));
      const result = isNaN(number) ? null : number;
      console.log('parseRoomsBaths: + notation, returning:', result);
      return result;
    }

    // Handle range notation (e.g., "2-4", "1-3")
    if (cleanText.includes('-')) {
      const parts = cleanText.split('-');
      const minNum = parseInt(parts[0]);
      const result = isNaN(minNum) ? null : minNum;
      console.log('parseRoomsBaths: range notation, returning:', result);
      return result;
    }

    // Try to parse as regular number
    const number = parseInt(cleanText);
    const result = isNaN(number) ? null : number;
    console.log('parseRoomsBaths: regular number, returning:', result);
    return result;
  }

  // Get current filter values with smart parsing
  function getCurrentFilters() {
    const filters = {};

    // Parse minimum price
    if (minPriceFilter && minPriceFilter.value.trim()) {
      const minPrice = parsePrice(minPriceFilter.value.trim());
      if (minPrice !== null) {
        filters.minPrice = minPrice;
      }
    }

    // Parse maximum price
    if (maxPriceFilter && maxPriceFilter.value.trim()) {
      const maxPrice = parsePrice(maxPriceFilter.value.trim());
      if (maxPrice !== null) {
        filters.maxPrice = maxPrice;
      }
    }

    // City filter (exact text match)
    if (cityFilter && cityFilter.value.trim()) {
      filters.city = cityFilter.value.trim();
    }

    // Parse rooms
    if (roomsFilter && roomsFilter.value.trim()) {
      console.log('Rooms filter raw value:', roomsFilter.value.trim());
      const rooms = parseRoomsBaths(roomsFilter.value.trim());
      console.log('Parsed rooms value:', rooms);
      if (rooms !== null) {
        filters.bedrooms = rooms;
        console.log('Added bedrooms filter:', rooms);
      }
    }

    // Parse baths
    if (bathsFilter && bathsFilter.value.trim()) {
      console.log('Baths filter raw value:', bathsFilter.value.trim());
      const baths = parseRoomsBaths(bathsFilter.value.trim());
      console.log('Parsed baths value:', baths);
      if (baths !== null) {
        filters.bathrooms = baths;
        console.log('Added bathrooms filter:', baths);
      }
    }

    return filters;
  }

  // Enhanced search with filters - Fixed AND logic
  async function performSearchWithFilters() {
    const searchTerm = universalSearchInput ? universalSearchInput.value.trim() : '';
    const filters = getCurrentFilters();

    console.log('Performing search with filters (AND logic):', { searchTerm, filters });

    // Build query parameters with proper AND logic
    const queryParams = new URLSearchParams();

    // Add search term if present
    if (searchTerm && searchTerm.length > 0) {
      queryParams.append('universalSearch', searchTerm);
    }

    // Add filter parameters with proper MongoDB query format for AND logic
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        if (key === 'minPrice') {
          queryParams.append('price[gte]', filters[key]);
          console.log(`Added price filter: price >= ${filters[key]}`);
        } else if (key === 'maxPrice') {
          queryParams.append('price[lte]', filters[key]);
          console.log(`Added price filter: price <= ${filters[key]}`);
        } else if (key === 'city') {
          // City filter should search in location field - backend will handle partial matching
          queryParams.append('location', filters[key]);
          console.log(`Added location filter: location contains "${filters[key]}"`);
        } else if (key === 'bedrooms') {
          // Handle both string and number values - EXACT MATCH
          const bedroomValue = typeof filters[key] === 'number' ?
            filters[key] :
            parseInt(filters[key].toString().replace('+', ''));
          queryParams.append('bedrooms', bedroomValue);
          console.log(`Added bedroom filter: bedrooms === ${bedroomValue}`);
        } else if (key === 'bathrooms') {
          // Handle both string and number values - EXACT MATCH
          const bathroomValue = typeof filters[key] === 'number' ?
            filters[key] :
            parseInt(filters[key].toString().replace('+', ''));
          queryParams.append('bathrooms', bathroomValue);
          console.log(`Added bathroom filter: bathrooms === ${bathroomValue}`);
        } else {
          queryParams.append(key, filters[key]);
          console.log(`Added generic filter: ${key} = ${filters[key]}`);
        }
      }
    });

    const queryString = queryParams.toString();
    console.log('Query string:', queryString);

    // If no search term and no filters, load all properties
    if (!searchTerm && Object.keys(filters).length === 0) {
      console.log('No search term or filters, loading all properties');
      loadRealProperties();
      return;
    }

    try {
      // Show loading state
      if (propertyContainer) {
        propertyContainer.innerHTML = `
          <div class="loading-container" style="text-align: center; padding: 40px; grid-column: 1 / -1;">
            <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #6abf00; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p style="color: #666; font-size: 1.1em;">Searching with filters...</p>
          </div>
        `;
      }

      // Use existing API call
      if (window.propertyAPI) {
        const response = await window.propertyAPI.getAllProperties(queryString ? `?${queryString}` : '');

        let properties = [];
        if (response && response.success && response.data && Array.isArray(response.data)) {
          properties = response.data;
        } else if (response && response.data && Array.isArray(response.data)) {
          properties = response.data;
        } else if (response && Array.isArray(response)) {
          properties = response;
        }

        if (properties.length === 0) {
          const hasFilters = Object.keys(filters).length > 0;
          const filterText = hasFilters ? ' and filters' : '';
          propertyContainer.innerHTML = `
            <div class="no-results" style="text-align: center; padding: 40px; grid-column: 1 / -1;">
              <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
              <h3 style="color: #666; margin-bottom: 10px;">No Properties Found</h3>
              <p style="color: #888;">No properties match your search${searchTerm ? ` for "${searchTerm}"` : ''}${filterText}</p>
              <p style="color: #888;">Try different keywords, adjust your filters, or clear your search.</p>
            </div>
          `;
          return;
        }

        propertyContainer.innerHTML = '';
        renderProperties(properties);
        console.log(`Successfully rendered ${properties.length} filtered results`);
      } else {
        // Fallback to loading all properties
        loadRealProperties();
      }

    } catch (error) {
      console.error('Error in search with filters:', error);
      loadRealProperties();
    }
  }

  // Add filter change listeners for inline filters
  const filterElements = [minPriceFilter, maxPriceFilter, cityFilter, roomsFilter, bathsFilter];
  filterElements.forEach(element => {
    if (element) {
      console.log(`Adding event listeners to filter: ${element.id}`);

      // Listen for input events with debouncing for real-time search
      element.addEventListener('input', debounce(() => {
        console.log(`Filter ${element.id} input changed, performing search...`);
        const filters = getCurrentFilters();
        console.log('Parsed filters:', filters);
        performSearchWithFilters();
      }, 600)); // Moderate delay for text inputs

      // Listen for Enter key for immediate search
      element.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          console.log(`Enter pressed in filter ${element.id}, performing search...`);
          performSearchWithFilters();
        }
      });

      // Also listen for blur events for search when user leaves field
      element.addEventListener('blur', () => {
        console.log(`Filter ${element.id} blurred, performing search...`);
        performSearchWithFilters();
      });
    }
  });

  // Handle universal search with debouncing
  const debouncedUniversalSearch = debounce(performUniversalSearch, 300);

  if (universalSearchForm) {
    console.log('Universal search form found, adding event listener');
    universalSearchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Form submitted, performing search with filters...');
      performSearchWithFilters();
    });
  } else {
    console.error('Universal search form not found!');
  }

  // Real-time search as user types
  if (universalSearchInput) {
    console.log('Universal search input found, adding input listener');
    universalSearchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim();
      console.log('Input changed, search term:', searchTerm);

      // If search is cleared, reload all properties
      if (searchTerm.length === 0) {
        console.log('Search cleared, reloading all properties...');
        // Remove any search-related messages
        const searchMessages = document.querySelectorAll('.no-results, .error-container');
        searchMessages.forEach(el => el.remove());
        // Reload all properties from database
        loadRealProperties();
      } else if (searchTerm.length >= 2) {
        // Perform search for terms with 2+ characters
        performSearchWithFilters();
      }
    });
  } else {
    console.error('Universal search input not found!');
  }
  
  // Clear search button functionality (only clears search, keeps filters)
  if (clearUniversalSearchBtn) {
    console.log('Clear search button found, adding event listener');
    clearUniversalSearchBtn.addEventListener('click', () => {
      console.log('Clear search button clicked - clearing only search term');
      if (universalSearchInput) {
        // Clear only the search input
        universalSearchInput.value = '';

        // Add visual feedback
        clearUniversalSearchBtn.style.transform = 'scale(0.9)';
        setTimeout(() => {
          clearUniversalSearchBtn.style.transform = 'scale(1)';
        }, 150);

        // Perform search with current filters (but no search term)
        console.log('Performing search with filters only...');
        performSearchWithFilters();
      }
    });
  } else {
    console.error('Clear search button not found!');
  }

  // Reset Filters button functionality
  const resetFiltersButton = document.querySelector('.reset-filters-button');
  if (resetFiltersButton) {
    console.log('Reset filters button found, adding event listener');
    resetFiltersButton.addEventListener('click', () => {
      console.log('Reset filters button clicked');
      resetAllFilters();
    });
  } else {
    console.log('Reset filters button not found!');
  }

  // Initialize with all properties
  console.log('Initializing page - loading properties...');

  // The real properties are already loaded above, no need for additional loading

  // Test functions for debugging
  window.testSearch = function(term) {
    console.log('Testing search with term:', term);
    if (universalSearchInput) {
      universalSearchInput.value = term;
      performUniversalSearch(term);
    } else {
      console.error('Search input not found for test');
    }
  };

  window.testLoadProperties = function() {
    console.log('Testing property loading...');
    loadProperties();
  };

  window.testFallbackProperties = function() {
    console.log('Testing fallback properties...');
    loadFallbackProperties();
  };

  window.checkAPI = function() {
    console.log('PropertyAPI available:', !!window.propertyAPI);
    console.log('PropertyAPI object:', window.propertyAPI);
  };

  window.testRealProperties = function() {
    console.log('Testing real properties...');
    loadRealProperties();
  };

  window.testAPI = async function() {
    console.log('Testing API directly...');
    try {
      const response = await fetch('/api/properties');
      const data = await response.json();
      console.log('Direct API response:', data);
      return data;
    } catch (error) {
      console.error('Direct API test failed:', error);
    }
  };

  window.debugProperties = function() {
    console.log('=== PROPERTY DEBUG INFO ===');
    console.log('Property container:', document.getElementById('property-container'));
    console.log('Property boxes:', document.querySelectorAll('#property-container .box').length);
    console.log('PropertyAPI available:', !!window.propertyAPI);
    console.log('Current container content:', document.getElementById('property-container').innerHTML.substring(0, 200) + '...');
  };

  window.testClearSearch = function() {
    console.log('Testing clear search functionality...');
    const searchInput = document.getElementById('universal-search-input');
    const clearBtn = document.getElementById('clear-universal-search');

    if (searchInput && clearBtn) {
      // Simulate typing in search
      searchInput.value = 'test search';
      console.log('Added test search term');

      // Simulate clicking clear
      setTimeout(() => {
        clearBtn.click();
        console.log('Clicked clear button');
      }, 1000);
    } else {
      console.error('Search elements not found');
    }
  };

  window.testFilters = function() {
    console.log('Testing filter functionality...');

    // Test price parsing
    console.log('Price parsing tests:');
    console.log('2 lakh =', parsePrice('2 lakh'));
    console.log('PKR 250,000 =', parsePrice('PKR 250,000'));
    console.log('1.5 crore =', parsePrice('1.5 crore'));
    console.log('500000 =', parsePrice('500000'));
    console.log('2.5 million =', parsePrice('2.5 million'));

    // Test rooms/baths parsing
    console.log('Rooms/Baths parsing tests:');
    console.log('3+ =', parseRoomsBaths('3+'));
    console.log('2-4 =', parseRoomsBaths('2-4'));
    console.log('2 =', parseRoomsBaths('2'));

    // Test current filters
    const filters = getCurrentFilters();
    console.log('Current filters:', filters);

    // Test query building with AND logic
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        if (key === 'minPrice') {
          queryParams.append('price[gte]', filters[key]);
        } else if (key === 'maxPrice') {
          queryParams.append('price[lte]', filters[key]);
        } else if (key === 'city') {
          queryParams.append('location', filters[key]);
        } else if (key === 'bedrooms') {
          const bedroomValue = parseInt(filters[key].toString().replace('+', ''));
          queryParams.append('bedrooms[gte]', bedroomValue);
        } else if (key === 'bathrooms') {
          const bathroomValue = parseInt(filters[key].toString().replace('+', ''));
          queryParams.append('bathrooms[gte]', bathroomValue);
        } else {
          queryParams.append(key, filters[key]);
        }
      }
    });
    console.log('Generated query string (AND logic):', queryParams.toString());
  };

  // Test function for multiple filter combinations
  window.testFilterCombinations = function() {
    console.log('=== Testing Filter Combinations (AND Logic) ===');

    // Test 1: Price range + City
    console.log('\n--- Test 1: Price Range + City ---');
    if (minPriceFilter) minPriceFilter.value = '200000';
    if (maxPriceFilter) maxPriceFilter.value = '1000000';
    if (cityFilter) cityFilter.value = 'Lahore';
    if (roomsFilter) roomsFilter.value = '';
    if (bathsFilter) bathsFilter.value = '';

    setTimeout(() => {
      console.log('Test 1 filters:', getCurrentFilters());
      performSearchWithFilters();
    }, 500);

    // Test 2: City + Bedrooms
    setTimeout(() => {
      console.log('\n--- Test 2: City + Bedrooms ---');
      if (minPriceFilter) minPriceFilter.value = '';
      if (maxPriceFilter) maxPriceFilter.value = '';
      if (cityFilter) cityFilter.value = 'Karachi';
      if (roomsFilter) roomsFilter.value = '3';
      if (bathsFilter) bathsFilter.value = '';

      setTimeout(() => {
        console.log('Test 2 filters:', getCurrentFilters());
        performSearchWithFilters();
      }, 500);
    }, 3000);

    // Test 3: All filters combined
    setTimeout(() => {
      console.log('\n--- Test 3: All Filters Combined ---');
      if (minPriceFilter) minPriceFilter.value = '300000';
      if (maxPriceFilter) maxPriceFilter.value = '800000';
      if (cityFilter) cityFilter.value = 'Islamabad';
      if (roomsFilter) roomsFilter.value = '2';
      if (bathsFilter) bathsFilter.value = '2';

      setTimeout(() => {
        console.log('Test 3 filters:', getCurrentFilters());
        performSearchWithFilters();
      }, 500);
    }, 6000);
  };

  // Test case-insensitive search functionality
  window.testCaseInsensitiveSearch = function() {
    console.log('=== Testing Case-Insensitive Search ===');

    const testCases = [
      'LAHORE',      // All uppercase
      'lahore',      // All lowercase
      'Lahore',      // Title case
      'LaHoRe',      // Mixed case
      'KARACHI',     // Different city uppercase
      'karachi',     // Different city lowercase
      'HOUSE',       // Property type uppercase
      'house',       // Property type lowercase
      'Villa',       // Property type title case
    ];

    testCases.forEach((testTerm, index) => {
      setTimeout(() => {
        console.log(`\n--- Test ${index + 1}: Searching for "${testTerm}" ---`);
        if (universalSearchInput) {
          universalSearchInput.value = testTerm;
          performSearchWithFilters();
        }
      }, index * 2000); // 2 second delay between tests
    });

    // Clear search after all tests
    setTimeout(() => {
      console.log('\n--- Clearing search after tests ---');
      if (universalSearchInput) {
        universalSearchInput.value = '';
        loadRealProperties();
      }
    }, testCases.length * 2000 + 1000);
  };

  window.testFilterSearch = function() {
    console.log('Testing inline filter search...');

    // Set some test filter values
    if (minPriceFilter) {
      minPriceFilter.value = '2 lakh';
      console.log('Set min price to: 2 lakh');
    }
    if (maxPriceFilter) {
      maxPriceFilter.value = '10 lakh';
      console.log('Set max price to: 10 lakh');
    }
    if (cityFilter) {
      cityFilter.value = 'Lahore';
      console.log('Set city to: Lahore');
    }
    if (roomsFilter) {
      roomsFilter.value = '3+';
      console.log('Set rooms to: 3+');
    }
    if (bathsFilter) {
      bathsFilter.value = '2';
      console.log('Set baths to: 2');
    }

    console.log('Set test filter values in inline filters');

    // Perform search
    setTimeout(() => {
      performSearchWithFilters();
      console.log('Performed search with test inline filters');
    }, 1000);
  };

  window.testClearAll = function() {
    console.log('Testing clear all functionality...');

    // First set some values
    if (universalSearchInput) universalSearchInput.value = 'test search';
    if (minPriceFilter) minPriceFilter.value = '1 lakh';
    if (cityFilter) cityFilter.value = 'Karachi';

    console.log('Set test values');

    // Then clear all
    setTimeout(() => {
      if (clearAllBtn) {
        clearAllBtn.click();
        console.log('Clicked clear all button');
      }
    }, 1000);
  };

  window.testSimpleProperties = function() {
    console.log('Testing simple properties...');
    loadSimpleProperties();
  };

  window.testRealProperties = function() {
    console.log('Testing real properties...');
    loadRealProperties();
  };

  window.testAPI = async function() {
    console.log('Testing API directly...');
    try {
      const response = await fetch('/api/properties');
      const data = await response.json();
      console.log('Direct API response:', data);
      return data;
    } catch (error) {
      console.error('Direct API test failed:', error);
    }
  };
});



// Function to refresh properties (can be called from other pages)
function refreshProperties() {
  console.log('Refreshing property listings...');
  loadProperties();
}

// Make refreshProperties available globally
window.refreshProperties = refreshProperties;

// Listen for user data updates from admin panel
window.addEventListener('userDataUpdated', (event) => {
  console.log('User data updated, refreshing property listings...');
  refreshProperties();
});

// Listen for localStorage changes (cross-tab communication)
window.addEventListener('storage', (event) => {
  if (event.key === 'userUpdateTrigger' && event.newValue) {
    console.log('User data updated in another tab, refreshing property listings...');
    setTimeout(() => {
      refreshProperties();
    }, 1000); // Small delay to ensure data is saved
  }
});

// Mobile Filter Toggle Functionality
function initializeMobileFilterToggle() {
  const toggleBtn = document.getElementById('mobile-filter-toggle-btn');
  const inlineFilters = document.querySelector('.inline-filters');
  const clearAllGroup = document.querySelector('.clear-all-group');
  const filterHelp = document.querySelector('.filter-help-inline');
  const searchContainer = document.querySelector('.search-container');

  if (!toggleBtn) return; // Exit if toggle button doesn't exist

  toggleBtn.addEventListener('click', function() {
    const isActive = this.classList.contains('active');

    if (isActive) {
      // Hide filters
      this.classList.remove('active');
      if (inlineFilters) inlineFilters.classList.remove('show');
      if (clearAllGroup) clearAllGroup.classList.remove('show');
      if (filterHelp) filterHelp.classList.remove('show');
    } else {
      // Show filters
      this.classList.add('active');
      if (inlineFilters) inlineFilters.classList.add('show');
      if (clearAllGroup) clearAllGroup.classList.add('show');
      if (filterHelp) filterHelp.classList.add('show');

      // Ensure search bar stays visible by scrolling if needed
      setTimeout(() => {
        const searchInputGroup = document.querySelector('.search-input-group');
        if (searchInputGroup) {
          const rect = searchInputGroup.getBoundingClientRect();
          const navbarHeight = 80; // Navbar height

          // If search bar is hidden behind navbar, scroll to make it visible
          if (rect.top < navbarHeight) {
            window.scrollTo({
              top: window.scrollY - (navbarHeight - rect.top + 20),
              behavior: 'smooth'
            });
          }
        }
      }, 100); // Small delay to allow animation to start
    }
  });
}

// Input Validation Functions
function initializeInputValidation() {
  // Price input validation (allows numbers and decimal points)
  const priceInputs = document.querySelectorAll('.price-input');
  priceInputs.forEach(input => {
    // Real-time validation on input
    input.addEventListener('input', function(e) {
      validatePriceInput(e.target);
    });

    // Validation on paste
    input.addEventListener('paste', function(e) {
      setTimeout(() => validatePriceInput(e.target), 0);
    });

    // Prevent invalid key presses
    input.addEventListener('keypress', function(e) {
      if (!isPriceKeyValid(e.key, e.target.value)) {
        e.preventDefault();
      }
    });
  });

  // Number input validation (allows only whole numbers)
  const numberInputs = document.querySelectorAll('.number-input');
  numberInputs.forEach(input => {
    // Real-time validation on input
    input.addEventListener('input', function(e) {
      validateNumberInput(e.target);
    });

    // Validation on paste
    input.addEventListener('paste', function(e) {
      setTimeout(() => validateNumberInput(e.target), 0);
    });

    // Prevent invalid key presses
    input.addEventListener('keypress', function(e) {
      if (!isNumberKeyValid(e.key, e.target.value)) {
        e.preventDefault();
      }
    });
  });
}

// Price input validation function
function validatePriceInput(input) {
  let value = input.value;
  let originalValue = value;

  // Remove any characters that are not digits or decimal points
  let cleanValue = value.replace(/[^0-9.]/g, '');

  // Ensure only one decimal point
  const decimalCount = (cleanValue.match(/\./g) || []).length;
  if (decimalCount > 1) {
    const parts = cleanValue.split('.');
    cleanValue = parts[0] + '.' + parts.slice(1).join('');
  }

  // Limit decimal places to 2
  if (cleanValue.includes('.')) {
    const parts = cleanValue.split('.');
    if (parts[1] && parts[1].length > 2) {
      cleanValue = parts[0] + '.' + parts[1].substring(0, 2);
    }
  }

  // Remove leading zeros except for decimal numbers
  if (cleanValue.length > 1 && cleanValue[0] === '0' && cleanValue[1] !== '.') {
    cleanValue = cleanValue.replace(/^0+/, '') || '0';
  }

  // Update input value if it was changed
  if (originalValue !== cleanValue) {
    input.value = cleanValue;
  }

  // Add visual feedback
  updateInputValidationState(input, cleanValue);
}

// Number input validation function (whole numbers only)
function validateNumberInput(input) {
  let value = input.value;
  let originalValue = value;

  // Remove any characters that are not digits or the + symbol
  let cleanValue = value.replace(/[^0-9+]/g, '');

  // Ensure + symbol only appears at the end and only once
  if (cleanValue.includes('+')) {
    const parts = cleanValue.split('+');
    cleanValue = parts[0] + (parts.length > 1 ? '+' : '');
  }

  // Remove leading zeros
  if (cleanValue.length > 1 && cleanValue[0] === '0' && !cleanValue.includes('+')) {
    cleanValue = cleanValue.replace(/^0+/, '') || '0';
  }

  // Ensure + is only at the end
  if (cleanValue.includes('+') && !cleanValue.endsWith('+')) {
    cleanValue = cleanValue.replace(/\+/g, '') + '+';
  }

  // Update input value if it was changed
  if (originalValue !== cleanValue) {
    input.value = cleanValue;
  }

  // Add visual feedback
  updateInputValidationState(input, cleanValue);
}

// Check if key press is valid for price inputs
function isPriceKeyValid(key, currentValue) {
  // Allow control keys
  if (key === 'Backspace' || key === 'Delete' || key === 'Tab' ||
      key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
    return true;
  }

  // Allow digits
  if (/[0-9]/.test(key)) {
    return true;
  }

  // Allow decimal point only if there isn't one already
  if (key === '.' && !currentValue.includes('.')) {
    return true;
  }

  return false;
}

// Check if key press is valid for number inputs
function isNumberKeyValid(key, currentValue) {
  // Allow control keys
  if (key === 'Backspace' || key === 'Delete' || key === 'Tab' ||
      key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
    return true;
  }

  // Allow digits
  if (/[0-9]/.test(key)) {
    return true;
  }

  // Allow + symbol only if there isn't one already and it's not at the beginning
  if (key === '+' && !currentValue.includes('+') && currentValue.length > 0) {
    return true;
  }

  return false;
}

// Update input validation state with visual feedback
function updateInputValidationState(input, value) {
  // Remove existing validation classes
  input.classList.remove('valid', 'invalid');

  if (value.trim() === '') {
    // Empty input - neutral state
    return;
  }

  // Check if input is valid based on its type
  let isValid = false;

  if (input.classList.contains('price-input')) {
    // Price validation: must be a valid number
    isValid = /^\d+(\.\d{1,2})?$/.test(value) && parseFloat(value) > 0;
  } else if (input.classList.contains('number-input')) {
    // Number validation: must be a positive integer, optionally with +
    isValid = /^\d+\+?$/.test(value) && parseInt(value) > 0;
  } else {
    // Text input - always valid if not empty
    isValid = value.trim().length > 0;
  }

  // Apply appropriate class
  input.classList.add(isValid ? 'valid' : 'invalid');
}

// Additional validation for mobile devices
function setupMobileValidation() {
  // Prevent zoom on input focus for iOS
  const inputs = document.querySelectorAll('.inline-filter-input');
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      // Temporarily increase font size to prevent zoom
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        this.style.fontSize = '16px';
      }
    });

    input.addEventListener('blur', function() {
      // Reset font size
      this.style.fontSize = '';
    });
  });
}

// Initialize mobile search toggle
function initializeMobileSearchToggle() {
  const mobileToggle = document.getElementById('mobile-search-toggle');
  const universalSearchForm = document.querySelector('.universal-search-form');

  if (mobileToggle && universalSearchForm) {
    mobileToggle.addEventListener('click', function() {
      universalSearchForm.classList.toggle('mobile-active');
      this.classList.toggle('active');

      // Update aria-expanded for accessibility
      const isExpanded = universalSearchForm.classList.contains('mobile-active');
      this.setAttribute('aria-expanded', isExpanded);

      // Smooth scroll to search form if opened
      if (isExpanded) {
        setTimeout(() => {
          universalSearchForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    });
  }
}



// Initialize mobile-specific validation
document.addEventListener('DOMContentLoaded', function() {
  setupMobileValidation();
  initializeMobileSearchToggle();
});
