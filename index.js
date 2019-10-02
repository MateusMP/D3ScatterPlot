// Scatter plot object
const scatterPlot = {

    // Color options
    colors: [
        {
            name: "Categorical",
            init: function (data) {
                this.scale = d3.scaleOrdinal(d3.schemeCategory10).domain(data.map(d => d.color));
            },
            transform: function (x) {
                return this.scale(x);
            }
        },
        {
            name: "Continuous Blue",
            init: function (data) {
                this.scale = d3.scaleLinear().domain([d3.min(data, d => d.color), d3.max(data, d => d.color)]);
            },
            transform: function (x) {
                return d3.interpolateBlues(this.scale(x));
            }
        }
    ],

    // Create the SVG and menu options
    init: function (width, height, dataset) {
        this.width = width;
        this.height = height;

        this.margin = {
            x: 50,
            y: 50,
        };

        // Create the canvas for drawing
        this.svg = d3.select("#graph").append("svg")
            .attr("width", width)
            .attr("height", height);

        // Define a group inside the svg for our data elements
        this.svgG = this.svg.append("g");

        // Define a group for each axis
        this.leftAxisG = this.svg.append("g");
        this.bottomAxisG = this.svg.append("g");

        // Move our axis to a proper position
        this.leftAxisG.attr("transform", `translate(${this.margin.x}, 0)`)
        this.bottomAxisG.attr("transform", `translate(0, ${this.height - this.margin.y})`);

        // Create axis label text element and position it
        this.leftAxisG.append("text").attr("class", "graph-labels")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${-this.margin.x + 15}, ${height / 2}) rotate(-90)`);

        this.bottomAxisG.append("text").attr("class", "graph-labels")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${width / 2}, ${this.margin.y - 15})`);

        // Load the dataset
        const that = this;
        d3.csv(dataset).then(function (data) {
            that.createMenu(data);
            that.plotGraph(data);
        });
    },

    createMenu: function (data) {

        // Select the elements using the id
        this.menuX = d3.select("#menu-x");
        this.menuY = d3.select("#menu-y");
        this.menuColor = d3.select("#menu-color");

        // Options for color
        this.colors.forEach((color, i) => {
            this.menuColor.append("option").attr("value", i).text(color.name);
        });

        // Options for columns. Note that we skip the last column (class)
        data.columns.slice(0, data.columns.length - 1).forEach((name, i) => {
            this.menuX.append("option").attr("value", i).text(name);
            this.menuY.append("option").attr("value", i).text(name);
        });

        // Default selected option
        this.menuX.node().value = 0;
        this.menuY.node().value = 1;
        this.menuColor.node().value = 0;

        // Trigger a graph update when changing the selected option
        this.menuX.on('change', () => this.plotGraph(data));
        this.menuY.on('change', () => this.plotGraph(data));
        this.menuColor.on('change', () => this.plotGraph(data));
    },
    
    getYColumn() {
        return this.menuY.node().value;
    },

    getXColumn() {
        return this.menuX.node().value;
    },

    getColorOption() {
        return this.colors[this.menuColor.node().value];
    },

    plotGraph: function (originalData) {

        const data = this.prepareData(originalData);

        // Define our X and Y scales
        const xScale = d3.scaleLinear()
            .domain([d3.min(data, d => d.x), d3.max(data, d => d.x)])   // original domain
            .range([this.margin.x, this.width - this.margin.x]);        // map to range

        const yScale = d3.scaleLinear()
            .domain([d3.max(data, d => d.y), d3.min(data, d => d.y)])
            .range([this.margin.y, this.height - this.margin.y]);

        // Initialize the color scale
        const color = this.getColorOption();
        color.init(data);

        // Select relevant elements and associate them with the data
        const circles = this.svgG.selectAll("circle").data(data);
        // Create new elements or update existing ones
        circles.join(
            create => create.append("circle")
                .attr("cx", d => xScale(d.x))
                .attr("cy", d => yScale(d.y))
                .attr("r", 3)
                .attr("fill", d => color.transform(d.color)),
            update => update.transition().duration(1000)
                .attr("cx", d => xScale(d.x))
                .attr("cy", d => yScale(d.y))
                .attr("r", 3)
                .attr("fill", d => color.transform(d.color)),
            exit => null,
        );

        // Update axis information
        const leftAxis = d3.axisLeft(yScale);
        this.leftAxisG.transition().duration(1000).call(leftAxis);
        this.leftAxisG.select("text").text(originalData.columns[this.getYColumn()]);

        const bottomAxis = d3.axisBottom(xScale);
        this.bottomAxisG.transition().duration(1000).call(bottomAxis);
        this.bottomAxisG.select("text").text(originalData.columns[this.getXColumn()]);
    },

    prepareData: function (data) {
        // Get the proper columns considering the input
        const columnX = data.columns[this.getXColumn()];
        const columnY = data.columns[this.getYColumn()];
        // Class column assumed to be the last column
        const classColumn = data.columns[data.columns.length - 1];

        // Map every instance into a simpler representation with the data we need
        return data.map(d => {
            return {
                x: +d[columnX],
                y: +d[columnY],
                color: d[classColumn]
            }
        });
    }
}

// Init graph once the document is loaded.
document.addEventListener("DOMContentLoaded", function (event) {
    scatterPlot.init(600, 500, "winequality-red.csv");
});