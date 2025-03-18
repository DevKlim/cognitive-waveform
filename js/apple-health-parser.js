/**
 * apple-health-parser.js
 * Parses Apple Health XML export data into a format compatible with Cognify visualization
 */

/**
 * Parse Apple Health XML data and convert to CSV format
 * @param {string} xmlData - The raw XML data from Apple Health export
 * @param {Array} metricTypes - Array of metric types to extract (e.g. ['HKQuantityTypeIdentifierHeartRate'])
 * @returns {Object} Object containing parsed data, metrics, and headers
 */
function parseAppleHealthXML(xmlData, metricTypes = []) {
    console.log('Starting to parse Apple Health XML data...');
    
    // Create a DOM parser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
    
    // Check if parsing was successful
    if (xmlDoc.querySelector('parsererror')) {
        throw new Error('XML parsing error: Invalid XML format');
    }
    
    // Get all Record elements
    const records = xmlDoc.querySelectorAll('Record');
    console.log(`Found ${records.length} records in the XML data`);
    
    if (records.length === 0) {
        throw new Error('No Record elements found in the XML data');
    }
    
    // If no specific metric types provided, discover available types
    const availableMetrics = new Set();
    if (metricTypes.length === 0) {
        records.forEach(record => {
            const type = record.getAttribute('type');
            if (type) availableMetrics.add(type);
        });
        metricTypes = Array.from(availableMetrics);
    }
    
    console.log(`Processing the following metric types: ${metricTypes.join(', ')}`);
    
    // Process records
    const processedData = [];
    const allMetrics = new Set();
    
    records.forEach(record => {
        const type = record.getAttribute('type');
        
        // Skip if not in our list of desired metrics
        if (!metricTypes.includes(type) && metricTypes.length > 0) {
            return;
        }
        
        // Extract basic information
        const startDate = new Date(record.getAttribute('startDate')).getTime();
        const endDate = new Date(record.getAttribute('endDate')).getTime();
        const value = parseFloat(record.getAttribute('value') || '0');
        const unit = record.getAttribute('unit') || '';
        const sourceName = record.getAttribute('sourceName') || 'Unknown';
        
        // Skip if missing essential data
        if (isNaN(startDate) || isNaN(value)) {
            return;
        }
        
        // Simple metric name extraction from the type (remove prefix)
        let metricName = type.replace('HKQuantityTypeIdentifier', '');
        
        // Add to the set of metrics
        allMetrics.add(metricName);
        
        // Create a data point
        const dataPoint = {
            timestamp: startDate / 1000, // Convert to seconds for compatibility
            subject: sourceName,
            metricType: type,
            [metricName]: value,
            unit: unit
        };
        
        // Add metadata if available
        const metadataEntries = record.querySelectorAll('MetadataEntry');
        if (metadataEntries.length > 0) {
            dataPoint.metadata = {};
            metadataEntries.forEach(entry => {
                const key = entry.getAttribute('key');
                const value = entry.getAttribute('value');
                if (key && value) {
                    dataPoint.metadata[key] = value;
                }
            });
        }
        
        processedData.push(dataPoint);
    });
    
    // Sort by timestamp
    processedData.sort((a, b) => a.timestamp - b.timestamp);
    
    console.log(`Successfully processed ${processedData.length} data points for ${allMetrics.size} metrics`);
    
    // Generate headers for CSV
    const baseHeaders = ['timestamp', 'subject', 'metricType'];
    const metricHeaders = Array.from(allMetrics);
    const allHeaders = [...baseHeaders, ...metricHeaders, 'unit', 'metadata'];
    
    return {
        data: processedData,
        metrics: Array.from(allMetrics),
        headers: allHeaders
    };
}

/**
 * Convert parsed Apple Health data to CSV string
 * @param {Object} parsedData - Object from parseAppleHealthXML function
 * @returns {string} CSV formatted string
 */
function convertToCSV(parsedData) {
    const { data, headers } = parsedData;
    
    // Create CSV header row
    const csvRows = [headers.join(',')];
    
    // Add data rows
    data.forEach(item => {
        const row = headers.map(header => {
            if (header === 'metadata' && item.metadata) {
                return JSON.stringify(item.metadata).replace(/,/g, ';');
            }
            return item[header] !== undefined ? item[header] : '';
        });
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

/**
 * Group parsed data by metric type
 * @param {Object} parsedData - Object from parseAppleHealthXML function
 * @returns {Object} Object with metric names as keys and arrays of data points as values
 */
function groupByMetric(parsedData) {
    const { data, metrics } = parsedData;
    const groupedData = {};
    
    // Initialize groups
    metrics.forEach(metric => {
        groupedData[metric] = [];
    });
    
    // Group data by metric
    data.forEach(item => {
        metrics.forEach(metric => {
            if (item[metric] !== undefined) {
                // Create a simplified data point
                const dataPoint = {
                    timestamp: item.timestamp,
                    subject: item.subject,
                    value: item[metric],
                    unit: item.unit
                };
                groupedData[metric].push(dataPoint);
            }
        });
    });
    
    return groupedData;
}

/**
 * Create multiple CSV files, one for each metric type
 * @param {Object} parsedData - Object from parseAppleHealthXML function
 * @returns {Object} Object with metric names as keys and CSV strings as values
 */
function createMetricCSVs(parsedData) {
    const groupedData = groupByMetric(parsedData);
    const csvFiles = {};
    
    Object.keys(groupedData).forEach(metric => {
        const data = groupedData[metric];
        if (data.length === 0) return;
        
        // Get headers from the first item
        const headers = Object.keys(data[0]);
        
        // Create CSV header row
        const csvRows = [headers.join(',')];
        
        // Add data rows
        data.forEach(item => {
            const row = headers.map(header => item[header] !== undefined ? item[header] : '');
            csvRows.push(row.join(','));
        });
        
        csvFiles[metric] = csvRows.join('\n');
    });
    
    return csvFiles;
}

/**
 * Generate a Blob object for download
 * @param {string} csvString - CSV data as string
 * @param {string} fileName - Name for the download file
 * @returns {Blob} Blob object containing the CSV data
 */
function generateCSVBlob(csvString, fileName = 'apple-health-data.csv') {
    return new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseAppleHealthXML,
        convertToCSV,
        groupByMetric,
        createMetricCSVs,
        generateCSVBlob
    };
}