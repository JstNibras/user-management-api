import { z } from "zod";

export const getUsersSchema = z.object({
  search: z.string().trim().optional(),

  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce.number().int().min(1).max(100).optional(),

  sortBy: z
    .enum(["name", "email", "createdAt"])
    .optional(),

  sortOrder: z
    .enum(["asc", "desc"])
    .optional(),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "USER"]),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    email: z.string().trim().email().optional(),
    password: z.string().min(8).optional(),
    role: z.enum(["ADMIN", "USER"]).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be provided",
    }
  );