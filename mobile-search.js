/**
 * ComfortNest - Mobile Search Functionality
 *
 * Handles all mobile-specific search interface interactions including:
 * - Mobile search dropdown toggle
 * - Real-time search filtering on mobile devices
 * - Mobile filter input management
 * - Mobile reset filters functionality
 *
 * MOBILE SEARCH FEATURES:
 * - Dropdown toggle with smooth animations
 * - Real-time filtering as users type (600ms debounce)
 * - Immediate search on Enter key press
 * - Search on input blur events (300ms debounce)
 * - Mobile reset filters with visual feedback
 * - Cross-platform filter synchronization
 *
 * RESPONSIVE BEHAVIOR:
 * - Mobile-first design approach
 * - Touch-friendly interface elements
 * - Optimized for small screen interactions
 * - Prevents dropdown closing during input
 *
 * INTEGRATION:
 * - Works with desktop search system
 * - Uses same filtering logic as desktop
 * - Maintains URL parameter compatibility
 * - Syncs with desktop filter inputs
 *
 * @author ComfortNest Development Team
 * @version 1.0.0
 */

// ======== GLOBAL VARIABLES ========
let mobileSearchTimeout;        // Timeout ID for debouncing mobile search operations

// ======== UTILITY FUNCTIONS ========

/**
 * Debounce function specifically for mobile search operations
 * Prevents excessive filtering during rapid user input
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(func, wait) {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(mobileSearchTimeout);
            func.apply(this, args);
        };
        clearTimeout(mobileSearchTimeout);
        mobileSearchTimeout = setTimeout(later, wait);
    };
}

// Mobile real-time search function
function performMobileRealTimeSearch() {
    console.log('Performing mobile real-time search...');

    // Check if dropdown is currently animating to avoid performance issues
    const dropdown = document.querySelector('.mobile-filters-dropdown');
    if (dropdown && dropdown.style.display === 'none') {
        console.log('Mobile dropdown is closed, skipping real-time search');
        return;
    }

    // Collect current mobile filter values
    const mobileFilters = {
        where: document.getElementById('mobile-where-filter')?.value?.trim() || '',
        minPrice: document.getElementById('mobile-min-price-filter')?.value?.trim() || '',
        maxPrice: document.getElementById('mobile-max-price-filter')?.value?.trim() || '',
        city: document.getElementById('mobile-city-filter')?.value?.trim() || '',
        rooms: document.getElementById('mobile-rooms-filter')?.value?.trim() || '',
        bathrooms: document.getElementById('mobile-bathrooms-filter')?.value?.trim() || ''
    };

    console.log('Mobile real-time filters:', mobileFilters);

    // Check if any filters have values
    const hasFilters = Object.values(mobileFilters).some(value => value !== '');

    if (!hasFilters) {
        // No filters, show all properties
        console.log('No mobile filters active, showing all properties');
        if (typeof loadRealProperties === 'function') {
            loadRealProperties();
        }
        return;
    }

    // Convert mobile filters to the format expected by the filtering logic
    const filters = {};

    if (mobileFilters.city) filters.city = mobileFilters.city;
    if (mobileFilters.minPrice) {
        const minPrice = parseFloat(mobileFilters.minPrice.replace(/[^\d.]/g, ''));
        if (!isNaN(minPrice)) filters.minPrice = minPrice;
    }
    if (mobileFilters.maxPrice) {
        const maxPrice = parseFloat(mobileFilters.maxPrice.replace(/[^\d.]/g, ''));
        if (!isNaN(maxPrice)) filters.maxPrice = maxPrice;
    }
    if (mobileFilters.rooms) {
        const rooms = parseInt(mobileFilters.rooms.replace(/[^\d]/g, ''));
        if (!isNaN(rooms)) filters.bedrooms = rooms;
    }
    if (mobileFilters.bathrooms) {
        const bathrooms = parseInt(mobileFilters.bathrooms.replace(/[^\d]/g, ''));
        if (!isNaN(bathrooms)) filters.bathrooms = bathrooms;
    }
    if (mobileFilters.where) filters.searchTerm = mobileFilters.where;

    console.log('Converted mobile filters for search:', filters);

    // Apply the filters using the same logic as desktop
    if (typeof applyURLFilters === 'function') {
        applyURLFilters(filters);
    } else if (typeof performSearchWithFilters === 'function') {
        // Temporarily populate desktop inputs to use existing search logic
        populateDesktopFiltersFromMobile(mobileFilters);
        performSearchWithFilters();
    } else {
        console.warn('No search function available, falling back to manual filtering');
        performMobileManualFiltering(filters);
    }
}

// Helper function to populate desktop filters from mobile values
function populateDesktopFiltersFromMobile(mobileFilters) {
    const desktopMappings = {
        'universal-search-input': mobileFilters.where,
        'min-price-filter': mobileFilters.minPrice,
        'max-price-filter': mobileFilters.maxPrice,
        'city-filter': mobileFilters.city,
        'rooms-filter': mobileFilters.rooms,
        'baths-filter': mobileFilters.bathrooms
    };

    Object.entries(desktopMappings).forEach(([desktopId, value]) => {
        const input = document.getElementById(desktopId);
        if (input && value) {
            input.value = value;
        }
    });
}

// Fallback manual filtering function with exact matching logic
function performMobileManualFiltering(filters) {
    console.log('Performing mobile manual filtering with:', filters);

    const propertyCards = document.querySelectorAll('.box');
    console.log(`Mobile filtering ${propertyCards.length} property cards`);

    let visibleCount = 0;

    propertyCards.forEach((card, index) => {
        let matches = true;

        // Get property data and text content
        let propertyData = {};
        try {
            propertyData = JSON.parse(card.dataset.propertyData || '{}');
        } catch (e) {
            console.warn('Failed to parse property data for card', index);
        }

        const title = card.querySelector('.bottom h3')?.textContent?.toLowerCase() || '';
        const location = card.querySelector('.bottom .location')?.textContent?.toLowerCase() || '';
        const priceText = card.querySelector('.bottom .price')?.textContent || '';

        // Apply filters with exact matching logic
        if (filters.city) {
            const cityMatches = location.includes(filters.city.toLowerCase()) ||
                               title.includes(filters.city.toLowerCase());
            matches = matches && cityMatches;
        }

        if (filters.minPrice || filters.maxPrice) {
            const priceMatch = priceText.match(/PKR\s*([\d,]+)/);
            if (priceMatch) {
                const price = parseInt(priceMatch[1].replace(/,/g, ''));

                if (filters.minPrice) {
                    matches = matches && (price >= filters.minPrice);
                }
                if (filters.maxPrice) {
                    matches = matches && (price <= filters.maxPrice);
                }
            }
        }

        // Exact bedroom matching (same as desktop)
        if (filters.bedrooms && propertyData.bedrooms !== undefined) {
            matches = matches && (propertyData.bedrooms === filters.bedrooms);
        }

        // Exact bathroom matching (same as desktop)
        if (filters.bathrooms && propertyData.bathrooms !== undefined) {
            matches = matches && (propertyData.bathrooms === filters.bathrooms);
        }

        // Search term matching
        if (filters.searchTerm) {
            const searchMatches = title.includes(filters.searchTerm.toLowerCase()) ||
                                 location.includes(filters.searchTerm.toLowerCase());
            matches = matches && searchMatches;
        }

        // Show/hide the card
        if (matches) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    console.log(`Mobile filtering complete: ${visibleCount} of ${propertyCards.length} properties match`);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, looking for mobile search elements...');

    const mobileSearchToggle = document.getElementById('mobile-search-toggle');
    const mobileFiltersDropdown = document.querySelector('.mobile-filters-dropdown');

    console.log('Found elements:', {
        toggle: mobileSearchToggle,
        dropdown: mobileFiltersDropdown
    });

    if (mobileSearchToggle && mobileFiltersDropdown) {
        // Ensure dropdown is hidden initially
        mobileFiltersDropdown.style.display = 'none';
        mobileFiltersDropdown.style.opacity = '0';
        mobileFiltersDropdown.style.transform = 'translateY(-10px)';

        console.log('Mobile search elements found:', {
            toggle: !!mobileSearchToggle,
            dropdown: !!mobileFiltersDropdown
        });

        // Remove any existing event listeners to prevent conflicts
        const newToggle = mobileSearchToggle.cloneNode(true);
        mobileSearchToggle.parentNode.replaceChild(newToggle, mobileSearchToggle);

        // Use the new element
        const cleanToggle = document.getElementById('mobile-search-toggle');

        // Initialize state
        cleanToggle.setAttribute('data-dropdown-open', 'false');

        // Prevent form submission when toggle is clicked
        const form = cleanToggle.closest('form');
        if (form) {
            form.addEventListener('submit', function(e) {
                if (e.submitter === cleanToggle) {
                    e.preventDefault();
                    console.log('Prevented form submission from toggle button');
                }
            });
        }

        cleanToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            console.log('Mobile toggle clicked');

            // Use a more reliable state tracking method
            const currentState = this.getAttribute('data-dropdown-open') === 'true';
            const newState = !currentState;

            this.setAttribute('data-dropdown-open', newState);

            // Also toggle class for styling
            if (newState) {
                this.classList.add('active');
            } else {
                this.classList.remove('active');
            }

            console.log('Toggle state changed from', currentState, 'to', newState);

            if (newState) {
                console.log('Opening dropdown...');
                mobileFiltersDropdown.style.display = 'block';
                // Force reflow for animation
                mobileFiltersDropdown.offsetHeight;
                mobileFiltersDropdown.style.opacity = '1';
                mobileFiltersDropdown.style.transform = 'translateY(0)';
                mobileFiltersDropdown.style.visibility = 'visible';
            } else {
                console.log('Closing dropdown...');
                mobileFiltersDropdown.style.opacity = '0';
                mobileFiltersDropdown.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    const stillClosed = this.getAttribute('data-dropdown-open') !== 'true';
                    if (stillClosed) {
                        mobileFiltersDropdown.style.display = 'none';
                        mobileFiltersDropdown.style.visibility = 'hidden';
                    }
                }, 300);
            }

            // Update aria-expanded attribute
            this.setAttribute('aria-expanded', newState);
        });

        // Close dropdown when clicking outside (but not on inputs)
        document.addEventListener('click', function(e) {
            // Don't close if clicking on the toggle, dropdown, or any input inside the dropdown
            if (!cleanToggle.contains(e.target) &&
                !mobileFiltersDropdown.contains(e.target) &&
                !e.target.matches('input, textarea, select, button')) {

                console.log('Closing dropdown due to outside click');
                cleanToggle.setAttribute('data-dropdown-open', 'false');
                cleanToggle.classList.remove('active');
                mobileFiltersDropdown.style.display = 'none';
                cleanToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
    
    // Mobile search button removed - now using real-time search functionality
    console.log('Mobile search now uses real-time filtering - no manual search button needed');

    // Ensure all mobile filter inputs are properly accessible
    const mobileInputs = document.querySelectorAll('.mobile-filter-input');
    console.log('Found mobile inputs:', mobileInputs.length);

    mobileInputs.forEach((input, index) => {
        console.log(`Setting up input ${index + 1}:`, input.id);

        input.addEventListener('focus', function() {
            console.log('Mobile input focused:', this.id);
            this.parentElement.classList.add('focused');
            // Ensure dropdown stays open when input is focused
            const toggle = document.getElementById('mobile-search-toggle');
            if (toggle) {
                toggle.setAttribute('data-dropdown-open', 'true');
            }
        });

        input.addEventListener('blur', function() {
            console.log('Mobile input blurred:', this.id);
            this.parentElement.classList.remove('focused');
        });

        input.addEventListener('input', debounce(function() {
            console.log('Mobile input changed:', this.id, 'value:', this.value);
            // Trigger real-time search
            performMobileRealTimeSearch();
        }, 600)); // Same delay as desktop filters

        // Add Enter key support for immediate search
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log(`Enter pressed in mobile filter ${this.id}, performing immediate search...`);
                performMobileRealTimeSearch();
            }
        });

        // Add blur event for search when user leaves field
        input.addEventListener('blur', debounce(function() {
            console.log(`Mobile filter ${this.id} blurred, performing search...`);
            performMobileRealTimeSearch();
        }, 300)); // Shorter delay for blur events

        // Prevent dropdown from closing when clicking on inputs
        input.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });

    // Also ensure desktop filter inputs are working
    const desktopInputs = document.querySelectorAll('.inline-filter-input');
    console.log('Found desktop inputs:', desktopInputs.length);

    desktopInputs.forEach((input, index) => {
        console.log(`Setting up desktop input ${index + 1}:`, input.id);

        input.addEventListener('focus', function() {
            console.log('Desktop input focused:', this.id);
            this.style.background = '#ffffff';
        });

        input.addEventListener('blur', function() {
            console.log('Desktop input blurred:', this.id);
        });

        input.addEventListener('input', function() {
            console.log('Desktop input changed:', this.id, 'value:', this.value);
        });

        // Ensure inputs are clickable
        input.addEventListener('click', function(e) {
            e.stopPropagation();
            this.focus();
        });
    });
});

// Separate function for mobile search initialization
function initializeMobileSearch(mobileSearchToggle, mobileFiltersDropdown) {
    // Initialize state
    mobileSearchToggle.setAttribute('data-dropdown-open', 'false');

    // Ensure dropdown is hidden initially
    mobileFiltersDropdown.style.display = 'none';
    mobileFiltersDropdown.style.opacity = '0';
    mobileFiltersDropdown.style.transform = 'translateY(-10px)';

    mobileSearchToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('Mobile toggle clicked (retry function)');

        // Use data attribute for state tracking
        const currentState = this.getAttribute('data-dropdown-open') === 'true';
        const newState = !currentState;

        this.setAttribute('data-dropdown-open', newState);

        // Also toggle class for styling
        if (newState) {
            this.classList.add('active');
        } else {
            this.classList.remove('active');
        }

        console.log('Toggle state changed from', currentState, 'to', newState);

        if (newState) {
            console.log('Opening dropdown...');
            mobileFiltersDropdown.style.display = 'block';
            // Force reflow for animation
            mobileFiltersDropdown.offsetHeight;
            mobileFiltersDropdown.style.opacity = '1';
            mobileFiltersDropdown.style.transform = 'translateY(0)';
            mobileFiltersDropdown.style.visibility = 'visible';
        } else {
            console.log('Closing dropdown...');
            mobileFiltersDropdown.style.opacity = '0';
            mobileFiltersDropdown.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                const stillClosed = this.getAttribute('data-dropdown-open') !== 'true';
                if (stillClosed) {
                    mobileFiltersDropdown.style.display = 'none';
                    mobileFiltersDropdown.style.visibility = 'hidden';
                }
            }, 300);
        }

        // Update aria-expanded attribute
        this.setAttribute('aria-expanded', newState);
    });
}

// Initialize mobile reset filters button
document.addEventListener('DOMContentLoaded', function() {
    // Handle mobile reset filters button
    const mobileResetButton = document.querySelector('.mobile-reset-filters-button');
    if (mobileResetButton) {
        console.log('Mobile reset filters button found, adding event listener');
        mobileResetButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            console.log('Mobile reset filters button clicked');

            // Clear all mobile filter inputs
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
                    console.log(`Cleared mobile input: ${inputId}`);
                }
            });

            // Clear desktop filter inputs as well for consistency
            const desktopInputs = [
                'universal-search-input',
                'min-price-filter',
                'max-price-filter',
                'city-filter',
                'rooms-filter',
                'baths-filter'
            ];

            desktopInputs.forEach(inputId => {
                const input = document.getElementById(inputId);
                if (input) {
                    input.value = '';
                    console.log(`Cleared desktop input: ${inputId}`);
                }
            });

            // Add visual feedback
            this.style.transform = 'scale(0.95)';
            this.style.background = '#28a745';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
                this.style.background = '#6c757d';
            }, 200);

            // Clear URL parameters
            const url = new URL(window.location);
            url.search = '';
            window.history.replaceState({}, '', url);

            // Close mobile dropdown
            const mobileFiltersDropdown = document.querySelector('.mobile-filters-dropdown');
            const mobileToggle = document.querySelector('.mobile-search-toggle');
            if (mobileFiltersDropdown && mobileToggle) {
                mobileFiltersDropdown.style.display = 'none';
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }

            // Show success message
            showMobileResetConfirmation();

            // Reload all properties
            setTimeout(() => {
                if (typeof loadRealProperties === 'function') {
                    loadRealProperties();
                } else {
                    // Fallback: reload the page to show all properties
                    window.location.href = '/';
                }
            }, 300);
        });
    } else {
        console.log('Mobile reset filters button not found!');
    }
});

// Show mobile reset confirmation
function showMobileResetConfirmation() {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.className = 'mobile-reset-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>All filters cleared</span>
    `;

    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100%);
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
        transition: transform 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);

    // Remove after 2.5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(-100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 2500);
}
