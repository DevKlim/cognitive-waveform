/**
 * custom-audio-connector.js
 * Ensures the custom audio button functions correctly, with proper sound effects.
 *
 * This version repurposes the existing pitch slider (renamed "Tone Shift") to
 * apply a basic offline granular pitch–shift when the custom audio mode is active.
 * It does not use SoundTouch.
 */

/* --- BasicPitchShifter ---
   A very simple, offline granular pitch shifter.
   It processes an AudioBuffer by splitting it into overlapping grains,
   resampling each grain using linear interpolation (to shift pitch),
   applying a Hann window, and overlap–adding the grains back together.
*/
class BasicPitchShifter {
    constructor(context, grainSize = 0.1, overlap = 0.5) {
      this.context = context;
      this.grainSize = grainSize; // in seconds
      this.overlap = overlap;     // fraction (0 to 1)
    }
  
    process(buffer, pitchFactor) {
      const sampleRate = buffer.sampleRate;
      const grainSizeSamples = Math.floor(this.grainSize * sampleRate);
      const stepSizeSamples = Math.floor(grainSizeSamples * (1 - this.overlap));
      const numChannels = buffer.numberOfChannels;
      const inputLength = buffer.length;
      const outputBuffer = this.context.createBuffer(numChannels, inputLength, sampleRate);
  
      for (let channel = 0; channel < numChannels; channel++) {
        const inputData = buffer.getChannelData(channel);
        const outputData = outputBuffer.getChannelData(channel);
        // Initialize output to zeros.
        for (let i = 0; i < inputLength; i++) {
          outputData[i] = 0;
        }
        
        for (let start = 0; start < inputLength; start += stepSizeSamples) {
          // Determine actual grain size if near the end.
          const actualGrainSize = Math.min(grainSizeSamples, inputLength - start);
          // Extract the grain.
          let grain = new Float32Array(actualGrainSize);
          for (let i = 0; i < actualGrainSize; i++) {
            grain[i] = inputData[start + i];
          }
          // Resample the grain using linear interpolation.
          let resampledGrain = new Float32Array(actualGrainSize);
          for (let i = 0; i < actualGrainSize; i++) {
            const origIndex = i * pitchFactor;
            const index0 = Math.floor(origIndex);
            const index1 = Math.min(index0 + 1, actualGrainSize - 1);
            const frac = origIndex - index0;
            resampledGrain[i] = grain[index0] * (1 - frac) + grain[index1] * frac;
          }
          // Apply a Hann window to smooth grain boundaries.
          for (let i = 0; i < actualGrainSize; i++) {
            const windowValue = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (actualGrainSize - 1));
            resampledGrain[i] *= windowValue;
          }
          // Overlap-add the processed grain into the output.
          for (let i = 0; i < actualGrainSize; i++) {
            if (start + i < inputLength) {
              outputData[start + i] += resampledGrain[i];
            }
          }
        }
      }
      return outputBuffer;
    }
  }
  
  /* --- End BasicPitchShifter --- */
  
  /* --- Audio Setup and Fallbacks --- */
  document.addEventListener('DOMContentLoaded', function() {
    console.log("Setting up custom audio functionality");
    
    function initializeAudioFunctionality() {
      const soundProfileDropdown = document.getElementById('sound-profile-dropdown');
      const soundUploadSection = document.getElementById('sound-upload-section');
      const soundFileInput = document.getElementById('sound-file-input');
      
      if (!soundProfileDropdown || !soundUploadSection || !soundFileInput) {
        console.log("Waiting for audio elements to be created...");
        return false;
      }
      
      console.log("Found all audio elements - setting up handlers");
      
      if (!soundFileInput._hasUploadHandler) {
        soundFileInput.addEventListener('change', function(event) {
          if (event.target.files.length > 0) {
            if (typeof handleSoundFileUpload === 'function') {
              handleSoundFileUpload(event);
            } else {
              setupBasicAudioHandling(event);
            }
          }
        });
        
        soundFileInput._hasUploadHandler = true;
        console.log("Added file upload handler");
      }
      
      ensureAudioProcessorConnection();
      
      return true;
    }
    
    let attempts = 0;
    const maxAttempts = 10; 
    const interval = 300;
    
    function checkForElements() {
      attempts++;
      if (initializeAudioFunctionality()) {
        console.log("Audio functionality initialized successfully");
      } else if (attempts < maxAttempts) {
        console.log(`Attempt ${attempts}/${maxAttempts} to initialize audio functionality`);
        setTimeout(checkForElements, interval);
      } else {
        console.warn("Failed to initialize audio functionality after maximum attempts");
      }
    }
    
    setTimeout(checkForElements, 500);
  });
  
  /* --- Ensure Custom Waveform Dropdown --- */
  function ensureCustomWaveformInDropdown() {
    const soundProfileDropdown = document.getElementById('sound-profile-dropdown');
    if (!soundProfileDropdown) return;
    
    if (window.SOUND_PROFILES) {
      let hasCustomWave = false;
      for (let i = 0; i < window.SOUND_PROFILES.length; i++) {
        if (window.SOUND_PROFILES[i].id === 'custom_wave') {
          hasCustomWave = true;
          break;
        }
      }
      if (!hasCustomWave) {
        window.SOUND_PROFILES.push({
          id: 'custom_wave',
          name: 'Custom Waveform',
          waveform: 'custom',
          frequencyRange: { min: 150, max: 1500 }
        });
        console.log('Added custom_wave profile to SOUND_PROFILES');
      }
    }
    
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(ensureCustomWaveformInDropdown, 1000);
    });
    
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
      console.log('Added custom_wave option to sound profile dropdown');
    }
  }
  
  /* --- Basic Audio Handling --- */
  function setupBasicAudioHandling(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log("Setting up basic audio handling for file:", file.name);
    
    const soundPreview = document.getElementById('sound-preview');
    if (soundPreview) {
      soundPreview.style.display = 'block';
      soundPreview.innerHTML = `
        <div class="sound-file-info">
          <div class="sound-file-name">${file.name}</div>
          <div class="sound-file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</div>
        </div>
        <div class="sound-controls">
          <button id="play-sound-preview" class="play-sound-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <div class="sound-settings">
            <label class="setting-item">
              <span>Tone Shift:</span>
              <!-- The slider (added via addPitchRangeSlider) controls tone shifting -->
            </label>
          </div>
        </div>
      `;
    }
    
    const soundProfile = document.getElementById('sound-profile-dropdown')?.value;
    if (soundProfile === 'custom_audio') {
      // For custom audio, decode using FileReader and create an AudioPlayer.
      const reader = new FileReader();
      reader.onload = function(ev) {
        window.audioContext.decodeAudioData(ev.target.result).then(function(buffer) {
          // Store the original buffer for reprocessing on slider changes.
          window.originalAudioBuffer = buffer;
          // Create an AudioPlayer instance (your custom implementation)
          window.audioPlayer = new AudioPlayer({
            emitter: window,
            pitch: 1.0,
            tempo: 1.0
          });
          window.audioPlayer.setBuffer(buffer);
          console.log("Custom audio loaded into AudioPlayer");
        }).catch(function(e) {
          console.error("Error decoding audio data:", e);
        });
      };
      reader.readAsArrayBuffer(file);
    } else {
      // For regular audio, use a plain Audio element.
      if (!window.customAudio) {
        window.customAudio = new Audio();
      }
      window.customAudio.src = URL.createObjectURL(file);
      window.customAudio.loop = true;
      
      setupAudioProcessing();
      
      const playButton = document.getElementById('play-sound-preview');
      if (playButton) {
        playButton.addEventListener('click', toggleSoundPlayback);
      }
      
      const loopCheckbox = document.getElementById('loop-sound');
      if (loopCheckbox) {
        loopCheckbox.addEventListener('change', function() {
          if (window.customAudio) {
            window.customAudio.loop = this.checked;
          }
        });
      }
      
      const pitchRangeSelect = document.getElementById('pitch-range');
      if (pitchRangeSelect) {
        pitchRangeSelect.addEventListener('change', updatePitchRange);
      }
      
      if (!window.pitchSettings) {
        window.pitchSettings = {
          range: 'extreme',
          small: { min: 0.8, max: 1.2 },
          medium: { min: 0.5, max: 1.5 },
          large: { min: 0.1, max: 3.0 },
          extreme: { min: 0.005, max: 100.0 }
        };
      }
    }
  }
  
  /* --- Playback Toggle for Regular Audio --- */
  function toggleSoundPlayback() {
    if (!window.customAudio) return;
    
    const playButton = document.getElementById('play-sound-preview');
    if (!playButton) return;
    
    if (window.customAudio.paused) {
      if (window.audioContext && window.audioContext.state === 'suspended') {
        window.audioContext.resume();
      }
      
      window.customAudio.play()
        .then(() => {
          playButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          `;
        })
        .catch(err => {
          console.error('Error playing audio:', err);
        });
    } else {
      window.customAudio.pause();
      playButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      `;
    }
  }
  
  /* --- Update Pitch Range Setting (Dropdown) --- */
  function updatePitchRange() {
    const pitchRangeSelect = document.getElementById('pitch-range');
    if (pitchRangeSelect && window.pitchSettings) {
      window.pitchSettings.range = pitchRangeSelect.value;
      console.log(`Pitch range updated to: ${pitchRangeSelect.value}`);
    }
  }
  
  /* --- Advanced Audio Processing for Regular Audio --- */
  function setupAudioProcessing() {
    if (!window.audioContext) {
      try {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.error('Failed to create audio context:', e);
        return;
      }
    }
    
    try {
      if (window.customAudio._isConnected) {
        console.log('Audio element already connected, skipping setup');
        return;
      }
      
      window.customAudioSource = window.audioContext.createMediaElementSource(window.customAudio);
      
      if (!window.customAudioGain) {
        window.customAudioGain = window.audioContext.createGain();
        window.customAudioGain.gain.value = 0.5;
      }
      
      if (!window.customAudioAnalyzer) {
        window.customAudioAnalyzer = window.audioContext.createAnalyser();
        window.customAudioAnalyzer.fftSize = 256;
        window.customAudioDataArray = new Uint8Array(window.customAudioAnalyzer.frequencyBinCount);
      }
      
      window.customAudioSource.connect(window.customAudioGain);
      window.customAudioGain.connect(window.customAudioAnalyzer);
      window.customAudioAnalyzer.connect(window.audioContext.destination);
      
      window.customAudio._isConnected = true;
      
      // Reset pitch settings for regular audio (tone shifting not applied)
      window.pitchSettings = {
        range: 'extreme',
        small: { min: 0.7, max: 1.3 },
        medium: { min: 0.5, max: 1.7 },
        large: { min: 0.3, max: 2.5 },
        extreme: { min: 0.15, max: 100.0 }
      };
      
      window.enablePitchShiftMode = true;
      
      console.log('Advanced audio processing set up successfully');
    } catch (e) {
      console.error('Error setting up audio processing:', e);
    }
  }
  
  /* --- Offline Pitch Shifting for Custom Audio ---
       This function uses our BasicPitchShifter to process the original audio buffer
       with the new pitch factor and then updates the AudioPlayer's buffer.
  */
  function updateFallbackSoundPitch(newPitch) {
    // Only run if custom audio is active and we have an original buffer.
    if (document.getElementById('sound-profile-dropdown')?.value !== 'custom_audio') return;
    if (!window.audioPlayer || !window.originalAudioBuffer) return;
    
    try {
      let shifter = new BasicPitchShifter(window.audioContext, 0.1, 0.5);
      let newBuffer = shifter.process(window.originalAudioBuffer, newPitch);
      window.audioPlayer.setBuffer(newBuffer);
      console.log("Applied pitch shift:", newPitch);
    } catch (e) {
      console.error("Error updating sound pitch:", e);
    }
  }
  
  /* --- Tone Shift Slider (Repurposed Pitch Range Slider) --- */
  function addPitchRangeSlider() {
    const soundPreview = document.getElementById('sound-preview');
    if (!soundPreview) return;
    if (document.getElementById('pitch-range-slider')) return;
    
    const advancedControls = document.createElement('div');
    advancedControls.className = 'pitch-range-controls';
    advancedControls.style.marginTop = '15px';
    advancedControls.style.padding = '10px';
    advancedControls.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    advancedControls.style.borderRadius = '6px';
    
    const title = document.createElement('div');
    title.textContent = 'Tone Shift';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    title.style.color = '#1db954';
    
    const sliderContainer = document.createElement('div');
    sliderContainer.style.display = 'flex';
    sliderContainer.style.alignItems = 'center';
    sliderContainer.style.gap = '10px';
    
    const minLabel = document.createElement('div');
    minLabel.textContent = 'Deep';
    minLabel.style.fontSize = '12px';
    minLabel.style.color = '#b3b3b3';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'pitch-range-slider';
    slider.min = '1';
    slider.max = '100';
    slider.value = '50';
    slider.style.flex = '1';
    slider.style.height = '8px';
    slider.style.appearance = 'none';
    slider.style.backgroundColor = '#535353';
    slider.style.borderRadius = '4px';
    slider.style.outline = 'none';
    
    const thumbStyles = `
      #pitch-range-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #1db954;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
      }
      #pitch-range-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #1db954;
        cursor: pointer;
        border: none;
      }
    `;
    const style = document.createElement('style');
    style.textContent = thumbStyles;
    document.head.appendChild(style);
    
    const maxLabel = document.createElement('div');
    maxLabel.textContent = 'Chipmunk';
    maxLabel.style.fontSize = '12px';
    maxLabel.style.color = '#b3b3b3';
    
    const valueDisplay = document.createElement('div');
    valueDisplay.id = 'pitch-range-value';
    // Map the default slider value (50) to a pitch multiplier between 0.5 and 2.0.
    let defaultPitch = 0.5 + ((50 - 1) / 99) * (2.0 - 0.5);
    valueDisplay.textContent = defaultPitch.toFixed(2) + 'x';
    valueDisplay.style.fontSize = '12px';
    valueDisplay.style.color = '#1db954';
    valueDisplay.style.fontWeight = 'bold';
    valueDisplay.style.marginLeft = '10px';
    valueDisplay.style.width = '80px';
    valueDisplay.style.textAlign = 'right';
    
    sliderContainer.appendChild(minLabel);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(maxLabel);
    sliderContainer.appendChild(valueDisplay);
    
    advancedControls.appendChild(title);
    advancedControls.appendChild(sliderContainer);
    
    soundPreview.appendChild(advancedControls);
    
    // Ensure a pitch settings object exists.
    if (!window.pitchSettings) {
      window.pitchSettings = {
        range: 'custom',
        custom: { min: 0.1, max: 10.0 }
      };
    } else {
      window.pitchSettings.custom = { min: 0.1, max: 10.0 };
      window.pitchSettings.range = 'custom';
    }
    
    // When the slider moves, map its value to a pitch multiplier and update custom audio.
    slider.addEventListener('input', function() {
      let val = parseInt(this.value);
      let normalized = (val - 1) / 99; // normalize between 0 and 1
      let newPitch = 0.5 + normalized * (2.0 - 0.5);
      valueDisplay.textContent = newPitch.toFixed(2) + 'x';
      if (document.getElementById('sound-profile-dropdown')?.value === 'custom_audio' &&
          window.audioPlayer && window.originalAudioBuffer) {
        updateFallbackSoundPitch(newPitch);
        console.log("Updated custom audio pitch to:", newPitch);
      }
    });
    
    slider.dispatchEvent(new Event('input'));
    console.log('Added tone shift slider to sound controls');
  }
  
  // Observe sound preview for changes to add the slider when it appears.
  document.addEventListener('DOMContentLoaded', function() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' &&
            document.getElementById('sound-preview') &&
            document.getElementById('sound-preview').style.display !== 'none' &&
            !document.getElementById('pitch-range-slider')) {
          addPitchRangeSlider();
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  });
  