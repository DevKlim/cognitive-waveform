/**
 * circular-wave.js
 * Advanced circular audio visualizer for physiological data
 * Fixed for drawing functionality and updated with green-blue color scheme
 */

/**
 * Initialize the circular wave visualization with audio-reactive elements
 */
function initCircularWave() {
    const container = document.getElementById('circular-wave');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Set container style for better visualization 
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    
    // Create visualization layers
    createVisualizationLayers(container);
    
    // Create radial frequency bars (main visualizer component)
    createFrequencyBars(container);
    
    // Create central element
    createCentralElement(container);
    
    // Create pulse rings
    createPulseRings(container);
    
    // Initialize audio upload interface
    initAudioUploadInterface();
    
    // Initialize drawing interface for custom waveform
    initDrawingInterface();
    
    // Initialize pulse history for smoother animations
    window.pulseHistory = Array(10).fill(0);
    
    // Initialize frequency data arrays for smoother transitions
    window.frequencyHistory = Array(64).fill(0);
}

/**
 * Create visualization background layers
 */
function createVisualizationLayers(container) {
    // Background glow
    const bgGlow = document.createElement('div');
    bgGlow.className = 'circular-bg-glow';
    container.appendChild(bgGlow);
    
    // Background circles
    for (let i = 0; i < 3; i++) {
        const bgCircle = document.createElement('div');
        bgCircle.className = 'circular-bg-circle';
        bgCircle.style.width = `${70 - (i * 15)}%`;
        bgCircle.style.height = `${70 - (i * 15)}%`;
        bgCircle.style.opacity = `${0.2 - (i * 0.05)}`;
        bgCircle.style.animationDuration = `${10 + (i * 5)}s`;
        container.appendChild(bgCircle);
    }
}

/**
 * Create frequency bars for the circular visualizer
 */
function createFrequencyBars(container) {
    // Number of bars (increased for more detailed visualization)
    const numBars = 120;
    
    // Create frequency bars group
    const barsContainer = document.createElement('div');
    barsContainer.className = 'frequency-bars-container';
    container.appendChild(barsContainer);
    
    // Create individual bars
    for (let i = 0; i < numBars; i++) {
        const bar = document.createElement('div');
        bar.className = 'frequency-bar';
        
        // Calculate angle for this bar
        const angle = (i * (360 / numBars));
        bar.style.transform = `rotate(${angle}deg)`;
        
        // Add inner bar (the part that animates)
        const innerBar = document.createElement('div');
        innerBar.className = 'frequency-bar-inner';
        
        // Add glow effect
        const glowEffect = document.createElement('div');
        glowEffect.className = 'frequency-bar-glow';
        
        bar.appendChild(innerBar);
        bar.appendChild(glowEffect);
        barsContainer.appendChild(bar);
    }
}

/**
 * Create central element of the visualizer
 */
function createCentralElement(container) {
    // Central circle (pulse indicator)
    const pulseCircle = document.createElement('div');
    pulseCircle.id = 'pulse-circle';
    pulseCircle.className = 'pulse-circle';
    container.appendChild(pulseCircle);
    
    // Beat indicator (for heart rate)
    const beatIndicator = document.createElement('div');
    beatIndicator.id = 'beat-indicator';
    beatIndicator.className = 'beat-indicator';
    container.appendChild(beatIndicator);
    
    // Value display
    const valueDisplay = document.createElement('div');
    valueDisplay.id = 'circular-value-display';
    valueDisplay.className = 'circular-value-display';
    valueDisplay.innerHTML = '<span class="value">0</span>';
    container.appendChild(valueDisplay);
}

/**
 * Create pulse rings for the visualizer
 */
function createPulseRings(container) {
    // Create multiple pulse rings for layered effect
    for (let i = 0; i < 3; i++) {
        const ring = document.createElement('div');
        ring.className = 'pulse-ring';
        ring.style.animationDelay = `${i * 0.4}s`;
        container.appendChild(ring);
    }
}

/**
 * Initialize audio upload interface 
 */
function initAudioUploadInterface() {
    // Find the sound profile container
    const container = document.getElementById('sound-profile-container');
    if (!container) return;
    
    // Create audio upload section if doesn't exist
    if (!document.getElementById('audio-upload-section')) {
        // Create section container
        const uploadSection = document.createElement('div');
        uploadSection.id = 'audio-upload-section';
        uploadSection.className = 'audio-upload-section hidden';
        
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'audio-file-input';
        fileInput.className = 'audio-file-input';
        fileInput.accept = 'audio/*';
        
        // Create custom upload button
        const uploadButton = document.createElement('label');
        uploadButton.htmlFor = 'audio-file-input';
        uploadButton.className = 'custom-upload-btn';
        uploadButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" fill="currentColor"/>
            </svg>
            Upload Audio
        `;
        
        // Create audio details display
        const audioDetails = document.createElement('div');
        audioDetails.id = 'audio-details';
        audioDetails.className = 'audio-details';
        
        // Add event listener for file upload
        fileInput.addEventListener('change', handleAudioUpload);
        
        // Add elements to section
        uploadSection.appendChild(fileInput);
        uploadSection.appendChild(uploadButton);
        uploadSection.appendChild(audioDetails);
        
        // Add section after sound profile dropdown
        container.appendChild(uploadSection);
        
        // Add a toggle button to the original sound selector
        const soundProfileDropdown = document.getElementById('sound-profile-dropdown');
        if (soundProfileDropdown) {
            // Add a listener to show/hide upload section
            soundProfileDropdown.addEventListener('change', function() {
                const isCustomAudio = this.value === 'custom_audio';
                uploadSection.classList.toggle('hidden', !isCustomAudio);
                
                // Hide drawing interface if showing upload
                const drawingSection = document.getElementById('waveform-drawing-section');
                if (drawingSection) {
                    drawingSection.classList.toggle('hidden', isCustomAudio);
                }
            });
            
            // Add custom audio option if not exists
            if (!Array.from(soundProfileDropdown.options).some(opt => opt.value === 'custom_audio')) {
                const customAudioOption = document.createElement('option');
                customAudioOption.value = 'custom_audio';
                customAudioOption.textContent = 'Custom Audio';
                soundProfileDropdown.appendChild(customAudioOption);
            }
        }
    }
}

/**
 * Handle audio file upload
 */
function handleAudioUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const audioDetails = document.getElementById('audio-details');
    if (audioDetails) {
        audioDetails.innerHTML = `
            <div class="audio-file-info">
                <p>${file.name}</p>
                <span>${(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <button id="play-uploaded-audio" class="play-uploaded-btn">
                <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" fill="currentColor"/>
                </svg>
            </button>
        `;
    }
    
    // Create audio element for the uploaded file
    const audioURL = URL.createObjectURL(file);
    
    // Create or update the audio element
    let customAudio = document.getElementById('custom-audio-element');
    if (!customAudio) {
        customAudio = document.createElement('audio');
        customAudio.id = 'custom-audio-element';
        customAudio.style.display = 'none';
        document.body.appendChild(customAudio);
    }
    
    customAudio.src = audioURL;
    customAudio.loop = true;
    
    // Connect to audio context for visualization
    setupCustomAudioNode(customAudio);
    
    // Add play button listener
    const playButton = document.getElementById('play-uploaded-audio');
    if (playButton) {
        playButton.addEventListener('click', function() {
            if (customAudio.paused) {
                customAudio.play();
                this.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
                    </svg>
                `;
            } else {
                customAudio.pause();
                this.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" fill="currentColor"/>
                    </svg>
                `;
            }
        });
    }
}

/**
 * Setup custom audio node for visualization
 */
function setupCustomAudioNode(audioElement) {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error('Could not create audio context:', e);
            return;
        }
    }
    
    // Create source node from audio element
    const source = audioContext.createMediaElementSource(audioElement);
    
    // Create analyzer for visualization
    const customAnalyser = audioContext.createAnalyser();
    customAnalyser.fftSize = 256;
    
    // Connect nodes
    source.connect(customAnalyser);
    customAnalyser.connect(audioContext.destination);
    
    // Store for later use
    window.customAudioAnalyser = customAnalyser;
    window.customAudioDataArray = new Uint8Array(customAnalyser.frequencyBinCount);
    
    console.log('Custom audio setup complete');
}

/**
 * Initialize drawing interface for custom waveform
 */
function initDrawingInterface() {
    // Find the sound profile container
    const container = document.getElementById('sound-profile-container');
    if (!container) return;
    
    // Create drawing section if doesn't exist
    if (!document.getElementById('waveform-drawing-section')) {
        // Create section container
        const drawingSection = document.createElement('div');
        drawingSection.id = 'waveform-drawing-section';
        drawingSection.className = 'waveform-drawing-section hidden';
        
        // Create button to open drawing modal
        const drawButton = document.createElement('button');
        drawButton.id = 'open-drawing-modal';
        drawButton.className = 'drawing-modal-btn';
        drawButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
            </svg>
            Draw Waveform
        `;
        
        // Add event listener to open drawing modal
        drawButton.addEventListener('click', openWaveformDrawingModal);
        
        // Add elements to section
        drawingSection.appendChild(drawButton);
        
        // Add section after sound profile dropdown
        container.appendChild(drawingSection);
        
        // Add a listener to the sound profile dropdown
        const soundProfileDropdown = document.getElementById('sound-profile-dropdown');
        if (soundProfileDropdown) {
            // Show/hide drawing section based on dropdown
            soundProfileDropdown.addEventListener('change', function() {
                const isCustomWaveform = this.value === 'custom_wave';
                drawingSection.classList.toggle('hidden', !isCustomWaveform);
                
                // Hide upload interface if showing drawing
                const uploadSection = document.getElementById('audio-upload-section');
                if (uploadSection) {
                    uploadSection.classList.toggle('hidden', isCustomWaveform || this.value !== 'custom_audio');
                }
            });
        }
    }
}

// Drawing variables
let isDrawing = false;
let drawingContext = null;
let drawingPath = [];
let drawingColor = '#1db954'; // Default green color

/**
 * Open waveform drawing modal
 */
function openWaveformDrawingModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('waveform-drawing-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'waveform-drawing-modal';
        modal.className = 'modal drawing-modal';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content drawing-modal-content';
        
        // Add header
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `
            <h2>Draw Your Custom Waveform</h2>
            <span class="close-modal">&times;</span>
        `;
        
        // Create canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'drawing-canvas-container';
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'waveform-drawing-canvas';
        canvas.width = 600;
        canvas.height = 300;
        canvasContainer.appendChild(canvas);
        
        // Create controls
        const controls = document.createElement('div');
        controls.className = 'drawing-controls';
        controls.innerHTML = `
            <div class="control-options">
                <button id="clear-canvas" class="drawing-control-btn">Clear</button>
                <button id="smooth-wave" class="drawing-control-btn">Smooth</button>
                <div class="color-selector">
                    <label>Color:</label>
                    <input type="color" id="wave-color" value="#1db954">
                </div>
            </div>
            <div class="drawing-instructions">
                <p>Draw your waveform pattern above. This will be used to generate sound based on the data values.</p>
            </div>
            <div class="button-group">
                <button id="apply-drawn-wave" class="primary-btn">Apply Waveform</button>
                <button id="cancel-drawing" class="secondary-btn">Cancel</button>
            </div>
        `;
        
        // Assemble modal
        modalContent.appendChild(header);
        modalContent.appendChild(canvasContainer);
        modalContent.appendChild(controls);
        modal.appendChild(modalContent);
        
        // Add to document
        document.body.appendChild(modal);
        
        // Initialize drawing canvas
        setTimeout(() => {
            initDrawingCanvas();
            console.log('Drawing canvas initialized with timeout');
        }, 100);
        
        // Set up event listeners
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        const clearBtn = document.getElementById('clear-canvas');
        clearBtn.addEventListener('click', clearDrawingCanvas);
        
        const smoothBtn = document.getElementById('smooth-wave');
        smoothBtn.addEventListener('click', smoothDrawnWave);
        
        const colorInput = document.getElementById('wave-color');
        colorInput.addEventListener('change', updateDrawingColor);
        
        const applyBtn = document.getElementById('apply-drawn-wave');
        applyBtn.addEventListener('click', () => {
            applyDrawnWaveform();
            modal.style.display = 'none';
        });
        
        const cancelBtn = document.getElementById('cancel-drawing');
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    } else {
        // If modal already exists, reinitialize the canvas
        setTimeout(() => {
            initDrawingCanvas();
            console.log('Drawing canvas reinitialized with timeout');
        }, 100);
    }
    
    // Show modal
    modal.style.display = 'block';
}

/**
 * Initialize the drawing canvas
 */
function initDrawingCanvas() {
    const canvas = document.getElementById('waveform-drawing-canvas');
    if (!canvas) {
        console.error('Drawing canvas not found');
        return;
    }
    
    // Set canvas dimensions explicitly - fix for canvas not rendering properly
    canvas.width = canvas.offsetWidth || 600;
    canvas.height = canvas.offsetHeight || 300;
    
    drawingContext = canvas.getContext('2d');
    if (!drawingContext) {
        console.error('Could not get canvas context');
        return;
    }
    
    // Initialize canvas
    drawingContext.fillStyle = '#121212';
    drawingContext.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw guidelines
    drawingContext.strokeStyle = '#333';
    drawingContext.lineWidth = 1;
    
    // Center line
    drawingContext.beginPath();
    drawingContext.moveTo(0, canvas.height / 2);
    drawingContext.lineTo(canvas.width, canvas.height / 2);
    drawingContext.stroke();
    
    // Set drawing style
    drawingContext.strokeStyle = drawingColor;
    drawingContext.lineWidth = 3;
    drawingContext.lineJoin = 'round';
    drawingContext.lineCap = 'round';
    
    // Add event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch support
    canvas.addEventListener('touchstart', handleTouch(startDrawing), { passive: false });
    canvas.addEventListener('touchmove', handleTouch(draw), { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    
    console.log('Drawing canvas initialized with dimensions:', canvas.width, 'x', canvas.height);
}

/**
 * Handle touch events for drawing
 */
function handleTouch(eventHandler) {
    return function(event) {
        event.preventDefault(); // Prevent scrolling while drawing
        
        const rect = event.target.getBoundingClientRect();
        const touch = event.touches[0];
        
        // Convert touch to mouse event coordinates
        const mouseEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            target: event.target,
            preventDefault: function() {}
        };
        
        eventHandler(mouseEvent);
    };
}

/**
 * Start drawing on canvas
 */
function startDrawing(e) {
    isDrawing = true;
    
    const canvas = document.getElementById('waveform-drawing-canvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawingPath = [{x, y}];
    
    drawingContext.beginPath();
    drawingContext.moveTo(x, y);
    drawingContext.lineTo(x, y);
    drawingContext.stroke();
    
    console.log('Started drawing at', x, y);
}

/**
 * Draw on canvas
 */
function draw(e) {
    if (!isDrawing) return;
    
    const canvas = document.getElementById('waveform-drawing-canvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawingPath.push({x, y});
    
    drawingContext.lineTo(x, y);
    drawingContext.stroke();
}

/**
 * Stop drawing
 */
function stopDrawing() {
    isDrawing = false;
}

/**
 * Clear the drawing canvas
 */
function clearDrawingCanvas() {
    const canvas = document.getElementById('waveform-drawing-canvas');
    if (!canvas || !drawingContext) return;
    
    drawingContext.fillStyle = '#121212';
    drawingContext.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw center line
    drawingContext.strokeStyle = '#333';
    drawingContext.lineWidth = 1;
    drawingContext.beginPath();
    drawingContext.moveTo(0, canvas.height / 2);
    drawingContext.lineTo(canvas.width, canvas.height / 2);
    drawingContext.stroke();
    
    // Reset drawing style
    drawingContext.strokeStyle = drawingColor;
    drawingContext.lineWidth = 3;
    
    // Clear path
    drawingPath = [];
    
    console.log('Canvas cleared');
}

/**
 * Smooth the drawn waveform
 */
function smoothDrawnWave() {
    if (drawingPath.length < 3) {
        console.log('Not enough points to smooth');
        return;
    }
    
    // Create a new smoothed path
    const smoothedPath = [];
    
    // Apply a moving average
    const windowSize = 5;
    
    for (let i = 0; i < drawingPath.length; i++) {
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        
        // Calculate window bounds
        const start = Math.max(0, i - Math.floor(windowSize / 2));
        const end = Math.min(drawingPath.length - 1, i + Math.floor(windowSize / 2));
        
        // Calculate average
        for (let j = start; j <= end; j++) {
            sumX += drawingPath[j].x;
            sumY += drawingPath[j].y;
            count++;
        }
        
        smoothedPath.push({
            x: sumX / count,
            y: sumY / count
        });
    }
    
    // Redraw with smoothed path
    clearDrawingCanvas();
    
    drawingContext.beginPath();
    drawingContext.moveTo(smoothedPath[0].x, smoothedPath[0].y);
    
    for (let i = 1; i < smoothedPath.length; i++) {
        drawingContext.lineTo(smoothedPath[i].x, smoothedPath[i].y);
    }
    
    drawingContext.stroke();
    
    // Update path
    drawingPath = smoothedPath;
    
    console.log('Waveform smoothed');
}

/**
 * Update drawing color
 */
function updateDrawingColor() {
    const colorInput = document.getElementById('wave-color');
    if (!colorInput) return;
    
    drawingColor = colorInput.value;
    if (drawingContext) {
        drawingContext.strokeStyle = drawingColor;
    }
    
    console.log('Drawing color updated to', drawingColor);
}

/**
 * Apply drawn waveform to audio
 */
function applyDrawnWaveform() {
    if (drawingPath.length === 0) {
        console.log('No waveform drawn');
        return;
    }
    
    const canvas = document.getElementById('waveform-drawing-canvas');
    if (!canvas) return;
    
    // Convert drawing to a periodic wave
    const samples = 64;
    const waveform = new Float32Array(samples);
    
    // Normalize x positions along canvas width
    const normalizedPath = [];
    const centerY = canvas.height / 2;
    
    // Sort by x position
    const sortedPath = [...drawingPath].sort((a, b) => a.x - b.x);
    
    // Sample points at regular intervals
    for (let i = 0; i < samples; i++) {
        const x = (i / samples) * canvas.width;
        
        // Find closest points
        let leftPoint = sortedPath[0];
        let rightPoint = sortedPath[sortedPath.length - 1];
        
        for (let j = 0; j < sortedPath.length - 1; j++) {
            if (sortedPath[j].x <= x && sortedPath[j + 1].x >= x) {
                leftPoint = sortedPath[j];
                rightPoint = sortedPath[j + 1];
                break;
            }
        }
        
        // Interpolate y value
        let y;
        if (rightPoint.x === leftPoint.x) {
            y = leftPoint.y;
        } else {
            const t = (x - leftPoint.x) / (rightPoint.x - leftPoint.x);
            y = leftPoint.y + t * (rightPoint.y - leftPoint.y);
        }
        
        // Normalize to -1 to 1 range (invert y since canvas y increases downward)
        waveform[i] = -(y - centerY) / centerY;
    }
    
    // Store waveform data for audio synthesis
    window.customDrawnWaveform = waveform;
    
    // If audio API available, create periodic wave
    if (audioContext) {
        try {
            // Convert to real and imag components for PeriodicWave
            const real = new Float32Array(samples);
            const imag = new Float32Array(samples);
            
            // Perform a simple DFT
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
            window.customPeriodicWave = audioContext.createPeriodicWave(real, imag);
            
            console.log('Custom waveform created from drawing');
            
            // Update oscillator if it's running
            if (oscillator && app.isPlaying) {
                oscillator.setPeriodicWave(window.customPeriodicWave);
            }
        } catch (e) {
            console.error('Error creating periodic wave:', e);
        }
    }
}

/**
 * Update the circular wave visualization based on current data
 * with enhanced audio-reactive elements
 * UPDATED with green-blue color scheme
 */
function updateCircularWave() {
    // Get relevant DOM elements
    const container = document.getElementById('circular-wave');
    const pulseCircle = document.getElementById('pulse-circle');
    const beatIndicator = document.getElementById('beat-indicator');
    const valueDisplay = document.getElementById('circular-value-display');
    
    if (!container || !pulseCircle) return;
    
    // Get current metric value
    const currentValue = getCurrentValue();
    
    // Get value range for normalization
    const valueGetter = d => d[app.currentMetric] || 0;
    const minValue = d3.min(app.data.filtered, valueGetter) * 0.9;
    const maxValue = d3.max(app.data.filtered, valueGetter) * 1.1;
    
    // Calculate normalized value (0-1 range)
    const normalizedValue = (currentValue - minValue) / (maxValue - minValue || 1);
    
    // Determine if we're visualizing heart rate or similar cardiac data
    const isCardiacData = app.currentMetric && 
        (app.currentMetric.toLowerCase().includes('hr') || 
         app.currentMetric.toLowerCase().includes('heart') ||
         app.currentMetric.toLowerCase().includes('ecg'));
    
    // Detect beats for heart rate data
    let beatStrength = 0;
    let beatFrequency = 0;
    
    if (isCardiacData) {
        // Calculate beat detection
        const timeStep = app.data.filtered.length > 1
            ? (app.data.filtered[1].timestamp - app.data.filtered[0].timestamp)
            : 10;
            
        const currentIndex = Math.floor(app.currentTime / timeStep);
        const prevIndex = Math.max(0, currentIndex - 1);
        
        if (currentIndex > 0 && currentIndex < app.data.filtered.length) {
            const prevValue = app.data.filtered[prevIndex][app.currentMetric] || 0;
            const rateOfChange = (currentValue - prevValue) / Math.max(0.1, prevValue);
            
            // Detect rising edge (heartbeat)
            beatStrength = Math.max(0, rateOfChange * 10);
            beatStrength = Math.min(1, beatStrength);
            
            // Calculate estimated frequency based on heart rate (bpm)
            // 60 bpm = 1 Hz, 120 bpm = 2 Hz
            beatFrequency = currentValue / 60;
        }
        
        // Update pulse history for smoother transitions
        window.pulseHistory.shift();
        window.pulseHistory.push(beatStrength);
        
        // Average the history for smoother animation
        beatStrength = window.pulseHistory.reduce((sum, val) => sum + val, 0) / window.pulseHistory.length;
    }
    
    // Update central pulse circle
    if (pulseCircle) {
        // Size based on metric type
        const minSize = 50;
        const maxSize = 120;
        let size;
        
        if (isCardiacData) {
            // Heart rate: pulsing size based on beat strength
            const basePulse = minSize + normalizedValue * (maxSize - minSize) * 0.5;
            const beatPulse = beatStrength * (maxSize - minSize) * 0.5;
            size = basePulse + beatPulse;
        } else {
            // Other metrics: size based on normalized value
            size = minSize + normalizedValue * (maxSize - minSize);
        }
        
        // Apply size with smoothing
        pulseCircle.style.width = `${size}px`;
        pulseCircle.style.height = `${size}px`;
        
        // Color and glow based on metric - UPDATED TO GREEN-BLUE SCHEME
        let hue, saturation, lightness, alpha;
        
        if (isCardiacData) {
            // Heart rate: blue pulsing (instead of red)
            hue = 200; // Blue instead of red
            saturation = 80 + beatStrength * 20;
            lightness = 50 + beatStrength * 10;
            alpha = 0.5 + beatStrength * 0.5;
        } else {
            // Other metrics: green to blue spectrum based on value
            hue = 120 + normalizedValue * 120; // Green to blue (120-240)
            saturation = 80;
            lightness = 50;
            alpha = 0.7;
        }
        
        // Apply color and glow
        pulseCircle.style.backgroundColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
        pulseCircle.style.boxShadow = `0 0 ${20 + beatStrength * 30}px hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`;
        
        // Animation speed for pulsing
        let animationDuration;
        if (isCardiacData) {
            // Heart rate: animation speed based on beat frequency
            animationDuration = beatFrequency > 0 ? 60 / currentValue : 1;
            animationDuration = Math.max(0.5, Math.min(1.5, animationDuration));
        } else {
            // Other metrics: animation speed based on value
            animationDuration = 1.5 - (normalizedValue * 0.5);
        }
        
        pulseCircle.style.animationDuration = `${animationDuration}s`;
    }
    
    // Update beat indicator (only for cardiac data)
    if (beatIndicator) {
        if (isCardiacData) {
            // Show and animate for heart rate data - UPDATED TO BLUE
            beatIndicator.style.opacity = beatStrength;
            beatIndicator.style.transform = `scale(${1 + beatStrength})`;
            beatIndicator.style.backgroundColor = '#4a90e2'; // Blue instead of red
            beatIndicator.style.boxShadow = `0 0 15px rgba(74, 144, 226, 0.7)`;
        } else {
            // Hide for non-cardiac data
            beatIndicator.style.opacity = 0;
        }
    }
    
    // Update value display
    if (valueDisplay) {
        // Show current value in the center
        const valueElem = valueDisplay.querySelector('.value');
        if (valueElem) {
            valueElem.textContent = Math.round(currentValue);
        }
        
        // Add units for different metrics
        let units = '';
        if (isCardiacData) {
            units = 'BPM';
        } else if (app.currentMetric && app.currentMetric.toLowerCase().includes('temp')) {
            units = '°C';
        }
        
        // Check if units span exists
        const unitsSpan = valueDisplay.querySelector('.units');
        if (units) {
            if (unitsSpan) {
                unitsSpan.textContent = units;
            } else {
                const newUnitsSpan = document.createElement('span');
                newUnitsSpan.className = 'units';
                newUnitsSpan.style.fontSize = '14px';
                newUnitsSpan.style.opacity = '0.8';
                newUnitsSpan.textContent = units;
                valueDisplay.appendChild(newUnitsSpan);
            }
        } else if (unitsSpan) {
            unitsSpan.textContent = '';
        }
        
        // Animate value changes
        valueDisplay.classList.toggle('pulse', beatStrength > 0.5);
    }
    
    // Update pulse rings
    const rings = container.querySelectorAll('.pulse-ring');
    rings.forEach((ring, i) => {
        if (isCardiacData) {
            // Heart rate: rings pulse with the beat
            ring.style.opacity = 0.2 + (beatStrength * 0.8);
            const duration = 1.2 / (beatFrequency || 1);
            ring.style.animationDuration = `${duration}s`;
            // Change color to blue-green scheme
            ring.style.borderColor = 'rgba(74, 144, 226, 0.3)';
        } else {
            // Other metrics: rings follow the value
            ring.style.opacity = 0.1 + (normalizedValue * 0.5);
            const duration = 2 - (normalizedValue * 0.5);
            ring.style.animationDuration = `${duration}s`;
            // Green color
            ring.style.borderColor = 'rgba(29, 185, 84, 0.3)';
        }
    });
    
    // Get audio data for visualization
    let frequencyData = new Uint8Array(64).fill(0);
    
    // Get audio data from the right source
    if (window.customAudioAnalyser && window.customAudioDataArray) {
        // Custom uploaded audio
        window.customAudioAnalyser.getByteFrequencyData(window.customAudioDataArray);
        frequencyData = window.customAudioDataArray;
    } else if (audioDataArray && app.isPlaying) {
        // Built-in audio
        analyser.getByteFrequencyData(audioDataArray);
        frequencyData = audioDataArray;
    }
    
    // Process frequency data for smoother transitions
    for (let i = 0; i < frequencyData.length; i++) {
        // Smooth transitions using weighted average
        window.frequencyHistory[i] = window.frequencyHistory[i] * 0.7 + (frequencyData[i] / 255) * 0.3;
    }
    
    // Update frequency bars
    const bars = container.querySelectorAll('.frequency-bar');
    if (bars.length > 0) {
        // Create a pattern that combines audio data with physiological data
        bars.forEach((bar, i) => {
            const innerBar = bar.querySelector('.frequency-bar-inner');
            const glowEffect = bar.querySelector('.frequency-bar-glow');
            if (!innerBar) return;
            
            // Get frequency bin for this bar
            const frequencyBin = i % window.frequencyHistory.length;
            let audioReactiveValue = window.frequencyHistory[frequencyBin];
            
            // Combine with physiological data
            let barHeight;
            let barColor;
            
            if (isCardiacData) {
                // Calculate bar height based on audio data and heart rate
                const heartRateEffect = Math.sin((i / bars.length) * Math.PI * 2 + (app.currentTime * beatFrequency * Math.PI)) * 0.5 + 0.5;
                barHeight = 10 + (audioReactiveValue * 40) + (heartRateEffect * beatStrength * 80) + (normalizedValue * 30);
                
                // Color with GREEN-BLUE heart rate emphasis (instead of red-yellow)
                const hue = 180 + (audioReactiveValue * 60); // Blue range (180-240)
                barColor = `hsl(${hue}, ${80 + beatStrength * 20}%, ${50 + beatStrength * 20}%)`;
            } else {
                // For other metrics: combine audio with data value
                const angle = (i / bars.length) * Math.PI * 2;
                const waveEffect = Math.sin(angle + app.currentTime * 3) * 0.5 + 0.5;
                barHeight = 10 + (audioReactiveValue * 50) + (waveEffect * normalizedValue * 50);
                
                // Color based on metric value - GREEN-BLUE
                const hue = 120 + (normalizedValue * 120) + (audioReactiveValue * 30); // Green to blue (120-240)
                barColor = `hsl(${hue}, 80%, ${50 + audioReactiveValue * 20}%)`;
            }
            
            // Apply height with smooth transition
            innerBar.style.height = `${Math.min(150, barHeight)}px`;
            innerBar.style.backgroundColor = barColor;
            
            // Add glow effect
            if (glowEffect) {
                glowEffect.style.height = `${Math.min(150, barHeight * 1.2)}px`;
                glowEffect.style.backgroundColor = barColor;
                glowEffect.style.opacity = audioReactiveValue * 0.7;
            }
        });
    }
    
    // Update background elements
    const bgGlow = container.querySelector('.circular-bg-glow');
    if (bgGlow) {
        // Set background glow based on data type - GREEN-BLUE COLORS
        if (isCardiacData) {
            // Blue for heart rate (instead of red)
            bgGlow.style.backgroundColor = `rgba(74, 144, 226, ${0.1 + beatStrength * 0.2})`;
            bgGlow.style.boxShadow = `0 0 ${50 + beatStrength * 100}px rgba(74, 144, 226, ${0.3 + beatStrength * 0.3})`;
        } else {
            // Green to blue for other metrics
            const hue = 120 + (normalizedValue * 120);
            bgGlow.style.backgroundColor = `hsla(${hue}, 70%, 40%, 0.15)`;
            bgGlow.style.boxShadow = `0 0 ${50 + normalizedValue * 100}px hsla(${hue}, 70%, 40%, 0.4)`;
        }
    }
}