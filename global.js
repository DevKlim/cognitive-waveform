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
 * Use data.json to find CSV files with GitHub Pages compatibility
 */
async function scanDataDirectory() {
    try {
        // Show loading indicator
        document.getElementById('loading-indicator').classList.remove('hidden');
        
        // First try the data.json approach
        try {
            // Get the base URL for the repository
            const repoUrl = new URL('.', window.location.href).href;
            console.log('Repository base URL:', repoUrl);
            
            const response = await fetch(new URL('data.json', repoUrl).href);
            if (response.ok) {
                const data = await response.json();
                
                if (data.files && data.files.length > 0) {
                    console.log('Found files in data.json:', data.files);
                    
                    // Map the files to our expected format
                    const csvFiles = data.files.map(file => ({
                        name: file.displayName || file.name.replace('.csv', '').replace(/_/g, ' '),
                        path: new URL(file.path, repoUrl).href
                    }));
                    
                    app.data.files = csvFiles;
                    updateFileList(csvFiles);
                    
                    // Load the first file
                    if (csvFiles.length > 0) {
                        loadCSVFile(csvFiles[0].path);
                        document.getElementById('loading-indicator').classList.add('hidden');
                        return;
                    }
                }
            } else {
                console.warn('data.json not found or invalid, trying fallback methods');
            }
        } catch (error) {
            console.warn('Error with data.json approach:', error);
        }
        
        // Try traditional directory listing (works locally but not on GitHub Pages)
        try {
            const repoUrl = new URL('.', window.location.href).href;
            const response = await fetch(new URL('data/', repoUrl).href);
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
                        name: filename.replace('.csv', '').replace(/_/g, ' '),
                        path: link.href
                    };
                });
            
            // Store these files in the app state
            if (csvFiles.length > 0) {
                app.data.files = csvFiles;
                updateFileList(csvFiles);
                loadCSVFile(csvFiles[0].path);
                document.getElementById('loading-indicator').classList.add('hidden');
                return;
            }
        } catch (error) {
            console.warn('Directory listing failed:', error);
        }
        
        // Try hardcoded known files based on your datasets
        try {
            const repoUrl = new URL('.', window.location.href).href;
            const knownFiles = [
                'driving_clean_data.csv',
                'exam_dataset.csv',
                'exam_dataset_10s.csv'
            ];
            
            const csvFiles = [];
            for (const filename of knownFiles) {
                try {
                    // Just check if the file exists
                    const fileUrl = new URL(`data/${filename}`, repoUrl).href;
                    const response = await fetch(fileUrl, { method: 'HEAD' });
                    
                    if (response.ok) {
                        const displayName = filename.replace('.csv', '').replace(/_/g, ' ');
                        csvFiles.push({
                            name: displayName,
                            path: fileUrl
                        });
                        console.log(`Found file: ${filename}`);
                    }
                } catch (err) {
                    console.warn(`File ${filename} test failed:`, err);
                }
            }
            
            if (csvFiles.length > 0) {
                app.data.files = csvFiles;
                updateFileList(csvFiles);
                loadCSVFile(csvFiles[0].path);
                document.getElementById('loading-indicator').classList.add('hidden');
                return;
            }
        } catch (error) {
            console.warn('Error with hardcoded files approach:', error);
        }
        
        // If all else fails, use sample data
        console.warn('No CSV files found. Using sample data instead.');
        useSampleData();
        document.getElementById('loading-indicator').classList.add('hidden');
        
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

        // Display name is already formatted in our file objects
        li.textContent = file.name;

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
    const filename = new URL(filePath).pathname.split('/').pop();
    const fileDisplayName = filename.replace('.csv', '').replace(/_/g, ' ');
    document.getElementById('current-exam').textContent = fileDisplayName;

    console.log('Loading CSV from:', filePath);

    // Use d3 to fetch & parse CSV
    d3.csv(filePath)
        .then(data => {
            // Check if we got valid data
            if (!data || data.length === 0 || !Object.keys(data[0]).length) {
                throw new Error('CSV file is empty or invalid');
            }
            
            console.log('CSV loaded successfully with headers:', Object.keys(data[0]));
            
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

    // Fake "Students" and "Exams"
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

// Update the waveform visualization - IMPROVED VERSION
function updateWaveform() {
    const container = document.getElementById('waveform-bars');
    container.innerHTML = '';
    
    // Get current value for display
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
    const visibleRange = 40; // More bars for a denser waveform look
    const startIdx = Math.max(0, currentIndex - visibleRange);
    const endIdx = Math.min(app.data.filtered.length - 1, currentIndex + visibleRange);
    
    // Add center line first
    const centerLine = document.createElement('div');
    centerLine.className = 'waveform-center-line';
    container.appendChild(centerLine);
    
    // Create parent container for the waveform
    const waveformContainer = document.createElement('div');
    waveformContainer.className = 'waveform-animation';
    
    // Get value getter based on current metric
    let valueGetter;
    if (app.currentDataType === 'driving' && app.currentExam !== 'Heart Rate') {
        switch (app.currentExam) {
            case 'ECG': valueGetter = d => d.ecg; break;
            case 'EMG': valueGetter = d => d.emg; break;
            case 'Foot GSR': valueGetter = d => d.footGSR; break;
            case 'Hand GSR': valueGetter = d => d.handGSR; break;
            case 'Respiration': valueGetter = d => d.resp; break;
            default: valueGetter = d => d.hr;
        }
    } else {
        valueGetter = d => d.hr;
    }
    
    // Get min/max values
    const minValue = d3.min(app.data.filtered, valueGetter);
    const maxValue = d3.max(app.data.filtered, valueGetter);
    
    // Detect significant jumps
    const jumpThreshold = (maxValue - minValue) * 0.15;
    const jumps = [];
    
    for (let i = 1; i < app.data.filtered.length; i++) {
        const current = valueGetter(app.data.filtered[i]);
        const previous = valueGetter(app.data.filtered[i-1]);
        const change = Math.abs(current - previous);
        
        if (change > jumpThreshold) {
            jumps.push(i);
        }
    }
    
    // Create bars for the waveform
    const barWidth = 3; // Width of each bar
    const barGap = 1; // Gap between bars
    const maxBarHeight = 200; // Maximum height for a bar (in pixels)
    
    // Calculate total width for all bars
    const totalWidth = (barWidth + barGap) * (endIdx - startIdx + 1);
    const containerWidth = container.clientWidth;
    const startOffset = (containerWidth - totalWidth) / 2;
    
    for (let i = startIdx; i <= endIdx; i++) {
        if (i < 0 || i >= app.data.filtered.length) continue;
        
        const dataPoint = app.data.filtered[i];
        const distanceFromCurrent = Math.abs(i - currentIndex);
        const opacity = 1 - (distanceFromCurrent / (visibleRange + 10));
        
        // Get the value for this data point
        const value = valueGetter(dataPoint);
        
        // Check for jump point
        const isJumpPoint = jumps.includes(i);
        
        // Normalize value between 0-1 with slight exaggeration
        const exaggerationFactor = 1.4;
        let normalizedValue = (value - minValue) / (maxValue - minValue);
        
        // Apply moderate exaggeration to make pattern more visible
        normalizedValue = Math.pow(normalizedValue, 1/exaggerationFactor);
        
        // Calculate bar height - split into top and bottom bars
        const barHeight = Math.max(2, normalizedValue * maxBarHeight / 2);
        
        // Calculate position
        const leftPosition = startOffset + ((i - startIdx) * (barWidth + barGap));
        
        // Top bar (above center line)
        const topBar = document.createElement('div');
        topBar.className = 'waveform-bar top-bar';
        topBar.style.width = `${barWidth}px`;
        topBar.style.height = `${barHeight}px`;
        topBar.style.left = `${leftPosition}px`;
        topBar.style.opacity = Math.max(0.25, opacity);
        
        // Bottom bar (mirror of top bar)
        const bottomBar = document.createElement('div');
        bottomBar.className = 'waveform-bar bottom-bar';
        bottomBar.style.width = `${barWidth}px`;
        bottomBar.style.height = `${barHeight}px`;
        bottomBar.style.left = `${leftPosition}px`;
        bottomBar.style.opacity = Math.max(0.25, opacity);
        
        // Style based on whether this is a jump point, current position, or regular bar
        let barColor, barGlow;
        
        if (i === currentIndex) {
            // Current position - bright green with glow
            barColor = '#1db954';
            barGlow = '0 0 6px rgba(29, 185, 84, 0.7)';
            topBar.style.width = `${barWidth + 1}px`;
            bottomBar.style.width = `${barWidth + 1}px`;
        } else if (isJumpPoint) {
            // Jump points - red with subtle glow
            barColor = '#ff6b6b';
            barGlow = '0 0 4px rgba(255, 107, 107, 0.6)';
        } else {
            // Regular points - blue gradient based on value
            const hue = 210 + (normalizedValue * 30); // Subtle blue variation
            barColor = `hsl(${hue}, 80%, 55%)`;
            barGlow = '';
        }
        
        // Apply colors and effects
        topBar.style.backgroundColor = barColor;
        bottomBar.style.backgroundColor = barColor;
        
        if (barGlow) {
            topBar.style.boxShadow = barGlow;
            bottomBar.style.boxShadow = barGlow;
        }
        
        // Add slight animation effect for current bars
        if (Math.abs(i - currentIndex) < 5) {
            const animationDuration = 0.3 + (Math.random() * 0.3);
            const animationDelay = Math.random() * 0.2;
            
            topBar.style.animation = `pulse ${animationDuration}s ${animationDelay}s infinite alternate`;
            bottomBar.style.animation = `pulse ${animationDuration}s ${animationDelay}s infinite alternate`;
        }
        
        // Add bars directly to the container
        waveformContainer.appendChild(topBar);
        waveformContainer.appendChild(bottomBar);
    }
    
    // Add the waveform to the container
    container.appendChild(waveformContainer);
    
    // Add jump counter if needed
    if (jumps.length > 0) {
        const labelContainer = document.createElement('div');
        labelContainer.className = 'waveform-labels';
        labelContainer.textContent = `${jumps.length} significant changes detected`;
        container.appendChild(labelContainer);
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

// Audio context for sonification
let audioContext = null;
let oscillator = null;
let gainNode = null;

// Initialize audio context
function initAudio() {
    // Create audio context if not already created
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain node for volume control
            gainNode = audioContext.createGain();
            gainNode.gain.value = 0.2; // Set volume to 20%
            gainNode.connect(audioContext.destination);
            
            console.log('Audio context initialized successfully');
        } catch (e) {
            console.error('Failed to initialize audio context:', e);
        }
    }
}

// Start sonification
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

// Stop sonification
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

// Update sound frequency based on current data value
function updateSonification() {
    if (!oscillator) return;
    
    try {
        // Get current value
        const currentValue = getCurrentValue();
        
        // Get min/max values based on current metric
        let minValue, maxValue;
        let valueGetter;
        
        if (app.currentDataType === 'driving' && app.currentExam !== 'Heart Rate') {
            switch (app.currentExam) {
                case 'ECG': valueGetter = d => d.ecg; break;
                case 'EMG': valueGetter = d => d.emg; break;
                case 'Foot GSR': valueGetter = d => d.footGSR; break;
                case 'Hand GSR': valueGetter = d => d.handGSR; break;
                case 'Respiration': valueGetter = d => d.resp; break;
                default: valueGetter = d => d.hr;
            }
        } else {
            valueGetter = d => d.hr;
        }
        
        minValue = d3.min(app.data.filtered, valueGetter);
        maxValue = d3.max(app.data.filtered, valueGetter);
        
        // Apply some padding to min/max values
        minValue = minValue * 0.9;
        maxValue = maxValue * 1.1;
        
        // Map the current value to frequency range (200Hz - 1000Hz)
        const minFrequency = 50;
        const maxFrequency = 2000;
        
        // Normalize the current value
        const normalizedValue = (currentValue - minValue) / (maxValue - minValue);
        
        // Calculate frequency
        const frequency = minFrequency + normalizedValue * (maxFrequency - minFrequency);
        
        // Update oscillator frequency with smoothing
        oscillator.frequency.setTargetAtTime(frequency, audioContext.currentTime, 0.1);
    } catch (e) {
        console.error('Error updating sonification:', e);
    }
}

// Toggle play/pause
function togglePlayback() {
    app.isPlaying = !app.isPlaying;
    
    // Update button state
    document.getElementById('play-icon').classList.toggle('hidden', app.isPlaying);
    document.getElementById('pause-icon').classList.toggle('hidden', !app.isPlaying);
    
    if (app.isPlaying) {
        // Start sonification
        startSonification();
        
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
                
                // Update sound
                updateSonification();
                
                // Update pulse visualization if it exists
                if (typeof updatePulseVisualization === 'function') {
                    updatePulseVisualization();
                }
            }
        }, 50); // Update every 250ms (playback speed is faster than real-time)
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
    
    // Stop sonification
    stopSonification();
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
    
    // Update time display and progress bar
    updateTimeDisplay();
    
    // Update waveform visualization
    updateWaveform();
    
    // Update pulse visualization if it exists
    if (typeof updatePulseVisualization === 'function') {
        updatePulseVisualization();
    }
    
    // Update position line in chart
    if (app.chart.svg && app.chart.xScale) {
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
    
    // Update pulse visualization if it exists
    if (typeof updatePulseVisualization === 'function') {
        updatePulseVisualization();
    }
}

// Setup volume control
function setupVolumeControl() {
    const volumeSlider = document.getElementById('volume-slider');
    if (!volumeSlider) return;
    
    // Set initial volume
    volumeSlider.addEventListener('input', function() {
        const volume = this.value / 100;
        if (gainNode) {
            gainNode.gain.value = volume;
        }
    });
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
    
    // Setup volume control if it exists
    setupVolumeControl();

    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        initChart();
        updateWaveform();
    }, 250));
}

// Pulse visualization - check if container exists first
function createPulseVisualization() {
    // Check if pulse container already exists or should be created
    if (!document.getElementById('pulse-container')) {
        const visualizationContainer = document.querySelector('.visualization-container');
        if (!visualizationContainer) return; // Exit if main container doesn't exist
        
        const waveformContainer = document.getElementById('waveform-container');
        if (!waveformContainer) return; // Exit if waveform container doesn't exist
        
        // Create pulse container and its children
        const pulseContainer = document.createElement('div');
        pulseContainer.id = 'pulse-container';
        pulseContainer.className = 'pulse-container';
        
        const pulseCircle = document.createElement('div');
        pulseCircle.id = 'pulse-circle';
        pulseCircle.className = 'pulse-circle';
        
        const pulseRing = document.createElement('div');
        pulseRing.id = 'pulse-ring';
        pulseRing.className = 'pulse-ring';
        
        const pulseIndicator = document.createElement('div');
        pulseIndicator.id = 'pulse-beat-indicator';
        pulseIndicator.className = 'pulse-beat-indicator';
        pulseIndicator.textContent = 'Waiting for beat...';
        
        // Assemble the components
        pulseContainer.appendChild(pulseCircle);
        pulseContainer.appendChild(pulseRing);
        pulseContainer.appendChild(pulseIndicator);
        
        // Insert after waveform container
        waveformContainer.insertAdjacentElement('afterend', pulseContainer);
        
        console.log('Pulse visualization created');
    }
}

// Update pulse visualization
function updatePulseVisualization() {
    const pulseCircle = document.getElementById('pulse-circle');
    const pulseRing = document.getElementById('pulse-ring');
    const pulseIndicator = document.getElementById('pulse-beat-indicator');
    
    if (!pulseCircle || !pulseRing || !pulseIndicator) return;
    
    // Find current data point and value
    const timeStep = app.data.filtered.length > 0 
        ? (app.data.filtered[1]?.timestamp - app.data.filtered[0]?.timestamp) || 10 
        : 10;
    
    const currentIndex = Math.floor(app.currentTime / timeStep);
    
    // Ensure we have data points and we're not at the beginning
    if (app.data.filtered.length < 2 || currentIndex < 1) {
        pulseIndicator.textContent = 'Waiting for beat...';
        return;
    }
    
    // Get current and previous values
    let currentValue, previousValue;
    let valueGetter;
    
    if (app.currentDataType === 'driving' && app.currentExam !== 'Heart Rate') {
        // For different metrics, use appropriate values
        switch (app.currentExam) {
            case 'ECG': valueGetter = d => d.ecg; break;
            case 'EMG': valueGetter = d => d.emg; break;
            case 'Foot GSR': valueGetter = d => d.footGSR; break;
            case 'Hand GSR': valueGetter = d => d.handGSR; break;
            case 'Respiration': valueGetter = d => d.resp; break;
            default: valueGetter = d => d.hr;
        }
    } else {
        valueGetter = d => d.hr;
    }
    
    currentValue = valueGetter(app.data.filtered[currentIndex]);
    previousValue = valueGetter(app.data.filtered[currentIndex - 1]);
    
    // Calculate min/max values for the dataset
    let minValue = d3.min(app.data.filtered, valueGetter);
    let maxValue = d3.max(app.data.filtered, valueGetter);
    
    // Calculate value range and set a threshold for significant changes
    const range = maxValue - minValue;
    const changeThreshold = range * 0.05; // 5% change is significant
    
    // Calculate absolute change
    const change = Math.abs(currentValue - previousValue);
    const percentChange = (change / range) * 100;
    
    // Update pulse circle size based on current value (normalized)
    const normalizedValue = (currentValue - minValue) / range;
    const pulseSize = 40 + (normalizedValue * 60); // Scale between 40px and 100px
    
    pulseCircle.style.width = `${pulseSize}px`;
    pulseCircle.style.height = `${pulseSize}px`;
    
    // Generate pulse effect on significant changes
    if (change > changeThreshold) {
        // Trigger pulse animation
        pulseRing.classList.remove('animate');
        void pulseRing.offsetWidth; // Force reflow to restart animation
        pulseRing.classList.add('animate');
        
        // Change circle color based on whether value increased or decreased
        if (currentValue > previousValue) {
            pulseCircle.style.backgroundColor = '#1db954'; // Green for increase
        } else {
            pulseCircle.style.backgroundColor = '#ff6b6b'; // Red for decrease
        }
        
        // Update indicator
        pulseIndicator.textContent = `Beat detected! ${percentChange.toFixed(1)}% change`;
    } else {
        // Reset color for small changes
        pulseCircle.style.backgroundColor = '#4a90e2'; // Blue for normal
        pulseIndicator.textContent = 'Monitoring...';
    }
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
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">📊</text></svg>';
    document.head.appendChild(link);
}

// Fix SVG Paths function - run this to fix any potential SVG path errors 
function fixSVGPaths() {
    // Replace any problematic SVG icons with valid ones
    
    // Play icon - ensure it has a valid path
    const playIcon = document.getElementById('play-icon');
    if (playIcon) {
        playIcon.setAttribute('viewBox', '0 0 24 24');
        const playPath = playIcon.querySelector('path');
        if (playPath) {
            playPath.setAttribute('d', 'M8 5v14l11-7z');
        }
    }
    
    // Pause icon - ensure it has a valid path
    const pauseIcon = document.getElementById('pause-icon');
    if (pauseIcon) {
        pauseIcon.setAttribute('viewBox', '0 0 24 24');
        const pausePath = pauseIcon.querySelector('path');
        if (pausePath) {
            pausePath.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
        }
    }
    
    // Skip back icon
    const skipBackIcon = document.getElementById('skip-back-icon');
    if (skipBackIcon) {
        skipBackIcon.setAttribute('viewBox', '0 0 24 24');
        const skipBackPath = skipBackIcon.querySelector('path');
        if (skipBackPath) {
            skipBackPath.setAttribute('d', 'M6 6h2v12H6zm3.5 6l8.5 6V6z');
        }
    }
    
    // Skip forward icon
    const skipForwardIcon = document.getElementById('skip-forward-icon');
    if (skipForwardIcon) {
        skipForwardIcon.setAttribute('viewBox', '0 0 24 24');
        const skipForwardPath = skipForwardIcon.querySelector('path');
        if (skipForwardPath) {
            skipForwardPath.setAttribute('d', 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z');
        }
    }
}

// ---------------------------------------------------------
// Initialize the app on DOMContentLoaded
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    addFavicon();
    fixSVGPaths(); // Fix any SVG path issues

    // Create pulse visualization
    createPulseVisualization();
    
    // Set up event listeners
    setupEventListeners();
    
    // Scan for CSV files in the data directory
    scanDataDirectory();
});