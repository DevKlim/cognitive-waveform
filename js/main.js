/**
 * main.js
 * Entry point for the visualizer application
 * Updated with session storage management for custom datasets
 */

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Visualizer initialized');
    
    // Clear cached custom datasets on page reload
    if (performance.navigation.type === 1) { // 1 = reload
        console.log('Page reloaded, clearing cached custom datasets');
        clearCachedCustomDatasets();
    }
    
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
 * Clear cached custom datasets on page reload
 */
function clearCachedCustomDatasets() {
    // Store a list of the cached datasets
    const cachedDatasets = JSON.parse(sessionStorage.getItem('cachedDatasets') || '[]');
    
    // If the page is being reloaded (not navigated to from another page)
    if (performance.navigation.type === 1) {
        // Remove the cached custom dataset data
        cachedDatasets.forEach(dataset => {
            sessionStorage.removeItem(`customDataset_${dataset.id}`);
        });
        
        // Clear the cached datasets list
        sessionStorage.removeItem('cachedDatasets');
    }
}

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
        skipForwardBtn.addEventListener('click', () => skipByPercentage(5)); // Skip forward 5% of total duration
    }
    
    const skipBackBtn = document.getElementById('skip-back-btn');
    if (skipBackBtn) {
        skipBackBtn.addEventListener('click', () => skipByPercentage(-5)); // Skip back 5% of total duration
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

    // Initialize custom interfaces if available
    if (typeof initCustomWaveformInterface === 'function') {
        initCustomWaveformInterface();
    }
    
    // Window resize handler
    window.addEventListener('resize', debounce(() => {
        initChart();
        updateWaveform();
        updateCircularWave();
        // Also update bottom wave
        if (typeof initBottomWave === 'function') {
            initBottomWave();
        }
    }, 250));
}

/**
 * Process custom dataset uploaded by user
 */
function processCustomDataset(customDataset, displayName) {
    // Show loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }
    
    // Extract data and metadata
    const data = customDataset.data;
    const metricName = customDataset.metricName;
    
    // Update dataset title
    const currentDataset = document.getElementById('current-dataset');
    if (currentDataset && displayName) {
        currentDataset.textContent = displayName;
    }
    
    console.log('Processing custom dataset with metric:', metricName);
    
    // Save to global state
    app.data.all = data;
    app.data.metrics = [metricName];
    app.currentDataType = displayName;
    
    // Get all subjects
    let subjects = [...new Set(data.map(d => d.subject))];
    
    // Move "Average (All Subjects)" to the first position if it exists
    const avgIndex = subjects.indexOf("Average (All Subjects)");
    if (avgIndex > -1) {
        subjects = ["Average (All Subjects)", ...subjects.slice(0, avgIndex), ...subjects.slice(avgIndex + 1)];
    }
    
    // Update UI
    updateMetricDropdown([metricName]);
    updateSubjectDropdown(subjects);
    
    // Default selection - always use Average when available
    if (subjects.includes("Average (All Subjects)")) {
        app.currentSubject = "Average (All Subjects)";
        const currentSubject = document.getElementById('current-subject');
        if (currentSubject) currentSubject.textContent = "Average (All Subjects)";
    } else if (subjects.length > 0) {
        app.currentSubject = subjects[0];
        const currentSubject = document.getElementById('current-subject');
        if (currentSubject) currentSubject.textContent = subjects[0];
    }
    
    app.currentMetric = metricName;
    
    // Reset visualizations
    resetPlayback();
}