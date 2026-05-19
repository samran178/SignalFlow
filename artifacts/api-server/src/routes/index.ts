import { Router, type IRouter } from "express";
import healthRouter from "./health";
import signalflowRouter from "./signalflow";

const router: IRouter = Router();

router.use(healthRouter);
router.use(signalflowRouter);

export default router;
