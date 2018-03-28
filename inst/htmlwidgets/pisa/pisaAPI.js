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
	
	//define dimensions
	this.width = chartElement.offsetWidth;
	this.height = chartElement.offsetHeight;
	this.margin = { top: 50, right: 20, bottom: 20, left: 40}; //TODO: replace with R controlled margins
	
	//set up parent element and SVG
	chartElement.innerHTML = '';
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
	this.setClipPath(chartElement);
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
		.range([0, this.width - (m.right + m.left)])
		.domain(x_extents[0]);
	
	this.xScale2 = d3.scaleLinear()
		.range([0, this.width - (m.right + m.left)])
		.domain(x_extents[0]);

	this.yScale =  d3.scaleBand()
		.padding(0.2)
		.range([this.height - (m.top + m.bottom), 0])
		.domain(y_extents[0]);
		console.log(this.options.color_key);
		console.log(z_extents[0]);
	var colors_to_plot = this.options.color_palette ? this.options.color_palette : colors[0];
	var colors_key = this.options.color_key ? this.options.color_key : z_extents[0];
	
	this.colorScale = d3.scaleOrdinal()
		.range(colors_to_plot)
		.domain(colors_key);
}

pisaChart.prototype.addAxes = function(){
	var m = this.margin;
	
	//create and append axes
	this.xAxis = d3.axisTop()
			.scale(this.xScale)
			.tickValues(this.xScale.domain().filter(function(d, i) { return !(i % 2); }));
	
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
			.scale(this.xScale)
			.tickValues(this.xScale.domain().filter(function(d, i) { return !(i % 2); }));
			
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
		.attr('rx', 4)
		.attr('ry', 4)
		.attr('class', 'heatCell')
		.attr('width',this.xScale.bandwidth())
		.attr('height', this.yScale.bandwidth())
		.style('stroke', 'white')
		.style('stroke-width', this.options.borderWidth)
		.style('fill', 'white')
		.on('mouseover', function(d){
			console.log(d[ly.z_var]);
			that.tooltip.transition()
				.duration(200)
				.style("display", "inline-block");
			that.tooltip
				.html(ly.y_var + ": " + d[ly.y_var] +
					"<br/> " + ly.x_var + ": " + d[ly.x_var] +
					"<br/> " + ly.z_var + ": " + d[ly.z_var])
				.style("left", (d3.event.pageX - 70 ) + "px")
				.style("top", (d3.event.pageY - 100 ) + "px");
		
		})
		.on('mouseout', function() { that.tooltip.style("display", "none"); });
		
	cells.merge(newCells)
		.transition().ease(d3.easeLinear)
		.duration(100)
		.attr('x', function (d) {return that.xScale(d[ly.x_var]); })
		.attr('y', function (d) {return that.yScale(d[ly.y_var]); })
		.attr('width',this.xScale.bandwidth())
		.attr('height', this.yScale.bandwidth())
		.style('fill', function(d) {return that.colorScale(d[ly.z_var]); })
		;
}

pisaChart.prototype.mapData = function(ly) {
	var that = this;
	var m = this.margin;
	console.log(ly);
	//variables to be sent from R
	var keyData = ly.layerMapping.key_data;
	var keyMap = ly.layerMapping.key_map;
	var period = ly.layerMapping.time_var;
	var value = ly.layerMapping.color_var;
	var currentPeriod = '201610'
	
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
	console.log(data);
	//filter data to display
	var valuesToDisplay = {};
	
	data[0].filter(function(d) { return d.key == currentPeriod; })[0]
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
	this.svg.style('background-color', 'AliceBlue');
	//set projection
	this.projection = d3.geoMercator()
		.scale(150)
		.translate([
			(this.width - (m.right+m.left)) / 2,
			(this.height - (m.top + m.bottom)) / 1.5
		]);
		
	//set path function
	this.path = d3.geoPath().projection(this.projection);
	
	var dataMap = window.worldMap[0];

	var data = dataMap.features;
	
	this.polygons = that.plot.append('g')
		.attr('class', 'map-shapes')
		.selectAll('path')
		.data(data)
		.enter()
		.append('path')
		.attr('class', 'polygons')
		.style('fill', 'whitesmoke')
		.style('stroke', 'whitesmoke')
		.style('stroke-width', 0.5)
		.attr('d', that.path)
		.on('mouseover', function(d){
			console.log(d);
			that.tooltip.transition()
				.duration(200)
				.style("display", "inline-block");
			that.tooltip
				.html("Country: "  + d.properties.CNTRY_TERR +
					"<br/> " + "Value: " + (d.values ? d.values : "Unreported"))
				.style("left", (d3.mouse(this)[0]) + 'px')
				.style("top", (d3.mouse(this)[1]) + 'px');
		
		})
		.on('mouseout', function() { that.tooltip.style("display", "none"); });
	
	this.polygons
		.transition()
		.duration(1000)
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
	
}

pisaChart.prototype.addTooltip = function(chartElement) {

	this.tooltip = d3.select(chartElement).append("div").attr("class", "toolTip");
}

