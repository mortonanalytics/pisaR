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
	this.margin = { top: 20, right: 20, bottom: 20, left: 20}; //TODO: replace with R controlled margins
	
	//set up parent element and SVG
	chartElement.innerHTML = '';
	this.svg = d3.select(chartElement).append('svg')
		.attr('id', chartElement.id + '-svg')
		.attr('width', this.width)
		.attr('height', this.height);
	
	//create g element
	this.plot = this.svg.append('g')
		.attr('transform','translate('+this.margin.left+','+this.margin.top+')');
		
	//initialize chart
	this.initialize(chartElement);
	
}

pisaChart.prototype.initialize = function(chartElement){
	//preserve chart scope
	var that = this;
	
	//route layer to appropriate drawing functions
	//update and resize should mirror this function
	this.layerIndex = this.plotLayers.map(function(d) { return d.label; });//used to determine if layers have changed
	
	//anticipates other layer types, but not for this project
	this.plotLayers.forEach(function(d){
		if(d.type == "heatmap"){
			
		} else if(d.type == "globalMap"){
			
		}
	});
	
	
	
}