"""Trigram word similarity, a pure-Python port of pg_trgm's word_similarity.

Registered as a SQLite function (see server.database) so the search queries
can rank by it like they did on Postgres.

word_similarity(needle, haystack) is the greatest similarity between the
trigram set of `needle` and the trigram set of any continuous extent of
`haystack`'s ordered trigrams, where similarity is
shared / (len(needle set) + len(extent set) - shared).
Example (from the pg_trgm docs): word_similarity("word", "two words") == 0.8.
"""

from functools import lru_cache
from typing import Optional, Tuple

# The searchable strings (stop names, streets, route names) number in the
# low thousands, so caching their trigrams keeps per-search cost to set math.
_CACHE_SIZE = 32768


def _words(text: str):
    """Split like pg_trgm: runs of alphanumerics, lowercased."""
    word = []
    for char in text.lower():
        if char.isalnum():
            word.append(char)
        elif word:
            yield "".join(word)
            word = []
    if word:
        yield "".join(word)


@lru_cache(maxsize=_CACHE_SIZE)
def trigram_sequence(text: str) -> Tuple[str, ...]:
    """Ordered trigrams of each word padded as pg_trgm does ("  word ")."""
    trigrams = []
    for word in _words(text):
        padded = f"  {word} "
        trigrams.extend(padded[i : i + 3] for i in range(len(padded) - 2))
    return tuple(trigrams)


@lru_cache(maxsize=_CACHE_SIZE)
def trigram_set(text: str) -> frozenset:
    return frozenset(trigram_sequence(text))


def word_similarity(needle: Optional[str], haystack: Optional[str]) -> float:
    if not needle or not haystack:
        return 0.0
    needle_set = trigram_set(needle)
    if not needle_set or needle_set.isdisjoint(trigram_set(haystack)):
        return 0.0

    sequence = trigram_sequence(haystack)
    # Extents only improve by starting and ending on a shared trigram
    matches = [i for i, trigram in enumerate(sequence) if trigram in needle_set]
    best = 0.0
    for start in matches:
        seen = set()
        shared = 0
        for i in range(start, matches[-1] + 1):
            trigram = sequence[i]
            if trigram in seen:
                continue
            seen.add(trigram)
            if trigram in needle_set:
                shared += 1
                similarity = shared / (len(needle_set) + len(seen) - shared)
                if similarity > best:
                    best = similarity
    return best
