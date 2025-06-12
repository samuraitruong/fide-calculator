import { calculateRatingChange, roundNumber } from '../util';
import { GameResult } from '../types';

describe('Utility Functions', () => {
  describe('calculateRatingChange', () => {
    it('should calculate rating change for a win', () => {
      const result = calculateRatingChange(1500, 1600, 'win', 20);
      expect(result).toBeGreaterThan(0);
    });

    it('should calculate rating change for a loss', () => {
      const result = calculateRatingChange(1500, 1600, 'loss', 20);
      expect(result).toBeLessThan(0);
    });

    it('should calculate rating change for a draw', () => {
      const result = calculateRatingChange(1500, 1600, 'draw', 20);
      expect(result).toBeGreaterThan(0); // Expected to be positive because opponent is higher rated
    });

    it('should cap rating difference at 400 points', () => {
      const result1 = calculateRatingChange(1000, 2000, 'win', 20);
      const result2 = calculateRatingChange(1000, 1500, 'win', 20);
      expect(result1).toBe(result2); // Both should be equal because difference is capped at 400
    });

    it('should throw error for invalid game result', () => {
      expect(() => {
        calculateRatingChange(1500, 1600, 'invalid' as GameResult, 20);
      }).toThrow('Invalid game result');
    });
  });

  describe('roundNumber', () => {
    it('should round to one decimal place', () => {
      expect(roundNumber(1.234)).toBe(1.2);
      expect(roundNumber(1.256)).toBe(1.3);
      expect(roundNumber(1.5)).toBe(1.5);
    });

    it('should handle negative numbers', () => {
      expect(roundNumber(-1.234)).toBe(-1.2);
      expect(roundNumber(-1.256)).toBe(-1.3);
    });

    it('should handle zero', () => {
      expect(roundNumber(0)).toBe(0);
    });
  });
}); 