/**
 * app-state.js
 * Core application state and configuration
 */

// Application state object - shared across all modules
const app = {
    currentDataType: null,  // Name of the dataset 
    currentSubject: null,   // Current subject being viewed
    currentMetric: null,    // Current metric being visualized
    currentTime: 0,
    isPlaying: false,
    playbackInterval: null,
    wasPlayingBeforeDrag: false,
    playbackSpeed: 1.0,
    data: {
        all: [],           // All data points
        filtered: [],      // Data filtered by subject
        metrics: []        // Available metrics
    },
    chart: {
        svg: null,
        width: 0,
        height: 0,
        xScale: null,
        yScale: null,
        lineGenerator: null
    },
    currentFile: null,     // Track the currently selected file
    sidebarActive: false,  // Track sidebar state
    allDatasets: []        // List of all available datasets
};

// Audio context and nodes (global for use across modules)
let audioContext = null;
let oscillator = null;
let gainNode = null;
let analyser = null;
let audioDataArray = null;

/**
 * Filter data based on current subject
 */
function filterData() {
    app.data.filtered = app.data.all.filter(
        item => item.subject === app.currentSubject
    );
}

/**
 * Get the current metric value based on currentTime
 */
function getCurrentValue() {
    if (app.data.filtered.length === 0) return 0;

    const timeStep = app.data.filtered.length > 1
        ? (app.data.filtered[1].timestamp - app.data.filtered[0].timestamp)
        : 10;
    const index = Math.min(
        app.data.filtered.length - 1,
        Math.max(0, Math.floor(app.currentTime / timeStep))
    );
    const dataPoint = app.data.filtered[index];

    return dataPoint[app.currentMetric] || 0;
}

/**
 * Format seconds to M:SS format
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Debounce function for resize events
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Reset playback when we change subject or metric
 */
function resetPlayback() {
    stopPlayback();
    app.currentTime = 0;
    filterData();
    initChart();
    updateWaveform();
    updateCircularWave();
    updateTimeDisplay();
    updateHandlePosition();
}