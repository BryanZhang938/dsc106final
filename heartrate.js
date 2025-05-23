// Function to parse heart rate data
function parseHeartRate(d) {
  return {
    datetime: d3.timeParse("%H:%M:%S")(d.time),
    heartRate: +d["HR"]
  };
}

// Function to process heart rate data and find peak hour
function processHeartRateData(data) {
  // Validate data
  if (!data || data.length === 0) {
    console.error("No heart rate data available");
    return { hourlyData: [], peakHour: null };
  }

  // Filter out invalid data points
  const validData = data.filter(d => !isNaN(d.heartRate) && d.datetime !== null);

  if (validData.length === 0) {
    console.error("No valid heart rate data points found");
    return { hourlyData: [], peakHour: null };
  }

  // Group data by hour and calculate average heart rate
  const hourlyData = Array.from(
    d3.rollup(
      validData,
      v => d3.mean(v, d => d.heartRate),
      d => d3.timeHour(d.datetime)
    ),
    ([hour, avgRate]) => ({ hour, avgRate })
  ).sort((a, b) => a.hour - b.hour);

  // Find the hour with highest average heart rate
  const peakHour = hourlyData.length > 0 
    ? hourlyData.reduce((a, b) => b.avgRate > a.avgRate ? b : a, hourlyData[0])
    : null;

  return { hourlyData, peakHour };
}

// Function to draw heart rate visualization
function drawHeartRate(data) {
  const { hourlyData, peakHour } = processHeartRateData(data);

  // Create metrics display
  d3.select("#heartrate-metrics").html(`
    <div class="metric">
      <strong>${peakHour ? peakHour.avgRate.toFixed(1) : 'N/A'}</strong><br>Peak Heart Rate
    </div>
    <div class="metric">
      <strong>${peakHour ? d3.timeFormat("%-I %p")(peakHour.hour) : 'N/A'}</strong><br>Peak Hour
    </div>
  `);

  if (hourlyData.length === 0) {
    console.error("No hourly heart rate data available for visualization");
    return;
  }

  // Create chart
  const svg = d3.select("#heartrate-chart");
  const { width, height } = svg.node().getBoundingClientRect();
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };

  svg.selectAll("*").remove();

  const x = d3.scaleTime()
    .domain(d3.extent(hourlyData, d => d.hour))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(hourlyData, d => d.avgRate)]).nice()
    .range([height - margin.bottom, margin.top]);

  // Add bars
  const barW = ((width - margin.left - margin.right) / hourlyData.length) * 0.8;
  svg.append("g")
    .selectAll("rect")
    .data(hourlyData)
    .join("rect")
    .attr("x", d => x(d.hour) - barW/2)
    .attr("y", d => y(d.avgRate))
    .attr("width", barW)
    .attr("height", d => y(0) - y(d.avgRate))
    .attr("fill", d => peakHour && d.hour.getTime() === peakHour.hour.getTime() ? "#ff7f0e" : "steelblue")
    .attr("opacity", 0.6);

  // Add axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x)
      .ticks(d3.timeHour.every(2))
      .tickFormat(d3.timeFormat("%-I %p")));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Add labels
  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", `translate(${width/2}, ${height - 5})`)
    .style("text-anchor", "middle")
    .text("Hour of Day");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height/2)
    .attr("y", 15)
    .style("text-anchor", "middle")
    .text("Average Heart Rate (bpm)");

  // Add title
  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width/2)
    .attr("y", margin.top/2)
    .style("text-anchor", "middle")
    .text("Hourly Average Heart Rate");
}

// Export functions for use in other modules
export { parseHeartRate, drawHeartRate }; 