/**
 * audio-processor.js
 * Handles audio context, sonification, and audio analysis
 */

/**
 * Initialize audio context
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
    
    if (!audioContext) return; // Exit if audio context creation failed
    
    try {
        // Create oscillator if not exists
        if (!oscillator) {
            oscillator = audioContext.createOscillator();
            oscillator.type = 'triangle'; // sine, square, sawtooth, triangle
            oscillator.connect(gainNode);
            oscillator.start();
            console.log('Sonification started');
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
 * Update sonification based on current value and update audio data for visualizations
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
        
        // Map to frequency range
        const minFrequency = 100;
        const maxFrequency = 1500;
        
        // Normalize the value
        const normalizedValue = (currentValue - minValue) / (maxValue - minValue || 1);
        
        // Calculate frequency
        const frequency = minFrequency + normalizedValue * (maxFrequency - minFrequency);
        
        // Update oscillator frequency with smoothing
        oscillator.frequency.setTargetAtTime(frequency, audioContext.currentTime, 0.1);
        
        // Get audio data for visualizations
        if (analyser) {
            analyser.getByteFrequencyData(audioDataArray);
            
            // Update visualizations that react to audio
            updateCircularWave();
        }
    } catch (e) {
        console.error('Error updating sonification:', e);
    }
}