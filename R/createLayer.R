#' Create Plot Layer
#'
#' Create plot layer by defining parameters
#'
#' @param layerType defines the layer as either a 'heatmap' or 'globalMap' (anticipates future layer types)
#' @param layerColor a string or vector of strings of HTML recognized colors
#' @param layerLabel a string unique to the layer for the plot
#' @param layerData (optional) A data frame or tibble
#' @param layerMapping a list object of variables defined, eg. list(x_var = "xVar", y_var = "yVar", z_var = "colorVar")
#'
#' @return  A list object, pisaR, with layers now attached
#'
#' @export

createLayer <- function(pisaR,
                        layerType,
                        layerColor = NULL,
                        layerLabel,
                        layerData = NULL,
                        layerMapping ){

  ## assign data
  if(is.null(layerData)) {
    layerData <- pisaR$x$dataset
  }
  pisaR$x$dataset <- NULL

  layerData <- unname(split(layerData, 1:nrow(layerData)))
  ##set plot options
  pisaR$x$options$borderWidth <- 1
  if(layerType == "globalMap"){pisaR$x$options$plotType <- "globalMap"
  }
  ##create layer object
  layer <- list(
    type = layerType,
    color = layerColor,
    label = layerLabel,
    data = layerData,
    layerMapping = layerMapping,
    ##plot variables
    x_var = layerMapping$x_var,
    y_var = layerMapping$y_var,
    z_var = layerMapping$z_var

  )

  ##put the layers together

  if(length(pisaR$x$layers) > 0){
    pisaR$x$layers <- c(pisaR$x$layers, list(layer))
  } else {
    pisaR$x$layers <- list(layer)
  }

  return(pisaR)

}
