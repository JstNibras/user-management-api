import UserModel from "../database/mongodb/models/user.model";
import {
  IUserSyncRepository,
  UserSyncData,
} from "../../domain/interfaces/user-sync.repository.interface";

export class MongoDBUserSyncRepository implements IUserSyncRepository {
    
  async sync(user: UserSyncData): Promise<void> {
    await UserModel.findOneAndUpdate(
      { userId: user.userId },
      {
        $set: {
          name: user.name,
          email: user.email,
          role: user.role,
          isDeleted: user.isDeleted,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );
  }

  async delete(userId: number): Promise<void> {
    await UserModel.deleteOne({ userId });
  }
}