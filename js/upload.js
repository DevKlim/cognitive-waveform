/**
 * upload.js
 * Handles CSV file uploading, parsing, configuration, and preparation for visualization
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('upload-area');
    const csvFileInput = document.getElementById('csv-file');
    const browseButton = document.getElementById('browse-button');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const removeFileButton = document.getElementById('remove-file');
    const dataConfiguration = document.getElementById('data-configuration');
    const timestampColumnSelect = document.getElementById('timestamp-column');
    const metricColumnSelect = document.getElementById('metric-column');
    const metricNameInput = document.getElementById('metric-name');
    const subjectColumnSelect = document.getElementById('subject-column');
    const datasetNameInput = document.getElementById('dataset-name');
    const createAverageCheckbox = document.getElementById('create-average');
    const visualizeButton = document.getElementById('visualize-button');
    const cancelButton = document.getElementById('cancel-button');
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    const errorOkButton = document.getElementById('error-ok');
    const closeModalButton = document.querySelector('.close-modal');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Store uploaded file and parsed data
    let uploadedFile = null;
    let parsedData = null;
    let csvHeaders = [];
    
    // ========================
    // Event Listeners
    // ========================
    
    // Upload area click
    uploadArea.addEventListener('click', function() {
        if (!fileInfo.classList.contains('hidden')) return;
        csvFileInput.click();
    });
    
    // Browse button click
    browseButton.addEventListener('click', function(e) {
        e.stopPropagation();
        csvFileInput.click();
    });
    
    // File input change
    csvFileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFileUpload(this.files[0]);
        }
    });
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        this.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    
    // Remove file button
    removeFileButton.addEventListener('click', function(e) {
        e.stopPropagation();
        resetFileUpload();
    });
    
    // Cancel configuration button
    cancelButton.addEventListener('click', function() {
        resetFileUpload();
    });
    
    // Visualize button
    visualizeButton.addEventListener('click', function() {
        prepareAndVisualize();
    });
    
    // Error modal buttons
    errorOkButton.addEventListener('click', function() {
        errorModal.style.display = 'none';
    });
    
    closeModalButton.addEventListener('click', function() {
        errorModal.style.display = 'none';
    });
    
    // Column selection change events
    timestampColumnSelect.addEventListener('change', validateConfiguration);
    metricColumnSelect.addEventListener('change', function() {
        // Auto-fill metric name based on column selection
        const selectedMetric = this.value;
        if (selectedMetric && metricNameInput.value === '') {
            metricNameInput.value = selectedMetric;
        }
        validateConfiguration();
    });
    
    // ========================
    // Functions
    // ========================
    
    /**
     * Handle file upload by validating and parsing the CSV
     */
    function handleFileUpload(file) {
        // Check if file is CSV
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showError('Please upload a valid CSV file.');
            return;
        }
        
        // Update UI to show file info
        uploadedFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.classList.remove('hidden');
        
        // Auto-fill dataset name based on file name
        const baseName = file.name.replace('.csv', '');
        datasetNameInput.value = baseName;
        
        // Show loading overlay while parsing
        loadingOverlay.classList.remove('hidden');
        
        // Parse CSV file
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
                loadingOverlay.classList.add('hidden');
                
                if (results.errors.length > 0) {
                    showError('Error parsing CSV: ' + results.errors[0].message);
                    return;
                }
                
                if (results.data.length === 0) {
                    showError('The CSV file appears to be empty.');
                    return;
                }
                
                // Process the parsed data
                parsedData = results.data;
                csvHeaders = results.meta.fields;
                
                // Show configuration section
                populateColumnSelects();
                dataConfiguration.classList.remove('hidden');
                
                // Create preview table
                createPreviewTable(parsedData.slice(0, 5), csvHeaders);
            },
            error: function(error) {
                loadingOverlay.classList.add('hidden');
                showError('Error reading CSV file: ' + error.message);
            }
        });
    }
    
    /**
     * Reset file upload state
     */
    function resetFileUpload() {
        uploadedFile = null;
        parsedData = null;
        csvHeaders = [];
        
        // Reset UI
        fileInfo.classList.add('hidden');
        dataConfiguration.classList.add('hidden');
        csvFileInput.value = '';
        
        // Reset form fields
        timestampColumnSelect.innerHTML = '';
        metricColumnSelect.innerHTML = '';
        subjectColumnSelect.innerHTML = '<option value="">None (Single Subject)</option>';
        metricNameInput.value = '';
        datasetNameInput.value = '';
        createAverageCheckbox.checked = true;
        
        // Reset visualize button
        visualizeButton.disabled = true;
    }
    
    /**
     * Populate the column selection dropdowns
     */
    function populateColumnSelects() {
        // Clear existing options
        timestampColumnSelect.innerHTML = '';
        metricColumnSelect.innerHTML = '';
        subjectColumnSelect.innerHTML = '<option value="">None (Single Subject)</option>';
        
        // Add timestamp and metric options
        csvHeaders.forEach(header => {
            const timestampOption = document.createElement('option');
            timestampOption.value = header;
            timestampOption.textContent = header;
            timestampColumnSelect.appendChild(timestampOption);
            
            const metricOption = document.createElement('option');
            metricOption.value = header;
            metricOption.textContent = header;
            metricColumnSelect.appendChild(metricOption);
            
            const subjectOption = document.createElement('option');
            subjectOption.value = header;
            subjectOption.textContent = header;
            subjectColumnSelect.appendChild(subjectOption);
        });
        
        // Try to auto-select appropriate columns
        autoSelectColumns();
        
        // Validate the configuration
        validateConfiguration();
    }
    
    /**
     * Try to auto-select appropriate columns based on column names
     */
    function autoSelectColumns() {
        // Look for timestamp column
        const timeColumns = csvHeaders.filter(header => 
            header.toLowerCase().includes('time') || 
            header.toLowerCase().includes('date') || 
            header.toLowerCase() === 't' ||
            header.toLowerCase() === 'timestamp')
            .sort((a, b) => a.length - b.length); // Prefer shorter names
        
        if (timeColumns.length > 0) {
            timestampColumnSelect.value = timeColumns[0];
        }
        
        // Look for potential metric columns (heart rate, GSR, etc.)
        const metricColumns = csvHeaders.filter(header => 
            header.toLowerCase().includes('hr') || 
            header.toLowerCase().includes('heart') || 
            header.toLowerCase().includes('gsr') || 
            header.toLowerCase().includes('ecg') ||
            header.toLowerCase().includes('resp') ||
            header.toLowerCase().includes('temp') ||
            header.toLowerCase().includes('rate'));
        
        if (metricColumns.length > 0) {
            metricColumnSelect.value = metricColumns[0];
            metricNameInput.value = metricColumns[0]; // Auto-fill metric name
        }
        
        // Look for subject/participant column
        const subjectColumns = csvHeaders.filter(header => 
            header.toLowerCase().includes('subject') || 
            header.toLowerCase().includes('participant') || 
            header.toLowerCase().includes('id') ||
            header.toLowerCase().includes('person') ||
            header.toLowerCase().includes('student'));
        
        if (subjectColumns.length > 0) {
            subjectColumnSelect.value = subjectColumns[0];
        }
    }
    
    /**
     * Create preview table with the first few rows of data
     */
    function createPreviewTable(previewData, headers) {
        const table = document.getElementById('preview-table');
        table.innerHTML = '';
        
        // Create header row
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
        
        // Create data rows
        previewData.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] !== null ? row[header] : '';
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });
    }
    
    /**
     * Validate configuration and enable/disable the visualize button
     */
    function validateConfiguration() {
        const timestampColumn = timestampColumnSelect.value;
        const metricColumn = metricColumnSelect.value;
        
        // Basic validation: we need at least a timestamp and metric column
        const isValid = timestampColumn && metricColumn && timestampColumn !== metricColumn;
        
        visualizeButton.disabled = !isValid;
        
        return isValid;
    }
    
    /**
     * Updates to upload.js
     * Add this to the prepareAndVisualize function
     */

    function prepareAndVisualize() {
        if (!validateConfiguration()) {
            showError('Please select different columns for timestamp and metric.');
            return;
        }
        
        // Get configuration values
        const timestampColumn = timestampColumnSelect.value;
        const metricColumn = metricColumnSelect.value;
        let metricName = metricNameInput.value || metricColumn;
        const subjectColumn = subjectColumnSelect.value;
        let datasetName = datasetNameInput.value || uploadedFile.name.replace('.csv', '');
        const createAverage = createAverageCheckbox.checked;
        
        // Show loading overlay
        loadingOverlay.classList.remove('hidden');
        
        try {
            // Process the data for D3 format
            const processedData = processDataForVisualization(
                parsedData,
                timestampColumn,
                metricColumn,
                metricName,
                subjectColumn,
                createAverage
            );
            
            // Generate a unique ID for this dataset
            const datasetId = 'custom_' + Date.now();
            
            // Store the dataset in the session cache
            const cachedDatasets = JSON.parse(sessionStorage.getItem('cachedDatasets') || '[]');
            
            // Add this dataset to the cache
            cachedDatasets.push({
                id: datasetId,
                name: datasetName,
                timestamp: Date.now(),
                fileName: uploadedFile.name,
                color: generateRandomColor()
            });
            
            // Update the cache
            sessionStorage.setItem('cachedDatasets', JSON.stringify(cachedDatasets));
            
            // Store the actual dataset with its unique ID
            sessionStorage.setItem(`customDataset_${datasetId}`, JSON.stringify(processedData));
            
            // Store dataset info for immediate use
            sessionStorage.setItem('selectedDataset', 'custom_dataset');
            sessionStorage.setItem('datasetName', datasetName);
            sessionStorage.setItem('customDataset', JSON.stringify(processedData));
            
            // Redirect to visualizer
            setTimeout(function() {
                window.location.href = 'visualizer.html';
            }, 1000);
        } catch (error) {
            loadingOverlay.classList.add('hidden');
            showError('Error processing data: ' + error.message);
        }
    }

    /**
     * Generate a random color for dataset album covers
     */
    function generateRandomColor() {
        // Generate a random hue (0-360)
        const hue = Math.floor(Math.random() * 360);
        // Use fixed saturation and lightness for consistency
        return `hsl(${hue}, 80%, 50%)`;
    }
    
    /**
     * Process data for visualization according to selected configuration
     */
    function processDataForVisualization(data, timestampColumn, metricColumn, metricName, subjectColumn, createAverage) {
        // Filter out rows with missing values
        data = data.filter(row => 
            row[timestampColumn] !== null && 
            row[timestampColumn] !== undefined && 
            row[metricColumn] !== null && 
            row[metricColumn] !== undefined
        );
        
        if (data.length === 0) {
            throw new Error('No valid data points found after filtering missing values.');
        }
        
        // Process data into D3 format
        let processedData = data.map(row => {
            const result = {
                timestamp: parseFloat(row[timestampColumn]),
                subject: subjectColumn ? (row[subjectColumn] || 'Unknown') : 'Default'
            };
            
            // Renamed metric column
            result[metricName] = parseFloat(row[metricColumn]);
            
            return result;
        });
        
        // Sort by timestamp to ensure proper visualization
        processedData.sort((a, b) => a.timestamp - b.timestamp);
        
        // Create average subject data if requested and multiple subjects exist
        if (createAverage && subjectColumn) {
            const subjects = [...new Set(processedData.map(d => d.subject))];
            
            if (subjects.length > 1) {
                // Calculate average data points
                const averagedData = createAverageDataPoints(processedData, subjects, timestampColumn, metricName);
                
                // Add average data to processed data
                processedData = [...averagedData, ...processedData];
            }
        }
        
        return {
            data: processedData,
            metricName: metricName,
            timestampColumn: timestampColumn
        };
    }
    
    /**
     * Create averaged data points across all subjects
     */
    function createAverageDataPoints(data, subjects, timestampColumn, metricName) {
        // Find common time range
        const timeRanges = {};
        subjects.forEach(subject => {
            const subjectData = data.filter(d => d.subject === subject);
            timeRanges[subject] = {
                min: d3.min(subjectData, d => d.timestamp),
                max: d3.max(subjectData, d => d.timestamp)
            };
        });
        
        // Get global time range
        const globalMinTime = d3.min(subjects, s => timeRanges[s].min);
        const globalMaxTime = d3.max(subjects, s => timeRanges[s].max);
        
        // Create 100 evenly spaced sample points
        const numSamples = 200;
        const sampleInterval = (globalMaxTime - globalMinTime) / numSamples;
        
        // Create averaged data points
        const averagedData = [];
        
        for (let i = 0; i < numSamples; i++) {
            const targetTime = globalMinTime + (i * sampleInterval);
            
            // Get samples from all subjects at this time
            const samples = [];
            subjects.forEach(subject => {
                const subjectData = data.filter(d => d.subject === subject);
                
                // Find the closest data point
                let closestPoint = null;
                let minTimeDiff = Infinity;
                
                subjectData.forEach(point => {
                    const timeDiff = Math.abs(point.timestamp - targetTime);
                    if (timeDiff < minTimeDiff) {
                        minTimeDiff = timeDiff;
                        closestPoint = point;
                    }
                });
                
                // Only include if it's reasonably close (within one interval)
                if (closestPoint && minTimeDiff <= sampleInterval) {
                    samples.push(closestPoint[metricName]);
                }
            });
            
            // Skip if no samples found
            if (samples.length === 0) continue;
            
            // Calculate average
            const sum = samples.reduce((acc, val) => acc + val, 0);
            const avg = sum / samples.length;
            
            // Create average data point
            averagedData.push({
                timestamp: targetTime,
                subject: 'Average (All Subjects)',
                [metricName]: avg
            });
        }
        
        return averagedData;
    }
    
    /**
     * Show error modal with message
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorModal.style.display = 'block';
    }
    
    /**
     * Format file size in bytes to human-readable format
     */
    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + ' B';
        } else if (bytes < 1048576) {
            return (bytes / 1024).toFixed(1) + ' KB';
        } else {
            return (bytes / 1048576).toFixed(1) + ' MB';
        }
    }
})