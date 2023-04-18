import { NextFunction, Request, Response } from "express";
import env from "./env";

export const OK = 200;

const cors = () => (req: Request, res: Response, next: NextFunction) => {
  res.append("Access-Control-Allow-Origin", env.CLIENT_PATH);
  res.append("Access-Control-Allow-Credentials", "true");
  res.append("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  res.append("Access-Control-Allow-Headers", "Content-Type, Origin, Cookies");

  if (req.method === "OPTIONS") {
    res.status(OK).send();
    return;
  }

  next();
};

export default cors;
