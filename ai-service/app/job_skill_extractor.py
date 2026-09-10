# """
# Extract required skills from job postings (any industry) from title + description.
# """

# import re

# from .cv_skill_extractor import _ALL_ALIASES, _find_alias_in_text, _clean_phrase
# from .skill_ontology import normalize_skill

# REQUIREMENT_PATTERNS = [
#     r"(?:required|must have|essential|proficient in|experience with|knowledge of)\s*[:\s]+([^.;\n]{10,120})",
#     r"(?:skills?|qualifications?)\s*[:\-]\s*([^.;\n]{10,200})",
# ]


# def extract_skills_from_job(job: dict) -> list:
#     """
#     Build skill list from job.skills plus mining the description/requirements.
#     """
#     existing = list(job.get("skills") or [])
#     text_parts = [
#         job.get("title", ""),
#         job.get("description", ""),
#         " ".join(job.get("requirements") or []),
#         " ".join(job.get("responsibilities") or []),
#         job.get("industry", ""),
#     ]
#     text = " ".join(text_parts)
#     if not text.strip():
#         return existing

#     text_lower = text.lower()
#     found = {s.lower(): s for s in existing if s}

#     for alias, canonical in _ALL_ALIASES.items():
#         if _find_alias_in_text(text_lower, alias):
#             found[canonical.lower()] = canonical

#     for pattern in REQUIREMENT_PATTERNS:
#         for m in re.finditer(pattern, text, re.I):
#             chunk = m.group(1)
#             for part in re.split(r"[,;•\|\n]|(?:\s+and\s+)", chunk):
#                 phrase = _clean_phrase(part)
#                 if phrase and len(phrase.split()) <= 5:
#                     canonical = normalize_skill(phrase)
#                     key = canonical.lower()
#                     if key not in found:
#                         found[key] = canonical if canonical != phrase.lower() else phrase.title()

#     return sorted(found.values(), key=lambda x: x.lower())[:25]

"""
job_skill_extractor.py
======================
Extracts required skills from job postings across ALL industries.
Used by the matcher to build the job's skill profile for comparison.
"""

import re
from .cv_skill_extractor import _ALL_ALIASES, _find_alias_in_text, _clean_phrase, _is_valid_skill
from .skill_ontology     import normalize_skill

# Extra requirement-phrase patterns to mine from job descriptions
_REQ_PATTERNS = [
    r"(?:required|must have|essential|proficient in|experience with|knowledge of|familiar with)\s*[:\s]+([^.;\n]{8,150})",
    r"(?:skills?|qualifications?|competencies)\s*[:\-]\s*([^.;\n]{8,200})",
    r"(?:you will have|you'll have|you will need|you must have)\s*[:\s]*([^.;\n]{8,150})",
]


def extract_skills_from_job(job: dict) -> list[str]:
    """
    Build the skill list for a job document.
    Priority:
      1. job.skills  (already stored)
      2. Ontology scan of title + description + requirements
      3. Requirement-phrase mining from description
    """
    existing: list[str] = list(job.get("skills") or [])

    text = " ".join([
        job.get("title",       ""),
        job.get("description", "")[:3000],
        job.get("industry",    ""),
        " ".join(job.get("requirements",     []) or []),
        " ".join(job.get("responsibilities", []) or []),
    ])

    if not text.strip():
        return existing

    text_lower = text.lower()
    found: dict[str, str] = {s.lower(): s for s in existing if s}

    # ── Ontology scan ─────────────────────────────────────────────────────────
    for alias, canonical in _ALL_ALIASES.items():
        if len(alias) < 3:
            continue
        if _find_alias_in_text(text_lower, alias):
            k = canonical.lower()
            if k not in found and _is_valid_skill(canonical):
                found[k] = canonical

    # ── Requirement-phrase mining ─────────────────────────────────────────────
    for pattern in _REQ_PATTERNS:
        for m in re.finditer(pattern, text, re.I):
            chunk = m.group(1)
            for part in re.split(r"[,;•|\n]|(?:\s+and\s+)", chunk):
                phrase = _clean_phrase(part)
                if not phrase or len(phrase.split()) > 5:
                    continue
                canonical = normalize_skill(phrase)
                k = canonical.lower()
                if k not in found and _is_valid_skill(canonical):
                    found[k] = canonical

    return sorted(found.values(), key=lambda x: x.lower())[:30]