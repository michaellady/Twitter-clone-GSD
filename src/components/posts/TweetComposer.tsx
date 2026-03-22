"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export function TweetComposer() {
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
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        setContent("");
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      } else {
        const data = await res.json();
        setError(
          data.error?.content?.[0] || "Failed to post. Please try again."
        );
      }
    } catch {
      setError("Failed to post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-b border-gray-300 p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening?"
        rows={3}
        className="w-full resize-none bg-transparent text-lg outline-none placeholder:text-slate-400"
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
        <button
          onClick={handleSubmit}
          disabled={isDisabled}
          className={cn(
            "rounded-full bg-[var(--color-accent)] px-4 py-1.5 text-sm font-semibold text-white",
            "hover:bg-[var(--color-accent-hover)]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          Post
        </button>
      </div>
    </div>
  );
}
