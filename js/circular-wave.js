/**
 * circular-wave.js
 * Handles the circular wave visualization and pulse effects
 */

/**
 * Initialize the circular wave visualization
 */
function initCircularWave() {
    const container = document.getElementById('circular-wave');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Number of bars to create
    const numBars = 36;
    
    // Create bars
    for (let i = 0; i < numBars; i++) {
        const bar = document.createElement('div');
        bar.className = 'circular-wave-bar';
        
        // Calculate rotation angle
        const rotation = (i * (360 / numBars)) + 'deg';
        bar.style.setProperty('--rotation', rotation);
        
        // Set initial height
        bar.style.height = '40px';
        
        // Add to container
        container.appendChild(bar);
    }
}

/**
 * Update the circular wave visualization based on current value
 */
function updateCircularWave() {
    const container = document.getElementById('circular-wave');
    if (!container) return;
    
    // Get current value
    const currentValue = getCurrentValue();
    
    // Get value range
    const valueGetter = d => d[app.currentMetric] || 0;
    const minValue = d3.min(app.data.filtered, valueGetter) || 0;
    const maxValue = d3.max(app.data.filtered, valueGetter) || 100;
    
    // Normalize the value
    const normalizedValue = (currentValue - minValue) / (maxValue - minValue || 1);
    
    // Update pulse circle size based on value
    const pulseCircle = document.getElementById('pulse-circle');
    if (pulseCircle) {
        const minSize = 40;
        const maxSize = 100;
        const newSize = minSize + (normalizedValue * (maxSize - minSize));
        
        pulseCircle.style.width = `${newSize}px`;
        pulseCircle.style.height = `${newSize}px`;
        
        // Change color based on value
        const hue = 120 + (normalizedValue * 180); // Green to blue
        pulseCircle.style.backgroundColor = `hsla(${hue}, 80%, 50%, 0.2)`;
        pulseCircle.style.boxShadow = `0 0 20px hsla(${hue}, 80%, 50%, 0.4)`;
    }
    
    // Get all bars
    const bars = container.querySelectorAll('.circular-wave-bar');
    
    // Update each bar
    let audioBoost = 0;
    if (audioDataArray && app.isPlaying) {
        // Get average audio data value for visualization boost
        const total = audioDataArray.reduce((sum, val) => sum + val, 0);
        audioBoost = (total / audioDataArray.length) / 128 - 0.5; // Map to roughly -0.5 to 0.5
        audioBoost = Math.max(0, audioBoost) * 2; // Only use positive values, amplify
    }
    
    // Update bars with different heights
    bars.forEach((bar, i) => {
        // Base height - varies with the current value
        const baseHeight = 20 + (normalizedValue * 60);
        
        // Add variation based on bar position
        const angle = i * (360 / bars.length);
        const variation = Math.sin(angle * Math.PI / 180 + app.currentTime / 10) * 10;
        
        // Add audio-responsive boost
        const audioEffect = audioBoost * 20;
        
        // Calculate final height
        const height = baseHeight + variation + audioEffect;
        
        // Apply with transition for smoothness
        bar.style.height = `${height}px`;
        
        // Color gradient based on angle
        const hue = (angle + app.currentTime * 10) % 360;
        bar.style.backgroundColor = `hsl(${hue}, 80%, 50%)`;
    });
}