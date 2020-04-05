console.log("D3 running");

var csv_link = "https://gist.githubusercontent.com/gagejustins/16e54e7b3d8bc05d56411a3ef6151dbd/raw/8336ea02d2077f38d0044e722cf43f2b8bd79f60/chicago_weekly.csv"

var width = 850,
height = 500,
padding = 20;

var dataset;

var svg = d3.select("#chicago-chart")
.append("svg")
.attr("width", width)
.attr("height", height);

var xScale = d3.scaleTime()
.range([0, width - 100])

var yScale = d3.scaleLinear()
.rangeRound([height - 100, 0]);

var colorScale = d3.scaleLinear()
.rangeRound([65, 240]);

var parseDate = d3.timeParse("%Y-%m-%d");

//Create bisect to get y from x for tooltip
var bisectDate = d3.bisector(function(d) { return d.sale_date; }).left;

d3.csv(csv_link, function(data) {

	data.forEach(function(d) {
        d.sale_date = parseDate(moment.utc(d.sale_date).format("YYYY-MM-DD")); 
        d.sale_price = parseFloat(d.sale_price)
 	});

	//Set domains for x and y scales
	xScale.domain(d3.extent(data, function(d) { return d.sale_date }));
	yScale.domain([0, d3.max(data, function(d) { return d.sale_price + 100 })]);
	colorScale.domain([0, d3.max(data, function(d) { return d.sale_price })]);

	//Create x axis
	var xAxis = d3.axisBottom(xScale)
	.ticks(6)
	.tickSizeOuter(0);

	//Create y axis
	var yAxis = d3.axisLeft(yScale)
	.ticks(10);

	//Append x axis
	svg.append("g")
	.attr("class", "axis")
	.attr("transform", "translate(50," + (height - 100) + ")")
	.call(xAxis);

	//Append y axis
	svg.append("g")
	.attr("class", "axis")
	.attr("transform", "translate(50,0)")
	.call(yAxis);

	// define the line
	var line = d3.line()
	.curve(d3.curveCardinal)
    .x(function(d) { return xScale(d.sale_date); })
    .y(function(d) { return yScale(d.sale_price); });

    //Add line path
    var path = svg.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line)
    .attr("transform", "translate(51,0)");

    //Group to contain circle and text for tooltip
  	var focus = svg.append("g")
  	.attr("class", "focus")
  	.attr("transform", "translate(50,0)")
  	.style("display", "none");

  	//Tooltip line
  	var tooltip_line = svg.append("rect")
  	.attr("height", height - 100)
  	.attr("width", "1px")
  	.attr("y", 0)
  	.attr("transform", "translate(50,0)")
  	.style("display", "none");

  	//Tooltip circle
  	focus.append("circle")
  	.attr("r", 6.5);

  	focus.append("text")
  	.attr("x", 9)
  	.attr("dy", ".35em");

  	//Rectangle over over entire svg 
  	svg.append("rect")
	.attr("class", "overlay")
	.attr("width", width - 100)
	.attr("height", height)
	.attr("transform", "translate(50,0)")
	.on("mouseover", function() { 
		//Set the focus set and the tooltip line to display themselves
		focus.style("display", null);
		tooltip_line.style("display", null);
	})
	.on("mouseout", function() { 
		//Set the focus set and the tooltip line to disappear
		focus.style("display", "none");
		tooltip_line.style("display", "none"); 
	})
	.on("mousemove", mousemove);

  	function mousemove() {

  		//Use current mouse x to get dataset x (by inverting the xScale)
	    var dataset_x = xScale.invert(d3.mouse(this)[0]);

	    //Use dataset x to get dataset y
	    var data_item = data[bisectDate(data, dataset_x)];

	    //Update location of line
	    tooltip_line.attr("x", xScale(data_item.sale_date));

	    //Update location of circle
	    focus.attr("transform", "translate(" + (xScale(data_item.sale_date) + 50) + "," + yScale(data_item.sale_price) + ")");
	    
	    //Update text value
	    focus.select("text").text("$" + d3.format(",.0f")(data_item.sale_price));
    }

});














