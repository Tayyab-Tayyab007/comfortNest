document.addEventListener('DOMContentLoaded', async () => {
  // Get property ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id');
  
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

  if (!propertyId) {
    window.location.href = '/product.html';
    return;
  }
  
  const propertyDetailContainer = document.getElementById('property-detail');
  const propertyMapContainer = document.getElementById('property-map');
  let property;
  
  // Fetch and display property details
  async function loadPropertyDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    const propertyDetailContainer = document.getElementById('property-detail');

    if (!propertyId) {
      propertyDetailContainer.innerHTML = '<p class="text-danger">Error: Property ID not found in URL.</p>';
      return;
    }

    try {
      console.log('Fetching property details for ID:', propertyId);
      const response = await propertyAPI.getProperty(propertyId);
      console.log('API response for property details:', response);
      
      let property = null;
      if (response && response.data) {
        property = response.data;
      } else if (response) {
        property = response; // Fallback if data is not nested
      }

      if (!property) {
        throw new Error('Property data is empty or malformed.');
      }

      console.log('Property data received:', property);

      const imagesHTML = property.images && property.images.length > 0
        ? property.images.map((img, index) => {
            // Remove '/public' prefix if it exists, as the static server now serves from 'public'
            const imageUrl = img.startsWith('/public/') ? img.replace('/public', '') : img;
            return `<div class="property-slide"><img src="${imageUrl}" alt="Property Image ${index + 1}" data-image-index="${index}" onclick="openImageModal(${index})"></div>`;
          }).join('')
        : '<div class="property-slide"><img src="https://via.placeholder.com/800x600?text=No+Image+Available" alt="No Image" onclick="openImageModal(0)"></div>';

      const amenitiesHTML = property.amenities && property.amenities.length > 0
        ? `<div class="property-features"><h3>Amenities</h3><ul class="features-list">${property.amenities.map(amenity => `<li><i class="fas fa-check-circle"></i> ${amenity}</li>`).join('')}</ul></div>`
        : '';

      // Store images globally for modal
      window.propertyImages = property.images && property.images.length > 0
        ? property.images.map(img => img.startsWith('/public/') ? img.replace('/public', '') : img)
        : ['https://via.placeholder.com/800x600?text=No+Image+Available'];

      // Display property details
      propertyDetailContainer.innerHTML = `
          <div class="property-images owl-carousel owl-theme">
            ${imagesHTML}
          </div>
          
          <div class="property-content">
            <h1>${property.title}</h1>
            <p class="property-location"><i class="fas fa-map-marker-alt"></i>${property.location}</p>
            <p class="property-price">PKR ${property.price.toLocaleString()}</p>
            
            <div class="owner-info mt-2">
              <p class="text-muted">Owner: ${property.owner ? property.owner.name : 'N/A'} (User ID: ${property.owner ? property.owner.displayId || 'N/A' : 'N/A'})</p>
            </div>
            
            <div class="property-meta">
              <div class="meta-item"><i class="fas fa-bed"></i> <span>${property.bedrooms} Bedrooms</span></div>
              <div class="meta-item"><i class="fas fa-bath"></i> <span>${property.bathrooms} Bathrooms</span></div>
              <div class="meta-item"><i class="fas fa-vector-square"></i> <span>${property.size} sq ft</span></div>
              <div class="meta-item"><i class="fas fa-building"></i> <span>${property.propertyType}</span></div>
              ${property.yearBuilt ? `<div class="meta-item"><i class="fas fa-calendar-alt"></i> <span>Built ${property.yearBuilt}</span></div>` : ''}
            </div>
            
            <div class="property-description">
              <h3>Description</h3>
              <p>${property.description}</p>
            </div>
            
            ${amenitiesHTML}
            
            <div class="contact-seller">
              <h3><i class="fas fa-user-tie"></i> Contact Seller</h3>
              <div class="contact-buttons-container">
                <a href="${formatForTel(property.owner.phone)}" class="contact-btn call-btn">
                  <i class="fas fa-phone"></i> Call Now
                </a>
                <a href="mailto:${property.owner.email}" class="contact-btn email-btn">
                  <i class="fas fa-envelope"></i> Email Seller
                </a>
                <a href="https://api.whatsapp.com/send?phone=${formatForWhatsApp(property.owner.phone)}&text=Hi! I'm interested in your property: ${encodeURIComponent(property.title)}" target="_blank" class="contact-btn whatsapp-btn">
                  <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
              </div>
            </div>
          </div>
        `;

        // Initialize Owl Carousel for property images
        $('.owl-carousel').owlCarousel({
            loop:true,
            margin:10,
            nav:true,
            responsive:{
                0:{
                    items:1
                },
                600:{
                    items:1
                },
                1000:{
                    items:1
                }
            }
        });

    } catch (error) {
      console.error('Error loading property details:', error);
      propertyDetailContainer.innerHTML = '<p class="text-danger">Error loading property details. Please try again later.</p>';
    }
  }
  
  // Set up image slider functionality
  function setupImageSlider() {
    const slider = document.querySelector('.property-image-slider');
    const images = document.querySelectorAll('.property-image');
    const prevButton = document.getElementById('prev-image');
    const nextButton = document.getElementById('next-image');
    
    let currentIndex = 0;
    
    // Show only the current image
    function updateSlider() {
      images.forEach((image, index) => {
        image.style.display = index === currentIndex ? 'block' : 'none';
      });
    }
    
    // Initialize slider
    updateSlider();
    
    // Add event listeners for slider controls
    if (prevButton && nextButton) {
      prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateSlider();
      });
      
      nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % images.length;
        updateSlider();
      });
    }
  }
  
  // Set up contact form functionality
  function setupContactForm(property) {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        
        // In a real app, you would send this data to the server
        alert(`Thank you, ${name}! Your message to the owner of ${property.title} has been sent.`);
        contactForm.reset();
      });
    }
  }

  // Format phone number for WhatsApp (remove non-digits and ensure proper format)
  function formatForWhatsApp(phone) {
    if (!phone) return '';
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // If it starts with 0, replace with country code (assuming Pakistan +92)
    if (cleaned.startsWith('0')) {
      return '92' + cleaned.substring(1);
    }
    // If it doesn't start with country code, add it
    if (!cleaned.startsWith('92')) {
      return '92' + cleaned;
    }
    return cleaned;
  }

  // Format phone number for tel: links
  function formatForTel(phone) {
    if (!phone) return '';
    return 'tel:' + phone.replace(/\s/g, '');
  }

  // Initialize
  loadPropertyDetails();
});

// Function to refresh property details (can be called from other pages)
function refreshPropertyDetails() {
  console.log('Refreshing property details...');
  loadPropertyDetails();
}

// Make refreshPropertyDetails available globally
window.refreshPropertyDetails = refreshPropertyDetails;

// Listen for user data updates from admin panel
window.addEventListener('userDataUpdated', (event) => {
  console.log('User data updated, refreshing property details...');
  refreshPropertyDetails();
});

// Listen for localStorage changes (cross-tab communication)
window.addEventListener('storage', (event) => {
  if (event.key === 'userUpdateTrigger' && event.newValue) {
    console.log('User data updated in another tab, refreshing property details...');
    setTimeout(() => {
      refreshPropertyDetails();
    }, 1000); // Small delay to ensure data is saved
  }
});

// Image Modal Functions (Global scope)
let currentImageIndex = 0;

// Create modal HTML if it doesn't exist
function createImageModal() {
  if (document.getElementById('imageModal')) return;

  const modalHTML = `
    <div id="imageModal" class="image-modal">
      <div class="image-modal-content">
        <span class="image-modal-close" onclick="closeImageModal()">&times;</span>
        <span class="image-modal-nav image-modal-prev" onclick="changeImage(-1)">&#10094;</span>
        <img id="modalImage" src="" alt="Property Image">
        <span class="image-modal-nav image-modal-next" onclick="changeImage(1)">&#10095;</span>
        <div class="image-modal-counter">
          <span id="imageCounter">1 / 1</span>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Add keyboard navigation
  document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('imageModal');
    if (modal && modal.style.display === 'block') {
      if (e.key === 'Escape') {
        closeImageModal();
      } else if (e.key === 'ArrowLeft') {
        changeImage(-1);
      } else if (e.key === 'ArrowRight') {
        changeImage(1);
      }
    }
  });

  // Close modal when clicking outside the image
  document.getElementById('imageModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeImageModal();
    }
  });
}

// Open image modal
function openImageModal(index) {
  createImageModal();
  currentImageIndex = index;
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const imageCounter = document.getElementById('imageCounter');

  if (window.propertyImages && window.propertyImages.length > 0) {
    modalImage.src = window.propertyImages[currentImageIndex];
    imageCounter.textContent = `${currentImageIndex + 1} / ${window.propertyImages.length}`;

    // Show/hide navigation arrows
    const prevBtn = document.querySelector('.image-modal-prev');
    const nextBtn = document.querySelector('.image-modal-next');

    if (window.propertyImages.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }
  }

  modal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Close image modal
function closeImageModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
  document.body.style.overflow = ''; // Restore scrolling
}

// Change image in modal
function changeImage(direction) {
  if (!window.propertyImages || window.propertyImages.length <= 1) return;

  currentImageIndex += direction;

  if (currentImageIndex >= window.propertyImages.length) {
    currentImageIndex = 0;
  } else if (currentImageIndex < 0) {
    currentImageIndex = window.propertyImages.length - 1;
  }

  const modalImage = document.getElementById('modalImage');
  const imageCounter = document.getElementById('imageCounter');

  modalImage.src = window.propertyImages[currentImageIndex];
  imageCounter.textContent = `${currentImageIndex + 1} / ${window.propertyImages.length}`;
}