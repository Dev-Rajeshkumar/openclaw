"use client"

import { useState } from "react"
import Link from "next/link"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-pink-500/25 transition-shadow">
            R
          </div>
          <span className="text-xl font-bold">
            Reels<span className="gradient-text">Grab</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-dark-300 hover:text-white transition-colors text-sm"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-dark-300 hover:text-white transition-colors text-sm"
          >
            How It Works
          </a>
          <a
            href="#faq"
            className="text-dark-300 hover:text-white transition-colors text-sm"
          >
            FAQ
          </a>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-dark-300 hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-4 space-y-3">
          <a
            href="#features"
            className="block text-dark-300 hover:text-white transition-colors text-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="block text-dark-300 hover:text-white transition-colors text-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            How It Works
          </a>
          <a
            href="#faq"
            className="block text-dark-300 hover:text-white transition-colors text-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            FAQ
          </a>
        </div>
      )}
    </header>
  )
}
