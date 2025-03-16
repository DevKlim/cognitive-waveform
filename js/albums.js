/**
 * albums.js
 * Handles dataset selection and navigation to the visualizer
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Albums page initialized');
    loadDatasetConfigurations();
});

/**
 * Load dataset configurations from JSON and session storage
 */
function loadDatasetConfigurations() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            // Map the files to the format we need
            const datasets = data.files.map(file => ({
                name: file.displayName || file.name,
                path: file.path,
                color: generateColorFromString(file.name),
                isCustom: false
            }));
            
            // Load any custom datasets from session storage
            const cachedDatasets = JSON.parse(sessionStorage.getItem('cachedDatasets') || '[]');
            
            const customDatasets = cachedDatasets.map(dataset => ({
                name: dataset.name,
                path: `customDataset_${dataset.id}`,
                color: dataset.color || generateColorFromString(dataset.name),
                isCustom: true
            }));
            
            // Combine both datasets
            const allDatasets = [...datasets, ...customDatasets];
            
            // Initialize album cards with all datasets
            initAlbumCards(allDatasets);
            
            // Add upload dataset card
            addUploadDatasetCard();
        })
        .catch(error => {
            console.error('Error loading dataset configurations:', error);
            // Fallback to static HTML album cards that may be in the page
            initAlbumCards();
            addUploadDatasetCard();
        });
}

/**
 * Generate a consistent color from a string
 */
function generateColorFromString(str) {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Convert to HSL color (better for visualization than RGB)
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 80%, 50%)`;
}

/**
 * Initialize album cards with click handlers and animations
 * Can accept datasets array from JSON or use existing DOM elements
 */
function initAlbumCards(datasets) {
    let albumCards = [];
    
    if (datasets && datasets.length > 0) {
        // Create album cards from datasets
        const albumGrid = document.getElementById('album-grid');
        
        if (!albumGrid) {
            console.error('Album grid not found in the page');
            return;
        }
        
        // Clear existing content
        albumGrid.innerHTML = '';
        
        // Create cards for each dataset
        datasets.forEach(dataset => {
            const card = document.createElement('div');
            card.className = 'album-card';
            card.setAttribute('data-file', dataset.path);
            
            card.innerHTML = `
                <div class="album-cover">
                    <div class="album-cover-img" style="background: linear-gradient(135deg, ${dataset.color}, ${adjustColor(dataset.color, -30)})">
                        <svg width="50%" height="50%" viewBox="0 0 24 24" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                            <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" fill="rgba(255,255,255,0.8)" />
                        </svg>
                    </div>
                </div>
                <div class="album-info">
                    <div class="album-title">${dataset.name}</div>
                    <div class="album-artist">Cognitive Dataset</div>
                </div>
            `;
            
            albumGrid.appendChild(card);
        });
        
        // Get all album cards
        albumCards = document.querySelectorAll('.album-card');
    } else {
        // Use existing album cards in the page
        albumCards = document.querySelectorAll('.album-card');
    }
    
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

/**
 * Add upload dataset card to the album grid
 */
function addUploadDatasetCard() {
    const albumGrid = document.getElementById('album-grid');
    if (!albumGrid) return;
    
    // Create the upload card
    const uploadCard = document.createElement('div');
    uploadCard.className = 'album-card upload-card';
    
    uploadCard.innerHTML = `
        <div class="album-cover upload-cover">
            <div class="album-cover-img">
                <svg width="50%" height="50%" viewBox="0 0 24 24" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="rgba(255,255,255,0.8)" />
                </svg>
            </div>
        </div>
        <div class="album-info">
            <div class="album-title">Upload Dataset</div>
            <div class="album-artist">Add your own data</div>
        </div>
    `;
    
    // Add click event
    uploadCard.addEventListener('click', () => {
        window.location.href = 'upload.html';
    });
    
    // Add to grid
    albumGrid.appendChild(uploadCard);
}

/**
 * Adjust HSL color by shifting hue
 */
function adjustColor(hslColor, hueShift) {
    // Parse HSL color
    const matches = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!matches) return hslColor;
    
    let hue = parseInt(matches[1]);
    const saturation = parseInt(matches[2]);
    const lightness = parseInt(matches[3]);
    
    // Adjust hue
    hue = (hue + hueShift + 360) % 360;
    
    // Return adjusted color
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if banner exists
    const tutorialBanner = document.getElementById('tutorial-banner');
    if (!tutorialBanner) return;
    
    // Check if user has seen tutorial
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    
    
    // Mark as seen when clicking the Start Tour button
    const startTourBtn = tutorialBanner.querySelector('.tutorial-btn');
    if (startTourBtn) {
        startTourBtn.addEventListener('click', function() {
            localStorage.setItem('hasSeenTutorial', 'true');
        });
    }
});