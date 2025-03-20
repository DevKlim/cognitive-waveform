/**
 * page-script-injector.js
 * Adds the necessary scripts to all pages for consistent behavior
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get the current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Scripts to add
    const scripts = [
        { src: 'js/logo-redirect.js', id: 'logo-redirect-script' },
        { src: 'js/loading-manager.js', id: 'loading-manager-script' }
    ];
    
    // Add each script if not already present
    scripts.forEach(script => {
        if (!document.getElementById(script.id)) {
            const scriptElement = document.createElement('script');
            scriptElement.src = script.src;
            scriptElement.id = script.id;
            document.body.appendChild(scriptElement);
        }
    });
    
    // Add smooth page transitions
    if (!document.getElementById('page-transition-style')) {
        const style = document.createElement('style');
        style.id = 'page-transition-style';
        style.textContent = `
            body {
                opacity: 0;
                animation: fadeIn 0.5s ease forwards;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            a {
                transition: all 0.3s ease;
            }
            
            .album-card, .sidebar-album, .back-button {
                transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add page transition handling for all links
    const links = document.querySelectorAll('a:not([target="_blank"])');
    links.forEach(link => {
        if (!link.hasAttribute('data-transition-handled')) {
            link.setAttribute('data-transition-handled', 'true');
            link.addEventListener('click', function(e) {
                // Don't handle external links or links with no href
                if (!this.href || this.href.includes('#') || this.target === '_blank') return;
                
                e.preventDefault();
                
                // Begin transition
                document.body.style.opacity = 0;
                document.body.style.transition = 'opacity 0.3s ease';
                
                // Navigate after transition
                setTimeout(() => {
                    window.location.href = this.href;
                }, 300);
            });
        }
    });
});