/**
 * Improved bottom wave visualization
 * Makes the wave background transparent and stretch across the screen
 */

// Configuration for performance and visuals
const BOTTOM_WAVE_CONFIG = {
    UPDATE_INTERVAL: 50,     // ms between animation frames
    ANIMATION_ENABLED: true, // Can be disabled on low-end devices
    POINTS: 16,              // Number of points for wave path
    HEIGHT: 60,              // Height in pixels
    USE_AUDIO_VISUALIZER: true // Use audio-reactive visualization
  };
  
  /**
   * Initialize the bottom wave visualization
   */
  function initBottomWave() {
    const waveContainer = document.getElementById('bottom-wave-container');
    if (!waveContainer) return;
    
    // Set height
    waveContainer.style.height = `${BOTTOM_WAVE_CONFIG.HEIGHT}px`;
    
    // Make background transparent
    waveContainer.style.backgroundColor = 'transparent';
    
    // Make it stretch to both sides
    waveContainer.style.width = '100vw';
    waveContainer.style.left = '0';
    waveContainer.style.right = '0';
    waveContainer.style.position = 'fixed';
    
    // Make it click-through
    waveContainer.style.pointerEvents = 'none';
    
    // Clear any existing content
    waveContainer.innerHTML = '';
    
    if (BOTTOM_WAVE_CONFIG.USE_AUDIO_VISUALIZER) {
      // Initialize audio-reactive visualization
      initAudioReactiveWave(waveContainer);
    } else {
      // Create standard wave animation
      createStandardWave(waveContainer);
    }
  }
  
  /**
   * Create standard animated wave
   */
  function createStandardWave(container) {
    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "bottom-wave");
    svg.setAttribute("class", "bottom-wave");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("viewBox", "0 0 1920 120");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.style.position = 'absolute';
    svg.style.bottom = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    
    // Create wave paths
    const wavePaths = [
      {
        id: 'wave-path-1',
        class: 'wave-path wave-path-1',
        fill: 'rgba(29, 185, 84, 0.15)',
        speed: 0.5
      },
      {
        id: 'wave-path-2',
        class: 'wave-path wave-path-2',
        fill: 'rgba(29, 185, 84, 0.1)',
        speed: 0.3
      },
      {
        id: 'wave-path-3',
        class: 'wave-path wave-path-3',
        fill: 'rgba(74, 144, 226, 0.1)',
        speed: 0.7
      }
    ];
    
    // Create path elements
    wavePaths.forEach(waveConfig => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("id", waveConfig.id);
      path.setAttribute("class", waveConfig.class);
      path.setAttribute("fill", waveConfig.fill);
      path.setAttribute("d", generateInitialWavePath());
      
      // Store wave configuration on the element for animation
      path.dataset.speed = waveConfig.speed;
      
      svg.appendChild(path);
    });
    
    // Add SVG to container
    container.appendChild(svg);
    
    // Start animation if enabled
    if (BOTTOM_WAVE_CONFIG.ANIMATION_ENABLED) {
      requestAnimationFrame(animateBottomWave);
    }
  }
  
  /**
   * Generate initial wave path
   */
  function generateInitialWavePath() {
    const width = 1920;
    const height = 120;
    const points = BOTTOM_WAVE_CONFIG.POINTS;
    const step = width / points;
    
    // Generate a simple wave
    let pathData = `M 0,${height/2}`;
    
    for (let i = 1; i <= points; i++) {
      const x = i * step;
      const y = height/2 + Math.sin(i * 0.5) * 15; // Simple sine wave
      pathData += ` L${x},${y}`;
    }
    
    // Complete the path
    pathData += ` L${width},${height} L0,${height} Z`;
    
    return pathData;
  }
  
  // Timestamp for throttling
  let lastBottomWaveUpdate = 0;
  
  /**
   * Animate bottom wave with throttling
   */
  function animateBottomWave() {
    // Throttle updates
    const now = Date.now();
    if (now - lastBottomWaveUpdate < BOTTOM_WAVE_CONFIG.UPDATE_INTERVAL) {
      requestAnimationFrame(animateBottomWave);
      return;
    }
    lastBottomWaveUpdate = now;
    
    // Reference to time for animation
    const time = now / 1000;
    
    // Get all wave paths
    const wavePaths = document.querySelectorAll('.wave-path');
    if (!wavePaths.length) {
      requestAnimationFrame(animateBottomWave);
      return;
    }
    
    // Update each wave path
    wavePaths.forEach(path => {
      // Get wave speed
      const speed = parseFloat(path.dataset.speed) || 0.5;
      
      // Update wave path
      updateWavePath(path, time, speed);
    });
    
    // Continue animation
    requestAnimationFrame(animateBottomWave);
  }
  
  /**
   * Update a single wave path
   */
  function updateWavePath(path, time, speed) {
    const width = 1920;
    const height = 120;
    const points = BOTTOM_WAVE_CONFIG.POINTS;
    const step = width / points;
    
    // Simple time-based offset
    const offset = time * speed * 100;
    
    // Generate new path data
    let pathData = `M 0,${height/2}`;
    
    for (let i = 1; i <= points; i++) {
      const x = i * step;
      // Simple sine wave with time-based phase shift
      const y = height/2 + Math.sin(i * 0.5 + offset * 0.01) * 15;
      pathData += ` L${x},${y}`;
    }
    
    // Complete the path
    pathData += ` L${width},${height} L0,${height} Z`;
    
    // Update path data
    path.setAttribute('d', pathData);
  }
  
  /**
   * Initialize audio-reactive wave visualization
   */
  function initAudioReactiveWave(container) {
    console.log('Initializing audio-reactive wave');
    
    // Create the visualization container
    const visualizerContainer = document.createElement('div');
    visualizerContainer.className = 'audio-visualizer-container';
    visualizerContainer.style.width = '100%';
    visualizerContainer.style.height = '100%';
    visualizerContainer.style.display = 'flex';
    visualizerContainer.style.justifyContent = 'center';
    visualizerContainer.style.alignItems = 'flex-end';
    visualizerContainer.style.overflow = 'hidden';
    visualizerContainer.style.padding = '0 10px';
    
    // Create frequency bars
    const barsCount = 64; // Number of bars
    const barWidth = 8;   // Width of each bar
    const spacing = 2;    // Spacing between bars
    
    for (let i = 0; i < barsCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'audio-bar';
      bar.style.width = `${barWidth}px`;
      bar.style.height = '1px'; // Start with minimum height
      bar.style.margin = `0 ${spacing / 2}px`;
      
      // Apply gradient color - green to blue spectrum
      const hue = 120 + (i / barsCount) * 120; // 120 (green) to 240 (blue)
      bar.style.backgroundColor = `hsla(${hue}, 80%, 50%, 0.6)`;
      bar.style.boxShadow = `0 0 5px hsla(${hue}, 80%, 50%, 0.4)`;
      bar.style.transition = 'height 0.05s ease-out';
      bar.style.borderRadius = '1px 1px 0 0';
      
      // Store the index
      bar.dataset.idx = i;
      
      visualizerContainer.appendChild(bar);
    }
    
    // Add to container
    container.innerHTML = '';
    container.appendChild(visualizerContainer);
    
    // Add CSS for the visualizer
    const style = document.createElement('style');
    style.textContent = `
      .audio-visualizer-container {
        background-color: transparent;
      }
      
      .audio-bar {
        transform-origin: bottom;
        transition: height 0.05s ease-out;
      }
    `;
    
    // Only add the style if it doesn't already exist
    if (!document.getElementById('audio-visualizer-styles')) {
      style.id = 'audio-visualizer-styles';
      document.head.appendChild(style);
    }
    
    // Start animation
    startAudioWaveAnimation();
  }
  
  // Animation frame ID
  let audioWaveAnimationId = null;
  
  /**
   * Start the audio wave animation
   */
  function startAudioWaveAnimation() {
    // Cancel any existing animation
    if (audioWaveAnimationId) {
      cancelAnimationFrame(audioWaveAnimationId);
    }
    
    function updateAudioWave() {
      const visualizerContainer = document.querySelector('.audio-visualizer-container');
      if (!visualizerContainer) {
        audioWaveAnimationId = requestAnimationFrame(updateAudioWave);
        return;
      }
      
      const bars = visualizerContainer.querySelectorAll('.audio-bar');
      if (!bars.length) {
        audioWaveAnimationId = requestAnimationFrame(updateAudioWave);
        return;
      }
      
      // Get audio data if available
      let audioData;
      let isAudioActive = false;
      
      // Try to get audio data from custom audio first
      if (window.customAudioAnalyzer && window.customAudioDataArray && 
          window.customAudio && !window.customAudio.paused) {
        window.customAudioAnalyzer.getByteFrequencyData(window.customAudioDataArray);
        audioData = window.customAudioDataArray;
        isAudioActive = true;
      }
      // Otherwise try the main audio processor
      else if (window.analyser && window.audioDataArray && app.isPlaying) {
        window.analyser.getByteFrequencyData(window.audioDataArray);
        audioData = window.audioDataArray;
        isAudioActive = true;
      }
      
      // Update bars
      for (let i = 0; i < bars.length; i++) {
        let height;
        
        if (audioData && audioData.length > 0 && isAudioActive) {
          // Audio frequency visualization
          // Map bar index to frequency data
          const dataIndex = Math.floor(i * audioData.length / bars.length);
          const value = audioData[dataIndex] || 0;
          
          // Scale height based on value
          height = Math.max(1, (value / 255) * 60);
          
          // Add some decay for smoother animation
          const currentHeight = parseFloat(bars[i].style.height) || 1;
          if (height < currentHeight) {
            // Faster decay for falling bars
            height = Math.max(height, currentHeight * 0.85);
          } else {
            // Slower rise for increasing bars
            height = Math.min(height, currentHeight * 1.3);
          }
        } else {
          // Fallback to data-driven visualization
          const dataValue = getCurrentValue ? getCurrentValue() : 0;
          
          // Get min/max for normalization
          let minValue = 0, maxValue = 100;
          if (app.data && app.data.filtered && app.data.filtered.length > 0 && app.currentMetric) {
            const values = app.data.filtered.map(d => d[app.currentMetric] || 0);
            minValue = Math.min(...values);
            maxValue = Math.max(...values);
          }
          
          // Normalize data value
          const normalizedValue = (dataValue - minValue) / (maxValue - minValue || 1);
          
          // Create bell curve with peak based on current value
          const peakPosition = normalizedValue * bars.length;
          const distance = Math.abs(i - peakPosition);
          const falloff = Math.exp(-distance * distance / (bars.length * 0.2));
          
          // Add randomness for natural look
          const randomFactor = 0.7 + Math.random() * 0.3;
          height = Math.max(1, falloff * 60 * randomFactor * normalizedValue);
        }
        
        // Apply height to bar
        bars[i].style.height = `${height}px`;
      }
      
      // Continue animation
      audioWaveAnimationId = requestAnimationFrame(updateAudioWave);
    }
    
    // Start animation
    audioWaveAnimationId = requestAnimationFrame(updateAudioWave);
  }
  
  /**
   * Stop the audio wave animation
   */
  function stopAudioWaveAnimation() {
    if (audioWaveAnimationId) {
      cancelAnimationFrame(audioWaveAnimationId);
      audioWaveAnimationId = null;
    }
  }
  
  // Set up on document load
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize bottom wave
    initBottomWave();
  });