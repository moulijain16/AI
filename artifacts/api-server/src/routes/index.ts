import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assessmentSubmissionsRouter from "./assessment-submissions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(assessmentSubmissionsRouter);

export default router;
