/**
 * Improved custom waveform creator interface with drawing and audio upload capabilities
 */

/**
 * Initialize custom waveform interface
 */
function initCustomWaveformInterface() {
    // Find the sound profile container
    const container = document.getElementById('sound-profile-container');
    if (!container) return;
    
    // Create waveform controls section if it doesn't exist
    if (!document.getElementById('custom-waveform-controls')) {
      // Create controls container
      const controlsContainer = document.createElement('div');
      controlsContainer.id = 'custom-waveform-controls';
      controlsContainer.className = 'custom-waveform-controls hidden';
      
      // Create waveform editor button
      const editorButton = document.createElement('button');
      editorButton.id = 'open-waveform-editor';
      editorButton.className = 'custom-waveform-btn';
      editorButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
        Create Waveform
      `;
      editorButton.addEventListener('click', openWaveformEditor);
      
      // Create audio upload button 
      const uploadButton = document.createElement('button');
      uploadButton.id = 'open-audio-upload';
      uploadButton.className = 'custom-waveform-btn';
      uploadButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
        </svg>
        Upload Audio
      `;
      uploadButton.addEventListener('click', openAudioUpload);
      
      // Add description
      const description = document.createElement('div');
      description.className = 'sound-profile-description';
      description.textContent = 'Draw a custom waveform or upload audio to visualize your data with unique sounds';
      
      // Add elements to container
      controlsContainer.appendChild(description);
      controlsContainer.appendChild(editorButton);
      controlsContainer.appendChild(uploadButton);
      
      // Add to sound profile container
      container.appendChild(controlsContainer);
      
      // Show controls when custom waveform is selected
      const soundProfileDropdown = document.getElementById('sound-profile-dropdown');
      if (soundProfileDropdown) {
        soundProfileDropdown.addEventListener('change', function() {
          const isCustomWaveform = this.value === 'custom_wave';
          controlsContainer.classList.toggle('hidden', !isCustomWaveform);
        });
      }
      
      // Create the modal for waveform drawing
      createWaveformDrawingModal();
    }
  }
  
  /**
   * Create the waveform drawing modal
   */
  function createWaveformDrawingModal() {
    if (document.getElementById('waveform-drawing-modal')) return;
    
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'waveform-drawing-modal';
    modal.className = 'waveform-drawing-modal';
    
    // Create modal content
    modal.innerHTML = `
      <div class="waveform-modal-content">
        <div class="waveform-modal-header">
          <h2>Create Custom Waveform</h2>
          <button class="close-waveform-modal">&times;</button>
        </div>
        
        <div class="waveform-tabs">
          <button class="waveform-tab active" data-tab="draw">Draw Mode</button>
          <button class="waveform-tab" data-tab="presets">Presets</button>
          <button class="waveform-tab" data-tab="harmonics">Harmonics</button>
        </div>
        
        <div id="tab-draw" class="tab-content active">
          <div class="drawing-canvas-container">
            <canvas id="waveform-drawing-canvas"></canvas>
            <div class="drawing-guidelines">Draw your waveform from left to right</div>
          </div>
          
          <div class="control-options">
            <button id="clear-canvas" class="waveform-control-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              Clear
            </button>
            <button id="smooth-wave" class="waveform-control-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 16h5v-2H3v2zm6.5 0h5v-2h-5v2zm6.5 0h5v-2h-5v2zM3 20h2v-2H3v2zm4 0h2v-2H7v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zM3 12h8v-2H3v2zm10 0h8v-2h-8v2zM3 4v4h18V4H3z"/>
              </svg>
              Smooth
            </button>
            <div class="color-selector">
              <label>Color:</label>
              <input type="color" id="wave-color" value="#1db954">
            </div>
          </div>
          
          <div class="waveform-drawing-instructions">
            <p>Draw your waveform pattern by clicking and dragging in the canvas above. The pattern will repeat to create your sound.</p>
          </div>
        </div>
        
        <div id="tab-presets" class="tab-content">
          <div class="waveform-presets">
            <button class="preset-button active" data-preset="sine">Sine</button>
            <button class="preset-button" data-preset="triangle">Triangle</button>
            <button class="preset-button" data-preset="square">Square</button>
            <button class="preset-button" data-preset="sawtooth">Sawtooth</button>
            <button class="preset-button" data-preset="noise">Noise</button>
            <button class="preset-button" data-preset="pulse">Pulse</button>
          </div>
          
          <div class="drawing-canvas-container">
            <canvas id="preset-preview-canvas"></canvas>
          </div>
          
          <div class="mode-toggles">
            <div class="mode-label">
              <label for="modify-preset">Modify Preset:</label>
              <label class="mode-toggle">
                <input type="checkbox" id="modify-preset">
                <span class="mode-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        
        <div id="tab-harmonics" class="tab-content">
          <div class="waveform-drawing-instructions">
            <p>Adjust the harmonic sliders to create complex tones. Each harmonic adds a frequency component to your sound.</p>
          </div>
          
          <div id="harmonics-sliders" class="harmonics-sliders">
            <!-- Sliders will be added dynamically -->
          </div>
          
          <div class="drawing-canvas-container">
            <canvas id="harmonics-preview-canvas"></canvas>
          </div>
        </div>
        
        <div class="waveform-preview">
          <div class="preview-label">Waveform Preview</div>
          <div class="preview-visualizer">
            <div id="preview-wave" class="preview-wave"></div>
          </div>
          <button id="play-preview" class="waveform-control-btn primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play Preview
          </button>
        </div>
        
        <div class="button-group">
          <button id="apply-waveform" class="waveform-control-btn primary">Apply Waveform</button>
          <button id="cancel-waveform" class="waveform-control-btn">Cancel</button>
        </div>
      </div>
    `;
    
    // Add modal to document
    document.body.appendChild(modal);
    
    // Set up event listeners
    setupWaveformModalEvents();
  }
  
  /**
   * Set up event listeners for the waveform modal
   */
  function setupWaveformModalEvents() {
    // Tab switching
    const tabs = document.querySelectorAll('.waveform-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Hide all tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Show selected tab content
        const tabId = `tab-${tab.dataset.tab}`;
        document.getElementById(tabId).classList.add('active');
        
        // Initialize canvas for the selected tab
        if (tab.dataset.tab === 'draw') {
          initDrawingCanvas();
        } else if (tab.dataset.tab === 'presets') {
          initPresetCanvas();
        } else if (tab.dataset.tab === 'harmonics') {
          initHarmonicsSliders();
          updateHarmonicsPreview();
        }
      });
    });
    
    // Close modal events
    const closeBtn = document.querySelector('.close-waveform-modal');
    const cancelBtn = document.getElementById('cancel-waveform');
    const closeModal = () => {
      document.getElementById('waveform-drawing-modal').style.display = 'none';
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Apply waveform
    const applyBtn = document.getElementById('apply-waveform');
    applyBtn.addEventListener('click', () => {
      applyCustomWaveform();
      closeModal();
    });
    
    // Drawing canvas events
    const clearBtn = document.getElementById('clear-canvas');
    const smoothBtn = document.getElementById('smooth-wave');
    
    clearBtn.addEventListener('click', clearDrawingCanvas);
    smoothBtn.addEventListener('click', smoothDrawnWave);
    
    // Color picker
    const colorPicker = document.getElementById('wave-color');
    colorPicker.addEventListener('change', updateDrawingColor);
    
    // Preset buttons
    const presetButtons = document.querySelectorAll('.preset-button');
    presetButtons.forEach(button => {
      button.addEventListener('click', () => {
        presetButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const preset = button.dataset.preset;
        updatePresetCanvas(preset);
      });
    });
    
    // Preview playback
    const playPreviewBtn = document.getElementById('play-preview');
    playPreviewBtn.addEventListener('click', togglePreviewPlayback);
    
    // Initialize the first tab content
    initDrawingCanvas();
  }
  
  /**
   * Initialize the drawing canvas
   */
  function initDrawingCanvas() {
    const canvas = document.getElementById('waveform-drawing-canvas');
    if (!canvas) return;
    
    // Set canvas dimensions based on container size
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Get drawing context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Set up drawing state
    window.drawingState = {
      isDrawing: false,
      path: [],
      color: '#1db954',
      ctx: ctx
    };
    
    // Set initial drawing style
    ctx.strokeStyle = window.drawingState.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Add event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch support
    canvas.addEventListener('touchstart', handleTouch(startDrawing), { passive: false });
    canvas.addEventListener('touchmove', handleTouch(draw), { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
  }
  
  /**
   * Start drawing on canvas
   */
  function startDrawing(e) {
    if (!window.drawingState) return;
    
    window.drawingState.isDrawing = true;
    
    const canvas = document.getElementById('waveform-drawing-canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    window.drawingState.path = [{x, y}];
    
    window.drawingState.ctx.beginPath();
    window.drawingState.ctx.moveTo(x, y);
    window.drawingState.ctx.lineTo(x, y);
    window.drawingState.ctx.stroke();
    
    // Update preview
    updatePreviewWave();
    
    if (e.preventDefault) e.preventDefault();
  }
  
  /**
   * Draw on canvas
   */
  function draw(e) {
    if (!window.drawingState || !window.drawingState.isDrawing) return;
    
    const canvas = document.getElementById('waveform-drawing-canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    window.drawingState.path.push({x, y});
    
    window.drawingState.ctx.lineTo(x, y);
    window.drawingState.ctx.stroke();
    
    // Update preview
    updatePreviewWave();
    
    if (e.preventDefault) e.preventDefault();
  }
  
  /**
   * Stop drawing
   */
  function stopDrawing() {
    if (!window.drawingState) return;
    
    if (window.drawingState.isDrawing) {
      window.drawingState.isDrawing = false;
      
      // Sort path points by x position to ensure left-to-right ordering
      window.drawingState.path.sort((a, b) => a.x - b.x);
      
      // Update preview with the final path
      updatePreviewWave();
    }
  }
  
  /**
   * Handle touch events
   */
  function handleTouch(eventHandler) {
    return function(e) {
      e.preventDefault(); // Prevent scrolling
      eventHandler(e);
    };
  }
  
  /**
   * Clear the drawing canvas
   */
  function clearDrawingCanvas() {
    const canvas = document.getElementById('waveform-drawing-canvas');
    if (!canvas || !window.drawingState || !window.drawingState.ctx) return;
    
    const ctx = window.drawingState.ctx;
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw center line
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Reset drawing style
    ctx.strokeStyle = window.drawingState.color;
    ctx.lineWidth = 3;
    
    // Clear path
    window.drawingState.path = [];
    
    // Update preview
    updatePreviewWave();
  }
  
  /**
   * Smooth the drawn waveform
   */
  function smoothDrawnWave() {
    if (!window.drawingState || window.drawingState.path.length < 3) {
      console.log('Not enough points to smooth');
      return;
    }
    
    // Create a new smoothed path
    const smoothedPath = [];
    
    // Apply a moving average filter
    const windowSize = 5;
    
    for (let i = 0; i < window.drawingState.path.length; i++) {
      let sumX = 0;
      let sumY = 0;
      let count = 0;
      
      // Calculate window bounds
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(window.drawingState.path.length - 1, i + Math.floor(windowSize / 2));
      
      // Calculate average within window
      for (let j = start; j <= end; j++) {
        sumX += window.drawingState.path[j].x;
        sumY += window.drawingState.path[j].y;
        count++;
      }
      
      smoothedPath.push({
        x: sumX / count,
        y: sumY / count
      });
    }
    
    // Redraw with smoothed path
    const canvas = document.getElementById('waveform-drawing-canvas');
    if (!canvas || !window.drawingState.ctx) return;
    
    const ctx = window.drawingState.ctx;
    
    // Clear canvas
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw center line
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Draw smoothed path
    ctx.strokeStyle = window.drawingState.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(smoothedPath[0].x, smoothedPath[0].y);
    
    for (let i = 1; i < smoothedPath.length; i++) {
      ctx.lineTo(smoothedPath[i].x, smoothedPath[i].y);
    }
    
    ctx.stroke();
    
    // Update path
    window.drawingState.path = smoothedPath;
    
    // Update preview
    updatePreviewWave();
  }
  
  /**
   * Update drawing color
   */
  function updateDrawingColor() {
    const colorInput = document.getElementById('wave-color');
    if (!colorInput || !window.drawingState) return;
    
    window.drawingState.color = colorInput.value;
    
    if (window.drawingState.ctx) {
      window.drawingState.ctx.strokeStyle = window.drawingState.color;
      
      // Redraw the current path with the new color
      if (window.drawingState.path.length > 1) {
        const ctx = window.drawingState.ctx;
        ctx.beginPath();
        ctx.moveTo(window.drawingState.path[0].x, window.drawingState.path[0].y);
        
        for (let i = 1; i < window.drawingState.path.length; i++) {
          ctx.lineTo(window.drawingState.path[i].x, window.drawingState.path[i].y);
        }
        
        ctx.stroke();
      }
    }
    
    // Update preview
    updatePreviewWave();
  }
  
  /**
   * Initialize preset canvas
   */
  function initPresetCanvas() {
    const canvas = document.getElementById('preset-preview-canvas');
    if (!canvas) return;
    
    // Set canvas dimensions
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Get drawing context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Initialize with sine wave (default preset)
    updatePresetCanvas('sine');
    
    // Set up modification toggle
    const modifyToggle = document.getElementById('modify-preset');
    modifyToggle.addEventListener('change', function() {
      if (this.checked) {
        // Enable drawing on the preset canvas
        canvas.addEventListener('mousedown', startPresetDrawing);
        canvas.addEventListener('mousemove', drawPreset);
        canvas.addEventListener('mouseup', stopPresetDrawing);
        canvas.addEventListener('mouseout', stopPresetDrawing);
        
        // Touch support
        canvas.addEventListener('touchstart', handleTouch(startPresetDrawing), { passive: false });
        canvas.addEventListener('touchmove', handleTouch(drawPreset), { passive: false });
        canvas.addEventListener('touchend', stopPresetDrawing);
        
        // Update cursor
        canvas.style.cursor = 'crosshair';
      } else {
        // Disable drawing
        canvas.removeEventListener('mousedown', startPresetDrawing);
        canvas.removeEventListener('mousemove', drawPreset);
        canvas.removeEventListener('mouseup', stopPresetDrawing);
        canvas.removeEventListener('mouseout', stopPresetDrawing);
        
        // Touch
        canvas.removeEventListener('touchstart', handleTouch(startPresetDrawing));
        canvas.removeEventListener('touchmove', handleTouch(drawPreset));
        canvas.removeEventListener('touchend', stopPresetDrawing);
        
        // Update cursor
        canvas.style.cursor = 'default';
      }
    });
  }
  
  /**
   * Update preset canvas with selected waveform
   */
  function updatePresetCanvas(presetType) {
    const canvas = document.getElementById('preset-preview-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Draw waveform
    ctx.strokeStyle = '#1db954';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    // Store the path for potential modification
    window.presetPath = [];
    
    // Different wave patterns for different presets
    for (let x = 0; x < canvas.width; x++) {
      const normalizedX = x / canvas.width * 2 * Math.PI;
      let y;
      
      switch (presetType) {
        case 'sine':
          y = Math.sin(normalizedX * 2);
          break;
        case 'triangle':
          y = 2 * Math.asin(Math.sin(normalizedX * 2)) / Math.PI;
          break;
        case 'square':
          y = Math.sign(Math.sin(normalizedX * 2));
          break;
        case 'sawtooth':
          y = (normalizedX % (Math.PI * 2)) / Math.PI - 1;
          break;
        case 'noise':
          // Pseudo-random noise with seed to make it consistent
          const seed = Math.sin(normalizedX * 10) * 10000;
          y = Math.sin(seed) * 0.8;
          break;
        case 'pulse':
          // Narrow pulse wave
          y = Math.sin(normalizedX * 2) > 0.7 ? 1 : -1;
          break;
        default:
          y = Math.sin(normalizedX * 2);
      }
      
      // Scale and position
      const scaledY = canvas.height / 2 - (y * canvas.height / 3);
      
      // Store point in path
      window.presetPath.push({x: x, y: scaledY});
      
      if (x === 0) {
        ctx.moveTo(x, scaledY);
      } else {
        ctx.lineTo(x, scaledY);
      }
    }
    
    ctx.stroke();
    
    // Store the current preset type
    window.currentPreset = presetType;
    
    // Update waveform preview
    updatePreviewWave(window.presetPath);
  }
  
  /**
   * Start drawing on preset canvas
   */
  function startPresetDrawing(e) {
    const canvas = document.getElementById('preset-preview-canvas');
    if (!canvas) return;
    
    window.isPresetDrawing = true;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    // Find the closest point in the preset path
    let closestIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < window.presetPath.length; i++) {
      const point = window.presetPath[i];
      const distance = Math.abs(point.x - x);
      
      if (distance < minDistance) {
        closestIndex = i;
        minDistance = distance;
      }
    }
    
    // Modify that point
    window.presetPath[closestIndex].y = y;
    
    // Redraw the path
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Draw modified path
    ctx.strokeStyle = '#1db954';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(window.presetPath[0].x, window.presetPath[0].y);
    
    for (let i = 1; i < window.presetPath.length; i++) {
      ctx.lineTo(window.presetPath[i].x, window.presetPath[i].y);
    }
    
    ctx.stroke();
    
    // Update preview
    updatePreviewWave(window.presetPath);
    
    if (e.preventDefault) e.preventDefault();
  }
  
  /**
   * Draw on preset canvas
   */
  function drawPreset(e) {
    if (!window.isPresetDrawing) return;
    
    const canvas = document.getElementById('preset-preview-canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    // Find the closest point in the preset path
    let closestIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < window.presetPath.length; i++) {
      const point = window.presetPath[i];
      const distance = Math.abs(point.x - x);
      
      if (distance < minDistance) {
        closestIndex = i;
        minDistance = distance;
      }
    }
    
    // Modify that point
    window.presetPath[closestIndex].y = y;
    
    // Redraw the path
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Draw modified path
    ctx.strokeStyle = '#1db954';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(window.presetPath[0].x, window.presetPath[0].y);
    
    for (let i = 1; i < window.presetPath.length; i++) {
      ctx.lineTo(window.presetPath[i].x, window.presetPath[i].y);
    }
    
    ctx.stroke();
    
    // Update preview
    updatePreviewWave(window.presetPath);
    
    if (e.preventDefault) e.preventDefault();
  }
  
  /**
   * Stop drawing on preset canvas
   */
  function stopPresetDrawing() {
    window.isPresetDrawing = false;
  }
  
  /**
   * Initialize harmonics sliders
   */
  function initHarmonicsSliders() {
    const container = document.getElementById('harmonics-sliders');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create sliders for each harmonic
    const numHarmonics = 8;
    
    for (let i = 1; i <= numHarmonics; i++) {
      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'harmonic-slider-container';
      sliderContainer.style.display = 'flex';
      sliderContainer.style.alignItems = 'center';
      sliderContainer.style.gap = '10px';
      sliderContainer.style.margin = '10px 0';
      
      const label = document.createElement('label');
      label.textContent = `Harmonic ${i}:`;
      label.style.minWidth = '100px';
      label.style.color = '#b3b3b3';
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.value = i === 1 ? '100' : Math.floor(100 / i);
      slider.className = 'harmonic-slider';
      slider.dataset.harmonic = i;
      slider.style.flex = '1';
      
      slider.addEventListener('input', updateHarmonicsPreview);
      
      const valueDisplay = document.createElement('span');
      valueDisplay.className = 'harmonic-value';
      valueDisplay.textContent = `${slider.value}%`;
      valueDisplay.style.minWidth = '50px';
      valueDisplay.style.textAlign = 'right';
      valueDisplay.style.color = '#b3b3b3';
      
      // Update value display when slider changes
      slider.addEventListener('input', function() {
        valueDisplay.textContent = `${this.value}%`;
      });
      
      sliderContainer.appendChild(label);
      sliderContainer.appendChild(slider);
      sliderContainer.appendChild(valueDisplay);
      
      container.appendChild(sliderContainer);
    }
    
    // Initialize the harmonics preview canvas
    const canvas = document.getElementById('harmonics-preview-canvas');
    if (canvas) {
      // Set canvas dimensions
      const canvasContainer = canvas.parentElement;
      canvas.width = canvasContainer.clientWidth;
      canvas.height = canvasContainer.clientHeight;
      
      // Draw initial preview
      updateHarmonicsPreview();
    }
  }
  
  /**
   * Update harmonics preview
   */
  function updateHarmonicsPreview() {
    const canvas = document.getElementById('harmonics-preview-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Get harmonic values
    const sliders = document.querySelectorAll('.harmonic-slider');
    const harmonicValues = [];
    
    sliders.forEach(slider => {
      const harmonic = parseInt(slider.dataset.harmonic);
      const amplitude = parseInt(slider.value) / 100;
      harmonicValues.push({ harmonic, amplitude });
    });
    
    // Draw waveform based on harmonics
    ctx.strokeStyle = '#1db954';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    // Store the path for preview
    const harmonicsPath = [];
    
    // Generate waveform using harmonics
    for (let x = 0; x < canvas.width; x++) {
      const normalizedX = x / canvas.width * 2 * Math.PI;
      let y = 0;
      
      // Sum all harmonic contributions
      harmonicValues.forEach(({ harmonic, amplitude }) => {
        y += amplitude * Math.sin(normalizedX * harmonic);
      });
      
      // Normalize to prevent excessive amplitude
      y = y / Math.sqrt(harmonicValues.length);
      
      // Scale and position
      const scaledY = canvas.height / 2 - (y * canvas.height / 3);
      
      harmonicsPath.push({ x, y: scaledY });
      
      if (x === 0) {
        ctx.moveTo(x, scaledY);
      } else {
        ctx.lineTo(x, scaledY);
      }
    }
    
    ctx.stroke();
    
    // Store the path for later use
    window.harmonicsPath = harmonicsPath;
    
    // Update preview
    updatePreviewWave(harmonicsPath);
  }
  
  /**
   * Update preview wave animation
   */
  function updatePreviewWave(path) {
    const previewWave = document.getElementById('preview-wave');
    if (!previewWave) return;
    
    // Determine which path to use
    let sourcePath;
    
    if (path) {
      // Use provided path
      sourcePath = path;
    } else if (window.drawingState && window.drawingState.path.length > 1) {
      // Use drawing path
      sourcePath = window.drawingState.path;
    } else if (window.presetPath && window.presetPath.length > 0) {
      // Use preset path
      sourcePath = window.presetPath;
    } else if (window.harmonicsPath && window.harmonicsPath.length > 0) {
      // Use harmonics path
      sourcePath = window.harmonicsPath;
    } else {
      // Default sine wave if no path available
      sourcePath = [];
      const width = previewWave.clientWidth;
      const height = previewWave.clientHeight;
      const centerY = height / 2;
      
      for (let x = 0; x < width; x++) {
        const normalizedX = x / width * 2 * Math.PI;
        const y = centerY - Math.sin(normalizedX * 2) * height / 3;
        sourcePath.push({ x, y });
      }
    }
    
    // If path too short, don't update
    if (sourcePath.length < 2) return;
    
    // Generate SVG path
    const width = previewWave.clientWidth;
    const height = previewWave.clientHeight;
    const centerY = height / 2;
    
    // Normalize path to fit preview
    const normalizedPath = [];
    const maxY = Math.max(...sourcePath.map(p => p.y));
    const minY = Math.min(...sourcePath.map(p => p.y));
    const yRange = maxY - minY || 1;
    
    for (let i = 0; i < sourcePath.length; i++) {
      const x = (sourcePath[i].x / sourcePath[sourcePath.length - 1].x) * width;
      const normalizedY = (sourcePath[i].y - minY) / yRange;
      const y = centerY - (normalizedY - 0.5) * height * 0.8;
      normalizedPath.push({ x, y });
    }
    
    // Create SVG
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    
    // Create path element
    const svgPath = document.createElementNS(svgNS, "path");
    
    // Generate path data
    let pathData = `M${normalizedPath[0].x},${normalizedPath[0].y}`;
    for (let i = 1; i < normalizedPath.length; i++) {
      pathData += ` L${normalizedPath[i].x},${normalizedPath[i].y}`;
    }
    
    svgPath.setAttribute("d", pathData);
    svgPath.setAttribute("stroke", "#1db954");
    svgPath.setAttribute("stroke-width", "2");
    svgPath.setAttribute("fill", "none");
    
    // Add to SVG
    svg.appendChild(svgPath);
    
    // Update preview
    previewWave.innerHTML = '';
    previewWave.appendChild(svg);
    
    // Store normalized path for waveform creation
    window.normalizedPreviewPath = normalizedPath;
  }
  
  /**
   * Initialize preview playback with audio context
   */
  let previewOscillator = null;
  let previewGain = null;
  let previewAudioContext = null;
  let isPreviewPlaying = false;
  
  /**
   * Toggle preview playback
   */
  function togglePreviewPlayback() {
    if (isPreviewPlaying) {
      stopPreviewPlayback();
    } else {
      startPreviewPlayback();
    }
  }
  
  /**
   * Start preview playback
   */
  function startPreviewPlayback() {
    if (isPreviewPlaying) return;
    
    // Initialize audio context if needed
    if (!previewAudioContext) {
      try {
        previewAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        previewGain = previewAudioContext.createGain();
        previewGain.gain.value = 0.2;
        previewGain.connect(previewAudioContext.destination);
      } catch (e) {
        console.error('Could not create audio context:', e);
        return;
      }
    }
    
    try {
      // Create oscillator
      previewOscillator = previewAudioContext.createOscillator();
      
      // Determine which tab is active
      const activeTab = document.querySelector('.waveform-tab.active');
      
      if (activeTab && activeTab.dataset.tab === 'draw' && window.drawingState && window.drawingState.path.length > 1) {
        // Custom drawn waveform
        createPeriodicWaveFromPath(window.drawingState.path);
      } else if (activeTab && activeTab.dataset.tab === 'presets' && window.presetPath && window.presetPath.length > 0) {
        // Preset waveform
        if (window.currentPreset === 'sine') {
          previewOscillator.type = 'sine';
        } else if (window.currentPreset === 'triangle') {
          previewOscillator.type = 'triangle';
        } else if (window.currentPreset === 'square') {
          previewOscillator.type = 'square';
        } else if (window.currentPreset === 'sawtooth') {
          previewOscillator.type = 'sawtooth';
        } else {
          // Custom preset or modified
          createPeriodicWaveFromPath(window.presetPath);
        }
      } else if (activeTab && activeTab.dataset.tab === 'harmonics') {
        // Harmonics
        createPeriodicWaveFromHarmonics();
      } else {
        // Default to sine
        previewOscillator.type = 'sine';
      }
      
      // Set frequency
      previewOscillator.frequency.value = 440;
      
      // Connect and start
      previewOscillator.connect(previewGain);
      previewOscillator.start();
      
      isPreviewPlaying = true;
      
      // Update button
      const playPreviewBtn = document.getElementById('play-preview');
      if (playPreviewBtn) {
        playPreviewBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
          Stop Preview
        `;
      }
    } catch (e) {
      console.error('Error starting preview playback:', e);
    }
  }
  
  /**
   * Stop preview playback
   */
  function stopPreviewPlayback() {
    if (!isPreviewPlaying) return;
    
    try {
      if (previewOscillator) {
        previewOscillator.stop();
        previewOscillator.disconnect();
        previewOscillator = null;
      }
      
      isPreviewPlaying = false;
      
      // Update button
      const playPreviewBtn = document.getElementById('play-preview');
      if (playPreviewBtn) {
        playPreviewBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Play Preview
        `;
      }
    } catch (e) {
      console.error('Error stopping preview playback:', e);
    }
  }
  
  /**
   * Create a periodic wave from a drawn path
   */
  function createPeriodicWaveFromPath(path) {
    if (!previewAudioContext || !previewOscillator || path.length < 2) return;
    
    // Normalize y values to -1 to 1
    const canvas = document.getElementById('waveform-drawing-canvas') || 
                  document.getElementById('preset-preview-canvas');
    if (!canvas) return;
    
    const centerY = canvas.height / 2;
    const samples = 64;
    
    // Create a sampled waveform
    const waveform = new Float32Array(samples);
    
    // Sort by x position
    const sortedPath = [...path].sort((a, b) => a.x - b.x);
    
    // Sample at regular intervals
    for (let i = 0; i < samples; i++) {
      const x = i / samples * canvas.width;
      
      // Find closest points
      let leftIdx = 0;
      let rightIdx = 1;
      
      for (let j = 0; j < sortedPath.length - 1; j++) {
        if (sortedPath[j].x <= x && sortedPath[j + 1].x >= x) {
          leftIdx = j;
          rightIdx = j + 1;
          break;
        }
      }
      
      // Interpolate
      const leftPoint = sortedPath[leftIdx];
      const rightPoint = sortedPath[rightIdx];
      
      let y;
      if (rightPoint.x === leftPoint.x) {
        y = leftPoint.y;
      } else {
        const t = (x - leftPoint.x) / (rightPoint.x - leftPoint.x);
        y = leftPoint.y + t * (rightPoint.y - leftPoint.y);
      }
      
      // Normalize to -1 to 1 (invert because canvas y increases downward)
      waveform[i] = -(y - centerY) / (centerY * 0.8);
    }
    
    try {
      // Create a PeriodicWave using FFT
      const real = new Float32Array(samples);
      const imag = new Float32Array(samples);
      
      // Simple DFT calculation
      for (let k = 0; k < samples; k++) {
        real[k] = 0;
        imag[k] = 0;
        
        for (let n = 0; n < samples; n++) {
          const phi = (2 * Math.PI * k * n) / samples;
          real[k] += waveform[n] * Math.cos(phi);
          imag[k] -= waveform[n] * Math.sin(phi);
        }
        
        real[k] /= samples;
        imag[k] /= samples;
      }
      
      // Create PeriodicWave
      const wave = previewAudioContext.createPeriodicWave(real, imag);
      previewOscillator.setPeriodicWave(wave);
      
      // Store for later use
      window.customPeriodicWave = wave;
    } catch (e) {
      console.error('Error creating periodic wave:', e);
      // Fallback to sine
      previewOscillator.type = 'sine';
    }
  }
  
  /**
   * Create a periodic wave from harmonics
   */
  function createPeriodicWaveFromHarmonics() {
    if (!previewAudioContext || !previewOscillator) return;
    
    // Get harmonic sliders
    const sliders = document.querySelectorAll('.harmonic-slider');
    if (sliders.length === 0) return;
    
    // Create arrays for the wave
    const numHarmonics = sliders.length;
    const real = new Float32Array(numHarmonics + 1);
    const imag = new Float32Array(numHarmonics + 1);
    
    // Set DC offset to 0
    real[0] = 0;
    imag[0] = 0;
    
    // Fill with harmonics
    sliders.forEach(slider => {
      const harmonic = parseInt(slider.dataset.harmonic);
      const amplitude = parseInt(slider.value) / 100;
      
      // For sine waves, we use the imaginary part
      imag[harmonic] = amplitude;
    });
    
    try {
      // Create and apply the wave
      const wave = previewAudioContext.createPeriodicWave(real, imag);
      previewOscillator.setPeriodicWave(wave);
      
      // Store for later use
      window.customPeriodicWave = wave;
    } catch (e) {
      console.error('Error creating harmonic wave:', e);
      // Fallback to sine
      previewOscillator.type = 'sine';
    }
  }
  
  /**
   * Apply custom waveform to the main application
   */
  function applyCustomWaveform() {
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.error('Could not create audio context:', e);
        return;
      }
    }
    
    // Stop preview playback
    stopPreviewPlayback();
    
    try {
      // Determine active tab
      const activeTab = document.querySelector('.waveform-tab.active');
      
      if (activeTab) {
        if (activeTab.dataset.tab === 'draw' && window.drawingState && window.drawingState.path.length > 1) {
          // Apply drawn waveform
          applyDrawnWaveformToMain();
        } else if (activeTab.dataset.tab === 'presets') {
          // Apply preset waveform
          applyPresetWaveformToMain();
        } else if (activeTab.dataset.tab === 'harmonics') {
          // Apply harmonics waveform
          applyHarmonicsToMain();
        }
      }
      
      // If customPeriodicWave was created, use it
      if (window.customPeriodicWave) {
        // Update sound profile
        const profileDropdown = document.getElementById('sound-profile-dropdown');
        if (profileDropdown) {
          // Make sure custom wave is selected
          profileDropdown.value = 'custom_wave';
          
          // Update oscillator if it's running
          if (oscillator && app.isPlaying) {
            oscillator.setPeriodicWave(window.customPeriodicWave);
          }
        }
      }
      
      console.log('Custom waveform applied successfully');
    } catch (e) {
      console.error('Error applying custom waveform:', e);
    }
  }
  
  /**
   * Apply drawn waveform to main application
   */
  function applyDrawnWaveformToMain() {
    if (!window.drawingState || window.drawingState.path.length < 2) {
      console.log('No drawn waveform available');
      return;
    }
    
    // Convert drawn path to periodic wave
    const canvas = document.getElementById('waveform-drawing-canvas');
    if (!canvas) return;
    
    const centerY = canvas.height / 2;
    const samples = 64;
    
    // Create a sampled waveform
    const waveform = new Float32Array(samples);
    
    // Sort by x position
    const sortedPath = [...window.drawingState.path].sort((a, b) => a.x - b.x);
    
    // Sample at regular intervals
    for (let i = 0; i < samples; i++) {
      const x = i / samples * canvas.width;
      
      // Find closest points
      let leftIdx = 0;
      let rightIdx = 1;
      
      for (let j = 0; j < sortedPath.length - 1; j++) {
        if (sortedPath[j].x <= x && sortedPath[j + 1].x >= x) {
          leftIdx = j;
          rightIdx = j + 1;
          break;
        }
      }
      
      // Interpolate
      const leftPoint = sortedPath[leftIdx];
      const rightPoint = sortedPath[rightIdx];
      
      let y;
      if (rightPoint.x === leftPoint.x) {
        y = leftPoint.y;
      } else {
        const t = (x - leftPoint.x) / (rightPoint.x - leftPoint.x);
        y = leftPoint.y + t * (rightPoint.y - leftPoint.y);
      }
      
      // Normalize to -1 to 1 (invert because canvas y increases downward)
      waveform[i] = -(y - centerY) / (centerY * 0.8);
    }
    
    try {
      // Create a PeriodicWave using FFT
      const real = new Float32Array(samples);
      const imag = new Float32Array(samples);
      
      // Simple DFT calculation
      for (let k = 0; k < samples; k++) {
        real[k] = 0;
        imag[k] = 0;
        
        for (let n = 0; n < samples; n++) {
          const phi = (2 * Math.PI * k * n) / samples;
          real[k] += waveform[n] * Math.cos(phi);
          imag[k] -= waveform[n] * Math.sin(phi);
        }
        
        real[k] /= samples;
        imag[k] /= samples;
      }
      
      // Create PeriodicWave
      window.customPeriodicWave = audioContext.createPeriodicWave(real, imag);
      
      // Store the waveform data for later use
      window.customWaveformData = {
        type: 'drawn',
        waveform: waveform,
        real: real,
        imag: imag
      };
      
      console.log('Created periodic wave from drawn waveform');
    } catch (e) {
      console.error('Error creating periodic wave from drawn waveform:', e);
    }
  }
  
  /**
   * Apply preset waveform to main application
   */
  function applyPresetWaveformToMain() {
    const selectedPreset = window.currentPreset;
    
    // Check if a preset is selected
    if (!selectedPreset) {
      console.log('No preset selected');
      return;
    }
    
    try {
      // If preset is a standard waveform
      if (['sine', 'triangle', 'square', 'sawtooth'].includes(selectedPreset)) {
        // For standard waveforms, we don't need to create a periodic wave
        // Just store the type for later use
        window.customWaveformData = {
          type: 'preset',
          preset: selectedPreset,
          modified: false
        };
        
        // Clear any existing custom periodic wave
        window.customPeriodicWave = null;
        
        console.log(`Applied standard waveform preset: ${selectedPreset}`);
        return;
      }
      
      // For custom presets or modified presets
      if (window.presetPath && window.presetPath.length > 0) {
        // Similar to drawn waveform
        const canvas = document.getElementById('preset-preview-canvas');
        if (!canvas) return;
        
        const centerY = canvas.height / 2;
        const samples = 64;
        
        // Create a sampled waveform
        const waveform = new Float32Array(samples);
        
        // Sort by x position
        const sortedPath = [...window.presetPath].sort((a, b) => a.x - b.x);
        
        // Sample at regular intervals
        for (let i = 0; i < samples; i++) {
          const x = i / samples * canvas.width;
          
          // Find closest points
          let leftIdx = 0;
          let rightIdx = 1;
          
          for (let j = 0; j < sortedPath.length - 1; j++) {
            if (sortedPath[j].x <= x && sortedPath[j + 1].x >= x) {
              leftIdx = j;
              rightIdx = j + 1;
              break;
            }
          }
          
          // Interpolate
          const leftPoint = sortedPath[leftIdx];
          const rightPoint = sortedPath[rightIdx];
          
          let y;
          if (rightPoint.x === leftPoint.x) {
            y = leftPoint.y;
          } else {
            const t = (x - leftPoint.x) / (rightPoint.x - leftPoint.x);
            y = leftPoint.y + t * (rightPoint.y - leftPoint.y);
          }
          
          // Normalize to -1 to 1 (invert because canvas y increases downward)
          waveform[i] = -(y - centerY) / (centerY * 0.8);
        }
        
        // Create a PeriodicWave using FFT
        const real = new Float32Array(samples);
        const imag = new Float32Array(samples);
        
        // Simple DFT calculation
        for (let k = 0; k < samples; k++) {
          real[k] = 0;
          imag[k] = 0;
          
          for (let n = 0; n < samples; n++) {
            const phi = (2 * Math.PI * k * n) / samples;
            real[k] += waveform[n] * Math.cos(phi);
            imag[k] -= waveform[n] * Math.sin(phi);
          }
          
          real[k] /= samples;
          imag[k] /= samples;
        }
        
        // Create PeriodicWave
        window.customPeriodicWave = audioContext.createPeriodicWave(real, imag);
        
        // Store the waveform data for later use
        window.customWaveformData = {
          type: 'preset',
          preset: selectedPreset,
          modified: true,
          waveform: waveform,
          real: real,
          imag: imag
        };
        
        console.log(`Applied custom preset waveform: ${selectedPreset}`);
      }
    } catch (e) {
      console.error('Error applying preset waveform:', e);
    }
  }
  
  /**
   * Apply harmonics to main application
   */
  function applyHarmonicsToMain() {
    const sliders = document.querySelectorAll('.harmonic-slider');
    if (sliders.length === 0) {
      console.log('No harmonic sliders available');
      return;
    }
    
    try {
      // Create arrays for the wave
      const numHarmonics = sliders.length;
      const real = new Float32Array(numHarmonics + 1);
      const imag = new Float32Array(numHarmonics + 1);
      
      // Set DC offset to 0
      real[0] = 0;
      imag[0] = 0;
      
      // Store harmonic amplitudes
      const harmonicValues = [];
      
      // Fill with harmonics
      sliders.forEach(slider => {
        const harmonic = parseInt(slider.dataset.harmonic);
        const amplitude = parseInt(slider.value) / 100;
        
        // For sine waves, we use the imaginary part
        imag[harmonic] = amplitude;
        
        // Store for later use
        harmonicValues.push({ harmonic, amplitude });
      });
      
      // Create the wave
      window.customPeriodicWave = audioContext.createPeriodicWave(real, imag);
      
      // Store the waveform data for later use
      window.customWaveformData = {
        type: 'harmonics',
        harmonics: harmonicValues,
        real: real,
        imag: imag
      };
      
      console.log('Applied harmonic waveform');
    } catch (e) {
      console.error('Error applying harmonic waveform:', e);
    }
  }
  
  /**
   * Open audio upload interface
   */
  function openAudioUpload() {
    // This function will now defer to the separate sound-upload.js file
    console.log('Opening audio upload interface. This should be handled by sound-upload.js');
  }
  
  /**
   * Open waveform editor modal
   */
  function openWaveformEditor() {
    const modal = document.getElementById('waveform-drawing-modal');
    if (!modal) return;
    
    // Show modal
    modal.style.display = 'block';
    
    // Initialize current tab
    const activeTab = document.querySelector('.waveform-tab.active');
    if (activeTab) {
      if (activeTab.dataset.tab === 'draw') {
        initDrawingCanvas();
      } else if (activeTab.dataset.tab === 'presets') {
        initPresetCanvas();
      } else if (activeTab.dataset.tab === 'harmonics') {
        initHarmonicsSliders();
        updateHarmonicsPreview();
      }
    } else {
      // Default to drawing canvas
      initDrawingCanvas();
    }
  }
  
  /**
   * Add the interface integration to audio-processor.js
   */
  function addInterfaceToAudioProcessor() {
    // Update sound profiles array to include custom waveform
    const customWaveformProfile = {
      id: 'custom_wave',
      name: 'Custom Waveform',
      waveform: 'custom',
      frequencyRange: { min: 100, max: 800 }
    };
    
    // Add to SOUND_PROFILES if it doesn't already exist
    if (!SOUND_PROFILES.some(profile => profile.id === 'custom_wave')) {
      SOUND_PROFILES.push(customWaveformProfile);
    }
    
    // Update existing SOUND_PROFILES interface setup
    initCustomWaveformInterface();
    
    // When the user changes to custom waveform, show the custom controls
    document.addEventListener('DOMContentLoaded', () => {
      const profileDropdown = document.getElementById('sound-profile-dropdown');
      if (profileDropdown) {
        profileDropdown.addEventListener('change', function() {
          const customControls = document.getElementById('custom-waveform-controls');
          if (customControls) {
            customControls.classList.toggle('hidden', this.value !== 'custom_wave');
          }
        });
      }
    });
  }
  
  // Initialize the interface when script loads
  document.addEventListener('DOMContentLoaded', () => {
    addInterfaceToAudioProcessor();
    
    // Direct application of button hold feature
    initButtonHoldFeature();
    
    // Direct application of chart label fix
    setTimeout(patchChartInitFunction, 1000);
  });

/**
 * Enhanced Skip Buttons with Hold Feature
 * Directly applied in the main script
 */
function initButtonHoldFeature() {
  // Define the buttons
  const skipForwardBtn = document.getElementById('skip-forward-btn');
  const skipBackBtn = document.getElementById('skip-back-btn');
  
  if (!skipForwardBtn || !skipBackBtn) {
    console.log('Skip buttons not found, will try again later');
    setTimeout(initButtonHoldFeature, 1000);
    return;
  }
  
  console.log('Initializing button hold feature');
  
  // Variables to track button press state
  let forwardInterval = null;
  let backwardInterval = null;
  let wasPlaying = false;
  let skipSpeed = 1; // Initial skip speed multiplier
  let holdStartTime = 0;
  const holdThreshold = 500; // ms before we consider it a "hold"
  
  // Forward button press and hold
  skipForwardBtn.addEventListener('mousedown', function(e) {
    // Remember if we were playing
    wasPlaying = app.isPlaying;
    holdStartTime = Date.now();
    
    // Initial skip forward
    skipTime(5);
    
    // Set up interval for continuous skipping
    forwardInterval = setTimeout(function() {
      // When we've held past the threshold, pause playback
      if (wasPlaying) stopPlayback();
      
      // Now start the continuous skipping
      forwardInterval = setInterval(function() {
        // Increase skip speed over time (max 10x)
        skipSpeed = Math.min(10, 1 + (Date.now() - holdStartTime) / 1000);
        
        // Skip with increasing speed
        skipTime(1 * skipSpeed);
        
        // Update visualization without playing
        updateWaveform();
        updateCircularWave();
      }, 50);
    }, holdThreshold);
  });
  
  // Forward button release
  skipForwardBtn.addEventListener('mouseup', function(e) {
    // Clear the interval
    clearTimeout(forwardInterval);
    clearInterval(forwardInterval);
    forwardInterval = null;
    
    // Resume playback if we were playing before
    if (wasPlaying && !app.isPlaying && (Date.now() - holdStartTime) >= holdThreshold) {
      togglePlayback();
    }
    
    // Reset skip speed
    skipSpeed = 1;
  });
  
  // Forward button mouse leave
  skipForwardBtn.addEventListener('mouseleave', function(e) {
    // Only handle if the button is being held down
    if (forwardInterval) {
      // Clear the interval
      clearTimeout(forwardInterval);
      clearInterval(forwardInterval);
      forwardInterval = null;
      
      // Resume playback if we were playing before
      if (wasPlaying && !app.isPlaying && (Date.now() - holdStartTime) >= holdThreshold) {
        togglePlayback();
      }
      
      // Reset skip speed
      skipSpeed = 1;
    }
  });
  
  // Backward button press and hold
  skipBackBtn.addEventListener('mousedown', function(e) {
    // Remember if we were playing
    wasPlaying = app.isPlaying;
    holdStartTime = Date.now();
    
    // Initial skip backward
    skipTime(-5);
    
    // Set up interval for continuous skipping
    backwardInterval = setTimeout(function() {
      // When we've held past the threshold, pause playback
      if (wasPlaying) stopPlayback();
      
      // Now start the continuous skipping
      backwardInterval = setInterval(function() {
        // Increase skip speed over time (max 10x)
        skipSpeed = Math.min(10, 1 + (Date.now() - holdStartTime) / 1000);
        
        // Skip with increasing speed
        skipTime(-1 * skipSpeed);
        
        // Update visualization without playing
        updateWaveform();
        updateCircularWave();
      }, 50);
    }, holdThreshold);
  });
  
  // Backward button release
  skipBackBtn.addEventListener('mouseup', function(e) {
    // Clear the interval
    clearTimeout(backwardInterval);
    clearInterval(backwardInterval);
    backwardInterval = null;
    
    // Resume playback if we were playing before
    if (wasPlaying && !app.isPlaying && (Date.now() - holdStartTime) >= holdThreshold) {
      togglePlayback();
    }
    
    // Reset skip speed
    skipSpeed = 1;
  });
  
  // Backward button mouse leave
  skipBackBtn.addEventListener('mouseleave', function(e) {
    // Only handle if the button is being held down
    if (backwardInterval) {
      // Clear the interval
      clearTimeout(backwardInterval);
      clearInterval(backwardInterval);
      backwardInterval = null;
      
      // Resume playback if we were playing before
      if (wasPlaying && !app.isPlaying && (Date.now() - holdStartTime) >= holdThreshold) {
        togglePlayback();
      }
      
      // Reset skip speed
      skipSpeed = 1;
    }
  });
  
  // Add touch support
  // Forward button touch events
  skipForwardBtn.addEventListener('touchstart', function(e) {
    e.preventDefault(); // Prevent scrolling
    wasPlaying = app.isPlaying;
    holdStartTime = Date.now();
    
    skipTime(5);
    
    forwardInterval = setTimeout(function() {
      if (wasPlaying) stopPlayback();
      
      forwardInterval = setInterval(function() {
        skipSpeed = Math.min(10, 1 + (Date.now() - holdStartTime) / 1000);
        skipTime(1 * skipSpeed);
        updateWaveform();
        updateCircularWave();
      }, 50);
    }, holdThreshold);
  });
  
  skipForwardBtn.addEventListener('touchend', function(e) {
    e.preventDefault();
    clearTimeout(forwardInterval);
    clearInterval(forwardInterval);
    forwardInterval = null;
    
    if (wasPlaying && !app.isPlaying && (Date.now() - holdStartTime) >= holdThreshold) {
      togglePlayback();
    }
    
    skipSpeed = 1;
  });
  
  // Backward button touch events
  skipBackBtn.addEventListener('touchstart', function(e) {
    e.preventDefault(); // Prevent scrolling
    wasPlaying = app.isPlaying;
    holdStartTime = Date.now();
    
    skipTime(-5);
    
    backwardInterval = setTimeout(function() {
      if (wasPlaying) stopPlayback();
      
      backwardInterval = setInterval(function() {
        skipSpeed = Math.min(10, 1 + (Date.now() - holdStartTime) / 1000);
        skipTime(-1 * skipSpeed);
        updateWaveform();
        updateCircularWave();
      }, 50);
    }, holdThreshold);
  });
  
  skipBackBtn.addEventListener('touchend', function(e) {
    e.preventDefault();
    clearTimeout(backwardInterval);
    clearInterval(backwardInterval);
    backwardInterval = null;
    
    if (wasPlaying && !app.isPlaying && (Date.now() - holdStartTime) >= holdThreshold) {
      togglePlayback();
    }
    
    skipSpeed = 1;
  });
  
  console.log('Button hold-to-skip functionality initialized');
}

/**
 * Chart X-Axis Label Position Fix
 * Directly applied in the main script
 */
function patchChartInitFunction() {
  // Check if initChart function exists
  if (typeof window.initChart !== 'function') {
    console.log('initChart function not found, will try again later');
    setTimeout(patchChartInitFunction, 1000);
    return;
  }
  
  console.log('Patching chart initialization function');
  
  // Store the original function
  const originalInitChart = window.initChart;
  
  // Replace with our patched version
  window.initChart = function() {
    // Call the original function first
    originalInitChart.apply(this, arguments);
    
    // Now adjust the X-axis label position
    const svg = d3.select('#chart-container svg');
    if (!svg.empty()) {
      // Find the X-axis label
      const xAxisLabel = svg.select('.axis-label:not([transform*="rotate"])');
      
      if (!xAxisLabel.empty()) {
        // Get the current height value from the chart container
        const chartContainer = document.getElementById('chart-container');
        if (!chartContainer) return;
        
        // Get margin from the original function (approximated if needed)
        const margin = { top: 100, right: 20, bottom: 100, left: 50 };
        const height = chartContainer.clientHeight - margin.top - margin.bottom;
        
        // Adjust the Y position to be closer to the chart
        // Original is (height + margin.bottom - 5)
        // We'll reduce the gap by moving it 30px higher
        xAxisLabel.attr('y', height + (margin.bottom - 35));
        
        console.log('X-axis label position adjusted');
      }
    }
  };
  
  // Force a chart redraw to apply changes
  if (typeof app !== 'undefined' && app.data && app.data.filtered.length > 0) {
    initChart();
  }
}