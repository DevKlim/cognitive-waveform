/**
 * app-state.js
 * Core application state and configuration with support for pattern-based naming
 */

// Load configuration from data.json if available
async function loadAppConfiguration() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        // Apply configuration if provided
        if (data.config) {
            // Apply custom colors if provided
            if (data.config.colors) {
                Object.assign(app.config.colors, data.config.colors);
            }
            
            // Apply custom metric names if provided
            if (data.config.metrics) {
                app.config.customMetricNames = data.config.metrics;
            }
            
            // Apply custom subject names if provided
            if (data.config.subjects) {
                app.config.customSubjectNames = data.config.subjects;
            }
            
            // Apply subject pattern if provided
            if (data.config.subjectPattern) {
                app.config.subjectPattern = data.config.subjectPattern;
            }
            
            // Apply average subject name if provided
            if (data.config.averageSubjectName) {
                app.config.averageSubjectName = data.config.averageSubjectName;
            }
            
            console.log('Configuration loaded from data.json');
        }
    } catch (error) {
        console.log('No custom configuration found, using defaults');
    }
}

// Call the configuration loading function
document.addEventListener('DOMContentLoaded', loadAppConfiguration);

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
    allDatasets: [],       // List of all available datasets
    config: {              // Configuration options loaded from JSON
        colors: {
            primary: '#1db954',     // Primary accent color (green)
            secondary: '#4a90e2',   // Secondary accent color (blue)
            background: '#121212',  // Main background color
            surface: '#181818',     // Surface/card background color
            text: '#ffffff',        // Main text color
            textSecondary: '#b3b3b3' // Secondary text color
        },
        defaultSubject: 'Average (All Subjects)', // Always default to Average if available
        averageSubjectName: 'Average (All Subjects)',
        customMetricNames: {},      // Map of original metric names to display names
        customSubjectNames: {},     // Map of original subject names to display names
        subjectPattern: null        // Pattern for automatic subject name formatting
    }
};

// Audio context and nodes (global for use across modules)
let audioContext = null;
let oscillator = null;
let gainNode = null;
let analyser = null;
let audioDataArray = null;

/**
 * Get the display name for a metric based on configuration
 */
function getMetricDisplayName(metricName) {
    return app.config.customMetricNames[metricName] || metricName;
}

/**
 * Get the display name for a subject based on configuration
 * Now with support for pattern-based formatting
 */
function getSubjectDisplayName(subjectName) {
    // First check for custom mapping
    if (app.config.customSubjectNames[subjectName]) {
        return app.config.customSubjectNames[subjectName];
    }
    
    // Then check for pattern-based formatting
    if (app.config.subjectPattern && subjectName.startsWith(app.config.subjectPattern)) {
        // Check if the subject name ends with a number
        const match = subjectName.match(/^(.+?)(\d+)$/);
        if (match) {
            const pattern = match[1];
            const number = match[2];
            return `${pattern} ${number}`;
        }
    }
    
    // If the subject is the Average subject, use the configured name
    if (subjectName === 'Average (All Subjects)' && app.config.averageSubjectName) {
        return app.config.averageSubjectName;
    }
    
    // Default to the original name
    return subjectName;
}

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
    // Ensure bottom wave is also updated
    if (typeof initBottomWave === 'function') {
        initBottomWave();
    }
}