// frontend/src/components/PredictionDisplay.js

import React from "react";

const PredictionDisplay = ({ prediction, analysis }) => {
  if (!prediction) {
    return (
      <div className="no-data-message">
        <p>Calculating prediction...</p>
      </div>
    );
  }
 
  // Extract mortality_risk from prediction
  const mortalityRisk = prediction.mortality_risk || 0;
 
  // Determine risk category and color
  let riskCategory, riskColor;
  if (mortalityRisk < 20) {
    riskCategory = "Low";
    riskColor = "#4caf50"; // Green
  } else if (mortalityRisk < 50) {
    riskCategory = "Moderate";
    riskColor = "#ff9800"; // Orange
  } else {
    riskCategory = "High";
    riskColor = "#f44336"; // Red
  }

  return (
    <div className="prediction-display">
      <div className="risk-gauge" style={{ borderColor: riskColor }}>
        <div className="risk-value" style={{ color: riskColor }}>
          {mortalityRisk.toFixed(1)}%
        </div>
        <div className="risk-label">
          {riskCategory} Risk
        </div>
      </div>
     
      {analysis && Object.keys(analysis).length > 0 && (
        <div className="analysis-section">
          <h3 className="analysis-title">Clinical Analysis</h3>
          <div className="analysis-grid">
            {Object.entries(analysis).map(([key, value]) => {
              // Skip showing the mortality risk twice
              if (key === "Mortality Risk Percentage") return null;
             
              // Format the key for display
              const displayKey = key
                .replace(/_/g, " ")
                .split(" ")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
             
              // Add special styling for risk level
              const isRiskLevel = key === "Risk Level";
              const riskLevelClass = isRiskLevel ? `risk-level-${value.toLowerCase()}` : "";
             
              return (
                <div key={key} className={`analysis-item ${riskLevelClass}`}>
                  <div className="analysis-key">{displayKey}</div>
                  <div className="analysis-value">{value}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionDisplay;