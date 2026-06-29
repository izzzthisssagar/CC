/**
 * @jest-environment node
 */
import { POST } from "@/app/api/corrections/route";
import { getSupabaseAdmin } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({ getSupabaseAdmin: jest.fn() }));

const mockAdmin = getSupabaseAdmin as jest.Mock;
const req = (body: unknown) => ({ json: async () => body }) as any;

describe("POST /api/corrections", () => {
  beforeEach(() => jest.clearAllMocks());

  it("400s on a no-op correction (corrected === original)", async () => {
    const res = await POST(req({ word_index: 0, original_text: "x", corrected_text: "x" }));
    expect(res.status).toBe(400);
  });

  it("400s when word_index is not a number", async () => {
    const res = await POST(req({ corrected_text: "नमस्ते" }));
    expect(res.status).toBe(400);
  });

  it("acknowledges stub mode when Supabase is unconfigured", async () => {
    mockAdmin.mockReturnValue(null);
    const res = await POST(req({ word_index: 1, original_text: "video", corrected_text: "भिडियो" }));
    expect(await res.json()).toEqual({ stored: false, stub: true });
  });

  it("inserts a valid correction via the admin client", async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    mockAdmin.mockReturnValue({ from: () => ({ insert }) });
    const res = await POST(
      req({ word_index: 2, original_text: "guys", corrected_text: "साथी", start_s: 1, end_s: 1.5 })
    );
    expect(await res.json()).toEqual({ stored: true });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ word_index: 2, corrected_text: "साथी" })
    );
  });

  it("surfaces a DB error as 500", async () => {
    const insert = jest.fn().mockResolvedValue({ error: { message: "boom" } });
    mockAdmin.mockReturnValue({ from: () => ({ insert }) });
    const res = await POST(req({ word_index: 0, original_text: "a", corrected_text: "ब" }));
    expect(res.status).toBe(500);
  });
});
