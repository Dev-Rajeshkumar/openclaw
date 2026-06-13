'use client';

import { useState, useCallback } from 'react';

type ReactionType = 'like' | 'love' | 'laugh' | 'insightful' | 'curious';

interface ReactionConfig {
  emoji: string;
  label: string;
  color: string;
  activeColor: string;
}

const reactions: Record<ReactionType, ReactionConfig> = {
  like: { emoji: '👍', label: 'Like', color: 'hover:bg-blue-50 dark:hover:bg-blue-950', activeColor: 'bg-blue-100 dark:bg-blue-900 ring-blue-400' },
  love: { emoji: '❤️', label: 'Love', color: 'hover:bg-red-50 dark:hover:bg-red-950', activeColor: 'bg-red-100 dark:bg-red-900 ring-red-400' },
  laugh: { emoji: '😂', label: 'Laugh', color: 'hover:bg-yellow-50 dark:hover:bg-yellow-950', activeColor: 'bg-yellow-100 dark:bg-yellow-900 ring-yellow-400' },
  insightful: { emoji: '💡', label: 'Insightful', color: 'hover:bg-amber-50 dark:hover:bg-amber-950', activeColor: 'bg-amber-100 dark:bg-amber-900 ring-amber-400' },
  curious: { emoji: '🤔', label: 'Curious', color: 'hover:bg-purple-50 dark:hover:bg-purple-950', activeColor: 'bg-purple-100 dark:bg-purple-900 ring-purple-400' },
};

interface ReactionBarProps {
  postId: string;
  initialCounts?: Partial<Record<ReactionType, number>>;
  initialUserReaction?: ReactionType | null;
}

export function ReactionBar({ postId, initialCounts, initialUserReaction }: ReactionBarProps) {
  const [counts, setCounts] = useState<Record<ReactionType, number>>(() => {
    const defaults: Record<ReactionType, number> = { like: 0, love: 0, laugh: 0, insightful: 0, curious: 0 };
    return initialCounts ? { ...defaults, ...initialCounts } : defaults;
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(initialUserReaction || null);
  const [animating, setAnimating] = useState<ReactionType | null>(null);

  const handleReaction = useCallback(async (type: ReactionType) => {
    const previousReaction = userReaction;

    // Optimistic update
    if (previousReaction === type) {
      setUserReaction(null);
      setCounts((prev) => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
    } else {
      setUserReaction(type);
      setCounts((prev) => {
        const next = { ...prev, [type]: prev[type] + 1 };
        if (previousReaction) {
          next[previousReaction] = Math.max(0, next[previousReaction] - 1);
        }
        return next;
      });
    }

    // Animate
    setAnimating(type);
    setTimeout(() => setAnimating(null), 400);

    // API call
    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, type, active: previousReaction !== type }),
      });
    } catch {
      // Revert on error
      setUserReaction(previousReaction);
      setCounts((prev) => {
        const next = { ...prev };
        if (previousReaction === type) {
          next[type] = prev[type] + 1;
        } else {
          next[type] = Math.max(0, prev[type] - 1);
          if (previousReaction) next[previousReaction] = prev[previousReaction] + 1;
        }
        return next;
      });
    }
  }, [postId, userReaction]);

  const totalReactions = Object.values(counts).reduce((sum, c) => sum + c, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {(Object.keys(reactions) as ReactionType[]).map((type) => {
          const config = reactions[type];
          const isActive = userReaction === type;
          const isAnimating = animating === type;

          return (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                border border-gray-200 dark:border-gray-700 transition-all duration-200
                ${config.color}
                ${isActive ? `${config.activeColor} ring-1` : 'bg-transparent'}
                ${isAnimating ? 'scale-110' : 'scale-100'}
              `}
              aria-label={`${config.label}${isActive ? ' (active)' : ''}`}
              aria-pressed={isActive}
            >
              <span className={`transition-transform duration-200 ${isAnimating ? 'animate-bounce' : ''}`}>
                {config.emoji}
              </span>
              {counts[type] > 0 && (
                <span className="tabular-nums text-xs">{counts[type]}</span>
              )}
            </button>
          );
        })}
      </div>
      {totalReactions > 0 && (
        <p className="text-xs text-gray-500">{totalReactions} reaction{totalReactions !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
