/**
 * Optimized audio processor
 * Handles sonification with custom audio support
 */

// Audio oscillator types

const WAVEFORM_TYPES = {
    SINE: 'sine',
    TRIANGLE: 'triangle',
    SQUARE: 'square',
    SAWTOOTH: 'sawtooth',
    CUSTOM_AUDIO: 'custom_audio',
    CUSTOM_WAVE: 'custom_wave'  // Add this line
  };
  
  // Current oscillator type
  let currentOscillatorType = WAVEFORM_TYPES.SINE;
  
  /**
   * Initialize audio context and components
   */
  function initAudio() {
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create gain node for volume control
        gainNode = audioContext.createGain();
        gainNode.gain.value = 0.2; // Set volume to 20%
        
        // Create analyzer for visualization
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        audioDataArray = new Uint8Array(analyser.frequencyBinCount);
        
        // Connect nodes
        gainNode.connect(analyser);
        analyser.connect(audioContext.destination);
        
        console.log('Audio context initialized');
      } catch (e) {
        console.error('Failed to initialize audio context:', e);
      }
    }
  }
  
  /**
   * Start sonification
   */
  function startSonification() {
    if (!audioContext) initAudio();
    
    if (!audioContext) return;
    
    try {
      // Handle custom audio
      if (currentOscillatorType === WAVEFORM_TYPES.CUSTOM_AUDIO) {
        if (window.customAudio) {
          window.customAudio.play()
            .then(() => {
              console.log('Custom audio playback started');
            })
            .catch(e => {
              console.error('Error playing custom audio:', e);
            });
        }
        return;
      }
      
      // Standard oscillator-based sonification
      if (!oscillator) {
        oscillator = audioContext.createOscillator();
        oscillator.type = currentOscillatorType;
        oscillator.connect(gainNode);
        oscillator.start();
        console.log('Sonification started with waveform:', currentOscillatorType);
      }
    } catch (e) {
      console.error('Failed to start sonification:', e);
    }
  }
  
  /**
   * Stop sonification
   */
  function stopSonification() {
    // Stop oscillator
    if (oscillator) {
      try {
        oscillator.stop();
        oscillator.disconnect();
        oscillator = null;
        console.log('Oscillator sonification stopped');
      } catch (e) {
        console.error('Error stopping oscillator:', e);
        oscillator = null;
      }
    }
    
    // Stop custom audio
    if (window.customAudio && !window.customAudio.paused) {
      window.customAudio.pause();
      console.log('Custom audio playback paused');
    }
  }
  
  /**
   * Update sonification based on current value
   */
  function updateSonification() {
    try {
      // Get current value
      const currentValue = getCurrentValue();
      
      // Get value range
      const valueGetter = d => d[app.currentMetric] || 0;
      const minValue = d3.min(app.data.filtered, valueGetter) * 0.9;
      const maxValue = d3.max(app.data.filtered, valueGetter) * 1.1;
      
      // Normalize value between 0-1
      const normalizedValue = (currentValue - minValue) / (maxValue - minValue || 1);
      
      // Update audio based on type
      if (currentOscillatorType === WAVEFORM_TYPES.CUSTOM_AUDIO) {
        // Update custom audio pitch
        if (typeof window.updateCustomAudioPitch === 'function') {
          window.updateCustomAudioPitch(normalizedValue);
        } else {
          updateCustomAudioPlayback(normalizedValue);
        }
      } else if (oscillator) {
        // Update oscillator frequency
        updateOscillatorFrequency(normalizedValue);
      }
      
      // Update visualization data
      updateVisualizationData();
    } catch (e) {
      console.error('Error updating sonification:', e);
    }
  }
  
  /**
   * Update custom audio playback rate based on data
   */
  function updateCustomAudioPlayback(normalizedValue) {
    if (!window.customAudio || window.customAudio.paused) return;
    
    try {
      // Get pitch range settings
      const pitchRange = window.pitchSettings ? 
          window.pitchSettings.custom || 
          { min: 0.5, max: 2.0 } : 
          { min: 0.5, max: 2.0 };
      
      // Apply musical pitch shifting using semitones
      // This creates a more pleasing, scale-based sound rather than continuous pitch shifting
      const semitoneRange = 24; // Two octaves range
      const semitones = Math.round(normalizedValue * semitoneRange);
      
      // Convert semitones to frequency ratio (2^(n/12) for n semitones)
      const ratio = Math.pow(2, semitones / 12);
      
      // Clamp to the configured range
      const targetRate = Math.max(pitchRange.min, Math.min(pitchRange.max, ratio));
      
      // Apply with smoothing
      if (window.customAudio.playbackRate !== targetRate) {
        const currentRate = window.customAudio.playbackRate;
        const smoothFactor = 0.1;
        
        window.customAudio.playbackRate = currentRate + (targetRate - currentRate) * smoothFactor;
      }
    } catch (e) {
      console.error('Error updating custom audio playback:', e);
    }
  }
  
  /**
   * Update oscillator frequency based on data
   */
  function updateOscillatorFrequency(normalizedValue) {
    // Define frequency range
    const minFrequency = 50;
    const maxFrequency = 3000;
    
    // Calculate frequency
    const frequency = minFrequency + normalizedValue * (maxFrequency - minFrequency);
    
    // Update oscillator frequency with smoothing
    oscillator.frequency.setTargetAtTime(frequency, audioContext.currentTime, 0.05);
  }
  
  /**
   * Update visualization data from audio
   */
  function updateVisualizationData() {
    if (window.customAudioAnalyzer && window.customAudioDataArray && 
        currentOscillatorType === WAVEFORM_TYPES.CUSTOM_AUDIO) {
      // Get data from custom audio analyzer
      window.customAudioAnalyzer.getByteFrequencyData(window.customAudioDataArray);
      
      // Update circular wave
      if (typeof updateCircularWave === 'function') {
        updateCircularWave();
      }
    } else if (analyser && audioDataArray) {
      // Get data from standard analyzer
      analyser.getByteFrequencyData(audioDataArray);
      
      // Update circular wave
      if (typeof updateCircularWave === 'function') {
        updateCircularWave();
      }
    }
  }
  
  /**
   * Set oscillator type
   */
  function setOscillatorType(type) {
    // Validate type
    if (!Object.values(WAVEFORM_TYPES).includes(type)) {
      console.error('Invalid oscillator type:', type);
      return;
    }
    
    // Update type
    currentOscillatorType = type;
    
    // Update oscillator if running
    if (oscillator && app.isPlaying) {
      // Stop current oscillator
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch (e) {
        // Ignore errors during stop
      }
      
      oscillator = null;
      
      // Start new oscillator if not using custom audio
      if (type !== WAVEFORM_TYPES.CUSTOM_AUDIO) {
        oscillator = audioContext.createOscillator();
        oscillator.type = type;
        oscillator.connect(gainNode);
        oscillator.start();
      }
    }
    
    console.log('Oscillator type set to:', type);
  }

// // Updated audio-processor.js with fixes for the pitch range slider

// // First, ensure these global variables are defined at the top of audio-processor.js
// // alongside other global variables
// let minFrequency = 40;    // Default minimum frequency in Hz
// let maxFrequency = 4500;  // Default maximum frequency in Hz

// /**
//  * Creates a dual range slider for controlling pitch frequency range
//  * @param {string} containerId - The ID of the container element
//  * @param {number} minValue - Minimum possible value (default: 40Hz)
//  * @param {number} maxValue - Maximum possible value (default: 4500Hz)
//  * @param {number} initialLow - Initial low value
//  * @param {number} initialHigh - Initial high value
//  * @param {Function} onRangeChange - Callback for range changes
//  * @returns {Object} - Controller API for the slider
//  */
// function createPitchRangeSlider(containerId, minValue = 40, maxValue = 4500, initialLow = 40, initialHigh = 4500, onRangeChange) {
//   const container = document.getElementById(containerId);
//   if (!container) return;
  
//   // Clear any existing content
//   container.innerHTML = '';
  
//   // Create slider container
//   const sliderContainer = document.createElement('div');
//   sliderContainer.className = 'pitch-range-slider';
//   sliderContainer.style.width = '100%';
//   sliderContainer.style.padding = '10px 15px';
  
//   // Create header with label and values
//   const headerContainer = document.createElement('div');
//   headerContainer.style.display = 'flex';
//   headerContainer.style.justifyContent = 'space-between';
//   headerContainer.style.marginBottom = '8px';
  
//   const sliderLabel = document.createElement('div');
//   sliderLabel.innerHTML = '<span style="font-weight: 600; color: white;">Pitch Range</span>';
  
//   const valueDisplay = document.createElement('div');
//   valueDisplay.id = `${containerId}-values`;
//   valueDisplay.style.fontSize = '12px';
//   valueDisplay.style.color = '#b3b3b3';
  
//   headerContainer.appendChild(sliderLabel);
//   headerContainer.appendChild(valueDisplay);
  
//   // Create track container
//   const trackContainer = document.createElement('div');
//   trackContainer.style.position = 'relative';
//   trackContainer.style.height = '40px';
//   trackContainer.style.width = '100%';
  
//   // Create background track
//   const track = document.createElement('div');
//   track.style.position = 'absolute';
//   track.style.top = '16px';
//   track.style.left = '0';
//   track.style.width = '100%';
//   track.style.height = '8px';
//   track.style.backgroundColor = '#333';
//   track.style.borderRadius = '4px';
  
//   // Create colored range between handles
//   const rangeTrack = document.createElement('div');
//   rangeTrack.id = `${containerId}-range`;
//   rangeTrack.style.position = 'absolute';
//   rangeTrack.style.top = '16px';
//   rangeTrack.style.height = '8px';
//   rangeTrack.style.borderRadius = '4px';
//   rangeTrack.style.background = 'linear-gradient(90deg, #1db954, #4a90e2)';
  
//   // Create min handle
//   const minHandle = document.createElement('div');
//   minHandle.id = `${containerId}-min-handle`;
//   minHandle.className = 'slider-handle min-handle';
//   minHandle.style.position = 'absolute';
//   minHandle.style.top = '8px';
//   minHandle.style.width = '24px';
//   minHandle.style.height = '24px';
//   minHandle.style.backgroundColor = 'white';
//   minHandle.style.border = '4px solid #1db954';
//   minHandle.style.borderRadius = '50%';
//   minHandle.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
//   minHandle.style.cursor = 'grab';
//   minHandle.style.zIndex = '10';
//   minHandle.style.marginLeft = '-12px';
  
//   // Create max handle
//   const maxHandle = document.createElement('div');
//   maxHandle.id = `${containerId}-max-handle`;
//   maxHandle.className = 'slider-handle max-handle';
//   maxHandle.style.position = 'absolute';
//   maxHandle.style.top = '8px';
//   maxHandle.style.width = '24px';
//   maxHandle.style.height = '24px';
//   maxHandle.style.backgroundColor = 'white';
//   maxHandle.style.border = '4px solid #4a90e2';
//   maxHandle.style.borderRadius = '50%';
//   maxHandle.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
//   maxHandle.style.cursor = 'grab';
//   maxHandle.style.zIndex = '10';
//   maxHandle.style.marginLeft = '-12px';
  
//   // Create tick marks
//   const tickContainer = document.createElement('div');
//   tickContainer.style.display = 'flex';
//   tickContainer.style.justifyContent = 'space-between';
//   tickContainer.style.marginTop = '8px';
//   tickContainer.style.fontSize = '12px';
//   tickContainer.style.color = '#999';
  
//   const ticks = ['40Hz', '500Hz', '1kHz', '2kHz', '4.5kHz'];
//   ticks.forEach(tick => {
//     const tickEl = document.createElement('span');
//     tickEl.textContent = tick;
//     tickContainer.appendChild(tickEl);
//   });
  
//   // Add all elements to container
//   trackContainer.appendChild(track);
//   trackContainer.appendChild(rangeTrack);
//   trackContainer.appendChild(minHandle);
//   trackContainer.appendChild(maxHandle);
  
//   sliderContainer.appendChild(headerContainer);
//   sliderContainer.appendChild(trackContainer);
//   sliderContainer.appendChild(tickContainer);
  
//   container.appendChild(sliderContainer);
  
//   // Initialize values
//   let lowValue = initialLow;
//   let highValue = initialHigh;
  
//   // Format displayed values
//   function formatValue(value) {
//     if (value >= 1000) {
//       return `${(value / 1000).toFixed(1)}kHz`;
//     }
//     return `${value}Hz`;
//   }
  
//   // Update UI based on values
//   function updateUI() {
//     // Calculate positions (as percentages)
//     const rangeSize = maxValue - minValue;
//     const lowPos = ((lowValue - minValue) / rangeSize) * 100;
//     const highPos = ((highValue - minValue) / rangeSize) * 100;
    
//     // Update positions and width
//     rangeTrack.style.left = `${lowPos}%`;
//     rangeTrack.style.width = `${highPos - lowPos}%`;
//     minHandle.style.left = `${lowPos}%`;
//     maxHandle.style.left = `${highPos}%`;
    
//     // Update value display
//     valueDisplay.textContent = `${formatValue(lowValue)} - ${formatValue(highValue)}`;
//   }
  
//   // Initialize UI
//   updateUI();
  
//   // Handle drag events for the min handle
//   let minDragging = false;
//   minHandle.addEventListener('mousedown', (e) => {
//     minDragging = true;
//     document.body.style.cursor = 'grabbing';
//     minHandle.style.cursor = 'grabbing';
//     e.preventDefault();
//   });
  
//   // Handle drag events for the max handle
//   let maxDragging = false;
//   maxHandle.addEventListener('mousedown', (e) => {
//     maxDragging = true;
//     document.body.style.cursor = 'grabbing';
//     maxHandle.style.cursor = 'grabbing';
//     e.preventDefault();
//   });
  
//   // Mouse move and mouse up event handlers for both sliders
//   document.addEventListener('mousemove', (e) => {
//     if (!minDragging && !maxDragging) return;
    
//     // Get mouse position relative to track
//     const trackRect = track.getBoundingClientRect();
//     let mousePos = (e.clientX - trackRect.left) / trackRect.width;
//     mousePos = Math.max(0, Math.min(1, mousePos)); // Clamp to 0-1
    
//     const newValue = minValue + (maxValue - minValue) * mousePos;
    
//     if (minDragging) {
//       // Ensure min doesn't go above max - 1% of range
//       const minThreshold = highValue - (maxValue - minValue) * 0.01;
//       lowValue = Math.max(minValue, Math.min(newValue, minThreshold));
//     } else if (maxDragging) {
//       // Ensure max doesn't go below min + 1% of range
//       const maxThreshold = lowValue + (maxValue - minValue) * 0.01;
//       highValue = Math.min(maxValue, Math.max(newValue, maxThreshold));
//     }
    
//     updateUI();
    
//     if (onRangeChange) {
//       onRangeChange([Math.round(lowValue), Math.round(highValue)]);
//     }
//   });
  
//   document.addEventListener('mouseup', () => {
//     if (minDragging || maxDragging) {
//       minDragging = false;
//       maxDragging = false;
//       document.body.style.cursor = 'default';
//       minHandle.style.cursor = 'grab';
//       maxHandle.style.cursor = 'grab';
//     }
//   });
  
//   // Return an API for external control
//   return {
//     getValues: () => [lowValue, highValue],
//     setValues: (low, high) => {
//       lowValue = Math.max(minValue, Math.min(low, highValue));
//       highValue = Math.min(maxValue, Math.max(high, lowValue));
//       updateUI();
//     }
//   };
// }

// // Add this function to initialize the pitch range slider
// function initPitchRangeSlider() {
//   const pitchRangeContainer = document.getElementById('pitch-range-container');
  
//   if (!pitchRangeContainer) {
//     console.warn('Pitch range container not found');
//     return;
//   }
  
//   return createPitchRangeSlider('pitch-range-container', 40, 4500, 40, 4500, (values) => {
//     // Update the audio processing with new frequency range
//     updateFrequencyRange(values[0], values[1]);
//   });
// }

// // Add this function to update the audio frequency range - FIXED VERSION
// function updateFrequencyRange(minFreq, maxFreq) {
//   // Update the minimum and maximum frequencies used for audio processing
//   minFrequency = minFreq;
//   maxFrequency = maxFreq;
  
//   console.log(`Frequency range updated: ${minFreq}Hz - ${maxFreq}Hz`);
  
//   // Only update oscillator if it exists and is active
//   if (typeof audioContext !== 'undefined' && audioContext) {
//     // The currentOscillator may not be directly accessible or defined here
//     // Instead, store the frequency range values and use them when creating new oscillators
//     // or in the mapping functions that calculate frequencies
    
//     // Example: If you have a function that calculates frequency from data:
//     // calculateFrequency = (value) => {
//     //   // Map the value to the frequency range
//     //   return minFrequency + (maxFrequency - minFrequency) * (value / 100);
//     // };
//   }
// }
  
//   // Connect to sound profile dropdown
//   document.addEventListener('DOMContentLoaded', function() {
//     const soundProfileDropdown = document.getElementById('sound-profile-dropdown');
//     if (soundProfileDropdown) {
//       // Set initial value
//       currentOscillatorType = soundProfileDropdown.value || WAVEFORM_TYPES.SINE;
      
//       // Add change handler
//       soundProfileDropdown.addEventListener('change', function() {
//         setOscillatorType(this.value);
        
//         // Toggle custom audio section
//         const soundUploadSection = document.getElementById('sound-upload-section');
//         if (soundUploadSection) {
//           soundUploadSection.style.display = this.value === WAVEFORM_TYPES.CUSTOM_AUDIO ? 'block' : 'none';
//         }
        
//         // Start/stop appropriate audio
//         if (app.isPlaying) {
//           stopSonification();
//           startSonification();
//         }
//       });
//     }

//     initPitchRangeSlider();
//   });

  