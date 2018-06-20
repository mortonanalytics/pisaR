require(jsonlite)
require(httr)

## id the years based on current date
year_current <- as.numeric(format(Sys.Date(), "%Y"))
year_prev <- year_current - 1

## load credentials from environment
username <- "preview"
password <- "preview"

## call web service
call <- paste0("http://apps.who.int/gho/athena/flumart/MEASURE/IMPACT,IMPACT_CL,IMPACT_COM,TRANSMISSION,TRANSMISSION_CL,TRANSMISSION_COM,SERIOUSNESS,SERIOUSNESS_CL,SERIOUSNESS_COM?filter=YEAR:",
               year_current,
               "&format=json&profile=pisa")

get_data <- GET(call, authenticate(username, password, type = "basic"))

get_text <- content(get_data, "text")
get_text <- gsub("is \"moderate\"", "is moderate", get_text)
get_text <- gsub("is \"low\"", "is low", get_text)

get_json <- fromJSON(get_text)

df <- get_json

call <- paste0("http://apps.who.int/gho/athena/flumart/MEASURE/IMPACT,IMPACT_CL,IMPACT_COM,TRANSMISSION,TRANSMISSION_CL,TRANSMISSION_COM,SERIOUSNESS,SERIOUSNESS_CL,SERIOUSNESS_COM?filter=YEAR:",
               year_prev,
               "&format=json&profile=pisa")
get_data <- GET(call, authenticate(username, password, type = "basic"))

get_text <- content(get_data, "text")
get_text <- gsub("is \"moderate\"", "is moderate", get_text)
get_text <- gsub("is \"low\"", "is low", get_text)

get_json <- fromJSON(get_text)

df <- rbind(df, get_json)

#df <- read.csv("./data/data_v3.csv", stringsAsFactors = FALSE)

##after the data is read, make sure the following column names are available - rename if necessary
# df <- df %>%
#   select(
#     COUNTRY_CODE,
#     COUNTRY_TITLE,
#     ISO_YEAR,
#     ISO_YW,
#     ISOYW,
#     FLU_SEASON,
#     FLUREGION,
#     WHOREGION,
#     TRANSMISSION,
#     TRANSMISSION_CL,
#     TRANSMISSION_COM,
#     SERIOUSNESS,
#     SERIOUSNESS_CL,
#     SERIOUSNESS_COM,
#     IMPACT,
#     IMPACT_CL,
#     IMPACT_COM
#   )

# remove text from dates
df$ISOYW <- gsub("Week ", "", df$ISOYW)
df$ISO_YW <- gsub("Week ", "", df$ISO_YW)

## shorten US and UK names in data
df$COUNTRY_TITLE <- gsub("^((\\w+\\W+){1}\\w+).*$","\\1", df$COUNTRY_TITLE)

##impute iso2 code for United Kingdom
df$ISO2 <- ifelse(df$COUNTRY_TITLE == "United Kingdom", "GB", df$ISO2)

## impute Not Reported for all measures
df$TRANSMISSION <- gsub("NULL", "Not Available", df$TRANSMISSION)
df$TRANSMISSION_CL <- gsub("NULL", "Not Available", df$TRANSMISSION_CL)
df$TRANSMISSION_COM <- gsub("NULL", "Not Available", df$TRANSMISSION_COM)

df$SERIOUSNESS <- gsub("NULL", "Not Available", df$SERIOUSNESS)
df$SERIOUSNESS_CL <- gsub("NULL", "Not Available", df$SERIOUSNESS_CL)
df$SERIOUSNESS_COM <- gsub("NULL", "Not Available", df$SERIOUSNESS_COM)

df$IMPACT <- gsub("NULL", "Not Available", df$IMPACT)
df$IMPACT_CL <- gsub("NULL", "Not Available", df$IMPACT_CL)
df$IMPACT_COM <- gsub("NULL", "Not Available", df$IMPACT_COM)

## create UI data
year_ui <- sort(unique(df$ISO_YEAR[nchar(df$ISO_YEAR) == 4])) #Incorrect Year in data

levels_ui <- c("Below", "Low", "Moderate", "High", "Extra-ordinary", "Not Available") #inconsistent spellings in data

confidence_ui <- c("Low", "Medium", "High", "Not Available") # insconsistent spellings in data

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
