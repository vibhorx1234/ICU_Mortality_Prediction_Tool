# r_analysis/analysis.R

# Load required libraries
library(dplyr)
library(tidyr)
library(ggplot2)
library(survival)
library(survminer)
library(mice)
library(qgraph)
library(cluster)
library(corrplot)
library(tidyverse)

# Function to clean and preprocess the ICU data
preprocess_icu_data <- function(data) {
  # Convert column names to lowercase for consistency
  names(data) <- tolower(names(data))
  
  # Rename any columns that might have spaces
  names(data) <- gsub(" ", "_", names(data))
  
  # Handle missing values
  data <- data %>%
    mutate(
      # For numeric columns, replace NA with column median or appropriate default
      age = ifelse(is.na(age), median(age, na.rm = TRUE), age),
      bmi = ifelse(is.na(bmi), median(bmi, na.rm = TRUE), bmi),
      heart_rate = ifelse(is.na(heart_rate), median(heart_rate, na.rm = TRUE), heart_rate),
      respiratory_rate = ifelse(is.na(respiratory_rate), median(respiratory_rate, na.rm = TRUE), respiratory_rate),
      mean_arterial_pressure = ifelse(is.na(mean_arterial_pressure), median(mean_arterial_pressure, na.rm = TRUE), mean_arterial_pressure),
      temperature = ifelse(is.na(temperature), median(temperature, na.rm = TRUE), temperature),
      
      # GCS scores (replace NA with normal values)
      gcs_eyes = ifelse(is.na(gcs_eyes), 4, gcs_eyes),
      gcs_motor = ifelse(is.na(gcs_motor), 6, gcs_motor),
      gcs_verbal = ifelse(is.na(gcs_verbal), 5, gcs_verbal),
      
      # Lab values (replace NA with median)
      creatinine = ifelse(is.na(creatinine), median(creatinine, na.rm = TRUE), creatinine),
      blood_urea_nitrogen = ifelse(is.na(blood_urea_nitrogen), median(blood_urea_nitrogen, na.rm = TRUE), blood_urea_nitrogen),
      sodium = ifelse(is.na(sodium), median(sodium, na.rm = TRUE), sodium),
      albumin = ifelse(is.na(albumin), median(albumin, na.rm = TRUE), albumin),
      wbcs = ifelse(is.na(wbcs), median(wbcs, na.rm = TRUE), wbcs),
      hematocrit = ifelse(is.na(hematocrit), median(hematocrit, na.rm = TRUE), hematocrit),
      pao2 = ifelse(is.na(pao2), median(pao2, na.rm = TRUE), pao2),
      blood_ph = ifelse(is.na(blood_ph), median(blood_ph, na.rm = TRUE), blood_ph),
      
      # Comorbidities (replace NA with 0)
      aids = ifelse(is.na(aids), 0, aids),
      cirrhosis = ifelse(is.na(cirrhosis), 0, cirrhosis),
      diabetes = ifelse(is.na(diabetes), 0, diabetes),
      hepatic_failure = ifelse(is.na(hepatic_failure), 0, hepatic_failure),
      immunosuppression = ifelse(is.na(immunosuppression), 0, immunosuppression)
    )
  
  # Create total GCS column
  data$gcs_total <- data$gcs_eyes + data$gcs_motor + data$gcs_verbal
  
  # Create comorbidity count
  data$comorbidity_count <- data$aids + data$cirrhosis + data$diabetes + 
                             data$hepatic_failure + data$immunosuppression
  
  # Return the preprocessed data
  return(data)
}

# Calculate SOFA (Sequential Organ Failure Assessment) score
calculate_sofa_score <- function(patient) {
  # Respiratory component (based on PaO2)
  respiratory_score <- 0
  if (!is.na(patient$pao2)) {
    if (patient$pao2 < 100) respiratory_score <- 3
    else if (patient$pao2 < 200) respiratory_score <- 2
    else if (patient$pao2 < 300) respiratory_score <- 1
  } else {
    # Use respiratory rate as a proxy if PaO2 is missing
    if (patient$respiratory_rate > 30) respiratory_score <- 3
    else if (patient$respiratory_rate > 22) respiratory_score <- 2
    else if (patient$respiratory_rate > 18) respiratory_score <- 1
  }
  
  # Cardiovascular component (based on MAP)
  cardiovascular_score <- 0
  if (patient$mean_arterial_pressure < 60) cardiovascular_score <- 3
  else if (patient$mean_arterial_pressure < 70) cardiovascular_score <- 1
  
  # Neurological component (based on GCS)
  neurological_score <- 0
  gcs_total <- patient$gcs_eyes + patient$gcs_motor + patient$gcs_verbal
  if (gcs_total < 6) neurological_score <- 4
  else if (gcs_total < 10) neurological_score <- 3
  else if (gcs_total < 13) neurological_score <- 2
  else if (gcs_total < 15) neurological_score <- 1
  
  # Renal component (based on creatinine)
  renal_score <- 0
  if (patient$creatinine > 5.0) renal_score <- 4
  else if (patient$creatinine > 3.5) renal_score <- 3
  else if (patient$creatinine > 2.0) renal_score <- 2
  else if (patient$creatinine > 1.2) renal_score <- 1
  
  # Calculate total SOFA score
  total_sofa_score <- respiratory_score + cardiovascular_score + neurological_score + renal_score
  
  return(total_sofa_score)
}

# Predict mortality based on patient data
predict_mortality <- function(patient_data) {
  # Convert patient data to a more usable format if needed
  patient <- as.list(patient_data)
  
  # Calculate SOFA score
  sofa_score <- calculate_sofa_score(patient)
  
  # Base mortality risk on SOFA score
  risk_score <- sofa_score * 5
  
  # Age factor
  if (patient$age > 80) risk_score <- risk_score + 15
  else if (patient$age > 65) risk_score <- risk_score + 10
  else if (patient$age > 50) risk_score <- risk_score + 5
  
  # Comorbidity adjustment
  risk_score <- risk_score + (patient$aids * 10)
  risk_score <- risk_score + (patient$cirrhosis * 8)
  risk_score <- risk_score + (patient$diabetes * 5)
  risk_score <- risk_score + (patient$hepatic_failure * 12)
  risk_score <- risk_score + (patient$immunosuppression * 10)
  
  # Additional factors
  if (patient$heart_rate > 120 || patient$heart_rate < 50) risk_score <- risk_score + 5
  if (patient$respiratory_rate > 30 || patient$respiratory_rate < 8) risk_score <- risk_score + 5
  if (patient$creatinine > 3.0) risk_score <- risk_score + 8
  
  # Cap risk score
  risk_score <- min(95, risk_score)
  
  return(risk_score)
}

# Analyze data patterns
analyze_patterns <- function(patient_data) {
  # More detailed analysis could be performed here
  return(patient_data)
}

# Function to load the ICU dataset with error handling
load_icu_data <- function() {
  # Try different possible locations for the CSV file
  possible_paths <- c(
    "../data/icu_data.csv",
    "./data/icu_data.csv",
    "icu_data.csv",
    "../icu_data.csv"
  )
  
  for (path in possible_paths) {
    if (file.exists(path)) {
      data <- read.csv(path, stringsAsFactors = FALSE)
      
      # Preprocess the data
      data <- preprocess_icu_data(data)
      
      # Return the data
      return(data)
    }
  }
  
  # If we reach here, we couldn't find the file
  stop("Could not find the ICU data CSV file")
}

# Universal theme configuration for all plots
apply_common_theme <- function(plot_obj) {
  plot_obj +
    theme(
      plot.title = element_text(size = 18, face = "bold", hjust = 0),
      axis.title.x = element_text(size = 16, face = "bold"),
      axis.title.y = element_text(size = 16, face = "bold"),
      axis.text.x = element_text(size = 14),
      axis.text.y = element_text(size = 14),
      legend.title = element_text(size = 14, face = "bold"),
      legend.text = element_text(size = 12, face = "bold"),
      panel.grid.major = element_line(color = "#f0f0f0"),
      panel.grid.minor = element_blank(),
      plot.margin = unit(c(1,1,1,1), "cm")
    )
}

# Function to generate Hemodynamic Instability Index
analyze_hemodynamic_stability <- function() {
  icu_data <- load_icu_data()
  
  # Create composite score
  icu_data <- icu_data %>%
    filter(complete.cases(heart_rate, mean_arterial_pressure, respiratory_rate)) %>%
    mutate(
      hr_stable = as.numeric(heart_rate >= 60 & heart_rate <= 100),
      map_stable = as.numeric(mean_arterial_pressure >= 65),
      rr_stable = as.numeric(respiratory_rate >= 12 & respiratory_rate <= 20),
      hemodynamic_score = hr_stable + map_stable + rr_stable
    )
  
  # Plot
  p <- ggplot(icu_data, aes(x = factor(hemodynamic_score), fill = factor(mortality))) +
    geom_bar(position = "fill") +
    scale_fill_manual(values = c("steelblue", "firebrick"),
                      labels = c("Survived", "Died")) +
    labs(title = "Mortality by Hemodynamic Stability",
         x = "Number of Stable Parameters",
         y = "Proportion") +
    theme_minimal()
  
  return(apply_common_theme(p))
}

# Function to generate Electrolyte Derangement Heatmap
analyze_electrolyte_patterns <- function() {
  icu_data <- load_icu_data()
  
  # Create abnormality flags
  icu_data <- icu_data %>%
    mutate(
      sodium_abn = as.numeric(sodium < 135 | sodium > 145),
      creatinine_abn = as.numeric(creatinine > 1.2),
      bun_abn = as.numeric(blood_urea_nitrogen > 20)
    ) %>%
    pivot_longer(cols = ends_with("_abn"), names_to = "electrolyte", values_to = "abnormal")
  
  # Plot
  p <- ggplot(icu_data, aes(x = electrolyte, fill = factor(abnormal))) +
    geom_bar(position = "dodge") +
    facet_wrap(~mortality, labeller = labeller(mortality = c("0" = "Survived", "1" = "Died"))) +
    scale_fill_manual(values = c("gray80", "firebrick")) +
    labs(title = "Electrolyte Abnormalities by Mortality Status",
         x = "Electrolyte Parameter",
         y = "Count") +
    theme(axis.text.x = element_text(angle = 45, hjust = 1))
  
  return(apply_common_theme(p))
}

# Function to generate Inflammatory Response Clustering
analyze_inflammatory_response <- function() {
  tryCatch({
    suppressPackageStartupMessages({
      require(tidyverse)
      require(mice)
      require(cluster)
    })
    
    icu_data <- load_icu_data()
    
    # Validate and prepare data
    inflammatory_vars <- c("wbcs", "albumin", "temperature")
    
    if(!all(inflammatory_vars %in% names(icu_data))) {
      stop("Missing required inflammatory variables")
    }
    
    # Filter and impute with constraints
    imp_data <- icu_data %>%
      select(all_of(inflammatory_vars)) %>%
      mutate(
        wbcs = pmax(pmin(wbcs, 50, na.rm = TRUE), 1),
        albumin = pmax(pmin(albumin, 5, na.rm = TRUE), 1.5),
        temperature = pmax(pmin(temperature, 42, na.rm = TRUE), 32)
      )
    
    # Multiple imputation
    imp <- mice(imp_data, m = 1, maxit = 5, printFlag = FALSE)
    complete_data <- complete(imp) %>% scale()
    
    # Cluster validation
    if(nrow(na.omit(complete_data)) < 3) stop("Insufficient data for clustering")
    
    set.seed(123)
    clusters <- kmeans(complete_data, centers = 3, nstart = 25)
    
    # Create ggplot object
    p <- ggplot(
      data = as.data.frame(complete_data) %>%
        mutate(Cluster = factor(clusters$cluster)),
      aes(x = wbcs, y = albumin, color = Cluster)
    ) +
      geom_point(alpha = 0.7, size = 2.5) +
      scale_color_brewer(palette = "Set1", name = "Cluster") +
      labs(
        title = "Inflammatory Response Clustering",
        x = "White Blood Cells (z-score)",
        y = "Albumin Level (z-score)"
      ) +
      theme_minimal(base_size = 14) +
      theme(
        legend.position = "right",
        panel.grid.major = element_line(color = "grey90")
      )
    
    return(apply_common_theme(p))
    
  }, error = function(e) {
    message("ERROR in inflammatory analysis: ", e$message)
    return(ggplot() + 
             annotate("text", x = 1, y = 1, size = 6,
                      label = "Cluster Analysis Unavailable") +
             theme_void())
  })
}

# Function to generate Neurological Status Trajectory
analyze_neurological_trajectory <- function() {
  icu_data <- load_icu_data()
  
  # Process GCS data
  icu_data <- icu_data %>%
    mutate(gcs_total = gcs_eyes + gcs_motor + gcs_verbal) %>%
    filter(!is.na(gcs_total)) %>%
    mutate(gcs_category = cut(gcs_total, breaks = c(3, 8, 13, 15),
                      labels = c("Severe", "Moderate", "Mild")))
  
  # Plot
  p <- ggplot(icu_data, aes(x = age, y = gcs_total, color = factor(mortality))) +
    geom_jitter(alpha = 0.5) +
    geom_smooth(method = "loess", se = FALSE) +
    scale_color_manual(values = c("blue", "red"), 
                       labels = c("Survived", "Died")) +
    labs(title = "GCS Trajectory by Age and Mortality",
         x = "Age",
         y = "Total GCS Score") +
    theme_minimal()
  
  return(apply_common_theme(p))
}

# Function to generate Comorbidity Network Analysis
analyze_comorbidity_interactions <- function() {
  tryCatch({
    suppressPackageStartupMessages({
      require(tidyverse)
      require(corrplot)
    })
    
    icu_data <- load_icu_data()
    
    comorbidities <- c("aids", "cirrhosis", "diabetes", "hepatic_failure")
    
    # Data validation and conversion
    comorb_data <- icu_data %>%
      select(all_of(comorbidities)) %>%
      mutate(across(everything(), ~ as.numeric(as.character(.x)))) %>%
      mutate(across(everything(), ~ ifelse(is.na(.x), 0, .x)))
    
    # Calculate phi correlations
    cor_matrix <- cor(comorb_data, method = "pearson")
    
    # Create ggplot heatmap
    p <- cor_matrix %>%
      as.data.frame() %>%
      rownames_to_column("Var1") %>%
      pivot_longer(-Var1, names_to = "Var2") %>%
      ggplot(aes(Var1, Var2, fill = value)) +
      geom_tile(color = "white") +
      geom_text(aes(label = round(value, 2)), color = "black", size = 4) +
      scale_fill_gradient2(
        low = "blue", mid = "white", high = "red",
        midpoint = 0, limits = c(-1, 1)
      ) +
      labs(
        title = "Comorbidity Co-occurrence Patterns",
        x = "", y = "",
        fill = "Correlation"
      ) +
      theme_minimal(base_size = 14) +
      theme(
        axis.text.x = element_text(angle = 45, hjust = 1),
        panel.grid = element_blank()
      )
    
    return(apply_common_theme(p))
    
  }, error = function(e) {
    message("ERROR in comorbidity analysis: ", e$message)
    return(ggplot() + 
             annotate("text", x = 1, y = 1, size = 6,
                      label = "Network Analysis Unavailable") +
             theme_void())
  })
}

# Function to generate Survival Probability analysis
generate_survival_probability_plot <- function() {
  # Load the data
  icu_data <- load_icu_data()
  
  # Calculate SOFA scores if not already present
  if (!"sofa_score" %in% names(icu_data)) {
    icu_data$sofa_score <- sapply(1:nrow(icu_data), function(i) {
      patient <- as.list(icu_data[i, ])
      calculate_sofa_score(patient)
    })
  }
  
  # Remove NA sofa scores
  icu_data <- icu_data[!is.na(icu_data$sofa_score), ]
  
  # Create synthetic los_icu if missing
  if (!"los_icu" %in% names(icu_data)) {
    icu_data$los_icu <- pmax(1, 1 + rnorm(nrow(icu_data), 
                                mean = icu_data$sofa_score, 
                                sd = 2))
  }
  
  # Convert and clean los_icu
  icu_data$los_icu <- as.numeric(icu_data$los_icu)
  icu_data <- icu_data[!is.na(icu_data$los_icu), ]
  
  # Validate mortality data
  if (any(is.na(icu_data$mortality))) {
    stop("NA values present in mortality data")
  }
  
  # Survival analysis
  surv_data <- Surv(time = icu_data$los_icu, event = icu_data$mortality)
  fit <- survfit(surv_data ~ I(sofa_score > 6), data = icu_data)
  
  # Create proper strata labels
  strata_lengths <- fit$strata
  strata_names <- rep(names(strata_lengths), times = strata_lengths)
  
  # Create plotting data frame
  plot_data <- data.frame(
    time = fit$time,
    surv = fit$surv,
    strata = factor(strata_names)
  )
  
  # Clean up stratum names for display
  plot_data$strata <- gsub("I\\(sofa_score > 6\\)=", "", plot_data$strata)
  plot_data$strata <- ifelse(plot_data$strata == "FALSE", 
                            "Low Risk (SOFA ≤ 6)", 
                            "High Risk (SOFA > 6)")

  # Create the survival plot
  p <- ggplot(plot_data, aes(x = time, y = surv, color = strata)) +
    geom_step(size = 1.2) +
    labs(
      title = "Survival Probability Analysis",
      x = "Days in ICU",
      y = "Survival Probability",
      color = "Risk Group"
    ) +
    scale_color_manual(values = c("forestgreen", "firebrick")) +
    scale_y_continuous(labels = scales::percent_format(accuracy = 1)) +
    theme_minimal() +
    theme(
      axis.text.x = element_text(angle = 45, hjust = 1),
      panel.grid = element_blank(),
    )
  
  return(apply_common_theme(p))
}