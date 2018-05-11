#' pisaR
#'
#' Widget for creating PISA application pieces
#'
#' @import htmlwidgets
#'
#' @import dplyr
#'
#' @export
#'
#' @param data (optional) A data frame or tibble
pisaR <- function(data = NULL, width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data = data
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'pisaR',
    x,
    width = width,
    height = height,
    package = 'pisaR',
    elementId = elementId
  )
}

#' Shiny bindings for pisaR
#'
#' Output and render functions for using pisaR within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a pisaR
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name pisaR-shiny
#'
#' @export
pisaROutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'pisaR', width, height, package = 'pisaR')
}

#' @rdname pisaR-shiny
#' @export
renderPisaR <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, pisaROutput, env, quoted = TRUE)
}
