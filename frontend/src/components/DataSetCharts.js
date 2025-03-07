import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import './ICUPredictor.css';

const DataSetCharts = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState({
    ageDistribution: [],
    sofaDistribution: [],
    comorbidityImpact: {},
    gcsMortality: [],
    featureImportance: [],
    riskDistribution: []
  });

  const R_API_BASE_URL = 'http://localhost:8000';
  const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

  // Utility to flatten array-based values
  const flattenDataArrays = (data) => {
    return data?.map(item => {
      const flattened = {};
      Object.entries(item).forEach(([key, value]) => {
        flattened[key] = Array.isArray(value) ? value[0] : value;
      });
      return flattened;
    }) || [];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${R_API_BASE_URL}/js-chart-data`, { timeout: 60000 });

        if (response.data.success) {
          setChartData({
            ageDistribution: flattenDataArrays(response.data.age_distribution),
            sofaDistribution: flattenDataArrays(response.data.sofa_distribution),
            comorbidityImpact: response.data.comorbidity_impact || {},
            gcsMortality: flattenDataArrays(response.data.gcs_mortality),
            featureImportance: flattenDataArrays(response.data.feature_importance),
            riskDistribution: flattenDataArrays(response.data.risk_distribution)
          });
        } else {
          throw new Error(response.data.error || "Failed to fetch data");
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching chart data:", err);
        setError("Failed to load data from the R server.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const prepareComorbidityData = () => {
    if (!chartData.comorbidityImpact || Object.keys(chartData.comorbidityImpact).length === 0) {
      return [];
    }

    return Object.entries(chartData.comorbidityImpact).map(([name, data], index) => ({
      name,
      value: data.rate?.[0] || 0,
      fill: COLORS[index % COLORS.length]
    }));
  };

  // Update the loading return statement
  if (loading) return (
    <div className="loading-message-compact">
      <div className="spinner-small"></div>
      <p>Fetching Clinical Data from R Server...</p>
    </div>
  );

  return (
    <div className="dataset-charts-container">
      <div className="chart-row">
        <div className="dataset-chart">
          <h3 className="chart-title-js">Age Distribution and Mortality</h3>
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={chartData.ageDistribution} margin={{ top: 20, right: 20, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="age_group"
                label={{ value: 'Age Group', position: 'bottom', offset: 0, fontWeight: 500 }}
                tick={{ fontWeight: 500 }}
              />
              <YAxis
                yAxisId="left"
                label={{ value: 'Patient Count', angle: -90, position: 'left', fontWeight: 500 }}
                tick={{ fontWeight: 500 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                label={{ value: 'Mortality Rate (%)', angle: 90, position: 'right', fontWeight: 500 }}
                tick={{ fontWeight: 500 }}
              />
              <Tooltip formatter={(value, name) => name.includes('rate') ? `${value}%` : value} />
              <Legend wrapperStyle={{ paddingTop: 30 }} />

              <Bar yAxisId="left" dataKey="count" name="Total Patients" fill="#3498db" />
              <Bar yAxisId="left" dataKey="mortality" name="Mortality Count" fill="#e74c3c" />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="mortality_rate"
                name="Mortality Rate"
                stroke="#e74c3c"
                strokeWidth={2}
                dot={{ r: 3, fill: "#e74c3c" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="dataset-chart">
          <h3 className="chart-title-js">SOFA Score and Mortality</h3>
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={chartData.sofaDistribution} margin={{ top: 20, right: 20, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="sofa_group"
                label={{ value: 'SOFA Score', position: 'bottom', offset: 0, fontWeight: 500 }}
                tick={{ fontWeight: 500 }}
              />

              <YAxis
                yAxisId="left"
                label={{ value: 'Patient Count', angle: -90, position: 'left', fontWeight: 500 }}
                tick={{ fontWeight: 500 }}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                label={{ value: 'Mortality Rate (%)', angle: 90, position: 'right', fontWeight: 500 }}
                tick={{ fontWeight: 500 }}
              />

              <Tooltip formatter={(value, name) => name.includes('rate') ? `${value}%` : value} />
              <Legend wrapperStyle={{ paddingTop: 30 }} />

              <Bar yAxisId="left" dataKey="count" name="Patient Count" fill="#3498db" />
              <Bar yAxisId="left" dataKey="mortality" name="Mortality Count" fill="#e74c3c" />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="mortality_rate"
                name="Mortality Rate"
                stroke="#e74c3c"
                strokeWidth={2}
                dot={{ r: 3, fill: "#e74c3c" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-row">
        <div className="dataset-chart">
          <h3 className="chart-title-js">GCS Score and Mortality</h3>
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={chartData.gcsMortality} margin={{ top: 20, right: 20, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="gcs_group"
                label={{ value: 'GCS Score', position: 'bottom', offset: 0, fontWeight: 500 }}
                tick={{ fontWeight: 500 }}
              />

              <YAxis
                yAxisId="left"
                label={{ value: 'Patient Count', angle: -90, position: 'left', fontWeight: 500 }}
                tick={{ fontWeight: 500 }}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                label={{ value: 'Mortality Rate (%)', angle: 90, position: 'right', fontWeight: 500 }}
                tick={{ fontWeight: 500 }}
              />

              <Tooltip formatter={(value, name) => name.includes('rate') ? `${value}%` : value} />
              <Legend wrapperStyle={{ paddingTop: 30 }} />

              <Bar yAxisId="left" dataKey="count" name="Total Patients" fill="#3498db" />
              <Bar yAxisId="left" dataKey="mortality" name="Mortality Count" fill="#e74c3c" />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="mortality_rate"
                name="Mortality Rate"
                stroke="#e74c3c"
                strokeWidth={2}
                dot={{ r: 3, fill: "#e74c3c" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="dataset-chart">
          <h3 className="chart-title-js">Comorbidity Impact</h3>
          <ResponsiveContainer width="100%" height={500}>
            <PieChart margin={{ top: 10, right: 40, left: 15, bottom: 30 }}>
              <Pie
                data={prepareComorbidityData()}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                labelStyle={{ fontWeight: 500 }}
              >
                {prepareComorbidityData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Legend wrapperStyle={{
                paddingTop: 30
              }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-row">
        <div className="dataset-chart">
          <h3 className="chart-title-js">Feature and Importance</h3>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              layout="vertical"
              data={chartData.featureImportance}
              margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" label={{ value: 'Importance', position: 'bottom', fontWeight: 500 }} tick={{ fontWeight: 500 }} />
              <YAxis dataKey="feature" width={90} type="category" tick={{ fontSize: 14, fontWeight: 500 }} />
              <Tooltip formatter={(value) => `${value.toFixed(3)}%`} />
              <Legend wrapperStyle={{
                paddingTop: 30
              }} />
              <Bar dataKey="importance" name="Importance Score" fill="#3498db">
                {chartData.featureImportance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dataset-chart">
          <h3 className="chart-title-js">Mortality Risk Distribution</h3>
          <p className="chart-description">
            Overview of mortality risk stratification in the ICU dataset
          </p>
          <div className="mortality-stats">
            {chartData.riskDistribution.map((risk) => (
              <div key={risk.risk_category} className={`stat-box ${risk.risk_category.toLowerCase()}`}>
                <h4>{risk.risk_category} Risk</h4>
                <p className="stat-value">
                  {Math.round(risk.percentage || 0)}%
                </p>
                <p className="stat-desc">of patients</p>
              </div>
            ))}
          </div>
          <div className="key-findings">
            <h4>Key Findings:</h4>
            <ul>
              <li>Mortality increases significantly with age</li>
              <li>Higher SOFA scores strongly correlate with increased mortality</li>
              <li>GCS score is one of the most important predictors</li>
              <li>Hepatic failure and immunosuppression are the highest-risk comorbidities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DataSetCharts;