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
        files: [] // Array to store available CSV files (scanned from data/ folder)
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
    // ... add more sample data points if you want ...
];

/**
 * Attempt to scan the `data/` folder for CSV files by fetching its listing (or an `index.html`).
 * This will only work if your server actually returns a directory listing or has a `data/index.html` with <a> links.
 */
async function scanDataDirectory() {
    try {
        // Show loading indicator
        document.getElementById('loading-indicator').classList.remove('hidden');
        
        // Fetch the directory listing at "data/"
        // or "data/index.html" if that's how your server is set up
        const response = await fetch('data/');
        const html = await response.text();
        
        // Parse the returned HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract all <a> elements
        const links = Array.from(doc.querySelectorAll('a'));
        
        // Filter to find only .csv links
        const csvFiles = links
            .filter(link => link.href.endsWith('.csv'))
            .map(link => {
                // Because link.href could be absolute or relative, parse it
                const url = new URL(link.href, window.location.origin);
                const filename = url.pathname.split('/').pop(); // get the last part
                
                return {
                    name: filename,
                    path: `data/${filename}` // relative path to the CSV in data/
                };
            });
        
        // Store these files in the app state
        app.data.files = csvFiles;
        
        // Update the file list in the UI
        updateFileList(csvFiles);
        
        // Hide loading indicator
        document.getElementById('loading-indicator').classList.add('hidden');
        
        // If we found any CSV files, load the first one
        if (csvFiles.length > 0) {
            loadCSVFile(csvFiles[0].path);
        } else {
            console.warn('No CSV files found in the data/ folder. Using sample data instead.');
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
    // In your HTML, you need a <ul> or <div> with id="file-list"
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';
    
    files.forEach((file, index) => {
        const li = document.createElement('li');
        li.className = 'collection-item' + (index === 0 ? ' active' : '');
        li.setAttribute('data-file', file.path);

        // Create a more readable name (remove .csv extension, underscores, etc.)
        const displayName = file.name.replace('.csv', '').replace(/_/g, ' ');
        li.textContent = displayName;

        fileList.appendChild(li);

        // Add click event listener to load that file
        li.addEventListener('click', function() {
            // Update active state in UI
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

// Load a specific CSV file using d3.csv()
function loadCSVFile(filePath) {
    // Show loading indicator
    document.getElementById('loading-indicator').classList.remove('hidden');

    // Remember current file path
    app.currentFile = filePath;

    // Update heading to show the name of the CSV
    const fileDisplayName = filePath.split('/').pop().replace('.csv', '').replace(/_/g, ' ');
    document.getElementById('current-exam').textContent = fileDisplayName;

    // Use d3 to fetch & parse CSV
    d3.csv(filePath)
        .then(data => {
            // Determine data format by checking column headers
            const headers = Object.keys(data[0]);

            if (headers.includes('exam') && headers.includes('student')) {
                // exam data format
                processExamData(data, fileDisplayName);
                app.currentDataType = 'exam';
            } else if (headers.includes('HR') && headers.includes('subject')) {
                // driving data format
                processDrivingData(data, fileDisplayName);
                app.currentDataType = 'driving';
            } else {
                throw new Error('Unknown CSV format. Expected exam or driving data columns.');
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

// -------------------
// Exam data handling
// -------------------
function processExamData(data, fileDisplayName) {
    // Convert strings to numbers where appropriate
    const parsedData = data.map(d => ({
        timestamp: +d.timestamp,
        student: d.student,
        exam: d.exam,
        hr: +d.hr,
        temp: +d.temp
    }));
    
    // Save to global state
    app.data.all = parsedData;

    // Get unique students & exams
    const students = [...new Set(parsedData.map(d => d.student))];
    const exams = [...new Set(parsedData.map(d => d.exam))];

    // Update UI headings for "Students" and "Exams"
    document.querySelector('#student-list').previousElementSibling.textContent = 'Students';
    document.querySelector('#exam-list').previousElementSibling.textContent = 'Exams';

    // Populate students in the sidebar
    updateListItems('student-list', students, 'data-student');

    // Populate exams in the sidebar
    updateListItems('exam-list', exams, 'data-exam');

    // Default selection
    if (students.length > 0) {
        app.currentStudent = students[0];
        document.getElementById('current-student').textContent = students[0];
    }
    if (exams.length > 0) {
        app.currentExam = exams[0];
    }

    // Reset time, charts, waveforms
    resetPlayback();
}

// ----------------------
// Driving data handling
// ----------------------
function processDrivingData(data, fileDisplayName) {
    const parsedData = data.map(d => ({
        timestamp: +d.timestamp,
        student: d.subject,   // 'subject' => 'student'
        exam: fileDisplayName, 
        hr: +d.HR,
        ecg: +d.ECG,
        emg: +d.EMG,
        footGSR: +(d['foot GSR'] || 0),
        handGSR: +(d['hand GSR'] || 0),
        resp: +d.RESP
    }));

    app.data.all = parsedData;

    // Unique subjects => "drivers"
    const subjects = [...new Set(parsedData.map(d => d.student))];

    // Adjust UI headings
    document.querySelector('#student-list').previousElementSibling.textContent = 'Drivers';
    document.querySelector('#exam-list').previousElementSibling.textContent = 'Metrics';

    // Populate drivers
    updateListItems('student-list', subjects, 'data-student');

    // Hardcode metrics for driving data
    const metrics = ['Heart Rate', 'ECG', 'EMG', 'Foot GSR', 'Hand GSR', 'Respiration'];
    updateListItems('exam-list', metrics, 'data-exam');

    // Default selection
    if (subjects.length > 0) {
        app.currentStudent = subjects[0];
        document.getElementById('current-student').textContent = subjects[0];
    }
    app.currentExam = 'Heart Rate'; // default

    resetPlayback();
}

// ----------------------
// UI List Helper
// ----------------------
function updateListItems(listId, items, dataAttribute) {
    const list = document.getElementById(listId);
    list.innerHTML = '';

    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'collection-item' + (index === 0 ? ' active' : '');
        li.setAttribute(dataAttribute, item);
        li.textContent = item;
        list.appendChild(li);

        li.addEventListener('click', () => {
            // Clear any existing "active" items
            document.querySelectorAll(`#${listId} .collection-item`).forEach(el => {
                el.classList.remove('active');
            });
            li.classList.add('active');

            // Update global state
            if (dataAttribute === 'data-student') {
                app.currentStudent = item;
                document.getElementById('current-student').textContent = item;
            } else {
                app.currentExam = item;
            }

            resetPlayback();
        });
    });
}

// ----------------------
// Sample Data Fallback
// ----------------------
function useSampleData() {
    app.data.all = generateSampleData(); // generate bigger sample set
    app.currentDataType = 'exam';

    // Fake “Students” and “Exams”
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

// Generate synthetic sample data
function generateSampleData() {
    const students = ['S1', 'S2', 'S3'];
    const exams = ['Midterm 1', 'Midterm 2', 'Final Exam'];
    const allData = [];

    // Reuse base sampleData but replicate for multiple students/exams
    students.forEach(student => {
        exams.forEach(exam => {
            // Clone the sampleData array
            const baseData = [...sampleData];

            // Variation factors
            const factor = {
                'S1': { 'Midterm 1': 1.0, 'Midterm 2': 1.1, 'Final Exam': 1.2 },
                'S2': { 'Midterm 1': 0.9, 'Midterm 2': 1.05, 'Final Exam': 1.15 },
                'S3': { 'Midterm 1': 1.1, 'Midterm 2': 1.2, 'Final Exam': 1.3 }
            };
            const patternModifiers = {
                'S1': t => 1,
                'S2': t => 1 + 0.2 * Math.sin(t / 20),
                'S3': t => 1 + 0.15 * Math.cos(t / 30)
            };

            // Generate a new array with slight modifications
            const modifiedData = baseData.map(item => {
                const f = factor[student][exam];
                const p = patternModifiers[student](item.timestamp);
                let hr = item.hr * f * p;
                hr = Math.min(220, Math.max(60, hr)); // clamp

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
        // exam data
        app.data.filtered = app.data.all.filter(
            item => item.student === app.currentStudent && item.exam === app.currentExam
        );
    } else if (app.currentDataType === 'driving') {
        // driving data
        app.data.filtered = app.data.all.filter(
            item => item.student === app.currentStudent
        );
    } else {
        app.data.filtered = app.data.all;
    }
}

// Initialize D3 chart
function initChart() {
    d3.select('#chart-container').selectAll('*').remove();

    const container = document.getElementById('chart-container');
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    const svg = d3.select('#chart-container')
        .append('svg')
        .attr('width', container.clientWidth)
        .attr('height', container.clientHeight)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Decide what metric to plot
    let yValue;
    let yLabel;

    if (app.currentDataType === 'driving' && app.currentExam !== 'Heart Rate') {
        switch (app.currentExam) {
            case 'ECG':        yValue = d => d.ecg;      yLabel = 'ECG';        break;
            case 'EMG':        yValue = d => d.emg;      yLabel = 'EMG';        break;
            case 'Foot GSR':   yValue = d => d.footGSR;  yLabel = 'Foot GSR';   break;
            case 'Hand GSR':   yValue = d => d.handGSR;  yLabel = 'Hand GSR';   break;
            case 'Respiration':yValue = d => d.resp;     yLabel = 'Respiration';break;
            default:           yValue = d => d.hr;       yLabel = 'Heart Rate (BPM)';
        }
    } else {
        // default to heart rate
        yValue = d => d.hr;
        yLabel = 'Heart Rate (BPM)';
    }

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(app.data.filtered, d => d.timestamp)])
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .domain([
            d3.min(app.data.filtered, yValue) * 0.9,
            d3.max(app.data.filtered, yValue) * 1.1
        ])
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat(d => `${Math.floor(d)}s`);
    const yAxis = d3.axisLeft(yScale)
        .ticks(5);

    // X axis
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);

    svg.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 5)
        .style('text-anchor', 'middle')
        .style('fill', '#b3b3b3')
        .text('Time (seconds)');

    // Y axis
    svg.append('g')
        .attr('class', 'axis')
        .call(yAxis);

    svg.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 15)
        .style('text-anchor', 'middle')
        .style('fill', '#b3b3b3')
        .text(yLabel);

    // Line generator
    const lineGenerator = d3.line()
        .x(d => xScale(d.timestamp))
        .y(d => yScale(yValue(d)))
        .curve(d3.curveMonotoneX);

    // Add data line
    svg.append('path')
        .datum(app.data.filtered)
        .attr('class', 'heart-rate-line')
        .attr('d', lineGenerator);

    // Vertical line for current time
    svg.append('line')
        .attr('class', 'current-time-line')
        .attr('id', 'current-time-line')
        .attr('x1', xScale(app.currentTime))
        .attr('y1', 0)
        .attr('x2', xScale(app.currentTime))
        .attr('y2', height);

    // Tooltip
    const tooltip = d3.select('#chart-tooltip');

    // Overlay for hover events
    svg.append('rect')
        .attr('class', 'chart-overlay')
        .attr('width', width)
        .attr('height', height)
        .style('opacity', 0)
        .on('mousemove', function(event) {
            const [mouseX] = d3.pointer(event);
            const timestamp = xScale.invert(mouseX);

            // Find nearest data point
            const bisect = d3.bisector(d => d.timestamp).left;
            const index = bisect(app.data.filtered, timestamp);
            const d0 = app.data.filtered[Math.max(0, index - 1)];
            const d1 = app.data.filtered[Math.min(app.data.filtered.length - 1, index)];
            const d = (d0 && d1) 
                ? (timestamp - d0.timestamp > d1.timestamp - timestamp ? d1 : d0)
                : null;

            if (d) {
                const value = yValue(d);
                
                tooltip
                    .classed('hidden', false)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 30}px`)
                    .html(`Time: ${d.timestamp.toFixed(1)}s<br>${yLabel}: ${value.toFixed(2)}`);

                // Highlight data point
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

    // Store chart objects
    app.chart.svg = svg;
    app.chart.width = width;
    app.chart.height = height;
    app.chart.xScale = xScale;
    app.chart.yScale = yScale;
    app.chart.lineGenerator = lineGenerator;
}

// Update the waveform visualization
function updateWaveform() {
    const container = document.getElementById('waveform-bars');
    container.innerHTML = '';

    // Current numeric value
    const currentValue = getCurrentValue();
    const displayLabel = (app.currentDataType === 'driving' && app.currentExam !== 'Heart Rate')
        ? app.currentExam
        : 'Heart Rate';
    document.getElementById('heart-rate-display').textContent = `${displayLabel}: ${currentValue.toFixed(1)}`;

    // Current index
    const timeStep = app.data.filtered.length > 1
        ? (app.data.filtered[1].timestamp - app.data.filtered[0].timestamp)
        : 10;
    const currentIndex = Math.floor(app.currentTime / timeStep);

    // Show ~20 bars to the left/right
    const visibleRange = 20;
    const startIdx = Math.max(0, currentIndex - visibleRange);
    const endIdx = Math.min(app.data.filtered.length - 1, currentIndex + visibleRange);

    // Find min/max for normalization
    let minValue, maxValue;
    if (app.currentDataType === 'driving' && app.currentExam !== 'Heart Rate') {
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

    // Create bars
    for (let i = startIdx; i <= endIdx; i++) {
        if (i < 0 || i >= app.data.filtered.length) continue;

        const dataPoint = app.data.filtered[i];
        const distanceFromCurrent = Math.abs(i - currentIndex);
        const opacity = 1 - (distanceFromCurrent / (visibleRange + 2));

        // Extract the current metric
        let value;
        if (app.currentDataType === 'driving' && app.currentExam !== 'Heart Rate') {
            switch (app.currentExam) {
                case 'ECG':        value = dataPoint.ecg;      break;
                case 'EMG':        value = dataPoint.emg;      break;
                case 'Foot GSR':   value = dataPoint.footGSR;  break;
                case 'Hand GSR':   value = dataPoint.handGSR;  break;
                case 'Respiration':value = dataPoint.resp;     break;
                default:           value = dataPoint.hr;
            }
        } else {
            value = dataPoint.hr;
        }

        // Normalize between 0..1
        const normalizedValue = (value - minValue) / (maxValue - minValue);
        const barHeight = Math.max(5, normalizedValue * 80);

        const bar = document.createElement('div');
        bar.className = 'waveform-bar';
        bar.style.height = `${barHeight}px`;
        bar.style.opacity = Math.max(0.2, opacity);

        // Highlight the current bar
        if (i === currentIndex) {
            bar.style.backgroundColor = '#1db954';
            bar.style.width = '6px';
        } else {
            bar.style.backgroundColor = '#4a90e2';
        }
        container.appendChild(bar);
    }
}

// Get the current metric value based on currentTime
function getCurrentValue() {
    if (app.data.filtered.length === 0) return 0;

    const timeStep = app.data.filtered.length > 1
        ? (app.data.filtered[1].timestamp - app.data.filtered[0].timestamp)
        : 10;
    const index = Math.min(
        app.data.filtered.length - 1,
        Math.max(0, Math.floor(app.currentTime / timeStep))
    );
    const dataPoint = app.data.filtered[index];

    if (app.currentDataType === 'driving' && app.currentExam !== 'Heart Rate') {
        switch (app.currentExam) {
            case 'ECG':        return dataPoint.ecg;
            case 'EMG':        return dataPoint.emg;
            case 'Foot GSR':   return dataPoint.footGSR;
            case 'Hand GSR':   return dataPoint.handGSR;
            case 'Respiration':return dataPoint.resp;
            default:           return dataPoint.hr;
        }
    }
    return dataPoint.hr;
}

// Update time display and timeline progress
function updateTimeDisplay() {
    const currentTime = app.currentTime;
    const maxTime = app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0;

    document.getElementById('current-time').textContent = formatTime(currentTime);
    document.getElementById('total-time').textContent = formatTime(maxTime);

    const progress = (maxTime > 0) ? (currentTime / maxTime) * 100 : 0;
    document.getElementById('timeline-progress').style.width = `${progress}%`;
}

// Convert seconds to M:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Toggle play/pause
function togglePlayback() {
    app.isPlaying = !app.isPlaying;
    
    document.getElementById('play-icon').classList.toggle('hidden', app.isPlaying);
    document.getElementById('pause-icon').classList.toggle('hidden', !app.isPlaying);

    if (app.isPlaying) {
        // if at end, reset
        const maxTime = app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0;
        if (app.currentTime >= maxTime) {
            setCurrentTime(0);
        }

        app.playbackInterval = setInterval(() => {
            const maxTime = app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0;
            if (app.currentTime >= maxTime) {
                stopPlayback();
            } else {
                // playback steps
                const timeStep = app.data.filtered.length > 1
                    ? (app.data.filtered[1].timestamp - app.data.filtered[0].timestamp)
                    : 5;
                setCurrentTime(app.currentTime + timeStep);
            }
        }, 250);
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

// Skip forward/back
function skipTime(seconds) {
    const maxTime = app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0;
    const newTime = Math.max(0, Math.min(maxTime, app.currentTime + seconds));
    setCurrentTime(newTime);
}

// Update the current time in the app and update visuals
function setCurrentTime(time) {
    app.currentTime = time;
    updateTimeDisplay();
    updateWaveform();

    // Move the vertical line
    if (app.chart.xScale) {
        const x = app.chart.xScale(time);
        d3.select('#current-time-line')
            .attr('x1', x)
            .attr('x2', x);
    }
}

// Reset playback when we change student or exam
function resetPlayback() {
    stopPlayback();
    app.currentTime = 0;
    filterData();
    initChart();
    updateWaveform();
    updateTimeDisplay();
}

// Basic event listeners
function setupEventListeners() {
    document.getElementById('play-btn').addEventListener('click', togglePlayback);
    document.getElementById('skip-forward-btn').addEventListener('click', () => skipTime(30));
    document.getElementById('skip-back-btn').addEventListener('click', () => skipTime(-30));
    
    // Timeline click
    document.getElementById('timeline').addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / rect.width;
        const maxTime = app.data.filtered[app.data.filtered.length - 1]?.timestamp || 0;
        setCurrentTime(Math.floor(ratio * maxTime));
    });

    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        initChart();
        updateWaveform();
    }, 250));
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Optional: add a favicon in case your server complains about 404 on favicon.ico
function addFavicon() {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" ...>...</svg>';
    document.head.appendChild(link);
}

// ---------------------------------------------------------
// Initialize the app on DOMContentLoaded
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    addFavicon();
    setupEventListeners();
    
    // Attempt to scan the data/ directory for CSV files
    scanDataDirectory();
});
