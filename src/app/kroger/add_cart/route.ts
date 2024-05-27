import { type NextRequest, type NextResponse } from "next/server";
import { type API_KrogerAddCart } from "../model";

export async function POST(req: NextRequest, res: NextResponse) {
  console.log(new Date(), "kroger add to cart", req.body);

  const postData = (await req.json()) as API_KrogerAddCart;
  const url = `https://api.kroger.com/v1/cart/add`;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.USER_ACCESS_TOKEN}`,
        "Content-Type": "application/jso∏n",
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return new Response("success");
  } catch (error) {
    console.error(error);
    return new Response("error occurred during add to cart");
  }
}
