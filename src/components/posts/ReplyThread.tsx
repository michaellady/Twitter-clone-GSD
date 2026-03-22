"use client";

import { useQuery } from "@tanstack/react-query";
import { PostCard } from "./PostCard";
import type { FeedPost } from "@/lib/services/posts";

interface ReplyThreadProps {
  parentPostId: number;
  currentUserId: number | null;
  onLike: (postId: number) => void;
  onRetweet: (postId: number, repostedByMe: boolean) => void;
}

export function ReplyThread({
  parentPostId,
  currentUserId,
  onLike,
  onRetweet,
}: ReplyThreadProps) {
  const {
    data: replies = [],
    isLoading,
  } = useQuery<FeedPost[]>({
    queryKey: ["posts", parentPostId, "replies"],
    queryFn: () =>
      fetch(`/api/posts/${parentPostId}/replies`).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch replies");
        return r.json();
      }),
  });

  if (isLoading) {
    return (
      <p className="px-4 py-2 text-sm text-slate-400">Loading replies...</p>
    );
  }

  if (replies.length === 0) {
    return null;
  }

  return (
    <div>
      {replies.map((reply) => (
        <div key={reply.id} className="ml-8 border-l-2 border-gray-200">
          <PostCard
            post={reply}
            currentUserId={currentUserId}
            onLike={onLike}
            onRetweet={(id) => {
              const target = replies.find(
                (r) => r.id === id || r.originalPostId === id
              );
              if (target) onRetweet(id, target.repostedByMe);
            }}
          />
        </div>
      ))}
    </div>
  );
}
