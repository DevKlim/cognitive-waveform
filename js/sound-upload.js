/**
 * sound-upload.js
 * Handles uploading and playing custom audio files with data-driven pitch shifting
 */

document.addEventListener('DOMContentLoaded', function() {
  initSoundUploadFeature();
});

/**
 * Initialize the sound upload feature
 */
function initSoundUploadFeature() {
  console.log('Initializing sound upload feature');
  
  // Locate the dropdown for selecting waveform types
  const soundProfileDropdown = document.getElementById('sound-profile-dropdown');
  const soundUploadSection = document.getElementById('sound-upload-section');

  // If there's no container or no dropdown, just return
  if (!document.getElementById('sound-profile-container') || !soundProfileDropdown) {
    console.warn('Sound profile container or dropdown not found. Sound upload feature not initialized.');
    return;
  }

  // Ensure "Custom Audio" option exists in the dropdown
  if (!Array.from(soundProfileDropdown.options).some(opt => opt.value === 'custom_audio')) {
    const customAudioOption = document.createElement('option');
    customAudioOption.value = 'custom_audio';
    customAudioOption.textContent = 'Custom Audio';
    soundProfileDropdown.appendChild(customAudioOption);
  }

  // Show/hide the upload section when "Custom Audio" is selected
  soundProfileDropdown.addEventListener('change', function() {
    if (soundUploadSection) {
      soundUploadSection.style.display = (this.value === 'custom_audio') ? 'block' : 'none';
    }
  });

  // Add CSS if not already present
  addSoundUploadStyles();

  // Intercept openAudioUpload() if defined in custom-waveform.js
  if (typeof window.openAudioUpload === 'function') {
    const originalOpenAudioUpload = window.openAudioUpload;
    window.openAudioUpload = function() {
      if (soundUploadSection) {
        soundUploadSection.style.display = 'block';

        // Force dropdown to "Custom Audio"
        soundProfileDropdown.value = 'custom_audio';
        soundProfileDropdown.dispatchEvent(new Event('change'));
      } else {
        // fallback if we have no section
        originalOpenAudioUpload();
      }
    };
  }

  // Intercept updateSonification() to handle pitch updates
  if (typeof window.updateSonification === 'function') {
    const originalUpdateSonification = window.updateSonification;
    window.updateSonification = function() {
      // Call original
      originalUpdateSonification();
      // Then update pitch for the custom audio if playing
      updateSoundPitch();
    };
  }

  // Finally, set up the file input event so we can handle uploaded files
  const fileInput = document.getElementById('sound-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', handleSoundFileUpload);
  } else {
    console.warn('#sound-file-input not found – cannot handle uploads.');
  }
}

/**
 * Handle file selection
 */
function handleSoundFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  console.log('Sound file uploaded:', file.name);

  // Show the preview section
  const previewSection = document.getElementById('sound-preview');
  if (previewSection) {
    previewSection.style.display = 'block';
  
    // Display file name/size
    previewSection.innerHTML = `
      <div class="sound-file-info">
        <div class="sound-file-name">${file.name}</div>
        <div class="sound-file-size">${formatFileSize(file.size)}</div>
      </div>
      <div class="sound-controls">
        <button id="play-sound-preview" class="play-sound-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <div class="sound-settings">
          <label class="setting-item">
            <span>Loop:</span>
            <input type="checkbox" id="loop-sound" checked>
          </label>
          <label class="setting-item">
            <span>Pitch Shift Range:</span>
            <select id="pitch-range">
              <option value="small">Small (±20%)</option>
              <option value="medium" selected>Medium (±50%)</option>
              <option value="large">Large (±100%)</option>
            </select>
          </label>
        </div>
      </div>
    `;
  }

  // Create or reuse the global Audio object
  if (!window.customAudio) {
    window.customAudio = new Audio();
  }

  // Set the audio source to the chosen file
  window.customAudio.src = URL.createObjectURL(file);
  window.customAudio.loop = true;

  // Set up audio pipeline
  setupAudioProcessing(window.customAudio);

  // Hook up controls
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

  // Force the dropdown to "Custom Audio" so the system knows we are using a custom file
  const soundProfileDropdown = document.getElementById('sound-profile-dropdown');
  if (soundProfileDropdown) {
    soundProfileDropdown.value = 'custom_audio';
    soundProfileDropdown.dispatchEvent(new Event('change'));
  }
}

/**
 * Set up audio context, gain, analyzer, etc.
 */
function setupAudioProcessing(audioElement) {
  if (!window.audioContext) {
    try {
      window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error('Failed to create audio context:', e);
      return;
    }
  }

  // Disconnect old source if any
  if (window.customAudioSource) {
    try {
      window.customAudioSource.disconnect();
    } catch (e) {
      // no-op
    }
  }

  try {
    // Create new media element source
    window.customAudioSource = window.audioContext.createMediaElementSource(audioElement);

    // Create gain node (if needed)
    if (!window.customAudioGain) {
      window.customAudioGain = window.audioContext.createGain();
      window.customAudioGain.gain.value = 0.5;
    }

    // Create analyzer (if needed)
    if (!window.customAudioAnalyzer) {
      window.customAudioAnalyzer = window.audioContext.createAnalyser();
      window.customAudioAnalyzer.fftSize = 256;
    }

    // Connect: Source -> Gain -> Analyzer -> Destination
    window.customAudioSource.connect(window.customAudioGain);
    window.customAudioGain.connect(window.customAudioAnalyzer);
    window.customAudioAnalyzer.connect(window.audioContext.destination);

    // Default pitch settings
    window.pitchSettings = {
      range: 'medium',
      small: { min: 0.8, max: 1.2 },   // ±20%
      medium: { min: 0.5, max: 1.5 }, // ±50%
      large: { min: 0.1, max: 2.0 }   // ±100%
    };

    console.log('Audio processing set up for custom sound');
  } catch (e) {
    console.error('Error setting up audio processing:', e);
  }
}

/**
 * Play or pause the custom audio
 */
function toggleSoundPlayback() {
  if (!window.customAudio) return;

  const playButton = document.getElementById('play-sound-preview');
  if (!playButton) return;

  if (window.customAudio.paused) {
    // In case audioContext is suspended
    if (window.audioContext && window.audioContext.state === 'suspended') {
      window.audioContext.resume();
    }
    window.customAudio.play()
      .then(() => {
        // Switch icon to Pause
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
    // Switch icon to Play
    playButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    `;
  }
}

/**
 * Update which pitch range is used
 */
function updatePitchRange() {
  const pitchRangeSelect = document.getElementById('pitch-range');
  if (pitchRangeSelect && window.pitchSettings) {
    window.pitchSettings.range = pitchRangeSelect.value;
    console.log(`Pitch range updated to: ${pitchRangeSelect.value}`);
  }
}

/**
 * Dynamically update playbackRate based on your data
 * (called inside the patched updateSonification)
 */
function updateSoundPitch() {
  // If audio is paused or we have no pitch settings, do nothing
  if (!window.customAudio || !window.pitchSettings || window.customAudio.paused) return;

  try {
    // example "getCurrentValue()" from your existing code
    const currentValue = getCurrentValue();

    // Normalization
    const valueGetter = d => d[app.currentMetric] || 0;
    const minValue = d3.min(app.data.filtered, valueGetter) * 0.9;
    const maxValue = d3.max(app.data.filtered, valueGetter) * 1.1;
    const normalizedValue = (currentValue - minValue) / (maxValue - minValue || 1);

    // Which pitch range
    const range = window.pitchSettings[window.pitchSettings.range] || window.pitchSettings.medium;
    const pitch = range.min + normalizedValue * (range.max - range.min);

    // Smoothly approach the new playbackRate
    if (window.customAudio.playbackRate !== pitch) {
      const currentRate = window.customAudio.playbackRate;
      const targetRate = pitch;
      const smoothFactor = 0.1;

      window.customAudio.playbackRate = currentRate + (targetRate - currentRate) * smoothFactor;
    }
  } catch (e) {
    console.error('Error updating sound pitch:', e);
  }
}

/**
 * Format file size (B, KB, MB)
 */
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1048576) {
    return (bytes / 1024).toFixed(1) + ' KB';
  } else {
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}

/**
 * Inject the CSS (if not already added)
 */
function addSoundUploadStyles() {
  if (document.getElementById('sound-upload-styles')) return;

  const styleElement = document.createElement('style');
  styleElement.id = 'sound-upload-styles';
  styleElement.textContent = `
    /* Sound upload section styles */
    .sound-upload-section {
      margin-top: 20px;
      padding: 15px;
      background-color: rgba(29, 185, 84, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(29, 185, 84, 0.1);
      transition: all 0.3s ease;
    }
    .sound-upload-section:hover {
      background-color: rgba(29, 185, 84, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .sound-upload-header {
      font-size: 16px;
      margin-bottom: 8px;
      color: #1db954;
      font-weight: 600;
    }
    .sound-upload-description {
      font-size: 13px;
      color: #b3b3b3;
      margin-bottom: 15px;
      line-height: 1.4;
    }
    .sound-upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background-color: #2e2e2e;
      color: #fff;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      margin-bottom: 10px;
      border: none;
    }
    .sound-upload-btn:hover {
      background-color: #1db954;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(29, 185, 84, 0.3);
    }
    .sound-preview {
      margin-top: 15px;
      padding: 12px;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 6px;
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .sound-file-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .sound-file-name {
      font-size: 14px;
      font-weight: 500;
      color: #e0e0e0;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sound-file-size {
      font-size: 12px;
      color: #b3b3b3;
      background-color: rgba(0, 0, 0, 0.2);
      padding: 2px 6px;
      border-radius: 10px;
    }
    .sound-controls {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .play-sound-btn {
      background-color: #1db954;
      color: #000;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .play-sound-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 0 10px rgba(29, 185, 84, 0.4);
    }
    .sound-settings {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-grow: 1;
    }
    .setting-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #b3b3b3;
    }
    .sound-settings input[type="checkbox"] {
      accent-color: #1db954;
      width: 16px;
      height: 16px;
    }
    .sound-settings select {
      background-color: #2e2e2e;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
    }
    .sound-settings select:hover {
      background-color: #3e3e3e;
    }
    .sound-settings select:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.4);
    }
    /* Responsive */
    @media (max-width: 768px) {
      .sound-controls {
        flex-direction: column;
        align-items: flex-start;
      }
      .play-sound-btn {
        align-self: center;
        margin-bottom: 10px;
      }
      .sound-settings {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(styleElement);
}
