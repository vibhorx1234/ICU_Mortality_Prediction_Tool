# backend/model_utils.py

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import pickle
import os

def ensure_dir(file_path):
    """
    Ensure directory exists for a given file path
    
    Args:
        file_path (str): Full path to the file
    """
    directory = os.path.dirname(file_path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory)

def load_data(data_path):
    """
    Load ICU data from CSV file and clean missing values
    
    Args:
        data_path (str): Path to the CSV file
    
    Returns:
        tuple: Features (X) and target variable (y)
    """
    try:
        # Read data
        df = pd.read_csv(data_path)
        
        # Check and print missing values
        print("Missing values before cleaning:")
        print(df.isnull().sum())
        
        # Drop rows with missing values in the target column
        df.dropna(subset=["mortality"], inplace=True)
        
        # Separate features and target
        X = df.drop(columns=["mortality"])
        y = df["mortality"]
        
        # Check and print missing values in features
        print("\nMissing values in features:")
        print(X.isnull().sum())
        
        return X, y
    except Exception as e:
        print(f"Error loading data: {e}")
        return None, None

def preprocess_data(X, y, test_size=0.2, random_state=42):
    """
    Preprocess data by handling missing values, splitting, and scaling
    
    Args:
        X (pd.DataFrame): Features
        y (pd.Series): Target variable
        test_size (float): Proportion of test data
        random_state (int): Random seed for reproducibility
    
    Returns:
        tuple: Scaled training and test sets
    """
    # Impute missing values with median
    imputer = SimpleImputer(strategy='median')
    X_imputed = imputer.fit_transform(X)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X_imputed, y, test_size=test_size, random_state=random_state)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler, imputer

def train_model(X_train, y_train, n_estimators=100, random_state=42):
    """
    Train RandomForest classifier
    
    Args:
        X_train (np.array): Scaled training features
        y_train (pd.Series): Training target variable
        n_estimators (int): Number of trees in RandomForest
        random_state (int): Random seed for reproducibility
    
    Returns:
        sklearn.ensemble.RandomForestClassifier: Trained model
    """
    model = RandomForestClassifier(n_estimators=n_estimators, random_state=random_state)
    model.fit(X_train, y_train)
    return model

def evaluate_model(model, X_test, y_test):
    """
    Evaluate model performance
    
    Args:
        model (sklearn.ensemble.RandomForestClassifier): Trained model
        X_test (np.array): Scaled test features
        y_test (pd.Series): Test target variable
    
    Returns:
        dict: Model performance metrics
    """
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    
    return {
        "accuracy": accuracy,
        "classification_report": report
    }

def save_model(model, model_path="./models/model.pkl", scaler=None, scaler_path="./models/scaler.pkl", imputer=None, imputer_path="./models/imputer.pkl"):
    """
    Save trained model, scaler, and imputer
    
    Args:
        model (sklearn.ensemble.RandomForestClassifier): Trained model
        model_path (str): Path to save model
        scaler (sklearn.preprocessing.StandardScaler, optional): Feature scaler
        scaler_path (str, optional): Path to save scaler
        imputer (sklearn.impute.SimpleImputer, optional): Missing value imputer
        imputer_path (str, optional): Path to save imputer
    """
    # Ensure directories exist
    ensure_dir(model_path)
    
    # Save model
    with open(model_path, "wb") as model_file:
        pickle.dump(model, model_file)
    
    # Save scaler if provided
    if scaler:
        ensure_dir(scaler_path)
        with open(scaler_path, "wb") as scaler_file:
            pickle.dump(scaler, scaler_file)
    
    # Save imputer if provided
    if imputer:
        ensure_dir(imputer_path)
        with open(imputer_path, "wb") as imputer_file:
            pickle.dump(imputer, imputer_file)

def load_saved_model(model_path="./models/model.pkl", scaler_path="./models/scaler.pkl", imputer_path="./models/imputer.pkl"):
    """
    Load saved model, scaler, and imputer
    
    Args:
        model_path (str): Path to saved model
        scaler_path (str, optional): Path to saved scaler
        imputer_path (str, optional): Path to saved imputer
    
    Returns:
        tuple: Loaded model, optional scaler, and optional imputer
    """
    # Load model
    with open(model_path, "rb") as model_file:
        model = pickle.load(model_file)
    
    # Load scaler if path provided
    scaler = None
    if os.path.exists(scaler_path):
        with open(scaler_path, "rb") as scaler_file:
            scaler = pickle.load(scaler_file)
    
    # Load imputer if path provided
    imputer = None
    if os.path.exists(imputer_path):
        with open(imputer_path, "rb") as imputer_file:
            imputer = pickle.load(imputer_file)
    
    return model, scaler, imputer