HTMLWidgets.widget({

  name: 'pisaR',

  type: 'output',

  factory: function(el, width, height) {

    return {

      renderValue: function(x) {
		// in case I need these later
		// var options = x.options;
		// var data = x.dataset;
		// var chartType = x.options.chartType;

        // general chart with layers
		if(x.layers) {
			if(this.chart){
				this.chart.update(x);
			} else {
				this.chart = new pisaChart({
					element: document.getElementById(el.id),
					plotLayers: x.layers,
					options: x.options
					});
			}
		}

      },

      resize: function(width, height) {
		//chart will use its own resize method
        if(this.chart) {
			this.chart.resize();
		}

      }

    };
  }
});