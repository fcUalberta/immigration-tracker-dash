import { Router, type IRouter } from "express";
import healthRouter from "./health";
import backlogRouter from "./backlog";

const router: IRouter = Router();

router.use(healthRouter);
router.use(backlogRouter);

export default router;
