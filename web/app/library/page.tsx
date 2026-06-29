"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/components/AuthProvider";
import { listVideos, videoPublicUrl, deleteVideo, type VideoRow } from "@/lib/videos";

export default function LibraryPage() {
  const { ready } = useRequireAuth();
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    listVideos().then((v) => {
      setVideos(v);
      setLoading(false);
    });
  }, []);

  async function onDelete(v: VideoRow) {
    setVideos((vs) => vs.filter((x) => x.id !== v.id)); // optimistic
    setConfirmId(null);
    try {
      await deleteVideo(v.id, v.storage_path);
    } catch {
      listVideos().then(setVideos); // restore on failure
    }
  }

  if (!ready) return <main className="mx-auto max-w-3xl px-6 py-24 text-faint">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-end justify-between border-b border-rule pb-5">
        <div>
          <span className="kicker">The archive</span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Your videos</h1>
        </div>
        <Link
          href="/upload"
          className="rounded-sm bg-brand-600 px-4 py-2 text-sm font-semibold text-paper transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          Upload
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 text-faint">Loading…</p>
      ) : videos.length === 0 ? (
        <p className="mt-8 text-muted">
          No videos yet.{" "}
          <Link href="/upload" className="text-saffron underline decoration-saffron/40 underline-offset-2">
            Upload your first
          </Link>{" "}
          to get captions.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-rule border-y border-rule">
          {videos.map((v) => {
            const name = v.storage_path.split("/").pop() ?? v.id;
            const href = `/editor/${v.id}?src=${encodeURIComponent(videoPublicUrl(v.storage_path))}`;
            return (
              <li key={v.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-medium text-fg">{name}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-faint">
                    {v.status} · {new Date(v.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-2">
                  <Link
                    href={href}
                    className="rounded-sm border border-rule px-3 py-1 text-sm text-fg transition hover:border-saffron/60 hover:text-saffron focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
                  >
                    Open
                  </Link>
                  {confirmId === v.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onDelete(v)}
                        className="rounded-sm bg-brand-600 px-2.5 py-1 text-sm font-semibold text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="rounded-sm px-2.5 py-1 text-sm text-muted transition hover:text-fg"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(v.id)}
                      aria-label={`Delete ${name}`}
                      className="rounded-sm border border-rule px-2.5 py-1 text-sm text-faint transition hover:border-brand-500 hover:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
