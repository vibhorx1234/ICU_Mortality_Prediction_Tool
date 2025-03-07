# backend/train_model.py
import os
import sys
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import pickle
import traceback

# Define functions directly in this file (no external imports needed)
def ensure_dir(file_path):
    """Ensure directory exists for a given file path"""
    directory = os.path.dirname(file_path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory)
        print(f"Created directory: {directory}")

def load_data(data_path):
    """Load ICU data from CSV file and clean missing values"""
    try:
        print(f"Attempting to load data from: {data_path}")
        # Read data
        df = pd.read_csv(data_path)
        print(f"Successfully loaded data with {df.shape[0]} rows and {df.shape[1]} columns")
       
        # Check and print missing values
        print("Missing values before cleaning:")
        missing_counts = df.isnull().sum()
        print(missing_counts[missing_counts > 0])
       
        # Check if mortality column exists
        if "mortality" not in df.columns:
            print("ERROR: 'mortality' column not found in the dataset. Available columns:")
            print(df.columns.tolist())
            return None, None
       
        # Drop rows with missing values in the target column
        df.dropna(subset=["mortality"], inplace=True)
       
        # Separate features and target
        X = df.drop(columns=["mortality"])
        y = df["mortality"]
       
        # Check and print missing values in features
        print("\nMissing values in features:")
        missing_in_features = X.isnull().sum()
        print(missing_in_features[missing_in_features > 0])
       
        return X, y
    except Exception as e:
        print(f"ERROR loading data: {str(e)}")
        traceback.print_exc()
        return None, None

def preprocess_data(X, y, test_size=0.2, random_state=42):
    """Preprocess data by handling missing values, splitting, and scaling"""
    print("Preprocessing data...")
   
    # Impute missing values with median
    print("Imputing missing values...")
    imputer = SimpleImputer(strategy='median')
    X_imputed = imputer.fit_transform(X)
   
    # Split data
    print(f"Splitting data with test_size={test_size}, random_state={random_state}")
    X_train, X_test, y_train, y_test = train_test_split(X_imputed, y, test_size=test_size, random_state=random_state)
    print(f"Training set: {X_train.shape[0]} samples, Test set: {X_test.shape[0]} samples")
   
    # Scale features
    print("Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
   
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler, imputer

def train_model(X_train, y_train, n_estimators=100, random_state=42):
    """Train RandomForest classifier"""
    print(f"Training RandomForest model with {n_estimators} trees...")
    model = RandomForestClassifier(n_estimators=n_estimators, random_state=random_state)
    model.fit(X_train, y_train)
    print("Model training complete!")
    return model

def evaluate_model(model, X_test, y_test):
    """Evaluate model performance"""
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
   
    return {
        "accuracy": accuracy,
        "classification_report": report
    }

def save_model(model, model_path, scaler=None, scaler_path=None, imputer=None, imputer_path=None):
    """Save trained model, scaler, and imputer"""
    try:
        # Ensure directories exist
        ensure_dir(model_path)
       
        # Save model
        print(f"Saving model to {model_path}...")
        with open(model_path, "wb") as model_file:
            pickle.dump(model, model_file)
            print("Model saved successfully!")
       
        # Save scaler if provided
        if scaler and scaler_path:
            ensure_dir(scaler_path)
            print(f"Saving scaler to {scaler_path}...")
            with open(scaler_path, "wb") as scaler_file:
                pickle.dump(scaler, scaler_file)
                print("Scaler saved successfully!")
       
        # Save imputer if provided
        if imputer and imputer_path:
            ensure_dir(imputer_path)
            print(f"Saving imputer to {imputer_path}...")
            with open(imputer_path, "wb") as imputer_file:
                pickle.dump(imputer, imputer_file)
                print("Imputer saved successfully!")
               
        return True
    except Exception as e:
        print(f"ERROR saving model artifacts: {str(e)}")
        traceback.print_exc()
        return False

def main():
    print("=" * 50)
    print("ICU MORTALITY PREDICTION MODEL TRAINING")
    print("=" * 50)
   
    # Print working directory for debugging
    print(f"Current working directory: {os.getcwd()}")
   
    # Create models directory with absolute path
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    print(f"Creating models directory at: {models_dir}")
    os.makedirs(models_dir, exist_ok=True)
   
    # Define paths with absolute paths to avoid location issues
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "icu_data.csv")
    model_path = os.path.join(models_dir, "model.pkl")
    scaler_path = os.path.join(models_dir, "scaler.pkl")
    imputer_path = os.path.join(models_dir, "imputer.pkl")
   
    print(f"Looking for data file at: {data_path}")
   
    # Check if data file exists
    if not os.path.exists(data_path):
        print(f"Data file not found at {data_path}")
       
        # Try alternative paths
        alternative_paths = [
            os.path.join(os.getcwd(), "data", "icu_data.csv"),
            os.path.join(os.getcwd(), "..", "data", "icu_data.csv"),
            os.path.join(os.getcwd(), "icu_data.csv"),
            "C:/Users/HP/OneDrive/Desktop/DS Project - Copy/data/icu_data.csv"
        ]
       
        for path in alternative_paths:
            print(f"Checking alternative path: {path}")
            if os.path.exists(path):
                data_path = path
                print(f"Data file found at: {data_path}")
                break
        else:
            print("ERROR: Could not find data file in any expected location.")
            print("Please place the icu_data.csv file in one of these locations:")
            for path in [data_path] + alternative_paths:
                print(f"  - {path}")
            return
   
    # Load data
    X, y = load_data(data_path)
   
    if X is None or y is None:
        print("ERROR: Failed to load data. Aborting training process.")
        return
   
    try:
        # Preprocess data
        X_train_scaled, X_test_scaled, y_train, y_test, scaler, imputer = preprocess_data(X, y)
       
        # Train model
        model = train_model(X_train_scaled, y_train)
       
        # Evaluate model
        performance = evaluate_model(model, X_test_scaled, y_test)
        print(f"Model Accuracy: {performance['accuracy'] * 100:.2f}%")
        print("Classification Report:")
        for label, metrics in performance["classification_report"].items():
            if isinstance(metrics, dict):
                print(f"Class {label}:")
                for metric_name, value in metrics.items():
                    print(f"  - {metric_name}: {value:.4f}")
       
        # Save model, scaler, and imputer
        print("\nSaving model artifacts...")
        success = save_model(
            model, model_path,
            scaler, scaler_path,
            imputer, imputer_path
        )
       
        if success:
            print("\nModel training and saving process completed successfully!")
            print(f"Model saved to: {model_path}")
            print(f"Scaler saved to: {scaler_path}")
            print(f"Imputer saved to: {imputer_path}")
        else:
            print("\nERROR: Failed to save one or more model artifacts.")
   
    except Exception as e:
        print(f"ERROR during model training process: {str(e)}")
        traceback.print_exc()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        traceback.print_exc()
    finally:
        print("\nProcess finished.")