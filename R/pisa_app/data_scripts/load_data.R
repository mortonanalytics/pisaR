df <- read.csv("./data/data.csv", stringsAsFactors = FALSE)

data_plot <- df %>%
  select(ISO,
         Code,
         SOV_CODE,
         Title,
         Sovereign,
         Impact,
         Transmission,
         Seriousness,
         Week.Code,
         Year.Code,
         Year_Week_number)

year_ui <- sort(unique(df$Year.Code))

transmission_ui <- unique(df$Transmission)
