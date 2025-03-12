/**
 * waveform-visualizer.js
 * Handles the waveform visualization
 */

/**
 * Update the waveform visualization
 */
function updateWaveform() {
    const container = document.getElementById('waveform-bars');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Add center line
    const centerLine = document.createElement('div');
    centerLine.className = 'waveform-center-line';
    container.appendChild(centerLine);
    
    // Get current value for display
    const currentValue = getCurrentValue();
    const displayLabel = app.currentMetric || 'Value';
    
    document.getElementById('metric-display').textContent = `${displayLabel}: ${currentValue.toFixed(1)}`;
    
    // Exit if no data
    if (app.data.filtered.length === 0) return;
    
    // Find the current index in the data
    const timeStep = app.data.filtered.length > 0 
        ? (app.data.filtered[1]?.timestamp - app.data.filtered[0]?.timestamp) || 10 
        : 10;
    
    const currentIndex = Math.floor(app.currentTime / timeStep);
    
    // Define visible range (how many bars to show)
    const visibleRange = 40; // More bars for a denser waveform look
    const startIdx = Math.max(0, currentIndex - visibleRange);
    const endIdx = Math.min(app.data.filtered.length - 1, currentIndex + visibleRange);
    
    // Create parent container for the waveform
    const waveformContainer = document.createElement('div');
    waveformContainer.className = 'waveform-animation';
    
    // Get value getter based on current metric
    const valueGetter = d => d[app.currentMetric] || 0;
    
    // Get min/max values
    const minValue = d3.min(app.data.filtered, valueGetter);
    const maxValue = d3.max(app.data.filtered, valueGetter);
    
    // Detect significant jumps
    const jumpThreshold = (maxValue - minValue) * 0.15;
    const jumps = [];
    
    for (let i = 1; i < app.data.filtered.length; i++) {
        const current = valueGetter(app.data.filtered[i]);
        const previous = valueGetter(app.data.filtered[i-1]);
        const change = Math.abs(current - previous);
        
        if (change > jumpThreshold) {
            jumps.push(i);
        }
    }
    
    // Create bars for the waveform
    const barWidth = 3; // Width of each bar
    const barGap = 1; // Gap between bars
    const maxBarHeight = 50; // Maximum height for a bar (in pixels)
    
    // Calculate total width for all bars
    const totalWidth = (barWidth + barGap) * (endIdx - startIdx + 1);
    const containerWidth = container.clientWidth;
    const startOffset = (containerWidth - totalWidth) / 2;
    
    // Get colors based on dataset
    const baseBarColor = '#1db954'; // Default green
    const accentBarColor = '#ff6b6b'; // Red for jumps
    
    for (let i = startIdx; i <= endIdx; i++) {
        if (i < 0 || i >= app.data.filtered.length) continue;
        
        const dataPoint = app.data.filtered[i];
        const distanceFromCurrent = Math.abs(i - currentIndex);
        const opacity = 1 - (distanceFromCurrent / (visibleRange + 10));
        
        // Get the value for this data point
        const value = valueGetter(dataPoint);
        
        // Check for jump point
        const isJumpPoint = jumps.includes(i);
        
        // Normalize value between 0-1 with slight exaggeration
        const exaggerationFactor = 1.4;
        let normalizedValue = (value - minValue) / (maxValue - minValue || 1); // Avoid division by zero
        
        // Apply moderate exaggeration to make pattern more visible
        normalizedValue = Math.pow(normalizedValue, 1/exaggerationFactor);
        
        // Calculate bar height - split into top and bottom bars
        const barHeight = Math.max(2, normalizedValue * maxBarHeight);
        
        // Calculate position
        const leftPosition = startOffset + ((i - startIdx) * (barWidth + barGap));
        
        // Top bar (above center line)
        const topBar = document.createElement('div');
        topBar.className = 'waveform-bar top-bar';
        topBar.style.width = `${barWidth}px`;
        topBar.style.height = `${barHeight}px`;
        topBar.style.left = `${leftPosition}px`;
        topBar.style.opacity = Math.max(0.25, opacity);
        
        // Bottom bar (mirror of top bar)
        const bottomBar = document.createElement('div');
        bottomBar.className = 'waveform-bar bottom-bar';
        bottomBar.style.width = `${barWidth}px`;
        bottomBar.style.height = `${barHeight}px`;
        bottomBar.style.left = `${leftPosition}px`;
        bottomBar.style.opacity = Math.max(0.25, opacity);
        
        // Style based on whether this is a jump point, current position, or regular bar
        let barColor, barGlow;
        
        if (i === currentIndex) {
            // Current position - highlight color with glow
            barColor = baseBarColor;
            barGlow = `0 0 6px ${baseBarColor}`;
            topBar.style.width = `${barWidth + 1}px`;
            bottomBar.style.width = `${barWidth + 1}px`;
        } else if (isJumpPoint) {
            // Jump points - accent color with subtle glow
            barColor = accentBarColor;
            barGlow = `0 0 4px ${accentBarColor}`;
        } else {
            // Regular points - color gradient based on value
            const hue = 120 + (normalizedValue * 180); // Green to blue gradient
            barColor = `hsl(${hue}, 80%, 55%)`;
            barGlow = '';
        }
        
        // Apply colors and effects
        topBar.style.backgroundColor = barColor;
        bottomBar.style.backgroundColor = barColor;
        
        if (barGlow) {
            topBar.style.boxShadow = barGlow;
            bottomBar.style.boxShadow = barGlow;
        }
        
        // Add slight animation effect for current bars
        if (Math.abs(i - currentIndex) < 5) {
            const animationDuration = 0.3 + (Math.random() * 0.3);
            const animationDelay = Math.random() * 0.2;
            
            topBar.style.animation = `pulse ${animationDuration}s ${animationDelay}s infinite alternate`;
            bottomBar.style.animation = `pulse ${animationDuration}s ${animationDelay}s infinite alternate`;
        }
        
        // Add bars to container
        waveformContainer.appendChild(topBar);
        waveformContainer.appendChild(bottomBar);
    }
    
    // Add waveform to container
    container.appendChild(waveformContainer);
    
    // Add jump counter if needed
    if (jumps.length > 0) {
        const labelContainer = document.createElement('div');
        labelContainer.className = 'waveform-labels';
        labelContainer.textContent = `${jumps.length} significant changes detected`;
        container.appendChild(labelContainer);
    }
}