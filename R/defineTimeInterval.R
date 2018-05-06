#' Define Time Interval
#'
#' Allows User to define the time initerval for the x axis
#'
#' @param intervals vector of date/character values
#'
#' @return pisaR htmlwidget object
#'
#' @export
defineTimeInterval <- function(pisaR, interval) {
  pisaR$x$options$timeInterval <- interval

  return(pisaR)
}
