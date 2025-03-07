# r_analysis/app.R

# Load required libraries with error handling
tryCatch({
  library(plumber)
}, error = function(e) {
  cat("ERROR: Failed to load the plumber library. Please install it with install.packages('plumber')\n")
  quit(status = 1)
})

# Print startup message
cat("Starting Plumber API on port 8000...\n")

# Define error handler
options(error = function() {
  cat("ERROR:", geterrmessage(), "\n")
  quit(status = 1)
})

# Load the plumber API definition
tryCatch({
  api_file <- "plumber.R"
  if (!file.exists(api_file)) {
    stop(paste("API definition file not found:", api_file))
  }
  
  pr <- plumb(api_file)
  
  # Start the server
  pr$run(port=8000, host="0.0.0.0")
}, error = function(e) {
  cat("ERROR starting Plumber API:", e$message, "\n")
  quit(status = 1)
})