library(shiny)
library(dplyr)
library(pisaR)
# Define UI for application
ui <- navbarPage(
  # Application title with links to WHO and PISA
  title = HTML('<span class="navtitle">
               <a rel="home" href="http://who.int" title="World Health Organization">
               <img class = "whoimg" src="who_logo_white40px.png"></a>
               <a rel="home" href="http://www.who.int/influenza/surveillance_monitoring/pisa/en/" title="PISA Home Page">
               <span class="navtext">Pandemic and Epidemic Influenza Severity Assessment</a></span></span>'),
  tabPanel(title = "Home"),
  tabPanel(title = "Explore Data",
  fluidRow(
    column(3,
           sidebarPanel(width = 12,
                        uiOutput(outputId = "year"),
                        uiOutput(outputId = "transmission_filter"),
                        uiOutput(outputId = "confidence_level_filter"),
                        uiOutput(outputId = "week_filter"))),
    tags$head(
      tags$link(rel = "stylesheet", type = "text/css", href = "style.css")
    ),

    column(9, navbarPage(
      title = "",
      id = "explore",
      # Transmissability Tab
      tabPanel(title = "Transmissability",
        pisaROutput("map_transmission", width = "100%", height = "350px"),
        fluidRow(column(9,p("The WHO Disclaimer: need text"))),
        pisaROutput("heatmap_transmission", width = "100%", height = "340px")
        ),
      # Seriousness Tab
      tabPanel(title = "Seriousness",
               pisaROutput("map_seriousness", width = "100%", height = "350px"),
               fluidRow(column(9,p("The WHO Disclaimer: need text"))),
               pisaROutput("heatmap_seriousness", width = "100%", height = "340px")),
      # Impact Tab
      tabPanel(title = "Impact",
               pisaROutput("map_impact", width = "100%", height = "350px"),
               fluidRow(column(9,p("The WHO Disclaimer: need text"))),
               pisaROutput("heatmap_impact", width = "100%", height = "340px"))
      )
    )
  )
  ),
  tabPanel(title = "About"),
  id = "title_bar"
)

# Define server logic
server <- function(input, output,session) {

  ## load data into the app
  source("./data_scripts/load_data.R")

  ## render UI elements using data available
  output$year <- renderUI({
    selectInput("year", "Select A Year", choices = year_ui, selected = max(year_ui))
  })

  output$transmission_filter <- renderUI({
    selectInput("transmission_filter",
                "Select Transmission Level",
                choices = transmission_ui,
                multiple = TRUE,
                selected = transmission_ui)
  })

  output$confidence_level_filter <- renderUI({
    selectInput("cl_filter",
                "Select Confidence Level",
                choices = "Not Available in Data")
  })

  output$week_filter <- renderUI({
    sliderInput("week_filter",
                "Week Filter - Map Only",
                min = min(unique(filter_data()$Year_Week_number)),
                max = max(unique(filter_data()$Year_Week_number)),
                value = min(unique(filter_data()$Year_Week_number)),
                step = 1,
                sep = "")
  })

  filter_data <- reactive({
    req(input$year)
    data_plot %>%
      filter(Year.Code == input$year &
               Transmission %in% input$transmission_filter)
  })
  ############# transmission ###################
  output$map_transmission <- renderPisaR({
    req(input$week_filter)
      pisaR()%>%
      createLayer(layerType = "globalMap",
                  layerColor = list("green","yellow", "orange", "red", "darkred"),
                  layerLabel = "map",
                  layerData = filter_data() %>%
                    select(Transmission, Year_Week_number, ISO) %>%
                    filter(Year_Week_number == input$week_filter),
                  layerMapping = list(color_var = "Transmission",
                                      time_var = "Year_Week_number",
                                      key_data = "ISO",
                                      key_map = "ISO_3_CODE")) %>%
      defineColorScale(color_palette = list("green","yellow", "orange", "red", "purple", "lightgray", "gray"),
                       color_key = list("Below", "Low", "Moderate", "High", "Extra-ordinary", "Not reported", "Not Available")) %>%
      definePlotMargin(top = 0, left = 0, bottom = 0, right = 0)

  })

  output$heatmap_transmission <- renderPisaR({
      pisaR() %>%
      createLayer(layerType = "heatmap",
                  layerColor = list("green","yellow", "orange", "red", "darkred"),
                  layerLabel = "heat",
                  layerData = filter_data()%>%
                    select(Transmission, Year_Week_number, SOV_CODE) %>%
                    arrange(Year_Week_number),
                  layerMapping = list(x_var = 'Year_Week_number',
                                      y_var = 'SOV_CODE',
                                      z_var = "Transmission")) %>%
      defineColorScale(color_palette = list("green","yellow", "orange", "red", "purple", "lightgray", "gray"),
                       color_key = list("Below", "Low", "Moderate", "High", "Extra-ordinary", "Not reported", "Not Available")) %>%
      definePlotMargin()

  })
  ############# seriousness ###################
  output$map_seriousness <- renderPisaR({
    req(input$week_filter)
    pisaR()%>%
      createLayer(layerType = "globalMap",
                  layerColor = list("green","yellow", "orange", "red", "darkred"),
                  layerLabel = "map",
                  layerData = filter_data() %>%
                    select(Seriousness, Year_Week_number, ISO) %>%
                    filter(Year_Week_number == input$week_filter),
                  layerMapping = list(color_var = "Seriousness",
                                      time_var = "Year_Week_number",
                                      key_data = "ISO",
                                      key_map = "ISO_3_CODE")) %>%
      defineColorScale(color_palette = list("green","yellow", "orange", "red", "purple", "lightgray", "gray"),
                       color_key = list("Below", "Low", "Moderate", "High", "Extra-ordinary", "Not reported", "Not Available")) %>%
      definePlotMargin(top = 0, left = 0, bottom = 0, right = 0)

  })

  output$heatmap_seriousness <- renderPisaR({
    pisaR() %>%
      createLayer(layerType = "heatmap",
                  layerColor = list("green","yellow", "orange", "red", "darkred"),
                  layerLabel = "heat",
                  layerData = filter_data()%>%
                    select(Seriousness, Year_Week_number, SOV_CODE) %>%
                    arrange(Year_Week_number),
                  layerMapping = list(x_var = 'Year_Week_number',
                                      y_var = 'SOV_CODE',
                                      z_var = "Seriousness")) %>%
      defineColorScale(color_palette = list("green","yellow", "orange", "red", "purple", "lightgray", "gray"),
                       color_key = list("Below", "Low", "Moderate", "High", "Extra-ordinary", "Not reported", "Not Available")) %>%
      definePlotMargin()

  })

  ############# impact ###################
  output$map_impact <- renderPisaR({
    req(input$week_filter)
    pisaR()%>%
      createLayer(layerType = "globalMap",
                  layerColor = list("green","yellow", "orange", "red", "darkred"),
                  layerLabel = "map",
                  layerData = filter_data() %>%
                    select(Impact, Year_Week_number, ISO) %>%
                    filter(Year_Week_number == input$week_filter),
                  layerMapping = list(color_var = "Impact",
                                      time_var = "Year_Week_number",
                                      key_data = "ISO",
                                      key_map = "ISO_3_CODE")) %>%
      defineColorScale(color_palette = list("green","yellow", "orange", "red", "purple", "lightgray", "gray"),
                       color_key = list("No Impact", "Low", "Moderate", "High", "Extra-ordinary", "Not reported", "Not Available")) %>%
      definePlotMargin(top = 0, left = 0, bottom = 0, right = 0)

  })

  output$heatmap_impact <- renderPisaR({
    pisaR() %>%
      createLayer(layerType = "heatmap",
                  layerColor = list("green","yellow", "orange", "red", "darkred"),
                  layerLabel = "heat",
                  layerData = filter_data()%>%
                    select(Impact, Year_Week_number, SOV_CODE) %>%
                    arrange(Year_Week_number),
                  layerMapping = list(x_var = 'Year_Week_number',
                                      y_var = 'SOV_CODE',
                                      z_var = "Impact")) %>%
      defineColorScale(color_palette = list("green","yellow", "orange", "red", "purple", "lightgray", "gray"),
                       color_key = list("below", "Low", "Moderate", "High", "Extra-ordinary", "Not reported", "Not Available")) %>%
      definePlotMargin()

  })
}

# Run the application
shinyApp(ui = ui, server = server)

