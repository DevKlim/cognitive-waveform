/**
 * bottom-wave.js
 * Handles the animated wave at the bottom of the screen
 */

/**
 * Initialize the animated wave at the bottom of the screen
 */
function initBottomWave() {
    // The wave is initialized via SVG in the HTML, no additional setup needed
    // But we'll set up an animation loop
    requestAnimationFrame(animateBottomWave);
}

/**
 * Animate the bottom wave based on audio and current value
 */
function animateBottomWave() {
    const wavePath = document.getElementById('wave-path');
    if (!wavePath) {
        requestAnimationFrame(animateBottomWave);
        return;
    }
    
    // Get current value
    const currentValue = getCurrentValue();
    
    // Get value range
    const valueGetter = d => d[app.currentMetric] || 0;
    const minValue = d3.min(app.data.filtered, valueGetter) || 0;
    const maxValue = d3.max(app.data.filtered, valueGetter) || 100;
    
    // Normalize the value
    const normalizedValue = (currentValue - minValue) / (maxValue - minValue || 1);
    
    // Time-based animation
    const time = performance.now() / 1000;
    
    // Generate new wave path with multiple sine waves
    const width = 1200; // SVG viewBox width
    const height = 120; // SVG viewBox height
    
    // Audio reactivity
    let audioBoost = 0;
    if (audioDataArray && app.isPlaying) {
        // Get average audio data value for visualization boost
        const total = audioDataArray.reduce((sum, val) => sum + val, 0);
        audioBoost = (total / audioDataArray.length) / 128 - 0.5; // Map to roughly -0.5 to 0.5
        audioBoost = Math.max(0, audioBoost) * 3; // Only use positive values, amplify
    }
    
    // Base amplitude affected by current value and audio
    const baseAmplitude = 20 + (normalizedValue * 30) + (audioBoost * 20);
    
    // Calculate wave points with different frequencies
    let path = `M0,${height} `;
    
    for (let x = 0; x <= width; x += 20) {
        // Multiple waves with different frequencies and phases
        const wave1 = Math.sin(x / 100 + time) * baseAmplitude;
        const wave2 = Math.sin(x / 70 - time * 1.5) * (baseAmplitude * 0.5);
        const wave3 = Math.sin(x / 40 + time * 0.8) * (baseAmplitude * 0.3);
        
        // Combine waves
        const y = 60 + wave1 + wave2 + wave3;
        
        // Add point to path
        path += `L${x},${y} `;
    }
    
    // Close the path
    path += `L${width},${height} L0,${height} Z`;
    
    // Update path
    wavePath.setAttribute('d', path);
    
    // Update fill color based on current value
    const hue = 120 + (normalizedValue * 180); // Green to blue
    wavePath.setAttribute('fill', `hsla(${hue}, 80%, 50%, 0.3)`);
    
    // Continue animation
    requestAnimationFrame(animateBottomWave);
}