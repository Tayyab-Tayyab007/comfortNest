// Global variables for image management
let existingImages = [];
let newImages = [];

// Utility function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const propertyId = new URLSearchParams(window.location.search).get('id');
    if (!propertyId) {
        alert('No property ID specified.');
        window.location.href = '/dashboard.html';
        return;
    }

    await loadPropertyData(propertyId, token);

    const editPropertyForm = document.getElementById('edit-property-form');
    editPropertyForm.addEventListener('submit', (e) => handleFormSubmit(e, propertyId, token));

    const imageInput = document.getElementById('images');
    imageInput.addEventListener('change', handleImageSelection);

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/index.html';
        });
    }
});

// Load property data
async function loadPropertyData(propertyId, token) {
    try {
        const response = await fetch(`/api/properties/${propertyId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch property data.');
        }

        const result = await response.json();
        const property = result.data;
        
        document.getElementById('title').value = property.title;
        document.getElementById('description').value = property.description;
        document.getElementById('price').value = property.price;
        document.getElementById('location').value = property.location;
        document.getElementById('street').value = property.address.street;
        document.getElementById('city').value = property.address.city;
        document.getElementById('state').value = property.address.state;
        document.getElementById('zipCode').value = property.address.zipCode;
        document.getElementById('country').value = property.address.country;
        document.getElementById('bedrooms').value = property.bedrooms;
        document.getElementById('bathrooms').value = property.bathrooms;
        document.getElementById('size').value = property.size;
        document.getElementById('propertyType').value = property.propertyType;
        document.getElementById('yearBuilt').value = property.yearBuilt;

        existingImages = property.images || [];
        renderImagePreviews();
    } catch (error) {
        console.error('Error loading property data:', error);
        alert(error.message);
    }
}

// Handle new image selection
function handleImageSelection(event) {
    const files = Array.from(event.target.files);
    const remainingSlots = 5 - (existingImages.length + newImages.length);

    if (files.length > remainingSlots) {
        alert(`You can only upload ${remainingSlots} more images.`);
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
        event.target.value = '';
        return;
    }

    // Add valid files
    newImages.push(...validFiles);
    renderImagePreviews();

    // Clear the input so the same file can be selected again if needed
    event.target.value = '';
}

// Render image previews
function renderImagePreviews() {
    const previewContainer = document.getElementById('image-preview');
    previewContainer.innerHTML = '';

    const allImages = [...existingImages, ...newImages];

    allImages.forEach((image, index) => {
        const previewWrapper = document.createElement('div');
        previewWrapper.className = 'image-preview-wrapper';
        previewWrapper.setAttribute('draggable', true);
        previewWrapper.setAttribute('data-index', index);

        const img = document.createElement('img');
        if (typeof image === 'string') {
            img.src = image;
        } else {
            img.src = URL.createObjectURL(image);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.addEventListener('click', () => removeImage(index));

        previewWrapper.appendChild(img);
        previewWrapper.appendChild(deleteBtn);
        previewContainer.appendChild(previewWrapper);
    });

    addDragAndDropHandlers();
}

// Remove an image
function removeImage(index) {
    const allImages = [...existingImages, ...newImages];
    const removedImage = allImages[index];

    if (typeof removedImage === 'string') {
        existingImages = existingImages.filter(img => img !== removedImage);
    } else {
        newImages = newImages.filter(img => img !== removedImage);
    }

    renderImagePreviews();
}

// Drag-and-drop functionality
function addDragAndDropHandlers() {
    const wrappers = document.querySelectorAll('.image-preview-wrapper');
    let dragSrcEl = null;

    function handleDragStart(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e) {
        e.stopPropagation();
        if (dragSrcEl !== this) {
            const srcIndex = parseInt(dragSrcEl.getAttribute('data-index'));
            const destIndex = parseInt(this.getAttribute('data-index'));

            let allImages = [...existingImages, ...newImages];
            const [removed] = allImages.splice(srcIndex, 1);
            allImages.splice(destIndex, 0, removed);

            existingImages = allImages.filter(item => typeof item === 'string');
            newImages = allImages.filter(item => typeof item !== 'string');
            
            renderImagePreviews();
        }
    }

    wrappers.forEach(wrapper => {
        wrapper.addEventListener('dragstart', handleDragStart);
        wrapper.addEventListener('dragover', handleDragOver);
        wrapper.addEventListener('drop', handleDrop);
    });
}

// Handle form submission
async function handleFormSubmit(event, propertyId, token) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';

    const formData = new FormData();
    const form = document.getElementById('edit-property-form');

    // Append text data
    formData.append('title', form.title.value);
    formData.append('description', form.description.value);
    formData.append('price', form.price.value);
    formData.append('location', form.location.value);
    formData.append('bedrooms', form.bedrooms.value);
    formData.append('bathrooms', form.bathrooms.value);
    formData.append('size', form.size.value);
    formData.append('propertyType', form.propertyType.value);
    formData.append('yearBuilt', form.yearBuilt.value);
    formData.append('street', form.street.value);
    formData.append('city', form.city.value);
    formData.append('state', form.state.value);
    formData.append('zipCode', form.zipCode.value);
    formData.append('country', form.country.value);
    formData.append('existingImages', JSON.stringify(existingImages));

    // Append new image files
    newImages.forEach(file => {
        formData.append('images', file);
    });

    try {
        const response = await fetch(`/api/properties/${propertyId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) {
            // Handle different types of error responses
            let errorMessage = 'Failed to update property';

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

            throw new Error(errorMessage);
        }

        alert('Property updated successfully!');
        window.location.href = '/dashboard.html';
    } catch (error) {
        console.error('Error updating property:', error);
        alert(error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Property';
    }
}

// Debug function to test property update data
window.debugPropertyUpdate = function() {
    const form = document.getElementById('edit-property-form');
    const formData = new FormData();

    // Add all form fields
    formData.append('title', form.title.value);
    formData.append('description', form.description.value);
    formData.append('price', form.price.value);
    formData.append('location', form.location.value);
    formData.append('bedrooms', form.bedrooms.value);
    formData.append('bathrooms', form.bathrooms.value);
    formData.append('size', form.size.value);
    formData.append('propertyType', form.propertyType.value);
    formData.append('yearBuilt', form.yearBuilt.value);
    formData.append('street', form.street.value);
    formData.append('city', form.city.value);
    formData.append('state', form.state.value);
    formData.append('zipCode', form.zipCode.value);
    formData.append('country', form.country.value);
    formData.append('existingImages', JSON.stringify(existingImages));

    console.log('=== Property Update Debug ===');
    console.log('Property ID:', propertyId);
    console.log('Existing Images:', existingImages);
    console.log('New Images:', newImages);
    console.log('Form Data:');

    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

    // Validate required fields
    const requiredFields = ['title', 'description', 'price', 'location', 'bedrooms', 'bathrooms', 'size', 'propertyType'];
    const missingFields = requiredFields.filter(field => !form[field].value);

    if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
    } else {
        console.log('✓ All required fields present');
    }

    // Check numeric fields
    const numericFields = ['price', 'bedrooms', 'bathrooms', 'size'];
    numericFields.forEach(field => {
        const value = form[field].value;
        if (isNaN(value) || value === '') {
            console.error(`Invalid numeric value for ${field}:`, value);
        } else {
            console.log(`✓ ${field}: ${value}`);
        }
    });
};
