import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getUserByUsername,
  getUserPosts,
  getUserPostCount,
} from "@/lib/services/posts";
import { ProfilePostList } from "@/components/posts/ProfilePostList";
import { NavBar } from "@/components/nav/NavBar";

export default async function ProfilePage(
  props: { params: Promise<{ username: string }> }
) {
  const { username } = await props.params;
  const session = await getSession();
  const currentUsername = (session?.user as any)?.username || "user";
  const currentUserId = Number((session?.user as any)?.id);

  const user = getUserByUsername(username);
  if (!user) notFound();

  const userPosts = getUserPosts(username, 1, currentUserId);
  const postCount = getUserPostCount(username);

  return (
    <div className="min-h-screen bg-white">
      <NavBar username={currentUsername} />

      <main className="mx-auto max-w-[600px]">
        {/* Profile header: @username and post count */}
        <div className="border-b border-gray-200 px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">
            @{user.username}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {postCount} {postCount === 1 ? "post" : "posts"}
          </p>
        </div>

        {/* User's posts with delete support */}
        <ProfilePostList
          initialPosts={userPosts}
          currentUserId={currentUserId}
          emptyMessage={`@${user.username} hasn't posted yet.`}
        />
      </main>
    </div>
  );
}
