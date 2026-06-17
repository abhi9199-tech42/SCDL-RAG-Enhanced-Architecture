import { SCDLSystemImpl } from './system/core';
import { logger } from './utils/logger';

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
  const startSystem = async () => {
    try {
      await system.initialize();
      await system.start();
    } catch (error) {
      logger.error('Failed to start system:', error);
      process.exit(1);
    }
  };

  startSystem();

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down...');
    await system.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received. Shutting down...');
    await system.stop();
    process.exit(0);
  });
}
