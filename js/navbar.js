/**
 * ComfortNest - Navigation Bar Functionality
 *
 * Handles responsive navigation behavior including mobile hamburger menu,
 * overlay management, and smooth animations for the navigation interface.
 *
 * FEATURES:
 * - Responsive mobile hamburger menu
 * - Smooth slide animations and transitions
 * - Mobile overlay for better UX
 * - Touch-friendly navigation
 * - Automatic menu closing on outside clicks
 *
 * MOBILE BEHAVIOR:
 * - Hamburger icon transforms to X when open
 * - Navigation slides in from the right
 * - Dark overlay prevents interaction with content
 * - Menu closes when clicking overlay or links
 *
 * RESPONSIVE DESIGN:
 * - Mobile-first approach
 * - Smooth transitions between states
 * - Consistent branding and styling
 *
 * @author ComfortNest Development Team
 * @version 1.0.0
 */

// ======== NAVIGATION INITIALIZATION ========

/**
 * Initialize navigation functionality when DOM is loaded
 * Sets up mobile menu, overlay, and event listeners
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get navigation elements
    const navbar = document.querySelector('.custom-navbar');           // Main navigation container
    const hamburger = document.querySelector('.custom-hamburger');     // Mobile menu toggle button
    const navList = document.querySelector('.custom-nav-list');        // Navigation menu list

    // Create mobile overlay
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    // Track menu state to prevent immediate closing
    let isMenuJustOpened = false;

    // Scroll effect removed for performance

    // Mobile menu functionality
    if (hamburger && navList) {
        console.log('Mobile menu elements found, setting up event listeners');

        // Toggle mobile menu
        hamburger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Hamburger clicked');
            toggleMobileMenu();
        });

        // Close menu when overlay is clicked (with protection against immediate closing)
        overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Overlay clicked, isMenuJustOpened:', isMenuJustOpened);
            if (!isMenuJustOpened) {
                closeMobileMenu();
            }
        });

        // Close menu when clicking outside (but not immediately after opening)
        document.addEventListener('click', (e) => {
            // Only close if menu is open and we're not in the "just opened" state
            if (navList.classList.contains('open') && !isMenuJustOpened) {
                // Check if click is outside menu area and hamburger
                if (!navList.contains(e.target) && !hamburger.contains(e.target)) {
                    console.log('Clicked outside menu, closing');
                    closeMobileMenu();
                }
            }
        });

        // Close navbar when a link is clicked and allow navigation
        navList.querySelectorAll('.custom-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                console.log('Nav link clicked:', link.href);
                // Don't prevent default - let the link work
                // Just close the menu after a short delay to allow navigation
                setTimeout(() => {
                    closeMobileMenu();
                }, 100);
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeMobileMenu();
            }
        });
    } else {
        console.log('Mobile menu elements not found:', { hamburger, navList });
    }

    // Helper functions
    function toggleMobileMenu() {
        const isOpen = navList.classList.contains('open');
        console.log('Toggle menu, currently open:', isOpen);
        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    function openMobileMenu() {
        console.log('Opening mobile menu');
        isMenuJustOpened = true;

        navList.classList.add('open');
        hamburger.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        // Reset the flag after a short delay to prevent immediate closing
        setTimeout(() => {
            isMenuJustOpened = false;
            console.log('Menu opening protection disabled');
        }, 200);
    }

    function closeMobileMenu() {
        console.log('Closing mobile menu');
        isMenuJustOpened = false;

        navList.classList.remove('open');
        hamburger.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Set active link based on current page
    function setActiveLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.custom-nav-link');

        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkPath = new URL(link.href).pathname;
            if (linkPath === currentPath || (currentPath === '/' && linkPath === '/index.html')) {
                link.classList.add('active');
            }
        });
    }

    // Set active link on page load
    setActiveLink();

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});