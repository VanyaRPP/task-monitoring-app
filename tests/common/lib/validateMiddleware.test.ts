import { expect } from '@jest/globals';
import { check } from 'express-validator'
import validateMiddleware from '../../../common/lib/validateMiddleware';

describe('validateMiddleware', () => {
    
    const validations = [
        check('date'),
        check(
          'credit',
          'Сума кредита повинна бути цілим значенням в межах [1, 200000]'
        ).optional(),
        check(
          'debit',
          'Сума дебита повинна бути цілим значенням в межах [1, 200000]'
        )
          .isFloat({ min: 0, max: 200000 })
          .optional(),
        check(
          'maintenance.sum',
          'Сума за утримання повинна бути в межах [1, 200000]' // TODO: Change on valid range
        )
          .isFloat({ min: 0, max: 200000 })
          .optional(),
        check(
          'placing.sum',
          'Сума за розміщення повинна бути в межах [1, 200000]' // TODO: Change on valid range
        )
          .isFloat({ min: 0, max: 200000 })
          .optional(),
        check(
          'electricity.sum',
          'Сума за електропостачання повинна бути в межах [1, 200000]' // TODO: Change on valid range
        )
          .isFloat({ min: 0, max: 200000 })
          .optional(),
        check(
          'water.sum',
          'Сума за водопостачання повинна бути в межах [1, 200000]' // TODO: Change on valid range
        )
          .isFloat({ min: 0, max: 200000 })
          .optional(),
        check('description').trim(),
      ]
  it('should call next if validations pass', async () => {
    const mockValidationResult = jest.fn(() => ({ isEmpty: () => true }));
    const middleware = validateMiddleware(validations, mockValidationResult);
    const next = jest.fn();

    await middleware({}, {}, next);

    expect(next).toHaveBeenCalled();
    expect(mockValidationResult).toHaveBeenCalled();
  });

  it('should send 422 response if validations fail', async () => {
    const mockValidationResult = jest.fn(() => ({ isEmpty: () => false, array: () => ['Validation failed'] }));

    const middleware = validateMiddleware(validations, mockValidationResult);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await middleware({}, res, {});

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ errors: ['Validation failed'] });
    expect(mockValidationResult).toHaveBeenCalled();
  });

  it('should handle unexpected errors', async () => {
    const mockValidationResult = jest.fn(() => {
      throw new Error('Unexpected error');
    });

    const middleware = validateMiddleware(validations, mockValidationResult);
    const next = jest.fn();

    await expect(async () => {
      await middleware({}, {}, next);
    }).rejects.toThrow('Unexpected error');

    expect(next).not.toHaveBeenCalled();
    expect(mockValidationResult).toHaveBeenCalled();
  });
});
