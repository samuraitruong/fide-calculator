import { GameResult } from "@/util/types";

export function calculateRatingChange(playerRating: number, opponentRating: number, result: GameResult, kFactor: number) {
  const S = ({
    "win": 1,
    "draw": 0.5,
    "loss": 0
  })[result];
  if (S === undefined) {
    throw new Error("Invalid game result expected win/draw/loss but get " + result)
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