import pytest

from server.services.text_similarity import trigram_sequence, word_similarity


def test_trigram_sequence_pads_each_word_like_pg_trgm():
    assert trigram_sequence("Ab c") == ("  a", " ab", "ab ", "  c", " c ")


def test_word_similarity_matches_pg_trgm_docs_example():
    # SELECT word_similarity('word', 'two words') → 0.8
    assert word_similarity("word", "two words") == pytest.approx(0.8)


def test_word_similarity_is_case_and_punctuation_insensitive():
    assert word_similarity("lamar", "1-North Lamar/South Congress") == 1.0


def test_word_similarity_tolerates_typos():
    assert word_similarity("guadelupe", "Guadalupe/21st") >= 0.3


@pytest.mark.parametrize(
    "needle, haystack", [("xyz", "abc"), ("", "abc"), ("abc", ""), ("abc", None)]
)
def test_word_similarity_no_match_is_zero(needle, haystack):
    assert word_similarity(needle, haystack) == 0.0
