import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import claimsRouter from "./claims";
import tasksRouter, { userTasksRouter } from "./tasks";
import referralsRouter from "./referrals";
import tokensRouter from "./tokens";
import statsRouter from "./stats";
import telegramRouter from "./telegram";
import leaderboardRouter from "./leaderboard";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);    // register, get user, update wallet
router.use("/claims", claimsRouter);
router.use("/tasks", tasksRouter);    // GET /api/tasks  (list all active tasks)
router.use("/users", userTasksRouter); // GET /api/users/:id/tasks, POST /api/users/:id/tasks/:tid/complete
router.use("/referrals", referralsRouter);
router.use("/tokens", tokensRouter);
router.use("/stats", statsRouter);
router.use("/telegram", telegramRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/notifications", notificationsRouter);

export default router;
