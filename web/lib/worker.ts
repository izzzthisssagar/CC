// Client for the async, job-based worker (submit → poll).
// In stub mode the worker returns mock results; the poll loop is identical.

const WORKER_URL = process.env.WORKER_URL ?? "http://localhost:8000";

export type Word = { word: string; start: number; end: number };
export type JobState = {
  job_id: string;
  kind: string;
  status: "queued" | "running" | "done" | "error";
  result: Record<string, unknown> | null;
  error: string | null;
};

async function submit(path: string, body: unknown): Promise<string> {
  const res = await fetch(`${WORKER_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status !== 202) throw new Error(`worker ${path} ${res.status}`);
  return (await res.json()).job_id as string;
}

/** Poll a job to completion. Returns its result or throws on error/timeout. */
export async function pollJob(
  jobId: string,
  { intervalMs = 1500, timeoutMs = 300_000 } = {}
): Promise<Record<string, unknown>> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${WORKER_URL}/jobs/${jobId}`);
    if (!res.ok) throw new Error(`worker /jobs ${res.status}`);
    const job = (await res.json()) as JobState;
    if (job.status === "done") return job.result ?? {};
    if (job.status === "error") throw new Error(job.error ?? "job failed");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("job timed out");
}

export async function transcribe(
  videoUrl: string,
  opts: { provider?: string; language?: string } = {}
): Promise<{ words: Word[]; language: string }> {
  const jobId = await submit("/transcribe", {
    video_url: videoUrl,
    provider: opts.provider,
    language: opts.language,
  });
  const result = await pollJob(jobId);
  return result as { words: Word[]; language: string };
}

export async function exportVideo(
  videoUrl: string,
  words: Word[],
  style: Record<string, unknown>
): Promise<{ mp4_url: string; srt_url: string }> {
  const jobId = await submit("/export", { video_url: videoUrl, words, style });
  const result = await pollJob(jobId);
  return result as { mp4_url: string; srt_url: string };
}
