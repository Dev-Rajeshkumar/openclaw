import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ReelsGrab — Download Instagram Reels for Free",
  description:
    "Download Instagram Reels videos in HD quality. Fast, free, and no login required. Just paste the link and grab your reel!",
  keywords: [
    "instagram reels downloader",
    "reels download",
    "instagram video downloader",
    "download reels",
    "ig reels",
    "reelsgrab",
  ],
  openGraph: {
    title: "ReelsGrab — Download Instagram Reels for Free",
    description:
      "Download Instagram Reels videos in HD quality. Fast, free, and no login required.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
