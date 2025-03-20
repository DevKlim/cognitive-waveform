/**
 * loading-manager.js
 * Manages the loading screen behavior to create a seamless experience
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the loading screen
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
        // Check if user has seen the loading screen before
        const hasSeenLoading = localStorage.getItem('hasSeenLoading');
        const lastVisit = localStorage.getItem('lastVisit');
        const now = new Date().getTime();
        
        // If user has seen the loading screen recently (within the last hour), 
        // and is not coming from an external site, redirect to albums.html
        if (hasSeenLoading && lastVisit && (now - parseInt(lastVisit) < 3600000) && document.referrer.includes(window.location.hostname)) {
            // Quick transition to albums page
            const loadingScreen = document.querySelector('.loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = 0;
                loadingScreen.style.transition = 'opacity 0.5s ease';
                
                setTimeout(function() {
                    window.location.href = 'albums.html';
                }, 500);
            }
        } else {
            // Mark that the user has seen the loading screen
            localStorage.setItem('hasSeenLoading', 'true');
            localStorage.setItem('lastVisit', now.toString());
            
            // Show the loading screen normally
            const loadingContent = document.querySelector('.loading-content');
            if (loadingContent) {
                loadingContent.style.opacity = 0;
                loadingContent.style.transition = 'opacity 0.5s ease';
                
                setTimeout(function() {
                    loadingContent.style.opacity = 1;
                }, 100);
            }
        }
    }
    
    // Add a preloader for pages other than the loading screen
    if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && window.location.pathname !== '') {
        // Create a simple preloader for smoother page transitions
        const preloader = document.createElement('div');
        preloader.className = 'page-preloader';
        preloader.innerHTML = `
            <div class="preloader-spinner">
                <svg width="40" height="40" viewBox="0 0 24 24">
                    <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" fill="#1db954" />
                </svg>
            </div>
        `;
        
        // Style the preloader
        const style = document.createElement('style');
        style.textContent = `
            .page-preloader {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: #121212;
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                opacity: 1;
                transition: opacity 0.5s ease;
            }
            
            .preloader-spinner {
                animation: spin 1.5s infinite ease;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(style);
        document.body.prepend(preloader);
        
        // Remove preloader when page is loaded
        window.addEventListener('load', function() {
            setTimeout(function() {
                preloader.style.opacity = 0;
                setTimeout(function() {
                    preloader.remove();
                }, 500);
            }, 200);
        });
    }
});