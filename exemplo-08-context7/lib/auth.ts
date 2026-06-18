import Database from "better-sqlite3";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: new Database("./better-auth.sqlite"),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
