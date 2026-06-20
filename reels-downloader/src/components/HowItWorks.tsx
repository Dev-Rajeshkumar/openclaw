export default function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Copy the Reel URL",
      description:
        'Open Instagram, find the reel you want, tap "Share" → "Copy Link".',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      step: "02",
      title: "Paste the Link",
      description:
        "Come back here and paste the URL into the input box above. Click Paste if you've already copied it.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      step: "03",
      title: "Download Instantly",
      description:
        "Hit the Download button and get your reel video in HD quality. Save it to your device and enjoy!",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
    },
  ]

  return (
    <section id="how-it-works" className="py-20 px-4 relative">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-dark-400 max-w-xl mx-auto">
            Three simple steps to download any Instagram Reel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center group">
              {/* Connector line (hidden on last item and mobile) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-px bg-gradient-to-r from-pink-500/30 to-purple-500/30" />
              )}

              {/* Step number circle */}
              <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full glass mb-6 group-hover:border-pink-500/30 transition-colors">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-600/10 group-hover:from-pink-500/20 group-hover:to-purple-600/20 transition-colors" />
                <div className="text-pink-400 relative">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {i + 1}
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-dark-400 text-sm leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
