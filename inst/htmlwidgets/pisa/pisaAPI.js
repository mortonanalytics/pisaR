//PISA Chart API
//author: Ryan Morton
//client: World Health Organization
var pisaChart = function(opts) {
	
	//pass chart elements
	this.element = opts.element;
	this.plotLayers = opts.plotLayers;
	this.options = opts.options;
	//console.log(this.plotLayers);
	
	//create the chart 
	//widget calls the update function if chart already exists
	this.draw(this.element);
}

pisaChart.prototype.draw = function(chartElement) {
	var user_margins = this.options.margins;
	//define dimensions
	this.width = chartElement.offsetWidth-30;
	this.height = chartElement.offsetHeight;
	this.margin = { top: user_margins.top, right: user_margins.right, bottom: user_margins.bottom, left: user_margins.left};
	
	//set up parent element and SVG
	chartElement.innerHTML = '';
	//if(this.plotLayers[0].type == "heatmap") {d3.select(chartElement).style('overflow-y', 'auto');}
	
	this.svg = d3.select(chartElement).append('svg')
		.attr('id', chartElement.id + '-svg')
		.attr('width', this.width)
		.attr('height', this.height);
	
	//create g element
	this.plot = this.svg.append('g')
		.attr('transform','translate('+this.margin.left+','+this.margin.top+')');
	
	this.chart = this.plot.append('g');
	
	this.context = this.svg.append('g')
			.attr('class', 'context')
			.attr('height', 10)
			.attr('width', this.width- (this.margin.right + this.margin.left))
			.attr('transform', "translate(" + this.margin.left + "," + 0 + ")");
			
	//initialize chart
	this.initialize(chartElement);
	
}

pisaChart.prototype.initialize = function(chartElement){
	//preserve chart scope
	var that = this;
	
	//set clip path
	if(this.options.plotType == "globalMap")this.setClipPath(chartElement);
	this.processScales(this.plotLayers);
	if(this.options.plotType != "globalMap")this.addAxes();
	this.routeLayers(this.plotLayers);
	this.addTooltip(chartElement);
}

pisaChart.prototype.setClipPath = function(chartElement){
	
	this.clipPath = this.plot.append('defs').append('svg:clipPath')
		.attr('id', chartElement.id + 'clip')
	  .append('svg:rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', this.width - (this.margin.left + this.margin.right))
		.attr('height', this.height - (this.margin.top + this.margin.bottom));
		
	this.chart.attr('clip-path', 'url(#' + chartElement.id + 'clip'+ ')')
}

pisaChart.prototype.routeLayers = function(lys){
	var that = this;
	
	this.layerIndex = lys.map(function(d) {return d.label; });
	
	lys.forEach(function(d){

		var layerType = d.type;

		if(layerType == "heatmap") {
			that.addCells(d);
		} else if(d.type == "globalMap"){
			that.mapData(d);
			that.makeMap(d);
		} else  {
			//alert("Wrong Layer Type!")
		}
		
	});
}

pisaChart.prototype.processScales = function(lys) {
	var m = this.margin;
	
	var x_extents = [];
	var y_extents = [];
	var z_extents = [];
	var colors = [];
	
	lys.forEach(function(d){
		
		var x_var = d.x_var; 
		var y_var = d.y_var;
		var z_var = d.z_var ? d.z_var : d.layerMapping.color_var;
		
		var x = d3.map( d.data, function(e) { return +e[x_var]; }).keys();
		var y = d3.map(d.data, function(e) { return e[y_var]; }).keys();
		var z = d3.map(d.data, function(e) { return e[z_var]; }).keys();
		var color = d3.map(d.color, function(e) { return e; }).keys();

		x_extents.push(x);
		y_extents.push(y);
		z_extents.push(z);
		colors.push(color);
		
	})

	//create scales
	this.xScale = d3.scaleBand()
		.rangeRound([0, this.width - (m.right + m.left)])
		.domain(x_extents[0]);
		
		console.log(x_extents);

	this.yScale =  d3.scaleBand()
		//.padding(0.2)
		.range([(y_extents[0].length * 40) - (m.top + m.bottom), 0])
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
	
	this.plot.append('g')
		.attr("class", "x axis")
		.call(this.xAxis)
			.selectAll("text")
				.attr('dy', '.35em')
				.attr('dx', '.35em')
				.attr("transform", "rotate(-45)")
				.attr('text-anchor', 'start');
	
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
	
	this.svg.selectAll('.y.axis')
		.transition().ease(d3.easeQuad)
		.duration(500)
		.call(d3.axisLeft(this.yScale))
			.selectAll("text")
				.attr("dx", "-.25em");
}

pisaChart.prototype.setZoom = function(chartElement) {
	var that = this;
	var m = this.margin;
	
	//define brush behavior
	var brush = d3.brushX()
		.extent([[0,0], [this.width - (m.left + m.right),  100]])
		.on("brush end", brushed);
	
	function brushed(){
			if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return;
			var s = d3.event.selection || that.xScale2.range();
			that.xScale.domain(s.map(that.xScale2.invert, that.xScale2));
				
			var svg = d3.select(chartElement).select('svg');
			
			that.routeLayers(that.plotLayers);
			
			that.plot
				.select(".x.axis").transition().ease(d3.easeLinear)
				.duration(100)
				.call(that.xAxis).selectAll("text")				
					.attr('dy', '.35em')
					.style('text-anchor', 'center');
							
			svg
				.select('.zoom').call(zoom.transform, d3.zoomIdentity
				.scale((that.width - (m.right + m.left) )/ (s[1] - s[0]))
				.translate(-s[0],0));
				
			if(that.handle){
				that.handle.attr("display", null).attr("transform", function(d, i) { return "translate(" + [ s[i], - 0] + ")"; });
			}
		}
	//define zoom behavior
	var zoom = d3.zoom()
		.scaleExtent([1, Infinity])
		.translateExtent([
			[0,0],
			[this.width- (m.right + m.left), this.height - (m.top + m.bottom)]
		])
		.extent([
			[0,0],
			[this.width- (m.right + m.left), this.height - (m.top + m.bottom)]
		])
		.on('zoom', zoomed);
		
	//draw context bar for brush/zoom control
	if(this.brushLine){
		
		this.brushLine
			.attr('x1', 0)
			.attr('x2', this.width - (m.right + m.left ))
			.attr('y1', 8)
			.attr('y2', 8);
			
		this.brush
			.call(brush)
			.call(brush.move, this.xScale.range());	
			
		} else {
			
			this.brushLine = this.context
				.append('line')
				.attr('x1', 0)
				.attr('x2', this.width - (m.right + m.left ))
				.attr('y1', 8)
				.attr('y2', 8)
				.style('stroke-width', 10)
				.style('stroke', 'lightsteelblue');
		
			this.brush = this.context.append('g')
				.attr('class', 'brush')
				.attr('y', 0)
				.call(brush)
				.call(brush.move, this.xScale.range());
				
			this.handle = this.brush.selectAll(".handle--custom")
			  .data([{type: "w"}, {type: "e"}])
			  .enter().append("path")
				.attr("class", "handle--custom")
				.attr('y', 0)
				.attr("fill", "gray")
				.attr("fill-opacity", 0.8)
				.attr("d", d3.arc()
					.innerRadius(0)
					.outerRadius(7)
					.startAngle(0)
					.endAngle(function(d, i) { return i ? Math.PI : -Math.PI; }));
				
		}
	
	function zoomed(){
			if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brushed') return;
			var t = d3.event.transform;
			that.xScale(t.rescaleX(that.xScale2).domain());
			
			that.routeLayers();
			
			that.plot
				.select(".x.axis").transition().ease(d3.easeLinear)
				.duration(100)
				.call(that.xAxis).selectAll("text")				
					.attr('dy', '.35em')
					.style('text-anchor', 'center');
			
			that.context.select('.brush').call(brush.move, that.xScale.range().map(t.invertX, t));
		}	
		
	
	//call zoom behavior from plot area
	d3.select(this.element).select('svg').append('rect')
			.attr('class', 'zoom')
			.style('fill', 'none')
			.style('cursor', 'move')
			.style('pointer-events', 'all')
			.attr('width',this.width - (m.right + m.left))
			.attr('height', this.height - (m.top + m.bottom))
			.attr('transform',"translate(" + this.margin.left + "," + this.margin.top + ")")
			.call(zoom);
	
}

pisaChart.prototype.addCells = function(ly) {
	
	
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
		.attr('width',this.xScale.bandwidth())
		.attr('height', this.yScale.bandwidth())
		.style('stroke', 'whitesmoke')
		.style('stroke-width', this.options.borderWidth)
		.style('fill', 'lightgray')
		.on('mouseover', function(d){
			var coordinates = [0, 0];
			coordinates = d3.mouse(this);
			//var x = coordinates[0];
			//var y = coordinates[1];

			// D3 v4
			var x = (d3.event.pageX)- (document.getElementById(that.element.id).getBoundingClientRect().left) +100;
			var y = (d3.event.pageY) - (document.getElementById(that.element.id).getBoundingClientRect().height)+100;
			that.tooltip
				.style("display", "inline-block");
			that.tooltip
				.html(ly.y_var + ": " + d[ly.y_var] +
					"<br/> " + ly.x_var + ": " + d[ly.x_var] +
					"<br/> " + ly.z_var + ": " + d[ly.z_var])
				.style("left", x + 'px')
				.style("top",  y + 'px' );
		
		})
		.on('mouseout', function() { that.tooltip.style("display", "none"); });
		
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
	this.addGrid();
}

pisaChart.prototype.addGrid = function(){
	
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
		.attr('x1', function(d) { return that.xScale(d); })
		.attr('x2', function(d) { return that.xScale(d); })
		.attr('y1', that.height - (m.top + m.bottom) )
		.attr('y2', 0)
		.style('stroke', 'whitesmoke');
		
	var y_grid = that.chart
		.selectAll('.y-gridLine')
		.data(y_range);

	y_grid.exit().remove();
	
	y_grid.enter()
		.append('line')
		.attr('class', 'y-gridLine')
		.attr('x1', 0)
		.attr('x2', this.width - (m.left + m.right))
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
	var value = ly.layerMapping.color_var;
	
	var data = [];
	//create nested JSON object for easier filtering
	this.plotLayers.forEach(function(d){
			console.log(d);
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
		.forEach(function(d) { valuesToDisplay[d.key] = d.values.map(function(e) { return e[value]; })[0] });
	
	window.worldMap[0].features.forEach(function(d) { d.values = valuesToDisplay[d.properties[keyMap]]; })

	this.values = [];
	for(var key in valuesToDisplay){
		var value = valuesToDisplay[key];
		that.values.push(value);
	}
	
}

pisaChart.prototype.makeMap = function(ly) {
	var that = this;
	var m = this.margin;
	//set background
	this.chart.append('rect')
		.attr('class', 'map-background')
		.attr('width',this.width - (m.right+m.left))
		.attr('height', this.height - (m.top + m.bottom))
		.style('fill', 'AliceBlue');
	
	//set projection
	this.projection = d3.geoMercator()
		.scale(140)
		.translate([
			(this.width - (m.right+m.left)) / 2,
			(this.height - (m.top + m.bottom)) / 1.5
		]);
		
	//set path function
	this.path = d3.geoPath().projection(this.projection);
	
	var dataMap = window.worldMap[0];

	var data = dataMap.features;
	
	this.polygons = this.chart.append('g')
		.attr('class', 'map-shapes')
		.selectAll('path')
		.data(data);
	this.polygons.exit().remove();
	
	var newPolygons = this.polygons.enter()
		.append('path')
		.attr('class', 'map-shapes')
		.style('fill', 'whitesmoke')
		.style('stroke', 'whitesmoke')
		.style('stroke-width', 0.5)
		.attr('d', that.path)
		.on('mouseover', function(d){
			that.tooltip.transition()
				.duration(200)
				.style("display", "inline-block");
			that.tooltip
				.html("Country: "  + d.properties.CNTRY_TERR +
					"<br/> " + "Value: " + (d.values ? d.values : "Unreported"))
				.style("left", (d3.mouse(this)[0]) + 'px')
				.style("top", (d3.mouse(this)[1]-20) + 'px');
		
		})
		.on('mouseout', function() { that.tooltip.style("display", "none"); });
	
	this.polygons.merge(newPolygons)
		.transition()
		.duration(1000)
		.attr('d', this.path)
		.style('opacity', 0.8)
		.style('fill', function(d) {return d.values ? that.colorScale(d.values) : "lightgray";});
		
	var overlay_data = window.overlay_polygon[0].features;
	
	this.overlay_polygons = this.plot.append('g')
		.attr('class', 'overlay-polygons')
		.selectAll('.overlay-polygons')
		.data(overlay_data)
		.enter()
		.append('path')
		.style('fill', function(d) { return d.properties.AREA == 'Lakes' ? 'AliceBlue' : 'gray'; })
		.style('stroke', function(d) { return d.properties.AREA == 'Lakes' ? 'AliceBlue' : 'whitesmoke'; })
		.attr('d', this.path);
		
	var overlay_line_data = window.overlay_line[0].features;
	
	this.overlays = this.plot.append('g')
		.attr('class', 'overlay-lines')
		.selectAll('.overlay-lines')
		.data(overlay_line_data).enter()
		.append('path')
		.style('fill', 'none')
		.style('stroke', 'lightgray')
		.style('opacity', 0.5)
		.style('stroke-dasharray', '2,2')
		.attr('d', this.path);
	
	this.addScaleLegend();
	this.addLegend();
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
		
	//create legend	box (exists in the background)
	var legendBox = this.chart.append('rect')
		.attr('class', 'legend-box')
		.attr("x", this.width - (m.right + m.left + 100))
		.attr('width', '100px')
		.attr('height', (this.colorScale.domain().length * 20) + 'px')
		.style('fill', 'white')
		.style('opacity', 0.75);
		
	console.log(this.colorScale.domain());
	
	var legendElement = this.chart.append('g')
		.selectAll('.legendElement')
		.data(this.colorScale.domain())
		.enter()
		.append('g')
		.attr('class', 'legendElement')
		.attr("transform", function(d,i) { return "translate(0," +  i * 20 + ")"; })
		.attr("font-family", "sans-serif")
		.attr("font-size", 10)
		.attr("text-anchor", "end");
	
	legendElement.append("rect")
			.attr("x", that.width - (m.right + m.left + 10))
			.attr("width", 12)
			.attr("height", 12)
			.attr("fill", function(d) { return d.color = that.colorScale(d); });	
	
	legendElement.append("text")
		.attr("x", that.width - (m.right + m.left + 15))
		.attr("y", 9.5)
		.attr("dy", "0.15em")
		.text(function(d) { return d; });
	
}

pisaChart.prototype.addTooltip = function(chartElement) {

	this.tooltip = d3.select(chartElement).append("div").attr("class", "toolTip");
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
	this.width = this.element.offsetWidth;
	this.height = this.element.offsetHeight;
	
	this.svg
		.attr('width', this.width)
		.attr('height', this.height);
	
	this.plot
		.attr('transform','translate('+this.margin.left+','+this.margin.top+')');
	
	//update all the other stuff
	this.processScales(this.plotLayers);
	//this.updateClipPath(this.element);
	this.updateAxes();
	this.routeLayers(this.plotLayers);
	//this.updateLegend();
	//this.updateToolTip(this.element);
	//this.removeLayers(oldLayers);
	
}

pisaChart.prototype.resize = function(){
	this.draw(this.element)
}