
const scatterPlot = {
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

    init: function (width, height) {
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
        this.leftAxis = this.svg.append("g");
        this.bottomAxis = this.svg.append("g");

        // Move our axis to a proper position
        this.leftAxis.attr("transform", `translate(${this.margin.x}, 0)`)
        this.bottomAxis.attr("transform", `translate(0, ${this.height - this.margin.y})`);

        // Create axis label text element and position it
        this.leftAxis.append("text").attr("class", "graph-labels")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${-this.margin.x + 15}, ${height / 2}) rotate(-90)`);

        this.bottomAxis.append("text").attr("class", "graph-labels")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${width / 2}, ${this.margin.y - 15})`);

        // Load the dataset
        const that = this;
        d3.csv("winequality-red.csv").then(function (data) {
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

    plotGraph: function (originalData) {

        const data = this.prepareData(originalData);

        // Define our X and Y scales
        const xScale = d3.scaleLinear()
            .domain([d3.min(data, d => d.x), d3.max(data, d => d.x)])
            .range([this.margin.x, this.width - this.margin.x]);

        const yScale = d3.scaleLinear()
            .domain([d3.max(data, d => d.y), d3.min(data, d => d.y)])
            .range([this.margin.y, this.height - this.margin.y]);

        // Initialize the color scale
        const color = this.colors[this.menuColor.node().value];
        color.init(data);

        // Select relevant elements and associate them with the data
        const circles = this.svgG.selectAll("circle").data(data);
        // Create new elements or update existing ones
        circles.join(
            create => create.append("circle")
                .attr("cx", d => xScale(d.x))
                .attr("cy", d => yScale(d.y))
                .attr("r", d => 3)
                .attr("fill", d => color.transform(d.color)),
            update => update.transition().duration(1000)
                .attr("cx", d => xScale(d.x))
                .attr("cy", d => yScale(d.y))
                .attr("r", d => 3)
                .attr("fill", d => color.transform(d.color)),
            exit => null,
        );

        // Update axis information
        const leftAxis = d3.axisLeft(yScale);
        this.leftAxis.transition().duration(1000).call(leftAxis);
        this.leftAxis.select("text").text(originalData.columns[this.menuY.node().value]);

        const bottomAxis = d3.axisBottom(xScale);
        this.bottomAxis.transition().duration(1000).call(bottomAxis);
        this.bottomAxis.select("text").text(originalData.columns[this.menuX.node().value]);
    },

    prepareData: function (data) {
        function indexColumn(data, column) {
            // Returns the column name given column index
            return data.columns[column];
        }

        // Get the proper columns considering the input
        const columnX = indexColumn(data, this.menuX.node().value);
        const columnY = indexColumn(data, this.menuY.node().value);
        // Class column assumed to be the last column
        const classColumn = indexColumn(data, data.columns.length - 1);

        // Map every instance into a simpler representation with the data we need
        return data.map(d => {
            return {
                x: +d[columnX],
                y: +d[columnY],
                color: d[classColumn]
            }
        })
    }
}

// Init graph once the document is loaded.
document.addEventListener("DOMContentLoaded", function (event) {
    scatterPlot.init(600, 500);
});