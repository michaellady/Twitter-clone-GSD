import { getSession } from "@/lib/auth/session";
import { getFeedPosts } from "@/lib/services/posts";
import { TweetComposer } from "@/components/posts/TweetComposer";
import { PostFeed } from "@/components/posts/PostFeed";
import { NavBar } from "@/components/nav/NavBar";

export default async function FeedPage() {
  const session = await getSession();
  const username = (session?.user as any)?.username || "user";
  const userId = Number((session?.user as any)?.id);
  const posts = getFeedPosts(1, userId);

  return (
    <div className="min-h-screen bg-white">
      <NavBar username={username} />

      <main className="mx-auto max-w-[600px]">
        {/* Compose box at top of feed, always visible */}
        <TweetComposer />
        {/* Posts newest-first */}
        <PostFeed initialPosts={posts} currentUserId={userId} />
      </main>
    </div>
  );
}
