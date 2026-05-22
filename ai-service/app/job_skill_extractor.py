"""
Extract required skills from job postings (any industry) from title + description.
"""

import re

from .cv_skill_extractor import _ALL_ALIASES, _find_alias_in_text, _clean_phrase
from .skill_ontology import normalize_skill

REQUIREMENT_PATTERNS = [
    r"(?:required|must have|essential|proficient in|experience with|knowledge of)\s*[:\s]+([^.;\n]{10,120})",
    r"(?:skills?|qualifications?)\s*[:\-]\s*([^.;\n]{10,200})",
]


def extract_skills_from_job(job: dict) -> list:
    """
    Build skill list from job.skills plus mining the description/requirements.
    """
    existing = list(job.get("skills") or [])
    text_parts = [
        job.get("title", ""),
        job.get("description", ""),
        " ".join(job.get("requirements") or []),
        " ".join(job.get("responsibilities") or []),
        job.get("industry", ""),
    ]
    text = " ".join(text_parts)
    if not text.strip():
        return existing

    text_lower = text.lower()
    found = {s.lower(): s for s in existing if s}

    for alias, canonical in _ALL_ALIASES.items():
        if _find_alias_in_text(text_lower, alias):
            found[canonical.lower()] = canonical

    for pattern in REQUIREMENT_PATTERNS:
        for m in re.finditer(pattern, text, re.I):
            chunk = m.group(1)
            for part in re.split(r"[,;•\|\n]|(?:\s+and\s+)", chunk):
                phrase = _clean_phrase(part)
                if phrase and len(phrase.split()) <= 5:
                    canonical = normalize_skill(phrase)
                    key = canonical.lower()
                    if key not in found:
                        found[key] = canonical if canonical != phrase.lower() else phrase.title()

    return sorted(found.values(), key=lambda x: x.lower())[:25]
