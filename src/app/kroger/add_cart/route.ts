import { type NextApiRequest, type NextApiResponse } from "next";
import { type API_KrogerAddCart } from "../model";

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  console.log(new Date(), "kroger add to cart", req.body);

  const postData = req.body as API_KrogerAddCart;
  const url = `https://api.kroger.com/v1/cart/add`;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.USER_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    res.json({ result: true });
    return;
  } catch (error) {
    console.error(error);
    res.json({ result: false });
  }
}
