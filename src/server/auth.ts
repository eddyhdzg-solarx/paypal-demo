import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession, type NextAuthOptions } from "next-auth";
import type { AdapterAccount } from "next-auth/adapters";

import { db } from "~/server/db";

interface UserInfo {
  user_id: string;
  sub: string;
  name: string;
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
  name: string;
  email_verified: boolean;
};

const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "";

const SCOPE =
  "openid profile email https://uri.paypal.com/services/paypalattributes";
const REDIRECT_URL = encodeURIComponent(
  `${NEXTAUTH_URL}/api/auth/callback/paypal`,
);
const AUTHORIZATION_URL = "https://www.sandbox.paypal.com/signin/authorize";

const adapter = PrismaAdapter(db);

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  adapter: {
    ...adapter,
    linkAccount: (account) => {
      const data: AdapterAccount = {
        access_token: account.access_token,
        expires_at: account.expires_at,
        id_token: account.id_token,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        scope: account.scope,
        session_state: account.session_state,
        token_type: account.token_type,
        type: account.type,
        userId: account.userId,
      };
      return db.account.create({ data }) as unknown as AdapterAccount;
    },
  },
  providers: [
    {
      id: "paypal",
      name: "PayPal",
      type: "oauth",
      authorization: {
        params: {
          scope: SCOPE,
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
          const data = await fetch(
            "https://api-m.sandbox.paypal.com/v1/identity/openidconnect/userinfo?schema=openid",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
              },
            },
          );

          const user = (await data.json()) as UserInfo;

          return {
            id: user.sub,
            sub: user.sub,
            email: user.email,
            name: user.name,
            emailVerified: user.email_verified,
          };
        },
      },
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      profile(profile: Profile) {
        return {
          id: profile?.sub,
          email: profile?.email,
          name: profile.name,
          image: null,
        };
      },
    },
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
