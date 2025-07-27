import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={containerStyle}>
          <div style={errorBoxStyle}>
            <h2 style={titleStyle}>Oops! Something went wrong</h2>
            <p style={messageStyle}>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            
            <button 
              style={buttonStyle}
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <details style={detailsStyle}>
                <summary style={summaryStyle}>Error Details (Development)</summary>
                <pre style={preStyle}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '400px',
  padding: '20px'
}

const errorBoxStyle = {
  maxWidth: '600px',
  padding: '40px',
  backgroundColor: '#f8f9fa',
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  textAlign: 'center'
}

const titleStyle = {
  color: '#dc3545',
  marginBottom: '16px'
}

const messageStyle = {
  color: '#6c757d',
  marginBottom: '24px',
  lineHeight: '1.5'
}

const buttonStyle = {
  padding: '12px 24px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px'
}

const detailsStyle = {
  marginTop: '24px',
  textAlign: 'left'
}

const summaryStyle = {
  cursor: 'pointer',
  fontWeight: 'bold',
  marginBottom: '8px'
}

const preStyle = {
  backgroundColor: '#f1f3f4',
  padding: '12px',
  borderRadius: '4px',
  fontSize: '12px',
  overflow: 'auto',
  maxHeight: '200px'
}

export default ErrorBoundary