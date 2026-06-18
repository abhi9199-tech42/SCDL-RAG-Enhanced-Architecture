import { SCDLSystemImpl } from './system/core';
import { loadConfigFromEnv } from './config/loader';
import { logger } from './utils/logger';

// Load configuration from environment variables
loadConfigFromEnv();

// Export all types and core classes
export * from './types';
export * from './system/types';
export * from './config/types';
export * from './isre/processor';
export * from './urcm/processor';
export * from './storage/memory_store';
export * from './storage/deduplication';
export * from './retrieval/engine';
export * from './context/assembler';
export * from './audit/trail';
export * from './api/server';

// Create default system instance
export const system = new SCDLSystemImpl();

// Handle process signals if running as main
if (require.main === module) {
  let isShuttingDown = false;
  const SHUTDOWN_TIMEOUT_MS = 10000;

  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`${signal} received. Starting graceful shutdown...`);

    const forceExitTimer = setTimeout(() => {
      logger.error('Shutdown timed out. Forcing exit.');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    try {
      await system.shutdown();
      logger.info('Graceful shutdown complete.');
      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      clearTimeout(forceExitTimer);
      process.exit(1);
    }
  };

  const startSystem = async () => {
    try {
      await system.initialize();
      await system.start();
      logger.info('System ready. Press Ctrl+C to stop.');
    } catch (error) {
      logger.error('Failed to start system:', error);
      process.exit(1);
    }
  };

  startSystem();

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
  });
}
