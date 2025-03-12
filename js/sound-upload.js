/**
 * sound-upload.js
 * Handles uploading and playing custom audio files with data-driven pitch shifting
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait for the sound profile container to be available
    const checkInterval = setInterval(function() {
      if (document.getElementById('sound-profile-container')) {
        clearInterval(checkInterval);
        initSoundUploadFeature();
      }
    }, 200);
  });
  
  /**
   * Initialize the sound upload feature
   */
  function initSoundUploadFeature() {
    console.log('Initializing sound upload feature');
    
    // Make sure the sound profile dropdown has the custom audio option
    const soundProfileDropdown = document.getElementById('sound-profile-dropdown');
    if (soundProfileDropdown) {
      // Add custom audio option if it doesn't exist
      if (!Array.from(soundProfileDropdown.options).some(opt => opt.value === 'custom_audio')) {
        const customAudioOption = document.createElement('option');
        customAudioOption.value = 'custom_audio';
        customAudioOption.textContent = 'Custom Audio';
        soundProfileDropdown.appendChild(customAudioOption);
      }
      
      // Add listener to handle showing/hiding the upload interface
      soundProfileDropdown.addEventListener('change', function() {
        const soundUploadSection = document.getElementById('sound-upload-section');
        if (soundUploadSection) {
          soundUploadSection.style.display = this.value === 'custom_audio' ? 'block' : 'none';
        }
      });
    }
    
    // Create the upload section
    createSoundUploadSection();
    
    // Intercept the openAudioUpload function if it exists in custom-waveform.js
    if (typeof window.openAudioUpload === 'function') {
      const originalOpenAudioUpload = window.openAudioUpload;
      window.openAudioUpload = function() {
        const soundUploadSection = document.getElementById('sound-upload-section');
        if (soundUploadSection) {
          soundUploadSection.style.display = 'block';
          
          // Make sure custom audio option is selected
          if (soundProfileDropdown) {
            soundProfileDropdown.value = 'custom_audio';
            // Trigger change event
            soundProfileDropdown.dispatchEvent(new Event('change'));
          }
        } else {
          // Fall back to original function if our section doesn't exist
          originalOpenAudioUpload();
        }
      };
    }
    
    // Hook into the updateSonification function to handle pitch changes
    if (typeof window.updateSonification === 'function') {
      const originalUpdateSonification = window.updateSonification;
      window.updateSonification = function() {
        // Call the original function
        originalUpdateSonification();
        
        // Also update our custom sound if it's playing
        updateSoundPitch();
      };
    }
  }
  
  /**
   * Create the sound upload interface
   */
  function createSoundUploadSection() {
    // Find sound profile container
    const container = document.getElementById('sound-profile-container');
    if (!container) return;
    
    // Create the upload section if it doesn't exist
    if (document.getElementById('sound-upload-section')) return;
    
    // Create section container
    const uploadSection = document.createElement('div');
    uploadSection.id = 'sound-upload-section';
    uploadSection.className = 'sound-upload-section';
    uploadSection.style.display = 'none'; // Hidden by default
    
    // Create header
    const header = document.createElement('h3');
    header.textContent = 'Upload Custom Sound';
    header.className = 'sound-upload-header';
    
    // Create description
    const description = document.createElement('p');
    description.textContent = 'Upload an audio file that will loop and change pitch based on data values.';
    description.className = 'sound-upload-description';
    
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'sound-file-input';
    fileInput.className = 'sound-file-input';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';
    
    // Create upload button
    const uploadLabel = document.createElement('label');
    uploadLabel.htmlFor = 'sound-file-input';
    uploadLabel.className = 'sound-upload-btn';
    uploadLabel.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
      </svg>
      Upload Sound File
    `;
    
    // Create preview section
    const previewSection = document.createElement('div');
    previewSection.id = 'sound-preview';
    previewSection.className = 'sound-preview';
    previewSection.style.display = 'none';
    
    // Add event listener for file upload
    fileInput.addEventListener('change', handleSoundFileUpload);
    
    // Add elements to container
    uploadSection.appendChild(header);
    uploadSection.appendChild(description);
    uploadSection.appendChild(uploadLabel);
    uploadSection.appendChild(fileInput);
    uploadSection.appendChild(previewSection);
    
    // Add to sound profile container
    container.appendChild(uploadSection);
    
    // Add CSS styles
    addSoundUploadStyles();
  }
  
  /**
   * Handle sound file upload
   */
  function handleSoundFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('Sound file uploaded:', file.name);
    
    // Get preview section
    const previewSection = document.getElementById('sound-preview');
    if (!previewSection) return;
    
    // Show preview section
    previewSection.style.display = 'block';
    
    // Format file size
    const fileSize = formatFileSize(file.size);
    
    // Update preview content
    previewSection.innerHTML = `
      <div class="sound-file-info">
        <div class="sound-file-name">${file.name}</div>
        <div class="sound-file-size">${fileSize}</div>
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
    
    // Create audio element
    if (!window.customAudio) {
      window.customAudio = new Audio();
    }
    
    // Set up audio
    window.customAudio.src = URL.createObjectURL(file);
    window.customAudio.loop = true;
    
    // Set up audio processing
    setupAudioProcessing(window.customAudio);
    
    // Add event listeners
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
    
    const pitchRange = document.getElementById('pitch-range');
    if (pitchRange) {
      pitchRange.addEventListener('change', updatePitchRange);
    }
    
    // Update sound profile in the main application
    const soundProfileDropdown = document.getElementById('sound-profile-dropdown');
    if (soundProfileDropdown) {
      soundProfileDropdown.value = 'custom_audio';
      
      // Trigger change event to update UI
      soundProfileDropdown.dispatchEvent(new Event('change'));
    }
  }
  
  /**
   * Set up audio processing for pitch shifting
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
    
    // Disconnect existing nodes to prevent multiple connections
    if (window.customAudioSource) {
      try {
        window.customAudioSource.disconnect();
      } catch (e) {
        // Ignore disconnection errors
      }
    }
    
    try {
      // Create MediaElementSource
      window.customAudioSource = window.audioContext.createMediaElementSource(audioElement);
      
      // Create gain node for volume control
      if (!window.customAudioGain) {
        window.customAudioGain = window.audioContext.createGain();
        window.customAudioGain.gain.value = 0.5; // 50% volume
      }
      
      // Create analyzer for visualizations
      if (!window.customAudioAnalyzer) {
        window.customAudioAnalyzer = window.audioContext.createAnalyser();
        window.customAudioAnalyzer.fftSize = 256;
      }
      
      // Connect nodes
      window.customAudioSource.connect(window.customAudioGain);
      window.customAudioGain.connect(window.customAudioAnalyzer);
      window.customAudioAnalyzer.connect(window.audioContext.destination);
      
      // Set up pitch settings
      window.pitchSettings = {
        range: 'medium',
        small: { min: 0.8, max: 1.2 },    // ±20%
        medium: { min: 0.5, max: 1.5 },   // ±50%
        large: { min: 0.1, max: 2.0 }     // ±100%
      };
      
      console.log('Audio processing set up for custom sound');
    } catch (e) {
      console.error('Error setting up audio processing:', e);
    }
  }
  
  /**
   * Toggle sound playback
   */
  function toggleSoundPlayback() {
    if (!window.customAudio) return;
    
    const playButton = document.getElementById('play-sound-preview');
    if (!playButton) return;
    
    if (window.customAudio.paused) {
      // Resume audio context if suspended
      if (window.audioContext && window.audioContext.state === 'suspended') {
        window.audioContext.resume();
      }
      
      window.customAudio.play()
        .then(() => {
          // Update button to show pause icon
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
      
      // Update button to show play icon
      playButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      `;
    }
  }
  
  /**
   * Update pitch range settings
   */
  function updatePitchRange() {
    const pitchRange = document.getElementById('pitch-range');
    if (pitchRange && window.pitchSettings) {
      window.pitchSettings.range = pitchRange.value;
      console.log(`Pitch range updated to ${pitchRange.value}`);
    }
  }
  
  /**
   * Update sound pitch based on current data value
   */
  function updateSoundPitch() {
    if (!window.customAudio || !window.pitchSettings || window.customAudio.paused) return;
    
    try {
      // Get current value
      const currentValue = getCurrentValue();
      
      // Get value range for normalization
      const valueGetter = d => d[app.currentMetric] || 0;
      const minValue = d3.min(app.data.filtered, valueGetter) * 0.9;
      const maxValue = d3.max(app.data.filtered, valueGetter) * 1.1;
      
      // Normalize value to 0-1 range
      const normalizedValue = (currentValue - minValue) / (maxValue - minValue || 1);
      
      // Get pitch range
      const range = window.pitchSettings[window.pitchSettings.range];
      
      // Calculate pitch (playback rate)
      const pitch = range.min + normalizedValue * (range.max - range.min);
      
      // Apply pitch with smoothing
      if (window.customAudio.playbackRate !== pitch) {
        // Smooth transition
        const currentRate = window.customAudio.playbackRate;
        const targetRate = pitch;
        const smoothFactor = 0.1; // Lower for smoother transitions
        
        // Apply smoothed value
        window.customAudio.playbackRate = currentRate + (targetRate - currentRate) * smoothFactor;
      }
    } catch (e) {
      console.error('Error updating sound pitch:', e);
    }
  }
  
  /**
   * Format file size in KB or MB
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
   * Add CSS styles for the sound upload interface
   */
  function addSoundUploadStyles() {
    // Check if styles are already added
    if (document.getElementById('sound-upload-styles')) return;
    
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.id = 'sound-upload-styles';
    
    // Add CSS
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
      
      /* Responsive adjustments */
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
    
    // Add style element to document head
    document.head.appendChild(styleElement);
  }