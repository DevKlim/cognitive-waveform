/**
 * playback-controls.js
 * Updated with standardized playback duration and percentage-based skipping
 */

// Standard playback duration in seconds
const STANDARD_PLAYBACK_DURATION = 20; // seconds

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
        
        // Calculate step size based on standardized playback duration
        const totalDataDuration = maxTime; // Total duration in data units
        const baseStepSize = totalDataDuration / (STANDARD_PLAYBACK_DURATION * 20); // 20 updates per second
        
        // Start playback
        app.playbackInterval = setInterval(() => {
            const maxTime = app.data.filtered.length > 0 ?
                app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0 : 0;
            
            if (app.currentTime >= maxTime) {
                stopPlayback();
            } else {
                // Apply the user-controlled playback speed
                const stepSize = baseStepSize * app.playbackSpeed;
                setCurrentTime(app.currentTime + stepSize);
                
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
 * Skip forward/back by percentage
 * @param {number} percentageSkip - Percentage of the total duration to skip (positive or negative)
 */
function skipByPercentage(percentageSkip) {
    const maxTime = app.data.filtered.length > 0 ?
        app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0 : 0;
    
    // Calculate skip amount in time units (5% of total duration)
    const skipAmount = (maxTime * (percentageSkip / 100));
    
    // Calculate new time and ensure it's within bounds
    const newTime = Math.max(0, Math.min(maxTime, app.currentTime + skipAmount));
    
    // Set current time to the new position
    setCurrentTime(newTime);
}

/**
 * Skip forward/back
 * @param {number} seconds - Time to skip (positive or negative)
 * @deprecated Use skipByPercentage instead
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

/**
 * Enhanced Skip Buttons with Hold Feature
 * This adds press-and-hold functionality to fast forward and rewind buttons
 */

/**
 * Initialize the hold-to-skip functionality
 */
function initButtonHoldFeature() {
    // Define the buttons
    const skipForwardBtn = document.getElementById('skip-forward-btn');
    const skipBackBtn = document.getElementById('skip-back-btn');
    
    if (!skipForwardBtn || !skipBackBtn) return;
    
    // Variables to track button press state
    let forwardInterval = null;
    let backwardInterval = null;
    let wasPlaying = false;
    let skipSpeed = 5; // Initial skip speed multiplier
    let holdStartTime = 0;
    const holdThreshold = 500; // ms before we consider it a "hold"
    
    // Forward button press and hold
    skipForwardBtn.addEventListener('mousedown', function(e) {
      // Remember if we were playing
      wasPlaying = app.isPlaying;
      holdStartTime = Date.now();
      
      // Initial skip forward
      skipByPercentage(5);
      
      // Set up interval for continuous skipping
      forwardInterval = setTimeout(function() {
        // When we've held past the threshold, pause playback
        if (wasPlaying) stopPlayback();
        
        // Now start the continuous skipping
        forwardInterval = setInterval(function() {
          // Increase skip speed over time (max 10x)
          skipSpeed = Math.min(10, 1 + (Date.now() - holdStartTime) / 1000);
          
          // Skip with increasing speed
          skipByPercentage(1000 * skipSpeed);
          
          // Update visualization without playing
          updateWaveform();
          updateCircularWave();
        }, 50);
      }, holdThreshold);
    });
    
    // Forward button release
    skipForwardBtn.addEventListener('mouseup', function(e) {
      // Clear the interval
      clearTimeout(forwardInterval);
      clearInterval(forwardInterval);
      forwardInterval = null;
      
      // Resume playback if we were playing before
      if (wasPlaying && !app.isPlaying && (Date.now() - holdStartTime) >= holdThreshold) {
        togglePlayback();
      }
      
      // Reset skip speed
      skipSpeed = 1;
    });
    
    // Forward button mouse leave
    skipForwardBtn.addEventListener('mouseleave', function(e) {
      // Only handle if the button is being held down
      if (forwardInterval) {
        // Clear the interval
        clearTimeout(forwardInterval);
        clearInterval(forwardInterval);
        forwardInterval = null;
        
        // Resume playback if we were playing before
        if (wasPlaying && !app.isPlaying && (Date.now() - holdStartTime) >= holdThreshold) {
          togglePlayback();
        }
        
        // Reset skip speed
        skipSpeed = 1;
      }
    });
    
    // Backward button press and hold
    skipBackBtn.addEventListener('mousedown', function(e) {
      // Remember if we were playing
      wasPlaying = app.isPlaying;
      holdStartTime = Date.now();
      
      // Initial skip backward
      skipByPercentage(-5);
      
      // Set up interval for continuous skipping
      backwardInterval = setTimeout(function() {
        // When we've held past the threshold, pause playback
        if (wasPlaying) stopPlayback();
        
        // Now start the continuous skipping
        backwardInterval = setInterval(function() {
          // Increase skip speed over time (max 10x)
          skipSpeed = Math.min(10, 1 + (Date.now() - holdStartTime) / 1000);
          
          // Skip with increasing speed
          skipByPercentage(-5 * skipSpeed);
          
          // Update visualization without playing
          updateWaveform();
          updateCircularWave();
        }, 50);
      }, holdThreshold);
    });
    
    // Backward button release
    skipBackBtn.addEventListener('mouseup', function(e) {
      // Clear the interval
      clearTimeout(backwardInterval);
      clearInterval(backwardInterval);
      backwardInterval = null;
      
      // Resume playback if we were playing before
      if (wasPlaying && !app.isPlaying && (Date.now() - holdStartTime) >= holdThreshold) {
        togglePlayback();
      }
      
      // Reset skip speed
      skipSpeed = 1;
    });
    
    // Backward button mouse leave
    skipBackBtn.addEventListener('mouseleave', function(e) {
      // Only handle if the button is being held down
      if (backwardInterval) {
        // Clear the interval
        clearTimeout(backwardInterval);
        clearInterval(backwardInterval);
        backwardInterval = null;
        
        // Resume playback if we were playing before
        if (wasPlaying && !app.isPlaying && (Date.now() - holdStartTime) >= holdThreshold) {
          togglePlayback();
        }
        
        // Reset skip speed
        skipSpeed = 1;
      }
    });
    
    // Add touch support
    // Forward button touch events
    skipForwardBtn.addEventListener('touchstart', function(e) {
      e.preventDefault(); // Prevent scrolling
      wasPlaying = app.isPlaying;
      holdStartTime = Date.now();
      
      skipByPercentage(5);
      
      forwardInterval = setTimeout(function() {
        if (wasPlaying) stopPlayback();
        
        forwardInterval = setInterval(function() {
          skipSpeed = Math.min(10, 1 + (Date.now() - holdStartTime) / 1000);
          skipByPercentage(1 * skipSpeed);
          updateWaveform();
          updateCircularWave();
        }, 50);
      }, holdThreshold);
    });
    
    skipForwardBtn.addEventListener('touchend', function(e) {
      e.preventDefault();
      clearTimeout(forwardInterval);
      clearInterval(forwardInterval);
      forwardInterval = null;
      
      if (wasPlaying && !app.isPlaying && (Date.now() - holdStartTime) >= holdThreshold) {
        togglePlayback();
      }
      
      skipSpeed = 1;
    });
    
    // Backward button touch events
    skipBackBtn.addEventListener('touchstart', function(e) {
      e.preventDefault(); // Prevent scrolling
      wasPlaying = app.isPlaying;
      holdStartTime = Date.now();
      
      skipByPercentage(-5);
      
      backwardInterval = setTimeout(function() {
        if (wasPlaying) stopPlayback();
        
        backwardInterval = setInterval(function() {
          skipSpeed = Math.min(10, 1 + (Date.now() - holdStartTime) / 1000);
          skipByPercentage(-1 * skipSpeed);
          updateWaveform();
          updateCircularWave();
        }, 50);
      }, holdThreshold);
    });
    
    skipBackBtn.addEventListener('touchend', function(e) {
      e.preventDefault();
      clearTimeout(backwardInterval);
      clearInterval(backwardInterval);
      backwardInterval = null;
      
      if (wasPlaying && !app.isPlaying && (Date.now() - holdStartTime) >= holdThreshold) {
        togglePlayback();
      }
      
      skipSpeed = 1;
    });
    
    console.log('Button hold-to-skip functionality initialized');
  }
  
  // Initialize the feature when the DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // We'll use a short delay to ensure other components are ready
    setTimeout(initButtonHoldFeature, 1000);
  });