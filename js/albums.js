/**
 * albums.js
 * Handles dataset selection and navigation to the visualizer
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Albums page initialized');
    initAlbumCards();
});

/**
 * Initialize album cards with click handlers and animations
 */
function initAlbumCards() {
    const albumCards = document.querySelectorAll('.album-card');
    
    // Add click handlers to each album card
    albumCards.forEach((card, index) => {
        // Add staggered animation
        card.style.animationDelay = `${0.1 * (index + 1)}s`;
        
        // Add click handler
        card.addEventListener('click', () => {
            const filePath = card.getAttribute('data-file');
            const albumTitle = card.querySelector('.album-title').textContent;
            
            // Store selected dataset info in sessionStorage
            sessionStorage.setItem('selectedDataset', filePath);
            sessionStorage.setItem('datasetName', albumTitle);
            
            console.log(`Selected dataset: ${albumTitle} (${filePath})`);
            
            // Add exit animation
            document.querySelectorAll('.album-card').forEach(c => {
                if (c !== card) {
                    c.style.opacity = '0.5';
                    c.style.transform = 'scale(0.95)';
                } else {
                    c.style.transform = 'scale(1.05)';
                    c.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.5)';
                }
            });
            
            // Navigate to visualizer with short delay for animation
            setTimeout(() => {
                window.location.href = 'visualizer.html';
            }, 500);
        });
    });
}