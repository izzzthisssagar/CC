"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

const navLink =
  "text-xs font-semibold uppercase tracking-[0.18em] text-muted transition hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

// Editorial masthead — always visible (the brand is the page's nameplate), with
// auth controls layered in when Supabase is configured.
export function AuthHeader() {
  const { email, stub, signOut } = useAuth();

  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-4 px-6 py-4">
        {/* Nameplate */}
        <Link href="/" className="group flex items-baseline gap-2.5">
          <span className="font-deva-display text-2xl leading-none text-brand-500">ने</span>
          <span className="font-display text-lg font-semibold leading-none tracking-tight text-fg">
            Nepali&nbsp;AI&nbsp;Caption
          </span>
          <span className="hidden text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-faint sm:inline">
            · काठमाडौँ
          </span>
        </Link>

        {/* Controls */}
        <nav className="flex items-center gap-5">
          {stub ? (
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-faint">
              Demo edition
            </span>
          ) : email ? (
            <>
              <Link href="/library" className={navLink}>
                Library
              </Link>
              <span className="hidden text-xs text-faint sm:inline">{email}</span>
              <button type="button" onClick={() => signOut()} className={navLink}>
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className={navLink}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
      {/* Masthead double rule. */}
      <div className="h-px bg-brand-700/40" />
    </header>
  );
}
