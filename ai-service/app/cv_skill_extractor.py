"""
Open CV skill extraction — not limited to tech.
Extracts skills, roles, and weighted strengths from whatever appears on the CV.
"""

import re
from collections import Counter

from .skill_ontology import normalize_skill, _REVERSE_MAP, SKILL_ALIASES

# Broad vocabulary across industries (canonical display names)
GENERAL_SKILLS = {
    # Healthcare
    "Nursing": ["registered nurse", "rn", "lpn", "nursing", "patient care", "clinical care"],
    "Patient Care": ["patient care", "bedside care", "vital signs"],
    "Healthcare": ["healthcare", "health care", "medical assistant", "hca"],
    "Pharmacy": ["pharmacy", "pharmacist", "dispensing"],
    # Education
    "Teaching": ["teaching", "teacher", "classroom", "pedagogy"],
    "Lesson Planning": ["lesson planning", "curriculum planning"],
    # Business / office
    "Microsoft Office": ["microsoft office", "ms office", "word", "powerpoint"],
    "Excel": ["excel", "spreadsheets", "pivot tables"],
    "Accounting": ["accounting", "bookkeeping", "accounts payable", "accounts receivable"],
    "Bookkeeping": ["bookkeeping", "quickbooks", "xero", "sage"],
    "Sales": ["sales", "business development", "b2b sales", "b2c sales"],
    "Marketing": ["marketing", "digital marketing", "seo", "social media marketing"],
    "Customer Service": ["customer service", "client service", "call centre", "call center"],
    "Administration": ["administration", "administrative", "office admin", "pa ", "personal assistant"],
    "Human Resources": ["human resources", "hr ", "recruitment", "talent acquisition"],
    "Project Management": ["project management", "pmp", "prince2", "agile coach"],
    # Logistics / trades
    "Driving": ["driving", "delivery driver", "hgv", "cdl", "forklift"],
    "Warehouse": ["warehouse", "pick and pack", "stock control"],
    "Logistics": ["logistics", "supply chain", "inventory management"],
    "Construction": ["construction", "site supervisor", "cscs"],
    "Electrician": ["electrician", "electrical installation"],
    "Plumber": ["plumber", "plumbing"],
    "Hospitality": ["hospitality", "front of house", "foh"],
    "Chef": ["chef", "sous chef", "kitchen", "culinary"],
    # Soft / universal
    "Communication": ["communication", "verbal communication", "written communication"],
    "Leadership": ["leadership", "team lead", "supervisor", "manager"],
    "Teamwork": ["teamwork", "team player", "collaboration"],
    "Problem Solving": ["problem solving", "analytical thinking"],
    "Time Management": ["time management", "prioritisation", "prioritization"],
}

# Merge general into search map
_ALL_ALIASES = dict(_REVERSE_MAP)
for canonical, aliases in GENERAL_SKILLS.items():
    _ALL_ALIASES[canonical.lower()] = canonical
    for alias in aliases:
        _ALL_ALIASES[alias.lower().strip()] = canonical

SKILLS_SECTION_HEADERS = re.compile(
    r"(?:^|\n)\s*(skills?|technical skills?|core competenc|competenc|key skills?|"
    r"qualifications?|expertise|proficienc|abilities|strengths?)\s*[:\-]?\s*\n",
    re.I | re.M,
)

EXPERIENCE_HEADERS = re.compile(
    r"(?:^|\n)\s*(work experience|professional experience|employment history|"
    r"experience|career history|work history)\s*[:\-]?\s*\n",
    re.I | re.M,
)

ROLE_LINE = re.compile(
    r"^[\s•\-\*]*([A-Z][A-Za-z0-9\s/&\-]{4,60}?)"
    r"(?:\s+at\s+|\s+@\s+|\s+\|\s+|\s+[-\u2013]\s+)",
    re.M,
)

BULLET_SKILL = re.compile(
    r"^[\s•\-\*]+\s*([A-Za-z][A-Za-z0-9\s/+#.&]{2,50})\s*$",
    re.M,
)

STOP_PHRASES = {
    "the", "and", "for", "with", "from", "this", "that", "have", "has", "was", "were",
    "january", "february", "march", "april", "may", "june", "july", "august",
    "september", "october", "november", "december", "present", "email", "phone",
    "address", "linkedin", "curriculum", "vitae", "resume", "references",
}


def _clean_phrase(phrase: str) -> str:
    p = re.sub(r"\s+", " ", phrase).strip(" .,;:-")
    if len(p) < 3 or len(p) > 55:
        return ""
    if p.lower() in STOP_PHRASES:
        return ""
    return p


def _find_alias_in_text(text_lower: str, alias: str) -> bool:
    if len(alias) <= 2:
        return False
    pattern = r"(?<![a-zA-Z0-9])" + re.escape(alias) + r"(?![a-zA-Z0-9])"
    try:
        return bool(re.search(pattern, text_lower))
    except re.error:
        return alias in text_lower


def extract_skills_from_cv_text(text: str) -> list:
    """
    Extract skills from full CV text using ontology + open phrase mining.
    Returns deduplicated list (canonical when known, else cleaned original phrases).
    """
    if not text or not text.strip():
        return []

    text_lower = text.lower()
    found = {}

    # 1) Ontology + general skills (all industries)
    for alias, canonical in _ALL_ALIASES.items():
        if _find_alias_in_text(text_lower, alias):
            found[canonical.lower()] = canonical

    # 2) Dedicated skills section — comma/bullet lists
    for m in SKILLS_SECTION_HEADERS.finditer(text):
        start = m.end()
        chunk = text[start : start + 2500]
        end = EXPERIENCE_HEADERS.search(chunk)
        section = chunk[: end.start()] if end else chunk[:1200]
        for part in re.split(r"[,;•\|\n]|(?:\s+and\s+)", section):
            phrase = _clean_phrase(part)
            if not phrase:
                continue
            canonical = normalize_skill(phrase)
            key = canonical.lower()
            if key not in found:
                found[key] = canonical if canonical != phrase.lower() else phrase.title()

    # 3) Bullet lines that look like competencies
    for m in BULLET_SKILL.finditer(text):
        phrase = _clean_phrase(m.group(1))
        if phrase and len(phrase.split()) <= 6:
            canonical = normalize_skill(phrase)
            key = canonical.lower()
            if key not in found:
                found[key] = canonical if canonical != phrase.lower() else phrase.title()

    # 4) Parenthetical / pipe skills in summary (e.g. "Sales | CRM | Negotiation")
    for m in re.finditer(r"\b([A-Za-z][A-Za-z0-9\s]{2,30})\s*\|\s*([A-Za-z][A-Za-z0-9\s]{2,30})", text):
        for g in m.groups():
            phrase = _clean_phrase(g)
            if phrase:
                canonical = normalize_skill(phrase)
                found[canonical.lower()] = canonical if canonical != phrase.lower() else phrase.title()

    return sorted(found.values(), key=lambda s: s.lower())


def extract_roles_from_cv(text: str) -> list:
    """Job titles / roles mentioned in experience section."""
    roles = []
    seen = set()

    for m in EXPERIENCE_HEADERS.finditer(text):
        chunk = text[m.end() : m.end() + 4000]
        lines = chunk.split("\n")[:40]
        for line in lines:
            line = line.strip()
            if not line or len(line) < 6:
                continue
            rm = ROLE_LINE.match(line)
            if rm:
                title = _clean_phrase(rm.group(1))
                if title and title.lower() not in seen:
                    seen.add(title.lower())
                    roles.append(title)
                continue
            # Line looks like a title (short, capitalized, no bullet)
            if (
                len(line) < 70
                and line[0].isupper()
                and not line.endswith(".")
                and sum(c.isdigit() for c in line) < 4
            ):
                words = line.split()
                if 2 <= len(words) <= 10:
                    title = _clean_phrase(line)
                    if title and title.lower() not in seen:
                        seen.add(title.lower())
                        roles.append(title)

    return roles[:15]


def extract_strengths(text: str, skills: list) -> dict:
    """
    Weight skills by how prominently they appear on the CV (frequency + skills section).
    Returns { skill_name: weight 0.0–1.0 }.
    """
    if not text:
        return {s: 1.0 for s in skills}

    text_lower = text.lower()
    counts = Counter()

    for skill in skills:
        sk = skill.lower()
        counts[skill] = len(re.findall(re.escape(sk), text_lower))
        # Also count aliases
        for alias, canonical in _ALL_ALIASES.items():
            if canonical.lower() == sk and _find_alias_in_text(text_lower, alias):
                counts[skill] += 2

    # Skills section boost
    section_boost = set()
    for m in SKILLS_SECTION_HEADERS.finditer(text):
        section = text[m.end() : m.end() + 2000].lower()
        for skill in skills:
            if skill.lower() in section:
                section_boost.add(skill)

    if not counts:
        return {s: 1.0 for s in skills}

    max_c = max(counts.values()) or 1
    strengths = {}
    for skill in skills:
        base = counts.get(skill, 0) / max_c
        if skill in section_boost:
            base = min(1.0, base + 0.35)
        strengths[skill] = round(max(0.25, min(1.0, base)), 3)

    return strengths


def extract_cv_profile(text: str) -> dict:
    """Full CV profile for matching."""
    skills = extract_skills_from_cv_text(text)
    roles = extract_roles_from_cv(text)
    strengths = extract_strengths(text, skills)
    return {
        "skills": skills,
        "roles": roles,
        "strengths": strengths,
    }
