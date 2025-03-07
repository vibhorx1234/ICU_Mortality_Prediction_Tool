// frontend/src/components/ICUPredictor.js

import React, { useState, useEffect } from "react";
import FactorSlider from "./FactorSlider";
import PredictionDisplay from "./PredictionDisplay";
import PatientDataCharts from "./PatientDataCharts";
import DataSetCharts from "./DataSetCharts";
import RGeneratedCharts from "./RGeneratedCharts";
import { getPrediction, getAnalysis } from "../services/api";
import "./ICUPredictor.css";

const factorRanges = {
  age: { min: 18, max: 100, step: 1, unit: "years" },
  bmi: { min: 12, max: 50, step: 0.1, unit: "kg/m²" },
  heart_rate: { min: 30, max: 200, step: 1, unit: "bpm" },
  respiratory_rate: { min: 4, max: 60, step: 1, unit: "breaths/min" },
  mean_arterial_pressure: { min: 40, max: 160, step: 1, unit: "mmHg" },
  temperature: { min: 33, max: 42, step: 0.1, unit: "°C" },
  gcs_eyes: { min: 1, max: 4, step: 1, unit: "points" },
  gcs_motor: { min: 1, max: 6, step: 1, unit: "points" },
  gcs_verbal: { min: 1, max: 5, step: 1, unit: "points" },
  creatinine: { min: 0.2, max: 15, step: 0.1, unit: "mg/dL" },
  blood_urea_nitrogen: { min: 1, max: 150, step: 1, unit: "mg/dL" },
  sodium: { min: 110, max: 170, step: 1, unit: "mEq/L" },
  albumin: { min: 1, max: 7, step: 0.1, unit: "g/dL" },
  wbcs: { min: 0, max: 50, step: 0.1, unit: "×10³/µL" },
  hematocrit: { min: 15, max: 60, step: 1, unit: "%" },
  pao2: { min: 30, max: 500, step: 1, unit: "mmHg" },
  blood_ph: { min: 6.8, max: 7.8, step: 0.01, unit: "" },
  aids: { min: 0, max: 1, step: 1, unit: "" },
  cirrhosis: { min: 0, max: 1, step: 1, unit: "" },
  diabetes: { min: 0, max: 1, step: 1, unit: "" },
  hepatic_failure: { min: 0, max: 1, step: 1, unit: "" },
  immunosuppression: { min: 0, max: 1, step: 1, unit: "" }
};

// Group factors for better layout
const factorGroups = {
  "Demographics": ["age", "bmi"],
  "Vital Signs": ["heart_rate", "respiratory_rate", "mean_arterial_pressure", "temperature"],
  "Neurological Status": ["gcs_eyes", "gcs_motor", "gcs_verbal"],
  "Laboratory Values": ["creatinine", "blood_urea_nitrogen", "sodium", "albumin", "wbcs", "hematocrit", "pao2", "blood_ph"],
  "Comorbidities": ["aids", "cirrhosis", "diabetes", "hepatic_failure", "immunosuppression"]
};

const ICUPredictor = () => {
  const [values, setValues] = useState({
    age: 65,
    bmi: 25,
    heart_rate: 80,
    respiratory_rate: 16,
    mean_arterial_pressure: 90,
    temperature: 37,
    gcs_eyes: 4,
    gcs_motor: 6,
    gcs_verbal: 5,
    creatinine: 1.0,
    blood_urea_nitrogen: 20,
    sodium: 140,
    albumin: 4.0,
    wbcs: 8.0,
    hematocrit: 40,
    pao2: 95,
    blood_ph: 7.4,
    aids: 0,
    cirrhosis: 0,
    diabetes: 0,
    hepatic_failure: 0,
    immunosuppression: 0
  });
  const [prediction, setPrediction] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [activeChartsTab, setActiveChartsTab] = useState("js");
 
  // Handle slider change
  const handleSliderChange = (factor, newValue) => {
    setValues(prevValues => ({
      ...prevValues,
      [factor]: newValue
    }));
  };

  // Auto-fetch data whenever values change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchData(values);
    }, 300); // Small delay to avoid too many requests when sliding rapidly
   
    return () => clearTimeout(debounceTimer);
  }, [values]);

  // Generate custom analysis data based on actual patient parameters
  const generateAnalysisData = (patientData) => {
    // Calculate SOFA components
    // Respiratory component (based on PaO2)
    const respiratoryScore = patientData.pao2 < 100 ? 3 :
                             patientData.pao2 < 200 ? 2 :
                             patientData.pao2 < 300 ? 1 : 0;
   
    // Cardiovascular component (based on MAP)
    const cardiovascularScore = patientData.mean_arterial_pressure < 70 ? 1 : 0;
   
    // Neurological component (based on GCS)
    const gcsTotal = patientData.gcs_eyes + patientData.gcs_motor + patientData.gcs_verbal;
    const neurologicalScore = gcsTotal < 6 ? 4 :
                              gcsTotal < 10 ? 3 :
                              gcsTotal < 13 ? 2 :
                              gcsTotal < 15 ? 1 : 0;
   
    // Renal component (based on creatinine)
    const renalScore = patientData.creatinine > 5.0 ? 4 :
                       patientData.creatinine > 3.5 ? 3 :
                       patientData.creatinine > 2.0 ? 2 :
                       patientData.creatinine > 1.2 ? 1 : 0;
   
    // Calculate total SOFA score
    const totalSofaScore = respiratoryScore + cardiovascularScore + neurologicalScore + renalScore;
   
    // Calculate risk score based on SOFA and other factors
    let riskScore = totalSofaScore * 5; // Base risk from SOFA
   
    // Age factor
    riskScore += patientData.age > 80 ? 15 :
                patientData.age > 65 ? 10 :
                patientData.age > 50 ? 5 : 0;
   
    // Comorbidity adjustment
    riskScore += patientData.aids * 10;
    riskScore += patientData.cirrhosis * 8;
    riskScore += patientData.diabetes * 5;
    riskScore += patientData.hepatic_failure * 12;
    riskScore += patientData.immunosuppression * 10;
   
    // Cap risk score
    riskScore = Math.min(95, riskScore);
   
    // Determine organ status
    const respiratoryStatus = patientData.respiratory_rate > 25 || patientData.respiratory_rate < 10 || patientData.pao2 < 250
                              ? "Compromised" : "Normal";
   
    const cardiovascularStatus = patientData.mean_arterial_pressure < 65 || patientData.heart_rate > 120 || patientData.heart_rate < 50
                                 ? "Compromised" : "Normal";
   
    const renalStatus = patientData.creatinine > 1.5 || patientData.blood_urea_nitrogen > 30
                        ? "Compromised" : "Normal";
   
    const neurologicalStatus = gcsTotal < 13 ? "Compromised" : "Normal";
   
    // Determine risk level
    const riskLevel = riskScore > 50 ? "High" :
                      riskScore > 25 ? "Moderate" : "Low";
   
    // Calculate stability index
    const stabilityIndex = 100 - (
      Math.abs(patientData.heart_rate - 75) / 75 * 20 +
      Math.abs(patientData.respiratory_rate - 16) / 16 * 20 +
      Math.abs(patientData.temperature - 37) / 3 * 20
    );
   
    // Create analysis object
    return {
      "SOFA Score": totalSofaScore.toString(),
      "Risk Score": riskScore.toFixed(1),
      "Stability Index": Math.max(0, Math.min(100, stabilityIndex)).toFixed(1),
      "Risk Level": riskLevel,
      "Respiratory Status": respiratoryStatus,
      "Cardiovascular Status": cardiovascularStatus,
      "Renal Status": renalStatus,
      "Neurological Status": neurologicalStatus,
      "Mortality Risk Percentage": riskScore.toFixed(1)
    };
  };

  const fetchData = async (patientData) => {
    setError(null);
   
    try {
      // Try to get prediction from backend
      let predictionResult = null;
      try {
        predictionResult = await getPrediction(patientData);
      } catch (predictionErr) {
        console.error("Could not get prediction from server, using local calculation:", predictionErr);
        // If server fails, calculate locally
        const riskScore = Math.min(95,
          (patientData.age / 100 * 20) +
          (Math.abs(patientData.heart_rate - 75) / 75 * 15) +
          (Math.abs(patientData.respiratory_rate - 16) / 16 * 15) +
          (patientData.creatinine > 1.2 ? 10 : 0) +
          ((15 - (patientData.gcs_eyes + patientData.gcs_motor + patientData.gcs_verbal)) * 3) +
          (patientData.aids * 10) +
          (patientData.cirrhosis * 8) +
          (patientData.diabetes * 5) +
          (patientData.hepatic_failure * 12) +
          (patientData.immunosuppression * 10)
        );
        predictionResult = { mortality_risk: riskScore };
      }
     
      if (predictionResult) {
        setPrediction(predictionResult);
       
        // Generate our own analysis data
        const analysisData = generateAnalysisData(patientData);
        setAnalysis(analysisData);
      }
    } catch (err) {
      console.error("Error in ICU prediction flow:", err);
      setError("Failed to generate prediction. Please check your inputs.");
    }
  };

  return (
    <div className="predictor-container">
      <h1 className="main-title">ICU Mortality Prediction Tool</h1>
     
      <div className="predictor-layout">
        <div className="factors-panel">
          {Object.entries(factorGroups).map(([groupName, factors]) => (
            <div key={groupName} className="factor-group">
              <h2 className="group-title">{groupName}</h2>
              <div className="sliders-grid">
                {factors.map(factor => (
                  <FactorSlider
                    key={factor}
                    name={factor}
                    value={values[factor]}
                    min={factorRanges[factor].min}
                    max={factorRanges[factor].max}
                    step={factorRanges[factor].step}
                    unit={factorRanges[factor].unit}
                    onChange={handleSliderChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
       
        <div className="results-panel">
          {error ? (
            <div className="error-message">
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          ) : (
            <>
              <PredictionDisplay prediction={prediction} analysis={analysis} />
              <PatientDataCharts values={values} prediction={prediction ? prediction.mortality_risk : 0} />
            </>
          )}
        </div>
      </div>
     
      <div className="dataset-charts-section">
        <h2 className="section-title">ICU Dataset Analysis</h2>
       
        <div className="charts-tabs">
          <button
            className={activeChartsTab === 'js' ? "charts-tab active" : "charts-tab"}
            onClick={() => setActiveChartsTab('js')}
          >
            JavaScript Charts
          </button>
          <button
            className={activeChartsTab === 'r' ? "charts-tab active" : "charts-tab"}
            onClick={() => setActiveChartsTab('r')}
          >
            R Statistical Charts
          </button>
        </div>
       
        <div className="chart-tabs-content">
          {activeChartsTab === 'js' ? (
            <DataSetCharts />
          ) : (
            <RGeneratedCharts />
          )}
        </div>
      </div>
    </div>
  );
};

export default ICUPredictor;