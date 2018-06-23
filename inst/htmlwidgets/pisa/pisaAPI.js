//PISA Chart API
//author: Ryan Morton
//client: World Health Organization
var pisaChart = function(opts) {
	
	//pass chart elements
	this.element = opts.element;
	this.plotLayers = opts.plotLayers;
	this.options = opts.options;
	
	//create the chart 
	//widget calls the update function if chart already exists
	this.draw(this.element);
}

pisaChart.prototype.draw = function(chartElement) {
	console.log(this.options);
	var user_margins = this.options.margins;
	//define dimensions
	this.width = chartElement.offsetWidth-30;
	this.height = Math.max(chartElement.offsetHeight, 200);
	this.margin = { top: user_margins.top, right: user_margins.right, bottom: user_margins.bottom, left: user_margins.left};
	
	//set up parent element and SVG
	chartElement.innerHTML = '';
	//if(this.plotLayers[0].type == "heatmap") {d3.select(chartElement).style('overflow-y', 'auto');}
	
	this.svg = d3.select(chartElement).append('svg')
		.attr('id', chartElement.id + '-svg-chart')
		.attr('width', this.width)
		.attr('height', this.height);
	
	//create g element
	this.plot = this.svg.append('g')
		.attr('transform','translate('+this.margin.left+','+this.margin.top+')');
	
	this.chart = this.plot.append('g');
			
	//initialize chart
	this.initialize(chartElement);
	
		
}

pisaChart.prototype.initialize = function(chartElement){
	//preserve chart scope
	var that = this;
	
	//set clip path
	if(this.options.plotType == "globalMap")this.setClipPath(chartElement);
	this.processScales(this.plotLayers, this.options);
	if(this.options.plotType != "globalMap")this.addAxes();
	this.routeLayers(this.plotLayers, chartElement);
	//this.addButtons(chartElement);
}

pisaChart.prototype.setClipPath = function(chartElement){
	
	this.clipPath = this.plot.append('defs').append('svg:clipPath')
		.attr('id', chartElement.id + 'clip')
	  .append('svg:rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', this.width - (this.margin.left + this.margin.right))
		.attr('height', this.height - (this.margin.top + this.margin.bottom));
		
	this.plot.attr('clip-path', 'url(#' + chartElement.id + 'clip'+ ')')
}

pisaChart.prototype.routeLayers = function(lys, chartElement){
	var that = this;

	this.layerIndex = lys.map(function(d) {return d.label; });
	
	lys.forEach(function(d){

		var layerType = d.type;
		var layerData = d.data;

		if(layerType == "heatmap") {
			that.addCells(d, chartElement);
		} else if(d.type == "globalMap"){
			that.mapData(d);
			that.makeMap(d, chartElement);
		} else  {
			alert("Wrong Layer Type!")
		}
		
	});
}

pisaChart.prototype.processScales = function(lys,options) {
	var m = this.margin;
	
	var x_extents = [];
	var y_extents = [];
	var z_extents = [];
	var colors = [];
	
	lys.forEach(function(d){
		
		var x_var = d.x_var; 
		var y_var = d.y_var;
		var z_var = d.z_var ? d.z_var : d.layerMapping.color_var;
		
		var x = d3.map( d.data, function(e) { return e[x_var]; }).keys();
		var y = d3.map(d.data, function(e) { return e[y_var]; }).keys();
		var z = d3.map(d.data, function(e) { return e[z_var]; }).keys();
		var color = d3.map(d.color, function(e) { return e; }).keys();

		x_extents.push(x);
		y_extents.push(y);
		z_extents.push(z);
		colors.push(color);
		
	})
	console.log(options.timeInterval);	
	//create scales
	var x_domain = options.timeInterval ?  options.timeInterval : x_extents[0]
	this.xScale = d3.scaleBand()
		.rangeRound([ 0, Math.min((this.width - (m.right + m.left)), (x_domain.length * 40) ) ])
		.domain(x_domain);

	this.yScale =  d3.scaleBand()
		//.padding(0.2)
		.range([(y_extents[0].length * 40), 0])
		.domain(y_extents[0]);
	
	if(this.options.color_palette) {var colors_to_plot = this.options.color_palette;} else {var colors_to_plot = colors[0];}
	if(this.options.color_key) {var colors_key = this.options.color_key;} else {var colors_key = z_extents[0];}
	
	this.colorScale = d3.scaleOrdinal()
		.range(colors_to_plot)
		.domain(colors_key);
}

pisaChart.prototype.addAxes = function(){
	var m = this.margin;
	
	//create and append axes
	this.xAxis = d3.axisTop()
			.scale(this.xScale);
			//.tickValues(this.xScale.domain().filter(function(d, i) { return !(i % 2); }));
	//x axis
	this.plot.append('g')
		.attr("class", "x axis")
		.call(this.xAxis)
			.selectAll("text")
				.attr('dy', '.35em')
				.attr('dx', '.35em')
				.attr("transform", "rotate(-45)")
				.attr('text-anchor', 'start');
	//reduce ticks for smaller screens
	if(this.width < 700 | this.xScale.domain().length > 52) d3.selectAll(".x.axis text").style("display", function (d, i) { return i % 2 ? "none" : "initial" });
	
	//y axis
	this.plot.append('g')
		.attr("class", "y axis")
		.call(d3.axisLeft(this.yScale))
			.selectAll("text")
				.attr("dx", "-.25em");
			
}

pisaChart.prototype.updateAxes = function() {
	var that = this;
	var m = this.margin;
	
	this.xAxis = d3.axisTop()
			.scale(this.xScale);
			//.tickValues(this.xScale.domain().filter(function(d, i) { return !(i % 2); }));
			
	this.svg.selectAll('.x.axis')
		.transition().ease(d3.easeQuad)
		.duration(500)
		.call(this.xAxis)
			.selectAll("text")
				.attr('dy', '.35em')
				.attr('dx', '.35em')
				.attr("transform", "rotate(-45)")
				.attr('text-anchor', 'start');
	if(this.width < 700 | this.xScale.domain().length > 52) d3.selectAll(".x.axis text").style("display", function (d, i) { return i % 2 ? "none" : "initial" });
	
	this.svg.selectAll('.y.axis')
		.transition().ease(d3.easeQuad)
		.duration(500)
		.call(d3.axisLeft(this.yScale))
			.selectAll("text")
				.attr("dx", "-.25em");
}

pisaChart.prototype.addCells = function(ly, chartElement) {
		
	var that = this;
	var m = this.margin;
	
	var data = ly.data;
	
	function ObjectLength( object ) {
    var length = 0;
    for( var key in object ) {
        if( object.hasOwnProperty(key) ) {
            ++length;
        }
    }
    return length;
	};
	var xLength = d3.map( data, function(e) { return +e[ly.x_var]; });
	
	var gridSize = Math.floor((this.width - (m.right + m.left))/32);
	
	//grey background
	// var heat_background = this.chart
		// .selectAll('.heat-background')
		// .data([1]);
	
	// heat_background.exit().remove();
	
	// var new_heat_background=heat_background
		// .enter()
		// .append('rect')
		// .attr('class', 'heat-background');
		
	// heat_background
		// .merge(new_heat_background)
		// .attr('transform','translate(5 ,0)')
		// .attr('width', Math.min((this.width - (m.right + m.left)), (this.xScale.domain().length * 40)) - 10)
		// .attr('height', this.yScale.domain().length * 40)
		// .style('stroke', 'whitesmoke')
		// .style('fill', '#DCDCDC');
	
	//create cells
	var cells = this.chart.selectAll('.heatCell')
		.data(data);
	
	cells.exit()
		.transition()
		.duration(100)	
		.style('opacity', 0)
		.remove();
		
	var newCells = cells.enter()
		.append('rect')
		.attr('x', function (d) {return that.xScale(d[ly.x_var]); })
		.attr('y', function (d) {return that.yScale(d[ly.y_var]); })
		.attr('class', 'heatCell')
		.attr('clip-path', 'url(#' + chartElement.id + 'clip' + ')')
		.attr('width',this.xScale.bandwidth())
		.attr('height', this.yScale.bandwidth())
		.style('stroke', 'whitesmoke')
		.style('stroke-width', this.options.borderWidth)
		.style('fill', 'lightgray')
		.on('mouseover', function(d) {
			select_axis_label(d).attr('style', "font-weight: bold; fill: black;");
		})
		.on('mouseout', function(d) {
			select_axis_label(d).attr('style', "font-weight: regular;").attr('style', "fill: darkgrey;");
			if(that.width < 700 | that.xScale.domain().length > 52) d3.selectAll(".x.axis text").style("display", function (d, i) { return i % 2 ? "none" : "initial" });
		});
	
	newCells
		.append('svg:title')
		.append(function(d){
			var span = document.createElement("span");
			span.innerHTML = "Country: " + d[ly.y_var] +
			"<br/> " + "Year-Week: " + d[ly.x_var] +
			"<br/> " + ly.z_var + ": " + d[ly.z_var] +
			"<br/> Confidence Level: " + d[ly.cl_var] +
			"<br/> Comments: " + d[ly.com_var] ;
			
			return span
		});	
		
	cells.merge(newCells)
		.transition().ease(d3.easeLinear)
		.duration(100)
		.attr('x', function (d) {return that.xScale(d[ly.x_var]); })
		.attr('y', function (d) {return that.yScale(d[ly.y_var]); })
		.attr('width',this.xScale.bandwidth())
		.attr('height', this.yScale.bandwidth())
		.style('opacity', 0.8)
		.style('fill', function(d) {return that.colorScale(d[ly.z_var]); })
		;
		
	this.addGrid(chartElement);
	
	function select_axis_label(datum) {
		return d3.selectAll('.axis.x')
			.selectAll('text')
			.filter(function(x) { return x == datum[ly.x_var]; });
	}
}

pisaChart.prototype.addGrid = function(chartElement){
	
	var that = this;
	var m = this.margin;
	
	var x_range = this.xScale.domain();
	var y_range = this.yScale.domain();
	
	var x_grid = that.chart
		.selectAll('.x-gridLine')
		.data(x_range);
		
	x_grid.exit().remove();
	
	x_grid.enter()	
		.append('line')
		.attr('class', 'x-gridLine')
		.attr('clip-path', 'url(#' + chartElement.id + 'clip' + ')')
		.attr('x1', function(d) { return that.xScale(d); })
		.attr('x2', function(d) { return that.xScale(d); })
		.attr('y1', y_range.length * that.yScale.bandwidth() )
		.attr('y2', 0)
		.style('stroke', 'whitesmoke');
		
	var y_grid = that.chart
		.selectAll('.y-gridLine')
		.data(y_range);

	y_grid.exit().remove();
	
	y_grid.enter()
		.append('line')
		.attr('class', 'y-gridLine')
		.attr('x1', this.xScale(x_range[0]) )
		.attr('x2', this.xScale(x_range[x_range.length -1] ) + this.xScale.bandwidth() )
		.attr('y1', function(d) { return that.yScale(d); })
		.attr('y2',  function(d) { return that.yScale(d); })
		.style('stroke', 'whitesmoke')
		.style('stroke-width', 6);
}

pisaChart.prototype.mapData = function(ly) {
	var that = this;
	var m = this.margin;

	//variables to be sent from R
	var keyData = ly.layerMapping.key_data;
	var keyMap = ly.layerMapping.key_map;
	var period = ly.layerMapping.time_var;
	this.period = period;
	var value = ly.layerMapping.color_var;
	this.value = value;
	var cl_var = ly.layerMapping.cl_var;
	var com_var = ly.layerMapping.com_var;
	
	var data = [];
	//create nested JSON object for easier filtering
	this.plotLayers.forEach(function(d){
			
		var values = d3.nest()
			.key(function(d) { return d[period]; })
			.key(function(d) { return d[keyData]; })
			.entries(d.data);
		data.push(values);
	});
	//filter data to display
	var valuesToDisplay = {};
	
	data[0][0]
		.values
		.forEach(function(d) { valuesToDisplay[d.key] = d.values.map(function(e) { return {value: e[value], 
																						   cl: e[cl_var], 
																						   com: e[com_var] }; 
																						 })[0] });
	
	window.worldMap[0].features.forEach(function(d) { d.values = valuesToDisplay[d.properties[keyMap]]; })

	this.values = [];
	for(var key in valuesToDisplay){
		var value = valuesToDisplay[key];
		that.values.push(value);
	}
	
}

pisaChart.prototype.makeMap = function(ly, chartElement) {
	
	var that = this;
	var m = this.margin;
	var active = d3.select(null);

	var scale = this.width > 700 ? 120 : 80 ;

	var zoom = d3.zoom()
		.scaleExtent([1, 8])
		.on("zoom", zoomed);
		
	//set background
	this.chart.append('rect')
		.attr('class', 'map-background')
		.attr('width',this.width - (m.right+m.left))
		.attr('height', this.height - (m.top + m.bottom))
		.style('fill', 'none')
		.on('click', reset);
	
	//set projection
	this.projection = d3.geoWagner7()
		.scale(scale)
		.translate([
			(this.width - (m.right+m.left)) / 2,
			(this.height - (m.top + m.bottom)) / 2
		]);
		
	//set path function
	this.path = d3.geoPath().projection(this.projection);
	
	var dataMap = window.worldMap[0];

	var data = dataMap.features;
	
	//create map graticulate
	var graticule = d3.geoGraticule();
	this.chart
		.append('path')
		.datum(graticule)
		.attr('class', 'graticule')
		.attr('clip-path', 'url(#' + chartElement.id + 'clip'+ ')')
		.attr('d', this.path)
		.on('click', reset);
	
	//create map polygons
	this.polygons = this.chart.append('g')
		.attr('class', 'map-shapes')
		.selectAll('path')
		.data(data);
	this.polygons.exit().remove();
	
	var newPolygons = this.polygons.enter()
		.append('path')
		.attr('class', 'map-shapes')
		.attr('id', function(d) { return d.properties.ISO_2_CODE})
		.attr('clip-path', 'url(#' + chartElement.id + 'clip'+ ')')
		.style('fill', function(d) {return d.values ? that.colorScale(d.values.value) : "lightgray";})
		.style('stroke', 'whitesmoke')
		.style('stroke-width', 0.5)
		.attr('d', that.path)
		.on('click', clicked);
		
	newPolygons
		.append('svg:title')
		.append(function(d){
			
			var span = document.createElement("span");
			span.innerHTML = "Country: "  + d.properties.CNTRY_TERR +
			"<br/> " + that.value + ": " + (d.values ? d.values.value : "Unreported") +
			"<br/> " + "Year-Week: " + that.period +
			"<br/> Confidence Level: " + (d.values ? d.values.cl : "Unreported") +
			"<br/> Comments: "  + (d.values ? d.values.com : "Unreported");
			
			return span
		});
		
	this.polygons.merge(newPolygons)
		.transition()
		.duration(1000)
		.attr('d', this.path);
		//.style('opacity', 0.8)
		//.style('fill', function(d) {return d.values ? that.colorScale(d.values.value) : "lightgray";});
		
	var overlay_data = window.overlay_polygon[0].features;
	console.log(overlay_data);
	this.overlay_polygons = this.chart.append('g')
		.selectAll('.overlay-polygons')
		.data(overlay_data);
	
	this.overlay_polygons.exit().remove();
	
	var newOverlayPolygons = this.overlay_polygons.enter()
		.append('path')
		.attr('class', 'overlay-polygons')
		.attr('clip-path', 'url(#' + chartElement.id + 'clip'+ ')')
		.style('stroke-width', 0.5)
		.style('fill', function(d) { return d.properties.AREA == 'Lakes' ? 'white' : 'gray'; })
		.style('stroke', function(d) { return d.properties.AREA == 'Lakes' ? 'white' : 'white'; })
		.style('stroke-dasharray', function(d) { return d.properties.AREA == 'Lakes'? 'none' : '1,1'});
		
	this.overlay_polygons
		.merge(newOverlayPolygons)
		.attr('d', this.path);
				
	var overlay_line_data = window.overlay_line[0].features;
	console.log(overlay_line_data);
	this.overlays = this.chart.append('g')
		.selectAll('.overlay-lines')
		.data(overlay_line_data);
	
	this.overlays.exit().remove();
	
	var newOverlayLines = this.overlays.enter()
		.append('path')
		.attr('class', 'overlay-lines')
		.attr('clip-path', 'url(#' + chartElement.id + 'clip'+ ')')
		.style('fill', 'none')
		.style('stroke', 'gray')
		.style('stroke-width', 0.5)
		.style('stroke-dasharray', '1,1');
		
	this.overlays
		.merge(newOverlayLines)
		.attr('d', this.path);
	this.assignMapColor();
	this.addScaleLegend();
	this.addLegend();
	this.addDisclaimer(chartElement);
	
	//functions
	function clicked(d) {
	  if (active.node() === this) return reset();
	  active.classed("active", false);
	  active = d3.select(this).classed("active", true);
	  
	  var bounds = that.path.bounds(d),
		  dx = bounds[1][0] - bounds[0][0],
		  dy = bounds[1][1] - bounds[0][1],
		  x = (bounds[0][0] + bounds[1][0]) / 2,
		  y = (bounds[0][1] + bounds[1][1]) / 2,
		  scale = Math.max(1, Math.min(8, 0.5 / Math.max(dx / that.width, dy / that.height))),
		  translate = [that.width / 2 - scale * x, that.height / 2 - scale * y];
	  Shiny.onInputChange("country_input" ,d3.select(this).data()[0].properties.ISO_2_CODE);
	  that.chart.transition()
		  .duration(750)
		  .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4
	}
	
	function zoomed() {
	  that.chart.style("stroke-width", 1.5 / d3.event.transform.k + "px");
	  that.chart.attr("transform", d3.event.transform); // updated for d3 v4
	}

	function reset() {
	  active.classed("active", false);
	  active = d3.select(null);
	  Shiny.onInputChange("country_input" , null)
	  that.chart.transition()
		  .duration(750)
		  .call( zoom.transform, d3.zoomIdentity ); // updated for d3 v4
	}
	
}

pisaChart.prototype.assignMapColor = function(){
	
	var that = this;
	
	this.options.mapColor.country.forEach(function(d){
		that.chart.select('#' + d).style('fill', that.options.mapColor.color)
	})
	
}

pisaChart.prototype.addScaleLegend = function() {
	// Start Scale ---------------------------------------------------------
	// baseWidth refers to ideal scale width on the screen it also is the width of the initial measurement point
	var baseWidth = this.width / 5;
	var width = this.width - (this.margin.right + this.margin.left);
	var height = this.height - (this.margin.top + this.margin.bottom);
	var p1 = this.projection.invert([width/2 - baseWidth/2, height / 2]);
	var p2 = this.projection.invert([width/2 + baseWidth/2, height / 2]);
	var distance = getDistance(p1,p2);
	var unit = "m"; 
	var multiply = 1; 
	var bestFit = 1;
	var increment = 0.1; // This could be scaled to map width maybe width/10000;
	var scaleDistance = 0;
	var scaleWidth = 0;
			
	if ( distance > 1000 ) { 
		unit = "km"; multiply = 0.001;			
	}
	// Adjust distance to a round(er) number
	var i = 0;
	while (i < 400) {
		var temp = getDistance( this.projection.invert([ width/2 - (baseWidth / 2) + (increment * i), height / 2 ]),  this.projection.invert([ width/2 + baseWidth/2 - (increment * i), height / 2 ]));
		var ratio = temp / temp.toPrecision(1);
				
		// If the second distance is moving away from a cleaner number, reverse direction.
		if (i == 1) {
			if (Math.abs(1 - ratio) > bestFit) { increment = - increment; }
		}
		// If we are moving away from a best fit after that, break
		else if (i > 2) {
			if (Math.abs(1 - ratio) > bestFit) { break }
		}				
		// See if the current distance is the cleanest number
		if (Math.abs(1-ratio) < bestFit) {
			bestFit = Math.abs(1 - ratio); 
			scaleDistance = temp; 
			scaleWidth = (baseWidth) - (2 * increment * i);
		}
		i++;
	}
						
	// Now to build the scale			
	var bars = [];
	var smallBars = 10; 
	var bigBars = 4;
	var odd = true;
	var label = false;
			
	// Populate an array to represent the bars on the scale
	for (i = 0; i < smallBars; i++) {
		if (smallBars - 1 > i ) { label = false; } else { label = true; }
		bars.push( {width: 1 / (smallBars * (bigBars + 1)), offset: i / (smallBars * (bigBars + 1)), label: label, odd: odd } );
		odd = !odd;
		}
	for (i = 0; i < bigBars; i++) {
		bars.push( {width: 1 / (bigBars + 1), offset: (i + 1) / (bigBars + 1), label: true, odd: odd } );
		odd = !odd;
		}
			
	// Append the scale
	this.chart.selectAll(".scaleBar")
		.data(bars).enter()
		.append("rect")
		.attr("x", function(d) { return d.offset * scaleWidth + 20 })
		.attr("y", height - 30)
		.attr("width", function(d) { return d.width * scaleWidth})
		.attr("height", 10)
		.attr("fill", function (d) { if (d.odd) { return "#eee"; } else { return "#222"; } });
	this.chart.selectAll(".scaleText") 
		.data(bars).enter()
		.filter( function (d) { return d.label == true })
		.append("text")
		.attr("class","scaleText")
		.attr("x",0)
		.attr("y",0)
		.style("text-anchor","start")
		.text(function(d) { return d3.format(",")(((d.offset + d.width) * scaleDistance).toPrecision(2) * multiply); })
		.attr("transform", function(d) { return "translate("+ ((d.offset + d.width) * scaleWidth + 20 )+","+ (height - 35) +") rotate(-45)" });
	this.chart.append("text")
		.attr("x", scaleWidth/2 + 20)
		.attr("y", height - 5)
		.text( function() { if(unit == "km") { return "kilometers"; } else { return "metres";}  })
		.style("text-anchor","middle")
		.attr("class","scaleText");
	// End Scale -----------------------------------------
    

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Latitude/longitude spherical geodesy tools                         (c) Chris Veness 2002-2016  */
/*                                                                                   MIT Licence  */
/* www.movable-type.co.uk/scripts/latlong.html                                                    */
/* www.movable-type.co.uk/scripts/geodesy/docs/module-latlon-spherical.html                       */
function getDistance(p1,p2) { 
		    
	var lat1 = p1[1];
	var lat2 = p2[1];
	var lon1 = p1[0];
	var lon2 = p2[0];
			
	var R = 6371e3; // metres
	var φ1 = lat1* Math.PI / 180;
	var φ2 = lat2* Math.PI / 180;
	var Δφ = (lat2-lat1)* Math.PI / 180;
	var Δλ = (lon2-lon1)* Math.PI / 180;

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	var distance = R * c;
		
return distance;
	
	}
}

pisaChart.prototype.addLegend = function() {
	
	var that = this;
	var m = this.margin;
	
	var svg = d3.select(this.element).select('svg');
	
	var legendItems = this.options.color_key ? this.options.color_key : this.colorScale.domain();
	
	//create legend	box (exists in the background)
	var legendBox = this.svg.append('rect')
		.attr('class', 'legend-box')
		.attr("x", this.width - (m.right + m.left))
		.attr('width', '100px')
		.attr('height', (legendItems.length * 20) + 'px')
		.style('fill', 'none')
		.style('opacity', 0.75);
		
	
	var legendElement = this.svg.append('g')
		.selectAll('.legendElement')
		.data(legendItems)
		.enter()
		.append('g')
		.attr('class', 'legendElement')
		.attr("transform", function(d,i) { return "translate(0," +  i * 20 + ")"; })
		.attr("font-family", "sans-serif")
		.attr("font-size", 10)
		.attr("text-anchor", "start");
	
	legendElement.append("rect")
			.attr("x", that.width - (m.right + 30))
			.attr("width", 12)
			.attr("height", 12)
			.attr("fill", function(d) { return d.color = that.colorScale(d); });	
	
	legendElement.append("text")
		.attr("x", that.width - (m.right + 15))
		.attr("y", 9.5)
		.attr("dy", "0.15em")
		.text(function(d) { return d; });
	
}

pisaChart.prototype.addDisclaimer = function(chartElement){
	
	var width = this.width / 2;
	var disclaimer_text = {"text": "The boundaries and names shown and the designations used on this map do not imply the expression of any opinion whatsoever on the part of the World Health Organization concerning the legal status of any country, territory, city or area or of its authorities, or concerning the delimitation of its frontiers or boundaries. Dotted and dashed lines on maps represent approximate border lines for which there may not yet be full agreement."}

	var disclaimer = d3.select('#' + chartElement.id).select('svg')
		.append('g')
		.selectAll('.disclaimer-text')
		.data([disclaimer_text]);
		
	disclaimer.exit().remove();
	
	disclaimer.enter()
	  .append('g')
		.attr('class', 'disclaimer-text')
		.attr("font-family", "sans-serif")
		.attr("font-size", 10)
		.attr('x', this.margin.left)
		.attr('y', this.height - this.margin.bottom)
		.attr('height', this.margin.bottom)
		.attr('width', this.width - (this.margin.right + this.margin.left) )
	  .append('text')
		.attr('class', 'disclaimer-text-words')
		.attr('x', this.margin.left+5)
		.attr('y', this.height - this.margin.bottom + 15)
		.attr('dy', 0)
		.attr('height', this.margin.bottom)
		.text(function(d) { return d.text; })
		.call(wrap);
	this.svg.selectAll('.disclaimer-text')
	  .append('text')
		.attr('class', 'disclaimer-text-words')
		.attr('x', this.width - (.4 * this.width))
		.attr('y', this.height - this.margin.bottom + 15)
		.attr('dy', 0)
		.attr('height', this.margin.bottom)
		.text('Data source: World Health Organization');
	this.svg.selectAll('.disclaimer-text')
	  .append('text')
		.attr('class', 'disclaimer-text-words')
		.attr('x', this.width - (.4 * this.width))
		.attr('y', this.height - this.margin.bottom + 30)
		.attr('dy', 0)
		.attr('height', this.margin.bottom)
		.text('Map production: Global Influenza Programme, World Health Organization');
		
	this.svg
		.append('text')
		.attr('x', this.width - this.margin.right)
		.attr('y', this.height - 15)
		.text('\u00A9 WHO 2018');
		
	function wrap(text) {
	  text.each(function() {
		var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.1, // ems
			y = text.attr("y"),
			dy = parseFloat(text.attr("dy")),
			tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
		while (word = words.pop()) {
		  line.push(word);
		  tspan.text(line.join(" "));
		  if (tspan.node().getComputedTextLength() > width) {
			line.pop();
			tspan.text(line.join(" "));
			line = [word];
			tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		  }
		}
	  });
	}	
}

pisaChart.prototype.addButtons = function(chartElement){
	
	var save_png = this.svg
		.append('g')
		.attr('class', 'button')
		.attr('transform', 'translate(15,0)')
		.on("click", function(){		
			var svg = document.getElementById(chartElement.id + '-svg-chart');
			saveSvgAsPng(svg, chartElement.id + ".png", { canvg: canvg, backgroundColor: 'white'});
		})
	
	save_png.append('rect')
		.attr('width', 35)
		.attr('height', 15)
		.attr('rx', 4)
		.attr('ry', 4)
		.style('fill', 'lightsteelblue');
		
	save_png.append('text')
		.attr('x', 1)
		.attr('y', 7.5)
		.attr('dy', '.35em')
		.style('fill', 'white')
		.text("PNG");
}

pisaChart.prototype.update = function(x){
	
	var that = this;
	var m = this.margin;
	
	//remove items that need to be redrawn
	this.chart.selectAll(".scaleBar").remove();
	this.chart.selectAll(".scaleText").remove();
	//erase grids on redraw
	this.chart.selectAll('.x-gridLine').remove();
	this.chart.selectAll('.y-gridLine').remove();
	this.chart.selectAll('graticule').remove();
	this.svg.selectAll('.disclaimer-text').remove();

	//layer comparison to identify layers no longer needed
	this.plotLayers = x.layers;
	var newLayers = x.layers.map(function(d) { return d.label; });
	var oldLayers = [];
	this.layerIndex.forEach(function(d){
			var x = newLayers.indexOf(d);
			if(x < 0) {
				oldLayers.push(d);
				}
		});
	
	//update dimensions
	this.width = this.element.offsetWidth-30;
	this.height = this.element.offsetHeight;
	
	this.svg
		.attr('width', this.width)
		.attr('height', this.height);
	
	this.plot
		.attr('transform','translate('+this.margin.left+','+this.margin.top+')');
	
	//update all the other stuff
	this.processScales(this.plotLayers, x.options);
	this.updateAxes();
	this.routeLayers(this.plotLayers, this.element);

}

pisaChart.prototype.resize = function(){
	this.draw(this.element)
}
