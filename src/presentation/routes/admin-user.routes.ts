import { Router } from "express";
import { adminUserController } from "../controllers/admin-user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { UserRole } from "../../domain/entities/user.entity";
import { validateQuery } from "../middlewares/validate.middleware";
import { getUsersSchema } from "../validators/admin-user.validator";
import { validate } from "../middlewares/validate.middleware";
import { createUserSchema } from "../validators/admin-user.validator";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  validateQuery(getUsersSchema),
  (req, res, next) => adminUserController.getAllUsers(req, res, next)
);

router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  (req, res, next) => adminUserController.getUserById(req, res, next)
);

router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createUserSchema),
  (req, res, next) => adminUserController.createUser(req, res, next)
);

export default router;