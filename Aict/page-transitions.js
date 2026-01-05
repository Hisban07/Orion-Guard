// Page transition handler for smooth module navigation
let isTransitioning = false;

document.addEventListener('DOMContentLoaded', function() {
  // Reset transition state
  isTransitioning = false;
  
  // Ensure body is in correct initial state
  document.body.classList.remove('page-fade-out');
  document.body.classList.add('page-fade-in');
  
  // Handle navigation links (sidebar and module links)
  const navLinks = document.querySelectorAll('a.nav-link, a.module-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Only handle internal HTML page links (not external links or anchors)
      if (href && href.endsWith('.html') && !href.startsWith('http') && !href.startsWith('#')) {
        e.preventDefault();
        e.stopPropagation();
        transitionToPage(href);
      }
    });
  });
  
  // Handle buttons that redirect using onclick with window.location
  const buttons = document.querySelectorAll('button[onclick*="window.location"]');
  buttons.forEach(button => {
    const originalOnclick = button.getAttribute('onclick');
    if (originalOnclick && originalOnclick.includes('window.location')) {
      // Extract URL from onclick attribute
      const match = originalOnclick.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/);
      if (match && match[1].endsWith('.html')) {
        // Remove onclick and add our own event listener
        button.removeAttribute('onclick');
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          transitionToPage(match[1]);
        });
      }
    }
  });
});

// Function to handle smooth page transition
function transitionToPage(url) {
  // Prevent multiple clicks during transition
  if (isTransitioning) {
    return;
  }
  
  // Set transition flag
  isTransitioning = true;
  
  // Remove fade-in, add fade-out
  document.body.classList.remove('page-fade-in');
  document.body.classList.add('page-fade-out');
  
  // Force a reflow to ensure the class change is applied
  void document.body.offsetWidth;
  
  // Navigate after fade-out animation completes (with extra buffer for safety)
  const transitionTimeout = setTimeout(() => {
    // Clear timeout if navigation already happened
    if (!isTransitioning) return;
    
    // Ensure navigation happens even if animation didn't complete properly
    try {
      window.location.href = url;
    } catch (e) {
      console.error('Navigation error:', e);
      // Fallback: force navigation
      window.location.replace(url);
    }
  }, 420); // Slightly longer than animation (400ms) to ensure completion
  
  // Store timeout ID for cleanup if needed
  window._transitionTimeout = transitionTimeout;
}

// Handle browser back/forward buttons with transition
window.addEventListener('pageshow', function(event) {
  // Reset transition state
  isTransitioning = false;
  
  // Clear any pending transitions
  if (window._transitionTimeout) {
    clearTimeout(window._transitionTimeout);
    window._transitionTimeout = null;
  }
  
  // Check if page was loaded from cache (back/forward navigation)
  if (event.persisted) {
    document.body.classList.remove('page-fade-out');
    document.body.classList.add('page-fade-in');
  }
});

// Ensure page state is reset on load
window.addEventListener('load', function() {
  isTransitioning = false;
  document.body.classList.remove('page-fade-out');
  if (!document.body.classList.contains('page-fade-in')) {
    document.body.classList.add('page-fade-in');
  }
});

