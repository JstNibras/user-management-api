import prisma from "./prisma";

export const testMySQLConnection = async (): Promise<void> => {
  try {
    await prisma.$connect();

    await prisma.user.count();

    console.log("MySQL connected successfully");
  } catch (error) {
    console.error("MySQL connection failed:", error);
    throw error;
  }
};