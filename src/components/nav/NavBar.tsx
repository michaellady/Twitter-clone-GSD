"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export function NavBar({ username }: { username: string }) {
  return (
    <nav className="flex h-14 items-center justify-between border-b border-gray-300 bg-white px-4">
      <span className="text-xl font-semibold text-slate-900">Chirp</span>
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${username}`}
          className="text-sm text-slate-500 hover:underline"
        >
          @{username}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
