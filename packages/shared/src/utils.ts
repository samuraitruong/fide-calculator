import { GameResult } from './types';

export function calculateRatingChange(
  playerRating: number,
  opponentRating: number,
  result: GameResult,
  kFactor: number
): number {
  const S = {
    win: 1,
    draw: 0.5,
    loss: 0,
  }[result];
  
  if (S === undefined) {
    throw new Error(`Invalid game result expected win/draw/loss but got ${result}`);
  }
  
  let diff = opponentRating - playerRating;
  diff = diff < 0 ? Math.max(diff, -400) : Math.min(diff, 400);
  const E = 1 / (1 + Math.pow(10, diff / 400));
  const delta = kFactor * (S - E);
  return Math.round(delta * 10) / 10;
}

export function roundNumber(change: number): number {
  return Math.round(change * 10) / 10;
}

// Helper function to convert database row to camelCase
export function convertToCamelCase<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    converted[camelKey] = value;
  }
  return converted;
}

// Helper function to convert camelCase to snake_case for database
export function convertToSnakeCase<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    converted[snakeKey] = value;
  }
  return converted;
}

// Recursive camelCase converter
export function convertToCamelCaseRecursive(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertToCamelCaseRecursive);
  }

  const converted: Record<string, unknown> = {};
  const objRecord = obj as Record<string, unknown>;
  for (const key in objRecord) {
    if (objRecord.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      converted[camelKey] = convertToCamelCaseRecursive(objRecord[key]);
    }
  }
  return converted;
}

