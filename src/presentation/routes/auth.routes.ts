import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { registerSchema } from "../validators/auth.validator";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  (req, res, next) => authController.register(req, res, next)
);

export default router;