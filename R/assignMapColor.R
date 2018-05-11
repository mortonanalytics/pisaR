#' Assign Country Color
#'
#' Allows User to assign color to a specific country
#'
#' @param country
#'
#' @param color
#'
#' @return pisaR htmlwidget object
#'
#' @export
assignMapColor <- function(pisaR, country, color) {

  pisaR$x$options$mapColor <- list(country = country, color = color)

  return(pisaR)
}
