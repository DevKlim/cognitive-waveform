/**
 * optimized-circular-wave.js
 * Performance-optimized version of the circular visualization
 */

// Configuration for performance
const CIRCULAR_CONFIG = {
    FREQUENCY_BARS: 60,       // Reduced from 120 to 60 bars
    UPDATE_INTERVAL: 50,      // ms between updates (throttled)
    HISTORY_LENGTH: 5,        // Reduced history for smoother animations
    ANIMATION_ENABLED: true,  // Can be toggled off completely for lower-end devices
  };
  
  // Last update timestamp for throttling
  let lastCircularUpdateTime = 0;
  
  /**
   * Initialize the circular wave visualization with optimized settings
   */
  function initCircularWave() {
    const container = document.getElementById('circular-wave');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Set container style
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    
    // Create essential visualization components
    createBackgroundGlow(container);
    createFrequencyBars(container);
    createCentralElements(container);
    
    // Initialize minimal history arrays
    window.pulseHistory = Array(CIRCULAR_CONFIG.HISTORY_LENGTH).fill(0);
    window.frequencyHistory = Array(32).fill(0); // Reduced array size
  }
  
  /**
   * Create background glow element
   */
  function createBackgroundGlow(container) {
    const bgGlow = document.createElement('div');
    bgGlow.className = 'circular-bg-glow';
    container.appendChild(bgGlow);
  }
  
  /**
   * Create frequency bars with reduced count
   */
  function createFrequencyBars(container) {
    // Reduced number of bars for better performance
    const numBars = CIRCULAR_CONFIG.FREQUENCY_BARS;
    
    // Create container
    const barsContainer = document.createElement('div');
    barsContainer.className = 'frequency-bars-container';
    container.appendChild(barsContainer);
    
    // Create individual bars
    for (let i = 0; i < numBars; i++) {
      const bar = document.createElement('div');
      bar.className = 'frequency-bar';
      
      // Calculate angle for this bar
      const angle = (i * (360 / numBars));
      bar.style.transform = `rotate(${angle}deg)`;
      
      // Add inner bar (the part that animates)
      const innerBar = document.createElement('div');
      innerBar.className = 'frequency-bar-inner';
      
      // Skip glow effect for better performance
      // Only add glow to every 4th bar
      if (i % 4 === 0) {
        const glowEffect = document.createElement('div');
        glowEffect.className = 'frequency-bar-glow';
        bar.appendChild(glowEffect);
      }
      
      bar.appendChild(innerBar);
      barsContainer.appendChild(bar);
    }
  }
  
  /**
   * Create central elements
   */
  function createCentralElements(container) {
    // Central circle
    const pulseCircle = document.createElement('div');
    pulseCircle.id = 'pulse-circle';
    pulseCircle.className = 'pulse-circle';
    container.appendChild(pulseCircle);
    
    // Value display
    const valueDisplay = document.createElement('div');
    valueDisplay.id = 'circular-value-display';
    valueDisplay.className = 'circular-value-display';
    valueDisplay.innerHTML = '<span class="value">0</span>';
    container.appendChild(valueDisplay);
  }
  
  /**
   * Update the circular wave visualization with throttling for better performance
   */
  function updateCircularWave() {
    // Only update at specified interval
    const now = Date.now();
    if (now - lastCircularUpdateTime < CIRCULAR_CONFIG.UPDATE_INTERVAL) return;
    lastCircularUpdateTime = now;
    
    // Get relevant DOM elements
    const container = document.getElementById('circular-wave');
    const pulseCircle = document.getElementById('pulse-circle');
    const valueDisplay = document.getElementById('circular-value-display');
    
    if (!container || !pulseCircle) return;
    
    // Get current metric value
    const currentValue = getCurrentValue();
    
    // Get value range for normalization
    const valueGetter = d => d[app.currentMetric] || 0;
    const minValue = d3.min(app.data.filtered, valueGetter) * 0.9;
    const maxValue = d3.max(app.data.filtered, valueGetter) * 1.1;
    
    // Calculate normalized value (0-1 range)
    const normalizedValue = (currentValue - minValue) / (maxValue - minValue || 1);
    
    // Determine if we're visualizing heart rate
    const isCardiacData = app.currentMetric && 
        (app.currentMetric.toLowerCase().includes('hr') || 
         app.currentMetric.toLowerCase().includes('heart'));
    
    // Update central pulse circle with simplified calculations
    if (pulseCircle) {
      // Size based on metric type
      const minSize = 50;
      const maxSize = 120;
      const size = minSize + normalizedValue * (maxSize - minSize);
      
      // Apply size
      pulseCircle.style.width = `${size}px`;
      pulseCircle.style.height = `${size}px`;
      
      // Color and glow based on metric - GREEN-BLUE THEME
      const hue = 120 + normalizedValue * 120; // Green to blue (120-240)
      pulseCircle.style.backgroundColor = `hsla(${hue}, 80%, 50%, 0.3)`;
      pulseCircle.style.boxShadow = `0 0 ${15 + normalizedValue * 15}px hsla(${hue}, 80%, 50%, 0.3)`;
    }
    
    // Update value display
    if (valueDisplay) {
      // Show current value in the center
      const valueElem = valueDisplay.querySelector('.value');
      if (valueElem) {
        valueElem.textContent = Math.round(currentValue);
      }
      
      // Add units if needed
      let units = '';
      if (isCardiacData) {
        units = 'BPM';
      } else if (app.currentMetric && app.currentMetric.toLowerCase().includes('temp')) {
        units = '°C';
      }
      
      // Check if units span exists
      const unitsSpan = valueDisplay.querySelector('.units');
      if (units) {
        if (unitsSpan) {
          unitsSpan.textContent = units;
        } else {
          const newUnitsSpan = document.createElement('span');
          newUnitsSpan.className = 'units';
          newUnitsSpan.style.fontSize = '14px';
          newUnitsSpan.style.opacity = '0.8';
          newUnitsSpan.textContent = units;
          valueDisplay.appendChild(newUnitsSpan);
        }
      } else if (unitsSpan) {
        unitsSpan.textContent = '';
      }
    }
    
    // Skip audio visualization if animations are disabled
    if (!CIRCULAR_CONFIG.ANIMATION_ENABLED) return;
    
    // Get audio data for visualization
    let frequencyData = new Uint8Array(32).fill(0);
    
    // Get audio data from the right source
    if (window.customAudioAnalyser && window.customAudioDataArray) {
      window.customAudioAnalyser.getByteFrequencyData(window.customAudioDataArray);
      frequencyData = window.customAudioDataArray;
    } else if (audioDataArray && app.isPlaying) {
      analyser.getByteFrequencyData(audioDataArray);
      frequencyData = audioDataArray;
    }
    
    // Process frequency data with less smoothing
    for (let i = 0; i < Math.min(frequencyData.length, window.frequencyHistory.length); i++) {
      // Simple smoothing with less history dependence
      window.frequencyHistory[i] = window.frequencyHistory[i] * 0.7 + (frequencyData[i] / 255) * 0.3;
    }
    
    // Update only a subset of frequency bars for better performance
    const bars = container.querySelectorAll('.frequency-bar');
    if (bars.length > 0) {
      // Only update half the bars each cycle for better performance
      const startIdx = now % 2 === 0 ? 0 : Math.floor(bars.length / 2);
      const endIdx = startIdx + Math.floor(bars.length / 2);
      
      for (let i = startIdx; i < endIdx; i++) {
        const innerBar = bars[i].querySelector('.frequency-bar-inner');
        if (!innerBar) continue;
        
        // Get frequency bin for this bar (with looping for smaller array)
        const frequencyBin = i % window.frequencyHistory.length;
        let audioReactiveValue = window.frequencyHistory[frequencyBin];
        
        // Simplified bar height calculation
        const barHeight = 10 + (audioReactiveValue * 40) + (normalizedValue * 30);
        
        // Simplified color calculation - Green to Blue
        const hue = 120 + (normalizedValue * 120);
        const barColor = `hsl(${hue}, 80%, 50%)`;
        
        // Apply height and color
        innerBar.style.height = `${Math.min(150, barHeight)}px`;
        innerBar.style.backgroundColor = barColor;
        
        // Update glow if present (only every 4th bar has it)
        const glowEffect = bars[i].querySelector('.frequency-bar-glow');
        if (glowEffect) {
          glowEffect.style.height = `${Math.min(150, barHeight * 1.2)}px`;
          glowEffect.style.backgroundColor = barColor;
          glowEffect.style.opacity = audioReactiveValue * 0.6;
        }
      }
    }
    
    // Update background glow
    const bgGlow = container.querySelector('.circular-bg-glow');
    if (bgGlow) {
      // Green to blue for other metrics
      const hue = 120 + (normalizedValue * 120);
      bgGlow.style.backgroundColor = `hsla(${hue}, 70%, 40%, 0.15)`;
      bgGlow.style.boxShadow = `0 0 ${30 + normalizedValue * 30}px hsla(${hue}, 70%, 40%, 0.3)`;
    }
  }