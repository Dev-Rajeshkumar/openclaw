import { NextRequest, NextResponse } from "next/server"
import { fetchReelInfo } from "@/lib/instagram"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      )
    }

    // Validate Instagram URL
    const instagramPatterns = [
      /instagram\.com\/reel\//i,
      /instagram\.com\/reels\//i,
      /instagram\.com\/p\//i,
      /instagr\.am\//i,
    ]

    const isValid = instagramPatterns.some((p) => p.test(url))
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid Instagram Reel or Post URL",
        },
        { status: 400 }
      )
    }

    const reelInfo = await fetchReelInfo(url)

    return NextResponse.json({
      success: true,
      data: reelInfo,
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch reel. Please check the URL and try again.",
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
