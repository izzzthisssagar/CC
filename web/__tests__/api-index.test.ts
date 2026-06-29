/**
 * @jest-environment node
 */
import { POST } from "@/app/api/index/route";
import { getSupabaseAdmin } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({ getSupabaseAdmin: jest.fn() }));

const mockAdmin = getSupabaseAdmin as jest.Mock;
const req = (body: unknown) => ({ json: async () => body }) as any;
const words = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ word: `w${i}`, start: i, end: i + 1 }));

describe("POST /api/index", () => {
  beforeEach(() => jest.clearAllMocks());

  it("400s without videoId or words", async () => {
    expect((await POST(req({ videoId: "v1" }))).status).toBe(400);
    expect((await POST(req({ words: words(3) }))).status).toBe(400);
  });

  it("acknowledges stub mode when no admin client", async () => {
    mockAdmin.mockReturnValue(null);
    const res = await POST(req({ videoId: "v1", words: words(3) }));
    expect(await res.json()).toEqual({ indexed: 0, stub: true });
  });

  it("clears then inserts chunk rows with 768-dim embeddings", async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn(() => ({ eq }));
    const insert = jest.fn().mockResolvedValue({ error: null });
    mockAdmin.mockReturnValue({ from: () => ({ delete: del, insert }) });

    const res = await POST(req({ videoId: "v1", words: words(40) }));
    const json = await res.json();

    expect(json.indexed).toBeGreaterThan(0);
    expect(del).toHaveBeenCalled(); // idempotent re-index clears first
    expect(eq).toHaveBeenCalledWith("video_id", "v1");
    const rows = insert.mock.calls[0][0];
    expect(rows[0]).toMatchObject({ video_id: "v1" });
    expect(rows[0].embedding).toHaveLength(768);
  });

  it("returns indexed:0 for an empty transcript", async () => {
    mockAdmin.mockReturnValue({ from: jest.fn() });
    const res = await POST(req({ videoId: "v1", words: [] }));
    expect(await res.json()).toEqual({ indexed: 0 });
  });
});
