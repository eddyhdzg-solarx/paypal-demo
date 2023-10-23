"use client";

import { useSearchParams } from "next/navigation";

const BASE_URL = "https://www.sandbox.paypal.com/signin/authorize";
const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const SCOPES = "openid email https://uri.paypal.com/services/paypalattributes";
// const REDIRECT_URL = encodeURIComponent("https://example.com");
const REDIRECT_URL = encodeURIComponent(
  "http://192.168.86.166:3000/api/paypal",
);
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

// http://192.168.86.166:3000
// ?code=C21AAKreWl7vyTRVoCshxSu6ST4eu5-EHPxYA0pjyll1e0-4dujmqy079NoQU1Io64RJ3n1_X1qX64EbuQfQmcqXj24tBbQLw
// &scope=openid+email+https%3A%2F%2Furi.paypal.com%2Fservices%2Fpaypalattributes
