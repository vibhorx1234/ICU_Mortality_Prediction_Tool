# r_analysis/plumber.R

library(plumber)
library(ggplot2)
library(dplyr)
library(jsonlite)
library(base64enc)
library(scales)
library(survival)
library(survminer)
library(mice)
library(qgraph)
library(cluster)
library(corrplot)
source("./analysis.R")

# Enable CORS globally
cors <- function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  plumber::forward()
}

#* @filter cors
cors

#* @apiTitle ICU Mortality Prediction API
#* Health check endpoint
#* @get /status
function() {
  list(status = "R server is running", timestamp = Sys.time())
}

#* @param patient_data Patient data in JSON format
#* @post /predict
function(patient_data) {
  tryCatch({
    print("Received data for prediction")
    data <- tryCatch(fromJSON(patient_data, flatten = TRUE), error = function(e) stop("Invalid JSON format"))
   
    result <- predict_mortality(data)
   
    list(success = TRUE, prediction = result)
  }, error = function(e) {
    list(success = FALSE, error = e$message)
  })
}

#* Get data from the ICU CSV file
#* @get /data
function() {
  tryCatch({
    icu_data <- load_icu_data()
    
    # Convert to a list structure for JSON serialization
    response <- list(
      success = TRUE,
      data_summary = list(
        total_patients = nrow(icu_data),
        mortality_count = sum(icu_data$mortality),
        mortality_rate = mean(icu_data$mortality) * 100,
        age_range = c(min(icu_data$age, na.rm = TRUE), max(icu_data$age, na.rm = TRUE)),
        avg_sofa_score = mean(icu_data$sofa_score, na.rm = TRUE)
      ) 
    )
    
    return(response)
  }, error = function(e) {
    list(success = FALSE, error = e$message)
  })
}

# Hemodynamic Stability Plot
#* @get /chart/hemodynamic_stability
#* @serializer contentType list(type='image/png')
function() {
  p <- analyze_hemodynamic_stability()
  tmp <- tempfile(fileext = ".png")
  png(tmp, width = 1000, height = 600)
  print(p)
  dev.off()
  readBin(tmp, "raw", n = file.info(tmp)$size)
}

# Electrolyte Patterns Heatmap
#* @get /chart/electrolyte_patterns
#* @serializer contentType list(type='image/png')
function() {
  p <- analyze_electrolyte_patterns()
  tmp <- tempfile(fileext = ".png")
  png(tmp, width = 1200, height = 800)
  print(p)
  dev.off()
  readBin(tmp, "raw", n = file.info(tmp)$size)
}

# Inflammatory Clusters Plot
#* @get /chart/inflammatory_clusters
#* @serializer contentType list(type='image/png')
function() {
  p <- analyze_inflammatory_response()
  tmp <- tempfile(fileext = ".png")
  png(tmp, width = 1000, height = 800)
  print(p)
  dev.off()
  readBin(tmp, "raw", n = file.info(tmp)$size)
}

# Neurological Trajectory Plot
#* @get /chart/neurological_trajectory
#* @serializer contentType list(type='image/png')
function() {
  p <- analyze_neurological_trajectory()
  tmp <- tempfile(fileext = ".png")
  png(tmp, width = 1100, height = 700)
  print(p)
  dev.off()
  readBin(tmp, "raw", n = file.info(tmp)$size)
}

# Comorbidity Network Heatmap
#* @get /chart/comorbidity_network
#* @serializer contentType list(type='image/png')
function() {
  p <- analyze_comorbidity_interactions()
  tmp <- tempfile(fileext = ".png")
  png(tmp, width = 1000, height = 800)
  print(p)
  dev.off()
  readBin(tmp, "raw", n = file.info(tmp)$size)
}

# Survival Probability Plot (Existing)
#* @get /chart/survival_probability
#* @serializer contentType list(type='image/png')
function() {
  p <- generate_survival_probability_plot()
  tmp <- tempfile(fileext = ".png")
  png(tmp, width = 1200, height = 800)
  print(p)
  dev.off()
  readBin(tmp, "raw", n = file.info(tmp)$size)
}

#* Get data for JavaScript charts
#* @get /js-chart-data
function() {
  tryCatch({
    # Load and preprocess the data
    icu_data <- load_icu_data()
    
    # Create age groups
    icu_data$age_group <- cut(icu_data$age,
                            breaks = c(0, 30, 45, 60, 75, 90, 120),
                            labels = c("18-30", "31-45", "46-60", "61-75", "76-90", "91+"))
    
    # Create SOFA groups
    icu_data$sofa_score <- sapply(1:nrow(icu_data), function(i) {
      patient <- as.list(icu_data[i,])
      calculate_sofa_score(patient)
    })
    
    icu_data$sofa_group <- cut(icu_data$sofa_score,
                              breaks = c(-1, 0, 3, 6, 9, 24),
                              labels = c("0", "1-3", "4-6", "7-9", "10+"))
    
    # Create BUN groups
    icu_data$bun_group <- cut(icu_data$blood_urea_nitrogen,
                             breaks = c(0, 30, 60, Inf),
                             labels = c("Low", "Medium", "High"),
                             include.lowest = TRUE)
    
    # Calculate total GCS
    icu_data$gcs_total <- icu_data$gcs_eyes + icu_data$gcs_motor + icu_data$gcs_verbal
    
    # Group GCS scores for better visualization
    icu_data$gcs_group <- cut(icu_data$gcs_total, 
                            breaks = c(2, 5, 8, 10, 13, 16),
                            labels = c("3-5", "6-8", "9-10", "11-13", "14-15"),
                            include.lowest = TRUE)
    
    # Create datasets for various charts
    
    # 1. Age Distribution
    age_summary <- icu_data %>%
      group_by(age_group) %>%
      summarize(
        count = n(),
        mortality = sum(mortality),
        survival = count - mortality,
        mortality_rate = mortality / count * 100
      )
    
    # 2. SOFA Distribution
    sofa_summary <- icu_data %>%
      group_by(sofa_group) %>%
      summarize(
        count = n(),
        mortality = sum(mortality),
        survival = count - mortality,
        mortality_rate = mortality / count * 100
      )
    
    # 3. Comorbidity Impact
    comorbidity_cols <- c("aids", "cirrhosis", "diabetes", "hepatic_failure", "immunosuppression")
    comorbidity_data <- list()
    
    for (col in comorbidity_cols) {
      if (col %in% names(icu_data)) {
        patients_with <- sum(icu_data[[col]] == 1, na.rm = TRUE)
        mortality_with <- sum(icu_data[[col]] == 1 & icu_data$mortality == 1, na.rm = TRUE)
        mortality_rate <- if(patients_with > 0) mortality_with / patients_with * 100 else 0
        
        comorbidity_name <- gsub("_", " ", col)
        comorbidity_name <- paste0(toupper(substr(comorbidity_name, 1, 1)),
                                 substr(comorbidity_name, 2, nchar(comorbidity_name)))
        
        comorbidity_name <- gsub("_", " ", col) %>%
        tools::toTitleCase() %>% 
        gsub("Aids", "AIDS", .)
        
        comorbidity_data[[comorbidity_name]] <- list(
          patients = patients_with,
          mortality = mortality_with,
          rate = mortality_rate
        )
      }
    }
    
    # 4. GCS vs Mortality
    gcs_summary <- icu_data %>%
      group_by(gcs_group) %>%
      summarize(
        count = n(),
        mortality = sum(mortality),
        survival = count - mortality,
        mortality_rate = mortality / count * 100
      )
    
    # 5. Feature Importance
    # Calculate correlation of each feature with mortality
    numeric_cols <- sapply(icu_data, is.numeric)
    correlations <- cor(icu_data[, numeric_cols], icu_data$mortality, use = "pairwise.complete.obs")
    
    # Convert to absolute values for importance
    importance <- abs(correlations)
    
    # Remove mortality itself
    importance <- importance[rownames(importance) != "mortality", , drop = FALSE]
    
    # Create a data frame for plotting
    feature_importance <- data.frame(
      feature = sapply(rownames(importance), function(x) {
      # Convert underscores to spaces and capitalize first letters
      gsub("_", " ", x) %>% 
        tools::toTitleCase() %>% 
        gsub("Gcs", "GCS", .) %>%
        gsub("Hepatic", "Hep.", .) %>%
        gsub("Blood Urea Nitrogen", "BUN", .) %>%
        gsub("Wbcs", "WBCs", .)# Handle special acronyms
    }),
    importance = importance[,1],
    stringsAsFactors = FALSE
    )
    
    # Remove any NA values
    feature_importance <- feature_importance[!is.na(feature_importance$importance), ]
    
    # Sort by importance
    feature_importance <- feature_importance[order(-feature_importance$importance), ]
    
    # Take top 10 features
    feature_importance <- head(feature_importance, 10)

    # 6. Mortality Risk Distribution  
    icu_data <- icu_data %>%
    mutate(
    # Calculate composite risk score (0-100 scale)
      risk_score = (
      # SOFA Score component (0-24 scale -> 0-40 points)
        sofa_score * (40/24) +
      # Reverse GCS component (3-15 scale -> 0-30 points)
        (15 - gcs_total) * 2 +
      # Age component (0-100 years -> 0-20 points)
        age * 0.2 +
      # Comorbidity multiplier
        (hepatic_failure * 10) + (cirrhosis * 8) + (immunosuppression * 6)
      ) %>% pmin(100) %>% pmax(0),
    
      # Categorize into risk groups
      risk_category = case_when(
        risk_score < 25 ~ "Low",
        risk_score >= 25 & risk_score < 50 ~ "Medium",
        risk_score >= 50 ~ "High",
        TRUE ~ "Unknown"
      )
    )

    # Calculate risk distribution percentages
    risk_distribution <- icu_data %>%
    group_by(risk_category) %>%
    summarise(
      count = n(),
      mortality = sum(mortality),
      .groups = 'drop'
    ) %>%
    mutate(
      percentage = count / sum(count) * 100,
      mortality_rate = mortality / count * 100
    ) %>%
    filter(risk_category != "Unknown")

      # Update the return statement:
      return(list(  
      success = TRUE,
      age_distribution = lapply(1:nrow(age_summary), function(i) as.list(age_summary[i,])),
      sofa_distribution = lapply(1:nrow(sofa_summary), function(i) as.list(sofa_summary[i,])),
      comorbidity_impact = comorbidity_data,
      gcs_mortality = lapply(1:nrow(gcs_summary), function(i) as.list(gcs_summary[i,])),
      feature_importance = lapply(1:nrow(feature_importance), function(i) as.list(feature_importance[i,])),
      risk_distribution = lapply(1:nrow(risk_distribution), function(i) as.list(risk_distribution[i,]))
    ))
  },
  error = function(e) {
    list(success = FALSE, error = e$message)
  })
}