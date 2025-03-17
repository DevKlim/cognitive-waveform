/**
 * audio-integration-helper.js
 * A simple script to ensure custom audio is integrated correctly with audio-processor.js
 */

// Immediately create the sound profile elements when this script loads
(function() {
  console.log("Immediately initializing sound profile elements");
  
  // Function to create sound profile dropdown
  function createSoundProfileDropdown() {
    console.log("Creating sound profile elements on page load");
    
    // Check for playback options container
    const playbackOptions = document.querySelector('.playback-options');
    if (!playbackOptions) {
      console.warn("Playback options container not found yet, will try again when DOM loaded");
      // We'll try again when the DOM is fully loaded
      return false;
    }
    
    // 1. Create sound profile container if it doesn't exist
    let soundProfileContainer = document.getElementById('sound-profile-container');
    if (!soundProfileContainer) {
      soundProfileContainer = document.createElement('div');
      soundProfileContainer.id = 'sound-profile-container';
      soundProfileContainer.className = 'sound-profile-container';
      playbackOptions.appendChild(soundProfileContainer);
      console.log("Created sound profile container");
    }
    
    // 2. Create dropdown if it doesn't exist
    let soundProfileDropdown = document.getElementById('sound-profile-dropdown');
    if (!soundProfileDropdown) {
      // Create dropdown label
      const label = document.createElement('label');
      label.htmlFor = 'sound-profile-dropdown';
      label.textContent = 'Sound: ';
      label.className = 'dropdown-label';
      
      // Create dropdown
      soundProfileDropdown = document.createElement('select');
      soundProfileDropdown.id = 'sound-profile-dropdown';
      soundProfileDropdown.className = 'select-dropdown';
      
      // Add options
      const options = [
        { id: 'sine', name: 'Sine Wave' },
        { id: 'triangle', name: 'Triangle Wave' },
        { id: 'square', name: 'Square Wave' },
        { id: 'sawtooth', name: 'Sawtooth Wave' },
        { id: 'custom_audio', name: 'Custom Audio' }
      ];
      
      options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id;
        optionElement.textContent = option.name;
        soundProfileDropdown.appendChild(optionElement);
      });
      
      // Add to container
      soundProfileContainer.appendChild(label);
      soundProfileContainer.appendChild(soundProfileDropdown);
      console.log("Created sound profile dropdown");
    }
    
    // 3. Create sound upload section if it doesn't exist
    let soundUploadSection = document.getElementById('sound-upload-section');
    if (!soundUploadSection) {
      soundUploadSection = document.createElement('div');
      soundUploadSection.id = 'sound-upload-section';
      soundUploadSection.className = 'sound-upload-section';
      soundUploadSection.style.display = 'none';
      
      // Add content
      soundUploadSection.innerHTML = `
        <h3 class="sound-upload-header">Upload Custom Sound</h3>
        
        <p class="sound-upload-description">
          Upload an audio file that will loop and change pitch based on data values.
        </p>
        
        <input 
          type="file"
          id="sound-file-input"
          class="sound-file-input"
          accept="audio/*"
          style="display: none;"
        >
        
        <label for="sound-file-input" class="sound-upload-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
          </svg>
          Upload Sound File
        </label>
        
        <div id="sound-preview" class="sound-preview" style="display: none;"></div>
      `;
      
      // Add to playback options
      playbackOptions.appendChild(soundUploadSection);
      console.log("Created sound upload section");
    }
    
    // 4. Create a direct access button
    if (!document.getElementById('custom-audio-btn')) {
      const customAudioBtn = document.createElement('button');
      customAudioBtn.id = 'custom-audio-btn';
      customAudioBtn.className = 'custom-audio-btn';
      customAudioBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
        </svg>
        Use Custom Audio
      `;
      
      customAudioBtn.addEventListener('click', function() {
        // Select custom audio in dropdown
        soundProfileDropdown.value = 'custom_audio';
        
        // Trigger change event to show the section
        const event = new Event('change');
        soundProfileDropdown.dispatchEvent(event);
      });
      
      playbackOptions.appendChild(customAudioBtn);
      console.log("Created custom audio button");
    }
    
    // Add event listener to show/hide the section based on dropdown selection
    soundProfileDropdown.addEventListener('change', function() {
      console.log('Sound profile changed to:', this.value);
      if (soundUploadSection) {
        soundUploadSection.style.display = this.value === 'custom_audio' ? 'block' : 'none';
      }
    });
    
    // Add event listener to the upload button
    const soundFileInput = document.getElementById('sound-file-input');
    if (soundFileInput) {
      soundFileInput.addEventListener('change', function(event) {
        if (event.target.files.length > 0 && typeof handleSoundFileUpload === 'function') {
          handleSoundFileUpload(event);
        }
      });
    }
    
    return true;
  }
  
  // Try to create the dropdown right away
  const initialCreationSuccessful = createSoundProfileDropdown();
  
  // If initial creation failed, set up for when DOM is loaded
  if (!initialCreationSuccessful) {
    document.addEventListener('DOMContentLoaded', function() {
      // Try again immediately when DOM is loaded
      if (!createSoundProfileDropdown()) {
        // If still not successful, set up a polling mechanism
        let attempts = 0;
        const maxAttempts = 10;
        const interval = 200; // ms
        
        const checkInterval = setInterval(function() {
          attempts++;
          console.log(`Attempt ${attempts}/${maxAttempts} to create sound profile elements`);
          
          if (createSoundProfileDropdown() || attempts >= maxAttempts) {
            clearInterval(checkInterval);
            if (attempts >= maxAttempts) {
              console.warn("Failed to create sound profile elements after maximum attempts");
            }
          }
        }, interval);
      }
    });
  }
  
  // Also watch for dynamically created elements
  document.addEventListener('DOMContentLoaded', function() {
    console.log("Setting up mutation observer as backup");
    
    // Create a mutation observer to watch for changes to the DOM
    const observer = new MutationObserver(function(mutations) {
      // Look for the sound profile dropdown
      if (!document.getElementById('sound-profile-dropdown')) {
        createSoundProfileDropdown();
      }
      
      // If we have found or created everything we need, disconnect the observer
      if (document.getElementById('sound-profile-dropdown') && 
          document.getElementById('sound-upload-section') &&
          document.getElementById('custom-audio-btn')) {
        observer.disconnect();
        console.log("Observer disconnected - all elements found/created");
      }
    });
    
    // Start observing the body
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  });
})();