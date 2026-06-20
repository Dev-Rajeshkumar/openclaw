"use client"

import { useState, useCallback } from "react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import DownloadForm from "@/components/DownloadForm"
import Features from "@/components/Features"
import HowItWorks from "@/components/HowItWorks"
import FAQ from "@/components/FAQ"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 px-4 sm:py-32">
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm text-dark-300">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              100% Free — No Login Required
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Download Instagram{" "}
              <span className="gradient-text">Reels</span>
              <br />
              in{" "}
              <span className="relative">
                <span className="gradient-text">HD Quality</span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 12"
                  fill="none"
                >
                  <path
                    d="M2 8C50 2 150 2 198 8"
                    stroke="url(#underline-gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="underline-gradient" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#f09433" />
                      <stop offset="0.25" stopColor="#e6683c" />
                      <stop offset="0.5" stopColor="#dc2743" />
                      <stop offset="0.75" stopColor="#cc2366" />
                      <stop offset="1" stopColor="#bc1888" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-dark-400 max-w-2xl mx-auto mb-10">
              Paste any Instagram Reel URL and download it instantly. No app
              installation, no sign-up, no limits. Works on all devices.
            </p>

            {/* Download Form */}
            <DownloadForm />

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12 text-dark-400">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  10M+
                </div>
                <div className="text-sm">Reels Downloaded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  500K+
                </div>
                <div className="text-sm">Happy Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  4.9★
                </div>
                <div className="text-sm">User Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <Features />

        {/* How It Works */}
        <HowItWorks />

        {/* FAQ */}
        <FAQ />
      </main>

      <Footer />
    </div>
  )
}
