import { Request, Response } from "express";
import { DailyChallenge } from "../models/dailyChallenge";

// Stub: In-memory challenge for MVP
const todayChallenge: DailyChallenge = {
  id: "2025-05-26",
  prompt: "Which of the following is a straw-man argument?",
  options: [
    { id: "a", text: "You say reduce defense spending; clearly you want to leave the country defenseless." },
    { id: "b", text: "Our proposal reduces defense by 2% without impacting readiness." },
    { id: "c", text: "We should redirect some defense funds toward education." }
  ],
  correctOptionId: "a",
  explanation: "Option A exaggerates the original proposal, which is classic straw-man."
};

// GET /challenge/today
export const getTodayChallenge = (req: Request, res: Response) => {
  res.json(todayChallenge);
};

// POST /challenge/:id/submit
export const submitChallenge = (req: Request, res: Response) => {
  const { optionId } = req.body;
  const correct = optionId === todayChallenge.correctOptionId;
  res.json({
    correct,
    explanation: todayChallenge.explanation
  });
};

// TODO: Add user-based adaptive logic, fetch from DB, multi-day history.
