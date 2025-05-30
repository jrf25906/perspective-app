declare namespace Express {
  interface Request {
    user?: {
      id: number;
      email: string;
      username?: string;
      role?: string;
    };
    file?: Express.Multer.File;
  }
}
