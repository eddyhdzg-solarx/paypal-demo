"use client";

import { useSearchParams } from "next/navigation";

const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "";

const BASE_URL = "https://www.sandbox.paypal.com/signin/authorize";
const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const SCOPES = "openid email https://uri.paypal.com/services/paypalattributes";
const REDIRECT_URL = encodeURIComponent(`${NEXTAUTH_URL}/api/paypal`);
const URL = `${BASE_URL}?flowEntry=static&client_id=${CLIENT_ID}&scope=${SCOPES}&redirect_uri=${REDIRECT_URL}&fullPage=true`;

export const SignInWithPayPal = () => {
  const { get } = useSearchParams();
  const code = get("code");
  return (
    <>
      <button>
        <a href={URL}>Login with Paypal</a>
      </button>
      <div>Code:{code}</div>
    </>
  );
};
