/**
 * data-manager.js
 * Enhanced data loading, processing and dataset management with averaging
 */

/**
 * Load available datasets from the JSON configuration
 */
function loadDatasets() {
    try {
        // Check if datasets are already defined in app.allDatasets
        if (!app.allDatasets || app.allDatasets.length === 0) {
            // Default datasets from the JSON file
            fetch('data.json')
                .then(response => response.json())
                .then(data => {
                    // Map the files to the format we need
                    app.allDatasets = data.files.map(file => ({
                        name: file.displayName || file.name,
                        path: file.path,
                        // Generate color based on name for consistency
                        color: generateColorFromString(file.name)
                    }));
                    updateSidebar();
                })
                .catch(error => {
                    console.error('Error loading datasets from JSON:', error);
                    // Fallback to hardcoded datasets
                    app.allDatasets = [
                        { name: 'Driving Clean Data', path: 'data/driving_clean_data.csv', color: 'hsl(0, 80%, 50%)' },
                        { name: 'Exam Dataset', path: 'data/exam_dataset.csv', color: 'hsl(120, 80%, 50%)' },
                        { name: 'Exam Dataset (10s)', path: 'data/exam_dataset_10s.csv', color: 'hsl(240, 80%, 50%)' }
                    ];
                    updateSidebar();
                });
        } else {
            updateSidebar();
        }
    } catch (error) {
        console.error('Error in loadDatasets:', error);
    }
}

/**
 * Generate a consistent color from a string
 */
function generateColorFromString(str) {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Convert to HSL color (better for visualization than RGB)
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 80%, 50%)`;
}

/**
 * Update sidebar with datasets
 */
function updateSidebar() {
    const sidebarAlbums = document.getElementById('sidebar-albums');
    if (!sidebarAlbums) return;
    
    // Clear existing content
    sidebarAlbums.innerHTML = '';
    
    // Add each dataset
    app.allDatasets.forEach(dataset => {
        const isActive = app.currentFile === dataset.path;
        
        const albumElement = document.createElement('div');
        albumElement.className = `sidebar-album${isActive ? ' active' : ''}`;
        albumElement.setAttribute('data-path', dataset.path);
        
        albumElement.innerHTML = `
            <div class="album-icon" style="background: ${dataset.color || '#1db954'}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="${isActive ? '#000' : '#fff'}">
                    <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
                </svg>
            </div>
            <div class="album-name">${dataset.name}</div>
        `;
        
        // Add click handler
        albumElement.addEventListener('click', () => {
            // Switch to this dataset
            loadCSVFile(dataset.path, dataset.name);
            
            // Close sidebar on mobile
            const sidebar = document.getElementById('sidebar');
            const appContainer = document.querySelector('.app-container');
            if (window.innerWidth < 992 && sidebar) {
                sidebar.classList.remove('active');
                app.sidebarActive = false;
                if (appContainer) {
                    appContainer.classList.remove('sidebar-active');
                }
            }
        });
        
        sidebarAlbums.appendChild(albumElement);
    });
}

/**
 * Load a CSV file using D3
 */
function loadCSVFile(filePath, displayName) {
    // Show loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
    }
    
    // Update dataset title
    const currentDataset = document.getElementById('current-dataset');
    if (currentDataset && displayName) {
        currentDataset.textContent = displayName;
    }
    
    console.log('Loading dataset:', filePath);
    app.currentFile = filePath;
    
    // Handle custom dataset from upload page
    if (filePath === 'custom_dataset') {
        console.log('Loading custom dataset from session storage');
        // Get custom dataset from session storage
        const customDatasetJSON = sessionStorage.getItem('customDataset');
        
        if (!customDatasetJSON) {
            console.error('Custom dataset not found in session storage');
            alert('Error loading custom dataset. Please try uploading again.');
            window.location.href = 'albums.html';
            return;
        }
        
        try {
            // Parse the JSON data
            const customDataset = JSON.parse(customDatasetJSON);
            
            // Process custom dataset
            processCustomDataset(customDataset, displayName || 'Custom Dataset');
            
            // Update sidebar active state
            updateSidebar();
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
            
            return;
        } catch (error) {
            console.error('Error parsing custom dataset:', error);
            alert('Error loading custom dataset. Please try uploading again.');
            window.location.href = 'albums.html';
            return;
        }
    }
    // Handle cached custom datasets
    else if (filePath.startsWith('customDataset_')) {
        console.log('Loading cached custom dataset:', filePath);
        // Get custom dataset from session storage
        const customDatasetJSON = sessionStorage.getItem(filePath);
        
        if (!customDatasetJSON) {
            console.error('Cached custom dataset not found in session storage');
            alert('Dataset has expired or was not found. Please upload again.');
            window.location.href = 'albums.html';
            return;
        }
        
        try {
            // Parse the JSON data
            const customDataset = JSON.parse(customDatasetJSON);
            
            // Process custom dataset
            processCustomDataset(customDataset, displayName || 'Custom Dataset');
            
            // Update sidebar active state
            updateSidebar();
            
            // Store this as current dataset for simplicity
            sessionStorage.setItem('customDataset', customDatasetJSON);
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
            
            return;
        } catch (error) {
            console.error('Error parsing cached custom dataset:', error);
            alert('Error loading dataset. Please upload again.');
            window.location.href = 'albums.html';
            return;
        }
    }
    
    // Update sidebar active state
    updateSidebar();
    
    // Regular CSV file loading for non-custom datasets
    d3.csv(filePath)
        .then(data => {
            // Check if we got valid data
            if (!data || data.length === 0 || !Object.keys(data[0]).length) {
                throw new Error('CSV file is empty or invalid');
            }
            
            console.log('CSV loaded successfully with headers:', Object.keys(data[0]));
            processData(data, displayName || 'Dataset');
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
        })
        .catch(error => {
            console.error('Error loading CSV file:', error);
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
            
            // Alert user
            alert(`Error loading data: ${error.message}`);
            
            // Create mock data as fallback
            createMockData();
        });
}

/**
 * Process the CSV data and calculate improved averages across subjects
 */
function processData(data, displayName) {
    // First, determine available columns
    const headers = Object.keys(data[0]);
    
    // Identify timestamp and subject columns
    const timestampColumn = headers.find(col => 
        ['timestamp', 'time', 'Time', 'Timestamp'].includes(col)
    ) || headers[0];
    
    const subjectColumn = headers.find(col => 
        ['subject', 'Student', 'student', 'Subject', 'participant', 'Participant'].includes(col)
    );
    
    // Process all numeric columns as potential metrics
    const numericColumns = [];
    const parsedData = data.map(row => {
        const processed = { 
            timestamp: +row[timestampColumn] || 0,
            subject: subjectColumn ? row[subjectColumn] : 'Default'
        };
        
        // Process all other columns as potential metrics
        headers.forEach(col => {
            if (col !== timestampColumn && col !== subjectColumn) {
                // Check if this value can be converted to a number
                const val = +row[col];
                if (!isNaN(val)) {
                    processed[col] = val;
                    // Add to numeric columns if not already included
                    if (!numericColumns.includes(col)) {
                        numericColumns.push(col);
                    }
                } else {
                    // Store non-numeric values as is (for categorical data)
                    processed[col] = row[col];
                }
            }
        });
        
        return processed;
    });
    
    // Create improved average subject data
    
    // First, get unique subjects and their duration
    const uniqueSubjects = [...new Set(parsedData.map(d => d.subject))];
    const subjectDurations = {};
    
    uniqueSubjects.forEach(subject => {
        const subjectData = parsedData.filter(d => d.subject === subject);
        if (subjectData.length > 0) {
            const minTime = d3.min(subjectData, d => d.timestamp);
            const maxTime = d3.max(subjectData, d => d.timestamp);
            subjectDurations[subject] = maxTime - minTime;
        }
    });
    
    // Find the subject with the shortest duration
    let shortestDuration = Infinity;
    let shortestSubject = null;
    
    for (const [subject, duration] of Object.entries(subjectDurations)) {
        if (duration < shortestDuration && duration > 0) {
            shortestDuration = duration;
            shortestSubject = subject;
        }
    }
    
    console.log(`Shortest duration: ${shortestDuration} from subject: ${shortestSubject}`);
    
    // Create 100 evenly spaced sample points (1% increments)
    const numSamples = 500;
    const sampleInterval = shortestDuration / numSamples;
    
    // Create averaged data points for each sample interval
    const averagedData = [];
    
    // Get the minimum timestamp across all subjects as our starting point
    const globalMinTime = d3.min(parsedData, d => d.timestamp);
    
    for (let i = 0; i < numSamples; i++) {
        // Calculate the target timestamp for this sample
        const targetTime = globalMinTime + (i * sampleInterval);
        
        // Find data points from each subject closest to this timestamp
        const samplesFromAllSubjects = [];
        
        uniqueSubjects.forEach(subject => {
            const subjectData = parsedData.filter(d => d.subject === subject);
            if (subjectData.length === 0) return;
            
            // Find the closest data point to the target time
            let closestPoint = null;
            let minDiff = Infinity;
            
            subjectData.forEach(point => {
                const diff = Math.abs(point.timestamp - targetTime);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestPoint = point;
                }
            });
            
            // Only include if it's reasonably close (within one interval)
            if (closestPoint && minDiff <= sampleInterval) {
                samplesFromAllSubjects.push(closestPoint);
            }
        });
        
        // Skip if no samples found
        if (samplesFromAllSubjects.length === 0) continue;
        
        // Calculate averages for each metric
        const avgDataPoint = {
            timestamp: targetTime,
            subject: "Average (All Subjects)"
        };
        
        numericColumns.forEach(metric => {
            // Get values for this metric from the samples
            const values = samplesFromAllSubjects
                .map(d => d[metric])
                .filter(val => val !== undefined && !isNaN(val));
            
            // Skip if no valid values
            if (values.length === 0) return;
            
            // Calculate average
            const sum = values.reduce((acc, val) => acc + val, 0);
            avgDataPoint[metric] = sum / values.length;
        });
        
        averagedData.push(avgDataPoint);
    }
    
    console.log(`Generated ${averagedData.length} averaged data points`);
    
    // Combine regular data with averaged data
    const combinedData = [...averagedData, ...parsedData];
    
    // Save to global state
    app.data.all = combinedData;
    app.data.metrics = numericColumns;
    app.currentDataType = displayName;

    console.log(`Found ${numericColumns.length} metrics:`, numericColumns);

    // Get all subjects (including the average)
    let subjects = [...new Set(combinedData.map(d => d.subject))];
    
    // Move "Average (All Subjects)" to the first position if it exists
    const avgIndex = subjects.indexOf("Average (All Subjects)");
    if (avgIndex > -1) {
        subjects = ["Average (All Subjects)", ...subjects.slice(0, avgIndex), ...subjects.slice(avgIndex + 1)];
    }

    // Update UI using newer dropdown approach
    updateMetricDropdown(numericColumns);
    updateSubjectDropdown(subjects);
    
    // Default selection - always use Average (All Subjects) when available
    if (subjects.includes("Average (All Subjects)")) {
        app.currentSubject = "Average (All Subjects)";
        const currentSubject = document.getElementById('current-subject');
        if (currentSubject) currentSubject.textContent = "Average (All Subjects)";
    } else if (subjects.length > 0) {
        app.currentSubject = subjects[0];
        const currentSubject = document.getElementById('current-subject');
        if (currentSubject) currentSubject.textContent = subjects[0];
    }
    
    if (numericColumns.length > 0) {
        app.currentMetric = numericColumns[0];
    }
    
    // Reset visualizations
    resetPlayback();
}

/**
 * Create mock data when loading fails
 */
function createMockData() {
    console.log('Creating mock data');
    
    // Generate a sample dataset
    const timestamps = Array.from({length: 50}, (_, i) => i * 10);
    const subjects = ['Subject A', 'Subject B', 'Subject C'];
    const metrics = ['HR', 'GSR', 'Temperature', 'EEG'];
    
    // Generate some random data
    const mockData = [];
    subjects.forEach(subject => {
        timestamps.forEach(timestamp => {
            const dataPoint = {
                timestamp: timestamp,
                subject: subject
            };
            
            // Add values for each metric with some randomness
            metrics.forEach(metric => {
                const baseValue = Math.random() * 100;
                // Create some patterns in the data
                const timeEffect = Math.sin(timestamp / 50) * 20;
                dataPoint[metric] = baseValue + timeEffect;
            });
            
            mockData.push(dataPoint);
        });
    });
    
    // Create averaged data
    const averagedData = [];
    timestamps.forEach(time => {
        const avgPoint = {
            timestamp: time,
            subject: "Average (All Subjects)"
        };
        
        metrics.forEach(metric => {
            const dataAtTime = mockData.filter(d => d.timestamp === time);
            const values = dataAtTime.map(d => d[metric]);
            const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
            avgPoint[metric] = avg;
        });
        
        averagedData.push(avgPoint);
    });
    
    // Combine regular and averaged data
    const combinedData = [...averagedData, ...mockData];
    
    // Use the mock data
    app.data.all = combinedData;
    app.data.metrics = metrics;
    
    // Get unique subjects (including the average) - ensure average comes first
    let uniqueSubjects = ["Average (All Subjects)", ...subjects];
    
    // Update UI
    updateMetricDropdown(metrics);
    updateSubjectDropdown(uniqueSubjects);
    
    // Default selection - use Average as default
    app.currentSubject = "Average (All Subjects)";
    app.currentMetric = metrics[0];
    
    // Update display
    const currentSubject = document.getElementById('current-subject');
    if (currentSubject) currentSubject.textContent = "Average (All Subjects)";
    
    // Reset visualizations
    resetPlayback();
    
    // Make sure loading indicator is hidden
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }
}

/**
 * Update the metric selection using a dropdown
 */
function updateMetricDropdown(metrics) {
    const metricsContainer = document.getElementById('metrics-dropdown-container');
    if (!metricsContainer) return;
    
    // Clear existing content
    metricsContainer.innerHTML = '';
    
    // Create dropdown
    const dropdown = document.createElement('select');
    dropdown.id = 'metrics-dropdown';
    dropdown.className = 'select-dropdown';
    
    // Create options
    metrics.forEach(metric => {
        const option = document.createElement('option');
        option.value = metric;
        option.textContent = metric;
        if (metric === app.currentMetric) {
            option.selected = true;
        }
        dropdown.appendChild(option);
    });
    
    // Add change handler
    dropdown.addEventListener('change', () => {
        app.currentMetric = dropdown.value;
        resetPlayback();
    });
    
    // Add label
    const label = document.createElement('label');
    label.htmlFor = 'metrics-dropdown';
    label.textContent = 'Select Metric: ';
    label.className = 'dropdown-label';
    
    // Add to container
    metricsContainer.appendChild(label);
    metricsContainer.appendChild(dropdown);
}

/**
 * Update the subject selection using a dropdown
 */
function updateSubjectDropdown(subjects) {
    const subjectsContainer = document.getElementById('subjects-dropdown-container');
    if (!subjectsContainer) return;
    
    // Clear existing content
    subjectsContainer.innerHTML = '';
    
    // Create dropdown
    const dropdown = document.createElement('select');
    dropdown.id = 'subjects-dropdown';
    dropdown.className = 'select-dropdown';
    
    // Create options
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        
        // Format subject display name based on pattern or use custom mapping
        let displayName = subject;
        
        // Check if we have a custom mapping for this specific subject
        if (app.config.customSubjectNames && app.config.customSubjectNames[subject]) {
            displayName = app.config.customSubjectNames[subject];
        } 
        // Check if we have a pattern-based transformation
        else if (app.config.subjectPattern) {
            const pattern = app.config.subjectPattern;
            
            // Basic example: if subjectPattern is "Student" and subject is "Student1",
            // transform to "Student 1"
            if (subject.startsWith(pattern) && /\d+$/.test(subject)) {
                const number = subject.match(/\d+$/)[0];
                displayName = `${pattern} ${number}`;
            }
        }
        
        option.textContent = displayName;
        if (subject === app.currentSubject) {
            option.selected = true;
        }
        dropdown.appendChild(option);
    });
    
    // Add change handler
    dropdown.addEventListener('change', () => {
        app.currentSubject = dropdown.value;
        
        const currentSubject = document.getElementById('current-subject');
        if (currentSubject) {
            // Use the formatted display name for the header too
            const selected = dropdown.options[dropdown.selectedIndex];
            currentSubject.textContent = selected.textContent;
        }
        
        resetPlayback();
    });
    
    // Add label
    const label = document.createElement('label');
    label.htmlFor = 'subjects-dropdown';
    label.textContent = 'Select Subject: ';
    label.className = 'dropdown-label';
    
    // Add to container
    subjectsContainer.appendChild(label);
    subjectsContainer.appendChild(dropdown);
}