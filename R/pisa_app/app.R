
library(shiny)
library(dplyr)
library(pisaR)
# Define UI for application
ui <- navbarPage(

   # Application title
   title = "Pandemic Influenza Severity Index (PISA)",

   # Transmission Tab
   tabPanel(title = "Transmission",
     # Sidebar
     sidebarLayout(
        sidebarPanel(
           uiOutput(outputId = "year"),width = 3
        ),
        # main panel
        mainPanel(pisaROutput("map"),
                  pisaROutput("heatmap")
        )

      )
     ),
   tabPanel(title = "Seriousness"),
   tabPanel(title = "Impact"),
   tabPanel(title = "Country Summary"),
   tabPanel(title = "About")
)

# Define server logic
server <- function(input, output,session) {

  ## load data into the app
  source("./data_scripts/load_data.R")

  ## render UI elements using data available
  output$year <- renderUI({
    selectInput("year", "Select A Year", choices = year_ui, selected = max(year_ui))
  })

  filter_data <- reactive({
    req(input$year)
    data_plot %>%
      filter(Year.Code == input$year)
  })

  output$map <- renderPisaR({
      pisaR()%>%
      createLayer(layerType = "globalMap",
                  layerColor = list("green","yellow", "orange", "red", "darkred"),
                  layerLabel = "map",
                  layerData = filter_data(),
                  layerMapping = list(color_var = "Transmission",
                                      time_var = "Year_Week_number",
                                      key_data = "ISO",
                                      key_map = "ISO_3_CODE")) %>%
      defineColorScale(color_palette = list("green","yellow", "orange", "red", "purple", "whitesmoke", "whitesmoke"),
                       color_key = list("below", "Low", "Moderate", "High", "Extra-ordinary", "No Impact", ""))

  })

  output$heatmap <- renderPisaR({
      pisaR() %>%
      createLayer(layerType = "heatmap",
                  layerColor = list("green","yellow", "orange", "red", "darkred"),
                  layerLabel = "heat",
                  layerData = filter_data(),
                  layerMapping = list(x_var = 'Year_Week_number',
                                      y_var = 'SOV_CODE',
                                      z_var = "Transmission")) %>%
      defineColorScale(color_palette = list("green","yellow", "orange", "red", "purple", "whitesmoke", "whitesmoke"),
                       color_key = list("below", "Low", "Moderate", "High", "Extra-ordinary", "No Impact", ""))

  })
}

# Run the application
shinyApp(ui = ui, server = server)

