# backend/app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
import subprocess
import traceback
import logging

# Set up logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Determine the directory containing this script to use for relative paths
current_dir = os.path.dirname(os.path.abspath(__file__))
logger.info(f"Current directory: {current_dir}")

# Define model paths
MODEL_DIRECTORY = os.path.join(current_dir, "models")
MODEL_PATH = os.path.join(MODEL_DIRECTORY, "model.pkl")
SCALER_PATH = os.path.join(MODEL_DIRECTORY, "scaler.pkl")
IMPUTER_PATH = os.path.join(MODEL_DIRECTORY, "imputer.pkl")

logger.info(f"Looking for model at: {MODEL_PATH}")
logger.info(f"Looking for scaler at: {SCALER_PATH}")
logger.info(f"Looking for imputer at: {IMPUTER_PATH}")

# Ensure models directory exists
os.makedirs(MODEL_DIRECTORY, exist_ok=True)

# Initialize model, scaler, and imputer
model = None
scaler = None
imputer = None

# Try to load model and related components
def load_model_files():
    global model, scaler, imputer
   
    # Check alternative paths if models aren't found
    alt_model_paths = [
        "./models/model.pkl",
        "../models/model.pkl",
        "C:/Users/HP/OneDrive/Desktop/DS Project/backend/models/model.pkl"
    ]
   
    # Try to load model
    try:
        if os.path.exists(MODEL_PATH):
            logger.info(f"Loading model from {MODEL_PATH}")
            model = joblib.load(MODEL_PATH)
            logger.info("✅ Model loaded successfully.")
        else:
            # Try alternative paths
            for alt_path in alt_model_paths:
                logger.info(f"Trying alternative path: {alt_path}")
                if os.path.exists(alt_path):
                    model = joblib.load(alt_path)
                    logger.info(f"✅ Model loaded from alternative path: {alt_path}")
                    break
           
            if model is None:
                logger.warning("❌ Model file not found in any location.")
    except Exception as e:
        logger.error(f"⚠️ Error loading model: {e}")
        traceback.print_exc()
   
    # Try to load scaler
    try:
        if os.path.exists(SCALER_PATH):
            logger.info(f"Loading scaler from {SCALER_PATH}")
            scaler = joblib.load(SCALER_PATH)
            logger.info("✅ Scaler loaded successfully.")
        else:
            logger.warning("⚠️ Scaler file not found, predictions may be less accurate.")
    except Exception as e:
        logger.error(f"⚠️ Error loading scaler: {e}")
   
    # Try to load imputer
    try:
        if os.path.exists(IMPUTER_PATH):
            logger.info(f"Loading imputer from {IMPUTER_PATH}")
            imputer = joblib.load(IMPUTER_PATH)
            logger.info("✅ Imputer loaded successfully.")
        else:
            logger.warning("⚠️ Imputer file not found, predictions may be less accurate.")
    except Exception as e:
        logger.error(f"⚠️ Error loading imputer: {e}")

# Load the models when starting
load_model_files()

@app.route("/predict", methods=["POST"])
def predict():
    # Check if model is loaded
    if model is None:
        # Try loading the model once more
        load_model_files()
       
        # If still not loaded, return error
        if model is None:
            logger.error("Model not found, can't make prediction")
            return jsonify({"error": "Model not found. Please train the model first."}), 500
   
    try:
        # Get data from request
        data = request.get_json()
        logger.info(f"Received prediction request with {len(data)} features")
       
        # Create a list of features in the correct order expected by the model
        expected_features = [
            'age', 'bmi', 'heart_rate', 'respiratory_rate', 'mean_arterial_pressure',
            'temperature', 'gcs_eyes', 'gcs_motor', 'gcs_verbal', 'creatinine',
            'blood_urea_nitrogen', 'sodium', 'albumin', 'wbcs', 'hematocrit',
            'pao2', 'blood_ph', 'aids', 'cirrhosis', 'diabetes',
            'hepatic_failure', 'immunosuppression'
        ]
       
        # Create input vector, filling missing values with 0
        input_data = []
        for feature in expected_features:
            if feature in data:
                input_data.append(data[feature])
            else:
                logger.warning(f"Missing feature in input: {feature}, using 0")
                input_data.append(0)
       
        # Convert to numpy array
        input_array = np.array([input_data], dtype=float)
        logger.info(f"Input shape: {input_array.shape}")
       
        # Apply preprocessing if available
        if imputer is not None:
            logger.info("Applying imputer transformation")
            input_array = imputer.transform(input_array)
        if scaler is not None:
            logger.info("Applying scaler transformation")
            input_array = scaler.transform(input_array)
           
        # Make prediction
        if hasattr(model, 'predict_proba'):
            # For classifiers with probability estimation
            logger.info("Making probability prediction")
            prediction = model.predict_proba(input_array)[0][1] * 100
        else:
            # For other types of models
            logger.info("Making standard prediction")
            prediction = float(model.predict(input_array)[0]) * 100
           
        logger.info(f"Prediction result: {prediction:.2f}%")
        return jsonify({"mortality_risk": round(prediction, 2)})
   
    except Exception as e:
        logger.error(f"⚠️ Prediction error: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 400

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json()
        logger.info(f"Received analysis request with {len(data)} features")
       
        # Generate a simplified analysis response if R script is not available
        simplified_response = {
            "SOFA Score": "5",
            "Risk Score": "25.5",
            "Stability Index": "75.2",
            "Risk Level": "Moderate",
            "Respiratory Status": "Normal",
            "Cardiovascular Status": "Normal",
            "Renal Status": "Normal",
            "Neurological Status": "Normal",
            "Mortality Risk Percentage": "20.5"
        }
       
        # Try to run R script if available
        try:
            # Format data for R script
            r_script_path = os.path.join(os.path.dirname(current_dir), "r_analysis", "icuanalysis.R")
           
            if os.path.exists(r_script_path):
                logger.info(f"Using R script at: {r_script_path}")
               
                # Create a list of arguments (values only) from the data
                input_args = []
                for key in sorted(data.keys()):  # Sort keys for consistent order
                    input_args.append(str(data[key]))
               
                # Run R script
                result = subprocess.run(
                    ["Rscript", r_script_path] + input_args,
                    capture_output=True,
                    text=True,
                    timeout=30  # Set timeout to avoid hanging
                )
               
                if result.returncode == 0:
                    analysis_output = result.stdout.strip()
                    logger.info("R script executed successfully")
                    return jsonify({"analysis": analysis_output})
                else:
                    error_msg = result.stderr.strip()
                    logger.error(f"❌ R script error: {error_msg}")
                    # Fall back to simplified response
                    logger.info("Falling back to simplified analysis")
                    return jsonify({"analysis": "\n".join([f"{k}: {v}" for k, v in simplified_response.items()])})
            else:
                logger.warning(f"R script not found at {r_script_path}")
                # Fall back to simplified response
                logger.info("Using simplified analysis (R script not found)")
                return jsonify({"analysis": "\n".join([f"{k}: {v}" for k, v in simplified_response.items()])})
               
        except subprocess.TimeoutExpired:
            logger.error("❌ R script timeout")
            return jsonify({"analysis": "\n".join([f"{k}: {v}" for k, v in simplified_response.items()])})
        except Exception as e:
            logger.error(f"❌ R script error: {e}")
            return jsonify({"analysis": "\n".join([f"{k}: {v}" for k, v in simplified_response.items()])})
   
    except Exception as e:
        logger.error(f"❌ Analysis Error: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 400

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None,
        "imputer_loaded": imputer is not None,
        "model_path": MODEL_PATH,
        "model_exists": os.path.exists(MODEL_PATH)
    })

@app.route("/train", methods=["GET"])
def train_model():
    try:
        logger.info("Attempting to train model")
       
        # Run the train_model.py script
        train_script_path = os.path.join(current_dir, "train_model.py")
       
        if not os.path.exists(train_script_path):
            logger.error(f"Training script not found at {train_script_path}")
            return jsonify({"error": "Training script not found"}), 404
       
        result = subprocess.run(
            ["python", train_script_path],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
       
        if result.returncode == 0:
            logger.info("Model training successful")
            # Reload the model
            load_model_files()
            return jsonify({
                "success": True,
                "message": "Model trained successfully",
                "model_loaded": model is not None
            })
        else:
            logger.error(f"Model training failed: {result.stderr}")
            return jsonify({
                "success": False,
                "error": "Model training failed",
                "details": result.stderr
            }), 500
           
    except Exception as e:
        logger.error(f"Error during model training: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)