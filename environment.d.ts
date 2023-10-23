// import { type Role, type Tier } from "./index";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ////////////////////
      // clientEnv
      ////////////////////
      // Clerk
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
      CLERK_SECRET_KEY: string;
      // Next-Auth
      PAYPAL_CLIENT_ID: string;
      PAYPAL_CLIENT_SECRET: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
