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
    CUSTOM_AUDIO: 'custom_audio'
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
    const minFrequency = 150;
    const maxFrequency = 1500;
    
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
  
  // Connect to sound profile dropdown
  document.addEventListener('DOMContentLoaded', function() {
    const soundProfileDropdown = document.getElementById('sound-profile-dropdown');
    if (soundProfileDropdown) {
      // Set initial value
      currentOscillatorType = soundProfileDropdown.value || WAVEFORM_TYPES.SINE;
      
      // Add change handler
      soundProfileDropdown.addEventListener('change', function() {
        setOscillatorType(this.value);
        
        // Toggle custom audio section
        const soundUploadSection = document.getElementById('sound-upload-section');
        if (soundUploadSection) {
          soundUploadSection.style.display = this.value === WAVEFORM_TYPES.CUSTOM_AUDIO ? 'block' : 'none';
        }
        
        // Start/stop appropriate audio
        if (app.isPlaying) {
          stopSonification();
          startSonification();
        }
      });
    }
  });