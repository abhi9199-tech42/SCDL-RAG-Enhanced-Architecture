import { Logger, createLogger, transports, format } from 'winston';

const env = process.env.NODE_ENV || 'development';
const logLevel = process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug');

const consoleFormat = env === 'production'
  ? format.combine(format.timestamp(), format.json())
  : format.combine(format.timestamp(), format.colorize(), format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level}]: ${message}${metaStr}`;
    }));

export const logger: Logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'scdl-rag', env },
  transports: [
    new transports.Console({ format: consoleFormat }),
    ...(env === 'production' ? [
      new transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5242880, maxFiles: 5 }),
      new transports.File({ filename: 'logs/combined.log', maxsize: 5242880, maxFiles: 5 })
    ] : [])
  ]
});

export interface AuditRecord {
  timestamp: string;
  component: string;
  action: string;
  details: any;
  user?: string;
  correlationId?: string;
}

export class AuditLogger {
  static log(component: string, action: string, details: any, correlationId?: string) {
    const record: AuditRecord = {
      timestamp: new Date().toISOString(),
      component,
      action,
      details,
      correlationId
    };
    logger.info('Audit Log', record);
  }
}
