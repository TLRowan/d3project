const width = 800;
const height = 600;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

const svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

svg.append("image")
    .attr("xlink:href", "map.bmp")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("preserveAspectRatio", "none");

d3.csv("AllBirdsv4 Cleaned.csv").then(data => {
    const filteredData = data.filter(d => d.English_name === "Rose-crested Blue Pipit");
    const parseDate = d3.timeParse("%m/%d/%Y");
    filteredData.forEach(d => {
        d.X = +d.X;
        d.Y = +d.Y;
        d.Date = parseDate(d.Date);
    });

    const xScale = d3.scaleLinear()
        .domain([0, 200])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, 200])
        .range([height, 0]);

    const circles = svg.selectAll(".dot")
        .data(filteredData)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", d => xScale(d.X))
        .attr("cy", d => yScale(d.Y));

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    const minDate = d3.min(filteredData, d => d.Date);
    const maxDate = d3.max(filteredData, d => d.Date);

    const scrubber = d3.select("#scrubber")
        .attr("max", d3.timeMonth.count(minDate, maxDate) / 6);

    scrubber.on("input", function () {
        const scrubValue = +this.value;
        const startDate = d3.timeMonth.offset(minDate, scrubValue * 6);
        const endDate = d3.timeMonth.offset(startDate, 6);

        d3.select("#scrubber-label").text(`Showing: ${d3.timeFormat("%b %Y")(startDate)} - ${d3.timeFormat("%b %Y")(endDate)}`);

        circles.style("visibility", d => (d.Date >= startDate && d.Date < endDate) ? "visible" : "hidden");
    });

    scrubber.dispatch("input");

    const playButton = d3.select("body").append("button")
        .attr("id", "play-button")
        .text("Play")
        .on("click", function () {
            if (isPlaying) {
                isPlaying = false;
                clearInterval(playInterval);
                playButton.text("Play");
            } else {
                isPlaying = true;
                playButton.text("Pause");

                const scrubber = d3.select("#scrubber");
                const maxValue = +scrubber.attr("max");
                let currentValue = +scrubber.property("value");

                playInterval = setInterval(() => {
                    if (currentValue >= maxValue) {
                        currentValue = 0;
                    } else {
                        currentValue++;
                    }
                    scrubber.property("value", currentValue).dispatch("input");
                }, 1000);
            }
        });

    let isPlaying = false;
    let playInterval;

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("X");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Y");
}).catch(error => {
    console.error("Error loading CSV file:", error);
});