import { Logger, createLogger, transports, format } from 'winston';

export const logger: Logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
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
