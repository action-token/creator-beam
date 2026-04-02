
import { env } from "~/env"
import { S3UploadService } from "~/lib/s3-upload.service"

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 60000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return response
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`)
    }
    throw error
  }
}

const NANO_BANANA_MODEL = "gemini-2.5-flash-image"

interface ContentPart {
  inlineData?: {
    data: string
    mimeType: string
  }
}

interface GenerativeResponse {
  candidates?: Array<{
    content?: {
      parts?: ContentPart[]
    }
  }>
  image?: {
    data: string
  }
  error?: {
    message: string
  }
}

async function extractImageData(response: GenerativeResponse): Promise<string | undefined> {
  try {
    // Extract generated image from response
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data && part.inlineData?.mimeType) {
          const awsURL = await S3UploadService.uploadBase64Image(
            part.inlineData?.data,
            part.inlineData?.mimeType ?? "image/png",
          )
          return awsURL

        }
      }
    }
  } catch (err) {
    console.error("[v0] Error extracting image data:", err)
  }

  return undefined
}

type ImageGenerationResult = {
  success: boolean
  url?: string
  error?: string
}

export async function generateImage(prompt: string, retryCount = 0): Promise<ImageGenerationResult> {
  const apiKey = env.GEMINI_API_KEY

  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY not configured. Please add it to your environment variables.",
    }
  }

  console.log("[v0] Starting Nano Banana Pro image generation with prompt:", prompt.substring(0, 100))
  console.log("[v0] Attempt:", retryCount + 1)

  try {
    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${NANO_BANANA_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${prompt}\n\nGenerate a high quality, artistic image. Christmas holiday themed with festive elements.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["image", "text"],
          },
        }),
      },
      90000,
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] API error response:", errorText)

      if (response.status >= 500 && retryCount < 2) {
        console.log("[v0] Server error, retrying in 2 seconds...")
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return generateImage(prompt, retryCount + 1)
      }

      return {
        success: false,
        error: `API error: ${response.status} - ${errorText.substring(0, 200)}`,
      }
    }

    const data = (await response.json()) as GenerativeResponse
    console.log("[v0] Response received, candidates:", data?.candidates?.length ?? 0)

    if (data?.error) {
      console.error("[v0] API error:", data.error)
      return {
        success: false,
        error: String(data.error.message ?? "API returned an error"),
      }
    }

    const imageData = await extractImageData(data)

    if (!imageData) {
      console.error("[v0] No image data in response")

      if (retryCount < 2) {
        console.log("[v0] No image data found, retrying in 2 seconds...")
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return generateImage(prompt, retryCount + 1)
      }

      return {
        success: false,
        error: "No image data in response from API after multiple attempts",
      }
    }

    return {
      success: true,
      url: imageData,
    }
  } catch (error) {
    console.error("[v0] Image generation error:", error)

    if (
      retryCount < 2 &&
      error instanceof Error &&
      (error.message.includes("timeout") || error.message.includes("fetch"))
    ) {
      console.log("[v0] Network error, retrying in 2 seconds...")
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return generateImage(prompt, retryCount + 1)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate image",
    }
  }
}

export async function transformImage(
  imageBase64: string,
  prompt: string,
  retryCount = 0,
): Promise<ImageGenerationResult> {
  try {
    const apiKey = env.GEMINI_API_KEY

    if (!apiKey) {
      console.error("[v0] GEMINI_API_KEY is missing")
      return {
        success: false,
        error: "GEMINI_API_KEY not configured. Please add it to your environment variables.",
      }
    }

    console.log("[v0] Starting Nano Banana Pro image-to-image transformation...")
    console.log("[v0] Prompt:", prompt.substring(0, 100))
    console.log("[v0] Attempt:", retryCount + 1)

    if (!imageBase64 || typeof imageBase64 !== "string") {
      console.error("[v0] Invalid imageBase64 input:", typeof imageBase64)
      return {
        success: false,
        error: "Invalid image data provided",
      }
    }

    try {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "")
      const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] ?? "image/jpeg"

      console.log("[v0] Image type:", mimeType)
      console.log("[v0] Image size:", base64Data.length, "bytes")

      if (!base64Data || base64Data.length === 0) {
        console.error("[v0] Empty base64 data after extraction")
        return {
          success: false,
          error: "Invalid image data: empty after base64 extraction",
        }
      }

      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${NANO_BANANA_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data,
                    },
                  },
                  {
                    text: `Edit this image: ${prompt}\n\nKeep the main subject recognizable but transform the style and background according to the prompt. Make it artistic and festive.`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ["image", "text"],
            },
          }),
        },
        120000,
      )

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API error response:", errorText)

        if (response.status >= 500 && retryCount < 2) {
          console.log("[v0] Server error, retrying in 2 seconds...")
          await new Promise((resolve) => setTimeout(resolve, 2000))
          return transformImage(imageBase64, prompt, retryCount + 1)
        }

        return {
          success: false,
          error: `API error: ${response.status} - ${errorText.substring(0, 200)}`,
        }
      }

      const data = (await response.json()) as GenerativeResponse

      if (data?.error) {
        console.error("[v0] API error:", data.error)
        return {
          success: false,
          error: String(data.error.message ?? "API returned an error"),
        }
      }

      const imageData = await extractImageData(data)

      if (!imageData) {
        console.error("[v0] No image data in response")

        if (retryCount < 2) {
          console.log("[v0] No image data found, retrying in 2 seconds...")
          await new Promise((resolve) => setTimeout(resolve, 2000))
          return transformImage(imageBase64, prompt, retryCount + 1)
        }

        return {
          success: false,
          error: "No image data in response from API after multiple attempts",
        }
      }


      return {
        success: true,
        url: imageData,
      }
    } catch (error) {
      console.error("[v0] Image transformation inner error:", error)
      console.error("[v0] Error type:", error instanceof Error ? error.constructor.name : typeof error)
      console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))

      if (
        retryCount < 2 &&
        error instanceof Error &&
        (error.message.includes("timeout") || error.message.includes("fetch"))
      ) {
        console.log("[v0] Network error, retrying in 2 seconds...")
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return transformImage(imageBase64, prompt, retryCount + 1)
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to transform image",
      }
    }
  } catch (outerError) {
    console.error("[v0] CRITICAL: Uncaught error in transformImage:", outerError)
    console.error("[v0] Error stack:", outerError instanceof Error ? outerError.stack : "No stack trace")
    return {
      success: false,
      error: `Critical error: ${outerError instanceof Error ? outerError.message : String(outerError)}`,
    }
  }
}
