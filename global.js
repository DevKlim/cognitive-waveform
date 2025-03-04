// Application state
const app = {
    currentDataType: null,  // 'exam' or 'driving'
    currentStudent: null,
    currentExam: null,
    currentTime: 0,
    isPlaying: false,
    playbackInterval: null,
    data: {
        all: [],
        filtered: [],
        files: [] // Array to store available CSV files
    },
    chart: {
        svg: null,
        width: 0,
        height: 0,
        xScale: null,
        yScale: null,
        lineGenerator: null
    },
    currentFile: null // Track the currently selected file
};

// Sample data for fallback
const sampleData = [
    {"timestamp":0,"student":"S1","exam":"Midterm 1","hr":84,"temp":22.51},
    {"timestamp":10,"student":"S1","exam":"Midterm 1","hr":101.09,"temp":22.49},
    {"timestamp":20,"student":"S1","exam":"Midterm 1","hr":102.33,"temp":22.51},
    /* ... other sample data points ... */
];

// Function to scan and list all CSV files in the data directory
async function scanDataDirectory() {
    try {
        // Show loading indicator
        document.getElementById('loading-indicator').classList.remove('hidden');
        
        // Add a files section to the sidebar
        const sidebar = document.querySelector('.sidebar');
        
        // Create a files section if it doesn't exist
        if (!document.getElementById('file-list-container')) {
            const filesSection = document.createElement('div');
            filesSection.id = 'file-list-container';
            
            const filesHeader = document.createElement('h2');
            filesHeader.className = 'collection-header';
            filesHeader.textContent = 'Recordings';
            
            const filesList = document.createElement('ul');
            filesList.id = 'file-list';
            filesList.className = 'collection-list';
            
            filesSection.appendChild(filesHeader);
            filesSection.appendChild(filesList);
            sidebar.appendChild(filesSection);
        }
        
        // Fetch list of CSV files with updated path
        const response = await fetch('/cognitive-waveform/data/');
        const html = await response.text();
        
        // Create a temporary element to parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract links to CSV files
        const links = Array.from(doc.querySelectorAll('a'));
        const csvFiles = links
            .filter(link => link.href.endsWith('.csv'))
            .map(link => {
                // Extract just the filename
                const url = new URL(link.href);
                const path = url.pathname;
                const filename = path.split('/').pop();
                return {
                    name: filename,
                    // Updated path to include the proper root directory
                    path: `/cognitive-waveform/data/${filename}`
                };
            });
        
        // Store the files in the app state
        app.data.files = csvFiles;
        
        // Update the UI with the available files
        updateFileList(csvFiles);
        
        // Hide loading indicator
        document.getElementById('loading-indicator').classList.add('hidden');
        
        // If files were found, load the first one
        if (csvFiles.length > 0) {
            loadCSVFile(csvFiles[0].path);
        } else {
            console.warn('No CSV files found in the data directory. Using sample data.');
            useSampleData();
        }
    } catch (error) {
        console.error('Error scanning data directory:', error);
        document.getElementById('loading-indicator').classList.add('hidden');
        alert('Error scanning for CSV files. Using sample data instead.');
        useSampleData();
    }
}

// Update the file list in the UI
function updateFileList(files) {
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';
    
    files.forEach((file, index) => {
        const li = document.createElement('li');
        li.className = 'collection-item' + (index === 0 ? ' active' : '');
        li.setAttribute('data-file', file.path);
        
        // Create a more readable name (remove .csv extension)
        const displayName = file.name.replace('.csv', '').replace(/_/g, ' ');
        li.textContent = displayName;
        
        fileList.appendChild(li);
        
        // Add click event listener
        li.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll('#file-list .collection-item').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
            
            // Load the selected file
            const filePath = this.getAttribute('data-file');
            loadCSVFile(filePath);
        });
    });
}

// Load specific CSV file
function loadCSVFile(filePath) {
    // Show loading indicator
    document.getElementById('loading-indicator').classList.remove('hidden');
    
    // Remember current file
    app.currentFile = filePath;
    
    // Update header to show current file
    const fileDisplayName = filePath.split('/').pop().replace('.csv', '').replace(/_/g, ' ');
    document.getElementById('current-exam').textContent = fileDisplayName;
    
    d3.csv(filePath)
        .then(data => {
            // Check the CSV format by looking at headers
            const headers = Object.keys(data[0]);
            
            // Determine data type based on headers
            if (headers.includes('exam') && headers.includes('student')) {
                // Exam data format
                processExamData(data, fileDisplayName);
                app.currentDataType = 'exam';
            } else if (headers.includes('HR') && headers.includes('subject')) {
                // Driving data format
                processDrivingData(data, fileDisplayName);
                app.currentDataType = 'driving';
            } else {
                // Unknown format
                throw new Error('Unknown CSV format. Expected exam or driving data.');
            }
            
            // Hide loading indicator
            document.getElementById('loading-indicator').classList.add('hidden');
        })
        .catch(error => {
            console.error('Error loading CSV file:', error);
            document.getElementById('loading-indicator').classList.add('hidden');
            alert(`Error loading ${filePath}. Using sample data instead.`);
            useSampleData();
        });
}

// Process exam data format
function processExamData(data, fileDisplayName) {
    // Parse the CSV data
    const parsedData = data.map(d => ({
        timestamp: +d.timestamp,
        student: d.student,
        exam: d.exam,
        hr: +d.hr,
        temp: +d.temp
    }));
    
    // Update app data
    app.data.all = parsedData;
    
    // Get unique students and exams
    const students = [...new Set(parsedData.map(d => d.student))];
    const exams = [...new Set(parsedData.map(d => d.exam))];
    
    // Update UI headings
    document.querySelector('#student-list').previousElementSibling.textContent = 'Students';
    document.querySelector('#exam-list').previousElementSibling.textContent = 'Exams';
    
    // Update student list
    updateListItems('student-list', students, 'data-student');
    
    // Update exam list
    updateListItems('exam-list', exams, 'data-exam');
    
    // Reset to first student and exam
    if (students.length > 0) {
        app.currentStudent = students[0];
        document.getElementById('current-student').textContent = students[0];
    }
    
    if (exams.length > 0) {
        app.currentExam = exams[0];
    }
    
    // Reset playback and update visuals
    resetPlayback();
}

// Process driving data format
function processDrivingData(data, fileDisplayName) {
    // Parse the CSV data - in driving data, HR is the heart rate column
    const parsedData = data.map(d => ({
        timestamp: +d.timestamp,
        student: d.subject,  // 'subject' in driving data corresponds to 'student'
        exam: fileDisplayName, // Use filename as 'exam' equivalent
        hr: +d.HR,           // 'HR' is the heart rate column
        // Also store other driving-specific data
        ecg: +d.ECG,
        emg: +d.EMG,
        footGSR: +(d['foot GSR'] || 0),
        handGSR: +(d['hand GSR'] || 0),
        resp: +d.RESP
    }));
    
    // Update app data
    app.data.all = parsedData;
    
    // Get unique subjects (drivers)
    const subjects = [...new Set(parsedData.map(d => d.student))];
    
    // Update UI headings - change "Exams" to "Metrics"
    document.querySelector('#student-list').previousElementSibling.textContent = 'Drivers';
    document.querySelector('#exam-list').previousElementSibling.textContent = 'Metrics';
    
    // Update student list (drivers)
    updateListItems('student-list', subjects, 'data-student');
    
    // For driving data, we'll use different metrics instead of exams
    const metrics = ['Heart Rate', 'ECG', 'EMG', 'Foot GSR', 'Hand GSR', 'Respiration'];
    updateListItems('exam-list', metrics, 'data-exam');
    
    // Reset to first subject and metric
    if (subjects.length > 0) {
        app.currentStudent = subjects[0];
        document.getElementById('current-student').textContent = subjects[0];
    }
    
    app.currentExam = 'Heart Rate'; // Default to heart rate
    
    // Reset playback and update visuals
    resetPlayback();
}

// Helper function to update list items
function updateListItems(listId, items, dataAttribute) {
    const list = document.getElementById(listId);
    list.innerHTML = '';
    
    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'collection-item' + (index === 0 ? ' active' : '');
        li.setAttribute(dataAttribute, item);
        li.textContent = item;
        list.appendChild(li);
        
        // Add click event listener
        li.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll(`#${listId} .collection-item`).forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
            
            // Update state
            if (dataAttribute === 'data-student') {
                app.currentStudent = item;
                document.getElementById('current-student').textContent = item;
            } else {
                app.currentExam = item;
            }
            
            // Reset playback and update visuals
            resetPlayback();
        });
    });
}

// Use sample data when CSV loading fails
function useSampleData() {
    app.data.all = generateSampleData();
    app.currentDataType = 'exam';
    
    // Update the UI
    const students = ['S1', 'S2', 'S3'];
    const exams = ['Midterm 1', 'Midterm 2', 'Final Exam'];
    
    updateListItems('student-list', students, 'data-student');
    updateListItems('exam-list', exams, 'data-exam');
    
    app.currentStudent = 'S1';
    app.currentExam = 'Midterm 1';
    
    document.getElementById('current-student').textContent = 'S1';
    document.getElementById('current-exam').textContent = 'Sample Data';
    
    resetPlayback();
}

// Generate sample data for demonstration
function generateSampleData() {
    const students = ['S1', 'S2', 'S3'];
    const exams = ['Midterm 1', 'Midterm 2', 'Final Exam'];
    const allData = [];
    
    students.forEach(student => {
        exams.forEach(exam => {
            // Generate unique patterns for each student/exam combination
            const baseData = [...sampleData];
            
            // Modify the data based on student/exam
            const factor = {
                'S1': { 'Midterm 1': 1.0, 'Midterm 2': 1.1, 'Final Exam': 1.2 },
                'S2': { 'Midterm 1': 0.9, 'Midterm 2': 1.05, 'Final Exam': 1.15 },
                'S3': { 'Midterm 1': 1.1, 'Midterm 2': 1.2, 'Final Exam': 1.3 }
            };
            
            // Pattern modifier functions
            const patternModifiers = {
                'S1': t => 1,
                'S2': t => 1 + 0.2 * Math.sin(t / 20),
                'S3': t => 1 + 0.15 * Math.cos(t / 30)
            };
            
            const modifiedData = baseData.map(item => {
                const f = factor[student][exam];
                const p = patternModifiers[student](item.timestamp);
                
                // Cap heart rate at reasonable values
                let hr = item.hr * f * p;
                hr = Math.min(220, Math.max(60, hr));
                
                return {
                    timestamp: item.timestamp,
                    student: student,
                    exam: exam,
                    hr: hr,
                    temp: item.temp
                };
            });
            
            allData.push(...modifiedData);
        });
    });
    
    return allData;
}

// Filter data based on current selection
function filterData() {
    if (app.currentDataType === 'exam') {
        // For exam data
        app.data.filtered = app.data.all.filter(
            item => item.student === app.currentStudent && item.exam === app.currentExam
        );
    } else if (app.currentDataType === 'driving') {
        // For driving data
        app.data.filtered = app.data.all.filter(
            item => item.student === app.currentStudent
        );
    } else {
        // Fallback
        app.data.filtered = app.data.all;
    }
}

// Initialize D3 chart
function initChart() {
    // Clear existing chart
    d3.select('#chart-container').selectAll('*').remove();
    
    // Set up dimensions
    const container = document.getElementById('chart-container');
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select('#chart-container')
        .append('svg')
        .attr('width', container.clientWidth)
        .attr('height', container.clientHeight)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Determine which metric to visualize based on current selection
    let yValue;
    let yLabel;
    
    if (app.currentDataType === 'driving' && app.currentExam !== 'Heart Rate') {
        // For driving data with different metrics
        switch (app.currentExam) {
            case 'ECG':
                yValue = d => d.ecg;
                yLabel = 'ECG';
                break;
            case 'EMG':
                yValue = d => d.emg;
                yLabel = 'EMG';
                break;
            case 'Foot GSR':
                yValue = d => d.footGSR;
                yLabel = 'Foot GSR';
                break;
            case 'Hand GSR':
                yValue = d => d.handGSR;
                yLabel = 'Hand GSR';
                break;
            case 'Respiration':
                yValue = d => d.resp;
                yLabel = 'Respiration';
                break;
            default:
                yValue = d => d.hr;
                yLabel = 'Heart Rate (BPM)';
        }
    } else {
        // Default to heart rate
        yValue = d => d.hr;
        yLabel = 'Heart Rate (BPM)';
    }
    
    // Set up scales
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(app.data.filtered, d => d.timestamp)])
        .range([0, width]);
        
    const yScale = d3.scaleLinear()
        .domain([
            d3.min(app.data.filtered, yValue) * 0.9,
            d3.max(app.data.filtered, yValue) * 1.1
        ])
        .range([height, 0]);
    
    // Create axes
    const xAxis = d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat(d => `${Math.floor(d)}s`);
        
    const yAxis = d3.axisLeft(yScale)
        .ticks(5);
    
    // Add X axis
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);
        
    // Add X axis label
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 5)
        .style('text-anchor', 'middle')
        .style('fill', '#b3b3b3')
        .text('Time (seconds)');
    
    // Add Y axis
    svg.append('g')
        .attr('class', 'axis')
        .call(yAxis);
        
    // Add Y axis label
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 15)
        .style('text-anchor', 'middle')
        .style('fill', '#b3b3b3')
        .text(yLabel);
    
    // Create line generator
    const lineGenerator = d3.line()
        .x(d => xScale(d.timestamp))
        .y(d => yScale(yValue(d)))
        .curve(d3.curveMonotoneX);
    
    // Add the data line
    svg.append('path')
        .datum(app.data.filtered)
        .attr('class', 'heart-rate-line')
        .attr('d', lineGenerator);
    
    // Add current position vertical line
    svg.append('line')
        .attr('class', 'current-time-line')
        .attr('id', 'current-time-line')
        .attr('x1', xScale(app.currentTime))
        .attr('y1', 0)
        .attr('x2', xScale(app.currentTime))
        .attr('y2', height);
    
    // Create chart overlay for hover interactions
    const tooltip = d3.select('#chart-tooltip');
    
    svg.append('rect')
        .attr('class', 'chart-overlay')
        .attr('width', width)
        .attr('height', height)
        .style('opacity', 0)
        .on('mousemove', function(event) {
            const [mouseX] = d3.pointer(event);
            const timestamp = xScale.invert(mouseX);
            
            // Find the closest data point
            const bisect = d3.bisector(d => d.timestamp).left;
            const index = bisect(app.data.filtered, timestamp);
            const d0 = app.data.filtered[Math.max(0, index - 1)];
            const d1 = app.data.filtered[Math.min(app.data.filtered.length - 1, index)];
            const d = (d0 && d1) ? (timestamp - d0.timestamp > d1.timestamp - timestamp ? d1 : d0) : null;
            
            if (d) {
                // Get value based on current metric
                const value = yValue(d);
                
                tooltip
                    .classed('hidden', false)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 30}px`)
                    .html(`Time: ${d.timestamp.toFixed(1)}s<br>${yLabel}: ${value.toFixed(2)}`);
                    
                // Highlight the data point
                svg.selectAll('.hover-point').remove();
                svg.append('circle')
                    .attr('class', 'hover-point')
                    .attr('cx', xScale(d.timestamp))
                    .attr('cy', yScale(value))
                    .attr('r', 5)
                    .attr('fill', '#1db954');
            }
        })
        .on('mouseout', function() {
            tooltip.classed('hidden', true);
            svg.selectAll('.hover-point').remove();
        });
    
    // Store chart information for later use
    app.chart.svg = svg;
    app.chart.width = width;
    app.chart.height = height;
    app.chart.xScale = xScale;
    app.chart.yScale = yScale;
    app.chart.lineGenerator = lineGenerator;
}

// Update waveform visualization
function updateWaveform() {
    const container = document.getElementById('waveform-bars');
    container.innerHTML = '';
    
    // Get current heart rate for display
    const currentValue = getCurrentValue();
    const displayLabel = app.currentDataType === 'driving' && app.currentExam !== 'Heart Rate' 
        ? app.currentExam 
        : 'Heart Rate';
    
    document.getElementById('heart-rate-display').textContent = `${displayLabel}: ${currentValue.toFixed(1)}`;
    
    // Find the current index in the data
    const timeStep = app.data.filtered.length > 0 
        ? (app.data.filtered[1]?.timestamp - app.data.filtered[0]?.timestamp) || 10 
        : 10;
    
    const currentIndex = Math.floor(app.currentTime / timeStep);
    
    // Define visible range (how many bars to show)
    const visibleRange = 20;
    const startIdx = Math.max(0, currentIndex - visibleRange);
    const endIdx = Math.min(app.data.filtered.length - 1, currentIndex + visibleRange);
    
    // Find min/max values for normalization
    let minValue, maxValue;
    
    if (app.currentDataType === 'driving' && app.currentExam !== 'Heart Rate') {
        // For different metrics, find appropriate ranges
        switch (app.currentExam) {
            case 'ECG':
                minValue = d3.min(app.data.filtered, d => d.ecg);
                maxValue = d3.max(app.data.filtered, d => d.ecg);
                break;
            case 'EMG':
                minValue = d3.min(app.data.filtered, d => d.emg);
                maxValue = d3.max(app.data.filtered, d => d.emg);
                break;
            case 'Foot GSR':
                minValue = d3.min(app.data.filtered, d => d.footGSR);
                maxValue = d3.max(app.data.filtered, d => d.footGSR);
                break;
            case 'Hand GSR':
                minValue = d3.min(app.data.filtered, d => d.handGSR);
                maxValue = d3.max(app.data.filtered, d => d.handGSR);
                break;
            case 'Respiration':
                minValue = d3.min(app.data.filtered, d => d.resp);
                maxValue = d3.max(app.data.filtered, d => d.resp);
                break;
            default:
                minValue = 60;
                maxValue = 200;
        }
    } else {
        // Default heart rate range
        minValue = 60;
        maxValue = 200;
    }
    
    // Create waveform bars
    for (let i = startIdx; i <= endIdx; i++) {
        if (i < 0 || i >= app.data.filtered.length) continue;
        
        const dataPoint = app.data.filtered[i];
        const distanceFromCurrent = Math.abs(i - currentIndex);
        const opacity = 1 - (distanceFromCurrent / (visibleRange + 2));
        
        // Get the value for the current metric
        let value;
        if (app.currentDataType === 'driving' && app.currentExam !== 'Heart Rate') {
            switch (app.currentExam) {
                case 'ECG': value = dataPoint.ecg; break;
                case 'EMG': value = dataPoint.emg; break;
                case 'Foot GSR': value = dataPoint.footGSR; break;
                case 'Hand GSR': value = dataPoint.handGSR; break;
                case 'Respiration': value = dataPoint.resp; break;
                default: value = dataPoint.hr;
            }
        } else {
            value = dataPoint.hr;
        }
        
        // Normalize value between 0-1
        const normalizedValue = (value - minValue) / (maxValue - minValue);
        
        // Calculate height between 5-80px
        const height = Math.max(5, normalizedValue * 80);
        
        // Create bar element
        const bar = document.createElement('div');
        bar.className = 'waveform-bar';
        bar.style.height = `${height}px`;
        bar.style.opacity = Math.max(0.2, opacity);
        
        // Highlight current bar
        if (i === currentIndex) {
            bar.style.backgroundColor = '#1db954';
            bar.style.width = '6px';
        } else {
            bar.style.backgroundColor = '#4a90e2';
        }
        
        container.appendChild(bar);
    }
}

// Get current value based on current time and metric
function getCurrentValue() {
    if (app.data.filtered.length === 0) return 0;
    
    // Find time step from data
    const timeStep = app.data.filtered.length > 1 
        ? (app.data.filtered[1].timestamp - app.data.filtered[0].timestamp) 
        : 10;
    
    // Find closest index
    const index = Math.min(
        app.data.filtered.length - 1,
        Math.max(0, Math.floor(app.currentTime / timeStep))
    );
    
    const dataPoint = app.data.filtered[index];
    
    // Return value based on current metric
    if (app.currentDataType === 'driving' && app.currentExam !== 'Heart Rate') {
        switch (app.currentExam) {
            case 'ECG': return dataPoint.ecg;
            case 'EMG': return dataPoint.emg;
            case 'Foot GSR': return dataPoint.footGSR;
            case 'Hand GSR': return dataPoint.handGSR;
            case 'Respiration': return dataPoint.resp;
            default: return dataPoint.hr;
        }
    }
    
    return dataPoint.hr;
}

// Update timeline and time display
function updateTimeDisplay() {
    const currentTime = app.currentTime;
    const maxTime = app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0;
    
    // Format times
    document.getElementById('current-time').textContent = formatTime(currentTime);
    document.getElementById('total-time').textContent = formatTime(maxTime);
    
    // Update progress bar
    const progress = (maxTime > 0) ? (currentTime / maxTime) * 100 : 0;
    document.getElementById('timeline-progress').style.width = `${progress}%`;
}

// Format seconds to MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Toggle playback (play/pause)
function togglePlayback() {
    app.isPlaying = !app.isPlaying;
    
    // Update button state
    document.getElementById('play-icon').classList.toggle('hidden', app.isPlaying);
    document.getElementById('pause-icon').classList.toggle('hidden', !app.isPlaying);
    
    if (app.isPlaying) {
        // Reset if at the end
        const maxTime = app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0;
        if (app.currentTime >= maxTime) {
            setCurrentTime(0);
        }
        
        // Start playback
        app.playbackInterval = setInterval(() => {
            const maxTime = app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0;
            if (app.currentTime >= maxTime) {
                stopPlayback();
            } else {
                // Determine playback speed based on data density
                const timeStep = app.data.filtered.length > 1 
                    ? (app.data.filtered[1].timestamp - app.data.filtered[0].timestamp) 
                    : 5;
                
                setCurrentTime(app.currentTime + timeStep);
            }
        }, 250); // Update every 250ms (playback speed is faster than real-time)
    } else {
        stopPlayback();
    }
}

// Stop playback
function stopPlayback() {
    clearInterval(app.playbackInterval);
    app.isPlaying = false;
    document.getElementById('play-icon').classList.remove('hidden');
    document.getElementById('pause-icon').classList.add('hidden');
}

// Skip time forward or backward
function skipTime(seconds) {
    const maxTime = app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0;
    const newTime = Math.max(0, Math.min(maxTime, app.currentTime + seconds));
    setCurrentTime(newTime);
}

// Set current time and update visuals
function setCurrentTime(time) {
    app.currentTime = time;
    
    // Update time display and progress bar
    updateTimeDisplay();
    
    // Update waveform visualization
    updateWaveform();
    
    // Update position line in chart
    if (app.chart.svg && app.chart.xScale) {
        const x = app.chart.xScale(time);
        d3.select('#current-time-line')
            .attr('x1', x)
            .attr('x2', x);
    }
}

// Reset playback when changing student or exam
function resetPlayback() {
    // Stop any active playback
    stopPlayback();
    
    // Reset time to start
    app.currentTime = 0;
    
    // Filter data for the new selection
    filterData();
    
    // Update visualizations
    initChart();
    updateWaveform();
    updateTimeDisplay();
}

// Set up event listeners
function setupEventListeners() {
    // Play/pause button
    document.getElementById('play-btn').addEventListener('click', togglePlayback);
    
    // Skip forward/backward
    document.getElementById('skip-forward-btn').addEventListener('click', () => skipTime(30));
    document.getElementById('skip-back-btn').addEventListener('click', () => skipTime(-30));
    
    // Timeline click
    document.getElementById('timeline').addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / rect.width;
        
        // Calculate new time position
        const maxTime = app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0;
        setCurrentTime(Math.floor(ratio * maxTime));
    });
    
    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        initChart();
        updateWaveform();
    }, 250));
}

// Utility function: Debounce to limit function calls (for resize events)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add a favicon to prevent 404 error
function addFavicon() {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 4L10.5 9.5L5 11L10.5 12.5L12 18L13.5 12.5L19 11L13.5 9.5L12 4Z" fill="%231db954"/></svg>';
    document.head.appendChild(link);
}

// Initialize the application when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add favicon to prevent 404 error
    addFavicon();
    
    // Set up event listeners
    setupEventListeners();
    
    // Scan for CSV files in the data directory
    scanDataDirectory();
});