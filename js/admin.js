// Admin Dashboard JavaScript
let allAdminProperties = []; // To store all properties for filtering

document.addEventListener('DOMContentLoaded', async () => {
  // Set up navigation and logout
  setupNavigation();
  setupLogout();

  // Initialize Bootstrap components (modals, etc.)
  initializeBootstrapComponents();

  // Check admin authentication first
  checkAdminAuth();



  // Load initial data for dashboard (will be called by checkAdminAuth if authenticated)
  // loadDashboardData();

  // Add event listener for user search
  const userSearchInput = document.getElementById('user-search-input');
  if (userSearchInput) {
    userSearchInput.addEventListener('input', (event) => {
      const searchTerm = event.target.value.toLowerCase();
      filterUsers(searchTerm);
    });
  }

  // Add event listener for property search
  const propertySearchInput = document.getElementById('property-search-input');
  if (propertySearchInput) {
    propertySearchInput.addEventListener('input', (event) => {
      const searchTerm = event.target.value.toLowerCase();
      filterAdminProperties(searchTerm);
    });
  }

  // Add event listener for clear property search button
  const clearPropertySearchBtn = document.getElementById('clear-property-search');
  if (clearPropertySearchBtn) {
    clearPropertySearchBtn.addEventListener('click', () => {
      const propertySearchInput = document.getElementById('property-search-input');
      if (propertySearchInput) {
        propertySearchInput.value = '';
        filterAdminProperties(''); // Show all properties
      }
    });
  }

  // Add User button removed - no longer needed

  // Add Property button removed - no longer needed

  // Save User button handler
  const saveUserBtn = document.getElementById('save-user-btn');
  if (saveUserBtn) {
    saveUserBtn.addEventListener('click', saveUser);
  }





  // Save Property button handler removed - no longer needed

  // Universal confirm delete button handler
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      const itemId = document.getElementById('delete-item-id').value;
      const itemType = document.getElementById('delete-item-type').value;
      if (itemType === 'user') {
        deleteUser(itemId);
      } else if (itemType === 'property') {
        deleteProperty(itemId);
      }
      const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
      deleteModal.hide();
    });
  }

  // Property images preview removed - no longer needed
  
  // Add refresh users button event listener
  const refreshUsersBtn = document.getElementById('refresh-users-btn');
  if (refreshUsersBtn) {
    refreshUsersBtn.addEventListener('click', async () => {
      refreshUsersBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
      refreshUsersBtn.disabled = true;
      
      try {
        await loadUsers();
        await loadDashboardData(); // Also refresh dashboard stats
        showAlert('success', 'Users data refreshed successfully!');
      } catch (error) {
        console.error('Error refreshing users:', error);
        showAlert('danger', 'Failed to refresh users data.');
      } finally {
        refreshUsersBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshUsersBtn.disabled = false;
      }
    });
  }
});

// Helper functions (defined globally to ensure scope)
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

// Add new property functions (moved here to ensure scope is available before event listeners)

/**
 * Save property (add only)
 */
async function saveProperty() {
  // Show loading state
  const saveBtn = document.getElementById('save-property-btn');
  const originalBtnText = saveBtn.textContent;
  saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
  saveBtn.disabled = true;
  
  // Get form data
  const title = document.getElementById('property-title').value;
  const price = document.getElementById('property-price').value;
  const description = document.getElementById('property-description').value;
  const location = document.getElementById('property-location').value;
  const propertyType = document.getElementById('property-type').value;
  const bedrooms = document.getElementById('property-bedrooms').value;
  const bathrooms = document.getElementById('property-bathrooms').value;
  const size = document.getElementById('property-size').value;
  const ownerId = document.getElementById('property-owner').value;
  const imagesInput = document.getElementById('property-images');

  // Basic validation for new property
  if (!title || !price || !description || !location || !propertyType || !bedrooms || !bathrooms || !size || !ownerId) {
    showAlert('danger', 'Please fill in all required fields for property creation.');
    saveBtn.textContent = originalBtnText;
    saveBtn.disabled = false;
    return;
  }
  
  // Create property object
  const propertyData = {
    title,
    price: parseFloat(price),
    description,
    location,
    propertyType,
    bedrooms: parseInt(bedrooms),
    bathrooms: parseInt(bathrooms),
    size: parseFloat(size),
    owner: ownerId
  };

  try {
    const data = await window.propertyAPI.createProperty(propertyData);
    const newPropertyId = data.data?._id || data._id; // Get ID of newly created property
    
    // Upload images if selected
    if (imagesInput.files && imagesInput.files.length > 0 && newPropertyId) {
      await uploadPropertyImages(newPropertyId, imagesInput.files);
    } else {
      // Hide modal
      const propertyModal = bootstrap.Modal.getInstance(document.getElementById('propertyModal'));
      propertyModal.hide();
      
      // Show success message
      showAlert('success', 'Property added successfully!');
      
      // Reload properties
      loadProperties();
    }
  } catch (error) {
    console.error('Error adding property:', error);
    showAlert('danger', 'Error adding property: ' + error.message);
  } finally {
    saveBtn.textContent = originalBtnText;
    saveBtn.disabled = false;
  }
}

/**
 * Upload property images for a new property
 */
async function uploadPropertyImages(propertyId, files) {
  if (!files || files.length === 0) {
    return;
  }
  
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }
  
  try {
    await window.propertyAPI.uploadImages(propertyId, formData);
    // Hide modal
    const propertyModal = bootstrap.Modal.getInstance(document.getElementById('propertyModal'));
    propertyModal.hide();
    
    showAlert('success', 'Property and images added successfully!');
    loadProperties();
  } catch (error) {
    console.error('Error uploading images:', error);
    showAlert('warning', 'Property added, but images could not be uploaded: ' + error.message);
  }
}

/**
 * Fallback to save property to localStorage (add only)
 */
function fallbackSaveProperty(propertyData) {
  let properties = JSON.parse(localStorage.getItem('properties')) || [];
  
  // Generate a temporary ID for local storage
  const newProperty = {
    ...propertyData,
    _id: 'local_' + Date.now(),
    id: 'local_' + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    images: [] // No local image storage for simplicity
  };
  properties.push(newProperty);
  
  localStorage.setItem('properties', JSON.stringify(properties));
  showAlert('info', 'Property added locally (API unavailable or error).');
  loadProperties();
}

// ====== Authentication Functions ======

/**
 * Check if the current user is authenticated as an admin
 */
function checkAdminAuth() {
  console.log('Checking admin authentication...');
  
  // Get user from admin-specific localStorage
  const userString = localStorage.getItem('adminUser');
  const token = localStorage.getItem('adminToken');
  
  console.log('Retrieved from localStorage:', {
    userString,
    token: token ? 'exists' : 'not found'
  });
  
  let user = {};
  try {
    user = userString ? JSON.parse(userString) : {};
  } catch (error) {
    console.error('Error parsing adminUser from localStorage:', error);
    localStorage.removeItem('adminUser'); // Clear corrupted data
    localStorage.removeItem('adminToken');
  }
  
  console.log('Parsed user:', user);
  
  // Check if user is logged in and is an admin
  const isAdmin = user.role === 'admin' || user.email === 'comfortnestproject@gmail.com';
  
  console.log('Admin check result:', {
    hasToken: !!token,
    isAdmin,
    userRole: user.role,
    userEmail: user.email
  });
  
  if (!token || !isAdmin) {
    console.log('Not authenticated as admin, showing login form');
    showAdminLoginForm();
  } else {
    console.log('Admin authenticated, initializing dashboard');
    initializeDashboard(user);
  }
}

/**
 * Show admin login form
 */
function showAdminLoginForm() {
  console.log('Showing admin login form');
  
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.add('d-none');
  });
  
  // Create login form if it doesn't exist
  if (!document.getElementById('admin-login-section')) {
    const mainContent = document.querySelector('.main-content');
    
    if (!mainContent) {
      console.error('Main content element not found');
      return;
    }
    
    const loginSection = document.createElement('section');
    loginSection.id = 'admin-login-section';
    loginSection.className = 'content-section';
    
    loginSection.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-lg-6">
          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">Admin Login</h6>
            </div>
            <div class="card-body">
              <div id="login-alert-container"></div>
              <form id="admin-login-form">
                <div class="mb-3">
                  <label for="admin-email" class="form-label">Email</label>
                  <input type="email" class="form-control" id="admin-email" required value="comfortnestproject@gmail.com">
                </div>
                <div class="mb-3">
                  <label for="admin-password" class="form-label">Password</label>
                  <input type="password" class="form-control" id="admin-password" required>
                </div>
                <button type="submit" class="btn btn-primary w-100">Login</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    
    mainContent.appendChild(loginSection);
    
    // Add event listener to login form
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleAdminLogin);
    }
  } else {
    // Show login section if it already exists
    document.getElementById('admin-login-section').classList.remove('d-none');
  }
  
  // Update section title
  const sectionTitle = document.getElementById('section-title');
  if (sectionTitle) {
    sectionTitle.textContent = 'Admin Login';
  }
}

/**
 * Handle admin login form submission
 */
function handleAdminLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  
  // Always try to login with API, remove hardcoded check
    loginWithAPI(email, password);
}

/**
 * Try to login with API
 */
async function loginWithAPI(email, password) {
  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Check if user is admin
      if (data.user.role === 'admin') {
        // Store user in admin-specific localStorage
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        localStorage.setItem('adminToken', data.token);
        
        // Initialize dashboard
        initializeDashboard(data.user);
        
        // Show success message
        showAlert('success', 'Login successful! Welcome to the admin dashboard.');
      } else {
        showLoginAlert('danger', 'You do not have admin privileges.');
      }
    } else {
      showLoginAlert('danger', data.message || 'Invalid credentials. Please try again.');
    }
  } catch (error) {
    console.error('Login error:', error);
    
    // Try to login with the regular login API to get a real token
    try {
      console.log('Attempting fallback login with regular API...');
      const loginResponse = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('Fallback login successful:', loginData);

        if (loginData.success && loginData.user && loginData.user.role === 'admin') {
          // Store admin user and token
          localStorage.setItem('adminUser', JSON.stringify(loginData.user));
          localStorage.setItem('adminToken', loginData.token);

          // Also store in regular user storage for compatibility
          localStorage.setItem('user', JSON.stringify(loginData.user));
          localStorage.setItem('token', loginData.token);

          // Initialize dashboard
          initializeDashboard(loginData.user);

          // Show success message
          showAlert('success', 'Login successful! Welcome to the admin dashboard.');
          return;
        } else {
          showAlert('danger', 'You do not have admin privileges.');
          return;
        }
      }
    } catch (loginError) {
      console.log('Fallback login failed:', loginError);
    }

    // Final fallback for hardcoded credentials (development only)
    if (email === 'comfortnestproject@gmail.com' && password === 'admin123') {
      // Check if there's a valid token from previous login
      const existingToken = localStorage.getItem('token');
      const existingUser = JSON.parse(localStorage.getItem('user') || '{}');

      if (existingToken && existingUser.role === 'admin') {
        // Use existing valid token
        localStorage.setItem('adminUser', JSON.stringify(existingUser));
        localStorage.setItem('adminToken', existingToken);

        // Initialize dashboard
        initializeDashboard(existingUser);

        // Show success message
        showAlert('success', 'Login successful! Welcome to the admin dashboard.');
      } else {
        showAlert('danger', 'Please login through the main application first to get a valid admin token.');
      }
    } else {
      showAlert('danger', 'Invalid credentials. Please check your email and password.');
    }
  }
}

/**
 * Show login alert
 */
function showLoginAlert(type, message) {
  const loginAlertContainer = document.getElementById('login-alert-container');
  if (loginAlertContainer) {
    loginAlertContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
                                        ${message}
                                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                      </div>`;
  }
}

/**
 * Initialize dashboard after successful admin login
 */
function initializeDashboard(user) {
  console.log('Initializing dashboard for user:', user);
  
  // Hide login section if it exists
  const loginSection = document.getElementById('admin-login-section');
  if (loginSection) {
    loginSection.classList.add('d-none');
  }
  
  // Show dashboard sections
  document.querySelectorAll('.content-section:not(#admin-login-section)').forEach(section => {
    section.classList.remove('d-none');
  });
  
  // Specifically show the dashboard section by default
  const dashboardSection = document.getElementById('dashboard-section');
  if (dashboardSection) {
    dashboardSection.classList.remove('d-none');
  }
  
  // Update admin name in header
  const adminNameElement = document.getElementById('admin-name');
  if (adminNameElement) {
    adminNameElement.textContent = user.name || 'Admin';
  }

  // Load initial data
  console.log('Loading initial dashboard data...');

  // Force load fallback data first to ensure something shows
  fallbackLoadUsers();
  fallbackLoadProperties();

  // Then try to load from API
  setTimeout(() => {
    loadDashboardData();
    loadUsers();
    loadProperties();


  }, 500);
  
  // Set initial active navigation link
  const currentActive = document.querySelector('.sidebar .nav-link.active');
  if (currentActive) {
    currentActive.classList.remove('active');
  }
  
  const dashboardLink = document.querySelector('a[data-section="dashboard-section"]');
  if (dashboardLink) {
    dashboardLink.classList.add('active');
  }
  
  const sectionTitle = document.getElementById('section-title');
  if (sectionTitle) {
    sectionTitle.textContent = 'Dashboard';
  }
  
  console.log('Dashboard initialization complete');
}

/**
 * Setup navigation links
 */
function setupNavigation() {
  document.querySelectorAll('.sidebar .nav-link, .dropdown-item[data-section]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('d-none');
      });
      const targetSectionId = this.getAttribute('data-section');
      if (targetSectionId) {
        document.getElementById(targetSectionId).classList.remove('d-none');
        document.getElementById('section-title').textContent = this.textContent.trim();

        // Refresh data when switching to users section
        if (targetSectionId === 'users-section') {
          console.log('Switching to users section, refreshing data...');
          const users = JSON.parse(localStorage.getItem('adminUsers')) || [];
          displayUsers(users);
        }
      }
      // Update active nav link in sidebar
      document.querySelectorAll('.sidebar .nav-link').forEach(navLink => navLink.classList.remove('active'));
      if (this.classList.contains('nav-link')) {
      this.classList.add('active');
      } else { // For dropdown items, update the corresponding sidebar link
        const sidebarLink = document.querySelector(`.sidebar .nav-link[data-section="${targetSectionId}"]`);
        if (sidebarLink) sidebarLink.classList.add('active');
      }
    });
  });
}

/**
 * Check if admin is authenticated
 */
function isAdminAuthenticated() {
  const adminToken = localStorage.getItem('adminToken');
  const adminUser = localStorage.getItem('adminUser');

  if (!adminToken || !adminUser) {
    console.log('Admin authentication check failed: missing token or user data');
    return false;
  }

  try {
    const userData = JSON.parse(adminUser);
    if (!userData || userData.role !== 'admin') {
      console.log('Admin authentication check failed: invalid user data or role');
      return false;
    }
  } catch (error) {
    console.error('Error parsing admin user data:', error);
    return false;
  }

  return true;
}

/**
 * Setup logout functionality
 */
function setupLogout() {
  const headerLogoutBtn = document.getElementById('logout-btn');
  const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');

  const performLogout = (e) => {
    e.preventDefault(); // Prevent default link behavior

    // Show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('user'); // Also clear regular user token if it exists
      localStorage.removeItem('token'); // Also clear regular user token if it exists

      // Show logout message
      showAlert('success', 'Logged out successfully. Redirecting...');

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1000);
    }
  };

  // Add event listeners to both logout buttons
  if (headerLogoutBtn) {
    headerLogoutBtn.addEventListener('click', performLogout);
  }

  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', performLogout);
  }
}

/**
 * Show alert message
 */
function showAlert(type, message, containerId = 'alert-container') {
  const alertContainer = document.getElementById(containerId);
  if (alertContainer) {
    alertContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                </div>`;
    // Auto-close alert after 5 seconds
    setTimeout(() => {
      const alertElement = alertContainer.querySelector('.alert');
      if (alertElement) {
        const bsAlert = bootstrap.Alert.getInstance(alertElement) || new bootstrap.Alert(alertElement);
      bsAlert.close();
      }
    }, 5000);
  }
}

/**
 * Initialize Bootstrap components
 */
function initializeBootstrapComponents() {
  // Enable tooltips, popovers, etc. if any
  // var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  // var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  //   return new bootstrap.Tooltip(tooltipTriggerEl)
  // })
}

/**
 * Format date string to a readable format
 */
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Load dashboard data (total users, properties, etc.)
 */
async function loadDashboardData() {
  try {
    console.log('Loading dashboard data...');
    
    // Test API availability first
    console.log('Testing API availability...');
    
    const users = await window.userAPI.getAllUsers();
    console.log('Users API response:', users);
    
    const properties = await window.propertyAPI.getAllProperties();
    console.log('Properties API response:', properties);
    
    // Handle different response formats
    const usersData = users.users || users.data || users || [];
    const propertiesData = properties.data || properties.properties || properties || [];
    
    console.log('Processed users data:', usersData);
    console.log('Processed properties data:', propertiesData);
    
    updateDashboardStats(usersData, propertiesData);
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    console.error('Error details:', error.message);
    showAlert('danger', 'Failed to load dashboard data: ' + error.message);
    
    // Fallback to show zero stats
    updateDashboardStats([], []);
  }
}

/**
 * Update dashboard stats
 */
function updateDashboardStats(users, properties) {
  console.log('updateDashboardStats called with:', { users, properties });
  
  // Ensure we have arrays
  const usersArray = Array.isArray(users) ? users : [];
  const propertiesArray = Array.isArray(properties) ? properties : [];
  
  console.log('Arrays to process:', { usersArray, propertiesArray });
  
  // Update total counts
  document.getElementById('total-users').textContent = usersArray.length;
  document.getElementById('total-properties').textContent = propertiesArray.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const newUsersThisMonth = usersArray.filter(user => {
    const createdAt = new Date(user.createdAt || 0);
    return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
  }).length;
  document.getElementById('new-users').textContent = newUsersThisMonth;

  const newPropertiesThisMonth = propertiesArray.filter(property => {
    const createdAt = new Date(property.createdAt || 0);
    return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
  }).length;
  document.getElementById('new-properties').textContent = newPropertiesThisMonth;
  
  console.log('Dashboard stats updated:', {
    totalUsers: usersArray.length,
    totalProperties: propertiesArray.length,
    newUsersThisMonth,
    newPropertiesThisMonth
  });
}



/**
 * Validate admin token
 */
async function validateAdminToken() {
  const token = localStorage.getItem('adminToken');
  if (!token || token === 'admin-token') {
    return false;
  }

  try {
    // Test the token with a simple API call
    const response = await fetch('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.success && data.user && data.user.role === 'admin';
    }
  } catch (error) {
    console.log('Token validation failed:', error);
  }

  return false;
}

/**
 * Load users for the table
 */
async function loadUsers() {
  try {
    console.log('Attempting to load users from API...');
    const token = localStorage.getItem('adminToken');
    console.log('Using admin token:', token ? 'exists' : 'not found');


    
    // Don't clear cached data - keep it as fallback
    
    const usersResponse = await window.userAPI.getAllUsers();
    console.log('Users API response:', usersResponse);
    
    // The userAPI.getAllUsers() already handles error checking and token, so we just check the response directly.
    const users = usersResponse.users || usersResponse.data || usersResponse || [];
    console.log('Processed users data:', users);
    
    // Remove any potential duplicates based on email or _id
    const uniqueUsers = users.filter((user, index, self) => {
      return index === self.findIndex(u => u.email === user.email || u._id === user._id);
    });
    
    console.log('Unique users after deduplication:', uniqueUsers);
    
    // Store users in admin-specific localStorage for fallback/caching
    localStorage.setItem('adminUsers', JSON.stringify(uniqueUsers));
    displayUsers(uniqueUsers);
  } catch (error) {
    console.error('Error loading users:', error);
    console.error('Error details:', error.message);
    showAlert('danger', 'Failed to load users: ' + error.message);
    fallbackLoadUsers();
  }
}

/**
 * Filter users based on search term
 */
function filterUsers(searchTerm) {
  const users = JSON.parse(localStorage.getItem('adminUsers')) || [];
  const filteredUsers = users.filter(user => 
    (user.name && user.name.toLowerCase().includes(searchTerm)) ||
    (user.email && user.email.toLowerCase().includes(searchTerm)) ||
    (user.displayId && user.displayId.toLowerCase().includes(searchTerm)) ||
    (user.phone && user.phone.toLowerCase().includes(searchTerm))
  );
  displayUsers(filteredUsers);
}

/**
 * Display users in the table
 */
function displayUsers(users) {
  const usersTableBody = document.querySelector('#users-table tbody');

  if (!usersTableBody) {
    console.error('Required table elements not found');
    return;
  }

  if (!users || users.length === 0) {
    usersTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
    return;
  }
  
  console.log('displayUsers called with:', users);
  console.log('Users array length:', users.length);
  
  // Check for duplicates in the input data
  const emails = users.map(user => user.email);
  const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
  if (duplicateEmails.length > 0) {
    console.warn('Duplicate emails found in users data:', duplicateEmails);
  }
  
  // Clear table
  usersTableBody.innerHTML = '';
  
  console.log('Displaying', users.length, 'users');
  
  // Add users to tables
  users.forEach((user, index) => {
    console.log(`Rendering user ${index}:`, user);
    const userId = user._id || user.id || user.email || '';
    console.log(`User ${index} ID mapping:`, { _id: user._id, id: user.id, email: user.email, selectedId: userId });
    const userName = user.name || 'N/A';
    const userEmail = user.email || 'N/A';
    const userDisplayId = user.displayId || 'N/A';
    const userPhone = user.phone || 'N/A';
    const userRole = user.role || 'N/A';
    const userCreatedAt = user.createdAt ? formatDate(user.createdAt) : 'N/A';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${userName}</td>
      <td>${userEmail}</td>
      <td>${userDisplayId}</td>
      <td>${userPhone}</td>
      <td>${userRole}</td>
      <td>${userCreatedAt}</td>
      <td class="action-buttons">
        <button class="btn btn-sm btn-primary edit-user-btn" data-id="${userId}" title="Edit Phone"><i class="fas fa-phone"></i></button>
        ${userPhone !== 'N/A' ? `<button class="btn btn-sm btn-warning remove-phone-btn" data-id="${userId}" title="Remove Phone"><i class="fas fa-phone-slash"></i></button>` : ''}
        <button class="btn btn-sm btn-info force-logout-btn" data-id="${userId}" title="Force Logout"><i class="fas fa-sign-out-alt"></i></button>
        <button class="btn btn-sm btn-danger delete-user-btn" data-id="${userId}" title="Delete User"><i class="fas fa-trash"></i></button>
      </td>
    `;
    
    usersTableBody.appendChild(row);
  });

  // Add event listeners to edit and delete buttons
  addUserButtonListeners();
}

/**
 * Add event listeners to user action buttons
 */
function addUserButtonListeners() {
  // Edit user buttons
  const editButtons = document.querySelectorAll('.edit-user-btn');
  editButtons.forEach(button => {
    button.addEventListener('click', () => {
      const userId = button.getAttribute('data-id');
      editUser(userId);
    });
  });
  
  // Remove phone buttons
  const removePhoneButtons = document.querySelectorAll('.remove-phone-btn');
  removePhoneButtons.forEach(button => {
    button.addEventListener('click', () => {
      const userId = button.getAttribute('data-id');
      removePhoneNumber(userId);
    });
  });

  // Force logout buttons
  const forceLogoutButtons = document.querySelectorAll('.force-logout-btn');
  forceLogoutButtons.forEach(button => {
    button.addEventListener('click', () => {
      const userId = button.getAttribute('data-id');
      forceLogoutUser(userId);
    });
  });

  // Delete user buttons
  const deleteButtons = document.querySelectorAll('.delete-user-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', () => {
      const userId = button.getAttribute('data-id');
      confirmDeleteUser(userId);
    });
  });
}

/**
 * Edit user
 */
async function editUser(userIdentifier) {
  console.log('=== EDIT USER CLICKED ===');
  console.log('User identifier received:', userIdentifier);
  console.log('Identifier type:', typeof userIdentifier);

  // Since getProfile API doesn't support getting other users' data,
  // we'll use localStorage directly to get the correct user
  const users = JSON.parse(localStorage.getItem('adminUsers')) || [];
  console.log('Available users in localStorage:', users.map(u => ({ id: u._id, name: u.name, email: u.email })));

  // Find user by ID or email
  let user = users.find(u => u._id === userIdentifier);
  if (!user) {
    user = users.find(u => u.email === userIdentifier);
  }

  console.log('Found user:', user);

  if (user) {
    console.log('User data found:', user);
    console.log('User ID to be stored in form:', user._id || user.email || '');

    // Fill form with user details
    const userIdToStore = user._id || user.email || '';
    document.getElementById('user-id').value = userIdToStore;
    document.getElementById('user-phone').value = user.phone || '';

    console.log('Form populated with:');
    console.log('- Hidden user-id field:', userIdToStore);
    console.log('- Phone field:', user.phone || '');

    // Update modal title to show user info
    document.getElementById('userModalLabel').textContent = `Edit Phone: ${user.name} (${user.email})`;

    // Show modal
    const userModal = new bootstrap.Modal(document.getElementById('userModal'));
    userModal.show();
  } else {
    console.error('User not found with identifier:', userIdentifier);
    showAlert('danger', 'User not found');
  }
}

/**
 * Force logout a user by clearing their session data
 */
async function forceLogoutUser(userIdentifier) {
  if (!confirm('Are you sure you want to force logout this user? This will clear their session data.')) {
    return;
  }

  try {
    console.log('Force logging out user:', userIdentifier);

    // Create a logout trigger in localStorage that the user's browser will detect
    const logoutTrigger = {
      timestamp: Date.now(),
      userId: userIdentifier,
      action: 'force_logout',
      message: 'Your account has been deleted by an administrator. You will be redirected to the login page.'
    };

    // Set the trigger - user's browser will detect this and logout
    localStorage.setItem('forceLogoutTrigger', JSON.stringify(logoutTrigger));

    // Also broadcast to all tabs
    window.dispatchEvent(new CustomEvent('forceUserLogout', {
      detail: logoutTrigger
    }));

    showAlert('success', 'Force logout signal sent. The user will be logged out when they next interact with the application.');

    // Remove the trigger after a short delay
    setTimeout(() => {
      localStorage.removeItem('forceLogoutTrigger');
    }, 5000);

  } catch (error) {
    console.error('Error forcing user logout:', error);
    showAlert('danger', 'Failed to force logout user: ' + error.message);
  }
}

/**
 * Force refresh user table with latest data
 */
async function forceRefreshUsers() {
  console.log('Force refreshing user table...');

  // Clear cached data
  localStorage.removeItem('adminUsers');

  // Show loading indicator
  const usersTableBody = document.querySelector('#users-table tbody');
  if (usersTableBody) {
    usersTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Refreshing...</td></tr>';
  }

  // Load fresh data from API
  try {
    await loadUsers();
    console.log('User table refreshed successfully');
  } catch (error) {
    console.error('Error refreshing user table:', error);
    // Fallback to localStorage if API fails
    fallbackLoadUsers();
  }
}

/**
 * Remove phone number from user
 */
async function removePhoneNumber(userIdentifier) {
  if (!confirm('Are you sure you want to remove the phone number for this user?')) {
    return;
  }

  try {
    // Update user with empty phone
    const userData = { phone: '' };
    const data = await window.userAPI.updateUser(userIdentifier, userData);

    showAlert('success', 'Phone number removed successfully!');

    // Force refresh the user list
    setTimeout(() => {
      forceRefreshUsers();
    }, 100);
  } catch (error) {
    console.error('Error removing phone number:', error);

    // Fallback to localStorage
    const users = JSON.parse(localStorage.getItem('adminUsers')) || [];
    const userIndex = users.findIndex(u => u._id === userIdentifier || u.email === userIdentifier);
    if (userIndex !== -1) {
      users[userIndex].phone = '';
      localStorage.setItem('adminUsers', JSON.stringify(users));
      displayUsers(users);
      showAlert('success', 'Phone number removed locally!');
    } else {
      showAlert('danger', 'Failed to remove phone number');
    }
  }
}

/**
 * Fallback to edit user from localStorage
 */
function fallbackEditUser(userIdentifier) {
  console.log('=== FALLBACK EDIT USER ===');
  console.log('Fallback user identifier:', userIdentifier);

  // Try to get users from admin-specific localStorage
  const users = JSON.parse(localStorage.getItem('adminUsers')) || [];
  console.log('Fallback available users:', users.map(u => ({ id: u._id, name: u.name, email: u.email })));

  // Find user by email or ID
  const user = users.find(u => u.email === userIdentifier || u._id === userIdentifier);
  console.log('Fallback found user:', user);

  if (user) {
    // Fill form with user details
    const userIdToStore = user._id || user.email || '';
    document.getElementById('user-id').value = userIdToStore;
    document.getElementById('user-phone').value = user.phone || '';

    console.log('Fallback form populated with:');
    console.log('- Hidden user-id field:', userIdToStore);
    console.log('- Phone field:', user.phone || '');

    // Update modal title to show user info
    document.getElementById('userModalLabel').textContent = `Edit Phone: ${user.name} (${user.email})`;

    // Show modal
    const userModal = new bootstrap.Modal(document.getElementById('userModal'));
    userModal.show();
  } else {
    console.error('Fallback: User not found with identifier:', userIdentifier);
    showAlert('danger', 'User not found');
  }
}

/**
 * Save user (add or update)
 */
async function saveUser() {
  // Show loading state
  const saveBtn = document.getElementById('save-user-btn');
  const originalBtnText = saveBtn.textContent;
  saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
  saveBtn.disabled = true;
  
  // Get form data
  const userId = document.getElementById('user-id').value;
  const phone = document.getElementById('user-phone').value;

  console.log('=== SAVE USER CLICKED ===');
  console.log('Form data extracted:');
  console.log('- User ID from hidden field:', userId);
  console.log('- Phone from input field:', phone);
  console.log('- User ID type:', typeof userId);
  console.log('- User ID length:', userId.length);

  const isUpdate = userId !== '';

  const userData = {
    phone,
  };

  console.log('Final data to send to API:');
  console.log('- userData:', userData);
  console.log('- isUpdate:', isUpdate);
  console.log('- Target user ID:', userId);

  // If adding a new user, provide default values for required fields
  if (!isUpdate) {
    userData.name = 'New User'; 
    userData.email = `newuser_${Date.now()}@example.com`; // Unique email
    userData.password = 'defaultpassword123'; // Default password
    userData.role = 'user';
  }

  // Check for duplicate phone number
  const users = JSON.parse(localStorage.getItem('adminUsers')) || [];
  const duplicateUser = users.find(user => user.phone === phone && user._id !== userId);
  if (duplicateUser) {
    showAlert('danger', 'This phone number is already in use by another user.');
    saveBtn.textContent = originalBtnText;
    saveBtn.disabled = false;
    return;
  }
  
  try {
    console.log('Attempting to save user:', { userId, userData, isUpdate });
    console.log('Admin token:', localStorage.getItem('adminToken') ? 'exists' : 'missing');

    // Validate admin token first
    const isValidToken = await validateAdminToken();
    if (!isValidToken) {
      throw new Error('Invalid or expired admin token. Please login again.');
    }

    let data;
    if (isUpdate) {
      // Use admin API method for updating existing users
      console.log('=== CALLING API TO UPDATE USER ===');
      console.log('API call parameters:');
      console.log('- User ID being sent to API:', userId);
      console.log('- User data being sent to API:', userData);
      console.log('- API endpoint will be: /api/users/' + userId);

      data = await window.userAPI.updateUser(userId, userData);

      console.log('=== API RESPONSE RECEIVED ===');
      console.log('API response:', data);
    } else {
      // Use admin API method for creating new users
      console.log('Creating new user');
      data = await window.userAPI.createUser(userData);
    }

    console.log('API response:', data);
    
    showAlert('success', data.message || 'User saved successfully!');

    // Hide modal immediately
    const userModal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
    if (userModal) {
      userModal.hide();
    }

    // Force immediate refresh from API to get latest data
    console.log('Phone number updated successfully, refreshing user list...');

    // Use force refresh function
    setTimeout(() => {
      forceRefreshUsers();
    }, 100);


  } catch (error) {
    console.error('Error saving user:', error);

    // Check if it's an authentication error
    if (error.message.includes('authentication') || error.message.includes('token') || error.message.includes('authorized')) {
      showAlert('danger', 'Authentication failed. Please login again.');

      // Clear invalid tokens
      localStorage.removeItem('adminToken');
      localStorage.removeItem('token');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('user');

      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2000);
    } else {
      showAlert('danger', 'Error saving user: ' + error.message);

      // Only fallback to localStorage if it's a network/server error
      if (error.message.includes('Failed to fetch') || error.message.includes('500')) {
        fallbackSaveUser(userId, userData, isUpdate);
      }
    }
  } finally {
    saveBtn.textContent = originalBtnText;
    saveBtn.disabled = false;
  }
}

/**
 * Load properties for the table
 */
async function loadProperties() {
  try {
    console.log('Attempting to load properties from API...');
    const propertiesResponse = await window.propertyAPI.getAllProperties();
    console.log('Properties API response:', propertiesResponse);
    
    // The propertyAPI.getAllProperties() already handles error checking and token, so we just check the response directly.
    const properties = propertiesResponse.data || propertiesResponse.properties || propertiesResponse || [];
    console.log('Processed properties data:', properties);
    
    // Store properties in admin-specific localStorage for fallback/caching
    localStorage.setItem('properties', JSON.stringify(properties));
    displayProperties(properties);
  } catch (error) {
    console.error('Error loading properties:', error);
    console.error('Error details:', error.message);

    // Don't treat property loading errors as authentication failures
    if (error.message.includes('authentication') || error.message.includes('token')) {
      showAlert('warning', 'Session may have expired. Please refresh the page.');
    } else {
      showAlert('danger', 'Failed to load properties: ' + error.message);
    }

    // Always try fallback loading
    fallbackLoadProperties();
  }
}

/**
 * Filter properties based on search term (case-insensitive)
 */
function filterAdminProperties(searchTerm) {
  const properties = JSON.parse(localStorage.getItem('properties')) || [];

  // Convert search term to lowercase for case-insensitive matching
  const searchLower = searchTerm.toLowerCase().trim();

  const filteredProperties = properties.filter(property =>
    (property.title && property.title.toLowerCase().includes(searchLower)) ||
    (property.location && property.location.toLowerCase().includes(searchLower)) ||
    (property.propertyType && property.propertyType.toLowerCase().includes(searchLower)) ||
    (property.owner?.name && property.owner.name.toLowerCase().includes(searchLower)) ||
    (property.owner?.displayId && property.owner.displayId.toLowerCase().includes(searchLower)) ||
    (property.owner?.id && property.owner.id.toLowerCase().includes(searchLower)) ||
    (property.owner?.email && property.owner.email.toLowerCase().includes(searchLower)) ||
    (property.owner?.email && property.owner.email.toLowerCase().includes(searchTerm))
  );
  displayProperties(filteredProperties);
}

// loadPropertyOwners function removed - no longer needed

// populateOwnerDropdown function removed - no longer needed

// previewPropertyImages function removed - no longer needed

/**
 * Display properties in the table
 */
function displayProperties(properties) {
  const propertiesTableBody = document.querySelector('#properties-table tbody');
  
  if (!propertiesTableBody) return;
  
  if (!properties || properties.length === 0) {
    propertiesTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No properties found</td></tr>';
    return;
  }
  
  console.log('Displaying', properties.length, 'properties');
  
  // Clear table
  propertiesTableBody.innerHTML = '';
  
  // Add properties to table
  properties.forEach((property, index) => {
    console.log(`Rendering property ${index}:`, property);
    const row = document.createElement('tr');
    
    const propertyId = property._id || property.id || '';
    const propertyTitle = property.title || 'N/A';
    // Handle property image with better error handling
    const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA0MEg2NVY2MEgzNVY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+CjwvcGF0aD4KPHRleHQgeD0iNTAiIHk9IjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2QjcyODAiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K'; // SVG placeholder
    let propertyImage = defaultImage;

    if (property.images && property.images.length > 0) {
      try {
        const firstImage = property.images[0];
        if (firstImage) {
          propertyImage = firstImage.startsWith('/uploads/')
            ? firstImage
            : `/uploads/property-images/${firstImage}`;
        }
      } catch (imageError) {
        console.warn('Error processing property image:', imageError);
        propertyImage = defaultImage; // Use SVG fallback
      }
    }
    const propertyPrice = property.price || 0;
    const propertyLocation = property.location || 'N/A';
    const propertyType = property.propertyType || 'N/A';
    const ownerName = property.owner?.name || 'N/A';
    const ownerDisplayId = property.owner?.displayId || property.owner?.id || 'N/A';
    
    row.innerHTML = `
      <td>
        <img src="${propertyImage}"
             alt="Property"
             class="property-image"
             onerror="this.onerror=null; this.src='${defaultImage}'; console.warn('Failed to load property image: ${propertyImage}');"
             style="max-width: 80px; max-height: 60px; object-fit: cover; border-radius: 4px;">
      </td>
      <td>${propertyTitle}</td>
      <td>PKR ${propertyPrice.toLocaleString()}</td>
      <td>${propertyLocation}</td>
      <td>${propertyType}</td>
      <td>${ownerName}</td>
      <td>${ownerDisplayId}</td>
      <td class="action-buttons">
        <button class="btn btn-sm btn-danger delete-property-btn" data-id="${propertyId}" title="Delete Property">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    propertiesTableBody.appendChild(row);
  });
  
  // Add event listeners to delete buttons
  addPropertyButtonListeners();
}

/**
 * Add event listeners to property action buttons
 */
function addPropertyButtonListeners() {
  try {
    // Delete property buttons
    const deleteButtons = document.querySelectorAll('.delete-property-btn');
    console.log(`Adding event listeners to ${deleteButtons.length} delete buttons`);

    deleteButtons.forEach((button, index) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const propertyId = button.getAttribute('data-id');
        console.log(`Delete button ${index} clicked for property:`, propertyId);

        if (!propertyId) {
          console.error('No property ID found for delete button');
          showAlert('danger', 'Error: Property ID not found');
          return;
        }

        confirmDeleteProperty(propertyId);
      });
    });
  } catch (error) {
    console.error('Error adding property button listeners:', error);
  }
}

// Edit property function removed - no longer needed

/**
 * Confirm delete property
 */
function confirmDeleteProperty(propertyId) {
  console.log('Confirming deletion of property:', propertyId);

  try {
    // Check if required elements exist
    const deleteItemIdInput = document.getElementById('delete-item-id');
    const deleteItemTypeInput = document.getElementById('delete-item-type');
    const deleteModal = document.getElementById('deleteConfirmModal');

    if (!deleteItemIdInput) {
      console.error('delete-item-id input not found');
      // Fallback: direct confirmation
      if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
        deleteProperty(propertyId);
      }
      return;
    }

    if (!deleteItemTypeInput) {
      console.error('delete-item-type input not found');
      // Fallback: direct confirmation
      if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
        deleteProperty(propertyId);
      }
      return;
    }

    if (!deleteModal) {
      console.error('deleteConfirmModal not found');
      // Fallback: direct confirmation
      if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
        deleteProperty(propertyId);
      }
      return;
    }

    // Find the property details for better confirmation message
    const properties = JSON.parse(localStorage.getItem('properties')) || [];
    const property = properties.find(p => p._id === propertyId);

    // Update modal content with property-specific information
    const modalBody = document.querySelector('#deleteConfirmModal .modal-body');
    if (modalBody && property) {
      modalBody.innerHTML = `
        <p>Are you sure you want to delete this property?</p>
        <div class="alert alert-warning">
          <strong>Property:</strong> ${property.title}<br>
          <strong>Location:</strong> ${property.location}<br>
          <strong>Owner:</strong> ${property.owner?.name || 'Unknown'}<br>
          <small class="text-muted">This action cannot be undone.</small>
        </div>
        <input type="hidden" id="delete-item-id" value="${propertyId}">
        <input type="hidden" id="delete-item-type" value="property">
      `;
    } else {
      // Fallback modal content
      modalBody.innerHTML = `
        <p>Are you sure you want to delete this property?</p>
        <p class="text-muted">This action cannot be undone.</p>
        <input type="hidden" id="delete-item-id" value="${propertyId}">
        <input type="hidden" id="delete-item-type" value="property">
      `;
    }

    // Set the values
    deleteItemIdInput.value = propertyId;
    deleteItemTypeInput.value = 'property';

    // Show the modal
    const bootstrapModal = new bootstrap.Modal(deleteModal);
    bootstrapModal.show();

  } catch (error) {
    console.error('Error in confirmDeleteProperty:', error);
    // Ultimate fallback: direct confirmation
    if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      deleteProperty(propertyId);
    }
  }
}

/**
 * Delete property
 */
async function deleteProperty(propertyId) {
  try {
    console.log('Attempting to delete property:', propertyId);

    // Check if admin is still authenticated
    if (!isAdminAuthenticated()) {
      showAlert('danger', 'Admin session expired. Please log in again.');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2000);
      return;
    }

    // Show loading state
    showAlert('info', 'Deleting property...');

    // Call the API to delete the property
    const response = await window.propertyAPI.deleteProperty(propertyId);
    console.log('Property deletion response:', response);

    // Show success message
    showAlert('success', 'Property deleted successfully!');

    // Refresh the properties list
    await loadProperties();

    console.log('Property deleted and list refreshed successfully');

  } catch (error) {
    console.error('Error deleting property:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      response: error.response
    });

    // Handle specific error cases without triggering logout
    if (error.message.includes('authentication') || error.message.includes('token') || error.message.includes('Invalid token')) {
      showAlert('danger', 'Authentication error. Please refresh the page and try again.');
      // Don't redirect automatically - this might be a temporary issue
    } else if (error.message.includes('authorized') || error.message.includes('permission')) {
      showAlert('danger', 'You are not authorized to delete this property.');
    } else if (error.message.includes('not found')) {
      showAlert('warning', 'Property not found. It may have already been deleted.');
      // Refresh the list to show current state
      await loadProperties();
    } else if (error.message.includes('image') || error.message.includes('file')) {
      // Handle image-related errors gracefully
      showAlert('warning', 'Property deleted, but some image files could not be removed: ' + error.message);
      // Still refresh the list as the property might have been deleted
      await loadProperties();
    } else if (error.status === 500 || error.message.includes('server error')) {
      showAlert('danger', 'Server error occurred. The property may still have been deleted. Please refresh the page.');
      // Refresh the list to check current state
      setTimeout(async () => {
        await loadProperties();
      }, 2000);
    } else {
      showAlert('danger', 'Failed to delete property: ' + error.message);
    }
  }
}

/**
 * Test property deletion functionality
 */
window.testPropertyDeletion = function() {
  console.log('=== Testing Property Deletion ===');

  // Check authentication
  if (!isAdminAuthenticated()) {
    console.error('Admin not authenticated');
    return;
  }

  // Get properties list
  const properties = JSON.parse(localStorage.getItem('properties')) || [];
  if (properties.length === 0) {
    console.log('No properties available for testing');
    return;
  }

  console.log(`Found ${properties.length} properties for testing`);
  console.log('First property:', properties[0]);
  console.log('Admin token present:', !!localStorage.getItem('adminToken'));
  console.log('Admin user data:', JSON.parse(localStorage.getItem('adminUser') || '{}'));

  // Check for properties with potential image issues
  const propertiesWithImages = properties.filter(p => p.images && p.images.length > 0);
  console.log(`Properties with images: ${propertiesWithImages.length}`);

  if (propertiesWithImages.length > 0) {
    console.log('Sample property with images:', propertiesWithImages[0]);
    console.log('Image paths:', propertiesWithImages[0].images);
  }
};

/**
 * Test image handling for properties
 */
window.testImageHandling = function() {
  console.log('=== Testing Image Handling ===');

  const properties = JSON.parse(localStorage.getItem('properties')) || [];
  const propertiesWithImages = properties.filter(p => p.images && p.images.length > 0);

  console.log(`Testing ${propertiesWithImages.length} properties with images`);

  propertiesWithImages.forEach((property, index) => {
    console.log(`Property ${index + 1}: ${property.title}`);
    property.images.forEach((imagePath, imgIndex) => {
      const img = new Image();
      img.onload = () => console.log(`✓ Image ${imgIndex + 1} loaded: ${imagePath}`);
      img.onerror = () => console.warn(`✗ Image ${imgIndex + 1} failed: ${imagePath}`);

      // Construct full image URL
      const fullPath = imagePath.startsWith('/uploads/')
        ? imagePath
        : `/uploads/property-images/${imagePath}`;
      img.src = fullPath;
    });
  });
};

/**
 * Confirm delete user
 */
function confirmDeleteUser(userId) {
  document.getElementById('delete-item-id').value = userId;
  document.getElementById('delete-item-type').value = 'user';
  const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
  deleteModal.show();
}

/**
 * Delete user
 */
async function deleteUser(userId) {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showAlert('success', 'User deleted successfully!');
      loadUsers();
    } else {
      throw new Error(data.message || 'Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    showAlert('danger', 'Failed to delete user: ' + error.message);
  }
}



/**
 * Fallback functions for when API fails
 */
function fallbackLoadUsers() {
  let users = JSON.parse(localStorage.getItem('adminUsers')) || [];

  // If no users exist, create some sample data
  if (users.length === 0) {
    console.log('No users found, creating sample data...');
    users = [
      {
        _id: 'sample_1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'sample_2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1987654321',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'admin_1',
        name: 'Admin User',
        email: 'comfortnestproject@gmail.com',
        phone: '+1555000000',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('adminUsers', JSON.stringify(users));
  }

  // Remove any potential duplicates
  const uniqueUsers = users.filter((user, index, self) => {
    return index === self.findIndex(u => u.email === user.email || u._id === user._id);
  });

  console.log('Fallback: Unique users after deduplication:', uniqueUsers);
  displayUsers(uniqueUsers);
}

function fallbackLoadProperties() {
  let properties = JSON.parse(localStorage.getItem('properties')) || [];

  // If no properties exist, create some sample data
  if (properties.length === 0) {
    console.log('No properties found, creating sample data...');
    properties = [
      {
        _id: 'prop_1',
        title: 'Modern Downtown Apartment',
        location: 'Downtown, City Center',
        price: 250000,
        status: 'available',
        images: ['https://via.placeholder.com/300x200?text=Apartment'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'prop_2',
        title: 'Luxury Villa with Pool',
        location: 'Suburbs, Green Valley',
        price: 750000,
        status: 'available',
        images: ['https://via.placeholder.com/300x200?text=Villa'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'prop_3',
        title: 'Cozy Family Home',
        location: 'Residential Area, Oak Street',
        price: 450000,
        status: 'sold',
        images: ['https://via.placeholder.com/300x200?text=House'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('properties', JSON.stringify(properties));
  }

  displayProperties(properties);
}

function fallbackSaveUser(userId, userData, isUpdate) {
  let users = JSON.parse(localStorage.getItem('adminUsers')) || [];

  console.log('Fallback: Looking for user with ID:', userId);
  console.log('Fallback: Available users:', users.map(u => ({ id: u._id, email: u.email, name: u.name })));

  if (isUpdate) {
    let userIndex = users.findIndex(u => u._id === userId);
    if (userIndex === -1) {
      userIndex = users.findIndex(u => u.email === userId);
    }

    console.log('Fallback: Found user at index:', userIndex);

    if (userIndex !== -1) {
      console.log('Fallback: Before update:', users[userIndex]);
      users[userIndex] = { ...users[userIndex], ...userData, updatedAt: new Date().toISOString() };
      console.log('Fallback: After update:', users[userIndex]);
    } else {
      console.log('Fallback: User not found for update');
    }
  } else {
    const newUser = {
      ...userData,
      _id: 'local_' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(newUser);
    console.log('Fallback: Added new user:', newUser);
  }

  localStorage.setItem('adminUsers', JSON.stringify(users));
  showAlert('warning', 'User saved locally only. Changes will not persist when server is available. Please ensure server is running for permanent changes.');

  // Immediately update the display
  displayUsers(users);

  // Hide modal
  const userModal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
  if (userModal) {
    userModal.hide();
  }
}