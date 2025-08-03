document.addEventListener('DOMContentLoaded', async () => {
  const propertyContainer = document.getElementById('property-container');
  const filterForm = document.getElementById('filter-form');
  
  // Fetch and display properties
  async function loadProperties(queryParams = '') {
    try {
      const response = await propertyAPI.getAllProperties(queryParams);
      
      if (propertyContainer) {
        if (response.data.length === 0) {
          propertyContainer.innerHTML = '<p>No properties found matching your criteria.</p>';
          return;
        }
        
        const propertiesHTML = response.data.map(property => `
          <div class="property-card">
            <div class="property-image">
              <img src="${property.images[0] || 'images/house-placeholder.jpg'}" alt="${property.title}">
            </div>
            <div class="property-details">
              <h3>${property.title}</h3>
              <p class="property-location">${property.location}</p>
              <p class="property-price">$${property.price}</p>
              <div class="property-info">
                <span>${property.bedrooms} Beds</span>
                <span>${property.bathrooms} Baths</span>
                <span>${property.size} sqft</span>
              </div>
              <a href="detail.html?id=${property._id}" class="btn btn-primary">View Details</a>
            </div>
          </div>
        `).join('');
        
        propertyContainer.innerHTML = propertiesHTML;
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      if (propertyContainer) {
        propertyContainer.innerHTML = '<p>Error loading properties. Please try again later.</p>';
      }
    }
  }
  
  // Handle filtering
  if (filterForm) {
    filterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(filterForm);
      const filters = {
        location: formData.get('location'),
        propertyType: formData.get('property-type'),
        minPrice: formData.get('min-price'),
        maxPrice: formData.get('max-price'),
        minBeds: formData.get('min-beds'),
        minBaths: formData.get('min-baths'),
      };
      
      // Build query string
      let queryString = '?';
      
      if (filters.location) queryString += `location=${filters.location}&`;
      if (filters.propertyType) queryString += `propertyType=${filters.propertyType}&`;
      if (filters.minPrice) queryString += `price[gte]=${filters.minPrice}&`;
      if (filters.maxPrice) queryString += `price[lte]=${filters.maxPrice}&`;
      if (filters.minBeds) queryString += `bedrooms[gte]=${filters.minBeds}&`;
      if (filters.minBaths) queryString += `bathrooms[gte]=${filters.minBaths}&`;
      
      loadProperties(queryString);
    });
    
    // Reset filters
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        filterForm.reset();
        loadProperties();
      });
    }
  }
  
  // Initialize
  loadProperties();
}); 