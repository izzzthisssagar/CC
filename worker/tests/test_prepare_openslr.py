from pathlib import Path

from scripts.prepare_openslr import read_tsv, index_audio


def test_read_tsv_parses_fileid_and_devanagari_text(tmp_path: Path):
    tsv = tmp_path / "utt.tsv"
    tsv.write_text(
        "4aa1fdca33\t6a6d1\t००७ मिलको दूरीमा\n"
        "86e521554a\t1f680\tनमस्ते\n"
        "\n"                                 # blank line ignored
        "badrow\tonly-two-cols\n",           # malformed → skipped
        encoding="utf-8",
    )
    rows = read_tsv(tsv)
    assert rows == [
        ("4aa1fdca33", "००७ मिलको दूरीमा"),
        ("86e521554a", "नमस्ते"),
    ]


def test_index_audio_maps_stem_to_path(tmp_path: Path):
    (tmp_path / "a").mkdir()
    (tmp_path / "a" / "4aa1fdca33.flac").write_bytes(b"x")
    (tmp_path / "86e521554a.wav").write_bytes(b"x")
    (tmp_path / "notes.txt").write_text("ignore me")  # non-audio ignored
    idx = index_audio(tmp_path)
    assert set(idx) == {"4aa1fdca33", "86e521554a"}
    assert idx["4aa1fdca33"].suffix == ".flac"
