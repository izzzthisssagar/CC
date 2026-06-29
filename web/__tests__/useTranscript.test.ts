import { renderHook, act, waitFor } from "@testing-library/react";
import { useTranscript, MOCK_WORDS } from "@/lib/useTranscript";

// The hook talks to /api/transcribe + /api/corrections via fetch, and to Supabase
// through these libs — all mocked so the test is hermetic.
jest.mock("@/lib/transcripts", () => ({ loadTranscript: jest.fn(), saveTranscript: jest.fn() }));
jest.mock("@/lib/rag", () => ({ indexTranscript: jest.fn(() => Promise.resolve()) }));

describe("useTranscript", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("starts on the mock transcript when the worker is unreachable", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false }); // transcribe fails
    const { result } = renderHook(() => useTranscript("demo"));
    expect(result.current.words).toEqual(MOCK_WORDS);
    expect(result.current.source).toBe("mock");
  });

  it("replaces words with the transcribe response", async () => {
    const words = [{ word: "नमस्ते", start: 0, end: 0.5 }];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ words, language: "ne" }),
    });
    const { result } = renderHook(() => useTranscript("demo"));
    await waitFor(() => expect(result.current.source).toBe("worker"));
    expect(result.current.words).toEqual(words);
  });

  it("editWord optimistically updates and posts a correction", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false }); // init no-op
    const { result } = renderHook(() => useTranscript("demo"));
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });

    act(() => result.current.editWord(0, "नमस्कार"));

    expect(result.current.words[0].word).toBe("नमस्कार");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/corrections",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("ignores a no-op edit (same word)", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    const { result } = renderHook(() => useTranscript("demo"));
    (global.fetch as jest.Mock).mockClear();

    act(() => result.current.editWord(0, MOCK_WORDS[0].word));

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
