import { NextResponse } from "next/server";

interface Res {
  scope: string;
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  nonce: string;
}

export async function GET(request: Request) {
  try {
    const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
    const { searchParams } = new URL(request.url);
    const authorizationCode = searchParams.get("code");

    const base64Credentials = Buffer.from(
      `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
    ).toString("base64");

    const response = await fetch(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${base64Credentials}`,
          // "Content-Type": "application/x-www-form-urlencoded",
        },
        // body: `grant_type=authorization_code&code=${authorizationCode}`,
      },
    );

    if (response.status === 200) {
      const data = (await response.json()) as Res;

      const test = await fetch(
        "https://api-m.sandbox.paypal.com/v1/identity/openidconnect/userinfo?schema=openid",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            // "Content-Type": "application/x-www-form-urlencoded",
          },
          // body: `grant_type=authorization_code&code=${authorizationCode}`,
        },
      );

      const data2 = await test.json();

      console.log(data2);

      return NextResponse.json(data2, { status: 200 });
      //   return NextResponse.redirect(new URL("/", request.url));
    } else {
      return NextResponse.json({}, { status: response.status });
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
