# ICU Mortality Prediction Tool  
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://www.python.org/)  
[![R](https://img.shields.io/badge/R-4.0%2B-blue)](https://www.r-project.org/)  
[![React](https://img.shields.io/badge/React-18%2B-blue)](https://reactjs.org/)  

A full-stack predictive analytics tool for assessing ICU patient mortality risk using clinical data from ~40,000 ICU patients (Kaggle). Combines machine learning, statistical analysis, and interactive dashboards.

---

## Features  
### Predictive Analytics  
- **Machine Learning Models**:  
  - Random Forest classifier for mortality risk prediction.  
  - Hyperparameter tuning with GridSearchCV and 5-fold cross-validation.  
  - Feature engineering: Missing data imputation (`SimpleImputer`) and standardization (`StandardScaler`).  

- **R Statistical Models**:  
  - Survival analysis with Cox Proportional Hazards models.  
  - SOFA score impact analysis, survival curves, and hazard ratios.  
  - Comorbidity network analysis and survival probability calculations.  

### Interactive Frontend  
- **Input Components**:  
  - Dynamic sliders (`FactorSlider.js`) for adjusting clinical parameters (e.g., GCS score, age, SOFA score).  
  - Real-time prediction updates via Flask/REST API integration.  

- **Visualizations**:  
  - **JavaScript Charts**:  
    - Age vs. Mortality Trends  
    - SOFA Score Impact Analysis  
    - GCS Trajectory Visualization  
    - Comorbidity Risk Network  
    - Feature Importance Radar Chart  
    - Mortality Risk Distribution Histogram  
    - **Data for these charts is imported from the R server after analysis.**  

  - **R-Generated Charts (Canvas/React)**:  
    - Hemodynamic Instability Index  
    - Electrolyte Derangement Heatmap  
    - Inflammatory Response Clustering  
    - Neurological Status Trajectory  
    - Comorbidity Network Analysis  
    - Survival Probability Curves  
    - **These charts are generated in R, rendered on Canvas, and imported into the frontend.**  

### Backend Services  
- **Python (Flask) APIs**:  
  - `/predict`: Returns mortality risk predictions from the Random Forest model.  
  - Model serialization with `pickle` (`imputer.pkl`, `scaler.pkl`, `model.pkl`).  

- **R (Plumber) APIs**:  
  - `/chart/hemodynamic_stability` - Hemodynamic Stability plot
  - `/chart/electrolyte_patterns` - Electrolyte Patterns heatmap
  - `/chart/inflammatory_clusters` - Inflammatory Response clusters
  - `/chart/neurological_trajectory` - Neurological Trajectory visualization
  - `/chart/comorbidity_network` - Comorbidity Network heatmap
  - `/chart/survival_probability` - Survival Probability plot
  - `/js-chart-data` - Exports analysed data to frontend for Javascript Charts
  
---

## Usage  


## Installation  
### Backend Setup  
1. Install Python dependencies:  
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Train the model (optional):  
   ```bash
   python backend/train_model.py
   ```
3. Start Flask server:  
   ```bash
   python backend/app.py
   ```  

### R API Setup
1. Install R packages:  
   ```r
   install.packages(c( "ggplot2", "dplyr", "jsonlite", "base64enc", "scales", "survival", "survminer", "mice", "qgraph", "cluster", "tidyr", "corrplot", "tidyverse" ))
   ```  
2. Run Plumber API:  
   ```bash
   Rscript r_analysis/app.r
   ```

### Frontend Setup  
1. Install Node.js dependencies:  
   ```bash
   cd frontend && npm install
   ```  
2. Start React app:  
   ```bash
   npm start
   ```  

---

### Access the dashboard:  
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Input data:  
- Adjust sliders for clinical parameters (e.g., age, SOFA score).  
- View real-time predictions and interactive charts.  

---

## Key Components  
### Frontend (React.js)  
#### Components:  
- `FactorSlider.js`: Interactive sliders for parameter adjustment.  
- `PredictionDisplay.js`: Real-time mortality risk display.  
- `PatientDataCharts.js`: Visualizations for clinical trends.
- `DataSetCharts.js`: Generates Javascript Charts   
- `RGeneratedCharts.js`: Canvas integration for R plots.  

#### Services:  
- `api.js`: Axios-based client for Flask/R APIs.  

### Backend (Python/R)  
#### Python Scripts:  
- `train_model.py`: Model training pipeline.  
- `model.utils.py`: Utility functions for preprocessing.  

#### R Scripts:  
- `analysis.R`: Hemodynamic, Electrolyte, Inflammatory, Neurological, Comorbidity, Survival Analysis.
- `icuanalysis.R`: Analysis of Risk Score and Prediction Display.
- `plumber.r`: API endpoints for R models.  

---

## Technologies  
| Category | Tools |  
|----------|--------|  
| Backend | Python (Flask), R (Plumber) |  
| Frontend | React.js, Recharts |  
| Machine Learning | Python (Scikit-learn) |  
| Data | NumPy, Pandas, R (Survival, ggplot2, Tidyverse (dplyr, tidyr), corrplot, cluster) |  
| Deployment | REST APIs (Flask/Plumber), Model serialization (Pickle) |  

---

## License  
MIT License. See LICENSE for details.