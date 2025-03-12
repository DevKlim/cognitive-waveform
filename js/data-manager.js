/**
 * data-manager.js
 * Handles data loading, processing and dataset management
 */

/**
 * Load available datasets for sidebar
 */
function loadDatasets() {
    // Default datasets - in a real app, you'd fetch this dynamically
    app.allDatasets = [
        { name: 'Driving Clean Data', path: 'data/driving_clean_data.csv', color: 'hsl(0, 80%, 50%)' },
        { name: 'Exam Dataset', path: 'data/exam_dataset.csv', color: 'hsl(120, 80%, 50%)' },
        { name: 'Exam Dataset (10s)', path: 'data/exam_dataset_10s.csv', color: 'hsl(240, 80%, 50%)' }
    ];
    
    updateSidebar();
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
    
    console.log('Loading CSV from:', filePath);
    app.currentFile = filePath;
    
    // Update sidebar active state
    updateSidebar();
    
    // Use D3 to fetch & parse CSV
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
            
            // Create mock data
            createMockData();
        });
}

/**
 * Process the CSV data
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
    
    // Save to global state
    app.data.all = parsedData;
    app.data.metrics = numericColumns;
    app.currentDataType = displayName;

    console.log(`Found ${numericColumns.length} metrics:`, numericColumns);

    // Get unique subjects
    const subjects = [...new Set(parsedData.map(d => d.subject))];
    
    // Update UI
    updateMetricSelection(numericColumns);
    updateSubjectSelection(subjects);
    
    // Default selection
    if (subjects.length > 0) {
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
    
    // Use the mock data
    app.data.all = mockData;
    app.data.metrics = metrics;
    
    // Get unique subjects
    const uniqueSubjects = [...new Set(mockData.map(d => d.subject))];
    
    // Update UI
    updateMetricSelection(metrics);
    updateSubjectSelection(uniqueSubjects);
    
    // Default selection
    app.currentSubject = uniqueSubjects[0];
    app.currentMetric = metrics[0];
    
    // Update display
    const currentSubject = document.getElementById('current-subject');
    if (currentSubject) currentSubject.textContent = uniqueSubjects[0];
    
    // Reset visualizations
    resetPlayback();
}

/**
 * Update the metric selection UI
 */
function updateMetricSelection(metrics) {
    const metricsContainer = document.getElementById('metrics-chips');
    if (!metricsContainer) return;
    
    // Clear existing metrics
    metricsContainer.innerHTML = '';
    
    // Add metric chips
    metrics.forEach(metric => {
        const chip = document.createElement('div');
        chip.className = 'metric-chip';
        if (metric === app.currentMetric) {
            chip.classList.add('active');
        }
        chip.textContent = metric;
        chip.setAttribute('data-metric', metric);
        
        // Add click handler
        chip.addEventListener('click', () => {
            // Update active state in UI
            document.querySelectorAll('.metric-chip').forEach(el => {
                el.classList.remove('active');
            });
            chip.classList.add('active');
            
            // Update global state
            app.currentMetric = metric;
            
            // Reset visualization
            resetPlayback();
        });
        
        metricsContainer.appendChild(chip);
    });
}

/**
 * Update the subject selection UI
 */
function updateSubjectSelection(subjects) {
    const subjectsContainer = document.getElementById('subjects-list');
    if (!subjectsContainer) return;
    
    // Clear existing subjects
    subjectsContainer.innerHTML = '';
    
    // Add subject chips
    subjects.forEach(subject => {
        const chip = document.createElement('div');
        chip.className = 'subject-chip';
        if (subject === app.currentSubject) {
            chip.classList.add('active');
        }
        chip.textContent = subject;
        chip.setAttribute('data-subject', subject);
        
        // Add click handler
        chip.addEventListener('click', () => {
            // Update active state in UI
            document.querySelectorAll('.subject-chip').forEach(el => {
                el.classList.remove('active');
            });
            chip.classList.add('active');
            
            // Update global state
            app.currentSubject = subject;
            
            const currentSubject = document.getElementById('current-subject');
            if (currentSubject) currentSubject.textContent = subject;
            
            // Reset visualization
            resetPlayback();
        });
        
        subjectsContainer.appendChild(chip);
    });
}