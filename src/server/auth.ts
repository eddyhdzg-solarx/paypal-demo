import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { User } from "@prisma/client";
import { getServerSession, type NextAuthOptions } from "next-auth";

import { db } from "~/server/db";

interface UserInfo {
  user_id: string;
  sub: string;
  email: string;
  verified: "true" | "false";
  payer_id: string;
  verified_account: "true" | "false";
  email_verified: boolean;
}

type Profile = {
  id: string;
  sub: string;
  email: string;
};

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
const BASE_URL = "https://www.sandbox.paypal.com/signin/authorize";
const SCOPES = "openid email https://uri.paypal.com/services/paypalattributes";
// const REDIRECT_URL = encodeURIComponent("https://example.com");
const REDIRECT_URL = encodeURIComponent(
  "http://192.168.86.23:3000/api/auth/callback/paypal",
);
// const URL = `${BASE_URL}?flowEntry=static&client_id=${CLIENT_ID}&scope=${SCOPES}&redirect_uri=${REDIRECT_URL}&fullPage=false`;
// const AUTHORIZATION_URL = `${BASE_URL}?flowEntry=static&client_id=${PAYPAL_CLIENT_ID}`;
const AUTHORIZATION_URL = `${BASE_URL}?flowEntry=static&client_id=${PAYPAL_CLIENT_ID}&scope=${SCOPES}&redirect_uri=${REDIRECT_URL}&fullPage=false`;

const base64Credentials = Buffer.from(
  `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
).toString("base64");

const adapter = PrismaAdapter(db);

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  adapter: {
    ...adapter,
    linkAccount: ({ nonce, ...data }) => {
      console.log("🔗🔗🔗🔗🔗 linkAccount");
      console.log(data);
      return db.account.create({ data });
    },
  },
  providers: [
    {
      allowDangerousEmailAccountLinking: true,

      id: "paypal",
      name: "PayPal",
      type: "oauth",
      httpOptions: {
        headers: {
          authorization: `Basic ${base64Credentials}`,
          "x-content-type-options": "application/x-www-form-urlencoded",
        },
      },
      idToken: true,
      checks: ["none"],
      authorization: {
        params: {
          scope:
            "openid email https://uri.paypal.com/services/paypalattributes",
          redirect_uri: REDIRECT_URL,
        },
        url: AUTHORIZATION_URL,
      },
      token: {
        url: "https://api-m.sandbox.paypal.com/v1/oauth2/token",
        async request(context) {
          const { params, client } = context;
          const tokens = await client.grant({
            grant_type: "authorization_code",
            code: params.code,
          });
          return { tokens };
        },
      },

      userinfo: {
        async request({ tokens }) {
          const test = await fetch(
            "https://api-m.sandbox.paypal.com/v1/identity/openidconnect/userinfo?schema=openid",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
              },
            },
          );

          const user = (await test.json()) as UserInfo;

          return {
            id: user.sub,
            sub: user.sub,
            email: user.email,
          };
        },
      },
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      profile(profile: Profile) {
        return {
          id: profile?.sub,
          email: profile?.email,
          image: null,
          name: null,
        };
      },
    },
  ],
  // callbacks: {
  //   jwt: ({ token, user }) => {
  //     console.log("😟😟😟😟😟 JWT");
  //     if (user) {
  //       return {
  //         ...token,
  //         id: user.id,
  //       };
  //     }
  //     return token;
  //   },
  //   session: ({ session, token }) => {
  //     console.log("😟😟😟😟😟 session");
  //     return {
  //       ...session,
  //       user: {
  //         ...session.user,
  //         id: token.id,
  //       },
  //     };
  //   },
  //   signIn({ user, account, profile, email, credentials }) {
  //     console.log("😟😟😟😟😟 signIn");
  //     console.log(user);
  //     console.log(account);
  //     console.log(profile);
  //     console.log(email);
  //     console.log(credentials);
  //     if (user) {
  //       return true;
  //     }
  //     return false;
  //   },
  // },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  // debug: true,
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
