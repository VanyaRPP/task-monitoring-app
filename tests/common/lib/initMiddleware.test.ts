import { expect } from '@jest/globals';
import  initMiddleware  from '../../../common/lib/initMiddleware'

describe('initMiddleware', () => {
  test('should resolve with result if middleware succeeds', async () => {
    const successfulMiddleware = (req, res, next) => {
      next('Success');
    };
    const middleware = initMiddleware(successfulMiddleware);
    const result = await middleware({}, {});

    expect(result).toBe('Success');
  });

  test('should reject with error if middleware fails', async () => {
    const failingMiddleware = (req, res, next) => {
      next(new Error('Failed'));
    };

    const middleware = initMiddleware(failingMiddleware);
    try {
      await middleware({}, {});
    } catch (error) {
      expect(error.message).toBe('Failed');
    }
  });
});
