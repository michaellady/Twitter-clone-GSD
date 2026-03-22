"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface ReplyComposerProps {
  parentPostId: number;
  parentAuthorUsername: string;
  onReplySubmitted: () => void;
  onCancel: () => void;
}

export function ReplyComposer({
  parentPostId,
  parentAuthorUsername,
  onReplySubmitted,
  onCancel,
}: ReplyComposerProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const remaining = 280 - content.length;
  const isDisabled =
    content.trim().length === 0 || remaining < 0 || isSubmitting;

  const handleSubmit = async () => {
    if (isDisabled) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${parentPostId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        setContent("");
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        onReplySubmitted();
      } else {
        const data = await res.json();
        setError(
          data.error?.content?.[0] || "Failed to reply. Please try again."
        );
      }
    } catch {
      setError("Failed to reply. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t border-gray-100 px-4 py-3">
      <p className="mb-2 text-sm text-slate-500">
        Replying to @{parentAuthorUsername}
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Post your reply"
        rows={2}
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-slate-400"
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      <div className="mt-2 flex items-center justify-between">
        <span
          className={cn(
            "text-sm",
            remaining <= 0
              ? "font-semibold text-red-500"
              : remaining <= 20
                ? "text-yellow-500"
                : "text-slate-400"
          )}
        >
          {remaining}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className={cn(
              "rounded-full bg-[var(--color-accent)] px-4 py-1.5 text-sm font-semibold text-white",
              "hover:bg-[var(--color-accent-hover)]",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}
