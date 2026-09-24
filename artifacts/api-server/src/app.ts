import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import * as pinoHttpModule from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

// Works however the package exports itself (default, named or CommonJS)
const pinoHttp = ((pinoHttpModule as any).pinoHttp ??
  (pinoHttpModule as any).default ??
  pinoHttpModule) as (opts?: any) => any;

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ success: false, error: message });
});

export default app;