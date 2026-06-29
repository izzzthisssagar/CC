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

  if (!ready) return <main className="mx-auto max-w-3xl px-6 py-24 text-neutral-500">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your videos</h1>
        <Link
          href="/upload"
          className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
        >
          Upload
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 text-neutral-500">Loading…</p>
      ) : videos.length === 0 ? (
        <p className="mt-8 text-neutral-400">
          No videos yet.{" "}
          <Link href="/upload" className="underline">
            Upload your first
          </Link>{" "}
          to get captions.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-800 rounded-xl border border-neutral-800">
          {videos.map((v) => {
            const name = v.storage_path.split("/").pop() ?? v.id;
            const href = `/editor/${v.id}?src=${encodeURIComponent(videoPublicUrl(v.storage_path))}`;
            return (
              <li key={v.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{name}</p>
                  <p className="text-xs text-neutral-500">
                    {v.status} · {new Date(v.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-2">
                  <Link
                    href={href}
                    className="rounded border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                  >
                    Open
                  </Link>
                  {confirmId === v.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onDelete(v)}
                        className="rounded bg-red-500 px-2 py-1 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="rounded px-2 py-1 text-sm text-neutral-400 hover:bg-neutral-900"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(v.id)}
                      aria-label={`Delete ${name}`}
                      className="rounded border border-neutral-800 px-2 py-1 text-sm text-neutral-500 hover:border-red-500 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
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
