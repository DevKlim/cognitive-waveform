/**
 * audio-processor.js
 * Enhanced audio processing with expanded sound options, custom waveform support,
 * and custom audio upload capabilities
 */

// Available waveform types
const WAVEFORM_TYPES = {
    SINE: 'sine',
    TRIANGLE: 'triangle',
    SQUARE: 'square',
    SAWTOOTH: 'sawtooth',
    CUSTOM: 'custom',
    CUSTOM_AUDIO: 'custom_audio'
};

// Sound profiles for different data visualization scenarios
const SOUND_PROFILES = [
    {
        id: 'sine',
        name: 'Sine',
        waveform: WAVEFORM_TYPES.SINE,
        frequencyRange: { min: 50, max: 2500 }
    },
    {
        id: 'triangle',
        name: 'Triangle',
        waveform: WAVEFORM_TYPES.TRIANGLE,
        frequencyRange: { min: 50, max: 2500 }
    },
    {
        id: 'square', 
        name: 'Square',
        waveform: WAVEFORM_TYPES.SQUARE,
        frequencyRange: { min: 50, max: 2500 }
    },
    {
        id: 'sawtooth',
        name: 'Sawtooth',
        waveform: WAVEFORM_TYPES.SAWTOOTH,
        frequencyRange: { min: 50, max: 2500 }
    },
    {
        id: 'custom_wave',
        name: 'Custom Waveform',
        waveform: WAVEFORM_TYPES.CUSTOM,
        frequencyRange: { min: 50, max: 2500 }
    },
    {
        id: 'custom_audio',
        name: 'Custom Audio',
        waveform: WAVEFORM_TYPES.CUSTOM_AUDIO,
        frequencyRange: { min: 0.5, max: 2.0 } // Playback rate range for audio files
    }
];

// Current sound profile
let currentSoundProfile = SOUND_PROFILES[0];

// For custom waveform
let customWaveform = null;

/**
 * Initialize audio context and sound settings
 */
function initAudio() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain node for volume control
            gainNode = audioContext.createGain();
            gainNode.gain.value = 0.2; // Set volume to 20%
            
            // Create analyzer node for audio visualization
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            audioDataArray = new Uint8Array(bufferLength);
            
            // Connect nodes
            gainNode.connect(analyser);
            analyser.connect(audioContext.destination);
            
            // Initialize custom waveform
            initCustomWaveform();
            
            // Initialize sound profile selector UI
            initSoundProfileSelector();
            
            console.log('Audio context initialized');
        } catch (e) {
            console.error('Failed to initialize audio context:', e);
        }
    }
}

/**
 * Initialize custom waveform
 */
function initCustomWaveform() {
    if (!audioContext) return;
    
    // Create a custom waveform (example of a custom shape)
    const harmonics = 8; // Number of harmonics to include
    customWaveform = audioContext.createPeriodicWave(
        // Cosine terms (real)
        new Float32Array(harmonics + 1).map((_, i) => i === 0 ? 0 : Math.pow(0.75, i)),
        // Sine terms (imag)
        new Float32Array(harmonics + 1).map((_, i) => i === 0 ? 0 : Math.pow(0.5, i) * (i % 2 ? 1 : -0.8))
    );
}

/**
 * Initialize sound profile selector UI
 */
function initSoundProfileSelector() {
    const container = document.getElementById('sound-profile-container');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create dropdown
    const dropdown = document.createElement('select');
    dropdown.id = 'sound-profile-dropdown';
    dropdown.className = 'select-dropdown';
    
    // Create options for each sound profile
    SOUND_PROFILES.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.name;
        dropdown.appendChild(option);
    });
    
    // Add change handler
    dropdown.addEventListener('change', function() {
        const selectedProfileId = this.value;
        const selectedProfile = SOUND_PROFILES.find(p => p.id === selectedProfileId);
        
        if (selectedProfile) {
            currentSoundProfile = selectedProfile;
            
            // Update oscillator if it's running
            if (oscillator && app.isPlaying) {
                updateOscillatorType();
            }
            
            // Stop custom audio playback if switching away from custom audio
            if (selectedProfileId !== 'custom_audio' && window.customAudio && !window.customAudio.paused) {
                window.customAudio.pause();
                
                // Update play button if available
                const playButton = document.getElementById('play-sound-preview');
                if (playButton) {
                    playButton.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    `;
                }
            }
            
            // Start regular sonification if switching to a standard waveform
            if (selectedProfileId !== 'custom_audio' && app.isPlaying && !oscillator) {
                startSonification();
            }
            
            console.log(`Sound profile changed to: ${currentSoundProfile.name}`);
        }
        
        // Show/hide custom waveform controls
        const customWaveformControls = document.getElementById('custom-waveform-controls');
        if (customWaveformControls) {
            customWaveformControls.classList.toggle('hidden', selectedProfileId !== 'custom_wave');
        }
        
        // Show/hide custom audio controls
        const soundUploadSection = document.getElementById('sound-upload-section');
        if (soundUploadSection) {
            soundUploadSection.style.display = selectedProfileId === 'custom_audio' ? 'block' : 'none';
        }
    });
    
    // Add label
    const label = document.createElement('label');
    label.htmlFor = 'sound-profile-dropdown';
    label.textContent = 'Sound: ';
    label.className = 'dropdown-label';
    
    // Add to container
    container.appendChild(label);
    container.appendChild(dropdown);
    
    // Create custom waveform controls
    createCustomWaveformControls(container);
}

/**
 * Create custom waveform controls
 */
function createCustomWaveformControls(container) {
    // Create controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'custom-waveform-controls';
    controlsContainer.className = 'custom-waveform-controls hidden';
    
    // Create description
    const description = document.createElement('div');
    description.className = 'sound-profile-description';
    description.textContent = 'Draw a custom waveform or upload audio to visualize your data with unique sounds';
    
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
    
    // Add elements to container
    controlsContainer.appendChild(description);
    controlsContainer.appendChild(editorButton);
    controlsContainer.appendChild(uploadButton);
    
    // Add to container
    container.appendChild(controlsContainer);
}

/**
 * Open audio upload interface
 */
function openAudioUpload() {
    // Select custom audio option in the dropdown
    const dropdown = document.getElementById('sound-profile-dropdown');
    if (dropdown) {
        dropdown.value = 'custom_audio';
        dropdown.dispatchEvent(new Event('change'));
    }
}

/**
 * Open waveform editor modal
 */
function openWaveformEditor() {
    // Check if custom-waveform.js is loaded
    if (typeof createWaveformDrawingModal === 'function') {
        // Use the function from custom-waveform.js
        let modal = document.getElementById('waveform-drawing-modal');
        if (!modal) {
            console.log('Creating waveform modal...');
            createWaveformDrawingModal();
            modal = document.getElementById('waveform-drawing-modal');
        }
        
        if (modal) {
            console.log('Opening waveform modal');
            modal.style.display = 'block';
            
            // Initialize the active tab
            setTimeout(() => {
                if (typeof initDrawingCanvas === 'function') {
                    initDrawingCanvas();
                }
                console.log('Drawing canvas initialized');
            }, 100);
        } else {
            console.error('Modal element not found after creation attempt');
        }
    } else {
        // Fallback implementation if custom-waveform.js is not loaded
        console.log('custom-waveform.js not loaded, using fallback implementation');
        createFallbackWaveformModal();
    }
}

/**
 * Create a fallback waveform modal (simplified version)
 */
function createFallbackWaveformModal() {
    let modal = document.getElementById('waveform-drawing-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'waveform-drawing-modal';
        modal.className = 'waveform-drawing-modal';
        
        // Create modal content
        modal.innerHTML = `
            <div class="waveform-modal-content">
                <div class="waveform-modal-header">
                    <h2>Create Custom Waveform</h2>
                    <button class="close-waveform-modal">&times;</button>
                </div>
                
                <div class="drawing-canvas-container">
                    <canvas id="waveform-drawing-canvas" width="600" height="200"></canvas>
                </div>
                
                <div class="control-options">
                    <button id="clear-canvas" class="waveform-control-btn">Clear</button>
                    <button id="smooth-wave" class="waveform-control-btn">Smooth</button>
                    <div class="color-selector">
                        <label>Color:</label>
                        <input type="color" id="wave-color" value="#1db954">
                    </div>
                </div>
                
                <div class="button-group">
                    <button id="apply-waveform" class="waveform-control-btn primary">Apply Waveform</button>
                    <button id="cancel-waveform" class="waveform-control-btn">Cancel</button>
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-waveform-modal');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        const clearBtn = document.getElementById('clear-canvas');
        clearBtn.addEventListener('click', () => {
            const canvas = document.getElementById('waveform-drawing-canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#121212';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw center line
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, canvas.height / 2);
                ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.stroke();
            }
        });
        
        const applyBtn = document.getElementById('apply-waveform');
        applyBtn.addEventListener('click', () => {
            // Apply waveform logic would go here
            modal.style.display = 'none';
        });
        
        const cancelBtn = document.getElementById('cancel-waveform');
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Initialize canvas
        setTimeout(() => {
            initFallbackCanvas();
        }, 100);
    }
    
    // Show modal
    modal.style.display = 'block';
}

/**
 * Initialize fallback canvas
 */
function initFallbackCanvas() {
    const canvas = document.getElementById('waveform-drawing-canvas');
    if (!canvas) {
        console.error('Drawing canvas not found');
        return;
    }
    
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
    
    // Set up drawing state
    window.drawingState = {
        isDrawing: false,
        path: [],
        color: '#1db954',
        ctx: ctx
    };
    
    // Set drawing style
    ctx.strokeStyle = window.drawingState.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Add event listeners
    canvas.addEventListener('mousedown', (e) => {
        window.drawingState.isDrawing = true;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        window.drawingState.path = [{x, y}];
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y);
        ctx.stroke();
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!window.drawingState.isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        window.drawingState.path.push({x, y});
        
        ctx.lineTo(x, y);
        ctx.stroke();
    });
    
    canvas.addEventListener('mouseup', () => {
        window.drawingState.isDrawing = false;
    });
    
    canvas.addEventListener('mouseout', () => {
        window.drawingState.isDrawing = false;
    });
}

/**
 * Update oscillator type based on current sound profile
 */
function updateOscillatorType() {
    if (!oscillator) return;
    
    try {
        if (currentSoundProfile.waveform === WAVEFORM_TYPES.CUSTOM && customWaveform) {
            oscillator.setPeriodicWave(customWaveform);
        } else if (currentSoundProfile.waveform === WAVEFORM_TYPES.CUSTOM_AUDIO) {
            // For custom audio, we'll stop the oscillator and use the audio element instead
            stopSonification();
            
            // If we have a custom audio loaded and we're playing, start it
            if (window.customAudio && app.isPlaying) {
                window.customAudio.play();
            }
        } else {
            oscillator.type = currentSoundProfile.waveform;
        }
    } catch (e) {
        console.error('Error updating oscillator type:', e);
    }
}

/**
 * Start sonification
 */
function startSonification() {
    if (!audioContext) initAudio();
    
    if (!audioContext) return; // Exit if audio context creation failed
    
    try {
        // If we're using custom audio, play that instead
        if (currentSoundProfile.waveform === WAVEFORM_TYPES.CUSTOM_AUDIO) {
            if (window.customAudio) {
                window.customAudio.play()
                    .then(() => {
                        console.log('Custom audio playback started');
                        
                        // Update play button if available
                        const playButton = document.getElementById('play-sound-preview');
                        if (playButton) {
                            playButton.innerHTML = `
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                </svg>
                            `;
                        }
                    })
                    .catch(e => {
                        console.error('Error playing custom audio:', e);
                    });
            }
            return;
        }
        
        // For standard and custom waveforms, create oscillator if not exists
        if (!oscillator) {
            oscillator = audioContext.createOscillator();
            
            // Set appropriate waveform type
            if (currentSoundProfile.waveform === WAVEFORM_TYPES.CUSTOM && customWaveform) {
                oscillator.setPeriodicWave(customWaveform);
            } else {
                oscillator.type = currentSoundProfile.waveform;
            }
            
            oscillator.connect(gainNode);
            oscillator.start();
            console.log('Sonification started with waveform:', currentSoundProfile.name);
        }
    } catch (e) {
        console.error('Failed to start sonification:', e);
    }
}

/**
 * Stop sonification
 */
function stopSonification() {
    // Stop oscillator-based sonification
    if (oscillator) {
        try {
            oscillator.stop();
            oscillator.disconnect();
            oscillator = null;
            console.log('Oscillator sonification stopped');
        } catch (e) {
            console.error('Error stopping oscillator sonification:', e);
            oscillator = null;
        }
    }
    
    // Also pause custom audio if it's playing
    if (window.customAudio && !window.customAudio.paused) {
        window.customAudio.pause();
        console.log('Custom audio playback paused');
        
        // Update play button if available
        const playButton = document.getElementById('play-sound-preview');
        if (playButton) {
            playButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            `;
        }
    }
}

/**
 * Update sonification based on current value with enhanced behavior for physiological data
 */
function updateSonification() {
    try {
        // Get current value
        const currentValue = getCurrentValue();
        
        // Get value range
        const valueGetter = d => d[app.currentMetric] || 0;
        const minValue = d3.min(app.data.filtered, valueGetter) * 0.9;
        const maxValue = d3.max(app.data.filtered, valueGetter) * 1.1;
        
        // Normalize the value between 0-1
        const normalizedValue = (currentValue - minValue) / (maxValue - minValue || 1);
        
        // Handle custom audio playback if that's the current profile
        if (currentSoundProfile.waveform === WAVEFORM_TYPES.CUSTOM_AUDIO) {
            updateCustomAudioPlayback(normalizedValue);
        } 
        // Handle oscillator if it's active
        else if (oscillator) {
            updateOscillatorFrequency(normalizedValue, currentValue);
        }
        
        // Get audio data for visualizations from the appropriate source
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
            window.pitchSettings[window.pitchSettings.range] : 
            currentSoundProfile.frequencyRange;
        
        // Calculate playback rate
        const targetRate = pitchRange.min + normalizedValue * (pitchRange.max - pitchRange.min);
        
        // Apply with smoothing
        if (window.customAudio.playbackRate !== targetRate) {
            const currentRate = window.customAudio.playbackRate;
            const smoothFactor = 0.1; // Adjust for smoother/faster transitions
            
            window.customAudio.playbackRate = currentRate + (targetRate - currentRate) * smoothFactor;
        }
    } catch (e) {
        console.error('Error updating custom audio playback:', e);
    }
}

/**
 * Update oscillator frequency based on data
 */
function updateOscillatorFrequency(normalizedValue, currentValue) {
    // Check if we're dealing with heart rate or similar cardiac data
    const isCardiacData = app.currentMetric && 
        (app.currentMetric.toLowerCase().includes('hr') || 
         app.currentMetric.toLowerCase().includes('heart') ||
         app.currentMetric.toLowerCase().includes('ecg'));
    
    // Adjust frequency range based on data type and selected profile
    const { min: minFrequency, max: maxFrequency } = currentSoundProfile.frequencyRange;
    
    // Calculate base frequency
    const baseFrequency = minFrequency + normalizedValue * (maxFrequency - minFrequency);
    
    // Add pulse modulation for cardiac data if profile supports it
    let frequency = baseFrequency;
    const hasPulseEffect = currentSoundProfile.customSettings && currentSoundProfile.customSettings.pulseEffect;
    
    if ((isCardiacData || hasPulseEffect)) {
        // Get rate of change for pulse effect
        const timeStep = app.data.filtered.length > 1
            ? (app.data.filtered[1].timestamp - app.data.filtered[0].timestamp)
            : 10;
        
        const currentIndex = Math.floor(app.currentTime / timeStep);
        const prevIndex = Math.max(0, currentIndex - 1);
        
        if (currentIndex > 0 && currentIndex < app.data.filtered.length) {
            const prevValue = app.data.filtered[prevIndex][app.currentMetric] || 0;
            const rateOfChange = (currentValue - prevValue) / Math.max(0.1, prevValue);
            
            // Add pulse modulation based on rate of change
            const pulseSpeed = currentSoundProfile.customSettings?.pulseSpeed || 0.3;
            const pulseModulation = 1 + (Math.max(0, rateOfChange) * pulseSpeed);
            frequency *= pulseModulation;
        }
    }
    
    // Update oscillator frequency with smoothing
    oscillator.frequency.setTargetAtTime(frequency, audioContext.currentTime, 0.05);
}

/**
 * Update visualization data from appropriate audio source
 */
function updateVisualizationData() {
    if (window.customAudioAnalyzer && window.customAudioDataArray && 
        currentSoundProfile.waveform === WAVEFORM_TYPES.CUSTOM_AUDIO) {
        // Get data from custom audio analyzer
        window.customAudioAnalyzer.getByteFrequencyData(window.customAudioDataArray);
        
        // Use this data for visualizations
        if (typeof updateCircularWave === 'function') {
            updateCircularWave();
        }
    } else if (analyser && audioDataArray) {
        // Get data from standard analyzer
        analyser.getByteFrequencyData(audioDataArray);
        
        // Update visualizations that react to audio
        if (typeof updateCircularWave === 'function') {
            updateCircularWave();
        }
    }
}

/**
 * Apply a custom drawn waveform
 */
function applyCustomWaveform(drawnPath, canvas) {
    if (!audioContext) return;
    
    try {
        // Get the center of the canvas
        const centerY = canvas.height / 2;
        
        // Create a sampled waveform (64 points)
        const samples = 64;
        const waveform = new Float32Array(samples);
        
        // Sort by x position
        const sortedPath = [...drawnPath].sort((a, b) => a.x - b.x);
        
        // Sample at regular intervals
        for (let i = 0; i < samples; i++) {
            const x = i / samples * canvas.width;
            
            // Find closest points
            let leftIdx = 0;
            let rightIdx = sortedPath.length - 1;
            
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
        
        // Create arrays for the periodic wave
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
        customWaveform = audioContext.createPeriodicWave(real, imag);
        
        // Update sound profile dropdown
        const dropdown = document.getElementById('sound-profile-dropdown');
        if (dropdown) {
            dropdown.value = 'custom_wave';
            currentSoundProfile = SOUND_PROFILES.find(p => p.id === 'custom_wave');
            
            // Update oscillator if it's running
            if (oscillator && app.isPlaying) {
                oscillator.setPeriodicWave(customWaveform);
            }
            
            // Make sure the dropdown change event is triggered
            dropdown.dispatchEvent(new Event('change'));
        }
        
        console.log('Custom waveform applied');
        return true;
    } catch (e) {
        console.error('Error applying custom waveform:', e);
        return false;
    }
}