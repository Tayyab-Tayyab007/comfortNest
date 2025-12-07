/**
 * Force logout user and clear all session data
 */
function forceLogout(reason = 'Your session has expired') {
  console.log('Force logout triggered:', reason);

  // Clear all user-related data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('properties');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  localStorage.removeItem('adminUsers');

  // Show alert to user
  alert(reason + '. You will be redirected to the login page.');

  // Redirect to login
  window.location.href = '/login.html';
}

/**
 * Check if user account still exists and is valid
 */
async function validateUserSession() {
  const token = localStorage.getItem('token');
  if (!token) {
    forceLogout('No authentication token found');
    return false;
  }

  try {
    const response = await fetch('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        forceLogout('Your account has been deleted or is no longer valid');
        return false;
      }
      throw new Error(`Session validation failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.user) {
      forceLogout('Your account is no longer valid');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    if (error.message.includes('401') || error.message.includes('404')) {
      forceLogout('Your account has been deleted or is no longer valid');
      return false;
    }
    // For network errors, don't force logout immediately
    return true;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Mobile-specific optimizations
  if (window.innerWidth <= 768) {
    // Add mobile class to body for CSS targeting
    document.body.classList.add('mobile-device');

    // Optimize viewport for mobile
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }

  // Redirect if not logged in
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  let user = null;
  try {
    // Always fetch the latest user profile from the API
    const response = await fetch('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Check if it's a 401 (unauthorized) or 404 (user not found) - likely deleted user
      if (response.status === 401 || response.status === 404) {
        console.log('User account appears to be deleted or unauthorized. Forcing logout...');
        // Clear all user data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('properties');
        alert('Your account has been deleted or is no longer valid. You will be redirected to the login page.');
        window.location.href = '/login.html';
        return;
      }
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.user) {
      user = data.user;
      localStorage.setItem('user', JSON.stringify(user)); // Update localStorage with fresh data
    } else {
      // If API returns success=false, user might be deleted
      console.log('User profile API returned success=false. User may be deleted.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('properties');
      alert('Your account is no longer valid. You will be redirected to the login page.');
      window.location.href = '/login.html';
      return;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);

    // Check if error indicates deleted user
    if (error.message.includes('401') || error.message.includes('404')) {
      console.log('User account deleted or unauthorized. Forcing logout...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('properties');
      alert('Your account has been deleted or is no longer valid. You will be redirected to the login page.');
      window.location.href = '/login.html';
      return;
    }

    // For other errors (network issues), try localStorage fallback
    const userString = localStorage.getItem('user');
    if (userString) {
      user = JSON.parse(userString);
      console.warn('Using cached user data due to network error. This may be outdated.');
      // Show warning to user about potential data issues
      showAlert('warning', 'Unable to verify account status. Some features may not work properly.');
    } else {
      // If no user in localStorage and API fails, redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login.html';
      return;
    }
  }

  // If user is still null, something went wrong, redirect to login
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  // Redirect if user is not a 'seller'
  if (user.role !== 'seller') {
    alert('Access denied. Only sellers can access the dashboard.');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
    return;
  }

  console.log('✅ Dashboard initialization starting for seller:', user.name);
  console.log('✅ User role verified:', user.role);

  const propertyListContainer = document.getElementById('property-list');
  const propertyCountElement = document.getElementById('property-count');
  const logoutBtn = document.getElementById('logout-btn');
  const propertySearchInput = document.getElementById('property-search');

  // Display user info
  const userNameDetail = document.getElementById('user-name-detail');
  const userEmail = document.getElementById('user-email');
  const userPhone = document.getElementById('user-phone');
  const userDisplayId = document.getElementById('user-display-id');
  
  if (userNameDetail && userEmail && userPhone && userDisplayId) {
    userNameDetail.textContent = user.name;
    userEmail.textContent = user.email;
    userPhone.textContent = user.phone || 'Not provided';
    userDisplayId.textContent = user.displayId || 'N/A'; // Display 5-digit User ID
  }
  
  // Check if user has a phone number and show/hide verification message
  checkPhoneVerification(user);

  const copyEmailBtn = document.getElementById('copy-email-btn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      const email = 'comfortnestproject@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        showAlert('success', 'Email address copied to clipboard!');
      }, () => {
        showAlert('danger', 'Failed to copy email address.');
      });
    });
  }

  // Logout button event listener
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      performLogout();
    });
  }

  // Add global logout function
  window.performLogout = performLogout;

  // Event listener for property search input
  if (propertySearchInput) {
    propertySearchInput.addEventListener('input', () => {
      const searchTerm = propertySearchInput.value.toLowerCase();
      filterProperties(searchTerm);
    });
  }
  
  // Load user properties and update dashboard stats
  loadUserProperties();
  
  // Set up periodic refresh of user data to check for phone number updates
  setInterval(async () => {
    await refreshUserData();
  }, 30000); // Check every 30 seconds

  // Also refresh immediately on page focus (when user comes back to tab)
  window.addEventListener('focus', () => {
    refreshUserData();
  });

  // Check for force logout signals
  checkForceLogout();

  // Listen for force logout events
  window.addEventListener('forceUserLogout', (event) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser._id === event.detail.userId || currentUser.email === event.detail.userId) {
      handleForceLogout(event.detail.message);
    }
  });

  // Check for force logout signals periodically
  setInterval(checkForceLogout, 5000);
});

// Function to refresh user data from server
async function refreshUserData() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user) {
        const updatedUser = data.user;
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

        // Check if phone number has changed
        if (currentUser.phone !== updatedUser.phone) {
          console.log('Phone number updated:', currentUser.phone, '->', updatedUser.phone);
        }

        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Update phone display
        const userPhoneElement = document.getElementById('user-phone');
        if (userPhoneElement) {
          userPhoneElement.textContent = updatedUser.phone || 'Not provided';
        }

        // Update user name if changed
        const userNameElement = document.getElementById('user-name-detail');
        if (userNameElement) {
          userNameElement.textContent = updatedUser.name;
        }

        // Update email if changed
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) {
          userEmailElement.textContent = updatedUser.email;
        }

        // Check phone verification status
        checkPhoneVerification(updatedUser);

        return updatedUser;
      }
    }
  } catch (error) {
    console.log('User data refresh failed:', error);
  }
  return null;
}

// Make refreshUserData available globally
window.refreshUserData = refreshUserData;

// Listen for user data updates from admin panel
window.addEventListener('userDataUpdated', (event) => {
  console.log('User data updated event received:', event.detail);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // If the updated user is the current user, refresh data
  if (currentUser.email === event.detail.userData.email || currentUser._id === event.detail.userData._id) {
    console.log('Current user data updated, refreshing dashboard...');
    refreshUserData();
  }
});

// Listen for localStorage changes (cross-tab communication)
window.addEventListener('storage', (event) => {
  if (event.key === 'userUpdateTrigger' && event.newValue) {
    const updateData = JSON.parse(event.newValue);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // If the updated user is the current user, refresh data
    if (currentUser.email === updateData.userData.email || currentUser._id === updateData.userData._id) {
      console.log('User data updated in another tab, refreshing dashboard...');
      setTimeout(() => {
        refreshUserData();
      }, 1000); // Small delay to ensure data is saved
    }
  }
});

/**
 * Check for force logout signals from admin
 */
function checkForceLogout() {
  const forceLogoutTrigger = localStorage.getItem('forceLogoutTrigger');
  if (forceLogoutTrigger) {
    try {
      const trigger = JSON.parse(forceLogoutTrigger);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      // Check if this logout is for the current user
      if (currentUser._id === trigger.userId || currentUser.email === trigger.userId) {
        handleForceLogout(trigger.message);
      }
    } catch (error) {
      console.error('Error parsing force logout trigger:', error);
    }
  }
}

/**
 * Handle force logout by clearing session and redirecting
 */
function handleForceLogout(message) {
  console.log('Force logout detected, clearing session...');

  // Clear all user data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('properties');
  localStorage.removeItem('forceLogoutTrigger');

  // Show message and redirect
  alert(message || 'Your session has been terminated by an administrator.');
  window.location.href = '/login.html';
}

/**
 * Perform logout - clear all data and redirect
 */
function performLogout() {
  console.log('User initiated logout...');

  try {
    // Clear all user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('properties');
    localStorage.removeItem('forceLogoutTrigger');
    localStorage.removeItem('userUpdateTrigger');

    // Clear any other cached data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('user') || key.startsWith('property') || key.startsWith('admin'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('All user data cleared, redirecting to login...');
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Error during logout:', error);
    // Force redirect even if there's an error
    window.location.href = '/login.html';
  }
}

// Function to load and display properties
async function loadUserProperties() {
  const propertyListContainer = document.getElementById('property-list');
  const propertyCountElement = document.getElementById('property-count');

  try {
    // Show loading state
    propertyListContainer.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading your properties...</p>
      </div>
    `;
    
    // Get current user ID
    const currentUser = JSON.parse(localStorage.getItem('user'));
    // No longer need userId directly, using currentUser.email for filters if needed
    
    console.log('Current user:', currentUser);
    
    if (!currentUser || !currentUser.email) { // Check for email presence as identifier
      console.warn('User email not found, using fallback');
      propertyListContainer.innerHTML = `
        <div class="col-12 text-center py-4 text-danger">
          <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
          <h5>Error loading properties</h5>
          <p>User email not found. Please log in again.</p>
        </div>
      `;
      if (propertyCountElement) propertyCountElement.textContent = 'Error';
      return;
    }
    
    let properties = [];
    const token = localStorage.getItem('token'); // Ensure token is available here

    // Always attempt to load properties from API first
    try {
      console.log('Attempting to load properties from API...');
      const response = await fetch('/api/users/properties', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        // Check if it's a 401 (unauthorized) or 404 (user not found) - likely deleted user
        if (response.status === 401 || response.status === 404) {
          console.log('User account appears to be deleted during properties fetch. Forcing logout...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('properties');
          alert('Your account has been deleted or is no longer valid. You will be redirected to the login page.');
          window.location.href = '/login.html';
          return;
        }
        throw new Error(`Failed to fetch properties from API: ${response.status}`);
      }
      
      const data = await response.json();
      properties = data.data || [];
      
      // Save to localStorage for future use (cache)
      localStorage.setItem('properties', JSON.stringify(properties));
      console.log('Properties loaded from API and cached.', properties);
    } catch (apiError) {
      console.error('API error fetching properties:', apiError);
      // Fallback to localStorage if API fails
      console.log('Falling back to localStorage for properties...');
      const storedProperties = localStorage.getItem('properties');
      if (storedProperties) {
        try {
          const allProperties = JSON.parse(storedProperties);
          // Filter properties to only show those belonging to the current user (using owner._id or owner.email)
          properties = allProperties.filter(property => 
            (property.owner && (property.owner._id === currentUser._id || property.owner.email === currentUser.email))
          );
          console.log('Filtered properties from localStorage:', properties);
          alert('Could not fetch latest properties. Displaying cached data.');
        } catch (e) {
          console.error('Error parsing stored properties from localStorage fallback:', e);
          properties = [];
        }
      }
      
      // Only show a 'danger' alert if no properties could be loaded at all (neither from API nor cache)
      if (!properties || properties.length === 0) {
        alert('Failed to load latest properties. No cached data available.');
      }
    }
    
    // Update property count
    if (propertyCountElement) {
      propertyCountElement.textContent = properties.length;
    }

    displayProperties(properties); // Call a new function to display properties

  } catch (error) {
    console.error('Error loading user properties:', error);
    propertyListContainer.innerHTML = `
      <div class="col-12 text-center py-4 text-danger">
        <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
        <h5>Error loading properties</h5>
        <p>Could not load your properties. Please try again later.</p>
      </div>
    `;
    if (propertyCountElement) propertyCountElement.textContent = 'Error';
  }
}

function displayProperties(properties) {
    const propertyListContainer = document.getElementById('property-list');
    propertyListContainer.innerHTML = ''; // Clear previous content

    if (!properties || properties.length === 0) {
        propertyListContainer.innerHTML = `
            <div class="col-12 text-center py-4">
                <div class="empty-state">
                    <i class="fas fa-home fa-3x text-success mb-3"></i>
                    <h5>No properties listed yet</h5>
                    <p class="text-muted">You haven't added any properties. Click the "Add Property" button to get started!</p>
                    <a href="/add-property.html" class="btn btn-success mt-3">
                        <i class="fas fa-plus me-2"></i>Add Your First Property
                    </a>
                </div>
            </div>
        `;
        return;
    }

    properties.forEach(property => {
        const propertyCard = document.createElement('div');
        propertyCard.className = 'col-12 col-sm-6 col-md-6 col-lg-4 mb-4';
        propertyCard.innerHTML = `
            <div class="property-item" style="cursor: pointer;">
                <img src="${property.images && property.images[0] ? (property.images[0].startsWith('/uploads/') ? property.images[0] : `/uploads/property-images/${property.images[0]}`) : '/images/pic1.jpg'}" class="card-img-top" alt="${property.title}">
                <div class="card-body">
                    <h5 class="card-title">${property.title}</h5>
                    <p class="card-text"><i class="fas fa-map-marker-alt me-1"></i>${property.location}</p>
                    <p class="card-text">
                        <i class="fas fa-bed me-1"></i>${property.bedrooms} Beds 
                        <i class="fas fa-bath ms-3 me-1"></i>${property.bathrooms} Baths
                    </p>
                    <div class="owner-info mt-2">
                        <small class="text-muted">Owner: ${property.owner ? property.owner.name : 'N/A'} (User ID: ${property.owner ? property.owner.displayId || 'N/A' : 'N/A'})</small>
                    </div>
                    <div class="property-price">PKR ${property.price.toLocaleString()}</div>
                    <div class="property-actions">
                        <a href="/edit-property.html?id=${property._id}" class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i> Edit</a>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteProperty('${property._id}')"><i class="fas fa-trash-alt"></i> Delete</button>
                    </div>
                </div>
            </div>
        `;
        
        propertyCard.querySelector('.property-item').addEventListener('click', (e) => {
            if (e.target.closest('.property-actions')) {
                return;
            }
            window.location.href = `/detail.html?id=${property._id}`;
        });

        propertyListContainer.appendChild(propertyCard);
    });
}

// Function to filter properties based on search term (case-insensitive)
function filterProperties(searchTerm) {
  const propertyListContainer = document.getElementById('property-list');
  const allPropertyCards = Array.from(propertyListContainer.children); // Get all current property cards

  // Convert search term to lowercase for case-insensitive matching
  const searchLower = searchTerm.toLowerCase().trim();

  allPropertyCards.forEach(card => {
    const title = card.querySelector('.card-title').textContent.toLowerCase();
    const location = card.querySelector('.card-text i.fa-map-marker-alt').nextSibling.textContent.toLowerCase();

    // Case-insensitive search matching
    if (title.includes(searchLower) || location.includes(searchLower)) {
      card.style.display = 'block'; // Show the card
    } else {
      card.style.display = 'none'; // Hide the card
    }
  });

  // Check if all properties are hidden and display empty state if so
  const visibleCards = allPropertyCards.filter(card => card.style.display !== 'none');
  if (visibleCards.length === 0 && searchTerm !== '') {
    propertyListContainer.innerHTML = `
      <div class="col-12 text-center py-4">
        <div class="empty-state">
          <i class="fas fa-search fa-3x text-muted mb-3"></i>
          <h5>No matching properties found</h5>
          <p class="text-muted">Try a different search term or add new properties.</p>
        </div>
      </div>
    `;
  } else if (visibleCards.length === 0 && searchTerm === '') {
    // This case should be handled by displayProperties if initial load is empty
    // but as a fallback, ensure the 'no properties yet' message is shown if all disappear
     propertyListContainer.innerHTML = `
            <div class="col-12 text-center py-4">
                <div class="empty-state">
                    <i class="fas fa-home fa-3x text-success mb-3"></i>
                    <h5>No properties listed yet</h5>
                    <p class="text-muted">You haven't added any properties. Click the "Add Property" button to get started!</p>
                    <a href="/add-property.html" class="btn btn-success mt-3">
                        <i class="fas fa-plus me-2"></i>Add Your First Property
                    </a>
                </div>
            </div>
        `;
  }
}

// Function to handle property deletion
async function deleteProperty(propertyId) {
  console.log('Attempting to delete property with ID:', propertyId);
  if (!confirm('Are you sure you want to delete this property?')) {
    console.log('Property deletion cancelled by user.');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    console.log('Sending DELETE request to:', `/api/properties/${propertyId}`);
    const response = await fetch(`/api/properties/${propertyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to delete property. Server response:', errorData);
      throw new Error(errorData.message || 'Failed to delete property on server.');
    }

    const result = await response.json();
    if (result.success) {
      console.log('Property deleted successfully. Server response:', result);
      showAlert('success', 'Property deleted successfully!');
      localStorage.removeItem('properties'); // Invalidate cached properties
      loadUserProperties(); // Reload properties
    } else {
      console.error('Server reported an issue with deletion:', result);
      alert(result.message || 'Failed to delete property.');
    }
  } catch (error) {
    console.error('Error during property deletion:', error);
    alert('Error deleting property: ' + error.message);
  }
}

// Utility function for showing alerts
function showAlert(type, message) {
  let alertContainer = document.getElementById('alert-container');
  if (!alertContainer) {
    const body = document.querySelector('body');
    if (body) {
      body.insertAdjacentHTML('afterbegin', '<div id="alert-container" style="position: fixed; top: 70px; left: 50%; transform: translateX(-50%); z-index: 1100; width: 80%; max-width: 500px;"></div>');
      alertContainer = document.getElementById('alert-container');
    }
  }

  // Clear any existing alerts in the container
  if (alertContainer) {
    alertContainer.innerHTML = '';
  }

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
  alertDiv.setAttribute('role', 'alert');
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  alertContainer.prepend(alertDiv);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    bootstrap.Alert.getInstance(alertDiv)?.close();
  }, 5000);
}

// Function to check if user has a phone number and show/hide verification message
function checkPhoneVerification(user) {
  const phoneVerificationMessage = document.getElementById('phone-verification-message');
  
  if (!phoneVerificationMessage) {
    console.warn('Phone verification message element not found');
    return;
  }
  
  // Check if user has a phone number (not empty, null, undefined, or 'Not provided')
  const hasPhone = user.phone && 
                   user.phone.trim() !== '' && 
                   user.phone.trim().toLowerCase() !== 'not provided' &&
                   user.phone.trim().toLowerCase() !== 'n/a';
  
  if (!hasPhone) {
    // Show the message if user doesn't have a phone number
    phoneVerificationMessage.style.display = 'block';
    
    // Update the email link with the user's actual email
    const emailLink = phoneVerificationMessage.querySelector('a[href^="mailto:"]');
    if (emailLink && user.email) {
      const subject = 'Phone Number Request';
      const body = `Hello,\n\nPlease add my phone number to my account.\n\nAccount Email: ${user.email}\nPhone Number: [Your Phone Number]\n\nThank you.`;
      emailLink.href = `mailto:comfortnestproject@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  } else {
    // Hide the message if user has a phone number
    phoneVerificationMessage.style.display = 'none';
  }

  // Mobile-specific enhancements
  if (window.innerWidth <= 768) {
    // Add mobile search enhancements
    const searchInput = document.getElementById('property-search');
    if (searchInput) {
      // Add mobile-friendly search behavior
      searchInput.addEventListener('focus', () => {
        // Scroll to search input on focus for better UX
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      // Add search on enter key for mobile
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const searchTerm = searchInput.value.toLowerCase().trim();
          filterProperties(searchTerm);
        }
      });
    }

    // Optimize images for mobile
    setTimeout(() => {
      const propertyImages = document.querySelectorAll('.property-item img');
      propertyImages.forEach(img => {
        img.loading = 'lazy'; // Enable lazy loading
        img.style.willChange = 'transform'; // Optimize for animations
      });
    }, 1000);

    // Add mobile-specific event listeners
    window.addEventListener('orientationchange', () => {
      // Refresh layout on orientation change
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    });

    // Optimize scroll performance on mobile
    let ticking = false;
    function updateScrollPosition() {
      // Add any scroll-based optimizations here
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    });
  }
}
