import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Update error state with more information
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
      lastErrorTime: new Date().toISOString()
    }));
    
    console.error("Error caught by boundary:", error, errorInfo);
    
    // Log additional information that might help debugging
    console.log("Component stack:", errorInfo.componentStack);
    
    // If this is a toFixed error (common in chart rendering), log specific details
    if (error.message && error.message.includes('toFixed')) {
      console.warn("Detected toFixed error - likely caused by undefined or non-numeric data in charts");
    }
  }

  // Allow recovery without full page reload for certain errors
  attemptRecovery = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  }

  render() {
    if (this.state.hasError) {
      // Determine if this is likely a chart rendering error
      const isChartError = this.state.error?.message?.includes('toFixed') || 
                          this.state.error?.message?.includes('recharts') ||
                          this.state.errorInfo?.componentStack?.includes('Chart');
      
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          
          {isChartError && (
            <p>It looks like there was an error rendering a chart, possibly due to unexpected data format.</p>
          )}
          
          <div className="error-actions">
            <button onClick={() => window.location.reload()} className="reload-button">
              Reload Page
            </button>
            
            {isChartError && (
              <button onClick={this.attemptRecovery} className="recover-button">
                Try to Recover
              </button>
            )}
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
              <summary>Error Details (Developer Only)</summary>
              {this.state.error?.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
              <br />
              <div>
                <strong>Error count:</strong> {this.state.errorCount}<br />
                <strong>Last error time:</strong> {this.state.lastErrorTime}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;