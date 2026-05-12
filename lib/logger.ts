type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private format(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = this.formatTimestamp();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      console.debug(this.format('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.isDev || context?.critical) {
      console.log(this.format('info', message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.format('warn', message, context));
  }

  error(message: string, error?: Error | string, context?: LogContext) {
    const errorStr = error instanceof Error ? error.stack : error;
    console.error(this.format('error', message, { error: errorStr, ...context }));
  }

  apiRequest(method: string, path: string, statusCode?: number, duration?: number) {
    if (statusCode && statusCode >= 400) {
      this.warn(`API Error: ${method} ${path} returned ${statusCode}`, { duration });
    } else if (this.isDev) {
      this.debug(`API: ${method} ${path}`, { status: statusCode, duration });
    }
  }

  dbQuery(operation: string, model: string, duration?: number) {
    if (this.isDev && duration && duration > 1000) {
      this.warn(`Slow DB query: ${operation} on ${model}`, { duration });
    }
  }

  security(event: string, context?: LogContext) {
    this.warn(`SECURITY: ${event}`, context);
  }
}

export const logger = new Logger();
