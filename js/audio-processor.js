/**
 * audio-processor.js
 * Enhanced audio processing with expanded sound options and custom waveform support
 */

// Available waveform types
const WAVEFORM_TYPES = {
    SINE: 'sine',
    TRIANGLE: 'triangle',
    SQUARE: 'square',
    SAWTOOTH: 'sawtooth',
    CUSTOM: 'custom'
};

// Sound profiles for different data visualization scenarios
const SOUND_PROFILES = [
    {
        id: 'sine',
        name: 'Sine',
        waveform: WAVEFORM_TYPES.SINE,
        frequencyRange: { min: 100, max: 800 }
    },
    {
        id: 'triangle',
        name: 'Triangle',
        waveform: WAVEFORM_TYPES.TRIANGLE,
        frequencyRange: { min: 80, max: 700 }
    },
    {
        id: 'square', 
        name: 'Square',
        waveform: WAVEFORM_TYPES.SQUARE,
        frequencyRange: { min: 60, max: 600 }
    },
    {
        id: 'sawtooth',
        name: 'Sawtooth',
        waveform: WAVEFORM_TYPES.SAWTOOTH,
        frequencyRange: { min: 90, max: 750 }
    },
    {
        id: 'heart_tone',
        name: 'Heart Tone',
        waveform: WAVEFORM_TYPES.SINE,
        frequencyRange: { min: 120, max: 400 },
        customSettings: {
            pulseEffect: true,
            pulseSpeed: 0.8
        }
    },
    {
        id: 'neural',
        name: 'Neural',
        waveform: WAVEFORM_TYPES.SAWTOOTH,
        frequencyRange: { min: 200, max: 1200 }
    },
    {
        id: 'respiratory',
        name: 'Respiratory',
        waveform: WAVEFORM_TYPES.TRIANGLE,
        frequencyRange: { min: 60, max: 300 },
        customSettings: {
            pulseEffect: true,
            pulseSpeed: 0.5
        }
    },
    {
        id: 'stress',
        name: 'Stress',
        waveform: WAVEFORM_TYPES.SQUARE,
        frequencyRange: { min: 150, max: 900 }
    },
    {
        id: 'ambient',
        name: 'Ambient',
        waveform: WAVEFORM_TYPES.SINE,
        frequencyRange: { min: 200, max: 1000 },
        customSettings: {
            pulseEffect: true,
            pulseSpeed: 0.3
        }
    },
    {
        id: 'custom_wave',
        name: 'Custom',
        waveform: WAVEFORM_TYPES.CUSTOM,
        frequencyRange: { min: 100, max: 800 }
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
    const sampleRate = audioContext.sampleRate;
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
            if (oscillator) {
                updateOscillatorType();
            }
            
            console.log(`Sound profile changed to: ${currentSoundProfile.name}`);
        }
        
        // If selected custom, show custom controls
        if (selectedProfileId === 'custom_wave') {
            showCustomWaveformControls();
        } else {
            hideCustomWaveformControls();
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
    
    // Add custom waveform controls section (initially hidden)
    const customControls = document.createElement('div');
    customControls.id = 'custom-waveform-controls';
    customControls.className = 'custom-waveform-controls hidden';
    
    // Add custom waveform editor button
    const editorButton = document.createElement('button');
    editorButton.textContent = 'Edit Custom Waveform';
    editorButton.className = 'custom-waveform-btn';
    editorButton.addEventListener('click', openCustomWaveformEditor);
    
    customControls.appendChild(editorButton);
    container.appendChild(customControls);
}

/**
 * Show custom waveform controls
 */
function showCustomWaveformControls() {
    const controls = document.getElementById('custom-waveform-controls');
    if (controls) {
        controls.classList.remove('hidden');
    }
}

/**
 * Hide custom waveform controls
 */
function hideCustomWaveformControls() {
    const controls = document.getElementById('custom-waveform-controls');
    if (controls) {
        controls.classList.add('hidden');
    }
}

/**
 * Open custom waveform editor modal
 */
function openCustomWaveformEditor() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('waveform-editor-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'waveform-editor-modal';
        modal.className = 'modal';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // Add header
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `
            <h2>Custom Waveform Editor</h2>
            <span class="close-modal">&times;</span>
        `;
        modalContent.appendChild(header);
        
        // Add canvas for waveform drawing
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'waveform-canvas-container';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'waveform-canvas';
        canvas.width = 500;
        canvas.height = 200;
        canvasContainer.appendChild(canvas);
        modalContent.appendChild(canvasContainer);
        
        // Add controls
        const controls = document.createElement('div');
        controls.className = 'waveform-controls';
        controls.innerHTML = `
            <div class="control-group">
                <label>Waveform Presets:</label>
                <select id="waveform-preset">
                    <option value="sine">Sine</option>
                    <option value="triangle">Triangle</option>
                    <option value="square">Square</option>
                    <option value="sawtooth">Sawtooth</option>
                    <option value="custom">Custom Draw</option>
                </select>
            </div>
            <div class="harmonics-controls">
                <label>Harmonic Amplitude:</label>
                <div id="harmonics-sliders"></div>
            </div>
            <div class="button-group">
                <button id="apply-waveform">Apply</button>
                <button id="cancel-waveform">Cancel</button>
            </div>
        `;
        modalContent.appendChild(controls);
        
        // Add modal to document
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Set up event listeners
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        const presetSelect = document.getElementById('waveform-preset');
        presetSelect.addEventListener('change', function() {
            updateWaveformCanvas(this.value);
        });
        
        // Generate harmonic sliders
        const harmonicsContainer = document.getElementById('harmonics-sliders');
        const numHarmonics = 8;
        for (let i = 1; i <= numHarmonics; i++) {
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'harmonic-slider-container';
            
            const label = document.createElement('label');
            label.textContent = `H${i}:`;
            sliderContainer.appendChild(label);
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '100';
            slider.value = i === 1 ? '100' : Math.floor(100 / i);
            slider.className = 'harmonic-slider';
            slider.dataset.harmonic = i;
            slider.addEventListener('input', updateCustomWaveform);
            sliderContainer.appendChild(slider);
            
            harmonicsContainer.appendChild(sliderContainer);
        }
        
        // Apply button
        const applyBtn = document.getElementById('apply-waveform');
        applyBtn.addEventListener('click', () => {
            applyCustomWaveform();
            modal.style.display = 'none';
        });
        
        // Cancel button
        const cancelBtn = document.getElementById('cancel-waveform');
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Initialize canvas
        updateWaveformCanvas('sine');
    }
    
    // Show modal
    modal.style.display = 'block';
}

/**
 * Update waveform canvas with selected preset
 */
function updateWaveformCanvas(presetType) {
    const canvas = document.getElementById('waveform-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, width, height);
    
    // Draw center line
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.moveTo(0, height/2);
    ctx.lineTo(width, height/2);
    ctx.stroke();
    
    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = '#1db954';
    ctx.lineWidth = 2;
    
    // Different wave patterns for different presets
    for (let x = 0; x < width; x++) {
        const normalizedX = x / width * 2 * Math.PI;
        let y;
        
        switch (presetType) {
            case 'sine':
                y = Math.sin(normalizedX * 5);
                break;
            case 'triangle':
                y = Math.asin(Math.sin(normalizedX * 5)) * 2 / Math.PI;
                break;
            case 'square':
                y = Math.sign(Math.sin(normalizedX * 5));
                break;
            case 'sawtooth':
                y = (normalizedX * 5 % (2 * Math.PI)) / Math.PI - 1;
                break;
            case 'custom':
                // Use custom waveform from sliders
                y = getCustomWaveformValue(normalizedX);
                break;
            default:
                y = Math.sin(normalizedX * 5);
        }
        
        // Scale and position
        const scaledY = height/2 - (y * height/3);
        
        if (x === 0) {
            ctx.moveTo(x, scaledY);
        } else {
            ctx.lineTo(x, scaledY);
        }
    }
    
    ctx.stroke();
    
    // Update harmonics sliders visibility for custom preset
    const harmonicsControls = document.querySelector('.harmonics-controls');
    if (harmonicsControls) {
        harmonicsControls.style.display = presetType === 'custom' ? 'block' : 'none';
    }
}

/**
 * Calculate custom waveform value from harmonic sliders
 */
function getCustomWaveformValue(x) {
    const sliders = document.querySelectorAll('.harmonic-slider');
    let sum = 0;
    
    sliders.forEach(slider => {
        const harmonic = parseInt(slider.dataset.harmonic);
        const amplitude = parseInt(slider.value) / 100;
        
        // Add this harmonic's contribution
        sum += amplitude * Math.sin(x * harmonic);
    });
    
    // Normalize to -1 to 1 range
    return sum / sliders.length;
}

/**
 * Update custom waveform preview when sliders change
 */
function updateCustomWaveform() {
    if (document.getElementById('waveform-preset').value === 'custom') {
        updateWaveformCanvas('custom');
    }
}

/**
 * Apply custom waveform to audio
 */
function applyCustomWaveform() {
    if (!audioContext) return;
    
    // Get sliders
    const sliders = document.querySelectorAll('.harmonic-slider');
    
    // Create arrays for periodic wave
    const harmonics = sliders.length;
    const real = new Float32Array(harmonics + 1); // +1 for DC offset (always 0)
    const imag = new Float32Array(harmonics + 1);
    
    // DC offset is always 0
    real[0] = 0;
    imag[0] = 0;
    
    // Set values from sliders
    sliders.forEach(slider => {
        const harmonic = parseInt(slider.dataset.harmonic);
        const amplitude = parseInt(slider.value) / 100;
        
        // For sine wave components
        imag[harmonic] = amplitude;
    });
    
    // Create custom periodic wave
    try {
        customWaveform = audioContext.createPeriodicWave(real, imag);
        console.log('Custom waveform created successfully');
        
        // Update oscillator if it's running
        if (oscillator && currentSoundProfile.waveform === WAVEFORM_TYPES.CUSTOM) {
            oscillator.setPeriodicWave(customWaveform);
        }
    } catch (e) {
        console.error('Error creating custom waveform:', e);
    }
}

/**
 * Update oscillator type based on current sound profile
 */
function updateOscillatorType() {
    if (!oscillator) return;
    
    try {
        if (currentSoundProfile.waveform === WAVEFORM_TYPES.CUSTOM && customWaveform) {
            oscillator.setPeriodicWave(customWaveform);
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
        // Create oscillator if not exists
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
    if (oscillator) {
        try {
            oscillator.stop();
            oscillator.disconnect();
            oscillator = null;
            console.log('Sonification stopped');
        } catch (e) {
            console.error('Error stopping sonification:', e);
            oscillator = null;
        }
    }
}

/**
 * Update sonification based on current value with enhanced behavior for physiological data
 */
function updateSonification() {
    if (!oscillator) return;
    
    try {
        // Get current value
        const currentValue = getCurrentValue();
        
        // Get value range
        const valueGetter = d => d[app.currentMetric] || 0;
        const minValue = d3.min(app.data.filtered, valueGetter) * 0.9;
        const maxValue = d3.max(app.data.filtered, valueGetter) * 1.1;
        
        // Check if we're dealing with heart rate or similar cardiac data
        const isCardiacData = app.currentMetric && 
            (app.currentMetric.toLowerCase().includes('hr') || 
             app.currentMetric.toLowerCase().includes('heart') ||
             app.currentMetric.toLowerCase().includes('ecg'));
        
        // Adjust frequency range based on data type and selected profile
        const { min: minFrequency, max: maxFrequency } = currentSoundProfile.frequencyRange;
        
        // Normalize the value
        const normalizedValue = (currentValue - minValue) / (maxValue - minValue || 1);
        
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
        
        // Get audio data for visualizations
        if (analyser) {
            analyser.getByteFrequencyData(audioDataArray);
            
            // Update visualizations that react to audio
            updateCircularWave();
            
            // Also update bottom wave which now handles audio reactivity
            // The wave animation function handles this internally via requestAnimationFrame
        }
    } catch (e) {
        console.error('Error updating sonification:', e);
    }
}