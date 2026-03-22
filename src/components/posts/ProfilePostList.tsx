"use client";

import { useState } from "react";
import { PostCard } from "@/components/posts/PostCard";
import { QuoteComposer } from "@/components/posts/QuoteComposer";
import type { FeedPost } from "@/lib/services/posts";

interface ProfilePostListProps {
  initialPosts: FeedPost[];
  currentUserId: number | null;
  emptyMessage: string;
}

export function ProfilePostList({
  initialPosts,
  currentUserId,
  emptyMessage,
}: ProfilePostListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [quotingPost, setQuotingPost] = useState<FeedPost | null>(null);

  const handleDelete = async (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) {
        setPosts(initialPosts);
      }
    } catch {
      setPosts(initialPosts);
    }
  };

  const handleLike = async (postId: number) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId || p.originalPostId === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p
      )
    );
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) {
        setPosts(initialPosts);
      }
    } catch {
      setPosts(initialPosts);
    }
  };

  const handleRetweet = async (postId: number) => {
    const target = posts.find(
      (p) => p.id === postId || p.originalPostId === postId
    );
    if (!target) return;

    const method = target.repostedByMe ? "DELETE" : "POST";

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId || p.originalPostId === postId
          ? {
              ...p,
              repostedByMe: !p.repostedByMe,
              repostCount: p.repostedByMe
                ? p.repostCount - 1
                : p.repostCount + 1,
            }
          : p
      )
    );
    try {
      const res = await fetch(`/api/posts/${postId}/retweet`, { method });
      if (!res.ok) {
        setPosts(initialPosts);
      }
    } catch {
      setPosts(initialPosts);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onDelete={handleDelete}
          onLike={handleLike}
          onRetweet={handleRetweet}
          onReply={(id) => {
            // PostCard manages reply composer state internally
          }}
          onQuote={(id) => {
            const target = posts.find((p) => p.id === id);
            if (target) setQuotingPost(target);
          }}
        />
      ))}

      {quotingPost && (
        <QuoteComposer
          originalPost={{
            id: quotingPost.id,
            content: quotingPost.content,
            authorUsername: quotingPost.authorUsername,
            authorDisplayName: quotingPost.authorDisplayName,
            createdAt: quotingPost.createdAt,
          }}
          isOpen={!!quotingPost}
          onClose={() => setQuotingPost(null)}
        />
      )}
    </div>
  );
}
