/**
 * tutorial.js
 * Interactive tutorial functionality for Cognify
 */

// Audio context for sound demos
let audioContext = null;
let oscillator = null;
let gainNode = null;
let isPlaying = false;

// Initialize audio context
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.gain.value = 0.2; // Start at 20% volume
        gainNode.connect(audioContext.destination);
        console.log('Audio context initialized');
    } catch (e) {
        console.error('Failed to initialize audio context:', e);
    }
}

// Utility functions
function calculateYPosition(x) {
    // These are approximations of the SVG path points
    const points = [
        {x: 0, y: 150},
        {x: 60, y: 120},
        {x: 120, y: 70},
        {x: 180, y: 50},
        {x: 240, y: 60},
        {x: 300, y: 90},
        {x: 360, y: 130},
        {x: 420, y: 100},
        {x: 480, y: 110},
        {x: 540, y: 120},
        {x: 600, y: 130}
    ];
    
    // Find the two closest points
    let p1 = points[0];
    let p2 = points[points.length - 1];
    
    for (let i = 0; i < points.length - 1; i++) {
        if (x >= points[i].x && x <= points[i+1].x) {
            p1 = points[i];
            p2 = points[i+1];
            break;
        }
    }
    
    // Linear interpolation between the two points
    if (p1.x === p2.x) return p1.y;
    
    const ratio = (x - p1.x) / (p2.x - p1.x);
    return p1.y + ratio * (p2.y - p1.y);
}

// STEP 1: Initialize intro interactions
function initStep1Interactions() {
    console.log('Initializing step 1 interactions');
    
    const stressSlider = document.getElementById('stress-level');
    const bpmValue = document.getElementById('bpm-value');
    const waveformPreview = document.getElementById('waveform-preview');
    const glowCircle = document.getElementById('glow-circle');
    
    if (!stressSlider || !bpmValue || !waveformPreview || !glowCircle) {
        console.error('Missing elements for step 1');
        return;
    }
    
    // Initial waveform
    updateIntroWaveform(50);

    
    // Update on slider change
    stressSlider.addEventListener('input', function() {
        const stressLevel = parseInt(this.value);
        
        // Update heart rate BPM (60-120 range)
        const heartRate = 60 + (stressLevel * 0.6);
        bpmValue.textContent = Math.round(heartRate);
        
        // Update waveform
        updateIntroWaveform(stressLevel);
        
        // Update glow circle
        updateGlowCircle(stressLevel);

            const firstStep = document.querySelector('.tutorial-step[data-step="1"]');
    if (firstStep) {
        firstStep.classList.add('active');
    }
    });
    
    // Initialize with default value
    stressSlider.dispatchEvent(new Event('input'));
}

function updateIntroWaveform(stress) {
    const waveformPreview = document.getElementById('waveform-preview');
    if (!waveformPreview) return;
    
    // Clear existing bars
    waveformPreview.innerHTML = '';
    
    // Create bars based on stress level
    const numBars = 20;
    for (let i = 0; i < numBars; i++) {
        // Calculate height based on stress and position
        let height;
        
        if (stress < 30) {
            // Low stress - smooth, regular pattern
            height = 10 + Math.sin(i * 0.5) * 10;
        } else if (stress < 70) {
            // Medium stress - more variation
            height = 15 + Math.sin(i * 0.8) * 15 + (Math.random() * 10);
        } else {
            // High stress - jagged, irregular pattern
            height = 20 + Math.sin(i * 1.2) * 20 + (Math.random() * 20);
        }
        
        // Create bar
        const bar = document.createElement('div');
        bar.className = 'waveform-bar';
        bar.style.height = `${height}px`;
        
        // Add animation delay for wave effect
        bar.style.animationDelay = `${i * 0.05}s`;
        
        waveformPreview.appendChild(bar);
    }
}

function updateGlowCircle(stress) {
    const glowCircle = document.getElementById('glow-circle');
    if (!glowCircle) return;
    
    // Size based on stress (40-60px range)
    const size = 40 + (stress * 0.2);
    glowCircle.style.width = `${size}px`;
    glowCircle.style.height = `${size}px`;
    
    // Color based on stress level (green to blue to purple spectrum)
    const hue = Math.max(120, 280 - stress * 1.8);
    glowCircle.style.backgroundColor = `hsla(${hue}, 80%, 50%, 0.6)`;
    glowCircle.style.boxShadow = `0 0 ${15 + stress * 0.3}px hsla(${hue}, 80%, 50%, 0.4)`;
    
    // Pulse speed based on stress
    const pulseSpeed = 1.5 - (stress * 0.01);
    glowCircle.style.animationDuration = `${pulseSpeed}s`;
}

// STEP 2: Initialize chart interactions
// Enhanced chart interactions for tutorial
function initStep2Interactions() {
    console.log('Initializing step 2 interactions');
    
    const chartScrubber = document.getElementById('chart-scrubber');
    const chartLine = document.getElementById('chart-line');
    const indicator = document.getElementById('chart-indicator');
    const dataPoint = document.getElementById('chart-point');
    const tooltip = document.getElementById('chart-tooltip');
    const eventText = document.getElementById('chart-event');
    const chartArea = document.querySelector('.chart-area');
    
    if (!chartScrubber || !indicator || !dataPoint || !tooltip || !eventText || !chartArea) {
        console.error('Missing elements for step 2');
        return;
    }
    
    // Add audio context for continuous sound playback
    let chartAudioContext = null;
    let chartOscillator = null;
    let chartGain = null;
    let isChartSounding = false;
    
    function initChartAudio() {
        try {
            chartAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            chartGain = chartAudioContext.createGain();
            chartGain.gain.value = 0.2; // 20% volume
            chartGain.connect(chartAudioContext.destination);
        } catch (e) {
            console.error('Failed to initialize chart audio:', e);
        }
    }
    
    function startChartSound(heartRate) {
        if (!chartAudioContext) initChartAudio();
        if (!chartAudioContext) return;
        
        // Stop existing sound
        stopChartSound();
        
        try {
            // Create oscillator
            chartOscillator = chartAudioContext.createOscillator();
            
            // Map heart rate to frequency (60 BPM -> 200Hz, 120 BPM -> 800Hz)
            const frequency = 200 + ((heartRate - 60) / 60 * 600);
            chartOscillator.frequency.value = frequency;
            
            // Use sine wave for cleaner sound
            chartOscillator.type = 'sine';
            
            // Connect and start
            chartOscillator.connect(chartGain);
            chartOscillator.start();
            isChartSounding = true;
        } catch (e) {
            console.error('Error starting chart sound:', e);
        }
    }
    
    function stopChartSound() {
        if (chartOscillator) {
            try {
                chartOscillator.stop();
                chartOscillator.disconnect();
                chartOscillator = null;
                isChartSounding = false;
            } catch (e) {
                console.error('Error stopping chart sound:', e);
            }
        }
    }
    
    // Update chart on scrubber change
    chartScrubber.addEventListener('input', function() {
        updateChartPosition(parseInt(this.value));
    });
    
    // Update chart based on position value
    function updateChartPosition(x) {
        // Update indicator position
        indicator.setAttribute('x1', x);
        indicator.setAttribute('x2', x);
        
        // Calculate y position
        const y = calculateYPosition(x);
        
        // Update data point position
        dataPoint.setAttribute('cx', x);
        dataPoint.setAttribute('cy', y);
        
        // Calculate heart rate based on y-position
        const heartRate = 60 + ((200 - y) / 200 * 60);
        
        // Update tooltip
        tooltip.style.left = `${x / 6}%`;
        tooltip.style.top = `${y / 2}px`;
        tooltip.textContent = `HR: ${Math.round(heartRate)} BPM`;
        
        // Update event description based on position
        if (x < 120) {
            eventText.textContent = 'Beginning of exam period - slightly elevated stress';
        } else if (x < 240) {
            eventText.textContent = 'Approaching difficult question - stress increasing';
        } else if (x < 360) {
            eventText.textContent = 'Peak stress during challenging problem';
        } else if (x < 480) {
            eventText.textContent = 'Time warning announcement - stress rising again';
        } else {
            eventText.textContent = 'Completing final questions - moderate stress';
        }
        
        // Update sound if playing
        if (isChartSounding) {
            if (chartOscillator) {
                // Smoothly transition to new frequency
                const frequency = 200 + ((heartRate - 60) / 60 * 600);
                chartOscillator.frequency.setTargetAtTime(frequency, chartAudioContext.currentTime, 0.1);
            }
        }
    }
    
    // Add direct drag functionality to the chart
    let isDragging = false;
    
    chartArea.addEventListener('mousedown', function(e) {
        isDragging = true;
        const rect = this.getBoundingClientRect();
        const x = Math.max(0, Math.min(600, e.clientX - rect.left));
        
        // Start sound on drag
        const y = calculateYPosition(x);
        const heartRate = 60 + ((200 - y) / 200 * 60);
        startChartSound(heartRate);
        
        // Update position
        chartScrubber.value = x;
        updateChartPosition(x);
        
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const rect = chartArea.getBoundingClientRect();
        const x = Math.max(0, Math.min(600, e.clientX - rect.left));
        
        // Update position
        chartScrubber.value = x;
        updateChartPosition(x);
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            stopChartSound();
        }
    });
    
    // Add "Play Sound" button for the chart
    const chartControls = document.querySelector('.chart-controls');
    if (chartControls) {
        const soundButton = document.createElement('button');
        soundButton.id = 'chart-sound-btn';
        soundButton.className = 'play-sound-btn';
        soundButton.style.marginTop = '15px';
        soundButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
            </svg>
            Play Chart Sound
        `;
        
        let isPlayingChartSound = false;
        soundButton.addEventListener('click', function() {
            if (isPlayingChartSound) {
                stopChartSound();
                this.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    Play Chart Sound
                `;
                isPlayingChartSound = false;
            } else {
                // Get current position
                const x = parseInt(chartScrubber.value);
                const y = calculateYPosition(x);
                const heartRate = 60 + ((200 - y) / 200 * 60);
                
                startChartSound(heartRate);
                this.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                    Stop Sound
                `;
                isPlayingChartSound = true;
            }
        });
        
        chartControls.appendChild(soundButton);
    }
    
    // Touch support
    chartArea.addEventListener('touchstart', function(e) {
        const touch = e.touches[0];
        const rect = this.getBoundingClientRect();
        const x = Math.max(0, Math.min(600, touch.clientX - rect.left));
        
        // Start sound on touch
        const y = calculateYPosition(x);
        const heartRate = 60 + ((200 - y) / 200 * 60);
        startChartSound(heartRate);
        
        // Update position
        chartScrubber.value = x;
        updateChartPosition(x);
        
        isDragging = true;
        e.preventDefault();
    }, { passive: false });
    
    chartArea.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        const touch = e.touches[0];
        const rect = this.getBoundingClientRect();
        const x = Math.max(0, Math.min(600, touch.clientX - rect.left));
        
        // Update position
        chartScrubber.value = x;
        updateChartPosition(x);
        
        e.preventDefault();
    }, { passive: false });
    
    chartArea.addEventListener('touchend', function() {
        isDragging = false;
        stopChartSound();
    });
    
    // Fix for slider: make the slider thumb bigger for better usability
    const style = document.createElement('style');
    style.textContent = `
        #chart-scrubber::-webkit-slider-thumb {
            width: 24px;
            height: 24px;
        }
        #chart-scrubber::-moz-range-thumb {
            width: 24px;
            height: 24px;
        }
        .chart-area {
            cursor: pointer;
        }
        #chart-point {
            cursor: grab;
        }
    `;
    document.head.appendChild(style);
    
    // Add instructions
    const instructions = document.createElement('div');
    instructions.style.marginTop = '15px';
    instructions.style.padding = '10px';
    instructions.style.backgroundColor = '#1a1a1a';
    instructions.style.borderRadius = '6px';
    instructions.style.fontSize = '14px';
    instructions.style.color = '#b3b3b3';
    instructions.innerHTML = `
        <p><strong>Try it:</strong> Click and drag directly on the chart to hear the sound change with heart rate values. Just like you can in the full visualizer!</p>
    `;
    chartControls.appendChild(instructions);
    
    // Initialize with default value
    chartScrubber.dispatchEvent(new Event('input'));
}

// STEP 3: Initialize waveform interactions
function initStep3Interactions() {
    console.log('Initializing step 3 interactions');
    
    const waveformContainer = document.getElementById('interactive-waveform');
    const patternButtons = document.querySelectorAll('.pattern-btn');
    const playButton = document.getElementById('play-sound');
    const patternDescription = document.getElementById('pattern-description');
    
    if (!waveformContainer || !patternButtons.length || !playButton || !patternDescription) {
        console.error('Missing elements for step 3');
        return;
    }
    
    // Create initial waveform (default: calm)
    createWaveform('calm');
    
    // Handle pattern button clicks
    patternButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            patternButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Create selected waveform
            const pattern = this.getAttribute('data-pattern');
            createWaveform(pattern);
            
            // Update description
            updatePatternDescription(pattern);
            
            // Stop any playing sound
            if (isPlaying) {
                stopSound();
                playButton.textContent = 'Play Sound';
                playButton.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    Play Sound
                `;
            }
        });
    });
    
    // Handle play button
    playButton.addEventListener('click', function() {
        if (isPlaying) {
            stopSound();
            this.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                Play Sound
            `;
        } else {
            // Get active pattern
            const activeButton = document.querySelector('.pattern-btn.active');
            const pattern = activeButton ? activeButton.getAttribute('data-pattern') : 'calm';
            
            playPatternSound(pattern);
            this.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
                Stop Sound
            `;
        }
    });
}

function createWaveform(pattern) {
    const container = document.getElementById('interactive-waveform');
    if (!container) return;
    
    // Clear existing bars
    container.innerHTML = '';
    
    // Number of bars
    const numBars = 40;
    
    // Create bars with specific pattern
    for (let i = 0; i < numBars; i++) {
        const barContainer = document.createElement('div');
        barContainer.className = 'waveform-bar-container';
        
        // Create top bar
        const topBar = document.createElement('div');
        topBar.className = 'waveform-bar top-bar';
        
        // Create bottom bar (mirror of top)
        const bottomBar = document.createElement('div');
        bottomBar.className = 'waveform-bar bottom-bar';
        
        // Set height based on pattern
        let height;
        
        if (pattern === 'calm') {
            // Calm pattern - small, gentle waves
            height = 8 + (Math.sin(i * 0.3) * 10);
            topBar.style.backgroundColor = '#1db954'; // Green
            bottomBar.style.backgroundColor = '#1db954';
        } else if (pattern === 'focus') {
            // Focus pattern - medium, regular waves
            height = 15 + (Math.sin(i * 0.5) * 15);
            topBar.style.backgroundColor = '#33d8e3'; // Teal
            bottomBar.style.backgroundColor = '#33d8e3';
        } else if (pattern === 'stress') {
            // Stress pattern - tall, jagged waves
            height = 20 + (Math.sin(i * 0.8) * 15) + (Math.random() * 20);
            topBar.style.backgroundColor = '#4a90e2'; // Blue
            bottomBar.style.backgroundColor = '#4a90e2';
        }
        
        // Ensure minimum height
        height = Math.max(3, height);
        
        topBar.style.height = height + 'px';
        bottomBar.style.height = height + 'px';
        
        // Add animation delay for wave effect
        const animationDelay = (Math.abs(i - 20) * 0.03);
        topBar.style.animationDelay = animationDelay + 's';
        bottomBar.style.animationDelay = animationDelay + 's';
        
        barContainer.appendChild(topBar);
        barContainer.appendChild(bottomBar);
        container.appendChild(barContainer);
    }
}

function updatePatternDescription(pattern) {
    const description = document.getElementById('pattern-description');
    if (!description) return;
    
    if (pattern === 'calm') {
        description.textContent = 'Calm pattern: A gentle, rhythmic waveform with low amplitude. This represents a relaxed state with minimal stress.';
    } else if (pattern === 'focus') {
        description.textContent = 'Focus pattern: A moderate, regular waveform. This shows attentive concentration without excessive stress.';
    } else if (pattern === 'stress') {
        description.textContent = 'Stress pattern: A tall, jagged waveform with high variability. This indicates high stress or anxiety with irregular fluctuations.';
    }
}

function playPatternSound(pattern) {
    if (!audioContext) {
        initAudio();
    }
    
    if (!audioContext) return;
    
    try {
        // Stop previous sound
        if (oscillator) {
            oscillator.stop();
            oscillator.disconnect();
        }
        
        // Create new oscillator
        oscillator = audioContext.createOscillator();
        
        // Set type and frequency based on pattern
        if (pattern === 'calm') {
            oscillator.type = 'sine';
            oscillator.frequency.value = 220; // A3
        } else if (pattern === 'focus') {
            oscillator.type = 'triangle';
            oscillator.frequency.value = 330; // E4
        } else if (pattern === 'stress') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 392; // G4
        }
        
        // Connect and start
        oscillator.connect(gainNode);
        oscillator.start();
        isPlaying = true;
        
    } catch (e) {
        console.error('Error playing pattern sound:', e);
    }
}

function stopSound() {
    if (oscillator) {
        try {
            oscillator.stop();
            oscillator.disconnect();
            oscillator = null;
        } catch (e) {
            console.error('Error stopping sound:', e);
        }
    }
    isPlaying = false;
}

// STEP 4: Initialize pulse visualization interactions
function initStep4Interactions() {
    console.log('Initializing step 4 interactions');
    
    const heartRateSlider = document.getElementById('heart-rate');
    const hrDisplay = document.getElementById('hr-display');
    const pulseCircle = document.getElementById('demo-pulse-circle');
    const pulseRing = document.getElementById('demo-pulse-ring');
    const beatIndicator = document.getElementById('demo-beat-indicator');
    const pulseValue = document.getElementById('demo-pulse-value');
    const activityButtons = document.querySelectorAll('.activity-btn');
    
    if (!heartRateSlider || !hrDisplay || !pulseCircle || !pulseRing || !pulseValue) {
        console.error('Missing elements for step 4');
        return;
    }
    
    // Create frequency bars
    createFrequencyBars();
    
    // Start animation for frequency bars
    animateFrequencyBars();
    
    // Update on slider change
    heartRateSlider.addEventListener('input', function() {
        const heartRate = parseInt(this.value);
        
        // Update display
        hrDisplay.textContent = heartRate;
        pulseValue.textContent = heartRate;
        
        // Update visualization
        updatePulseVisualization(heartRate);
        
        // Update active button
        activityButtons.forEach(button => {
            const btnHr = parseInt(button.getAttribute('data-hr'));
            button.classList.toggle('active', Math.abs(heartRate - btnHr) < 5);
        });
    });
    
    // Handle activity button clicks
    activityButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            activityButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Get heart rate and update slider
            const hr = parseInt(this.getAttribute('data-hr'));
            heartRateSlider.value = hr;
            
            // Trigger update
            heartRateSlider.dispatchEvent(new Event('input'));
        });
    });
    
    // Initialize with default value
    heartRateSlider.dispatchEvent(new Event('input'));
}

function createFrequencyBars() {
    const container = document.getElementById('frequency-bars');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create 30 bars arranged in a circle
    for (let i = 0; i < 30; i++) {
        const bar = document.createElement('div');
        bar.className = 'frequency-bar';
        
        // Calculate angle for positioning
        const angle = (i / 30) * 360;
        bar.style.transform = `rotate(${angle}deg)`;
        
        // Create inner bar that will animate
        const innerBar = document.createElement('div');
        innerBar.className = 'frequency-bar-inner';
        
        bar.appendChild(innerBar);
        container.appendChild(bar);
    }
}

function animateFrequencyBars() {
    // Store heart rate value for animation
    let activeHR = 70;
    
    function updateHR() {
        const hrDisplay = document.getElementById('hr-display');
        if (hrDisplay) {
            activeHR = parseInt(hrDisplay.textContent) || 70;
        }
    }
    
    function animate() {
        updateHR();
        updateFrequencyBars(activeHR);
        requestAnimationFrame(animate);
    }
    
    animate();
}

function updateFrequencyBars(heartRate) {
    const bars = document.querySelectorAll('.frequency-bar-inner');
    if (!bars.length) return;
    
    // Calculate base height and variability based on heart rate
    const baseHeight = 20 + ((heartRate - 60) / 120 * 30);
    const variability = heartRate / 60; // Higher heart rate = more variability
    
    bars.forEach((bar, index) => {
        // Create a pattern of heights based on angle and heart rate
        const angleEffect = Math.sin((index / bars.length) * Math.PI * 2 * 3) * variability;
        const pulseEffect = Math.sin(Date.now() / (1000 / (heartRate / 60)) + index) * variability;
        
        const height = baseHeight + (angleEffect * 5) + (pulseEffect * 10);
        bar.style.height = Math.max(5, height) + 'px';
        
        // Color changes with heart rate
        const hue = Math.max(180, 240 - ((heartRate - 60) / 120 * 60));
        bar.style.backgroundColor = `hsla(${hue}, 80%, 50%, 0.7)`;
    });
}

function updatePulseVisualization(heartRate) {
    const pulseCircle = document.getElementById('demo-pulse-circle');
    const pulseRing = document.getElementById('demo-pulse-ring');
    const beatIndicator = document.getElementById('demo-beat-indicator');
    
    if (!pulseCircle || !pulseRing) return;
    
    // Calculate animation speed based on heart rate
    // Heart rate in BPM divided by 60 gives beats per second
    const animationDuration = 60 / heartRate;
    
    // Update pulse circle
    pulseCircle.style.animationDuration = animationDuration + 's';
    
    // Size and color based on heart rate
    // Scale size: 60 BPM = 50px, 180 BPM = 80px
    const circleSize = 50 + ((heartRate - 60) / 120 * 30);
    pulseCircle.style.width = circleSize + 'px';
    pulseCircle.style.height = circleSize + 'px';
    
    // Color changes from green to blue to purple as rate increases
    const hue = Math.max(180, 240 - ((heartRate - 60) / 120 * 60));
    pulseCircle.style.backgroundColor = `hsla(${hue}, 80%, 50%, 0.5)`;
    pulseCircle.style.boxShadow = `0 0 30px hsla(${hue}, 80%, 50%, 0.5)`;
    
    // Update ring animation
    pulseRing.style.animationDuration = (animationDuration * 1.5) + 's';
    
    // Update beat indicator
    if (beatIndicator) {
        // Beat indicator fades in and out with the heart rate
        // Start a pulsing animation
        createPulseAnimation(beatIndicator, heartRate);
    }
}

function createPulseAnimation(indicator, heartRate) {
    // Clear any existing animation
    indicator.style.animation = 'none';
    
    // Set animation parameters based on heart rate
    const duration = 60 / heartRate; // seconds per beat
    
    // Create keyframe animation
    indicator.style.animation = `pulse-beat ${duration}s infinite`;
    
    // Create a custom animation
    const keyframes = `
    @keyframes pulse-beat {
        0% { transform: scale(0.8); opacity: 0.2; }
        15% { transform: scale(1.2); opacity: 1; }
        30% { transform: scale(1); opacity: 0.7; }
        100% { transform: scale(0.8); opacity: 0.2; }
    }`;
    
    // Add the keyframes to the document if not already present
    if (!document.getElementById('pulse-beat-keyframes')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'pulse-beat-keyframes';
        styleSheet.textContent = keyframes;
        document.head.appendChild(styleSheet);
    }
}

// STEP 5: Initialize player controls interactions
function initStep5Interactions() {
    console.log('Initializing step 5 interactions');
    
    const playButton = document.getElementById('demo-play-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const timelineHandle = document.getElementById('demo-timeline-handle');
    const timelineProgress = document.getElementById('demo-timeline-progress');
    const currentTime = document.getElementById('current-time');
    const totalTime = document.getElementById('total-time');
    const volumeSlider = document.getElementById('volume');
    const speedSlider = document.getElementById('playback-speed');
    const speedValue = document.getElementById('speed-value');
    const soundType = document.getElementById('sound-type');
    
    if (!playButton || !timelineHandle || !timelineProgress) {
        console.error('Missing elements for step 5');
        return;
    }
    
    // Variables for player demo
    let isPlaying = false;
    let playbackInterval = null;
    let currentPosition = 10; // Start position (%)
    let playbackSpeed = 1.0;
    
    // Initialize position
    updatePlayerPosition();
    
    // Play/pause button
    playButton.addEventListener('click', function() {
        isPlaying = !isPlaying;
        
        // Update icons
        playIcon.classList.toggle('hidden', isPlaying);
        pauseIcon.classList.toggle('hidden', !isPlaying);
        
        if (isPlaying) {
            // Start playback animation
            playbackInterval = setInterval(() => {
                currentPosition += 0.5 * playbackSpeed;
                
                if (currentPosition >= 100) {
                    currentPosition = 100;
                    clearInterval(playbackInterval);
                    isPlaying = false;
                    playIcon.classList.remove('hidden');
                    pauseIcon.classList.add('hidden');
                }
                
                updatePlayerPosition();
            }, 100);
        } else {
            // Stop playback animation
            clearInterval(playbackInterval);
        }
    });
    
    // Playback speed slider
    if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', function() {
            playbackSpeed = parseFloat(this.value);
            speedValue.textContent = playbackSpeed.toFixed(1) + 'x';
        });
    }
    
    // Volume slider
    if (volumeSlider && gainNode) {
        volumeSlider.addEventListener('input', function() {
            const volume = this.value / 100;
            if (gainNode) {
                gainNode.gain.value = volume;
            }
        });
    }
    
    // Sound type selector
    if (soundType && oscillator) {
        soundType.addEventListener('change', function() {
            if (oscillator) {
                oscillator.type = this.value;
            }
        });
    }
    
    // Timeline click handler
    const timelineTrack = document.querySelector('.timeline-track');
    if (timelineTrack) {
        timelineTrack.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const clickPosition = (e.clientX - rect.left) / rect.width;
            
            currentPosition = clickPosition * 100;
            updatePlayerPosition();
        });
    }
    
    // Drag functionality for handle
    if (timelineHandle) {
        let isDragging = false;
        
        timelineHandle.addEventListener('mousedown', function(e) {
            isDragging = true;
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            const track = document.querySelector('.timeline-track');
            if (!track) return;
            
            const rect = track.getBoundingClientRect();
            let newX = (e.clientX - rect.left) / rect.width;
            newX = Math.max(0, Math.min(1, newX));
            
            currentPosition = newX * 100;
            updatePlayerPosition();
        });
        
        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
    }
    
    function updatePlayerPosition() {
        // Update handle position
        if (timelineHandle) {
            timelineHandle.style.left = `${currentPosition}%`;
        }
        
        // Update progress bar
        if (timelineProgress) {
            timelineProgress.style.width = `${currentPosition}%`;
        }
        
        // Update time display
        if (currentTime) {
            const seconds = Math.floor((currentPosition / 100) * 150); // Total 2:30 = 150 seconds
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            currentTime.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }
}

// Initialize scrollama for scroll-based interactions
function initScrollama() {
    const scroller = scrollama();
    
    // Set up the steps
    scroller
        .setup({
            step: '.tutorial-step',
            offset: 0.5,
            debug: false
        })
        .onStepEnter(response => {
            // Update current step
            const currentStep = response.element.dataset.step;
            
            // Update active state in progress indicator
            document.querySelectorAll('.progress-step').forEach(step => {
                step.classList.toggle('active', parseInt(step.dataset.step) <= currentStep);
            });
            
            // Update progress bar
            const progressPercentage = (currentStep - 1) / 5 * 100;
            document.getElementById('progress-bar').style.width = `${progressPercentage}%`;
            
            // Hide scroll prompt after first step
            if (currentStep > 1) {
                document.querySelector('.scroll-prompt').classList.add('hidden');
            }
            
            // Initialize specific step interactions
            if (response.index === 0 && !window.step1Initialized) {
                initStep1Interactions();
                window.step1Initialized = true;
            }
            else if (response.index === 1 && !window.step2Initialized) {
                initStep2Interactions();
                window.step2Initialized = true;
            }
            else if (response.index === 2 && !window.step3Initialized) {
                initStep3Interactions();
                window.step3Initialized = true;
            }
            else if (response.index === 3 && !window.step4Initialized) {
                initStep4Interactions();
                window.step4Initialized = true;
            }
            else if (response.index === 4 && !window.step5Initialized) {
                initStep5Interactions();
                window.step5Initialized = true;
            }
        });
}



// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Tutorial page loaded');
    
    // Initialize scrollama
    initScrollama();
    
    // Initialize first interactive elements
    initStep1Interactions();

        // Make first step visible immediately
    const firstStep = document.querySelector('.tutorial-step[data-step="1"]');
    if (firstStep) {
        firstStep.classList.add('active');
    }
    
    // Automatically trigger the first animation
    const stressSlider = document.getElementById('stress-level');
    if (stressSlider) {
        stressSlider.dispatchEvent(new Event('input'));
    }

    
    // Add click events to the tutorial banner in albums.html
    const tutorialBanner = document.getElementById('tutorial-banner');
    if (tutorialBanner) {
        // Mark as seen when clicking the Start Tour button
        const startTourBtn = tutorialBanner.querySelector('.tutorial-btn');
        if (startTourBtn) {
            startTourBtn.addEventListener('click', function() {
                localStorage.setItem('hasSeenTutorial', 'true');
            });
        }
    }
});

// Add this code to albums.html to hide the banner for returning users
function initTutorialBanner() {
    const tutorialBanner = document.getElementById('tutorial-banner');
    if (!tutorialBanner) return;
    
    // Check if user has seen tutorial
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    
    // Hide banner if user has seen tutorial
    if (hasSeenTutorial) {
        tutorialBanner.style.display = 'none';
    }
}

// Run the banner initializer if we're on the albums page
if (document.querySelector('.album-selection')) {
    document.addEventListener('DOMContentLoaded', initTutorialBanner);
}