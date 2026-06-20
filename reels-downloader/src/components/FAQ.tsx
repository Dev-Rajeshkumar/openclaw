"use client"

import { useState } from "react"

const faqs = [
  {
    question: "Is ReelsGrab free to use?",
    answer:
      "Yes! ReelsGrab is 100% free. There are no hidden charges, premium plans, or download limits. You can download as many reels as you want.",
  },
  {
    question: "Do I need to log in to my Instagram account?",
    answer:
      "No, you don't need to log in or provide any credentials. Simply paste the public reel URL and download. Your privacy is completely protected.",
  },
  {
    question: "What video quality can I download?",
    answer:
      "We provide the highest available quality for each reel, typically up to 1080p HD. The quality depends on the original upload by the creator.",
  },
  {
    question: "Can I download reels on my phone?",
    answer:
      "Absolutely! ReelsGrab works on all devices — desktop, tablet, and mobile. Just open this website in your mobile browser and follow the same steps.",
  },
  {
    question: "Is it legal to download Instagram reels?",
    answer:
      "Downloading publicly available content for personal use is generally acceptable. However, always respect copyright and don't redistribute content without permission from the original creator.",
  },
  {
    question: "Why is my download not working?",
    answer:
      "Make sure the URL is correct and the reel is from a public account. Private account reels cannot be downloaded. Also check your internet connection and try again.",
  },
  {
    question: "Can I download Instagram posts and stories too?",
    answer:
      "Currently, ReelsGrab focuses on Instagram Reels. Support for posts, stories, and IGTV may be added in future updates.",
  },
]

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-dark-800 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-white font-medium pr-4 group-hover:text-pink-400 transition-colors">
          {question}
        </span>
        <svg
          className={`w-5 h-5 text-dark-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-pink-400" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-48 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-dark-400 text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-dark-400">
            Got questions? We've got answers.
          </p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8">
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
