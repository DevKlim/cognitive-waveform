/**
 * logo-redirect.js
 * Handles logo click events to ensure consistent redirection to the index/loading page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Find all logo containers and add click events
    const logoContainers = document.querySelectorAll('.logo-container, .logo-small');
    
    logoContainers.forEach(container => {
        // Check if container already has a link
        if (!container.querySelector('a')) {
            // Wrap content in a link to index.html
            const content = container.innerHTML;
            container.innerHTML = `<a href="index.html" style="display: flex; align-items: center; text-decoration: none; color: inherit;">${content}</a>`;
            
            // Add hover effect
            const link = container.querySelector('a');
            link.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
                this.style.transition = 'transform 0.2s ease';
            });
            
            link.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        }
    });
    
    // Handle the specific logo in the sidebar which might already have a link
    const sidebarLogo = document.querySelector('.sidebar .logo-container a');
    if (sidebarLogo) {
        sidebarLogo.href = 'index.html';
    }
});