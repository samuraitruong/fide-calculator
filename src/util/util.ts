import { GameResult } from "@/util/types";

export function calculateRatingChange(playerRating: number, opponentRating: number, result: GameResult, kFactor: number) {
  const S = ({
    "win": 1,
    "draw": 0.5,
    "loss": 0
  })[result];
  if (!S) {
    throw new Error("Invalid game result expected win/draw/loss but get " + result)
  }
  const E = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const delta = kFactor * (S - E);
  return Math.round(delta * 100) / 100;
}