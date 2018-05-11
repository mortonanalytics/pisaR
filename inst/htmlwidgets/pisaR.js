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
		this.chart = new pisaChart({
			element: document.getElementById(el.id),
			plotLayers: x.layers,
			options: x.options
			});
			
		if(HTMLWidgets.shinyMode){
			var that = this;
			// redraw on {.tabset} tab visibility changed
			  var tab = $(el).closest('div.tab-pane');
			  if (tab !== null) {
				var tabID = tab.attr('id');
				var tabAnchor = $('a[data-toggle="tab"][href="#' + tabID + '"]');
				if (tabAnchor !== null) {
				  tabAnchor.on('shown.bs.tab', function() {
					if (that.chart)
					  that.chart.resize();  
				  });
				}
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