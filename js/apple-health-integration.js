/**
 * apple-health-integration.js
 * Enhanced handling for Apple Health export.zip file processing and integration with Cognify
 */

// Global state for Apple Health data
window.appleHealthData = {
    flags: [],
    selectedFlag: null,
    dateRanges: {},
    processedData: null
  };
  
  document.addEventListener('DOMContentLoaded', function() {
    initAppleHealthTab();
    setupEventListeners();
  });
  
  /**
   * Initialize Apple Health integration tab
   */
  function initAppleHealthTab() {
    // Add CSS for improved loading spinner
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .loading-spinner-small {
        width: 30px;
        height: 30px;
        border: 3px solid rgba(29, 185, 84, 0.3);
        border-radius: 50%;
        border-top-color: #1db954;
        animation: spin 1s infinite ease-in-out;
        display: inline-block;
        margin-right: 10px;
        vertical-align: middle;
      }
      
      .apple-health-icon {
        filter: drop-shadow(0 0 3px rgba(255, 45, 85, 0.5));
      }
      
      .processing-indicator {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border-radius: 8px;
        z-index: 10;
      }
      
      .processing-indicator p {
        color: #fff;
        margin-top: 10px;
        font-size: 14px;
      }
      
      .progress-bar-container {
        width: 80%;
        height: 4px;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        margin-top: 10px;
        overflow: hidden;
      }
      
      .progress-bar {
        height: 100%;
        background-color: #1db954;
        width: 0%;
        transition: width 0.3s ease;
      }
      
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }
      
      .loading-message {
        animation: pulse 1.5s infinite;
      }
    `;
    document.head.appendChild(styleElement);
  }
  
  /**
   * Set up event listeners for Apple Health integration
   */
  function setupEventListeners() {
    // File upload handlers
    const uploadArea = document.getElementById('apple-health-upload-area');
    const fileInput = document.getElementById('apple-health-file');
    const browseButton = document.getElementById('apple-health-browse-button');
    const fileInfo = document.getElementById('apple-health-file-info');
    const removeFileButton = document.getElementById('apple-health-remove-file');
    const visualizeButton = document.getElementById('apple-health-visualize-button');
    const cancelButton = document.getElementById('apple-health-cancel-button');
    
    // Upload area click
    if (uploadArea && fileInput) {
      uploadArea.addEventListener('click', function() {
        if (!fileInfo || fileInfo.classList.contains('hidden')) {
          fileInput.click();
        }
      });
    }
    
    // Browse button click
    if (browseButton && fileInput) {
      browseButton.addEventListener('click', function(e) {
        e.stopPropagation();
        fileInput.click();
      });
    }
    
    // File input change
    if (fileInput) {
      fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
          handleAppleHealthFileUpload(this.files[0]);
        }
      });
    }
    
    // Drag and drop events
    if (uploadArea) {
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
          handleAppleHealthFileUpload(e.dataTransfer.files[0]);
        }
      });
    }
    
    // Remove file button
    if (removeFileButton) {
      removeFileButton.addEventListener('click', function(e) {
        e.stopPropagation();
        resetAppleHealthUpload();
      });
    }
    
    // Visualize button
    if (visualizeButton) {
      visualizeButton.addEventListener('click', prepareAndVisualizeAppleHealth);
    }
    
    // Cancel button
    if (cancelButton) {
      cancelButton.addEventListener('click', resetAppleHealthUpload);
    }
    
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const csvUploadSection = document.getElementById('csv-upload-section');
    const appleHealthSection = document.getElementById('apple-health-section');
    
    if (tabButtons && csvUploadSection && appleHealthSection) {
      tabButtons.forEach(button => {
        button.addEventListener('click', function() {
          const tabName = this.getAttribute('data-tab');
          
          // Toggle active class on buttons
          tabButtons.forEach(btn => btn.classList.remove('active'));
          this.classList.add('active');
          
          // Show/hide relevant sections
          if (tabName === 'csv-upload') {
            csvUploadSection.classList.remove('hidden');
            appleHealthSection.classList.add('hidden');
            const dataConfig = document.getElementById('data-configuration');
            const appleConfig = document.getElementById('apple-health-configuration');
            if (dataConfig) dataConfig.classList.add('hidden');
            if (appleConfig) appleConfig.classList.add('hidden');
          } else {
            csvUploadSection.classList.add('hidden');
            appleHealthSection.classList.remove('hidden');
            const dataConfig = document.getElementById('data-configuration');
            const appleConfig = document.getElementById('apple-health-configuration');
            if (dataConfig) dataConfig.classList.add('hidden');
            if (appleConfig) appleConfig.classList.add('hidden');
          }
        });
      });
    }
    
    // Error modal close button
    const closeModalButton = document.querySelector('.close-modal');
    const errorOkButton = document.getElementById('error-ok');
    const errorModal = document.getElementById('error-modal');
    
    if (closeModalButton && errorModal) {
      closeModalButton.addEventListener('click', function() {
        errorModal.style.display = 'none';
      });
    }
    
    if (errorOkButton && errorModal) {
      errorOkButton.addEventListener('click', function() {
        errorModal.style.display = 'none';
      });
    }
  }
  
  /**
   * Handle Apple Health file upload
   * @param {File} file - The uploaded ZIP file
   */
  function handleAppleHealthFileUpload(file) {
    // Check if file is ZIP
    if (!file.name.toLowerCase().endsWith('.zip')) {
      showError('Please upload a valid Apple Health export.zip file.');
      return;
    }
    
    // Update UI to show file info
    const fileName = document.getElementById('apple-health-file-name');
    const fileSize = document.getElementById('apple-health-file-size');
    const fileInfo = document.getElementById('apple-health-file-info');
    
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = formatFileSize(file.size);
    if (fileInfo) fileInfo.classList.remove('hidden');
    
    // Auto-fill dataset name based on file name
    const datasetNameInput = document.getElementById('apple-health-dataset-name');
    if (datasetNameInput) {
      const baseName = file.name.replace('.zip', '');
      datasetNameInput.value = 'Apple Health - ' + baseName;
    }
    
    // Show loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.remove('hidden');
    }
    
    // Process ZIP file
    processAppleHealthZip(file)
      .then(() => {
        // Hide loading overlay
        if (loadingOverlay) {
          loadingOverlay.classList.add('hidden');
        }
        
        // Show configuration section
        const configSection = document.getElementById('apple-health-configuration');
        if (configSection) {
          configSection.classList.remove('hidden');
        }
      })
      .catch(error => {
        // Hide loading overlay
        if (loadingOverlay) {
          loadingOverlay.classList.add('hidden');
        }
        
        showError('Error processing Apple Health data: ' + error.message);
      });
  }
  
  /**
   * Process Apple Health ZIP file
   * - Uses app.py as inspiration for structure
   * - Similar to Apple Health's Python parser but implemented in JS
   */
  async function processAppleHealthZip(file) {
    try {
      // Clear previous data
      window.appleHealthData.flags = [];
      window.appleHealthData.selectedFlag = null;
      window.appleHealthData.dateRanges = {};
      window.appleHealthData.processedData = null;
      
      // Update the UI to show processing
      const metricsList = document.getElementById('apple-health-metrics-list');
      if (metricsList) {
        metricsList.innerHTML = `
          <div class="loading-spinner-small"></div>
          <p class="loading-message">Extracting ZIP file and processing data...</p>
        `;
      }
      
      // Similar to app.py's implementation, but for client-side
      updateProcessingStatus('Initializing...', 5);
      
      // Make sure JSZip is available
      if (typeof JSZip === 'undefined') {
        console.log('Loading JSZip dynamically...');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
      }
      
      // Create a new JSZip instance
      const zip = new JSZip();
      
      // Load the ZIP file
      updateProcessingStatus('Reading ZIP file...', 15);
      const zipContents = await zip.loadAsync(file);
      
      // Look for export.xml file
      updateProcessingStatus('Searching for health data...', 30);
      let exportXmlFile = null;
      
      // Find export.xml with various possible paths (like in app.py)
      for (const filename in zipContents.files) {
        if (filename.endsWith('export.xml') || 
            filename.includes('apple_health_export/export.xml') || 
            filename.includes('apple_health_export\\export.xml')) {
          exportXmlFile = zipContents.files[filename];
          break;
        }
      }
      
      if (!exportXmlFile) {
        throw new Error('Could not find export.xml in the Apple Health export ZIP file');
      }
      
      // Get XML content
      updateProcessingStatus('Extracting XML data...', 40);
      const xmlContent = await exportXmlFile.async('string');
      
      // Parse XML
      updateProcessingStatus('Parsing XML...', 50);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Find all Record elements in the XML
      updateProcessingStatus('Processing health records...', 60);
      const records = xmlDoc.querySelectorAll('Record');
      console.log(`Found ${records.length} records in XML file`);
      
      if (records.length === 0) {
        throw new Error('No health records found in the export');
      }
      
      // Group records by type (similar to app.py approach)
      updateProcessingStatus('Grouping records by type...', 70);
      const recordsByType = {};
      
      // Process records in chunks to prevent UI freezing
      const recordsArray = Array.from(records);
      const chunkSize = 5000;
      const totalChunks = Math.ceil(recordsArray.length / chunkSize);
      
      for (let i = 0; i < totalChunks; i++) {
        const chunk = recordsArray.slice(i * chunkSize, (i + 1) * chunkSize);
        
        // Update progress
        updateProcessingStatus(`Processing records chunk ${i+1}/${totalChunks}...`, 
          70 + (i / totalChunks) * 15);
        
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Process each record in the chunk
        chunk.forEach(record => {
          const type = record.getAttribute('type');
          const value = parseFloat(record.getAttribute('value'));
          const startDate = new Date(record.getAttribute('startDate'));
          const unit = record.getAttribute('unit') || '';
          
          // Skip invalid records
          if (isNaN(value) || !isValidDate(startDate)) return;
          
          // Initialize type array if needed
          if (!recordsByType[type]) {
            recordsByType[type] = {
              records: [],
              unit: unit
            };
          }
          
          // Add record
          recordsByType[type].records.push({
            value,
            startDate,
            unit
          });
        });
      }
      
      // Format data for visualization
      updateProcessingStatus('Formatting data for visualization...', 90);
      
      // Create metrics array
      const metrics = [];
      
      for (const [type, data] of Object.entries(recordsByType)) {
        // Only include types with enough data
        if (data.records.length >= 10) {
          // Sort by date
          data.records.sort((a, b) => a.startDate - b.startDate);
          
          // Create metric object
          metrics.push({
            id: type,
            name: formatHealthMetricName(type),
            unit: data.unit,
            count: data.records.length,
            records: data.records
          });
        }
      }
      
      // Sort by record count (most data first)
      metrics.sort((a, b) => b.count - a.count);
      
      // Store metrics
      window.appleHealthData.flags = metrics;
      
      // Update UI with metrics
      updateProcessingStatus('Completed! Found ' + metrics.length + ' metrics.', 100);
      updateAppleHealthMetricsList(metrics);
      
      return true;
      
    } catch (error) {
      console.error('Error processing Apple Health data:', error);
      
      // Show error in UI
      const metricsList = document.getElementById('apple-health-metrics-list');
      if (metricsList) {
        metricsList.innerHTML = `
          <div class="error-message">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#ff6b6b">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p>Error processing Apple Health data: ${error.message}</p>
          </div>
        `;
      }
      
      throw error;
    }
  }
  
  /**
   * Update processing status
   * @param {string} message - Status message
   * @param {number} percentage - Progress percentage (0-100)
   */
  function updateProcessingStatus(message, percentage) {
    const metricsList = document.getElementById('apple-health-metrics-list');
    if (!metricsList) return;
    
    metricsList.innerHTML = `
      <div class="loading-spinner-small"></div>
      <p class="loading-message">${message}</p>
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${percentage}%"></div>
      </div>
    `;
  }
  
  /**
   * Format health metric name for display
   * @param {string} type - Raw type from Apple Health
   * @returns {string} - Formatted name
   */
  function formatHealthMetricName(type) {
    // Remove HK prefixes (similar to app.py's display logic)
    let name = type
      .replace('HKQuantityTypeIdentifier', '')
      .replace('HKCategoryTypeIdentifier', '');
    
    // Add spaces before capitals
    name = name.replace(/([A-Z])/g, ' $1').trim();
    
    // Format common abbreviations
    name = name
      .replace('B P', 'Blood Pressure')
      .replace('H R', 'Heart Rate')
      .replace('V O', 'VO');
    
    return name;
  }
  
  /**
   * Update the metrics list in the UI
   * @param {Array} metrics - Array of metric objects
   */
  function updateAppleHealthMetricsList(metrics) {
    const metricsList = document.getElementById('apple-health-metrics-list');
    if (!metricsList) return;
    
    // Clear existing content
    metricsList.innerHTML = '';
    
    if (metrics.length === 0) {
      metricsList.innerHTML = `
        <div class="no-metrics-message">
          <p>No usable health metrics found in this export.</p>
        </div>
      `;
      return;
    }
    
    // Helper function to create metric card
    function createMetricCard(metric) {
      const card = document.createElement('div');
      card.className = 'metric-card';
      card.setAttribute('data-metric-id', metric.id);
      
      const displayUnit = metric.unit || '';
      
      card.innerHTML = `
        <h5>${metric.name}</h5>
        <p>${metric.count.toLocaleString()} data points ${displayUnit ? `(${displayUnit})` : ''}</p>
      `;
      
      // Add click handler
      card.addEventListener('click', () => {
        selectMetric(metric, card);
      });
      
      return card;
    }
    
    // Create and add cards for each metric
    // First, add heart rate and stress related metrics at the top
    const stressRelatedMetrics = ['HeartRate', 'RestingHeartRate', 'HeartRateVariabilitySDNN', 
      'RespiratoryRate', 'OxygenSaturation', 'BloodPressure', 'StepCount'];
    
    // Sort metrics to prioritize stress-related ones
    const sortedMetrics = [...metrics].sort((a, b) => {
      const aIsStressRelated = stressRelatedMetrics.some(term => a.id.includes(term));
      const bIsStressRelated = stressRelatedMetrics.some(term => b.id.includes(term));
      
      if (aIsStressRelated && !bIsStressRelated) return -1;
      if (!aIsStressRelated && bIsStressRelated) return 1;
      return b.count - a.count; // If both or neither are stress-related, sort by count
    });
    
    // Add cards to UI
    sortedMetrics.forEach(metric => {
      metricsList.appendChild(createMetricCard(metric));
    });
  }
  
  /**
   * Select a metric and update the UI
   * @param {Object} metric - Selected metric object
   * @param {HTMLElement} card - Selected card element
   */
  function selectMetric(metric, card) {
    // Update selected card UI
    document.querySelectorAll('.metric-card').forEach(c => {
      c.classList.remove('selected');
    });
    card.classList.add('selected');
    
    // Store selected metric
    window.appleHealthData.selectedFlag = metric.id;
    
    // Process date range
    processDateRange(metric);
    
    // Show date range selection
    const dateRangeSelection = document.getElementById('date-range-selection');
    if (dateRangeSelection) {
      dateRangeSelection.classList.remove('hidden');
    }
    
    // Enable visualize button
    const visualizeButton = document.getElementById('apple-health-visualize-button');
    if (visualizeButton) {
      visualizeButton.disabled = false;
    }
    
    // Generate preview data
    generatePreviewData(metric);
  }
  
  /**
   * Process date range for selected metric
   * @param {Object} metric - Selected metric object
   */
  function processDateRange(metric) {
    // Group data by day (similar to app.py's GroupByDay approach)
    const dailyValues = {};
    
    metric.records.forEach(record => {
      const date = record.startDate;
      const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayKey = day.toISOString().split('T')[0];
      
      if (!dailyValues[dayKey] || record.value > dailyValues[dayKey].value) {
        dailyValues[dayKey] = {
          date: day,
          value: record.value
        };
      }
    });
    
    // Convert to arrays
    const sortedData = Object.values(dailyValues).sort((a, b) => a.date - b.date);
    
    const dates = sortedData.map(item => item.date);
    const values = sortedData.map(item => item.value);
    
    // Store data
    window.appleHealthData.dateRanges[metric.id] = {
      dates: dates,
      values: values,
      startIndex: 0,
      endIndex: dates.length - 1
    };
    
    // Update date range slider
    updateDateRangeSlider(metric.id);
    
    // Show preview section
    const previewSection = document.getElementById('apple-health-preview-section');
    if (previewSection) {
      previewSection.classList.remove('hidden');
    }
  }
  
  /**
   * Update date range slider UI
   * @param {string} metricId - ID of the selected metric
   */
  function updateDateRangeSlider(metricId) {
    const sliderContainer = document.getElementById('date-range-slider');
    const dateRange = window.appleHealthData.dateRanges[metricId];
    const startDateLabel = document.getElementById('start-date-label');
    const endDateLabel = document.getElementById('end-date-label');
    
    if (!sliderContainer || !dateRange || !startDateLabel || !endDateLabel) return;
    
    // Format date
    const formatDate = (date) => {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    
    // Update labels
    startDateLabel.textContent = `Start: ${formatDate(dateRange.dates[dateRange.startIndex])}`;
    endDateLabel.textContent = `End: ${formatDate(dateRange.dates[dateRange.endIndex])}`;
    
    // Create two separate sliders instead of overlapping them
    sliderContainer.innerHTML = `
      <div>
        <label for="date-range-start">Start Date:</label>
        <input type="range" class="date-range-slider" min="0" max="${dateRange.dates.length - 1}" 
          value="${dateRange.startIndex}" id="date-range-start">
      </div>
      <div style="margin-top: 20px;">
        <label for="date-range-end">End Date:</label>
        <input type="range" class="date-range-slider" min="0" max="${dateRange.dates.length - 1}" 
          value="${dateRange.endIndex}" id="date-range-end">
      </div>
    `;
    
    // Add event listeners
    const startSlider = document.getElementById('date-range-start');
    const endSlider = document.getElementById('date-range-end');
    
    if (startSlider && endSlider) {
      startSlider.addEventListener('input', () => {
        // Keep start before end
        if (parseInt(startSlider.value) > parseInt(endSlider.value)) {
          startSlider.value = endSlider.value;
        }
        
        // Update state
        dateRange.startIndex = parseInt(startSlider.value);
        startDateLabel.textContent = `Start: ${formatDate(dateRange.dates[dateRange.startIndex])}`;
        
        // Update preview
        const metric = window.appleHealthData.flags.find(m => m.id === metricId);
        if (metric) generatePreviewData(metric);
      });
      
      endSlider.addEventListener('input', () => {
        // Keep end after start
        if (parseInt(endSlider.value) < parseInt(startSlider.value)) {
          endSlider.value = startSlider.value;
        }
        
        // Update state
        dateRange.endIndex = parseInt(endSlider.value);
        endDateLabel.textContent = `End: ${formatDate(dateRange.dates[dateRange.endIndex])}`;
        
        // Update preview
        const metric = window.appleHealthData.flags.find(m => m.id === metricId);
        if (metric) generatePreviewData(metric);
      });
    }
  }
  /**
   * Generate preview data for the selected metric
   * @param {Object} metric - Selected metric object
   */
  function generatePreviewData(metric) {
    const dateRange = window.appleHealthData.dateRanges[metric.id];
    if (!dateRange) return;
    
    // Get selected date range
    const startDate = dateRange.dates[dateRange.startIndex];
    const endDate = dateRange.dates[dateRange.endIndex];
    
    // Create normalized data (days from start) within selected range
    // This is similar to app.py's normalization approach
    const normalizedData = [];
    
    for (let i = dateRange.startIndex; i <= dateRange.endIndex; i++) {
      const date = dateRange.dates[i];
      const value = dateRange.values[i];
      const dayOffset = Math.round((date - startDate) / (1000 * 60 * 60 * 24)); // days since start
      
      normalizedData.push({
        timestamp: dayOffset,
        metric: value
      });
    }
    
    // Store processed data for visualization
    window.appleHealthData.processedData = {
      metricName: metric.name,
      unit: metric.unit,
      data: normalizedData,
      startDate: startDate,
      endDate: endDate
    };
    
    // Update preview table
    const previewTable = document.getElementById('apple-health-preview-table');
    if (!previewTable) return;
    
    // Select preview samples
    let previewData;
    
    if (normalizedData.length <= 5) {
      previewData = normalizedData;
    } else {
      // Take first, last, and three evenly spaced samples
      previewData = [
        normalizedData[0],
        normalizedData[Math.floor(normalizedData.length * 0.25)],
        normalizedData[Math.floor(normalizedData.length * 0.5)],
        normalizedData[Math.floor(normalizedData.length * 0.75)],
        normalizedData[normalizedData.length - 1]
      ];
    }
    
    // Build preview table
    previewTable.innerHTML = `
      <tr>
        <th>Timestamp (days)</th>
        <th>${metric.name} ${metric.unit ? `(${metric.unit})` : ''}</th>
      </tr>
      ${previewData.map(row => `
        <tr>
          <td>${row.timestamp}</td>
          <td>${typeof row.metric === 'number' ? row.metric.toFixed(2) : row.metric}</td>
        </tr>
      `).join('')}
    `;
  }
  
  /**
   * Prepare and visualize Apple Health data (like app.py's download_csv route)
   */
  function prepareAndVisualizeAppleHealth() {
    if (!window.appleHealthData.selectedFlag || !window.appleHealthData.processedData) {
      showError('Please select a metric to visualize.');
      return;
    }
    
    // Get configuration values
    const datasetNameInput = document.getElementById('apple-health-dataset-name');
    const datasetName = datasetNameInput ? 
      (datasetNameInput.value || window.appleHealthData.processedData.metricName) : 
      window.appleHealthData.processedData.metricName;
    
    // Show loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.remove('hidden');
    }
    
    try {
      // Format data for visualization (similar to app.py's CSV output)
      const processedData = window.appleHealthData.processedData;
      
      // Create data structure compatible with Cognify visualizer
      const formattedData = {
        data: processedData.data.map(item => ({
          timestamp: item.timestamp,
          subject: 'Apple Health',
          [processedData.metricName]: item.metric
        })),
        metricName: processedData.metricName,
        timestampColumn: 'timestamp'
      };
      
      // Generate unique ID for dataset
      const datasetId = 'custom_' + Date.now();
      
      // Store in session storage
      const cachedDatasets = JSON.parse(sessionStorage.getItem('cachedDatasets') || '[]');
      
      cachedDatasets.push({
        id: datasetId,
        name: datasetName,
        timestamp: Date.now(),
        fileName: `apple_health_${window.appleHealthData.selectedFlag}.csv`,
        color: generateRandomColor()
      });
      
      sessionStorage.setItem('cachedDatasets', JSON.stringify(cachedDatasets));
      sessionStorage.setItem(`customDataset_${datasetId}`, JSON.stringify(formattedData));
      
      // Set as current dataset
      sessionStorage.setItem('selectedDataset', 'custom_dataset');
      sessionStorage.setItem('datasetName', datasetName);
      sessionStorage.setItem('customDataset', JSON.stringify(formattedData));
      
      // Redirect to visualizer
      setTimeout(() => {
        window.location.href = 'visualizer.html';
      }, 1000);
      
    } catch (error) {
      if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
      }
      showError('Error processing data: ' + error.message);
    }
  }
  
  /**
   * Reset Apple Health upload
   */
  function resetAppleHealthUpload() {
    // Reset file input
    const fileInput = document.getElementById('apple-health-file');
    if (fileInput) fileInput.value = '';
    
    // Hide file info
    const fileInfo = document.getElementById('apple-health-file-info');
    if (fileInfo) fileInfo.classList.add('hidden');
    
    // Hide configuration section
    const configSection = document.getElementById('apple-health-configuration');
    if (configSection) configSection.classList.add('hidden');
    
    // Reset global state
    window.appleHealthData.flags = [];
    window.appleHealthData.selectedFlag = null;
    window.appleHealthData.dateRanges = {};
    window.appleHealthData.processedData = null;
    
    // Reset dataset name
    const datasetNameInput = document.getElementById('apple-health-dataset-name');
    if (datasetNameInput) datasetNameInput.value = '';
  }
  
  /**
   * Load a script dynamically
   * @param {string} src - Script URL
   * @returns {Promise} Promise that resolves when script is loaded
   */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  /**
   * Check if a date is valid
   * @param {Date} date - Date to check
   * @returns {boolean} - Whether date is valid
   */
  function isValidDate(date) {
    return date instanceof Date && !isNaN(date);
  }
  
  /**
   * Show error message in modal
   * @param {string} message - Error message
   */
  function showError(message) {
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    
    if (errorMessage) errorMessage.textContent = message;
    if (errorModal) errorModal.style.display = 'block';
  }
  
  /**
   * Format file size in bytes to human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
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
  
  /**
   * Generate a random color for dataset visualization
   * @returns {string} - HSL color string
   */
  function generateRandomColor() {
    // Generate a random hue (0-360)
    const hue = Math.floor(Math.random() * 360);
    // Use fixed saturation and lightness for consistency
    return `hsl(${hue}, 80%, 50%)`;
  }