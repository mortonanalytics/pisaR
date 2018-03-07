createLayer <- function(pisaR,
                        layerType,
                        layerColor,
                        layerLabel,
                        layerData = NULL,
                        layerMapping ){

  ## assign data
  if(is.null(layerData)) {
    layerData <- pisaR$x$dataset
  }
  pisaR$x$dataset <- NULL
  pisaR$x$options$borderWidth <- 1
  layerData <- unname(split(layerData, 1:nrow(layerData)))

  ##create layer object
  layer <- list(
    type = layerType,
    color = layerColor,
    label = layerLabel,
    data = layerData,
    ##plot variables
    x_var = layerMapping$x_var,
    y_var = layerMapping$y_var,
    z_var = layerMapping$z_var
  )

  ##put the layers together

  if(length(pisaR$x$layers) > 0){
    PopRViz$x$layers <- c(PopRViz$x$layers, list(layer))
  } else {
    pisaR$x$layers <- list(layer)
  }

  return(pisaR)

}
