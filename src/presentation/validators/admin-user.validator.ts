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