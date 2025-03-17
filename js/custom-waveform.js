/**
 * custom-waveform.js
 * Allows users to draw custom waveforms for audio visualization
 */

// Store drawing state
let drawingState = {
  isDrawing: false,
  path: [],
  color: '#1db954',
  canvas: null,
  ctx: null
};

// Custom waveform data
let customWaveform = null;

/**
 * Initialize the waveform canvas
 */
function initWaveformCanvas() {
  const canvas = document.getElementById('waveform-canvas');
  if (!canvas) return;
  
  // Set canvas dimensions based on container
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  
  // Get drawing context
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Store canvas and context
  drawingState.canvas = canvas;
  drawingState.ctx = ctx;
  
  // Clear canvas
  clearCanvas();
  
  // Set up event listeners for drawing
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  
  // Touch support
  canvas.addEventListener('touchstart', handleTouch(startDrawing));
  canvas.addEventListener('touchmove', handleTouch(draw));
  canvas.addEventListener('touchend', stopDrawing);
  
  // Color picker
  const colorPicker = document.getElementById('wave-color');
  if (colorPicker) {
    colorPicker.addEventListener('change', () => {
      drawingState.color = colorPicker.value;
      redrawPath();
    });
  }
  
  console.log('Waveform canvas initialized');
}

/**
 * Start drawing on canvas
 */
function startDrawing(e) {
  drawingState.isDrawing = true;
  
  const rect = drawingState.canvas.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;
  
  drawingState.path = [{x, y}];
  
  drawingState.ctx.beginPath();
  drawingState.ctx.moveTo(x, y);
  drawingState.ctx.lineTo(x, y);
  drawingState.ctx.stroke();
  
  if (e.preventDefault) e.preventDefault();
}

/**
 * Draw on canvas
 */
function draw(e) {
  if (!drawingState.isDrawing) return;
  
  const rect = drawingState.canvas.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;
  
  drawingState.path.push({x, y});
  
  drawingState.ctx.lineTo(x, y);
  drawingState.ctx.stroke();
  
  if (e.preventDefault) e.preventDefault();
}

/**
 * Stop drawing
 */
function stopDrawing() {
  if (drawingState.isDrawing) {
    drawingState.isDrawing = false;
    
    // Sort path points by x position to ensure left-to-right ordering
    drawingState.path.sort((a, b) => a.x - b.x);
    
    // Generate the waveform preview
    updateWaveformPreview();
  }
}

/**
 * Clear the drawing canvas
 */
function clearCanvas() {
  if (!drawingState.ctx || !drawingState.canvas) return;
  
  // Clear canvas
  drawingState.ctx.clearRect(0, 0, drawingState.canvas.width, drawingState.canvas.height);
  
  // Set background
  drawingState.ctx.fillStyle = '#121212';
  drawingState.ctx.fillRect(0, 0, drawingState.canvas.width, drawingState.canvas.height);
  
  // Draw center line
  drawingState.ctx.strokeStyle = '#333333';
  drawingState.ctx.lineWidth = 1;
  drawingState.ctx.beginPath();
  drawingState.ctx.moveTo(0, drawingState.canvas.height / 2);
  drawingState.ctx.lineTo(drawingState.canvas.width, drawingState.canvas.height / 2);
  drawingState.ctx.stroke();
  
  // Reset path
  drawingState.path = [];
  
  // Reset drawing style
  drawingState.ctx.strokeStyle = drawingState.color;
  drawingState.ctx.lineWidth = 3;
  drawingState.ctx.lineCap = 'round';
  drawingState.ctx.lineJoin = 'round';
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
 * Redraw the current path with updated settings
 */
function redrawPath() {
  if (drawingState.path.length < 2) return;
  
  // Clear canvas first
  clearCanvas();
  
  // Set drawing style
  drawingState.ctx.strokeStyle = drawingState.color;
  drawingState.ctx.lineWidth = 3;
  
  // Redraw path
  drawingState.ctx.beginPath();
  drawingState.ctx.moveTo(drawingState.path[0].x, drawingState.path[0].y);
  
  for (let i = 1; i < drawingState.path.length; i++) {
    drawingState.ctx.lineTo(drawingState.path[i].x, drawingState.path[i].y);
  }
  
  drawingState.ctx.stroke();
}

/**
 * Smooth the waveform
 */
function smoothWaveform() {
  if (drawingState.path.length < 3) {
    console.log('Not enough points to smooth');
    return;
  }
  
  // Create a new smoothed path
  const smoothedPath = [];
  
  // Apply a moving average filter
  const windowSize = 5;
  
  for (let i = 0; i < drawingState.path.length; i++) {
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    
    // Calculate window bounds
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(drawingState.path.length - 1, i + Math.floor(windowSize / 2));
    
    // Calculate average within window
    for (let j = start; j <= end; j++) {
      sumX += drawingState.path[j].x;
      sumY += drawingState.path[j].y;
      count++;
    }
    
    smoothedPath.push({
      x: sumX / count,
      y: sumY / count
    });
  }
  
  // Update path
  drawingState.path = smoothedPath;
  
  // Redraw with smoothed path
  redrawPath();
  
  // Update waveform preview
  updateWaveformPreview();
}

/**
 * Update waveform preview
 */
function updateWaveformPreview() {
  // Generate waveform from the drawn path
  const waveform = generateWaveformFromPath();
  
  // Visual feedback could be added here
  console.log('Waveform preview updated');
}

/**
 * Generate waveform data from the drawn path
 */
function generateWaveformFromPath() {
  if (drawingState.path.length < 2) return null;
  
  const canvas = drawingState.canvas;
  const centerY = canvas.height / 2;
  const samples = 64; // Number of samples for waveform
  
  // Create a sampled waveform
  const waveform = new Float32Array(samples);
  
  // Sort by x position
  const sortedPath = [...drawingState.path].sort((a, b) => a.x - b.x);
  
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
  
  return waveform;
}

/**
 * Apply custom waveform to audio
 */
function applyCustomWaveform() {
  if (drawingState.path.length < 2) {
    console.log('No waveform drawn');
    return;
  }
  
  try {
    // Get audio context
    if (!window.audioContext) {
      window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Generate waveform
    const waveform = generateWaveformFromPath();
    if (!waveform) return;
    
    // Create periodic wave using FFT
    const samples = waveform.length;
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
    
    // Create periodic wave
    customWaveform = window.audioContext.createPeriodicWave(real, imag);
    
    // Store waveform data
    window.customWaveformData = {
      waveform: waveform,
      real: real,
      imag: imag
    };
    
    // Update oscillator if playing
    if (window.oscillator && document.getElementById('sound-profile-dropdown').value === 'custom_wave') {
      try {
        window.oscillator.setPeriodicWave(customWaveform);
        console.log('Applied custom waveform to oscillator');
      } catch (e) {
        console.error('Error applying custom waveform:', e);
      }
    }
    
    // Make sure the custom wave option is selected
    const dropdown = document.getElementById('sound-profile-dropdown');
    if (dropdown) {
      dropdown.value = 'custom_wave';
      
      // Trigger change event
      const event = new Event('change');
      dropdown.dispatchEvent(event);
    }
    
    console.log('Custom waveform applied successfully');
    return true;
  } catch (e) {
    console.error('Error applying custom waveform:', e);
    return false;
  }
}

/**
 * Create preset waveforms
 */
function createPresetWaveform(type) {
  // Clear canvas
  clearCanvas();
  
  const canvas = drawingState.canvas;
  const width = canvas.width;
  const height = canvas.height;
  const centerY = height / 2;
  const ctx = drawingState.ctx;
  
  // Reset path
  drawingState.path = [];
  
  // Set drawing style
  ctx.strokeStyle = drawingState.color;
  ctx.lineWidth = 3;
  
  // Draw waveform
  ctx.beginPath();
  
  // Different wave patterns based on type
  for (let x = 0; x < width; x += 1) {
    const normalizedX = x / width * 2 * Math.PI;
    let y;
    
    switch (type) {
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
      default:
        y = Math.sin(normalizedX * 2);
    }
    
    // Scale and position
    const scaledY = centerY - (y * height / 3);
    
    // Add to path
    drawingState.path.push({x, y: scaledY});
    
    if (x === 0) {
      ctx.moveTo(x, scaledY);
    } else {
      ctx.lineTo(x, scaledY);
    }
  }
  
  ctx.stroke();
  
  // Update preview
  updateWaveformPreview();
}

/**
 * Set up oscillator with custom waveform
 */
function setupOscillatorWithCustomWaveform() {
  if (!customWaveform) return false;
  
  try {
    // Stop existing oscillator
    if (window.oscillator) {
      try {
        window.oscillator.stop();
        window.oscillator.disconnect();
      } catch (e) {
        // Ignore errors during stop
      }
    }
    
    // Create new oscillator
    window.oscillator = audioContext.createOscillator();
    
    // Set periodic wave
    window.oscillator.setPeriodicWave(customWaveform);
    
    // Connect
    window.oscillator.connect(window.gainNode);
    window.oscillator.start();
    
    console.log('Oscillator setup with custom waveform');
    return true;
  } catch (e) {
    console.error('Error setting up oscillator with custom waveform:', e);
    return false;
  }
}

// Create preset buttons
document.addEventListener('DOMContentLoaded', function() {
  // Check if preset buttons exist
  const presetContainer = document.createElement('div');
  presetContainer.className = 'preset-buttons';
  presetContainer.style.marginTop = '10px';
  presetContainer.style.display = 'flex';
  presetContainer.style.gap = '8px';
  
  // Add preset buttons
  const presets = [
    { id: 'sine', name: 'Sine' },
    { id: 'triangle', name: 'Triangle' },
    { id: 'square', name: 'Square' },
    { id: 'sawtooth', name: 'Sawtooth' }
  ];
  
  // Add buttons
  presets.forEach(preset => {
    const button = document.createElement('button');
    button.className = 'waveform-control-btn';
    button.textContent = preset.name;
    button.addEventListener('click', () => createPresetWaveform(preset.id));
    presetContainer.appendChild(button);
  });
  
  // Add to modal when it's loaded
  const modalCheckInterval = setInterval(() => {
    const modalContent = document.querySelector('.waveform-modal-content');
    if (modalContent && !document.querySelector('.preset-buttons')) {
      const controlOptions = modalContent.querySelector('.control-options');
      if (controlOptions) {
        controlOptions.appendChild(presetContainer);
        clearInterval(modalCheckInterval);
      }
    }
  }, 100);
});

// Connect to audio processor
document.addEventListener('DOMContentLoaded', function() {
  // Update oscillator type when changing to custom waveform
  const soundProfileDropdown = document.getElementById('sound-profile-dropdown');
  if (soundProfileDropdown) {
    const originalOnChange = soundProfileDropdown.onchange;
    
    soundProfileDropdown.addEventListener('change', function() {
      if (this.value === 'custom_wave' && customWaveform && window.oscillator && app.isPlaying) {
        setupOscillatorWithCustomWaveform();
      }
      
      // Call original handler if it exists
      if (typeof originalOnChange === 'function') {
        originalOnChange.call(this);
      }
    });
  }
});

// Make functions globally available
window.initWaveformCanvas = initWaveformCanvas;
window.clearCanvas = clearCanvas;
window.smoothWaveform = smoothWaveform;
window.applyCustomWaveform = applyCustomWaveform;
window.createPresetWaveform = createPresetWaveform;