import type { NextApiRequest, NextApiResponse } from "next";

import { getToken } from "next-auth/jwt";
import { transformImage } from "../generate-image";



export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = await getToken({ req });
  if (!token?.sub) {
    res.status(401).json({
      error: "User is not authenticated",
    });
  }


  try {
    console.log("[v0] Transform image direct API called")

    const { imageBase64, prompt } = await req.body as {
      imageBase64: string;
      prompt: string;
    };

    console.log("[v0] Image size (base64):", imageBase64?.length || 0)
    console.log("[v0] Prompt:", prompt)

    if (!imageBase64 || !prompt) {
      return res.json({ error: "Missing required fields: imageBase64 and prompt" })
    }

    console.log("[v0] Calling transformImage function...")

    // Call transformImage with the base64 image
    const result = await transformImage(imageBase64, prompt)

    console.log("[v0] Transform result:", result.success ? "success" : "failed")

    return res.json(result)
  } catch (error) {
    console.error("[v0] Transform image direct API error:", error)
    return res.json(
      {
        error: error instanceof Error ? error.message : "Failed to transform image",
        success: false,
      }
    )
  }
}
