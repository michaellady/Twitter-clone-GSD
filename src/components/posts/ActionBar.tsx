"use client";

import { Heart, MessageCircle, Repeat2, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionBarProps {
  postId: number;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  likedByMe: boolean;
  repostedByMe: boolean;
  isOwnPost: boolean;
  onLike: (postId: number) => void;
  onReply: (postId: number) => void;
  onRetweet: (postId: number) => void;
  onQuote: (postId: number) => void;
}

export function ActionBar({
  postId,
  likeCount,
  replyCount,
  repostCount,
  likedByMe,
  repostedByMe,
  isOwnPost,
  onLike,
  onReply,
  onRetweet,
  onQuote,
}: ActionBarProps) {
  return (
    <div className="flex items-center gap-6">
      {/* Reply button */}
      <button
        onClick={() => onReply(postId)}
        className={cn(
          "flex items-center gap-1 text-sm transition-colors",
          "text-slate-400 hover:text-blue-500"
        )}
        aria-label="Reply"
      >
        <MessageCircle size={16} />
        {replyCount > 0 && <span>{replyCount}</span>}
      </button>

      {/* Retweet button */}
      <button
        onClick={() => onRetweet(postId)}
        disabled={isOwnPost}
        className={cn(
          "flex items-center gap-1 text-sm transition-colors",
          isOwnPost
            ? "cursor-not-allowed text-slate-300"
            : repostedByMe
              ? "text-green-500"
              : "text-slate-400 hover:text-green-500"
        )}
        aria-label="Retweet"
      >
        <Repeat2 size={16} />
        {repostCount > 0 && <span>{repostCount}</span>}
      </button>

      {/* Like button */}
      <button
        onClick={() => onLike(postId)}
        className={cn(
          "flex items-center gap-1 text-sm transition-colors",
          likedByMe
            ? "text-red-500"
            : "text-slate-400 hover:text-red-500"
        )}
        aria-label="Like"
      >
        <Heart
          size={16}
          fill={likedByMe ? "currentColor" : "none"}
        />
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>

      {/* Quote button */}
      <button
        onClick={() => onQuote(postId)}
        className={cn(
          "flex items-center gap-1 text-sm transition-colors",
          "text-slate-400 hover:text-blue-500"
        )}
        aria-label="Quote"
      >
        <Quote size={16} />
      </button>
    </div>
  );
}
