// Initialize hero slider if it exists
document.addEventListener('DOMContentLoaded', function() {
  const heroSlider = document.querySelector('.heroslider');

  if (heroSlider) {
    // Check and preload images
    const images = heroSlider.querySelectorAll('img');
    let loadedImages = 0;
    const totalImages = images.length;

    console.log(`Found ${totalImages} images in hero slider`);

    // Function to initialize swiper after images are checked
    function initializeSwiper() {
      // If using Swiper library
      if (window.Swiper) {
        console.log('Initializing Swiper with', totalImages, 'slides');
        const swiper = new Swiper('.heroslider', {
          slidesPerView: 1,
          spaceBetween: 0,
          loop: totalImages > 1, // Only loop if more than 1 image
          autoplay: totalImages > 1 ? {
            delay: 5000,
            disableOnInteraction: false,
          } : false,
          pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: totalImages > 5,
          },
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
          effect: 'fade',
          fadeEffect: {
            crossFade: true
          },
          on: {
            init: function() {
              console.log('Swiper initialized successfully');
            },
            slideChange: function() {
              console.log('Slide changed to:', this.activeIndex);
            }
          }
        });

        // Hide navigation if only one slide
        if (totalImages <= 1) {
          document.querySelector('.swiper-button-next')?.style.setProperty('display', 'none');
          document.querySelector('.swiper-button-prev')?.style.setProperty('display', 'none');
          document.querySelector('.swiper-pagination')?.style.setProperty('display', 'none');
        }
      } else {
        // If Swiper is not available, handle manually with simple slider
        console.log('Swiper library not loaded, using basic slider instead');
  
        // Get images from the slider
        const images = heroSlider.querySelectorAll('img');
        let currentIndex = 0;
  
        // Show only the current image
        function updateSlider() {
          images.forEach((image, index) => {
            const slide = image.closest('.swiper-slide');
            if (slide) {
              slide.style.display = index === currentIndex ? 'block' : 'none';
            }
          });
        }
  
        // Initialize slider
        if (images.length > 1) {
          setInterval(() => {
            currentIndex = (currentIndex + 1) % images.length;
            updateSlider();
          }, 5000); // Change image every 5 seconds
        }
  
        // Initialize display
        updateSlider();
      }
    }

    // Check image loading status
    images.forEach((img, index) => {
      img.onload = function() {
        loadedImages++;
        console.log(`Image ${index + 1} loaded successfully: ${img.src}`);
        if (loadedImages === totalImages) {
          console.log('All images loaded successfully');
        }
      };

      img.onerror = function() {
        console.error(`Failed to load image ${index + 1}: ${img.src}`);
        // Hide the slide with the failed image
        const slide = img.closest('.swiper-slide');
        if (slide) {
          slide.style.display = 'none';
        }
      };

      // Check if image is already loaded (cached)
      if (img.complete) {
        if (img.naturalWidth > 0) {
          loadedImages++;
          console.log(`Image ${index + 1} already loaded: ${img.src}`);
        } else {
          console.error(`Image ${index + 1} failed to load: ${img.src}`);
          const slide = img.closest('.swiper-slide');
          if (slide) {
            slide.style.display = 'none';
          }
        }
      }
    });

    // Initialize swiper after a short delay to ensure images are processed
    setTimeout(initializeSwiper, 100);
  }
});

// Debug function to test hero slider images
window.testHeroImages = function() {
  console.log('=== Hero Slider Image Test ===');

  const heroSlider = document.querySelector('.heroslider');
  if (!heroSlider) {
    console.error('Hero slider not found');
    return;
  }

  const images = heroSlider.querySelectorAll('img');
  console.log(`Found ${images.length} images in hero slider:`);

  images.forEach((img, index) => {
    console.log(`Image ${index + 1}:`);
    console.log(`  - Source: ${img.src}`);
    console.log(`  - Alt: ${img.alt}`);
    console.log(`  - Complete: ${img.complete}`);
    console.log(`  - Natural Width: ${img.naturalWidth}`);
    console.log(`  - Natural Height: ${img.naturalHeight}`);
    console.log(`  - Display: ${getComputedStyle(img).display}`);

    // Test if image exists
    const testImg = new Image();
    testImg.onload = () => console.log(`  ✓ Image ${index + 1} can be loaded`);
    testImg.onerror = () => console.error(`  ✗ Image ${index + 1} failed to load`);
    testImg.src = img.src;
  });

  // Check Swiper instance
  const swiperInstance = document.querySelector('.heroslider').swiper;
  if (swiperInstance) {
    console.log('Swiper instance found:', swiperInstance);
    console.log('Active slide:', swiperInstance.activeIndex);
    console.log('Total slides:', swiperInstance.slides.length);
  } else {
    console.log('No Swiper instance found');
  }
};
