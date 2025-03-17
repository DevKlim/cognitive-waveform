/**
 * simplified-custom-waveform.js
 * A streamlined implementation of custom waveform drawing functionality
 */

// Store references globally to avoid redeclaration issues
window.customWaveformState = {
  isDrawing: false,
  path: [],
  color: '#1db954',
  ctx: null
};

// Ensure the ensureAudioProcessorConnection function exists
window.ensureAudioProcessorConnection = window.ensureAudioProcessorConnection || function() {
  return true;
};

/**
 * Initialize the waveform editor when the page loads
 */
document.addEventListener('DOMContentLoaded', function() {
  // Wait for the sound profile dropdown to be available
  const checkInterval = setInterval(function() {
    const soundProfileDropdown = document.getElementById('sound-profile-dropdown');
    if (!soundProfileDropdown) return;
    
    clearInterval(checkInterval);
    
    // Add custom wave type to audio processor WAVEFORM_TYPES
    if (typeof window.WAVEFORM_TYPES === 'object' && !window.WAVEFORM_TYPES.CUSTOM_WAVE) {
      window.WAVEFORM_TYPES.CUSTOM_WAVE = 'custom_wave';
    }
    
    // Add 'Custom Waveform' option if it doesn't exist
    let hasCustomWaveOption = false;
    for (let i = 0; i < soundProfileDropdown.options.length; i++) {
      if (soundProfileDropdown.options[i].value === 'custom_wave') {
        hasCustomWaveOption = true;
        break;
      }
    }
    
    if (!hasCustomWaveOption) {
      const option = document.createElement('option');
      option.value = 'custom_wave';
      option.textContent = 'Custom Waveform';
      soundProfileDropdown.appendChild(option);
    }
    
    // Create waveform controls
    const playbackOptions = document.querySelector('.playback-options');
    if (!playbackOptions) return;
    
    // Check if control section already exists
    if (!document.getElementById('custom-waveform-controls')) {
      // Create controls container
      const controlsContainer = document.createElement('div');
      controlsContainer.id = 'custom-waveform-controls';
      controlsContainer.className = 'custom-waveform-controls';
      controlsContainer.style.display = 'none';
      
      // Create waveform editor button
      const editorButton = document.createElement('button');
      editorButton.id = 'open-waveform-editor';
      editorButton.className = 'custom-waveform-btn';
      editorButton.style.display = 'flex';
      editorButton.style.alignItems = 'center';
      editorButton.style.gap = '8px';
      editorButton.style.backgroundColor = '#2e2e2e';
      editorButton.style.color = '#fff';
      editorButton.style.padding = '8px 16px';
      editorButton.style.borderRadius = '20px';
      editorButton.style.cursor = 'pointer';
      editorButton.style.transition = 'all 0.2s';
      editorButton.style.fontSize = '14px';
      editorButton.style.marginTop = '10px';
      editorButton.style.border = 'none';
      
      editorButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
        Create Waveform
      `;
      
      // Description
      const description = document.createElement('div');
      description.textContent = 'Draw a custom waveform to visualize your data with unique sounds';
      description.style.fontSize = '13px';
      description.style.color = '#b3b3b3';
      description.style.marginBottom = '5px';
      description.style.lineHeight = '1.4';
      
      // Add elements to container
      controlsContainer.appendChild(description);
      controlsContainer.appendChild(editorButton);
      
      // Add to playback options
      playbackOptions.appendChild(controlsContainer);
      
      // Add styling for hover effect
      editorButton.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#1db954';
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 8px rgba(29, 185, 84, 0.3)';
      });
      
      editorButton.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#2e2e2e';
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
      });
      
      // Show controls when custom waveform is selected
      soundProfileDropdown.addEventListener('change', function() {
        controlsContainer.style.display = this.value === 'custom_wave' ? 'block' : 'none';
      });
      
      // Initially set the display based on the dropdown value
      controlsContainer.style.display = soundProfileDropdown.value === 'custom_wave' ? 'block' : 'none';
      
      // Set up the editor button
      editorButton.addEventListener('click', openWaveformEditor);
    }
    
    // Create the modal for waveform drawing
    createWaveformDrawingModal();
    
    // Patch audio functions to support custom waveforms
    patchAudioFunctions();
  }, 300);
});

/**
 * Patch audio-related functions to support custom waveforms
 */
function patchAudioFunctions() {
  // Add custom wave type to WAVEFORM_TYPES if needed
  if (typeof window.WAVEFORM_TYPES === 'object' && !window.WAVEFORM_TYPES.CUSTOM_WAVE) {
    window.WAVEFORM_TYPES.CUSTOM_WAVE = 'custom_wave';
  }
  
  // 1. Patch setOscillatorType
  if (typeof window.setOscillatorType === 'function' && !window.originalSetOscillatorType) {
    window.originalSetOscillatorType = window.setOscillatorType;
    
    window.setOscillatorType = function(type) {
      // Add custom wave type if it doesn't exist
      if (typeof window.WAVEFORM_TYPES === 'object' && !window.WAVEFORM_TYPES.CUSTOM_WAVE) {
        window.WAVEFORM_TYPES.CUSTOM_WAVE = 'custom_wave';
      }
      
      // Set custom type in global state
      window.currentOscillatorType = type;
      
      // If it's custom wave and we're playing, apply the custom wave
      if (type === 'custom_wave' && window.app && window.app.isPlaying) {
        applyCustomWaveToAudio();
      } else {
        // For other types, call the original function
        window.originalSetOscillatorType(type);
      }
    };
  }
  
  // 2. Patch startSonification
  if (typeof window.startSonification === 'function' && !window.originalStartSonification) {
    window.originalStartSonification = window.startSonification;
    
    window.startSonification = function() {
      // If type is custom wave and we have a custom wave, use it
      if (window.currentOscillatorType === 'custom_wave' && window.customPeriodicWave) {
        startCustomWaveSonification();
      } else {
        // Otherwise use original function
        window.originalStartSonification();
      }
    };
  }
  
  // 3. Patch stopSonification
  if (typeof window.stopSonification === 'function' && !window.originalStopSonification) {
    window.originalStopSonification = window.stopSonification;
    
    window.stopSonification = function() {
      // Call original function
      window.originalStopSonification();
      
      // Ensure custom oscillator is stopped
      if (window.customWaveOscillator) {
        try {
          window.customWaveOscillator.stop();
          window.customWaveOscillator.disconnect();
        } catch (e) {
          // Ignore errors
        }
        window.customWaveOscillator = null;
      }
    };
  }
}

function startCustomWaveSonification() {
    // Initialize audio context if needed
    if (!window.audioContext) {
      try {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return;
      }
    }
    
    // Create gain node if needed
    if (!window.gainNode) {
      window.gainNode = window.audioContext.createGain();
      window.gainNode.gain.value = 0.2; // Default volume
      window.gainNode.connect(window.audioContext.destination);
    }
    
    // Create analyzer if needed
    if (!window.analyser) {
      window.analyser = window.audioContext.createAnalyser();
      window.analyser.fftSize = 128;
      window.audioDataArray = new Uint8Array(window.analyser.frequencyBinCount);
      window.gainNode.connect(window.analyser);
      window.analyser.connect(window.audioContext.destination);
    }
    
    // Create custom wave oscillator
    try {
      if (window.customWaveOscillator) {
        window.customWaveOscillator.stop();
        window.customWaveOscillator.disconnect();
      }
      
      window.customWaveOscillator = window.audioContext.createOscillator();
      
      // Apply custom wave if available
      if (window.customPeriodicWave) {
        window.customWaveOscillator.setPeriodicWave(window.customPeriodicWave);
      } else {
        // Fallback to sine if no custom wave
        window.customWaveOscillator.type = 'sine';
      }
      
      // Set initial frequency based on current data
      updateCustomWaveFrequency();
      
      // Connect and start
      window.customWaveOscillator.connect(window.gainNode);
      window.customWaveOscillator.start();
      
      // Store this as the global oscillator for other functions to use
      window.oscillator = window.customWaveOscillator;
    } catch (e) {
      // Fail silently
    }
  }

/**
 * Apply custom wave to audio
 */
function applyCustomWaveToAudio() {
  // If we're playing, we need to restart with custom wave
  const isPlaying = window.app && window.app.isPlaying;
  
  if (isPlaying) {
    if (typeof window.stopSonification === 'function') {
      window.stopSonification();
    }
    
    startCustomWaveSonification();
  }
}

/**
 * Create the waveform drawing modal if not already present
 */
function createWaveformDrawingModal() {
  if (document.getElementById('waveform-drawing-modal')) return;
  
  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'waveform-drawing-modal';
  modal.style.display = 'none';
  modal.style.position = 'fixed';
  modal.style.zIndex = '2000';
  modal.style.left = '0';
  modal.style.top = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  modal.style.overflow = 'auto';
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = '#181818';
  modalContent.style.margin = '5% auto';
  modalContent.style.padding = '20px';
  modalContent.style.border = '1px solid #333';
  modalContent.style.borderRadius = '12px';
  modalContent.style.width = '90%';
  modalContent.style.maxWidth = '700px';
  modalContent.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.6)';
  
  // Create modal header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '20px';
  header.style.paddingBottom = '15px';
  header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
  
  const headerTitle = document.createElement('h2');
  headerTitle.textContent = 'Create Custom Waveform';
  headerTitle.style.fontSize = '24px';
  headerTitle.style.color = '#fff';
  headerTitle.style.margin = '0';
  
  const closeButton = document.createElement('button');
  closeButton.id = 'close-waveform-modal';
  closeButton.innerHTML = '&times;';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = '#999';
  closeButton.style.fontSize = '24px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.transition = 'color 0.2s';
  
  closeButton.addEventListener('mouseover', function() {
    this.style.color = '#fff';
  });
  
  closeButton.addEventListener('mouseout', function() {
    this.style.color = '#999';
  });
  
  header.appendChild(headerTitle);
  header.appendChild(closeButton);
  
  // Create drawing container
  const drawingContainer = document.createElement('div');
  drawingContainer.style.position = 'relative';
  drawingContainer.style.width = '100%';
  drawingContainer.style.height = '200px';
  drawingContainer.style.backgroundColor = '#121212';
  drawingContainer.style.borderRadius = '8px';
  drawingContainer.style.overflow = 'hidden';
  drawingContainer.style.margin = '20px 0';
  drawingContainer.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.5)';
  
  const canvas = document.createElement('canvas');
  canvas.id = 'waveform-drawing-canvas';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.cursor = 'crosshair';
  canvas.style.display = 'block';
  
  const guidelines = document.createElement('div');
  guidelines.textContent = 'Draw your waveform from left to right';
  guidelines.style.position = 'absolute';
  guidelines.style.top = '10px';
  guidelines.style.left = '10px';
  guidelines.style.padding = '5px 10px';
  guidelines.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  guidelines.style.borderRadius = '4px';
  guidelines.style.fontSize = '12px';
  guidelines.style.color = '#b3b3b3';
  
  drawingContainer.appendChild(canvas);
  drawingContainer.appendChild(guidelines);
  
  // Create controls
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.justifyContent = 'center';
  controls.style.gap = '10px';
  controls.style.marginBottom = '20px';
  
  // Clear button
  const clearButton = document.createElement('button');
  clearButton.id = 'clear-canvas';
  clearButton.textContent = 'Clear';
  clearButton.style.backgroundColor = '#2e2e2e';
  clearButton.style.color = '#fff';
  clearButton.style.border = 'none';
  clearButton.style.borderRadius = '20px';
  clearButton.style.padding = '8px 16px';
  clearButton.style.cursor = 'pointer';
  clearButton.style.fontSize = '14px';
  clearButton.style.transition = 'all 0.2s';
  
  clearButton.addEventListener('mouseover', function() {
    this.style.backgroundColor = '#3e3e3e';
    this.style.transform = 'translateY(-2px)';
  });
  
  clearButton.addEventListener('mouseout', function() {
    this.style.backgroundColor = '#2e2e2e';
    this.style.transform = 'translateY(0)';
  });
  
  // Smooth button
  const smoothButton = document.createElement('button');
  smoothButton.id = 'smooth-wave';
  smoothButton.textContent = 'Smooth';
  smoothButton.style.backgroundColor = '#2e2e2e';
  smoothButton.style.color = '#fff';
  smoothButton.style.border = 'none';
  smoothButton.style.borderRadius = '20px';
  smoothButton.style.padding = '8px 16px';
  smoothButton.style.cursor = 'pointer';
  smoothButton.style.fontSize = '14px';
  smoothButton.style.transition = 'all 0.2s';
  
  smoothButton.addEventListener('mouseover', function() {
    this.style.backgroundColor = '#3e3e3e';
    this.style.transform = 'translateY(-2px)';
  });
  
  smoothButton.addEventListener('mouseout', function() {
    this.style.backgroundColor = '#2e2e2e';
    this.style.transform = 'translateY(0)';
  });
  
  controls.appendChild(clearButton);
  controls.appendChild(smoothButton);
  
  // Create button panel
  const buttonGroup = document.createElement('div');
  buttonGroup.style.display = 'flex';
  buttonGroup.style.justifyContent = 'flex-end';
  buttonGroup.style.gap = '10px';
  buttonGroup.style.marginTop = '20px';
  
  // Apply button
  const applyButton = document.createElement('button');
  applyButton.id = 'apply-waveform';
  applyButton.textContent = 'Apply Waveform';
  applyButton.style.backgroundColor = '#1db954';
  applyButton.style.color = '#000';
  applyButton.style.border = 'none';
  applyButton.style.borderRadius = '20px';
  applyButton.style.padding = '8px 16px';
  applyButton.style.cursor = 'pointer';
  applyButton.style.fontSize = '14px';
  applyButton.style.fontWeight = 'bold';
  applyButton.style.transition = 'all 0.2s';
  
  applyButton.addEventListener('mouseover', function() {
    this.style.backgroundColor = '#1ed760';
    this.style.transform = 'translateY(-2px)';
    this.style.boxShadow = '0 4px 10px rgba(29, 185, 84, 0.3)';
  });
  
  applyButton.addEventListener('mouseout', function() {
    this.style.backgroundColor = '#1db954';
    this.style.transform = 'translateY(0)';
    this.style.boxShadow = 'none';
  });
  
  // Cancel button
  const cancelButton = document.createElement('button');
  cancelButton.id = 'cancel-waveform';
  cancelButton.textContent = 'Cancel';
  cancelButton.style.backgroundColor = '#2e2e2e';
  cancelButton.style.color = '#fff';
  cancelButton.style.border = 'none';
  cancelButton.style.borderRadius = '20px';
  cancelButton.style.padding = '8px 16px';
  cancelButton.style.cursor = 'pointer';
  cancelButton.style.fontSize = '14px';
  cancelButton.style.transition = 'all 0.2s';
  
  cancelButton.addEventListener('mouseover', function() {
    this.style.backgroundColor = '#3e3e3e';
    this.style.transform = 'translateY(-2px)';
  });
  
  cancelButton.addEventListener('mouseout', function() {
    this.style.backgroundColor = '#2e2e2e';
    this.style.transform = 'translateY(0)';
  });
  
  buttonGroup.appendChild(applyButton);
  buttonGroup.appendChild(cancelButton);
  
  // Add all elements to modal content
  modalContent.appendChild(header);
  modalContent.appendChild(drawingContainer);
  modalContent.appendChild(controls);
  modalContent.appendChild(buttonGroup);
  
  // Add modal content to modal
  modal.appendChild(modalContent);
  
  // Add modal to document
  document.body.appendChild(modal);
  
  // Set up event listeners
  setupModalEvents();
}

/**
 * Set up event handlers for the modal
 */
function setupModalEvents() {
  // Close button handler
  const closeButton = document.getElementById('close-waveform-modal');
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      document.getElementById('waveform-drawing-modal').style.display = 'none';
    });
  }
  
  // Cancel button handler
  const cancelButton = document.getElementById('cancel-waveform');
  if (cancelButton) {
    cancelButton.addEventListener('click', function() {
      document.getElementById('waveform-drawing-modal').style.display = 'none';
    });
  }
  
  // Clear canvas button handler
  const clearButton = document.getElementById('clear-canvas');
  if (clearButton) {
    clearButton.addEventListener('click', clearDrawingCanvas);
  }
  
  // Smooth button handler
  const smoothButton = document.getElementById('smooth-wave');
  if (smoothButton) {
    smoothButton.addEventListener('click', smoothDrawnWave);
  }
  
  // Apply button handler
  const applyButton = document.getElementById('apply-waveform');
  if (applyButton) {
    applyButton.addEventListener('click', function() {
      applyCustomWaveform();
      document.getElementById('waveform-drawing-modal').style.display = 'none';
    });
  }
}

/**
 * Open the waveform editor modal
 */
function openWaveformEditor() {
  const modal = document.getElementById('waveform-drawing-modal');
  if (!modal) return;
  
  modal.style.display = 'block';
  
  // Initialize canvas after a short delay to ensure the modal is visible
  setTimeout(function() {
    initDrawingCanvas();
  }, 100);
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
  window.customWaveformState = {
    isDrawing: false,
    path: [],
    color: '#1db954',
    ctx: ctx
  };
  
  // Set initial drawing style
  ctx.strokeStyle = window.customWaveformState.color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Add event listeners
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  
  // Touch support
  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: function() {}
    };
    startDrawing(mouseEvent);
  });
  
  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: function() {}
    };
    draw(mouseEvent);
  });
  
  canvas.addEventListener('touchend', stopDrawing);
}

/**
 * Start drawing on canvas
 */
function startDrawing(e) {
  if (!window.customWaveformState || !window.customWaveformState.ctx) return;
  
  window.customWaveformState.isDrawing = true;
  
  const canvas = document.getElementById('waveform-drawing-canvas');
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;
  
  window.customWaveformState.path = [{x, y}];
  
  window.customWaveformState.ctx.beginPath();
  window.customWaveformState.ctx.moveTo(x, y);
  window.customWaveformState.ctx.lineTo(x, y);
  window.customWaveformState.ctx.stroke();
  
  if (e.preventDefault) e.preventDefault();
}

/**
 * Draw on canvas
 */
function draw(e) {
  if (!window.customWaveformState || !window.customWaveformState.isDrawing || !window.customWaveformState.ctx) return;
  
  const canvas = document.getElementById('waveform-drawing-canvas');
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;
  
  window.customWaveformState.path.push({x, y});
  
  window.customWaveformState.ctx.lineTo(x, y);
  window.customWaveformState.ctx.stroke();
  
  if (e.preventDefault) e.preventDefault();
}

/**
 * Stop drawing
 */
function stopDrawing() {
  if (!window.customWaveformState) return;
  
  if (window.customWaveformState.isDrawing) {
    window.customWaveformState.isDrawing = false;
    
    // Sort path points by x position to ensure left-to-right ordering
    window.customWaveformState.path.sort((a, b) => a.x - b.x);
  }
}

/**
 * Clear the drawing canvas
 */
function clearDrawingCanvas() {
  const canvas = document.getElementById('waveform-drawing-canvas');
  if (!canvas || !window.customWaveformState || !window.customWaveformState.ctx) return;
  
  const ctx = window.customWaveformState.ctx;
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
  ctx.strokeStyle = window.customWaveformState.color;
  ctx.lineWidth = 3;
  
  // Clear path
  window.customWaveformState.path = [];
}

/**
 * Smooth the drawn waveform
 */
function smoothDrawnWave() {
  if (!window.customWaveformState || window.customWaveformState.path.length < 3) return;
  
  // Create a new smoothed path
  const smoothedPath = [];
  
  // Apply a moving average filter
  const windowSize = 5;
  
  for (let i = 0; i < window.customWaveformState.path.length; i++) {
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    
    // Calculate window bounds
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(window.customWaveformState.path.length - 1, i + Math.floor(windowSize / 2));
    
    // Calculate average within window
    for (let j = start; j <= end; j++) {
      sumX += window.customWaveformState.path[j].x;
      sumY += window.customWaveformState.path[j].y;
      count++;
    }
    
    smoothedPath.push({
      x: sumX / count,
      y: sumY / count
    });
  }
  
  // Redraw with smoothed path
  const canvas = document.getElementById('waveform-drawing-canvas');
  if (!canvas || !window.customWaveformState.ctx) return;
  
  const ctx = window.customWaveformState.ctx;
  
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
  ctx.strokeStyle = window.customWaveformState.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(smoothedPath[0].x, smoothedPath[0].y);
  
  for (let i = 1; i < smoothedPath.length; i++) {
    ctx.lineTo(smoothedPath[i].x, smoothedPath[i].y);
  }
  
  ctx.stroke();
  
  // Update path
  window.customWaveformState.path = smoothedPath;
}

/**
 * Generate waveform samples from a drawn path
 */
function generateWaveformSamples(path, numSamples = 64) {
  if (!path || path.length < 2) return null;
  
  const samples = new Float32Array(numSamples);
  const canvas = document.getElementById('waveform-drawing-canvas');
  
  if (!canvas) return null;
  
  const centerY = canvas.height / 2;
  const width = canvas.width;
  
  // Sort by x position
  const sortedPath = [...path].sort((a, b) => a.x - b.x);
  
  // Sample at regular intervals
  for (let i = 0; i < numSamples; i++) {
    const x = i / numSamples * width;
    
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
    samples[i] = -(y - centerY) / (centerY * 0.8);
  }
  
  return samples;
}

/**
 * Create a periodic wave from samples
 */
function createCustomPeriodicWave(samples) {
  if (!samples || samples.length === 0) return null;
  
  // Ensure we have an audio context
  if (!window.audioContext) {
    try {
      window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  
  try {
    // Create a PeriodicWave from samples
    const numSamples = samples.length;
    const real = new Float32Array(numSamples);
    const imag = new Float32Array(numSamples);
    
    // Simple DFT calculation
    for (let k = 0; k < numSamples; k++) {
      real[k] = 0;
      imag[k] = 0;
      
      for (let n = 0; n < numSamples; n++) {
        const phi = (2 * Math.PI * k * n) / numSamples;
        real[k] += samples[n] * Math.cos(phi);
        imag[k] -= samples[n] * Math.sin(phi);
      }
      
      real[k] /= numSamples;
      imag[k] /= numSamples;
    }
    
    // Create the PeriodicWave
    const wave = window.audioContext.createPeriodicWave(real, imag);
    
    // Store for later use
    window.customPeriodicWave = wave;
    window.customWaveformCoefficients = { real, imag };
    
    return wave;
  } catch (e) {
    return null;
  }
}

/**
 * Apply the custom waveform to the main application
 */
function applyCustomWaveform() {
  if (!window.customWaveformState || window.customWaveformState.path.length < 2) return;
  
  // Generate samples from the drawn path
  const samples = generateWaveformSamples(window.customWaveformState.path);
  
  // Create periodic wave
  if (samples) {
    createCustomPeriodicWave(samples);
    
    // Set sound profile to custom wave
    const soundProfileDropdown = document.getElementById('sound-profile-dropdown');
    if (soundProfileDropdown) {
      soundProfileDropdown.value = 'custom_wave';
      
      // Dispatch change event
      const event = new Event('change');
      soundProfileDropdown.dispatchEvent(event);
      
      // If we're playing, update audio
      if (window.app && window.app.isPlaying) {
        // Stop current audio
        if (typeof window.stopSonification === 'function') {
          window.stopSonification();
        }
        
        // Start with custom wave
        startCustomWaveSonification();
      }
    }
  }
}

/**
 * Update custom wave frequency based on current data value
 */
function updateCustomWaveFrequency() {
    if (!window.customWaveOscillator) return;
    
    try {
      // Get current value from your data
      const currentValue = window.getCurrentValue ? window.getCurrentValue() : 0;
      
      // Get value range for normalization
      let minValue = 0, maxValue = 100;
      if (window.app && window.app.data && window.app.data.filtered && window.app.data.filtered.length > 0) {
        const valueGetter = d => d[window.app.currentMetric] || 0;
        minValue = window.d3.min(window.app.data.filtered, valueGetter) * 0.9;
        maxValue = window.d3.max(window.app.data.filtered, valueGetter) * 1.1;
      }
      
      // Normalize value between 0-1
      const normalizedValue = (currentValue - minValue) / (maxValue - minValue || 1);
      
      // Define frequency range (Hz)
      const minFrequency = 50;
      const maxFrequency = 2000;
      
      // Calculate frequency based on normalized value
      const frequency = minFrequency + normalizedValue * (maxFrequency - minFrequency);
      
      // Apply to oscillator with smoothing
      window.customWaveOscillator.frequency.setTargetAtTime(
        frequency, 
        window.audioContext.currentTime, 
        0.05  // Time constant for smoothing
      );
    } catch (e) {
      // Fail silently
    }
  }

  // Patch updateSonification to update custom wave frequency
if (typeof window.updateSonification === 'function' && !window.originalUpdateSonification) {
    window.originalUpdateSonification = window.updateSonification;
    
    window.updateSonification = function() {
      // Call original function
      window.originalUpdateSonification();
      
      // If we're using custom wave, update its frequency
      if (window.currentOscillatorType === 'custom_wave' && window.customWaveOscillator) {
        updateCustomWaveFrequency();
      }
    };
  }