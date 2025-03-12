/**
 * bottom-wave.js
 * Handles the animated wave at the bottom of the screen
 */

/**
 * Initialize the bottom wave animation
 */
function initBottomWave() {
    const wavePath = document.getElementById('wave-path');
    if (!wavePath) return;
    
    let waveOffset = 0;
    
    // Animation function
    function animateWave() {
        waveOffset += 1;
        
        // Create wave path with animation
        const waveHeight = 15; // Smaller wave amplitude
        const points = [];
        
        for (let x = 0; x <= 1200; x += 100) {
            const y = Math.sin((x + waveOffset) / 200) * waveHeight;
            points.push([x, y]);
        }
        
        // Build the path string
        let pathString = `M0,0 `;
        
        points.forEach(point => {
            pathString += `L${point[0]},${point[1]} `;
        });
        
        // Complete the path back to the bottom
        pathString += `L1200,0 V120 H0 Z`;
        
        // Update path
        wavePath.setAttribute('d', pathString);
        
        // Request next frame
        requestAnimationFrame(animateWave);
    }
    
    // Start animation
    animateWave();
}