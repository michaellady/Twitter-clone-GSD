"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { EmbeddedPost } from "./EmbeddedPost";

interface QuoteComposerProps {
  originalPost: {
    id: number;
    content: string | null;
    authorUsername: string;
    authorDisplayName: string | null;
    createdAt: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function QuoteComposer({
  originalPost,
  isOpen,
  onClose,
}: QuoteComposerProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();

  const remaining = 280 - content.length;
  const isDisabled =
    content.trim().length === 0 || remaining < 0 || isSubmitting;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleSubmit = async () => {
    if (isDisabled) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          repostOfId: originalPost.id,
        }),
      });
      if (res.ok) {
        setContent("");
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        onClose();
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
    <dialog
      ref={dialogRef}
      className="m-auto max-w-lg bg-transparent p-0 backdrop:bg-black/50"
    >
      <div className="w-full rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quote Tweet</h2>
          <button
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment"
          rows={3}
          className="w-full resize-none bg-transparent text-base outline-none placeholder:text-slate-400"
        />

        {/* Embedded original post preview */}
        <EmbeddedPost
          authorUsername={originalPost.authorUsername}
          authorDisplayName={originalPost.authorDisplayName}
          content={originalPost.content}
          createdAt={originalPost.createdAt}
        />

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

        {/* Footer with character counter and post button */}
        <div className="mt-4 flex items-center justify-between">
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
    </dialog>
  );
}
