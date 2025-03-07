//frontend/src/components/RGeneratedCharts.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ICUPredictor.css';

const RGeneratedCharts = () => {
    const [loading, setLoading] = useState(true);
    const [rServerAvailable, setRServerAvailable] = useState(false);
    const [error, setError] = useState(null);
    const [chartLoadErrors, setChartLoadErrors] = useState({});

    // Base URL for the R API
    const R_API_BASE_URL = process.env.REACT_APP_R_API_URL || 'http://localhost:8000';

    // Chart endpoints definition
    const rChartEndpoints = [
        {
            id: 'hemodynamic-stability',
            title: 'Hemodynamic Instability Index',
            description: 'Mortality rates by composite stability scores of vital signs',
            endpoint: '/chart/hemodynamic_stability',
            type: 'png'
        },
        {
            id: 'electrolyte-derangement',
            title: 'Electrolyte Derangement Heatmap',
            description: 'Abnormality patterns comparison between survival outcomes',
            endpoint: '/chart/electrolyte_patterns', 
            type: 'png'
        },
        {
            id: 'inflammatory-clustering',
            title: 'Inflammatory Response Clustering',
            description: 'Patient grouping by WBC-albumin-temperature patterns',
            endpoint: '/chart/inflammatory_clusters',
            type: 'png'
        },
        {
            id: 'neuro-trajectory',
            title: 'Neurological Status Trajectory',
            description: 'GCS score distribution trends by age and mortality',
            endpoint: '/chart/neurological_trajectory',
            type: 'png'
        },
        {
            id: 'comorbidity-network',
            title: 'Comorbidity Network Analysis',
            description: 'Chronic condition co-occurrence pattern visualization',
            endpoint: '/chart/comorbidity_network',
            type: 'png'
        },
        {
            id: 'survival-curve',
            title: 'Survival Probability Analysis',
            description: 'Analysis of survival probability based on key factors',
            endpoint: '/chart/survival_probability',
            type: 'png'
        }
    ];

    // Check if R API is available with more comprehensive error handling
    useEffect(() => {
        const checkRServerAvailability = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

                const response = await axios.get(`${R_API_BASE_URL}/status`, {
                    signal: controller.signal,
                    timeout: 30000
                });

                setRServerAvailable(response.status === 200);
                clearTimeout(timeoutId);
            } catch (err) {
                console.error("R Server Availability Check Error:", err);
                setRServerAvailable(false);
                setError(err.message || "Could not connect to R server");
            } finally {
                setLoading(false);
            }
        };

        checkRServerAvailability();
    }, []);

    // Handle individual chart load errors
    const handleChartLoadError = (chartId) => {
        setChartLoadErrors(prev => ({
            ...prev,
            [chartId]: true
        }));
    };

    // Retry loading a specific chart
    const retryChartLoad = (chartId) => {
        setChartLoadErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[chartId];
            return newErrors;
        });
    };

    // Loading state
    if (loading) return (
        <div className="loading-message-compact">
          <div className="spinner-small"></div>
          <p>Fetching Clinical Data from R Server...</p>
        </div>
      );

    // Error state
    if (error && !rServerAvailable) {
        return (
            <div className="error-message">
                <h3>R Server Connection Error</h3>
                <p>{error}</p>
                <p>Please ensure the R Plumber API is running at {R_API_BASE_URL}.</p>
                <button onClick={() => window.location.reload()}>
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="r-charts-container">
            <div className="r-charts-info">
                {!rServerAvailable && (
                    <span className="r-server-status">
                        ⚠ R server unavailable. Charts may not load correctly.
                    </span>
                )}
            </div>
            <div className="r-charts-grid">
                {rChartEndpoints.map(chart => (
                    <div key={chart.id} className="r-chart-item">
                        <h3 className="chart-title">{chart.title}</h3>
                        <p className="chart-description">{chart.description}</p>
                        
                        <div className="r-chart-image-container">
                            {rServerAvailable && !chartLoadErrors[chart.id] ? (
                                <img
                                    src={`${R_API_BASE_URL}${chart.endpoint}`}
                                    alt={chart.title}
                                    className="r-chart-image"
                                    onError={() => handleChartLoadError(chart.id)}
                                />
                            ) : (
                                <div className="r-chart-error-container">
                                    <p>Unable to load {chart.title} chart</p>
                                    <button onClick={() => retryChartLoad(chart.id)}>
                                        Retry Loading
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RGeneratedCharts;