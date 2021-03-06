d3.select("body")
.append("div")
.attr("id", "bubbles-toolbar")
.html("<button><a href='#' id='all'>All Categories</a></button>")
.append("div")
.style("padding-left", "10px")
.style("display", "inline")
.html("<button><a href='#' id='split'>Split by Season</a></button>")
.append("div")
.html("<div id='viz' style='padding-top: 75px;'></div>")


function bubbleChart() {

	var width = 900,
	height = 600;

	// tooltip for mouseover functionality
	var tooltip = floatingTooltip('item-tooltip', 240);

	//Locations to move bubbles to
    var center = { x: width / 2, y: height / 2 };
     
    var categoryCenters = {
		"FW18": {x: width/5, y: height/2},
		"SS18": {x: width/3, y: height/2},
    	"FW17": {x: width/2, y: height/2},
        "SS17": {x: 2*width/3, y: height/2}
	};

    var categoryTitleX = {
		"FW18": width/5 - (width/12),
		"SS18": width/3 - (width/27),
        "FW17": width/2 + (width/30),
        "SS17": 2*width/3 + (width/12)
	};

	//Force strength
	var forceStrength = 0.03;

	var svg = null;
	var bubbles = null;
	var nodes = [];

	//Charge function to create repulsion
	function charge(d) {
		return -Math.pow(d.radius, 2.0) * forceStrength;
	}

	//Force simulation
	var simulation = d3.forceSimulation()
	.velocityDecay(0.2)
	.force('x', d3.forceX().strength(forceStrength).x(center.x))
	.force('y', d3.forceY().strength(forceStrength).y(center.y))
	.force('charge', d3.forceManyBody().strength(charge))
	.on('tick', ticked);

	//Stop simulation if there are no nodes
	simulation.stop()

	//Color scale
	var fillColor = d3.scaleOrdinal()
	.domain(['low', 'medium', 'high'])
	.range(['red', '#ff6666', '#ff9999'])

	//Take raw data and convert it into nodes
	function createNodes(rawData) {

		//Max of data for scale domain
		var maxAmount = d3.max(rawData, function(d) { return +d.value; });

		//Size bubbles based on area
		var radiusScale = d3.scalePow()
		.exponent(0.9)
		.range([2,35])
        .domain([0, maxAmount]);
        
        function cleanAndCapitalize(string) {
            var end = [],
            words = string.split("-")
            for (i = 0; i<words.length; i++) {
                //Skip the word if it's "supreme"
                if (words[i] != "supreme") {
                    //If the word is the season, capitalize the whole thing
                    if (words[i].includes(15) || words[i].includes(16) || words[i].includes(17) || words[i].includes(18)) {
                        console.log("season!")
                        end += words[i].toUpperCase() + " ";
                    } else {
                        capital = words[i][0].toUpperCase()
                        capitalized = capital + words[i].slice(1,)
                        end += capitalized + " ";
                    }
                }
            }
            return end;
        }

		//Convert raw data to node data
		var myNodes = rawData.map(function(d) {
			return {
				id: d.id,
				radius: radiusScale(+d.value),
				value: +d.value,
				name: cleanAndCapitalize(d.name),
				group: d.group,
		        category: d.season,
				x: Math.random() * 900,
				y: Math.random() * 800
			};
		});

		//Sort 
		myNodes.sort(function(a,b) { return b.value - a.value; });

		return myNodes;
	}

	var chart = function(selector, rawData) {

		nodes = createNodes(rawData);

		svg = d3.select(selector)
		.append("svg")
		.attr("width", width)
		.attr("height", height);

		//Bind nodes to elements
		bubbles = svg.selectAll(".bubble")
		.data(nodes, function(d) { return d.sneaker_id });

		//Create bubbles
		var bubblesE = bubbles.enter()
		.append("circle")
		.classed("bubble", true)
		.attr("r", 0)
		.attr("fill", function(d) { return fillColor(d.group); })
		.attr("stroke", function(d) { return d3.rgb(fillColor(d.group)).darker(); })
		.attr("stroke-width", 2)
     	.on('mouseover', showDetail)
      	.on('mouseout', hideDetail);

		//Merge the original empty selection and the enter selection
		bubbles = bubbles.merge(bubblesE)

		//Transition
		bubbles.transition()
		.duration(2000)
		.attr("r", function(d) { return d.radius; });

		//Run simulation
		simulation.nodes(nodes);

		//Set inital layout to single group
        groupBubbles();
        
        //Add StockX logo
        var stockx_logo = svg.append("svg:image")
        .attr("xlink:href", "https://s3.amazonaws.com/stockx-sneaker-analysis/wp-content/uploads/2018/08/stockx-logo.png")
        .attr("width", width / 10)
        .attr("height", width / 10 * .75)
        .attr("x", width - 100)
        .attr("y", 20)
        .attr("transform", "translate(0,-20)");
	};

	//Repositioning function that works with force
	function ticked() {
		bubbles.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });
	}

	//X value for each node based on brand
	function nodeCategoryPos(d) {
		return categoryCenters[d.category].x;
	}

	//Sets viz in single group mode
	function groupBubbles() {

		hideCategoryTitles();

		simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));
		simulation.alpha(1).restart();
	}

  	function splitBubbles() {
    showCategoryTitles();

    // @v4 Reset the 'x' force to draw the bubbles to their brand centers
    simulation.force('x', d3.forceX().strength(forceStrength).x(nodeCategoryPos));

    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(1).restart();
  }

	//Sets viz in split by brand mode
	function hideCategoryTitles() {
		svg.selectAll(".category").remove()
	}

	//Shows brand title displays
	function showCategoryTitles() {
		var categoryData = d3.keys(categoryTitleX);
		var categories = svg.selectAll(".category")
		.data(categoryData);

		categories.enter()
		.append("text")
		.attr("class", "category")
		.attr("x", function(d) { return categoryTitleX[d]; })
        .attr("y", 40)
		.attr("text-anchor", "middle")
		.text(function(d) { return d; });
	}

	//Function to toggle display between grouped and single
	chart.toggleDisplay = function (displayName) {
		if (displayName === "split" ) {
			splitBubbles();
		} else {
			groupBubbles();
		}
	};

	//Function to create tooltip
	function floatingTooltip(tooltipId, width) {

		//Variable to hold tooltip div
		var tt = d3.select("body")
		.append("div")
		.attr("class", "tooltip")
		.attr("id", tooltipId)
        .style("pointer-events", "none")
        .style("position", "absolute");

		//Set width if provided
		if (width) {
            tt.style("width", width);
		};

		//Hide tooltip initially
		hideTooltip();

		//Function to display tooltip
		function showTooltip(content, event) {
			
			tt.style("opacity", 1.0)
            .html(content);

			updatePosition(event);
		};

		function hideTooltip() {
			tt.style("opacity", 0.0);
		}

		//Figure out where to place tooltip based on mouse pos
		function updatePosition(event) {

			var xOffset = 20,
			yOffset = 10;

			var ttw = tt.style("width"),
            tth = tt.style("height");

			var wscrX = window.scrollX,
			wscrY = window.scrollY;

			var curX = (document.all) ? event.clientX + wscrX : event.pageX,
			curY = (document.all) ? event.clientY + wscrY : event.pageY;

			var ttleft = ((curX - wscrX + xOffset * 2 + ttw) > window.innerWidth) ? curX - ttw - xOffset * 2 : curX + xOffset;

			if (ttleft < wscrX + xOffset) {
				ttleft = wscrX + xOffset;
			}

			var tttop = ((curY - wscrY + yOffset * 2 + tth) > window.innerHeight) ? curY - tth - yOffset * 2 : curY + yOffset;

			if (tttop < wscrY + yOffset) {
				tttop = wscrY + yOffset;
            }

			tt.style("top", tttop + "px")
			.style("left", ttleft + "px");

		}

		return {
			showTooltip: showTooltip,
			hideTooltip: hideTooltip,
			updatePosition: updatePosition
		};
	}

	//Function to populate tooltip
	function showDetail(d) {

		//Indicate hover state
		d3.select(this)
		.attr("stroke", "black");

	    var content = '<span class="value" style="font-weight: bold; font-size: 0.9em;">' +
              d.name + " - " + d.value + "x"
              '</span>'

      	tooltip.showTooltip(content, d3.event);
	}

	//Function to hide tooltip
	function hideDetail(d) {

		d3.select(this)
		.attr("stroke", d3.rgb(fillColor(d.group)).darker());

		tooltip.hideTooltip();

	}

	//Return the chart
	return chart;
 
};

var myBubbleChart = bubbleChart();

//Display function
function display(data) {
	console.log(myBubbleChart("#viz", data));
}

//Sets up layout buttons
function setupButtons() {
	
	d3.select("#bubbles-toolbar")
	.selectAll("a")
	.on("click", function() {

		d3.selectAll(".dropdown-item")
		.classed("active", false);

		var button = d3.select(this);

		button.classed("active", true);

		var buttonId = button.attr("id");

		myBubbleChart.toggleDisplay(buttonId);

	});
};

//

//Load data
d3.csv("https://gist.githubusercontent.com/gagejustins/d9b189a4b0a4a2f01c985baeadf44742/raw/0451f3fec9ee6920f90ee1ed6557a27603566270/accessories_bubbles.csv", function(data) {
	display(data);
});
setupButtons();