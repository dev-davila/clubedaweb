import { logger } from '@/lib/logger';

describe('Logger', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('should log error messages', () => {
    const error = new Error('Test error');
    logger.error('An error occurred', error);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should log warnings', () => {
    logger.warn('Warning message', { context: 'value' });
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should have different log levels', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
});
