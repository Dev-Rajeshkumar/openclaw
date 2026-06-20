interface ReelInfo {
  thumbnail: string
  videoUrl: string
  username: string
  caption: string
  likes: string
  views: string
}

/**
 * Extracts the shortcode from various Instagram URL formats.
 */
export function extractShortcode(url: string): string | null {
  const patterns = [
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/i,
    /instagram\.com\/reels\/([A-Za-z0-9_-]+)/i,
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/i,
    /instagr\.am\/p\/([A-Za-z0-9_-]+)/i,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

/**
 * Formats a number into a human-readable string (e.g., 1200 → "1.2K").
 */
export function formatCount(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M"
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K"
  return num.toString()
}

/**
 * Fetches reel metadata from Instagram's public API /oembed endpoint
 * and page scraping. Returns structured data for download.
 *
 * NOTE: Instagram's API is rate-limited and may change. For production,
 * consider using a dedicated service like RapidAPI's Instagram scraper
 * or a headless browser approach.
 */
export async function fetchReelInfo(url: string): Promise<ReelInfo> {
  const shortcode = extractShortcode(url)
  if (!shortcode) {
    throw new Error("Could not extract reel ID from URL")
  }

  // Try Instagram's oembed endpoint for basic info
  const oembedUrl = `https://api.instagram.com/oembed/?url=https://www.instagram.com/reel/${shortcode}/`

  let username = "instagram"
  let thumbnail = ""
  let caption = ""

  try {
    const oembedRes = await fetch(oembedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })
    if (oembedRes.ok) {
      const data = await oembedRes.json()
      username = data.author_name || username
      thumbnail = data.thumbnail_url || ""
      caption = data.title || ""
    }
  } catch {
    // oembed failed, continue with fallbacks
  }

  // Try to get the actual video URL via Instagram's GraphQL / web API
  let videoUrl = ""

  try {
    // Method 1: Try the __a=1 JSON endpoint
    const pageUrl = `https://www.instagram.com/reel/${shortcode}/?__a=1&__d=dis`
    const pageRes = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    })

    if (pageRes.ok) {
      const json = await pageRes.json()

      // Navigate the GraphQL response
      const media =
        json?.graphql?.shortcode_media ||
        json?.items?.[0] ||
        json?.data?.shortcode_media

      if (media) {
        videoUrl =
          media.video_url ||
          media?.video_resources?.[0]?.src ||
          ""

        if (!thumbnail && media.display_url) {
          thumbnail = media.display_url
        }
        if (!thumbnail && media.thumbnail_src) {
          thumbnail = media.thumbnail_src
        }
        if (!username || username === "instagram") {
          username = media?.owner?.username || username
        }
        if (!caption) {
          caption =
            media?.edge_media_to_caption?.edges?.[0]?.node?.text || ""
        }
      }
    }
  } catch {
    // Method 1 failed
  }

  // Fallback: if we still don't have a video URL, use a proxy service
  if (!videoUrl) {
    // Use a third-party service as fallback
    // In production, you'd want to use your own backend or a paid API
    const proxyUrl = `https://api.downloadgram.me/api/convert?url=${encodeURIComponent(url)}`
    try {
      const proxyRes = await fetch(proxyUrl)
      if (proxyRes.ok) {
        const data = await proxyRes.json()
        if (data?.url) {
          videoUrl = data.url
        }
      }
    } catch {
      // Proxy also failed
    }
  }

  // If we still don't have a video URL, return what we have
  // The frontend will handle the download via the original page URL
  if (!videoUrl) {
    // Last resort: construct a direct link (may not work for all reels)
    videoUrl = `https://www.instagram.com/reel/${shortcode}/media/?size=l`
  }

  return {
    thumbnail,
    videoUrl,
    username,
    caption: caption.slice(0, 200),
    likes: "—",
    views: "—",
  }
}
