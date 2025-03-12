/**
 * main.js
 * Entry point for the visualizer application
 */

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Visualizer initialized');
    
    // Check if we have a selected dataset from the albums page
    const selectedDataset = sessionStorage.getItem('selectedDataset');
    const datasetName = sessionStorage.getItem('datasetName');
    
    if (!selectedDataset) {
        // No dataset selected, redirect back to albums page
        console.error('No dataset selected. Redirecting back to albums page.');
        window.location.href = 'albums.html';
        return;
    }
    
    // Set up the UI
    setupUIComponents();
    
    // Initialize timeline
    initializeTimeline();
    
    // Initialize circular wave
    initCircularWave();
    
    // Load datasets for sidebar
    loadDatasets();
    
    // Load the selected dataset
    loadCSVFile(selectedDataset, datasetName);
    
    // Initialize bottom wave
    initBottomWave();
});

/**
 * Set up UI components and event listeners
 */
function setupUIComponents() {
    // Set up play button
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', togglePlayback);
    }
    
    // Skip forward/back buttons
    const skipForwardBtn = document.getElementById('skip-forward-btn');
    if (skipForwardBtn) {
        skipForwardBtn.addEventListener('click', () => skipTime(30));
    }
    
    const skipBackBtn = document.getElementById('skip-back-btn');
    if (skipBackBtn) {
        skipBackBtn.addEventListener('click', () => skipTime(-30));
    }
    
    // Volume slider
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            const volume = this.value / 100;
            if (gainNode) {
                gainNode.gain.value = volume;
            }
        });
    }
    
    // Playback speed slider
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    if (speedSlider && speedValue) {
        speedValue.textContent = `${speedSlider.value}x`;
        app.playbackSpeed = parseFloat(speedSlider.value);
        
        speedSlider.addEventListener('input', function() {
            const speed = parseFloat(this.value);
            app.playbackSpeed = speed;
            speedValue.textContent = `${speed.toFixed(1)}x`;
        });
    }
    
    // Sidebar toggle
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');
    const appContainer = document.querySelector('.app-container');
    
    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            app.sidebarActive = sidebar.classList.contains('active');
            if (appContainer) {
                appContainer.classList.toggle('sidebar-active', app.sidebarActive);
            }
        });
    }
    
    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
            app.sidebarActive = false;
            if (appContainer) {
                appContainer.classList.remove('sidebar-active');
            }
        });
    }
    
    // Window resize handler
    window.addEventListener('resize', debounce(() => {
        initChart();
        updateWaveform();
        updateCircularWave();
    }, 250));
}