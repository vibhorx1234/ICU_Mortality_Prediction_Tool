// frontend/src/components/PatientDataCharts.js

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
         PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid,
         PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const PatientDataCharts = ({ values, prediction }) => {
  // Create data for vital signs chart
  const vitalSignsData = [
    { name: 'Heart Rate', value: values.heart_rate, normal: '60-100 bpm', status: (values.heart_rate < 60 || values.heart_rate > 100) ? 'Abnormal' : 'Normal' },
    { name: 'Resp. Rate', value: values.respiratory_rate, normal: '12-20 bpm', status: (values.respiratory_rate < 12 || values.respiratory_rate > 20) ? 'Abnormal' : 'Normal' },
    { name: 'MAP', value: values.mean_arterial_pressure, normal: '70-100 mmHg', status: (values.mean_arterial_pressure < 70 || values.mean_arterial_pressure > 100) ? 'Abnormal' : 'Normal' },
    { name: 'Temp.', value: values.temperature, normal: '36.5-37.5°C', status: (values.temperature < 36.5 || values.temperature > 37.5) ? 'Abnormal' : 'Normal' }
  ];

  // Create data for lab values chart
  const labValuesData = [
    { name: 'Creatinine', value: values.creatinine, normal: '0.7-1.3 mg/dL', status: (values.creatinine < 0.7 || values.creatinine > 1.3) ? 'Abnormal' : 'Normal' },
    { name: 'BUN', value: values.blood_urea_nitrogen, normal: '7-20 mg/dL', status: (values.blood_urea_nitrogen < 7 || values.blood_urea_nitrogen > 20) ? 'Abnormal' : 'Normal' },
    { name: 'Sodium', value: values.sodium, normal: '135-145 mEq/L', status: (values.sodium < 135 || values.sodium > 145) ? 'Abnormal' : 'Normal' },
    { name: 'Albumin', value: values.albumin, normal: '3.4-5.4 g/dL', status: (values.albumin < 3.4 || values.albumin > 5.4) ? 'Abnormal' : 'Normal' },
    { name: 'WBCs', value: values.wbcs, normal: '4.5-11.0 ×10³/µL', status: (values.wbcs < 4.5 || values.wbcs > 11.0) ? 'Abnormal' : 'Normal' }
  ];

  // Create data for the GCS score chart
  const gcsData = [
    { name: 'Eyes', value: values.gcs_eyes, maxValue: 4 },
    { name: 'Verbal', value: values.gcs_verbal, maxValue: 5 },
    { name: 'Motor', value: values.gcs_motor, maxValue: 6 }
  ];
 
  // Calculate total GCS score
  const totalGCS = values.gcs_eyes + values.gcs_verbal + values.gcs_motor;
  const gcsStatus = totalGCS < 8 ? 'Severe' : totalGCS < 13 ? 'Moderate' : 'Mild/Normal';

  // Create data for the comorbidities chart with shorter names if needed
  const comorbidityData = [
    { name: 'AIDS', value: values.aids },
    { name: 'Cirrhosis', value: values.cirrhosis },
    { name: 'Diabetes', value: values.diabetes },
    { name: 'Hep. Failure', value: values.hepatic_failure }, // Shortened name
    { name: 'Immunosup.', value: values.immunosuppression } // Shortened name
  ].filter(item => item.value > 0);  // Only show present comorbidities

  // Add a "None" item if no comorbidities are present
  if (comorbidityData.length === 0) {
    comorbidityData.push({ name: 'None', value: 1 });
  }

  // Colors for the comorbidity chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="charts-container">
      <div className="chart-section">
        <h3 className="chart-title">Vital Signs Assessment</h3>
        <div className="chart-description">
        Vital signs vs Normal ranges
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={vitalSignsData} layout="vertical" margin={{ top: 35, right: 25, bottom: 0, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip
              formatter={(value, name, props) => [
                `${value} ${name === 'Temperature' ? '°C' : name === 'MAP' ? 'mmHg' : 'bpm'}`,
                `Value (Normal: ${props.payload.normal})`
              ]}
            />
            <Legend />
            <Bar dataKey="value" name="Current Value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section">
        <h3 className="chart-title">Glasgow Coma Scale</h3>
        <div className="chart-description">
          Total GCS Score: {totalGCS}/15 ({gcsStatus})
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={gcsData} margin={{ top: 35, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 6]} />
            <Tooltip formatter={(value) => [`Score: ${value}`]} />
            <Legend align="center" layout="horizontal" verticalAlign="bottom" />
            <Bar dataKey="value" name="Patient Score" fill="#82ca9d" />
            <Bar dataKey="maxValue" name="Maximum Possible Value" fill="#ffc658" opacity={0.4} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section">
        <h3 className="chart-title">Laboratory Values</h3>
        <div className="chart-description">
          Key laboratory indicators with reference to normal ranges
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={labValuesData} margin={{ top: 30, right: 25, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" interval={0} tick={{ fontSize: 14 }} />
            <YAxis />
            <Tooltip
              formatter={(value, name, props) => [
                value,
                `Value (Normal: ${props.payload.normal})` 
              ]}
            />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {comorbidityData.length > 0 && (
        <div className="chart-section">
          <h3 className="chart-title">Comorbidity Profile</h3>
          <div className="chart-description">
            Distribution of present comorbidities affecting risk assessment
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 30, right: 20, bottom: 0, left: 20 }}>
              <Pie
                data={comorbidityData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#555', strokeWidth: 1, strokeDasharray: '3 3' }}
              >
                {comorbidityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PatientDataCharts;