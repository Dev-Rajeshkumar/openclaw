import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t border-dark-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                R
              </div>
              <span className="text-xl font-bold">
                Reels<span className="gradient-text">Grab</span>
              </span>
            </Link>
            <p className="text-dark-400 text-sm max-w-sm">
              The fastest and easiest way to download Instagram Reels in HD
              quality. Free, private, and no login required.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-dark-400 hover:text-white text-sm transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-dark-400 hover:text-white text-sm transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#faq" className="text-dark-400 hover:text-white text-sm transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-dark-400 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-dark-400 hover:text-white text-sm transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-dark-400 hover:text-white text-sm transition-colors">
                  DMCA
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-dark-500 text-sm">
            © {new Date().getFullYear()} ReelsGrab. All rights reserved.
          </p>
          <p className="text-dark-500 text-xs">
            Not affiliated with Instagram or Meta. For personal use only.
          </p>
        </div>
      </div>
    </footer>
  )
}
