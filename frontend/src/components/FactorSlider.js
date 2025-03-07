// frontend/src/components/FactorSlider.js

import React from "react";

const FactorSlider = ({ name, value, min, max, step, onChange, unit }) => {
  // Format the display name to be more readable
  const displayName = name
    .replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Special handling for binary values (like comorbidities)
  const isBinary = min === 0 && max === 1 && step === 1;

  return (
    <div className="factor-slider">
      <div className="slider-header">
        <label htmlFor={name} className="slider-label">{displayName}</label>
        <span className="slider-value">
          {isBinary ? (value === 1 ? "Yes" : "No") : `${value} ${unit}`}
        </span>
      </div>
      <input
        type="range"
        id={name}
        className="slider-input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(name, parseFloat(e.target.value))}
      />
      <div className="slider-range">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};

export default FactorSlider;