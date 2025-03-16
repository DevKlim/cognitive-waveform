/**
 * enhancement-integrator.js
 * 
 * This file integrates the enhanced modern UI and visualizations
 * with the existing Cognitive Waveform code structure.
 * Place this file in the js/ directory and include it in visualizer.html
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Enhancement integrator initializing...');
    
    // Add modern fonts
    addModernFonts();
    
    // Add enhanced styles
    injectEnhancedStyles();
    
    // Apply enhancements after a slight delay to ensure the app is initialized
    setTimeout(enhanceUI, 1000);
  });
  
  /**
   * Add modern typography
   */
  function addModernFonts() {
    if (!document.getElementById('modern-fonts')) {
      const fontLink = document.createElement('link');
      fontLink.id = 'modern-fonts';
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@600;700;800&display=swap';
      document.head.appendChild(fontLink);
      console.log('Modern fonts added');
    }
  }
  
  /**
   * Inject enhanced styles
   */
  function injectEnhancedStyles() {
    if (document.getElementById('enhanced-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'enhanced-styles';
    styleElement.textContent = `
      /* Base typography improvements */
      body, button, select, input {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      h1, h2, h3, .logo-small span, .current-selection, .sidebar .logo-container span {
        font-family: 'Montserrat', sans-serif;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      
      /* App title styling */
      .app-title {
        font-size: 68px;
        background: linear-gradient(90deg, #1DB954 0%, #1ED760 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-top: 15px;
        letter-spacing: -0.03em;
      }
      
      /* Enhance base styles */
      body {
        background-color: #121212;
      }
      
      /* Header info styling */
      .header-info {
        background: linear-gradient(180deg, rgba(24,24,24,0.8) 0%, rgba(30,30,30,0.7) 100%);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transition: all 0.3s;
        padding: 25px;
      }
      
      .header-info:hover {
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        transform: translateY(-2px);
      }
      
      .current-selection {
        background: linear-gradient(90deg, #ffffff 0%, #b3b3b3 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 32px;
        margin-bottom: 8px;
      }
      
      .subtitle {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 400;
      }
      
      /* Selection panel improvements */
      .selection-panel {
        background: linear-gradient(180deg, rgba(24,24,24,0.8) 0%, rgba(30,30,30,0.7) 100%);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        padding: 25px;
        transition: all 0.3s;
      }
      
      .selection-panel:hover {
        border-color: rgba(255, 255, 255, 0.1);
      }
      
      .dropdown-container {
        margin-bottom: 10px;
      }
      
      .dropdown-label {
        font-weight: 500;
        margin-right: 12px;
        min-width: 100px;
        color: rgba(255, 255, 255, 0.9);
      }
      
      .select-dropdown {
        background-color: rgba(40, 40, 40, 0.7);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 10px 15px;
        font-size: 14px;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      .select-dropdown:hover {
        background-color: rgba(50, 50, 50, 0.7);
        border-color: rgba(29, 185, 84, 0.3);
      }
      
      /* Player control enhancements */
      .player-controls {
        background: linear-gradient(180deg, rgba(18,18,18,0.8) 0%, rgba(24,24,24,0.7) 100%);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        padding: 25px;
        margin-bottom: 20px;
      }
      
      .timeline {
        height: 6px;
        background-color: rgba(83, 83, 83, 0.3);
        border-radius: 3px;
        cursor: pointer;
        overflow: visible;
      }
      
      .timeline-progress {
        height: 100%;
        background: linear-gradient(90deg, #1db954 0%, #1ed760 100%);
        border-radius: 3px;
      }
      
      .timeline-handle {
        width: 14px;
        height: 14px;
        background-color: #fff;
        border: 3px solid #1db954;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      .timeline-handle:hover {
        transform: translate(-50%, -50%) scale(1.2);
        box-shadow: 0 0 10px rgba(29, 185, 84, 0.5);
      }
      
      .play-btn {
        background: linear-gradient(145deg, #1db954, #1ed760);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
      }
      
      .play-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 24px rgba(29, 185, 84, 0.3);
      }
      
      .control-btn {
        background-color: rgba(40, 40, 40, 0.7);
        border-radius: 50%;
        transition: all 0.2s;
      }
      
      .control-btn:hover {
        background-color: rgba(60, 60, 60, 0.7);
        transform: scale(1.1);
      }
      
      /* Side panel improvements */
      .sidebar {
        background: linear-gradient(180deg, rgba(8,8,8,0.95) 0%, rgba(15,15,15,0.95) 100%);
        backdrop-filter: blur(10px);
        box-shadow: 5px 0 20px rgba(0, 0, 0, 0.5);
      }
      
      .sidebar-album {
        background-color: rgba(24, 24, 24, 0.7);
        border-radius: 8px;
        transition: all 0.2s;
        padding: 10px;
        margin-bottom: 10px;
      }
      
      .sidebar-album:hover {
        background-color: rgba(40, 40, 40, 0.7);
        transform: translateX(5px);
      }
      
      .sidebar-album.active {
        background-color: #1db954;
      }
      
      .toggle-sidebar-btn {
        background-color: #1db954;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: all 0.2s;
      }
      
      .toggle-sidebar-btn:hover {
        transform: scale(1.1);
        background-color: #1ed760;
      }
      
      /* Enhanced animations */
      @keyframes glow-pulse {
        0% { filter: drop-shadow(0 0 3px rgba(29, 185, 84, 0.5)); }
        50% { filter: drop-shadow(0 0 8px rgba(29, 185, 84, 0.7)); }
        100% { filter: drop-shadow(0 0 3px rgba(29, 185, 84, 0.5)); }
      }
      
      .logo-small svg {
        animation: glow-pulse 3s infinite alternate;
      }
      
      /* Enhanced back button */
      .back-button {
        background: rgba(40, 40, 40, 0.7);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 8px 16px;
        font-size: 14px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .back-button:hover {
        background: rgba(60, 60, 60, 0.7);
        transform: translateX(-5px);
        border-color: rgba(29, 185, 84, 0.3);
      }
      
      /* Slider improvements */
      input[type="range"] {
        height: 6px;
        background-color: #535353;
        border-radius: 3px;
        appearance: none;
        outline: none;
      }
      
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        background-color: #fff;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        transition: transform 0.2s;
      }
      
      input[type="range"]:hover::-webkit-slider-thumb {
        transform: scale(1.2);
        box-shadow: 0 0 10px rgba(29, 185, 84, 0.5);
      }
      
      input[type="range"]::-moz-range-thumb {
        width: 14px;
        height: 14px;
        background-color: #fff;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        border: none;
        transition: transform 0.2s;
      }
      
      input[type="range"]:hover::-moz-range-thumb {
        transform: scale(1.2);
        box-shadow: 0 0 10px rgba(29, 185, 84, 0.5);
      }
      
      /* Sound profile enhancements */
      .sound-profile-container {
        background-color: rgba(24, 24, 24, 0.7);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 10px 15px;
        margin-top: 15px;
        animation: fadeIn 0.5s;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    
    document.head.appendChild(styleElement);
    console.log('Enhanced styles injected');
  }
  
  /**
   * Apply UI enhancements to various components
   */
  function enhanceUI() {
    // Enhance chart visualization if initChart exists
    if (typeof initChart === 'function') {
      // Store original function
      const originalInitChart = window.initChart;
      
      // Replace with enhanced version
      window.initChart = function() {
        console.log('Enhanced chart visualization being applied');
        // Call original chart initialization
        originalInitChart.apply(this, arguments);
        
        // Apply additional enhancements to the chart
        enhanceChartAppearance();
      };
      
      // Force redraw of the chart with enhancements
      if (typeof app !== 'undefined' && app.data && app.data.filtered.length > 0) {
        initChart();
      }
    }
    
    // Enhance waveform if updateWaveform exists
    if (typeof updateWaveform === 'function') {
      // Store original function
      const originalUpdateWaveform = window.updateWaveform;
      
      // Replace with enhanced version
      window.updateWaveform = function() {
        console.log('Enhanced waveform visualization being applied');
        // Call original function
        originalUpdateWaveform.apply(this, arguments);
        
        // Apply additional waveform enhancements
        enhanceWaveformAppearance();
      };
      
      // Update waveform with enhancements
      updateWaveform();
    }
    
    // Enhance circular wave if updateCircularWave exists
    if (typeof updateCircularWave === 'function') {
      // Store original function
      const originalUpdateCircularWave = window.updateCircularWave;
      
      // Replace with enhanced version
      window.updateCircularWave = function() {
        console.log('Enhanced circular wave being applied');
        // Call original function
        originalUpdateCircularWave.apply(this, arguments);
        
        // Apply additional circular wave enhancements
        enhanceCircularWaveAppearance();
      };
      
      // Update circular wave with enhancements
      updateCircularWave();
    }
    
    // Enhance bottom wave
    if (typeof initBottomWave === 'function') {
      // Store original function
      const originalInitBottomWave = window.initBottomWave;
      
      // Replace with enhanced version
      window.initBottomWave = function() {
        console.log('Enhanced bottom wave being applied');
        // Call original function
        originalInitBottomWave.apply(this, arguments);
        
        // Apply additional enhancements
        enhanceBottomWaveAppearance();
      };
      
      // Reinitialize bottom wave
      initBottomWave();
    }
    
    // Apply enhancements to UI elements
    enhanceUIElements();
    
    console.log('All UI enhancements applied successfully');
  }
  
  /**
   * Enhance chart appearance with modern styling
   */
  function enhanceChartAppearance() {
    if (!app.chart.svg) return;
    
    const svg = app.chart.svg;
    
    // Apply styles to chart elements
    svg.selectAll('.axis text')
       .attr('font-family', "'Inter', sans-serif")
       .attr('font-size', '12px')
       .attr('font-weight', '500')
       .attr('fill', 'rgba(255, 255, 255, 0.7)');
    
    svg.selectAll('.axis line, .axis path')
       .attr('stroke', 'rgba(255, 255, 255, 0.1)');
    
    svg.selectAll('.heart-rate-line')
       .attr('stroke', 'url(#line-gradient)')
       .attr('stroke-width', '3')
       .attr('stroke-linecap', 'round')
       .attr('stroke-linejoin', 'round')
       .style('filter', 'drop-shadow(0 0 4px rgba(29, 185, 84, 0.3))');
       
    // Add gradient if it doesn't exist
    if (svg.select('defs').empty()) {
      const defs = svg.append('defs');
      
      // Add gradient for line
      const lineGradient = defs.append('linearGradient')
        .attr('id', 'line-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
        
      lineGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#1db954');
        
      lineGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#4a90e2');
    }
    
    // Enhance current time line
    svg.select('#current-time-line')
       .attr('stroke', 'rgba(255, 255, 255, 0.7)')
       .attr('stroke-width', '1.5')
       .attr('stroke-dasharray', '3,3')
       .style('filter', 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.3))');
  }
  
  /**
   * Enhance waveform appearance
   */
  function enhanceWaveformAppearance() {
    const container = document.getElementById('waveform-container');
    if (!container) return;
    
    // Add glass morphism effect
    container.style.background = 'linear-gradient(180deg, rgba(18,18,18,0.8) 0%, rgba(24,24,24,0.7) 100%)';
    container.style.backdropFilter = 'blur(10px)';
    container.style.webkitBackdropFilter = 'blur(10px)';
    container.style.borderRadius = '12px';
    container.style.border = '1px solid rgba(255, 255, 255, 0.05)';
    container.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
    
    // Enhance center line
    const centerLine = container.querySelector('.waveform-center-line');
    if (centerLine) {
      centerLine.style.background = 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 10%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 90%, transparent 100%)';
    }
    
    // Enhance metric display
    const metricDisplay = container.querySelector('#metric-display');
    if (metricDisplay) {
      metricDisplay.style.background = 'rgba(0, 0, 0, 0.7)';
      metricDisplay.style.backdropFilter = 'blur(4px)';
      metricDisplay.style.webkitBackdropFilter = 'blur(4px)';
      metricDisplay.style.padding = '8px 12px';
      metricDisplay.style.borderRadius = '20px';
      metricDisplay.style.fontSize = '13px';
      metricDisplay.style.fontWeight = '600';
      metricDisplay.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      metricDisplay.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    }
    
    // Enhance waveform bars with animation
    const bars = container.querySelectorAll('.waveform-bar');
    bars.forEach(bar => {
      bar.style.borderRadius = '2px';
      bar.style.transition = 'height 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.2s';
      
      // Add active class to bars near center
      const leftPosition = parseFloat(bar.style.left);
      const containerWidth = container.clientWidth;
      const centerPosition = containerWidth / 2;
      
      // If bar is close to center, add active class
      if (Math.abs(leftPosition - centerPosition) < 15) {
        bar.classList.add('active');
      }
    });
  }
  
  /**
   * Enhance circular wave appearance
   */
  function enhanceCircularWaveAppearance() {
    const container = document.getElementById('pulse-container');
    if (!container) return;
    
    // Add glass morphism effect
    container.style.background = 'linear-gradient(180deg, rgba(18,18,18,0.8) 0%, rgba(24,24,24,0.7) 100%)';
    container.style.backdropFilter = 'blur(10px)';
    container.style.webkitBackdropFilter = 'blur(10px)';
    container.style.borderRadius = '12px';
    container.style.border = '1px solid rgba(255, 255, 255, 0.05)';
    container.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
    
    // Add radial gradient background
    if (!container.querySelector('.bg-gradient')) {
      const bgGradient = document.createElement('div');
      bgGradient.className = 'bg-gradient';
      bgGradient.style.position = 'absolute';
      bgGradient.style.top = '0';
      bgGradient.style.left = '0';
      bgGradient.style.width = '100%';
      bgGradient.style.height = '100%';
      bgGradient.style.background = 'radial-gradient(circle at center, rgba(29, 185, 84, 0.05) 0%, transparent 70%)';
      bgGradient.style.pointerEvents = 'none';
      bgGradient.style.zIndex = '1';
      container.appendChild(bgGradient);
    }
    
    // Enhance pulse circle
    const pulseCircle = container.querySelector('#pulse-circle');
    if (pulseCircle) {
      pulseCircle.style.background = 'radial-gradient(circle, rgba(29, 185, 84, 0.4) 0%, rgba(29, 185, 84, 0.2) 70%)';
      pulseCircle.style.boxShadow = '0 0 30px rgba(29, 185, 84, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.2)';
    }
    
    // Enhance value display
    const valueDisplay = container.querySelector('#circular-value-display');
    if (valueDisplay) {
      valueDisplay.style.fontFamily = "'Montserrat', sans-serif";
      valueDisplay.style.fontWeight = '700';
      valueDisplay.style.fontSize = '28px';
      valueDisplay.style.background = 'linear-gradient(90deg, #ffffff 0%, #e0e0e0 100%)';
      valueDisplay.style.webkitBackgroundClip = 'text';
      valueDisplay.style.backgroundClip = 'text';
      valueDisplay.style.webkitTextFillColor = 'transparent';
      valueDisplay.style.textShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    }
    
    // Enhance frequency bars
    const freqBars = container.querySelectorAll('.frequency-bar-inner');
    freqBars.forEach(bar => {
      bar.style.transition = 'height 0.05s ease, background-color 0.2s';
      bar.style.borderRadius = '2px';
    });
    
    // Enhance glow elements
    const glowElements = container.querySelectorAll('.frequency-bar-glow');
    glowElements.forEach(glow => {
      glow.style.filter = 'blur(4px)';
      glow.style.opacity = '0.6';
    });
    
    // Enhance pulse rings
    const pulseRings = container.querySelectorAll('.pulse-ring');
    pulseRings.forEach(ring => {
      ring.style.border = '1px solid rgba(29, 185, 84, 0.2)';
      ring.style.boxShadow = '0 0 20px rgba(29, 185, 84, 0.1)';
    });
  }
  
  /**
   * Enhance bottom wave appearance
   */
  function enhanceBottomWaveAppearance() {
    const container = document.getElementById('bottom-wave-container');
    if (!container) return;
    
    // Enhance opacity and transitions
    container.style.opacity = '0.7';
    container.style.transition = 'opacity 0.5s';
    
    // Add hover effect
    container.addEventListener('mouseenter', () => {
      container.style.opacity = '0.85';
    });
    
    container.addEventListener('mouseleave', () => {
      container.style.opacity = '0.7';
    });
    
    // Enhance wave paths
    const wavePaths = container.querySelectorAll('path');
    wavePaths.forEach((path, index) => {
      // Add animation to wave paths
      path.style.animation = 'wave-pulse 8s ease-in-out infinite';
      path.style.animationDelay = `${index * 2}s`;
      
      // Set colors based on index
      if (index === 0) {
        path.setAttribute('fill', 'rgba(29, 185, 84, 0.15)');
      } else if (index === 1) {
        path.setAttribute('fill', 'rgba(29, 185, 84, 0.1)');
      } else {
        path.setAttribute('fill', 'rgba(74, 144, 226, 0.1)');
      }
    });
  }
  
  /**
   * Enhance UI elements throughout the app
   */
  function enhanceUIElements() {
    // Enhance player controls
    const playerControls = document.querySelector('.player-controls');
    if (playerControls) {
      playerControls.style.background = 'linear-gradient(180deg, rgba(18,18,18,0.8) 0%, rgba(24,24,24,0.7) 100%)';
      playerControls.style.backdropFilter = 'blur(10px)';
      playerControls.style.webkitBackdropFilter = 'blur(10px)';
      playerControls.style.borderRadius = '12px';
      playerControls.style.border = '1px solid rgba(255, 255, 255, 0.05)';
      playerControls.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
    }
    
    // Enhance play button
    const playBtn = document.querySelector('.play-btn');
    if (playBtn) {
      playBtn.style.background = 'linear-gradient(145deg, #1db954, #1ed760)';
      playBtn.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
      playBtn.style.transition = 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)';
      
      playBtn.addEventListener('mouseenter', () => {
        playBtn.style.transform = 'scale(1.05)';
        playBtn.style.boxShadow = '0 8px 24px rgba(29, 185, 84, 0.3)';
      });
      
      playBtn.addEventListener('mouseleave', () => {
        playBtn.style.transform = '';
        playBtn.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
      });
    }
    
    // Enhance control buttons
    const controlBtns = document.querySelectorAll('.control-btn');
    controlBtns.forEach(btn => {
      btn.style.backgroundColor = 'rgba(40, 40, 40, 0.7)';
      btn.style.borderRadius = '50%';
      btn.style.transition = 'all 0.2s';
      
      btn.addEventListener('mouseenter', () => {
        btn.style.backgroundColor = 'rgba(60, 60, 60, 0.7)';
        btn.style.transform = 'scale(1.1)';
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.backgroundColor = 'rgba(40, 40, 40, 0.7)';
        btn.style.transform = '';
      });
    });
    
    // Enhance timeline
    const timeline = document.querySelector('.timeline');
    if (timeline) {
      timeline.style.height = '6px';
      timeline.style.backgroundColor = 'rgba(83, 83, 83, 0.3)';
      timeline.style.borderRadius = '3px';
    }
    
    // Enhance timeline progress
    const timelineProgress = document.querySelector('.timeline-progress');
    if (timelineProgress) {
      timelineProgress.style.background = 'linear-gradient(90deg, #1db954 0%, #1ed760 100%)';
    }
    
    // Enhance timeline handle
    const timelineHandle = document.querySelector('.timeline-handle');
    if (timelineHandle) {
      timelineHandle.style.width = '14px';
      timelineHandle.style.height = '14px';
      timelineHandle.style.backgroundColor = '#fff';
      timelineHandle.style.border = '3px solid #1db954';
      timelineHandle.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.4)';
      timelineHandle.style.transition = 'transform 0.2s, box-shadow 0.2s';
      
      timelineHandle.addEventListener('mouseenter', () => {
        timelineHandle.style.transform = 'translate(-50%, -50%) scale(1.2)';
        timelineHandle.style.boxShadow = '0 0 10px rgba(29, 185, 84, 0.5)';
      });
      
      timelineHandle.addEventListener('mouseleave', () => {
        timelineHandle.style.transform = 'translate(-50%, -50%)';
        timelineHandle.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.4)';
      });
    }
    
    // Enhance sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.style.background = 'linear-gradient(180deg, rgba(8,8,8,0.95) 0%, rgba(15,15,15,0.95) 100%)';
      sidebar.style.backdropFilter = 'blur(10px)';
      sidebar.style.boxShadow = '5px 0 20px rgba(0, 0, 0, 0.5)';
    }
    
    // Enhance sidebar albums
    const sidebarAlbums = document.querySelectorAll('.sidebar-album');
    sidebarAlbums.forEach(album => {
      album.style.backgroundColor = 'rgba(24, 24, 24, 0.7)';
      album.style.borderRadius = '8px';
      album.style.transition = 'all 0.2s';
      album.style.margin = '0 0 10px 0';
      
      album.addEventListener('mouseenter', () => {
        if (!album.classList.contains('active')) {
          album.style.backgroundColor = 'rgba(40, 40, 40, 0.7)';
          album.style.transform = 'translateX(5px)';
        }
      });
      
      album.addEventListener('mouseleave', () => {
        if (!album.classList.contains('active')) {
          album.style.backgroundColor = 'rgba(24, 24, 24, 0.7)';
          album.style.transform = '';
        }
      });
    });
    
    // Enhance toggle sidebar button
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    if (toggleSidebarBtn) {
      toggleSidebarBtn.style.backgroundColor = '#1db954';
      toggleSidebarBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
      toggleSidebarBtn.style.transition = 'all 0.2s';
      
      toggleSidebarBtn.addEventListener('mouseenter', () => {
        toggleSidebarBtn.style.transform = 'scale(1.1)';
        toggleSidebarBtn.style.backgroundColor = '#1ed760';
      });
      
      toggleSidebarBtn.addEventListener('mouseleave', () => {
        toggleSidebarBtn.style.transform = '';
        toggleSidebarBtn.style.backgroundColor = '#1db954';
      });
    }
    
    // Enhance sound profile section 
    const soundProfileContainer = document.getElementById('sound-profile-container');
    if (soundProfileContainer) {
      soundProfileContainer.style.backgroundColor = 'rgba(24, 24, 24, 0.7)';
      soundProfileContainer.style.borderRadius = '8px';
      soundProfileContainer.style.border = '1px solid rgba(255, 255, 255, 0.05)';
      soundProfileContainer.style.padding = '15px';
      soundProfileContainer.style.marginTop = '15px';
    }
  }