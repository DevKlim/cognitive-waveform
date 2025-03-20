/**
 * tutorial.js
 * Interactive tutorial functionality for Cognify
 */

// Store global state for audio and visualizations
const tutorialState = {
    // Audio context and nodes
    audioContext: null,
    gainNode: null,
    oscillator: null,
    isPlaying: false,
    currentWaveType: 'sine',
    
    // Chart data
    chartData: null,
    heartRateBaseline: 70,
    
    // Player demo
    playerInterval: null,
    playerPosition: 0,
    playerIsPlaying: false,
    
    // Waveform editor
    isDrawing: false,
    drawPath: [],
    customWaveBuffer: null
  };
  
  /**
   * Initialize all tutorial sections when the page loads
   */
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Tutorial page loaded');
    
    // Initialize scrollama
    initScrollama();
    
    // Pre-initialize first section
    initStep1();
    
    // Make first step visible immediately
    const firstStep = document.querySelector('.tutorial-step[data-step="1"]');
    if (firstStep) {
      firstStep.classList.add('active');
    }
    
    // Set up finish button action
    const finishButton = document.getElementById('finish-tutorial');
    if (finishButton) {
      finishButton.addEventListener('click', function() {
        window.location.href = 'albums.html';
      });
    }
});
    
  /**
   * Create the dataset chart
   * @param {HTMLElement} container - Container element for the chart
   * @param {Object} data - Dataset containing subject data
   * @param {string} subject - Current subject to display
   * @param {string} metric - Current metric to display
   */
  function createDatasetChart(container, data, subject, metric) {
    if (!d3 || !container || !data) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Get subject data
    const subjectData = data[subject] || [];
    
    // Set dimensions
    const width = container.clientWidth;
    const height = container.clientHeight || 250;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, 120]) // 0-120 seconds
      .range([margin.left, width - margin.right]);
    
    // Get min/max values for the metric
    const allValues = [].concat(...Object.values(data).map(points => 
      points.map(p => p[metric])
    )).filter(v => v !== undefined);
    
    const yMin = Math.floor(d3.min(allValues) * 0.95);
    const yMax = Math.ceil(d3.max(allValues) * 1.05);
    
    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([height - margin.bottom, margin.top]);
    
    // Create line generator
    const line = d3.line()
      .x(d => xScale(d.time))
      .y(d => yScale(d[metric]))
      .curve(d3.curveMonotoneX);
    
    // Add the line path
    svg.append('path')
      .datum(subjectData)
      .attr('fill', 'none')
      .attr('stroke', getSubjectColor(subject))
      .attr('stroke-width', 2)
      .attr('d', line);
    
    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);
    
    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .attr('color', '#666')
      .selectAll('text')
      .attr('fill', '#999');
    
    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxis)
      .attr('color', '#666')
      .selectAll('text')
      .attr('fill', '#999');
    
    // Add axes labels
    svg.append('text')
      .attr('class', 'axis-label x-axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height - 5)
      .text('Time (seconds)')
      .attr('fill', '#999')
      .attr('font-size', '12px');
    
    svg.append('text')
      .attr('class', 'axis-label y-axis-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 15)
      .text(getMetricDisplayName(metric))
      .attr('fill', '#999')
      .attr('font-size', '12px');
    
    // Add position line for interactive exploration
    svg.append('line')
      .attr('id', 'chart-position-line')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('x1', margin.left)
      .attr('x2', margin.left);
      
    // Add annotation lines
    const annotations = [
      { time: 10, label: 'Start of Test' },
      { time: 60, label: 'Difficult Question' },
      { time: 100, label: 'Time Warning' }
    ];
    
    // Add vertical lines for annotations
    annotations.forEach(anno => {
      const x = xScale(anno.time);
      
      svg.append('line')
        .attr('stroke', 'rgba(255, 255, 255, 0.2)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom)
        .attr('x1', x)
        .attr('x2', x);
    });
  }
  
  /**
   * Update the dataset chart for a different subject
   */
  function updateDatasetChart(subject) {
    const chartContainer = document.getElementById('dataset-chart');
    const metricSelect = document.getElementById('metric-select');
    
    if (!chartContainer || !tutorialState.chartData) return;
    
    const metric = metricSelect ? metricSelect.value : 'hr';
    
    // Recreate chart
    createDatasetChart(chartContainer, tutorialState.chartData, subject, metric);
  }
  
  /**
   * Update the chart metric
   */
  function updateChartMetric(metric) {
    const chartContainer = document.getElementById('dataset-chart');
    const subjectSelect = document.getElementById('subject-select');
    
    if (!chartContainer || !tutorialState.chartData) return;
    
    const subject = subjectSelect ? subjectSelect.value : 'average';
    
    // Recreate chart
    createDatasetChart(chartContainer, tutorialState.chartData, subject, metric);
  }
  
  /**
   * Generate a realistic exam dataset for the tutorial
   */
  function generateExamDataset() {
    // Create a dataset with multiple subjects
    const dataset = {
      average: [],
      subject1: [],
      subject2: [],
      subject3: []
    };
    
    // Generate time points (0-120 seconds in 1-second intervals)
    for (let time = 0; time <= 120; time++) {
      // Subject 1 - Steady, low stress
      dataset.subject1.push({
        time: time,
        hr: 70 + (Math.sin(time * 0.1) * 5) + (Math.random() * 3),
        gsr: 5 + (Math.sin(time * 0.05) * 1) + (Math.random() * 0.5),
        temp: 36.5 + (Math.sin(time * 0.02) * 0.2) + (Math.random() * 0.1)
      });
      
      // Subject 2 - Moderate stress with peaks
      let subject2HR = 75 + (Math.sin(time * 0.1) * 8);
      
      // Add specific stress peaks
      if (time > 55 && time < 70) {
        subject2HR += (time - 55) * 0.8; // Gradual increase
      } else if (time > 70 && time < 85) {
        subject2HR += (85 - time) * 0.8; // Gradual decrease
      }
      
      // Final time warning spike
      if (time > 95 && time < 105) {
        subject2HR += 15;
      }
      
      dataset.subject2.push({
        time: time,
        hr: subject2HR + (Math.random() * 3),
        gsr: 6 + (Math.sin(time * 0.08) * 2) + (Math.random() * 0.8),
        temp: 36.7 + (Math.sin(time * 0.03) * 0.3) + (Math.random() * 0.1)
      });
      
      // Subject 3 - High stress with dramatic peaks
      let subject3HR = 85 + (Math.sin(time * 0.2) * 10);
      
      // Add specific stress peaks (more dramatic)
      if (time > 20 && time < 30) {
        subject3HR += 20; // Initial stress spike
      }
      
      if (time > 60 && time < 75) {
        subject3HR += 25; // Major stress peak during difficult question
      }
      
      if (time > 95 && time < 110) {
        subject3HR += 30; // Severe stress when time is running out
      }
      
      dataset.subject3.push({
        time: time,
        hr: subject3HR + (Math.random() * 5),
        gsr: 8 + (Math.sin(time * 0.1) * 3) + (Math.random() * 1.5),
        temp: 37.1 + (Math.sin(time * 0.05) * 0.4) + (Math.random() * 0.2)
      });
    }
    
    // Generate average data from the 3 subjects
    for (let time = 0; time <= 120; time++) {
      const s1 = dataset.subject1.find(d => d.time === time);
      const s2 = dataset.subject2.find(d => d.time === time);
      const s3 = dataset.subject3.find(d => d.time === time);
      
      if (s1 && s2 && s3) {
        dataset.average.push({
          time: time,
          hr: (s1.hr + s2.hr + s3.hr) / 3,
          gsr: (s1.gsr + s2.gsr + s3.gsr) / 3,
          temp: (s1.temp + s2.temp + s3.temp) / 3
        });
      }
    }
    
    return dataset;
  }
  
  /**
   * Find the closest data point to a given time value
   */
  function findClosestDataPoint(data, timeValue) {
    if (!data || data.length === 0) return null;
    
    let closest = data[0];
    let minDist = Math.abs(data[0].time - timeValue);
    
    for (let i = 1; i < data.length; i++) {
      const dist = Math.abs(data[i].time - timeValue);
      if (dist < minDist) {
        minDist = dist;
        closest = data[i];
      }
    }
    
    return closest;
  }
  
  /**
   * Get display name for a metric
   */
  function getMetricDisplayName(metric) {
    const names = {
      hr: 'Heart Rate (BPM)',
      gsr: 'Galvanic Skin Response',
      temp: 'Body Temperature (°C)'
    };
    
    return names[metric] || metric;
  }
  
  /**
   * Get color for a subject
   */
  function getSubjectColor(subject) {
    const colors = {
      average: '#1db954', // Green
      subject1: '#4a90e2', // Blue
      subject2: '#f5a623', // Orange
      subject3: '#d0021b'  // Red
    };
    
    return colors[subject] || '#1db954';
  }
  
  /**
   * Map metric value to frequency
   */
  function mapMetricToFrequency(value, metric) {
    switch (metric) {
      case 'hr':
        // 220-880 Hz range mapping
        return 220 + Math.min(660, Math.max(0, (value - 60) / 80 * 660));
      case 'gsr':
        // 330-1100 Hz range mapping
        return 330 + Math.min(770, Math.max(0, (value - 2) / 15 * 770));
      case 'temp':
        // 165-660 Hz range mapping
        return 165 + Math.min(495, Math.max(0, (value - 36) / 2 * 495));
      default:
        return 440; // A4 as default
    }
  }
  
  /**
   * Clean up resources when leaving Step 2
   */
  function cleanupStep2() {
    stopAudio();
  }
  
  // =================================================================
  // STEP 3: Audio Visualizer Controls
  // =================================================================
  
  function initStep3() {
    console.log('Initializing step 3');
    
    // Set up player timeline
    initPlayerTimeline();
    
    // Set up player controls
    initPlayerControls();
  }
  
  /**
   * Initialize player timeline with visualizations
   */
  function initPlayerTimeline() {
    // Generate visualization data if needed
    if (!tutorialState.playerData) {
      // Use data from step 2 if available
      if (tutorialState.chartData && tutorialState.chartData.average) {
        tutorialState.playerData = tutorialState.chartData.average;
      } else {
        // Generate new data
        const playerData = [];
        for (let i = 0; i <= 90; i++) {
          playerData.push({
            time: i,
            hr: 70 + (Math.sin(i * 0.1) * 10) + (Math.random() * 5),
            gsr: 6 + (Math.sin(i * 0.08) * 2) + (Math.random() * 0.8),
            temp: 36.7 + (Math.sin(i * 0.03) * 0.3) + (Math.random() * 0.1)
          });
        }
        tutorialState.playerData = playerData;
      }
    }
    
    // Create mini chart
    const chartContainer = document.getElementById('player-chart');
    if (chartContainer) {
      createMiniChart(chartContainer, tutorialState.playerData);
    }
    
    // Create mini waveform
    const waveformContainer = document.getElementById('player-waveform');
    if (waveformContainer) {
      createMiniWaveform(waveformContainer);
    }
  }
  
  /**
   * Create a mini version of the chart
   */
  function createMiniChart(container, data) {
    if (!d3 || !container || !data) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Set dimensions
    const width = container.clientWidth;
    const height = container.clientHeight || 150;
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, 90]) // 0-90 seconds
      .range([margin.left, width - margin.right]);
    
    // Get min/max values for heart rate
    const metric = 'hr';
    const allValues = data.map(p => p[metric]).filter(v => v !== undefined);
    
    const yMin = Math.floor(d3.min(allValues) * 0.95);
    const yMax = Math.ceil(d3.max(allValues) * 1.05);
    
    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([height - margin.bottom, margin.top]);
    
    // Create line generator
    const line = d3.line()
      .x(d => xScale(d.time))
      .y(d => yScale(d[metric]))
      .curve(d3.curveMonotoneX);
    
    // Add the line path
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#1db954')
      .attr('stroke-width', 2)
      .attr('d', line);
    
    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(3);
    const yAxis = d3.axisLeft(yScale).ticks(3);
    
    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .attr('color', '#666')
      .selectAll('text')
      .attr('fill', '#999')
      .attr('font-size', '10px');
    
    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxis)
      .attr('color', '#666')
      .selectAll('text')
      .attr('fill', '#999')
      .attr('font-size', '10px');
    
    // Add position line for the player
    svg.append('line')
      .attr('id', 'player-position-line')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('x1', margin.left)
      .attr('x2', margin.left);
  }
  
  /**
   * Create a mini waveform visualization
   */
  function createMiniWaveform(container) {
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create bars
    const barCount = 40;
    const barWidth = 3;
    const barGap = 1;
    
    for (let i = 0; i < barCount; i++) {
      // Create top and bottom bars
      const topBar = document.createElement('div');
      topBar.className = 'waveform-bar';
      topBar.style.position = 'absolute';
      topBar.style.width = `${barWidth}px`;
      topBar.style.bottom = '50%';
      topBar.style.left = `${i * (barWidth + barGap) + 10}px`;
      topBar.style.height = '15px';
      topBar.style.backgroundColor = '#1db954';
      topBar.style.borderRadius = '1px 1px 0 0';
      
      const bottomBar = document.createElement('div');
      bottomBar.className = 'waveform-bar';
      bottomBar.style.position = 'absolute';
      bottomBar.style.width = `${barWidth}px`;
      bottomBar.style.top = '50%';
      bottomBar.style.left = `${i * (barWidth + barGap) + 10}px`;
      bottomBar.style.height = '15px';
      bottomBar.style.backgroundColor = '#1db954';
      bottomBar.style.borderRadius = '0 0 1px 1px';
      
      container.appendChild(topBar);
      container.appendChild(bottomBar);
    }
  }
  
  /**
   * Initialize player controls
   */
  function initPlayerControls() {
    // Set up play button
    const playButton = document.getElementById('play-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const timelineProgress = document.getElementById('player-timeline-progress');
    const timelineHandle = document.getElementById('player-timeline-handle');
    const currentTime = document.getElementById('current-time');
    const skipBackBtn = document.getElementById('skip-back');
    const skipForwardBtn = document.getElementById('skip-forward');
    
    if (playButton && playIcon && pauseIcon) {
      playButton.addEventListener('click', function() {
        togglePlayerPlayback();
      });
    }
    
    // Set up volume slider
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', function() {
        const volume = this.value / 100;
        updateVolume(volume);
      });
    }
    
    // Set up speed slider
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    if (speedSlider && speedValue) {
      speedSlider.addEventListener('input', function() {
        const speed = parseFloat(this.value);
        speedValue.textContent = `${speed.toFixed(1)}×`;
        tutorialState.playbackSpeed = speed;
      });
    }
    
    // Set up waveform selector
    const waveformSelect = document.getElementById('waveform-select');
    if (waveformSelect) {
      waveformSelect.addEventListener('change', function() {
        tutorialState.currentWaveType = this.value;
        
        // If currently playing, update the oscillator type
        if (tutorialState.isPlaying && tutorialState.oscillator) {
          // If changing to/from custom, need to recreate oscillator
          if (this.value === 'custom' || tutorialState.oscillator.type === 'custom') {
            // Remember current frequency
            const currentFreq = tutorialState.oscillator.frequency.value;
            stopAudio();
            playAudio(this.value, currentFreq);
          } else {
            tutorialState.oscillator.type = this.value;
          }
        }
      });
    }
    
    // Set up timeline click
    const timelineTrack = document.querySelector('.player-timeline .timeline-track');
    if (timelineTrack && timelineProgress && timelineHandle) {
      timelineTrack.addEventListener('click', function(e) {
        // Calculate click position as percentage
        const rect = this.getBoundingClientRect();
        const position = ((e.clientX - rect.left) / rect.width) * 100;
        
        // Update position
        updatePlayerPosition(position);
        
        // If playing, update audio
        if (tutorialState.playerIsPlaying && tutorialState.oscillator) {
          updatePlayerAudio(position);
        }
      });
    }
    
    // Set up skip buttons
    if (skipBackBtn) {
      skipBackBtn.addEventListener('click', function() {
        skipPlayerPosition(-10);
      });
    }
    
    if (skipForwardBtn) {
      skipForwardBtn.addEventListener('click', function() {
        skipPlayerPosition(10);
      });
    }
    
    // Set up example button
    const examplePlayBtn = document.getElementById('example-play');
    if (examplePlayBtn) {
      examplePlayBtn.addEventListener('click', function() {
        if (tutorialState.playerIsPlaying) {
          stopPlayerPlayback();
          this.textContent = 'Try Example';
        } else {
          // Start from beginning
          updatePlayerPosition(0);
          startPlayerPlayback();
          this.textContent = 'Stop Example';
        }
      });
    }
  }
  
  /**
 * Toggle player playback
 */
function togglePlayerPlayback() {
    console.log("Toggle playback called, current state:", tutorialState.playerIsPlaying);
    
    if (tutorialState.playerIsPlaying) {
      stopPlayerPlayback();
    } else {
      startPlayerPlayback();
    }
  }
 /**
 * Start player playback
 */
function startPlayerPlayback() {
    console.log("Starting player playback");
    
    // Initialize audio context if needed
    initAudioContext();
    
    // Update UI first
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    if (playIcon && pauseIcon) {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    }
    
    // Update state
    tutorialState.playerIsPlaying = true;
    
    // Current position
    const currentPosition = tutorialState.playerPosition || 0;
    
    // Reset if at end
    if (currentPosition >= 100) {
      updatePlayerPosition(0);
    }
    
    // Resume context if suspended (needed for Chrome's autoplay policy)
    if (tutorialState.audioContext) {
      tutorialState.audioContext.resume().then(() => {
        console.log('AudioContext resumed successfully for player');
        
        // Start audio
        updatePlayerAudio(tutorialState.playerPosition || 0);
        
        // Start playback interval
        tutorialState.playerInterval = setInterval(() => {
          // Get current position
          let position = tutorialState.playerPosition || 0;
          
          // Apply speed
          position += 0.5 * (tutorialState.playbackSpeed || 1.0);
          
          if (position >= 100) {
            stopPlayerPlayback();
            return;
          }
          
          // Update position
          updatePlayerPosition(position);
          
          // Update audio
          updatePlayerAudio(position);
          
        }, 100); // Update 10 times per second
      });
    }
  }
  
  
  /**
   * Initialize scrollama for step-based scrolling
   */
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
        // Get the step number
        const stepNumber = parseInt(response.element.dataset.step);
        
        // Update progress bar
        updateProgress(stepNumber);
        
        // Hide scroll prompt after first step
        if (stepNumber > 1) {
          const scrollPrompt = document.getElementById('scroll-prompt');
          if (scrollPrompt) scrollPrompt.classList.add('hidden');
        }
        
        // Mark step as active
        response.element.classList.add('active');
        
        // Initialize specific step content
        switch(stepNumber) {
          case 1: initStep1(); break;
          case 2: initStep2(); break;
          case 3: initStep3(); break;
          case 4: initStep4(); break;
          case 5: initStep5(); break;
        }
      })
      .onStepExit(response => {
        // Clean up any active audio/animations when leaving a step
        const stepNumber = parseInt(response.element.dataset.step);
        
        // Stop any audio playing in the section
        if (tutorialState.isPlaying) {
          stopAudio();
        }
        
        // Clean up specific step resources
        switch(stepNumber) {
          case 1: cleanupStep1(); break;
          case 2: cleanupStep2(); break;
          case 3: cleanupStep3(); break;
          case 4: cleanupStep4(); break;
          case 5: cleanupStep5(); break;
        }
      });
      
    // After initialization, update to reflect current position
    // This helps if the page is refreshed in the middle of the tutorial
    scroller.resize();
  }
  
  /**
   * Update progress bar and step indicators
   * @param {number} step - Current step number (1-based)
   */
  function updateProgress(step) {
    // Update progress bar
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      // Calculate percentage (5 steps total)
      const progress = ((step - 1) / 4) * 100;
      progressBar.style.width = `${progress}%`;
    }
    
    // Update step indicators
    const stepIndicators = document.querySelectorAll('.progress-step');
    stepIndicators.forEach(indicator => {
      const indicatorStep = parseInt(indicator.dataset.step);
      indicator.classList.toggle('active', indicatorStep <= step);
    });
  }
  
  /**
   * Initialize audio context for all audio functionality
   */
  function initAudioContext() {
    if (tutorialState.audioContext) return;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      tutorialState.audioContext = new AudioContext();
      
      // Create main gain node
      tutorialState.gainNode = tutorialState.audioContext.createGain();
      tutorialState.gainNode.gain.value = 0.2; // 20% volume
      tutorialState.gainNode.connect(tutorialState.audioContext.destination);
      
      console.log('Audio context initialized');
    } catch (e) {
      console.error('Failed to initialize audio context:', e);
    }
  }
  
  /**
 * Start playing a simple oscillator
 * @param {string} type - Oscillator type (sine, square, etc.)
 * @param {number} frequency - Initial frequency in Hz
 */
function playAudio(type, frequency) {
    // Initialize audio context if needed
    initAudioContext();
    if (!tutorialState.audioContext) return;
    
    // Resume context if suspended (needed for Chrome's autoplay policy)
    if (tutorialState.audioContext.state === 'suspended') {
      tutorialState.audioContext.resume().then(() => {
        console.log('AudioContext resumed successfully');
        continuePlayAudio(type, frequency);
      });
    } else {
      continuePlayAudio(type, frequency);
    }
  }
  
  function continuePlayAudio(type, frequency) {
    // Stop any currently playing audio
    if (tutorialState.isPlaying) {
      try {
        tutorialState.oscillator.stop();
        tutorialState.oscillator.disconnect();
      } catch (e) {
        console.warn('Error stopping previous oscillator:', e);
      }
    }
    
    try {
      // Create new oscillator
      tutorialState.oscillator = tutorialState.audioContext.createOscillator();
      tutorialState.oscillator.type = type || 'sine';
      tutorialState.oscillator.frequency.value = frequency || 440;
      
      // Connect and start
      tutorialState.oscillator.connect(tutorialState.gainNode);
      tutorialState.oscillator.start();
      tutorialState.isPlaying = true;
      tutorialState.currentWaveType = type;
      
      console.log(`Started ${type} wave at ${frequency}Hz`);
    } catch (e) {
      console.error('Error starting audio:', e);
    }
  }
  
  /**
   * Stop currently playing audio
   */
  function stopAudio() {
    if (!tutorialState.oscillator || !tutorialState.isPlaying) return;
    
    try {
      tutorialState.oscillator.stop();
      tutorialState.oscillator.disconnect();
      tutorialState.oscillator = null;
      tutorialState.isPlaying = false;
      
      console.log('Audio stopped');
    } catch (e) {
      console.error('Error stopping audio:', e);
    }
  }
  
  /**
   * Update the frequency of currently playing audio
   * @param {number} frequency - New frequency in Hz
   */
  function updateFrequency(frequency) {
    if (!tutorialState.oscillator || !tutorialState.isPlaying) return;
    
    try {
      // Use exponential ramp for smoother transition
      const now = tutorialState.audioContext.currentTime;
      tutorialState.oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(frequency, 1), // Ensure value is positive for exponentialRamp
        now + 0.1
      );
    } catch (e) {
      console.error('Error updating frequency:', e);
    }
  }
  
  /**
   * Update volume level
   * @param {number} level - Volume level from 0-1
   */
  function updateVolume(level) {
    if (!tutorialState.gainNode) return;
    
    try {
      // Clamp value between 0-1
      const safeLevel = Math.max(0, Math.min(1, level));
      
      // Smooth transition
      const now = tutorialState.audioContext.currentTime;
      tutorialState.gainNode.gain.linearRampToValueAtTime(
        safeLevel,
        now + 0.1
      );
    } catch (e) {
      console.error('Error updating volume:', e);
    }
  }
  
  // =================================================================
  // STEP 1: Why Visualize Data with Sound?
  // =================================================================
  function initStep1() {
    console.log('Initializing step 1');
    
    // Set up stress level slider
    const stressSlider = document.getElementById('stress-slider');
    if (stressSlider) {
      stressSlider.addEventListener('input', updateStressVisualization);
      // Initialize with default value
      stressSlider.value = 20;
      updateStressVisualization();
    }
    
    // Set up play stress sound button
const playStressButton = document.getElementById('play-stress-sound');
if (playStressButton) {
  playStressButton.addEventListener('click', function() {
    if (tutorialState.isPlaying) {
      stopAudio();
      tutorialState.stressAudioPlaying = false;
      this.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M8 5v14l11-7z" fill="currentColor"/>
        </svg>
        Hear It
      `;
    } else {
      // Get stress level and convert to frequency
      const stressLevel = parseInt(document.getElementById('stress-slider').value);
      const heartRate = 60 + (stressLevel * 0.6);
      const frequency = 220 + ((heartRate - 60) / 120) * 440;
      
      // Choose waveform based on stress
      let waveType = 'sine';
      if (stressLevel > 70) {
        waveType = 'sawtooth';
      } else if (stressLevel > 30) {
        waveType = 'triangle';
      }
      
      // Initialize audio context
      initAudioContext();
      
      // Resume context if suspended
      if (tutorialState.audioContext) {
        tutorialState.audioContext.resume().then(() => {
          playAudio(waveType, frequency);
          tutorialState.stressAudioPlaying = true;
          this.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
            </svg>
            Stop
          `;
        });
      }
    }
  });
}
    
    // Also set up visual/audio demo
    initVisualAudioDemo();
  }
  
  function updateStressVisualization() {
    const slider = document.getElementById('stress-slider');
    if (!slider) return;
    
    const stressLevel = parseInt(slider.value);
    
    // Update heart rate based on stress (60-120 BPM range)
    const heartRate = 60 + (stressLevel * 0.6);
    const bpmValue = document.getElementById('bpm-value');
    if (bpmValue) {
      bpmValue.textContent = `${Math.round(heartRate)} BPM`;
    }
    
    // Update waveform visualization
    updateLiveWaveform(stressLevel);
    
    // Update heart animation speed
    const heartIcon = document.getElementById('heart-animation');
    if (heartIcon) {
      // Adjust animation speed based on heart rate
      const animationDuration = 60 / heartRate; // seconds per beat
      heartIcon.style.animationDuration = `${animationDuration}s`;
    }
    
    // If sound is currently playing, update its frequency
    if (tutorialState.isPlaying && tutorialState.oscillator) {
      const frequency = 220 + ((heartRate - 60) / 120) * 440;
      updateFrequency(frequency);
    }
  }
  
  /**
   * Update the live waveform visualization based on stress level
   */
  function updateLiveWaveform(stressLevel) {
    const waveform = document.getElementById('live-waveform');
    if (!waveform) return;
    
    // Clear existing bars
    waveform.innerHTML = '';
    
    // Create new bars based on stress level
    const barCount = 20;
    
    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'waveform-bar';
      
      // Calculate height based on stress level and position
      let height;
      
      if (stressLevel < 30) {
        // Low stress - smooth, regular pattern
        height = 10 + Math.sin(i * 0.5) * 10;
      } else if (stressLevel < 70) {
        // Medium stress - more variation
        height = 15 + Math.sin(i * 0.8) * 15 + (Math.random() * 5);
      } else {
        // High stress - jagged, irregular pattern
        height = 20 + Math.sin(i * 1.2) * 20 + (Math.random() * 15);
      }
      
      bar.style.height = `${height}px`;
      
      // Add varying animation delay for wave effect
      bar.style.animationDelay = `${i * 0.05}s`;
      
      // Color based on stress
      const hue = Math.max(120, 360 - stressLevel * 2.4); // Green to red
      bar.style.backgroundColor = `hsl(${hue}, 80%, 50%)`;
      
      waveform.appendChild(bar);
    }
  }
  
  /**
   * Initialize the visual/audio demo in section 1
   */
  function initVisualAudioDemo() {
    console.log('Initializing visual/audio demo');
    
    // Set up the SVG for the audio-visual demo
    const visualChart = document.getElementById('visual-only-chart');
    const audioVisualChart = document.getElementById('audiovisual-chart');
    
    if (!visualChart || !audioVisualChart) {
      console.warn('Charts not found in DOM');
      return;
    }
    
    // Create a simple dataset with a hidden pattern
    const sampleData = generateSampleDataWithPattern();
    
    // Create a simple line chart for both visualizations
    createSimpleLineChart(visualChart, sampleData, false);
    createSimpleLineChart(audioVisualChart, sampleData, true);
    
    // Set up play button for audio demo
    const playButton = document.getElementById('play-audio-demo');
    const timelineProgress = document.getElementById('audio-timeline-progress');
    const timelineHandle = document.getElementById('audio-timeline-handle');
    
    if (!playButton) {
      console.warn('Play button not found in DOM');
      return;
    }
    
    // Explicitly handle click events rather than relying on existing handlers
    let demoIsPlaying = false;
    let demoInterval = null;
    let demoPosition = 0;
    
    // Remove any existing click handlers to avoid duplicates
    playButton.removeEventListener('click', handlePlayClick);
    
    // Define the click handler
    // Define the click handler
function handlePlayClick() {
    console.log('Play button clicked, current state:', demoIsPlaying ? 'playing' : 'stopped');
    
    if (demoIsPlaying) {
      // Stop playback
      if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
      }
      stopAudio();
      demoIsPlaying = false;
      
      // Update button UI
      playButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M8 5v14l11-7z" fill="currentColor"/>
        </svg>
        Play
      `;
    } else {
      // Start playback
      demoIsPlaying = true;
      
      // Update button UI
      playButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
        </svg>
        Stop
      `;
      
      // Reset if at end
      if (demoPosition >= 100) {
        demoPosition = 0;
      }
      
      // Initialize audio context
      initAudioContext();
      
      // Resume context if suspended (needed for Chrome's autoplay policy)
      if (tutorialState.audioContext) {
        tutorialState.audioContext.resume().then(() => {
          console.log('AudioContext resumed successfully');
          
          // Get initial value and frequency
          const initialValue = getDataValueAtPosition(sampleData, demoPosition);
          const initialFreq = mapValueToFrequency(initialValue);
          
          // Update timeline
          if (timelineProgress) timelineProgress.style.width = `${demoPosition}%`;
          if (timelineHandle) timelineHandle.style.left = `${demoPosition}%`;
          
          // Start audio
          playAudio('sine', initialFreq);
          
          // Update position line in visualizations
          updateAudioDemoPosition(sampleData, demoPosition);
          
          // Start playback interval
          demoInterval = setInterval(() => {
            demoPosition += 1;
            
            if (demoPosition > 100) {
              clearInterval(demoInterval);
              demoInterval = null;
              stopAudio();
              demoIsPlaying = false;
              
              // Update button UI
              playButton.innerHTML = `
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M8 5v14l11-7z" fill="currentColor"/>
                </svg>
                Play
              `;
              return;
            }
            
            // Update timeline
            if (timelineProgress) timelineProgress.style.width = `${demoPosition}%`;
            if (timelineHandle) timelineHandle.style.left = `${demoPosition}%`;
            
            // Update audio and position line
            updateAudioDemoPosition(sampleData, demoPosition);
            
          }, 100); // Update every 100ms
        });
      }
    }
  }
    
    // Add the click handler
    playButton.addEventListener('click', handlePlayClick);
    
    // Set up timeline click
    const timelineTrack = document.querySelector('.audio-timeline');
    if (timelineTrack) {
      timelineTrack.addEventListener('click', function(e) {
        // Calculate click position as percentage
        const rect = this.getBoundingClientRect();
        demoPosition = ((e.clientX - rect.left) / rect.width) * 100;
        
        // Update timeline
        if (timelineProgress) timelineProgress.style.width = `${demoPosition}%`;
        if (timelineHandle) timelineHandle.style.left = `${demoPosition}%`;
        
        // If playing, update audio and position line
        if (demoIsPlaying) {
          updateAudioDemoPosition(sampleData, demoPosition);
        }
      });
    }
    
    // Function to update position line and audio
    function updateAudioDemoPosition(data, position) {
      // Get data value at position
      const dataValue = getDataValueAtPosition(data, position);
      
      // Update audio frequency
      if (tutorialState.isPlaying) {
        const frequency = mapValueToFrequency(dataValue);
        updateFrequency(frequency);
      }
      
      // Update position line in chart
      const positionLine = d3.select('#audiovisual-chart svg').select('#position-line');
      if (!positionLine.empty()) {
        const width = d3.select('#audiovisual-chart svg').attr('width');
        const margin = { left: 40, right: 20 };
        const x = margin.left + (position / 100) * (width - margin.left - margin.right);
        positionLine.attr('x1', x).attr('x2', x);
        
        // Update highlight point
        const highlightPoint = d3.select('#audiovisual-chart svg').select('#highlight-point');
        if (!highlightPoint.empty()) {
          // Calculate index
          const index = Math.floor((position / 100) * (data.length - 1));
          
          // Get y coordinate
          const height = d3.select('#audiovisual-chart svg').attr('height');
          const margin = { top: 20, bottom: 30 };
          const yScale = d3.scaleLinear()
            .domain([d3.min(data, d => d.y) * 0.9, d3.max(data, d => d.y) * 1.1])
            .range([height - margin.bottom, margin.top]);
          
          const yValue = data[index].y;
          const y = yScale(yValue);
          
          // Update point
          highlightPoint
            .attr('cx', x)
            .attr('cy', y)
            .attr('opacity', 1);
        }
      }
    }
  }
  
  /**
   * Generate sample data with a subtle pattern that's hard to see but easy to hear
   */
  function generateSampleDataWithPattern() {
    const data = [];
    
    // Generate 100 data points
    for (let i = 0; i < 100; i++) {
      // Base value with noise
      let value = 50 + (Math.random() * 15 - 7.5);
      
      // Add subtle patterns that are hard to see visually
      
      // Pattern 1: Small sine wave
      value += Math.sin(i * 0.2) * 3;
      
      // Pattern 2: Three subtle peaks
      if (i > 25 && i < 35) {
        value += (i - 25) * 0.5;
      } else if (i > 35 && i < 45) {
        value += (45 - i) * 0.5;
      }
      
      if (i > 55 && i < 65) {
        value += (i - 55) * 0.6;
      } else if (i > 65 && i < 75) {
        value += (75 - i) * 0.6;
      }
      
      // Pattern 3: Hidden anomaly spike
      if (i === 82) value += 8;
      
      data.push({ x: i, y: value });
    }
    
    return data;
  }
  
  /**
   * Create a simple line chart using D3.js
   */
  function createSimpleLineChart(container, data, isInteractive) {
    if (!d3 || !container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Set dimensions
    const width = container.clientWidth;
    const height = container.clientHeight || 200;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([margin.left, width - margin.right]);
    
    const yScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.y) * 0.9, d3.max(data, d => d.y) * 1.1])
      .range([height - margin.bottom, margin.top]);
    
    // Create line generator
    const line = d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);
    
    // Add the line path
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', isInteractive ? '#1db954' : '#4a90e2')
      .attr('stroke-width', 2)
      .attr('d', line);
    
    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);
    
    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .attr('color', '#666')
      .selectAll('text')
      .attr('fill', '#999');
    
    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxis)
      .attr('color', '#666')
      .selectAll('text')
      .attr('fill', '#999');
    
    // If interactive, add vertical line to show current position
    if (isInteractive) {
      svg.append('line')
        .attr('id', 'position-line')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom)
        .attr('x1', margin.left)
        .attr('x2', margin.left);
      
      // Add circles to highlight points
      svg.append('circle')
        .attr('id', 'highlight-point')
        .attr('r', 4)
        .attr('fill', '#1db954')
        .attr('cx', xScale(0))
        .attr('cy', yScale(data[0].y))
        .attr('opacity', 0);
    }
  }
  
  /**
   * Get data value at a specific position percentage
   */
  function getDataValueAtPosition(data, positionPercent) {
    const index = Math.floor((positionPercent / 100) * (data.length - 1));
    return data[Math.min(data.length - 1, Math.max(0, index))].y;
  }
  
  /**
   * Map data value to audio frequency
   */
  function mapValueToFrequency(value) {
    // Map to a pleasant audio range (220-880 Hz)
    return 220 + ((value - 30) / 60) * 660;
  }
  
  /**
   * Clean up resources when leaving Step 1
   */
  function cleanupStep1() {
    stopAudio();
  }
  
  // =================================================================
  // STEP 2: Data Navigation
  // =================================================================
  
  function initStep2() {
    console.log('Initializing step 2');
    
    // Initialize dataset chart
    initDatasetChart();
    
    // Set up subject buttons
    const subjectButtons = document.querySelectorAll('.compare-subjects .demo-btn');
    subjectButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Update active button
        subjectButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Update chart with selected subject
        const subject = this.dataset.subject;
        console.log('Subject button clicked:', subject);
        updateDatasetChart(subject);
        
        // Update dropdown if it exists
        const subjectSelect = document.getElementById('subject-select');
        if (subjectSelect) {
          subjectSelect.value = subject;
        }
      });
    });
    
    // Set up subject and metric dropdowns
    const subjectSelect = document.getElementById('subject-select');
    const metricSelect = document.getElementById('metric-select');
    
    if (subjectSelect) {
      subjectSelect.addEventListener('change', function() {
        const subject = this.value;
        console.log('Subject dropdown changed:', subject);
        updateDatasetChart(subject);
        
        // Also update active button
        const subjectButtons = document.querySelectorAll('.compare-subjects .demo-btn');
        subjectButtons.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.subject === subject);
        });
      });
    }
    
    if (metricSelect) {
      metricSelect.addEventListener('change', function() {
        const metric = this.value;
        console.log('Metric dropdown changed:', metric);
        // Update y-axis label and chart title
        updateChartMetric(metric);
      });
    }
  }
  
  /**
   * Initialize the interactive dataset chart in step 2
   */
  function initDatasetChart() {
    // Create the chart data if not already created
    if (!tutorialState.chartData) {
      tutorialState.chartData = generateExamDataset();
    }
    
    const chartContainer = document.getElementById('dataset-chart');
    if (!chartContainer) {
      console.warn('Chart container not found');
      return;
    }
    
    // Get initial values
    const subjectSelect = document.getElementById('subject-select');
    const metricSelect = document.getElementById('metric-select');
    
    const initialSubject = subjectSelect ? subjectSelect.value : 'average';
    const initialMetric = metricSelect ? metricSelect.value : 'hr';
    
    // Create chart
    createDatasetChart(chartContainer, tutorialState.chartData, initialSubject, initialMetric);
    
    // Set up tooltip
    const tooltip = document.getElementById('chart-tooltip');
    
    // Add interaction functionality
    chartContainer.addEventListener('mousemove', handleChartMouseMove);
    
    // Function to handle mouse move on chart
    function handleChartMouseMove(e) {
      const rect = chartContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Convert to chart coordinates
      const xPercent = x / rect.width;
      const timeValue = xPercent * 120; // 0-120 seconds exam time
      
      // Find closest data point
      const subject = subjectSelect ? subjectSelect.value : 'average';
      const metric = metricSelect ? metricSelect.value : 'hr';
      
      const subjectData = tutorialState.chartData[subject];
      if (!subjectData) return;
      
      // Find closest data point
      const closestPoint = findClosestDataPoint(subjectData, timeValue);
      if (!closestPoint) return;
      
      // Move vertical line
      const positionLine = document.getElementById('chart-position-line');
      if (positionLine) {
        positionLine.setAttribute('x1', x);
        positionLine.setAttribute('x2', x);
      }
      
      // Get Y coordinate
      const yValue = closestPoint[metric];
      if (tooltip && yValue !== undefined) {
        // Position and show tooltip
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY - 30}px`;
        tooltip.textContent = `Time: ${timeValue.toFixed(1)}s, ${getMetricDisplayName(metric)}: ${yValue.toFixed(1)}`;
        tooltip.classList.remove('hidden');
        
        // Play sound if holding shift key
        if (e.shiftKey && !tutorialState.isPlaying) {
          const frequency = mapMetricToFrequency(yValue, metric);
          playAudio('sine', frequency);
        } else if (!e.shiftKey && tutorialState.isPlaying) {
          stopAudio();
        }
      }
    }
    
    
    // Hide tooltip on mouseout
    chartContainer.addEventListener('mouseout', function() {
      const tooltip = document.getElementById('chart-tooltip');
      if (tooltip) {
        tooltip.classList.add('hidden');
      }
      
      // Stop any playing audio
      if (tutorialState.isPlaying) {
        stopAudio();
      }
    });
    
    // Add touch support for mobile
    chartContainer.addEventListener('touchmove', handleChartTouchMove);
    
    // Function to handle touch move on chart
    function handleChartTouchMove(e) {
      const touch = e.touches[0];
      const rect = chartContainer.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      
      // Convert to chart coordinates
      const xPercent = x / rect.width;
      const timeValue = xPercent * 120; // 0-120 seconds exam time
      
      // Find closest data point
      const subject = subjectSelect ? subjectSelect.value : 'average';
      const metric = metricSelect ? metricSelect.value : 'hr';
      
      const subjectData = tutorialState.chartData[subject];
      if (!subjectData) return;
      
      // Find closest data point
      const closestPoint = findClosestDataPoint(subjectData, timeValue);
      if (!closestPoint) return;
      
      // Move vertical line
      const positionLine = document.getElementById('chart-position-line');
      if (positionLine) {
        positionLine.setAttribute('x1', x);
        positionLine.setAttribute('x2', x);
      }
      
      // Get Y coordinate for sound (automatically play sound on touch)
      const yValue = closestPoint[metric];
      if (yValue !== undefined) {
        const frequency = mapMetricToFrequency(yValue, metric);
        
        if (!tutorialState.isPlaying) {
          playAudio('sine', frequency);
        } else {
          updateFrequency(frequency);
        }
      }
      
      e.preventDefault(); // Prevent scroll
    }
    
    chartContainer.addEventListener('touchend', function() {
      // Stop any playing audio
      if (tutorialState.isPlaying) {
        stopAudio();
      }
    });
}

/**
 * Update player audio based on position
 */
function updatePlayerAudio(position) {
    console.log("Updating player audio at position:", position);
    
    if (!tutorialState.playerData) {
      console.warn("No player data available");
      return;
    }
    
    // Get data value at position
    const timeValue = (position / 100) * 90; // 0-90 seconds range
    const dataPoint = findClosestDataPoint(tutorialState.playerData, timeValue);
    
    if (!dataPoint) {
      console.warn("No data point found at time:", timeValue);
      return;
    }
    
    console.log("Found data point:", dataPoint);
    
    // Get current waveform type
    const waveformSelect = document.getElementById('waveform-select');
    const waveType = waveformSelect ? waveformSelect.value : 'sine';
    
    // Calculate frequency based on heart rate
    const frequency = mapMetricToFrequency(dataPoint.hr, 'hr');
    console.log("Using frequency:", frequency, "Hz for waveform type:", waveType);
    
    // Start or update audio
    if (!tutorialState.isPlaying) {
      console.log("Starting new audio");
      initAudioContext();
      if (tutorialState.audioContext && tutorialState.audioContext.state === 'suspended') {
        tutorialState.audioContext.resume().then(() => {
          playAudio(waveType, frequency);
        });
      } else {
        playAudio(waveType, frequency);
      }
    } else {
      console.log("Updating frequency of existing audio");
      updateFrequency(frequency);
    }
    
    // Update visualizations
    updatePlayerVisualizations(position, dataPoint);
  }
  
  /**
   * Stop player playback
   */
  function stopPlayerPlayback() {
    // Clear interval
    if (tutorialState.playerInterval) {
      clearInterval(tutorialState.playerInterval);
      tutorialState.playerInterval = null;
    }
    
    // Stop audio
    stopAudio();
    
    // Update UI
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    if (playIcon && pauseIcon) {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    }
    
    // Update state
    tutorialState.playerIsPlaying = false;
    
    // Update example button if exists
    const examplePlayBtn = document.getElementById('example-play');
    if (examplePlayBtn) {
      examplePlayBtn.textContent = 'Try Example';
    }
  }
  
  /**
   * Initialize step 4
   */
  function initStep4() {
    console.log('Initializing step 4');
    
    // Set up waveform canvas
    const canvas = document.getElementById('waveform-canvas');
    if (canvas) {
      setupWaveformCanvas(canvas);
    }
    
    // Set up waveform card buttons
    const playButtons = document.querySelectorAll('.play-wave-btn');
    playButtons.forEach(button => {
      button.addEventListener('click', function() {
        const waveType = this.dataset.wave;
        
        if (tutorialState.isPlaying) {
          stopAudio();
          this.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
            Play
          `;
        } else {
          playWaveform(waveType);
          
          // Update all buttons
          playButtons.forEach(btn => {
            btn.innerHTML = `
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
              Play
            `;
          });
          
          // Update this button
          this.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
            </svg>
            Stop
          `;
        }
      });
    });
  }
  
 /**
 * Initialize step 5
 */
function initStep5() {
    console.log('Initializing step 5');
    
    // Set up browse button
    const browseButton = document.getElementById('browse-files');
    const customDialog = document.getElementById('custom-confirm-dialog');
    const confirmBtn = document.getElementById('dialog-confirm');
    const cancelBtn = document.getElementById('dialog-cancel');
    
    if (browseButton) {
      browseButton.addEventListener('click', function() {
        // Show custom confirmation dialog
        if (customDialog) {
          customDialog.classList.remove('hidden');
          // Use setTimeout to ensure the transition happens after display change
          setTimeout(() => {
            customDialog.classList.add('visible');
          }, 10);
        }
      });
    }
    
    // Set up dialog buttons
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function() {
        // Hide dialog with animation
        if (customDialog) {
          customDialog.classList.remove('visible');
          // Wait for animation to complete before hiding
          setTimeout(() => {
            customDialog.classList.add('hidden');
            // Redirect to upload page
            window.location.href = 'upload.html';
          }, 300);
        }
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        // Hide dialog with animation
        if (customDialog) {
          customDialog.classList.remove('visible');
          // Wait for animation to complete before hiding
          setTimeout(() => {
            customDialog.classList.add('hidden');
          }, 300);
        }
      });
    }
    
    // Allow clicking outside dialog to cancel
    if (customDialog) {
      customDialog.addEventListener('click', function(e) {
        // Only close if clicking the background (not the dialog content)
        if (e.target === customDialog) {
          customDialog.classList.remove('visible');
          setTimeout(() => {
            customDialog.classList.add('hidden');
          }, 300);
        }
      });
    }
    
    // Set up finish tutorial button
    const finishButton = document.getElementById('finish-tutorial');
    if (finishButton) {
      finishButton.addEventListener('click', function() {
        window.location.href = 'albums.html';
      });
    }
  }
  
  /**
   * Clean up resources when leaving Step 3
   */
  function cleanupStep3() {
    // Stop any playing audio
    if (tutorialState.isPlaying) {
      stopAudio();
    }
    
    // Stop player playback
    if (tutorialState.playerIsPlaying) {
      stopPlayerPlayback();
    }
  }
  
  /**
   * Clean up resources when leaving Step 4
   */
  function cleanupStep4() {
    // Stop any playing audio
    if (tutorialState.isPlaying) {
      stopAudio();
    }
  }
  
  /**
   * Clean up resources when leaving Step 5
   */
  function cleanupStep5() {
    // No cleanup needed
  }
  
  /**
   * Play a specific waveform type
   */
  function playWaveform(type) {
    console.log("Playing waveform of type:", type);
    
    // Initialize audio context if needed
    initAudioContext();
    
    // Resume context if suspended (needed for Chrome's autoplay policy)
    if (tutorialState.audioContext && tutorialState.audioContext.state === 'suspended') {
      tutorialState.audioContext.resume();
    }
    
    // Stop any currently playing audio
    if (tutorialState.isPlaying) {
      stopAudio();
    }
    
    // Small delay to ensure audio context is ready
    setTimeout(() => {
      // Play new audio
      playAudio(type, 440);
    }, 100);
  }

 /**
 * Set up waveform canvas for drawing - Fixed mouse alignment
 */
function setupWaveformCanvas(canvas) {
    console.log("Setting up waveform canvas for drawing");
    
    // Reset canvas - use clientWidth and clientHeight for proper sizing
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Set up drawing state
    tutorialState.isDrawing = false;
    tutorialState.drawPath = [];
    
    // Clean up any existing event listeners to prevent duplicates
    canvas.removeEventListener('mousedown', startDrawing);
    canvas.removeEventListener('mousemove', draw);
    canvas.removeEventListener('mouseup', stopDrawing);
    canvas.removeEventListener('mouseout', stopDrawing);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', stopDrawing);
    
    // Set up event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch support
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
    
    // These functions handle the start of drawing with touch
    function handleTouchStart(e) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Call start drawing with correct coordinates
      startDrawingWithCoords(x, y);
    }
    
    // Handle touch move
    function handleTouchMove(e) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Call draw with correct coordinates
      drawWithCoords(x, y);
    }
  }
  
  /**
   * Update player visualizations based on current position and data
   */
  function updatePlayerVisualizations(position, dataPoint) {
    // Update position line in chart
    const positionLine = document.getElementById('player-position-line');
    if (positionLine) {
      const chartContainer = document.getElementById('player-chart');
      if (chartContainer) {
        const width = chartContainer.clientWidth;
        const margin = { left: 30, right: 10 };
        const innerWidth = width - margin.left - margin.right;
        const x = margin.left + (position / 100) * innerWidth;
        positionLine.setAttribute('x1', x);
        positionLine.setAttribute('x2', x);
      }
    }
    
    // Update waveform bars
    const waveformContainer = document.getElementById('player-waveform');
    if (waveformContainer) {
      const bars = waveformContainer.querySelectorAll('.waveform-bar');
      const normValue = (dataPoint.hr - 60) / 60; // Normalize between 0-1
      
      bars.forEach((bar, index) => {
        // Calculate height based on heart rate and position
        const baseHeight = 5 + (normValue * 25);
        const variance = Math.sin(index * 0.3 + position * 0.05) * 10;
        const height = baseHeight + variance * normValue;
        
        bar.style.height = `${Math.max(2, height)}px`;
        
        // Color based on value
        const hue = 120 - (normValue * 120); // Green to red
        bar.style.backgroundColor = `hsl(${hue}, 80%, 50%)`;
      });
    }
    
    // Update pulse circle
    const pulseCircle = document.getElementById('player-pulse-circle');
    if (pulseCircle && dataPoint) {
      // Scale circle based on heart rate
      const size = 60 + (dataPoint.hr - 60) / 60 * 40;
      pulseCircle.style.width = `${size}px`;
      pulseCircle.style.height = `${size}px`;
      
      // Adjust color
      const hue = 120 - ((dataPoint.hr - 60) / 60 * 120);
      pulseCircle.style.backgroundColor = `hsla(${hue}, 70%, 50%, 0.3)`;
      pulseCircle.style.boxShadow = `0 0 30px hsla(${hue}, 70%, 60%, 0.3)`;
      
      // Adjust animation speed
      const animDuration = 60 / dataPoint.hr; // seconds per beat
      pulseCircle.style.animationDuration = `${animDuration}s`;
    }
  }
  
  /**
   * Start drawing with specific coordinates
   */
  function startDrawingWithCoords(x, y) {
    const canvas = document.getElementById('waveform-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Update drawing state
    tutorialState.isDrawing = true;
    tutorialState.drawPath = [{x, y}];
    
    // Begin path
    ctx.strokeStyle = '#1db954';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    console.log('Drawing started at', x, y);
  }
  
  /**
   * Draw with specific coordinates
   */
  function drawWithCoords(x, y) {
    if (!tutorialState.isDrawing) return;
    
    const canvas = document.getElementById('waveform-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Add point to path
    tutorialState.drawPath.push({x, y});
    
    // Draw line
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  
  /**
   * Start drawing on canvas
   */
  function startDrawing(e) {
    const canvas = document.getElementById('waveform-canvas');
    if (!canvas) return;
    
    // Get correct coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Start drawing with these coordinates
    startDrawingWithCoords(x, y);
  }
  
  /**
   * Draw on canvas
   */
  function draw(e) {
    if (!tutorialState.isDrawing) return;
    
    const canvas = document.getElementById('waveform-canvas');
    if (!canvas) return;
    
    // Get correct coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Draw with these coordinates
    drawWithCoords(x, y);
  }
  
  /**
   * Stop drawing
   */
  function stopDrawing() {
    tutorialState.isDrawing = false;
  }

  /**
 * Update player position UI
 */
function updatePlayerPosition(position) {
    console.log("Updating player position to:", position);
    
    // Update state
    tutorialState.playerPosition = position;
    
    // Update timeline
    const timelineProgress = document.getElementById('player-timeline-progress');
    const timelineHandle = document.getElementById('player-timeline-handle');
    
    if (timelineProgress) {
      timelineProgress.style.width = `${position}%`;
    }
    
    if (timelineHandle) {
      timelineHandle.style.left = `${position}%`;
    }
    
    // Update time display
    const currentTime = document.getElementById('current-time');
    const totalTime = document.getElementById('total-time');
    
    if (currentTime) {
      // Convert position (0-100) to time in seconds (0-90)
      const seconds = (position / 100) * 90;
      currentTime.textContent = formatTime(seconds);
    }
  }
  
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }