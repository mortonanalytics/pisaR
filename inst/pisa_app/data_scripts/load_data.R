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
##clean data
data_plot$Transmission <- gsub("No impact", "No Impact", data_plot$Transmission)
data_plot$Transmission <- gsub("Below seasonal threshold", "Below", data_plot$Transmission)
data_plot$Transmission <- gsub("below", "Below", data_plot$Transmission)
data_plot$Transmission <- gsub("Extraordinary", "Extra-ordinary", data_plot$Transmission)

data_plot$Seriousness <- gsub("No impact", "No Impact", data_plot$Seriousness)
data_plot$Seriousness <- gsub("Below seasonal threshold", "Below", data_plot$Seriousness)
data_plot$Seriousness <- gsub("below", "Below", data_plot$Seriousness)
data_plot$Seriousness <- gsub("Extraordinary", "Extra-ordinary", data_plot$Seriousness)

data_plot$Impact <- gsub("No impact", "No Impact", data_plot$Impact)
data_plot$Impact <- gsub("Below seasonal threshold", "Below", data_plot$Impact)
data_plot$Impact <- gsub("below", "Below", data_plot$Impact)
data_plot$Impact <- gsub("Extraordinary", "Extra-ordinary", data_plot$Impact)
data_plot$Impact <- gsub("Extra-ordiry", "Extra-ordinary", data_plot$Impact)
data_plot$Impact <- ifelse(data_plot$Impact == "", "Not reported", data_plot$Impact)

year_ui <- sort(unique(data_plot$Year.Code))

transmission_ui <- unique(data_plot$Transmission)

