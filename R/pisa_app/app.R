
library(shiny)
library(dplyr)
library(pisaR)
# Define UI for application
ui <- fluidPage(

   # Application title
   titlePanel("PISA"),

   # Sidebar
   sidebarLayout(
      sidebarPanel(
         selectInput("data", choices = c("Transmission", "Severity"))
      ),

      # main panel
      mainPanel(

      )
   )
)

# Define server logic
server <- function(input, output,session) {
  source("./data_scripts/load_data.R")
}

# Run the application
shinyApp(ui = ui, server = server)

