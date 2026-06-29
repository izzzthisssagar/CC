"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export function AuthHeader() {
  const { email, stub, signOut } = useAuth();
  if (stub) return null; // no auth in stub mode

  return (
    <header className="flex items-center justify-end gap-4 border-b border-neutral-900 px-6 py-2 text-sm">
      {email ? (
        <>
          <Link
            href="/library"
            className="text-neutral-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            Library
          </Link>
          <span className="text-neutral-400">{email}</span>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded px-2 py-1 text-neutral-300 hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            Sign out
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className="rounded px-2 py-1 text-neutral-300 hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
        >
          Sign in
        </Link>
      )}
    </header>
  );
}
