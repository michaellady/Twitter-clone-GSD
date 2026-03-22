"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PostCard } from "@/components/posts/PostCard";
import { QuoteComposer } from "@/components/posts/QuoteComposer";
import type { FeedPost } from "@/lib/services/posts";

interface PostFeedProps {
  initialPosts: FeedPost[];
  currentUserId: number | null;
}

export function PostFeed({ initialPosts, currentUserId }: PostFeedProps) {
  const [quotingPost, setQuotingPost] = useState<FeedPost | null>(null);
  const queryClient = useQueryClient();

  const {
    data: posts = [],
    error,
    isError,
  } = useQuery<FeedPost[]>({
    queryKey: ["posts", "feed"],
    queryFn: () =>
      fetch("/api/posts").then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch posts: ${r.status}`);
        return r.json();
      }),
    initialData: initialPosts,
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: number) =>
      fetch(`/api/posts/${postId}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete post");
        return r.json();
      }),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts", "feed"] });
      const prev = queryClient.getQueryData<FeedPost[]>(["posts", "feed"]);
      queryClient.setQueryData<FeedPost[]>(["posts", "feed"], (old) =>
        old ? old.filter((p) => p.id !== postId) : []
      );
      return { prev };
    },
    onError: (_err, _postId, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["posts", "feed"], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: (postId: number) =>
      fetch(`/api/posts/${postId}/like`, { method: "POST" }).then((r) => {
        if (!r.ok) throw new Error("Failed to toggle like");
        return r.json();
      }),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts", "feed"] });
      const prev = queryClient.getQueryData<FeedPost[]>(["posts", "feed"]);
      queryClient.setQueryData<FeedPost[]>(["posts", "feed"], (old) =>
        old?.map((p) =>
          p.id === postId || p.originalPostId === postId
            ? {
                ...p,
                likedByMe: !p.likedByMe,
                likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
              }
            : p
        ) ?? []
      );
      return { prev };
    },
    onError: (_err, _postId, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["posts", "feed"], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const retweetMutation = useMutation({
    mutationFn: async ({
      postId,
      repostedByMe,
    }: {
      postId: number;
      repostedByMe: boolean;
    }) => {
      const method = repostedByMe ? "DELETE" : "POST";
      const r = await fetch(`/api/posts/${postId}/retweet`, { method });
      if (!r.ok) throw new Error("Failed to toggle retweet");
      return r.json();
    },
    onMutate: async ({ postId, repostedByMe }) => {
      await queryClient.cancelQueries({ queryKey: ["posts", "feed"] });
      const prev = queryClient.getQueryData<FeedPost[]>(["posts", "feed"]);
      queryClient.setQueryData<FeedPost[]>(["posts", "feed"], (old) =>
        old?.map((p) =>
          p.id === postId || p.originalPostId === postId
            ? {
                ...p,
                repostedByMe: !p.repostedByMe,
                repostCount: repostedByMe
                  ? p.repostCount - 1
                  : p.repostCount + 1,
              }
            : p
        ) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["posts", "feed"], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // Error state
  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-slate-500">
          {error?.message?.includes("401")
            ? "Your session has expired. Please log in again."
            : "Unable to load posts. Please try again."}
        </p>
      </div>
    );
  }

  // Empty feed message
  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-slate-500">
          No posts yet. Be the first to share something!
        </p>
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
          onDelete={(id) => deleteMutation.mutate(id)}
          onLike={(id) => likeMutation.mutate(id)}
          onRetweet={(id) => {
            const target = posts.find(
              (p) => p.id === id || p.originalPostId === id
            );
            if (target) {
              retweetMutation.mutate({
                postId: id,
                repostedByMe: target.repostedByMe,
              });
            }
          }}
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
