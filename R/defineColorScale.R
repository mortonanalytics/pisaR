#' Define Color Scale
#'
#' Allows User Defined ordinial color scale
#'
#' @param color_palette a list of character strings defining HTML recognized colors
#' @param key a list of character strings mapping color to a data element
#'
#' @return pisaR htmlwidget object
#'
#' @export
defineColorScale <- function(pisaR, color_palette, color_key) {
  pisaR$x$options$color_palette <- color_palette
  pisaR$x$options$color_key <- color_key

  return(pisaR)
 }
