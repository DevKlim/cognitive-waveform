/**
 * bottom-wave.js
 * Completely redesigned bottom wave animation with proper horizontal movement and audio reactivity
 */

/**
 * Initialize the bottom wave animation
 */
function initBottomWave() {
    const waveContainer = document.getElementById('bottom-wave-container');
    if (!waveContainer) return;
    
    // Clear any existing content
    waveContainer.innerHTML = '';
    
    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "bottom-wave");
    svg.setAttribute("class", "bottom-wave");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("viewBox", "0 0 1920 120");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    
    // Create multiple wave paths for layered effect
    const wavePaths = [
        {
            id: 'wave-path-1',
            class: 'wave-path wave-path-1',
            fill: 'rgba(29, 185, 84, 0.15)',
            speed: 10,
            amplitude: 15,
            frequency: 0.04,
            phase: 0
        },
        {
            id: 'wave-path-2',
            class: 'wave-path wave-path-2',
            fill: 'rgba(29, 185, 84, 0.2)',
            speed: 15,
            amplitude: 10,
            frequency: 0.03,
            phase: 0.5
        },
        {
            id: 'wave-path-3',
            class: 'wave-path wave-path-3',
            fill: 'rgba(74, 144, 226, 0.15)',
            speed: 20,
            amplitude: 8,
            frequency: 0.06,
            phase: 0.25
        }
    ];
    
    // Create path elements
    wavePaths.forEach(waveConfig => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("id", waveConfig.id);
        path.setAttribute("class", waveConfig.class);
        path.setAttribute("fill", waveConfig.fill);
        
        // Store wave configuration on the element for animation
        path.dataset.speed = waveConfig.speed;
        path.dataset.amplitude = waveConfig.amplitude;
        path.dataset.frequency = waveConfig.frequency;
        path.dataset.phase = waveConfig.phase;
        
        svg.appendChild(path);
    });
    
    // Add SVG to container
    waveContainer.appendChild(svg);
    
    // Start animation
    animateWaves();
}

/**
 * Animate the wave paths
 */
function animateWaves() {
    // Audio reactivity variables
    let audioReactivity = {
        bass: 0,
        mid: 0,
        high: 0
    };
    
    // Main animation loop
    function updateWaves() {
        // Update audio reactivity
        if (audioDataArray && app.isPlaying) {
            // Process audio data into frequency bands
            const bassSum = audioDataArray.slice(0, 8).reduce((sum, val) => sum + val, 0);
            const midSum = audioDataArray.slice(8, 24).reduce((sum, val) => sum + val, 0);
            const highSum = audioDataArray.slice(24, 48).reduce((sum, val) => sum + val, 0);
            
            // Calculate normalized values with smooth transitions
            const targetBass = bassSum / (8 * 255);
            const targetMid = midSum / (16 * 255);
            const targetHigh = highSum / (24 * 255);
            
            // Smooth transitions
            audioReactivity.bass += (targetBass - audioReactivity.bass) * 0.3;
            audioReactivity.mid += (targetMid - audioReactivity.mid) * 0.2;
            audioReactivity.high += (targetHigh - audioReactivity.high) * 0.1;
        } else {
            // Smooth transitions to zero when not playing
            audioReactivity.bass *= 0.95;
            audioReactivity.mid *= 0.95;
            audioReactivity.high *= 0.95;
        }
        
        // Get all wave paths
        const wavePaths = document.querySelectorAll('.wave-path');
        
        // Current time for animation
        const time = Date.now() / 1000;
        
        // Update each wave path
        wavePaths.forEach(path => {
            // Get wave configuration
            const speed = parseFloat(path.dataset.speed);
            const baseAmplitude = parseFloat(path.dataset.amplitude);
            const frequency = parseFloat(path.dataset.frequency);
            const phaseOffset = parseFloat(path.dataset.phase);
            
            // Factor in audio reactivity
            const amplitudeBoost = path.id === 'wave-path-1' ? audioReactivity.bass * 30 :
                                  path.id === 'wave-path-2' ? audioReactivity.mid * 20 :
                                  audioReactivity.high * 15;
            
            // Total amplitude with audio reactivity
            const amplitude = baseAmplitude + amplitudeBoost;
            
            // Create wave path
            const pathData = generateWavePath(time, speed, amplitude, frequency, phaseOffset);
            
            // Update path
            path.setAttribute('d', pathData);
        });
        
        // Request next frame
        requestAnimationFrame(updateWaves);
    }
    
    // Start animation loop
    updateWaves();
}

/**
 * Generate wave path with horizontal movement
 */
function generateWavePath(time, speed, amplitude, frequency, phaseOffset) {
    const width = 1920; // SVG viewbox width
    const height = 120; // SVG viewbox height
    const points = 50; // Number of points to generate
    const step = width / (points - 1);
    
    // Calculate time-based phase shift for horizontal movement
    const shiftX = (time * speed) % width;
    
    // Start path
    let pathData = `M 0,${height/2}`;
    
    // Generate more points for smoother curves
    for (let i = 0; i <= points; i++) {
        const x = i * step;
        
        // Calculate wave Y position with horizontal movement
        // The key is to use (x + shiftX) which shifts the entire wave pattern horizontally over time
        const waveX = (x + shiftX) * frequency + phaseOffset;
        const y = height/2 + Math.sin(waveX * Math.PI * 2) * amplitude;
        
        // Add point to path
        pathData += ` L${x},${y}`;
    }
    
    // Complete the path
    pathData += ` L${width},${height} L0,${height} Z`;
    
    return pathData;
}