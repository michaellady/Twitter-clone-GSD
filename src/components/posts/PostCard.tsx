"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionBar } from "./ActionBar";
import { EmbeddedPost } from "./EmbeddedPost";
import { ReplyComposer } from "./ReplyComposer";
import { ReplyThread } from "./ReplyThread";
import type { FeedPost } from "@/lib/services/posts";

interface PostCardProps {
  post: FeedPost;
  currentUserId: number | null;
  onDelete?: (postId: number) => void;
  onLike?: (postId: number) => void;
  onReply?: (postId: number) => void;
  onRetweet?: (postId: number) => void;
  onQuote?: (postId: number) => void;
}

export function PostCard({
  post,
  currentUserId,
  onDelete,
  onLike,
  onReply,
  onRetweet,
  onQuote,
}: PostCardProps) {
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const isOwnPost = currentUserId === post.userId;
  const isPlainRetweet = post.repostOfId !== null && post.content === null;
  const isQuoteTweet = post.repostOfId !== null && post.content !== null;

  // For plain retweets, ActionBar targets the original post
  const actionBarPostId = isPlainRetweet
    ? (post.originalPostId ?? post.id)
    : post.id;

  return (
    <article className="border-b border-gray-200 px-4 py-3">
      {/* Plain retweet header */}
      {isPlainRetweet && (
        <div className="mb-1 flex items-center gap-1 text-sm text-slate-500">
          <Repeat2 size={14} />
          <span>@{post.authorUsername} retweeted</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {/* Header row: display name + @username + timestamp + delete */}
          <div className="flex items-center gap-1 text-sm">
            <span className="truncate font-semibold text-slate-900">
              {isPlainRetweet
                ? (post.originalAuthorDisplayName || post.originalAuthorUsername)
                : (post.authorDisplayName || post.authorUsername)}
            </span>
            <Link
              href={`/profile/${isPlainRetweet ? post.originalAuthorUsername : post.authorUsername}`}
              className="shrink-0 text-slate-500 hover:underline"
            >
              @{isPlainRetweet ? post.originalAuthorUsername : post.authorUsername}
            </Link>
            <span className="text-slate-400">&middot;</span>
            <span className="shrink-0 text-slate-400">
              {formatDistanceToNow(
                new Date(
                  isPlainRetweet && post.originalCreatedAt
                    ? post.originalCreatedAt
                    : post.createdAt
                ),
                { addSuffix: true }
              )}
            </span>

            {/* Delete button in header (own posts only) */}
            {isOwnPost && onDelete && (
              <button
                onClick={() => onDelete(post.id)}
                className="ml-auto flex items-center text-slate-400 transition-colors hover:text-red-500"
                aria-label="Delete post"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Post content */}
          <p className="mt-1 whitespace-pre-wrap break-words text-slate-900">
            {isPlainRetweet ? post.originalContent : post.content}
          </p>

          {/* Embedded original post for quote-tweets */}
          {isQuoteTweet && post.originalAuthorUsername && post.originalCreatedAt && (
            <EmbeddedPost
              authorUsername={post.originalAuthorUsername}
              authorDisplayName={post.originalAuthorDisplayName ?? null}
              content={post.originalContent ?? null}
              createdAt={post.originalCreatedAt}
            />
          )}

          {/* Action bar */}
          <div className="mt-2 flex items-center gap-4">
            <ActionBar
              postId={actionBarPostId}
              likeCount={post.likeCount}
              replyCount={post.replyCount}
              repostCount={post.repostCount}
              likedByMe={post.likedByMe}
              repostedByMe={post.repostedByMe}
              isOwnPost={isPlainRetweet
                ? currentUserId !== null && post.originalAuthorUsername === post.authorUsername
                : isOwnPost}
              onLike={onLike ?? (() => {})}
              onReply={onReply !== undefined
                ? () => setShowReplyComposer(!showReplyComposer)
                : () => {}}
              onRetweet={onRetweet ?? (() => {})}
              onQuote={onQuote ?? (() => {})}
            />
          </div>

          {/* Show/Hide replies toggle */}
          {post.replyCount > 0 && !showReplies && !showReplyComposer && (
            <button
              onClick={() => setShowReplies(true)}
              className="mt-1 text-sm text-blue-500 hover:underline"
            >
              Show replies ({post.replyCount})
            </button>
          )}
          {showReplies && (
            <button
              onClick={() => setShowReplies(false)}
              className="mt-1 text-sm text-blue-500 hover:underline"
            >
              Hide replies
            </button>
          )}

          {/* Inline reply composer */}
          {showReplyComposer && (
            <ReplyComposer
              parentPostId={post.id}
              parentAuthorUsername={post.authorUsername}
              onReplySubmitted={() => {
                setShowReplyComposer(false);
                setShowReplies(true);
              }}
              onCancel={() => setShowReplyComposer(false)}
            />
          )}

          {/* Reply thread */}
          {showReplies && post.replyCount > 0 && (
            <ReplyThread
              parentPostId={post.id}
              currentUserId={currentUserId}
              onLike={onLike ?? (() => {})}
              onRetweet={(id, repostedByMe) => onRetweet?.(id)}
            />
          )}
        </div>
      </div>
    </article>
  );
}
