df <- read.csv("./data/data_v3.csv", stringsAsFactors = FALSE)

year_ui <- sort(unique(df$ISO_YEAR[nchar(df$ISO_YEAR) == 4])) #Incorrect Year in data

levels_ui <- c("Below", "Low", "Moderate", "High", "Extra-ordinary", "Not Reported") #inconsistent spellings in data

confidence_ui <- c("Low", "Medium", "High", "Not Reported") # insconsistent spellings in data

who_region_ui <- unique(df$WHOREGION[nchar(df$WHOREGION) == 3])

season_ui <- unique(df$FLU_SEASON)

## season calendar generator from data
create_season <- function(years){
  # north is on calendar years
  north_yrs_start <- paste0(years, "-","01")
  north_yrs_end <- paste0(years, "-", "52")
  north_yrs <- data.frame(season = "North", dates = paste0(north_yrs_start, " to ", north_yrs_end), stringsAsFactors = F)
  # south is on mixed years
  south_yrs_start <- paste0(as.numeric(years) - 1, "-", "39")
  south_yrs_end <- paste0(years, "-", "16")
  south_yrs <- data.frame(season = "South", dates = paste0(south_yrs_start, " to ", south_yrs_end), stringsAsFactors = F)
  # Both Seasons
  both_yrs <- data.frame(season = "Both", dates = paste0(south_yrs_start, " to ", north_yrs_end), stringsAsFactors = F)

  final_df <- rbind(north_yrs, south_yrs, both_yrs)
  return(final_df)
}

season_calendar_ui <- create_season(year_ui)
