import mongoose, { Schema, Document } from "mongoose";

export interface IUserDocument extends Document {
  userId: number;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    userId: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "USER"],
      required: true,
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model<IUserDocument>(
  "User",
  userSchema
);

export default UserModel;