
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
         selectInput(inputId = "data", label = "Select Metric", choices = c("Transmission", "Seriousness", "Impact"))
      ),

      # main panel
      mainPanel(
        pisaROutput("map")
      )
   )
)

# Define server logic
server <- function(input, output,session) {
  source("./data_scripts/load_data.R")

  output$map <- renderPisaR({
    data_plot %>%
      pisaR()%>%
      createLayer(layerType = "globalMap",
                  layerColor = list("green","yellow", "orange", "red", "darkred"),
                  layerLabel = "map",
                  layerData = data_plot,
                  layerMapping = list(z_var = input$data))
  })
}

# Run the application
shinyApp(ui = ui, server = server)

