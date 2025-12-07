// Global variables
let uploadedImages = [];

// Utility function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Verify token format
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
      return;
    }
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
    return;
  }

  // Setup logout functionality
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/index.html';
    });
  }

  // Set up image upload preview
  const imageInput = document.getElementById('images');
  if (imageInput) {
    imageInput.addEventListener('change', handleImageUpload);
  }

  // Initialize form submission
  const addPropertyForm = document.getElementById('add-property-form');
  if (addPropertyForm) {
    addPropertyForm.addEventListener('submit', handleFormSubmit);
  }
});

// Function to disable the form
function disableForm() {
  const form = document.getElementById('add-property-form');
  const inputs = form.getElementsByTagName('input');
  const selects = form.getElementsByTagName('select');
  const textareas = form.getElementsByTagName('textarea');
  const submitBtn = form.querySelector('.btn-submit');

  for (let input of inputs) {
    input.disabled = true;
  }
  for (let select of selects) {
    select.disabled = true;
  }
  for (let textarea of textareas) {
    textarea.disabled = true;
  }
  if (submitBtn) {
    submitBtn.disabled = true;
  }
}

function handleImageUpload(e) {
    const previewContainer = document.getElementById('image-preview');
    const files = Array.from(e.target.files);
    const remainingSlots = 5 - uploadedImages.length;

    if (files.length > remainingSlots) {
        alert(`You can only upload a total of 5 images. You have ${remainingSlots} slots remaining.`);
        return;
    }

    // Validate file sizes and types
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/avif',
        'image/bmp',
        'image/tiff',
        'image/tif'
    ];
    const validFiles = [];
    const errors = [];

    files.forEach((file, index) => {
        // Check file size
        if (file.size > maxFileSize) {
            errors.push(`File "${file.name}" (${formatFileSize(file.size)}) is too large. Maximum size is 10MB.`);
            return;
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            errors.push(`File "${file.name}" is not a valid image type. Only JPEG, PNG, GIF, WebP, AVIF, BMP, and TIFF are allowed.`);
            return;
        }

        validFiles.push(file);
    });

    // Show errors if any
    if (errors.length > 0) {
        alert('File validation errors:\n\n' + errors.join('\n'));
        // Clear the input
        e.target.value = '';
        return;
    }

    validFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imgData = event.target.result;
                const index = uploadedImages.length;

                const previewWrapper = document.createElement('div');
                previewWrapper.className = 'image-preview-wrapper';
                previewWrapper.setAttribute('draggable', true);
                previewWrapper.setAttribute('data-index', index);

                const img = document.createElement('img');
                img.src = imgData;

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.onclick = () => removeImage(index);

                previewWrapper.appendChild(img);
                previewWrapper.appendChild(deleteBtn);
                previewContainer.appendChild(previewWrapper);

                uploadedImages.push({ file, element: previewWrapper });
                updatePreview();
            };
            reader.readAsDataURL(file);
        }
    });
}

function removeImage(index) {
  // Find the correct index to remove from the array
  const itemToRemove = uploadedImages.findIndex(item => parseInt(item.element.getAttribute('data-index')) === index);
  
  if (itemToRemove > -1) {
    uploadedImages.splice(itemToRemove, 1);
    updatePreview(); // Re-render previews to ensure indices are correct
  }
}

function updatePreview() {
  const previewContainer = document.getElementById('image-preview');
  previewContainer.innerHTML = '';
  uploadedImages.forEach((img, index) => {
    img.element.setAttribute('data-index', index);
    previewContainer.appendChild(img.element);
  });
  addDragAndDropHandlers();
}

function addDragAndDropHandlers() {
  const wrappers = document.querySelectorAll('.image-preview-wrapper');
  let dragSrcEl = null;

  function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    if (dragSrcEl !== this) {
      const srcIndex = parseInt(dragSrcEl.getAttribute('data-index'));
      const destIndex = parseInt(this.getAttribute('data-index'));

      const [removed] = uploadedImages.splice(srcIndex, 1);
      uploadedImages.splice(destIndex, 0, removed);

      updatePreview();
    }
    return false;
  }

  wrappers.forEach(wrapper => {
    wrapper.addEventListener('dragstart', handleDragStart, false);
    wrapper.addEventListener('dragover', handleDragOver, false);
    wrapper.addEventListener('drop', handleDrop, false);
  });
}

// Add a function to show error messages in the form
function showFormError(message) {
  // Create error element if it doesn't exist
  let errorElement = document.getElementById('form-error');
  
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = 'form-error';
    errorElement.className = 'alert alert-danger';
    
    // Insert at the top of the form
    const form = document.getElementById('add-property-form');
    if (form) {
      form.insertBefore(errorElement, form.firstChild);
    }
  }
  
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorElement.style.display = 'none';
  }, 5000);
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You must be logged in to add a property');
        window.location.href = '/login.html';
        return;
    }

    const form = document.getElementById('add-property-form');
    const formData = new FormData(form);

    // Ensure isAvailable is appended correctly
    const isAvailableCheckbox = document.getElementById('isAvailable');
    if (isAvailableCheckbox) {
        formData.set('isAvailable', isAvailableCheckbox.checked);
    }

    uploadedImages.forEach(img => {
        formData.append('images', img.file);
    });

    const submitBtn = e.target.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding Property...';

    try {
        const response = await fetch('/api/properties', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token.trim()}`
            },
            body: formData
        });

        if (response.status === 401) {
            showFormError('Your session has expired. Please log in again.');
            setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login.html';
            }, 2000);
            return;
        }

        if (response.ok) {
            alert('Property added successfully!');
            localStorage.removeItem('properties');
            window.location.href = '/dashboard.html';
        } else {
            // Handle different types of error responses
            let errorMessage = 'Error adding property';

            try {
                // Check if response is JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } else {
                    // If not JSON, it might be HTML error page
                    const errorText = await response.text();
                    if (errorText.includes('<!DOCTYPE')) {
                        errorMessage = `Server error (${response.status}). Please check server logs.`;
                    } else {
                        errorMessage = errorText || errorMessage;
                    }
                }
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                errorMessage = `Server error (${response.status}). Please try again.`;
            }

            // Display detailed validation errors if available
            if (response.status === 400) {
                showFormError(errorMessage);
            } else if (response.status === 500) {
                showFormError('Server error. Please check your connection and try again.');
            } else {
                throw new Error(errorMessage);
            }
        }
    } catch (error) {
        console.error('Error adding property:', error);

        // Provide more helpful error messages
        let userMessage = error.message || 'Failed to add property. Please try again.';

        if (error.message.includes('<!DOCTYPE')) {
            userMessage = 'Server configuration error. Please contact support.';
        } else if (error.message.includes('Network error')) {
            userMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('Server error (500)')) {
            userMessage = 'Server is experiencing issues. Please try again in a few minutes.';
        }

        showFormError(userMessage);

        // Re-enable the submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Property';
    }
}

// Test function for file type validation
window.testFileValidation = function(file) {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/avif',
        'image/bmp',
        'image/tiff',
        'image/tif'
    ];

    console.log('Testing file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified),
        isAllowed: allowedTypes.includes(file.type)
    });

    return allowedTypes.includes(file.type);
};
