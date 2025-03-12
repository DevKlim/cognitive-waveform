/**
 * chart-visualizer.js
 * Handles the D3 line chart visualization
 */

/**
 * Initialize the D3 chart
 */
function initChart() {
    d3.select('#chart-container').selectAll('*').remove();

    const container = document.getElementById('chart-container');
    // Increase top margin to prevent cutoff and bring chart lower
    const margin = { top: 100, right: 20, bottom: 100, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    const svg = d3.select('#chart-container')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom+200)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Use the current metric for plotting
    const yValue = d => d[app.currentMetric] || 0;
    const yLabel = app.currentMetric || 'Value';

    // Handle empty data case
    if (app.data.filtered.length === 0) {
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', '#b3b3b3')
            .text('No data available for this selection');
        
        // Store chart objects even if empty
        app.chart.svg = svg;
        app.chart.width = width;
        app.chart.height = height;
        return;
    }

    // First, sort the data by timestamp to ensure proper line
    const sortedData = [...app.data.filtered].sort((a, b) => a.timestamp - b.timestamp);
    
    // Create a map to ensure only one value per timestamp
    const dataMap = new Map();
    sortedData.forEach(d => {
        // If there's a conflict, use the latest value (sorted order)
        dataMap.set(d.timestamp, d);
    });
    
    // Convert back to array
    const uniqueData = Array.from(dataMap.values());
    
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(uniqueData, d => d.timestamp)])
        .range([0, width]);
    
    // Handle cases where all values might be the same
    let yMin = d3.min(uniqueData, yValue);
    let yMax = d3.max(uniqueData, yValue);
    
    // If min and max are the same, add a small buffer
    if (yMin === yMax) {
        yMin = yMin * 0.8; // Increase padding at bottom
        yMax = yMax * 1.2; // Increase padding at top
    } else {
        // Add more padding to prevent cutoff (20% instead of 10%)
        const range = yMax - yMin;
        const padding = range * 0.2;
        yMin -= padding;
        yMax += padding;
    }
    
    const yScale = d3.scaleLinear()
        .domain([yMin, yMax])
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

    // Line generator with monotone interpolation for smooth curves
    const lineGenerator = d3.line()
        .x(d => xScale(d.timestamp))
        .y(d => yScale(yValue(d)))
        .curve(d3.curveMonotoneX);

    // Add data line with a gradient
    // Create gradient for line
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "line-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#1db954");

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#4a90e2");

    // Add data line with gradient
    svg.append('path')
        .datum(uniqueData)
        .attr('class', 'heart-rate-line')
        .attr('d', lineGenerator)
        .style("stroke", "url(#line-gradient)")
        .style("stroke-width", "2.5px"); // Make line slightly thicker

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
            const index = bisect(uniqueData, timestamp);
            const d0 = uniqueData[Math.max(0, index - 1)];
            const d1 = uniqueData[Math.min(uniqueData.length - 1, index)];
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

/**
 * Chart X-Axis Label Position Fix
 * This adjusts the position of the X-axis label to be closer to the chart
 */

/**
 * Create a function to patch the existing initChart function
 */
function patchChartInitFunction() {
  // Store the original function
  const originalInitChart = window.initChart;
  
  // Replace with our patched version
  window.initChart = function() {
    // Call the original function first
    originalInitChart.apply(this, arguments);
    
    // Now adjust the X-axis label position
    const svg = d3.select('#chart-container svg');
    if (!svg.empty()) {
      // Find the X-axis label
      const xAxisLabel = svg.select('.axis-label:not([transform*="rotate"])');
      
      if (!xAxisLabel.empty()) {
        // Get the current height value from the chart container
        const chartContainer = document.getElementById('chart-container');
        if (!chartContainer) return;
        
        // Get margin from the original function (approximated if needed)
        const margin = { top: 100, right: 20, bottom: 100, left: 50 };
        const height = chartContainer.clientHeight - margin.top - margin.bottom;
        
        // Adjust the Y position to be closer to the chart
        // Original is (height + margin.bottom - 5)
        // We'll reduce the gap by moving it 30px higher
        xAxisLabel.attr('y', height + (margin.bottom - 35));
        
        console.log('X-axis label position adjusted');
      }
    }
  };
  
  // Force a chart redraw to apply changes
  if (typeof app !== 'undefined' && app.data && app.data.filtered.length > 0) {
    initChart();
  }
}

// Initialize our patch when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Use a short delay to ensure the original function is loaded
  setTimeout(patchChartInitFunction, 1500);
});