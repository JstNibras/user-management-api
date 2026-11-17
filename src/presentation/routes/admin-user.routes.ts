import { Router } from "express";
import { adminUserController } from "../controllers/admin-user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { UserRole } from "../../domain/entities/user.entity";
import { validateQuery } from "../middlewares/validate.middleware";
import { validate } from "../middlewares/validate.middleware";
import { 
  getUsersSchema, 
  createUserSchema, 
  updateUserSchema
} from "../validators/admin-user.validator";

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

router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateUserSchema),
  (req, res, next) => adminUserController.updateUser(req, res, next)
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  (req, res, next) => adminUserController.deleteUser(req, res, next)
);

export default router;