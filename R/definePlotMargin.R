#' Define Plot Margins
#'
#' Allows User Defined plot margins
#'
#' @param top,left,bottom,right numeric values representing respective plot margins
#'
#' @return pisaR htmlwidget object
#'
#' @export
definePlotMargin <- function(pisaR, top = 50, left = 50, bottom = 0, right = 50) {
  pisaR$x$options$margins$top <- top
  pisaR$x$options$margins$left <- left
  pisaR$x$options$margins$bottom <- bottom
  pisaR$x$options$margins$right <- right

  return(pisaR)
}
