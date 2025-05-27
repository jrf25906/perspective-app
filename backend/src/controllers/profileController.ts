import { Request, Response } from "express";

export const getProfile = (req: Request, res: Response) => {
  res.json({}); // TODO
};

export const getEchoScore = (req: Request, res: Response) => {
  res.json({ echoScore: 0 }); // TODO
};