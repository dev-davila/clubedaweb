import { ValidationError, AuthenticationError, NotFoundError } from '@/lib/api-errors';

describe('API Errors', () => {
  describe('ValidationError', () => {
    it('should create validation error with correct status', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      expect(error.status).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with default message', () => {
      const error = new AuthenticationError();
      expect(error.status).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.message).toBe('Não autenticado');
    });

    it('should create authentication error with custom message', () => {
      const error = new AuthenticationError('Token expired');
      expect(error.message).toBe('Token expired');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with resource name', () => {
      const error = new NotFoundError('BlogPost');
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('BlogPost não encontrado');
    });
  });
});
