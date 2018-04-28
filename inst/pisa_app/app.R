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
                        uiOutput(outputId = "season_filter"),
                        uiOutput(outputId = "season_date_filter"),
                        uiOutput(outputId = "week_filter"),
                        uiOutput(outputId = "level_filter"),
                        uiOutput(outputId = "confidence_level_filter"),
                        uiOutput(outputId = "region_filter")
                        #uiOutput(outputId = "week_filter")
                        )
                        ),
    tags$head(
      tags$link(rel = "stylesheet", type = "text/css", href = "style.css")
    ),

    column(9, tabsetPanel(
      id = "explore",
      # Transmissability Tab
      tabPanel(title = "Transmissability",
               fluidRow(pisaROutput("map_transmission", width = "100%", height = "350px")),
               fluidRow(column(9,p("The WHO Disclaimer: need text"))),
               fluidRow(pisaROutput("heatmap_transmission", width = "100%"))
        ),
      # Seriousness Tab
      tabPanel(title = "Seriousness",
               fluidRow(pisaROutput("map_seriousness", width = "100%", height = "350px")),
               fluidRow(column(9,p("The WHO Disclaimer: need text"))),
               fluidRow(pisaROutput("heatmap_seriousness", width = "100%"))
               ),
      # Impact Tab
      tabPanel(title = "Impact",
               fluidRow(pisaROutput("map_impact", width = "100%", height = "350px")),
               fluidRow(column(9,p("The WHO Disclaimer: need text"))),
               fluidRow(pisaROutput("heatmap_impact", width = "100%"))
               )
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
    selectInput("year_filter", "Select A Year", choices = year_ui, selected = max(year_ui))
  })

  output$level_filter <- renderUI({
    checkboxGroupInput("level_filter",
                "Select Level",
                choices = levels_ui,
                selected = levels_ui,
                inline = FALSE)
  })

  output$confidence_level_filter <- renderUI({
    checkboxGroupInput("cl_filter",
                "Select Confidence Level",
                choices = confidence_ui,
                selected = confidence_ui)
  })

  output$region_filter <- renderUI({
    checkboxGroupInput("region_filter",
                "Select a Region",
                choices = who_region_ui,
                selected = who_region_ui,
                inline = TRUE)
  })

  output$season_filter <- renderUI({
    selectInput("season_filter",
                "Select a Season",
                choices = season_ui,
                selected = "Both")
  })

  output$season_date_filter <- renderUI({
    req(input$season_filter)
    season_dates <- season_calendar_ui$dates[season_calendar_ui$season == ifelse(input$season_filter == "South", "South", "North")]
    selectInput("season_date_filter",
                "Select the Flu Season",
                choices = season_dates,
                selected = max(season_dates))
  })

  output$week_filter <- renderUI({
    numericInput("week_filter",
                 "Select a Week in Flu Season",
                 value = 1,
                 min = 1,
                 max = 52)
  })

  filter_data <- reactive({
    req(input$season_date_filter)
    ##season filter breakdown
    dates <- c(unlist(strsplit(input$season_date_filter, split = " ")))
    dates <- gsub("-", "", dates)
    start <- dates[1]
    end <- dates[3]

    # season and region filtered table
    # level and confidence level depends on which tab (id = explore) is active
    if(input$explore == "Transmissability"){
      df_this <- df %>%
        filter(ISOYW >= start) %>%
        filter(ISOYW <= end) %>%
        filter(WHOREGION %in% input$region_filter) %>%
        filter(TRANSMISSION %in% input$level_filter) %>%
        filter(TRANSMISSION_CL %in% input$cl_filter)
    } else if(input$explore == "Seriousness"){
      df_this <- df %>%
        filter(ISOYW >= start) %>%
        filter(ISOYW <= end) %>%
        filter(WHOREGION %in% input$region_filter) %>%
        filter(SERIOUSNESS %in% input$level_filter) %>%
        filter(SERIOUSNESS_CL %in% input$cl_filter)
    } else if(input$explore == "Impact") {
      df_this <- df %>%
        filter(ISOYW >= start) %>%
        filter(ISOYW <= end) %>%
        filter(WHOREGION %in% input$region_filter) %>%
        filter(IMPACT %in% input$level_filter) %>%
        filter(IMPACT_CL %in% input$cl_filter)
    }

    return(df_this)
  })
  ############# transmission ###################
  output$map_transmission <- renderPisaR({
    req(input$week_filter)
      pisaR()%>%
      createLayer(layerType = "globalMap",
                  layerColor = list("green","yellow", "orange", "red", "darkred"),
                  layerLabel = "map",
                  layerData = filter_data() %>%
                    filter(ISO_WEEK == input$week_filter) %>%
                    select(TRANSMISSION, TRANSMISSION_CL, TRANSMISSION_COM,COUNTRY_CODE, ISO_YW),
                  layerMapping = list(color_var = "TRANSMISSION",
                                      time_var = "ISO_YW",
                                      key_data = "COUNTRY_CODE",
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
                    select(TRANSMISSION, TRANSMISSION_CL, TRANSMISSION_COM,COUNTRY_TITLE, ISOYW) %>%
                    arrange(ISOYW),
                  layerMapping = list(x_var = 'ISOYW',
                                      y_var = 'COUNTRY_TITLE',
                                      z_var = "TRANSMISSION")) %>%
      defineColorScale(color_palette = list("green","yellow", "orange", "red", "purple", "lightgray", "gray"),
                       color_key = list("Below", "Low", "Moderate", "High", "Extra-ordinary", "Not reported", "Not Available")) %>%
      definePlotMargin(left = 100)

  })
  ############# seriousness ###################
  output$map_seriousness <- renderPisaR({
    req(input$week_filter)
    pisaR()%>%
      createLayer(layerType = "globalMap",
                  layerColor = list("green","yellow", "orange", "red", "darkred"),
                  layerLabel = "map",
                  layerData = filter_data() %>%
                    filter(ISO_WEEK == input$week_filter) %>%
                    select(SERIOUSNESS, SERIOUSNESS_CL, SERIOUSNESS_COM, COUNTRY_CODE, ISO_YW),
                  layerMapping = list(color_var = "SERIOUSNESS",
                                      time_var = "ISO_YW",
                                      key_data = "COUNTRY_CODE",
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
                    select(SERIOUSNESS, SERIOUSNESS_CL, SERIOUSNESS_COM,COUNTRY_TITLE, ISOYW) %>%
                    arrange(ISOYW),
                  layerMapping = list(x_var = 'ISOYW',
                                      y_var = 'COUNTRY_TITLE',
                                      z_var = "SERIOUSNESS")) %>%
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
                    filter(ISO_WEEK == input$week_filter) %>%
                    select(IMPACT, IMPACT_CL, IMPACT_COM,COUNTRY_CODE, ISO_YW),
                  layerMapping = list(color_var = "IMPACT",
                                      time_var = "ISO_YW",
                                      key_data = "COUNTRY_CODE",
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
                    select(IMPACT, IMPACT_CL, IMPACT_COM,COUNTRY_TITLE, ISOYW) %>%
                    arrange(ISOYW),
                  layerMapping = list(x_var = 'ISOYW',
                                      y_var = 'COUNTRY_TITLE',
                                      z_var = "IMPACT")) %>%
      defineColorScale(color_palette = list("green","yellow", "orange", "red", "purple", "lightgray", "gray"),
                       color_key = list("below", "Low", "Moderate", "High", "Extra-ordinary", "Not reported", "Not Available")) %>%
      definePlotMargin()

  })
}

# Run the application
shinyApp(ui = ui, server = server)

