import { PrismaAdapter } from "@next-auth/prisma-adapter";
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

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
const BASE_URL = "https://www.sandbox.paypal.com/signin/authorize";
const SCOPES = "openid email https://uri.paypal.com/services/paypalattributes";
// const REDIRECT_URL = encodeURIComponent("https://example.com");
const REDIRECT_URL = encodeURIComponent(
  "http://192.168.86.166:3000/api/auth/callback/paypal",
);
// const URL = `${BASE_URL}?flowEntry=static&client_id=${CLIENT_ID}&scope=${SCOPES}&redirect_uri=${REDIRECT_URL}&fullPage=false`;
// const AUTHORIZATION_URL = `${BASE_URL}?flowEntry=static&client_id=${PAYPAL_CLIENT_ID}`;
const AUTHORIZATION_URL = `${BASE_URL}?flowEntry=static&client_id=${PAYPAL_CLIENT_ID}&scope=${SCOPES}&redirect_uri=${REDIRECT_URL}&fullPage=false`;

const base64Credentials = Buffer.from(
  `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
).toString("base64");

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    // {
    //   id: "paypal2",
    //   name: "PayPal2",
    //   type: "oauth",
    //   version: "2.0",
    //   accessTokenUrl: "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    //   clientId: process.env.PAYPAL_CLIENT_ID,
    //   clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    //   authorization: {
    //     params: {
    //       scope:
    //         "openid email https://uri.paypal.com/services/paypalattributes",
    //       redirect_uri: REDIRECT_URL,
    //     },
    //     url: AUTHORIZATION_URL,
    //   },
    //   profileUrl: "",
    //   profile(profile, tokens) {
    //     console.log(profile, tokens);
    //     return {
    //       id: "1234",
    //       name: "foo",
    //       email: "bar",
    //       image: "",
    //     };
    //   },
    // },
    {
      id: "paypal",
      name: "PayPal",
      type: "oauth",
      httpOptions: {
        headers: {
          authorization: `Basic ${base64Credentials}`,
          "x-content-type-options": "application/x-www-form-urlencoded",
        },
      },
      authorization: {
        params: {
          scope:
            "openid email https://uri.paypal.com/services/paypalattributes",
          redirect_uri: REDIRECT_URL,
        },
        url: AUTHORIZATION_URL,
        request(context) {
          console.log("eddy 1", context);
        },
      },
      // profileUrl:
      //   "https://api-m.sandbox.paypal.com/v1/identity/openidconnect/userinfo?schema=openid",
      // userinfo: {
      //   request: ({ client, provider, tokens }) => {
      //     console.log("client", client);
      //     // console.log("provider", provider);
      //     console.log("tokens", tokens);

      //     return "";
      //   },
      // },

      // idToken: true,

      token: {
        url: "https://api-m.sandbox.paypal.com/v1/oauth2/token",
        async request(context) {
          const { provider, params, checks, client } = context;
          const { callbackUrl } = provider;

          console.log("1111111111", params);

          const tokens = await client.grant({
            grant_type: "authorization_code",
            code: params.code,
          });

          return { tokens };
        },
      },

      userinfo: {
        async request({ client, tokens, provider }) {
          console.log("22222222222");
          // console.log(client);
          // console.log(tokens);
          // console.log(provider);

          // const eddy = await client.grant({
          //   grant_type: "authorization_code",
          //   code: tokens.code,
          // });

          // console.log(eddy);

          const test = await fetch(
            "https://api-m.sandbox.paypal.com/v1/identity/openidconnect/userinfo?schema=openid",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                // "Content-Type": "application/x-www-form-urlencoded",
              },
              // body: `grant_type=authorization_code&code=${authorizationCode}`,
            },
          );

          const user = (await test.json()) as UserInfo;

          return {
            // id: user.user_id,
            sub: user.sub,
            email: user.email,
            // payer_id: user.payer_id,
          };
        },
      },

      idToken: false,
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    },
    {
      id: "google",
      name: "Google",
      type: "oauth",
      wellKnown: "https://accounts.google.com/.well-known/openid-configuration",
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      idToken: true,
      checks: ["pkce", "state"],
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  // callbacks: {
  //   async signIn({ user, account, profile, email, credentials }) {
  //     console.log("eddy 2");
  //     if (user) {
  //       return true;
  //     }
  //     return false;
  //   },
  //   // async redirect({ url, baseUrl }) {
  //   //   console.log("eddy 3", url, baseUrl);

  //   //   if (url.startsWith(baseUrl)) return url;
  //   //   else if (url.startsWith("/")) return new URL(url, baseUrl).toString();
  //   //   return "baseUrl";
  //   // },
  //   async session({ session, token, user }) {
  //     console.log("eddy 4", token);
  //     if (token) {
  //       session.id = token.id;
  //     }
  //     return session;
  //   },
  //   async jwt({ token, user, account, profile, isNewUser }) {
  //     console.log("eddy 5", token);
  //     if (user) {
  //       token.id = user.id;
  //     }

  //     return token;
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
