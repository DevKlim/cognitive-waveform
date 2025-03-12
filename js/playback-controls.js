/**
 * playback-controls.js
 * Handles playback controls and timeline interaction
 */

/**
 * Toggle play/pause
 */
function togglePlayback() {
    app.isPlaying = !app.isPlaying;
    
    // Update button UI
    document.getElementById('play-icon').classList.toggle('hidden', app.isPlaying);
    document.getElementById('pause-icon').classList.toggle('hidden', !app.isPlaying);
    
    if (app.isPlaying) {
        // Start sonification
        startSonification();
        
        // Reset if at the end
        const maxTime = app.data.filtered.length > 0 ?
            app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0 : 0;
        if (app.currentTime >= maxTime) {
            setCurrentTime(0);
        }
        
        // Start playback
        app.playbackInterval = setInterval(() => {
            const maxTime = app.data.filtered.length > 0 ?
                app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0 : 0;
            if (app.currentTime >= maxTime) {
                stopPlayback();
            } else {
                // Determine playback speed based on data density
                const timeStep = app.data.filtered.length > 1 
                    ? (app.data.filtered[1].timestamp - app.data.filtered[0].timestamp) 
                    : 5;
                
                // Apply the user-controlled playback speed
                setCurrentTime(app.currentTime + (timeStep * app.playbackSpeed));
                
                // Update sound and audio-reactive visualizations
                updateSonification();
            }
        }, 50); // Update every 50ms
    } else {
        stopPlayback();
    }
}

/**
 * Stop playback
 */
function stopPlayback() {
    clearInterval(app.playbackInterval);
    app.isPlaying = false;
    document.getElementById('play-icon').classList.remove('hidden');
    document.getElementById('pause-icon').classList.add('hidden');
    
    // Stop sonification
    stopSonification();
}

/**
 * Skip forward/back
 */
function skipTime(seconds) {
    const maxTime = app.data.filtered.length > 0 ?
        app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0 : 0;
    const newTime = Math.max(0, Math.min(maxTime, app.currentTime + seconds));
    setCurrentTime(newTime);
}

/**
 * Set the current time and update all visualizations
 */
function setCurrentTime(time) {
    app.currentTime = time;
    
    // Update time display
    updateTimeDisplay();
    
    // Update visualizations
    updateWaveform();
    updateCircularWave();
    
    // Update position line in chart
    if (app.chart.svg && app.chart.xScale) {
        const x = app.chart.xScale(time);
        d3.select('#current-time-line')
            .attr('x1', x)
            .attr('x2', x);
    }
    
    // Update timeline handle
    updateHandlePosition();
}

/**
 * Update time display and progress bar
 */
function updateTimeDisplay() {
    const currentTime = app.currentTime;
    const maxTime = app.data.filtered.length > 0 ? 
        app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0 : 0;

    document.getElementById('current-time').textContent = formatTime(currentTime);
    document.getElementById('total-time').textContent = formatTime(maxTime);

    const progress = (maxTime > 0) ? (currentTime / maxTime) * 100 : 0;
    document.getElementById('timeline-progress').style.width = `${progress}%`;
}

/**
 * Initialize timeline functionality
 */
function initializeTimeline() {
    addTimelineHandle();
    setupTimelineClick();
}

/**
 * Add timeline handle element
 */
function addTimelineHandle() {
    const timeline = document.getElementById('timeline');
    
    if (timeline && !document.querySelector('.timeline-handle')) {
        const handle = document.createElement('div');
        handle.className = 'timeline-handle';
        timeline.appendChild(handle);
        
        setupTimelineDrag(handle, timeline);
    }
}

/**
 * Set up timeline drag functionality
 */
function setupTimelineDrag(handle, timeline) {
    let isDragging = false;
    
    // Mouse down - start dragging
    const startDrag = (e) => {
        isDragging = true;
        handle.classList.add('active');
        
        // Remember playback state
        app.wasPlayingBeforeDrag = app.isPlaying;
        
        // Pause while dragging
        if (app.isPlaying) {
            stopPlayback();
        }
        
        e.preventDefault();
    };
    
    // Mouse move - update position
    const updateDrag = (e) => {
        if (!isDragging) return;
        
        // Get position
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        
        // Calculate position
        const rect = timeline.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(rect.width, x));
        
        // Update UI
        const percentage = x / rect.width * 100;
        handle.style.left = `${percentage}%`;
        document.getElementById('timeline-progress').style.width = `${percentage}%`;
        
        // Update time
        const maxTime = app.data.filtered.length > 0 ? 
            app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0 : 0;
        const newTime = (percentage / 100) * maxTime;
        
        // Update time display
        app.currentTime = newTime;
        document.getElementById('current-time').textContent = formatTime(newTime);
        
        // Update chart position line
        if (app.chart.xScale) {
            const chartX = app.chart.xScale(newTime);
            d3.select('#current-time-line')
                .attr('x1', chartX)
                .attr('x2', chartX);
        }
        
        // Prevent scrolling on touch
        if (e.type.includes('touch')) {
            e.preventDefault();
        }
    };
    
    // Mouse up - stop dragging
    const endDrag = () => {
        if (!isDragging) return;
        
        isDragging = false;
        handle.classList.remove('active');
        
        // Get final position
        const maxTime = app.data.filtered.length > 0 ? 
            app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0 : 0;
        const percentage = parseFloat(handle.style.left) / 100;
        const newTime = percentage * maxTime;
        
        // Update everything
        setCurrentTime(newTime);
        
        // Resume playback if needed
        if (app.wasPlayingBeforeDrag) {
            togglePlayback();
        }
    };
    
    // Add event listeners
    handle.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', updateDrag);
    document.addEventListener('mouseup', endDrag);
    
    // Touch events
    handle.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', updateDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
    
    // Initial position
    updateHandlePosition();
}

/**
 * Update handle position based on current time
 */
function updateHandlePosition() {
    const handle = document.querySelector('.timeline-handle');
    if (!handle) return;
    
    const maxTime = app.data.filtered.length > 0 ? 
        app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0 : 0;
    
    if (maxTime > 0) {
        const percentage = (app.currentTime / maxTime) * 100;
        handle.style.left = `${percentage}%`;
    } else {
        handle.style.left = '0%';
    }
}

/**
 * Set up timeline click functionality
 */
function setupTimelineClick() {
    const timeline = document.getElementById('timeline');
    if (!timeline) return;
    
    timeline.addEventListener('click', function(e) {
        // Ignore clicks on the handle
        if (e.target.classList.contains('timeline-handle')) return;
        
        // Calculate position
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / rect.width;
        
        // Calculate time
        const maxTime = app.data.filtered.length > 0 ? 
            app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0 : 0;
        
        // Set time
        setCurrentTime(ratio * maxTime);
    });
}