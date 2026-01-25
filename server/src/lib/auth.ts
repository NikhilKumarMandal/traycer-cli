import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "../db/db";
import { deviceAuthorization } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  baseURL: "http://localhost:4000",
  basePath: "/api/auth",
  trustedOrigins: ["http://localhost:3000"],
  plugins: [
    deviceAuthorization({
      expiresIn: "30m", // Device code expiration time
      interval: "5s", // Minimum polling interval
    }),
  ],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      scope: ["read:user", "user:email"], 
      mapProfileToUser: async (profile) => {
        console.log(profile)
        // You can add logic here to check if the email exists in the profile object
        if (!profile.email) {
          // You can throw an error or handle this case as needed (e.g., return a default value)
          throw new Error("User email not provided by GitHub");
        }
        return {
          email: profile.email,
          name: profile.name,
          // ... other fields
        };
      }
    },
  },
  logger: {
    level: "debug"
  }
});
