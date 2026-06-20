"use client"

import { useState, useCallback } from "react"

type DownloadState = "idle" | "loading" | "success" | "error"

interface ReelData {
  thumbnail: string
  videoUrl: string
  username: string
  caption: string
  likes: string
  views: string
}

export default function DownloadForm() {
  const [url, setUrl] = useState("")
  const [state, setState] = useState<DownloadState>("idle")
  const [reelData, setReelData] = useState<ReelData | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const isValidInstagramUrl = (input: string) => {
    const patterns = [
      /instagram\.com\/reel\//i,
      /instagram\.com\/reels\//i,
      /instagram\.com\/p\//i,
      /instagr\.am\//i,
    ]
    return patterns.some((p) => p.test(input))
  }

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
    } catch {
      // Clipboard API not available
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      setErrorMsg("Please paste an Instagram Reel URL")
      setState("error")
      return
    }

    if (!isValidInstagramUrl(url)) {
      setErrorMsg("Please enter a valid Instagram Reel or Post URL")
      setState("error")
      return
    }

    setState("loading")
    setErrorMsg("")
    setReelData(null)

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch reel")
      }

      setReelData(data.data)
      setState("success")
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      )
      setState("error")
    }
  }

  const handleReset = () => {
    setUrl("")
    setState("idle")
    setReelData(null)
    setErrorMsg("")
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (state === "error") setState("idle")
              }}
              placeholder="Paste Instagram Reel URL here..."
              className="w-full pl-12 pr-24 py-4 rounded-xl bg-dark-800 border border-dark-700 text-white placeholder-dark-500 text-sm sm:text-base transition-all focus:border-pink-500"
              disabled={state === "loading"}
            />
            <button
              type="button"
              onClick={handlePaste}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white text-xs font-medium transition-colors"
            >
              Paste
            </button>
          </div>
          <button
            type="submit"
            disabled={state === "loading"}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-sm sm:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-pink-500/25 whitespace-nowrap"
          >
            {state === "loading" ? (
              <span className="flex items-center gap-2">
                <span className="spinner w-5 h-5 border-2" />
                Fetching...
              </span>
            ) : (
              "Download"
            )}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {state === "error" && errorMsg && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm fade-in flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {errorMsg}
        </div>
      )}

      {/* Success — Reel Preview & Download */}
      {state === "success" && reelData && (
        <div className="mt-8 fade-in">
          <div className="glass rounded-2xl overflow-hidden card-hover">
            {/* Preview */}
            <div className="relative aspect-video bg-dark-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reelData.thumbnail}
                alt="Reel thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {reelData.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-medium text-sm">
                    @{reelData.username}
                  </span>
                </div>
                <p className="text-white/80 text-sm line-clamp-2">
                  {reelData.caption}
                </p>
              </div>
              {/* Play icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Stats & Download */}
            <div className="p-6">
              <div className="flex items-center gap-6 mb-4 text-dark-400 text-sm">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {reelData.likes}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {reelData.views}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={reelData.videoUrl}
                  download
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-center transition-all shadow-lg hover:shadow-pink-500/25 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download HD Video
                </a>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white font-medium text-sm transition-colors"
                >
                  Download Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
