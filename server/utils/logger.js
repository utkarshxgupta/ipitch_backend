/**
 * Simple logger utility for application-wide logging
 */
class Logger {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
  }

  /**
   * Format log message with timestamp and level
   */
  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  /**
   * Log info level message
   */
  info(message) {
    console.log(this.formatMessage('info', message));
  }

  /**
   * Log warning level message
   */
  warn(message) {
    console.warn(this.formatMessage('warn', message));
  }

  /**
   * Log error level message
   */
  error(message, error) {
    const errorMsg = error ? `${message} - ${error.message || error}` : message;
    console.error(this.formatMessage('error', errorMsg));
    
    // Log stack trace in development
    if (this.env === 'development' && error && error.stack) {
      console.error(error.stack);
    }
  }

  /**
   * Log debug level message (only in development)
   */
  debug(message) {
    if (this.env === 'development') {
      console.debug(this.formatMessage('debug', message));
    }
  }
}

module.exports = new Logger();
