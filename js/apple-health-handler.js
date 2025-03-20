/**
 * apple-health-handler.js
 * Handles the final integration of Apple Health data with Cognify
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tab switching
    initializeTabSwitching();
    
    // Initialize Apple Health upload handlers
    initializeAppleHealthUpload();
  });
  
  /**
   * Initialize tab switching functionality
   */
  function initializeTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const csvUploadSection = document.getElementById('csv-upload-section');
    const appleHealthSection = document.getElementById('apple-health-section');
    
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
          document.getElementById('data-configuration').classList.add('hidden');
          document.getElementById('apple-health-configuration').classList.add('hidden');
        } else {
          csvUploadSection.classList.add('hidden');
          appleHealthSection.classList.remove('hidden');
          document.getElementById('data-configuration').classList.add('hidden');
          document.getElementById('apple-health-configuration').classList.add('hidden');
        }
      });
    });
  }
  
  /**
   * Initialize Apple Health upload functionality
   */
  function initializeAppleHealthUpload() {
    // Get DOM elements
    const uploadArea = document.getElementById('apple-health-upload-area');
    const fileInput = document.getElementById('apple-health-file');
    const browseButton = document.getElementById('apple-health-browse-button');
    const fileInfo = document.getElementById('apple-health-file-info');
    const fileName = document.getElementById('apple-health-file-name');
    const fileSize = document.getElementById('apple-health-file-size');
    const removeFileButton = document.getElementById('apple-health-remove-file');
    const visualizeButton = document.getElementById('apple-health-visualize-button');
    const cancelButton = document.getElementById('apple-health-cancel-button');
    
    // Upload area click
    if (uploadArea) {
      uploadArea.addEventListener('click', function() {
        if (!fileInfo.classList.contains('hidden')) return;
        fileInput.click();
      });
    }
    
    // Browse button click
    if (browseButton) {
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
    
    // Cancel button
    if (cancelButton) {
      cancelButton.addEventListener('click', function() {
        resetAppleHealthUpload();
      });
    }
    
    // Visualize button
    if (visualizeButton) {
      visualizeButton.addEventListener('click', function() {
        prepareAndVisualizeAppleHealth();
      });
    }
  }
  
  /**
   * Handle Apple Health file upload
   * @param {File} file The uploaded ZIP file
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
    const baseName = file.name.replace('.zip', '');
    const datasetNameInput = document.getElementById('apple-health-dataset-name');
    if (datasetNameInput) datasetNameInput.value = 'Apple Health - ' + baseName;
    
    // Show loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.remove('hidden');
    }
    
    // Process the ZIP file
    processAppleHealthZip(file)
      .then(() => {
        // Hide loading overlay
        if (loadingOverlay) {
          loadingOverlay.classList.add('hidden');
        }
        
        // Show configuration section
        const configSection = document.getElementById('apple-health-configuration');
        if (configSection) configSection.classList.remove('hidden');
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
    if (window.appleHealthData) {
      window.appleHealthData.flags = [];
      window.appleHealthData.selectedFlag = null;
      window.appleHealthData.dateRanges = {};
      window.appleHealthData.processedData = null;
    }
    
    // Reset dataset name
    const datasetName = document.getElementById('apple-health-dataset-name');
    if (datasetName) datasetName.value = '';
  }
  
  /**
   * Prepare and visualize Apple Health data
   */
  function prepareAndVisualizeAppleHealth() {
    // Check if we have the necessary global data
    if (!window.appleHealthData || !window.appleHealthData.selectedFlag || !window.appleHealthData.processedData) {
      showError('Please select a metric to visualize.');
      return;
    }
    
    // Get configuration values
    const datasetNameInput = document.getElementById('apple-health-dataset-name');
    const datasetName = datasetNameInput ? datasetNameInput.value || 'Apple Health Data' : 'Apple Health Data';
    
    // Show loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.remove('hidden');
    }
    
    try {
      // Get the processed data
      const processedData = window.appleHealthData.processedData;
      
      // Format data for the visualization
      const formattedData = {
        data: processedData.data.map(item => ({
          timestamp: item.timestamp,
          subject: 'Apple Health',
          [processedData.metricName]: item.metric
        })),
        metricName: processedData.metricName,
        timestampColumn: 'timestamp'
      };
      
      // Generate a unique ID for this dataset
      const datasetId = 'custom_' + Date.now();
      
      // Store the dataset in the session cache
      const cachedDatasets = JSON.parse(sessionStorage.getItem('cachedDatasets') || '[]');
      
      // Add this dataset to the cache
      cachedDatasets.push({
        id: datasetId,
        name: datasetName,
        timestamp: Date.now(),
        fileName: `apple_health_${window.appleHealthData.selectedFlag}.csv`,
        color: generateRandomColor()
      });
      
      // Update the cache
      sessionStorage.setItem('cachedDatasets', JSON.stringify(cachedDatasets));
      
      // Store the actual dataset with its unique ID
      sessionStorage.setItem(`customDataset_${datasetId}`, JSON.stringify(formattedData));
      
      // Store dataset info for immediate use
      sessionStorage.setItem('selectedDataset', 'custom_dataset');
      sessionStorage.setItem('datasetName', datasetName);
      sessionStorage.setItem('customDataset', JSON.stringify(formattedData));
      
      // Redirect to visualizer
      setTimeout(function() {
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
   * Generate a random color for dataset album covers
   */
  function generateRandomColor() {
    // Generate a random hue (0-360)
    const hue = Math.floor(Math.random() * 360);
    // Use fixed saturation and lightness for consistency
    return `hsl(${hue}, 80%, 50%)`;
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
  
  /**
   * Show error message
   */
  function showError(message) {
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    
    if (errorMessage) errorMessage.textContent = message;
    if (errorModal) errorModal.style.display = 'block';
  }