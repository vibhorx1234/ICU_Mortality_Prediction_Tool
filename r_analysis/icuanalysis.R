# r_analysis/icuanalysis.R

# Capture and handle errors
options(error = function() {
  cat("ERROR:", geterrmessage(), "\n")
  quit(status = 1)
})

# Get command line arguments
args <- commandArgs(trailingOnly = TRUE)
if (length(args) < 1) {
  cat("ERROR: No input data provided.\n")
  quit(status = 1)
}

# Try to convert arguments to numeric values
patient_data <- tryCatch({
  as.numeric(args)
}, error = function(e) {
  cat("ERROR: Failed to convert input to numeric values:", e$message, "\n")
  quit(status = 1)
})

# Check if any patient_data is NA after conversion
if (any(is.na(patient_data))) {
  cat("ERROR: Invalid numeric values in input\n")
  quit(status = 1)
}

# Define feature names based on expected order
feature_names <- c(
  "age", "bmi", "heart_rate", "respiratory_rate", "mean_arterial_pressure",
  "temperature", "gcs_eyes", "gcs_motor", "gcs_verbal", "creatinine",
  "blood_urea_nitrogen", "sodium", "albumin", "wbcs", "hematocrit",
  "pao2", "blood_ph", "aids", "cirrhosis", "diabetes", 
  "hepatic_failure", "immunosuppression"
)

# Create named vector if we have the right number of values
if (length(patient_data) == length(feature_names)) {
  names(patient_data) <- feature_names
}

# Example analysis functions
calculate_sofa_score <- function(data) {
  # Respiratory component
  respiratory <- ifelse(data["pao2"] < 100, 3,
                 ifelse(data["pao2"] < 200, 2, 
                 ifelse(data["pao2"] < 300, 1, 0)))
  
  # Cardiovascular component
  cardiovascular <- ifelse(data["mean_arterial_pressure"] < 70, 1, 0)
  
  # Neurological component (GCS)
  gcs_total <- sum(data["gcs_eyes"], data["gcs_motor"], data["gcs_verbal"])
  neurological <- ifelse(gcs_total < 13, 1, 
                  ifelse(gcs_total < 10, 2,
                  ifelse(gcs_total < 6, 3, 0)))
  
  # Renal component
  renal <- ifelse(data["creatinine"] > 1.2, 1,
           ifelse(data["creatinine"] > 2.0, 2,
           ifelse(data["creatinine"] > 3.5, 3, 0)))
  
  # Total SOFA score (simplified)
  total <- respiratory + cardiovascular + neurological + renal
  return(total)
}

calculate_risk_score <- function(data, sofa_score) {
  # Base risk from SOFA
  base_risk <- sofa_score * 5
  
  # Age adjustment
  age_factor <- data["age"] / 10
  
  # Comorbidity adjustment
  comorbidity_score <- sum(
    data["aids"] * 5,
    data["cirrhosis"] * 4,
    data["diabetes"] * 2,
    data["hepatic_failure"] * 4,
    data["immunosuppression"] * 3
  )
  
  # Calculate final risk (cap at 95%)
  risk <- min(95, base_risk + age_factor + comorbidity_score)
  return(risk)
}

# Calculate scores
tryCatch({
  # Calculate SOFA score
  sofa_score <- calculate_sofa_score(patient_data)
  
  # Calculate risk score
  risk_score <- calculate_risk_score(patient_data, sofa_score)
  
  # Calculate stability index
  stability_index <- 100 - (
    abs(patient_data["heart_rate"] - 75) / 75 * 20 +
    abs(patient_data["respiratory_rate"] - 16) / 16 * 20 +
    abs(patient_data["temperature"] - 37) / 3 * 20
  )
  stability_index <- max(0, min(100, stability_index))
  
  # Determine risk level
  risk_level <- ifelse(risk_score > 50, "High",
               ifelse(risk_score > 25, "Moderate", "Low"))
  
  # Print results in key:value format for easy parsing
  cat("SOFA Score:", sofa_score, "\n")
  cat("Risk Score:", round(risk_score, 1), "\n")
  cat("Stability Index:", round(stability_index, 1), "\n")
  cat("Risk Level:", risk_level, "\n")
  
  # Print organ system assessments
  cat("Respiratory Status:", ifelse(patient_data["respiratory_rate"] > 25, "Compromised", "Normal"), "\n")
  cat("Cardiovascular Status:", ifelse(patient_data["mean_arterial_pressure"] < 65, "Compromised", "Normal"), "\n")
  cat("Renal Status:", ifelse(patient_data["creatinine"] > 1.5, "Compromised", "Normal"), "\n")
  cat("Neurological Status:", ifelse(sum(patient_data["gcs_eyes"], patient_data["gcs_motor"], patient_data["gcs_verbal"]) < 13, "Compromised", "Normal"), "\n")
  
  # Print expected outcome
  mortality_risk <- min(95, risk_score + (100 - stability_index) / 10)
  cat("Mortality Risk Percentage:", round(mortality_risk, 1), "\n")
  
}, error = function(e) {
  cat("ERROR: Analysis calculation failed:", e$message, "\n")
  quit(status = 1)
})