# """
# Open CV skill extraction — not limited to tech.
# Extracts skills, roles, and weighted strengths from whatever appears on the CV.
# """

# import re
# from collections import Counter

# from .skill_ontology import normalize_skill, _REVERSE_MAP, SKILL_ALIASES

# # Broad vocabulary across industries (canonical display names)
# GENERAL_SKILLS = {
#     # Healthcare
#     "Nursing": ["registered nurse", "rn", "lpn", "nursing", "patient care", "clinical care"],
#     "Patient Care": ["patient care", "bedside care", "vital signs"],
#     "Healthcare": ["healthcare", "health care", "medical assistant", "hca"],
#     "Pharmacy": ["pharmacy", "pharmacist", "dispensing"],
#     # Education
#     "Teaching": ["teaching", "teacher", "classroom", "pedagogy"],
#     "Lesson Planning": ["lesson planning", "curriculum planning"],
#     # Business / office
#     "Microsoft Office": ["microsoft office", "ms office", "word", "powerpoint"],
#     "Excel": ["excel", "spreadsheets", "pivot tables"],
#     "Accounting": ["accounting", "bookkeeping", "accounts payable", "accounts receivable"],
#     "Bookkeeping": ["bookkeeping", "quickbooks", "xero", "sage"],
#     "Sales": ["sales", "business development", "b2b sales", "b2c sales"],
#     "Marketing": ["marketing", "digital marketing", "seo", "social media marketing"],
#     "Customer Service": ["customer service", "client service", "call centre", "call center"],
#     "Administration": ["administration", "administrative", "office admin", "pa ", "personal assistant"],
#     "Human Resources": ["human resources", "hr ", "recruitment", "talent acquisition"],
#     "Project Management": ["project management", "pmp", "prince2", "agile coach"],
#     # Logistics / trades
#     "Driving": ["driving", "delivery driver", "hgv", "cdl", "forklift"],
#     "Warehouse": ["warehouse", "pick and pack", "stock control"],
#     "Logistics": ["logistics", "supply chain", "inventory management"],
#     "Construction": ["construction", "site supervisor", "cscs"],
#     "Electrician": ["electrician", "electrical installation"],
#     "Plumber": ["plumber", "plumbing"],
#     "Hospitality": ["hospitality", "front of house", "foh"],
#     "Chef": ["chef", "sous chef", "kitchen", "culinary"],
#     # Soft / universal
#     "Communication": ["communication", "verbal communication", "written communication"],
#     "Leadership": ["leadership", "team lead", "supervisor", "manager"],
#     "Teamwork": ["teamwork", "team player", "collaboration"],
#     "Problem Solving": ["problem solving", "analytical thinking"],
#     "Time Management": ["time management", "prioritisation", "prioritization"],
# }

# # Merge general into search map
# _ALL_ALIASES = dict(_REVERSE_MAP)
# for canonical, aliases in GENERAL_SKILLS.items():
#     _ALL_ALIASES[canonical.lower()] = canonical
#     for alias in aliases:
#         _ALL_ALIASES[alias.lower().strip()] = canonical

# SKILLS_SECTION_HEADERS = re.compile(
#     r"(?:^|\n)\s*(skills?|technical skills?|core competenc|competenc|key skills?|"
#     r"qualifications?|expertise|proficienc|abilities|strengths?)\s*[:\-]?\s*\n",
#     re.I | re.M,
# )

# EXPERIENCE_HEADERS = re.compile(
#     r"(?:^|\n)\s*(work experience|professional experience|employment history|"
#     r"experience|career history|work history)\s*[:\-]?\s*\n",
#     re.I | re.M,
# )

# PROJECT_HEADERS = re.compile(
#     r"(?:^|\n)\s*(projects?|portfolio|personal projects?|key projects?|"
#     r"selected projects?|technical projects?)\s*[:\-]?\s*\n",
#     re.I | re.M,
# )

# CERT_HEADERS = re.compile(
#     r"(?:^|\n)\s*(certifications?|certificates?|licenses?|credentials?|"
#     r"professional certifications?)\s*[:\-]?\s*\n",
#     re.I | re.M,
# )

# EDUCATION_HEADERS = re.compile(
#     r"(?:^|\n)\s*(education|academic|qualifications?|degrees?)\s*[:\-]?\s*\n",
#     re.I | re.M,
# )

# ROLE_LINE = re.compile(
#     r"^[\s•\-\*]*([A-Z][A-Za-z0-9\s/&\-]{4,60}?)"
#     r"(?:\s+at\s+|\s+@\s+|\s+\|\s+|\s+[-\u2013]\s+)",
#     re.M,
# )

# BULLET_SKILL = re.compile(
#     r"^[\s•\-\*]+\s*([A-Za-z][A-Za-z0-9\s/+#.&]{2,50})\s*$",
#     re.M,
# )

# STOP_PHRASES = {
#     "the", "and", "for", "with", "from", "this", "that", "have", "has", "was", "were",
#     "january", "february", "march", "april", "may", "june", "july", "august",
#     "september", "october", "november", "december", "present", "email", "phone",
#     "address", "linkedin", "curriculum", "vitae", "resume", "references",
#     "employed", "unemployed", "employment", "full-time", "part-time", "internship",
#     "objective", "summary", "profile", "contact", "nationality", "gender",
# }

# # Phrases that are education, locations, or status — not skills
# NOISE_SKILL_PATTERNS = [
#     re.compile(
#         r"\b(bachelor|master|phd|b\.?sc|m\.?sc|b\.?a|m\.?a|mba|degree|diploma|"
#         r"university|college|school|faculty|graduat)\b",
#         re.I,
#     ),
#     re.compile(r"\b(computer science|information technology)\s+(university|college|of)\b", re.I),
#     re.compile(r"\b(employed|unemployed|self[- ]?employed|work experience)\b", re.I),
#     re.compile(r"^\d{4}\s*[-–]\s*\d{4}$"),
#     re.compile(r"^\d+\s*years?\s+(of\s+)?experience", re.I),
# ]

# KNOWN_ACRONYMS = {
#     "aws", "gcp", "api", "sql", "css", "html", "git", "crm", "erp", "hr", "ui", "ux",
#     "rn", "lpn", "cpr", "osha", "pmp",
# }


# def _clean_phrase(phrase: str) -> str:
#     p = re.sub(r"\s+", " ", phrase).strip(" .,;:-")
#     if len(p) < 2 or len(p) > 55:
#         return ""
#     if p.lower() in STOP_PHRASES:
#         return ""
#     return p


# def _is_valid_skill(phrase: str) -> bool:
#     """Reject education lines, employment status, locations, and other noise."""
#     if not phrase:
#         return False
#     low = phrase.lower().strip()
#     if low in STOP_PHRASES:
#         return False
#     if len(low) < 2:
#         return False
#     # Too many words → likely a sentence, not a skill
#     words = low.split()
#     if len(words) > 5:
#         return False
#     for pat in NOISE_SKILL_PATTERNS:
#         if pat.search(phrase):
#             return False
#     # "Bachelor of Science", "Computer Science UNIVERSITY OF"
#     if re.search(r"\b(of|in|at)\b", low) and re.search(
#         r"\b(science|arts|engineering|studies|university|college)\b", low
#     ):
#         return False
#     # ALL CAPS single token (often city/region) unless known acronym
#     if (
#         phrase.isupper()
#         and " " not in phrase
#         and len(phrase) > 3
#         and low not in KNOWN_ACRONYMS
#         and low not in _ALL_ALIASES
#     ):
#         return False
#     # Must contain at least one letter; not purely numeric
#     if not re.search(r"[a-zA-Z]", phrase):
#         return False
#     return True


# def _find_alias_in_text(text_lower: str, alias: str) -> bool:
#     if len(alias) <= 2:
#         return False
#     pattern = r"(?<![a-zA-Z0-9])" + re.escape(alias) + r"(?![a-zA-Z0-9])"
#     try:
#         return bool(re.search(pattern, text_lower))
#     except re.error:
#         return alias in text_lower


# def extract_skills_from_cv_text(text: str) -> list:
#     """
#     Extract skills from full CV text using ontology + open phrase mining.
#     Returns deduplicated list (canonical when known, else cleaned original phrases).
#     """
#     if not text or not text.strip():
#         return []

#     text_lower = text.lower()
#     found = {}

#     # 1) Ontology + general skills (all industries)
#     for alias, canonical in _ALL_ALIASES.items():
#         if _find_alias_in_text(text_lower, alias) and _is_valid_skill(canonical):
#             found[canonical.lower()] = canonical

#     # 2) Dedicated skills section — comma/bullet lists
#     for m in SKILLS_SECTION_HEADERS.finditer(text):
#         start = m.end()
#         chunk = text[start : start + 2500]
#         end = EXPERIENCE_HEADERS.search(chunk)
#         section = chunk[: end.start()] if end else chunk[:1200]
#         for part in re.split(r"[,;•\|\n]|(?:\s+and\s+)", section):
#             phrase = _clean_phrase(part)
#             if not phrase or not _is_valid_skill(phrase):
#                 continue
#             canonical = normalize_skill(phrase)
#             key = canonical.lower()
#             if key not in found and _is_valid_skill(canonical):
#                 found[key] = canonical if canonical != phrase.lower() else phrase.title()

#     # 3) Bullet lines that look like competencies
#     for m in BULLET_SKILL.finditer(text):
#         phrase = _clean_phrase(m.group(1))
#         if phrase and len(phrase.split()) <= 6 and _is_valid_skill(phrase):
#             canonical = normalize_skill(phrase)
#             key = canonical.lower()
#             if key not in found and _is_valid_skill(canonical):
#                 found[key] = canonical if canonical != phrase.lower() else phrase.title()

#     # 4) Parenthetical / pipe skills in summary (e.g. "Sales | CRM | Negotiation")
#     for m in re.finditer(r"\b([A-Za-z][A-Za-z0-9\s]{2,30})\s*\|\s*([A-Za-z][A-Za-z0-9\s]{2,30})", text):
#         for g in m.groups():
#             phrase = _clean_phrase(g)
#             if phrase and _is_valid_skill(phrase):
#                 canonical = normalize_skill(phrase)
#                 if _is_valid_skill(canonical):
#                     found[canonical.lower()] = (
#                         canonical if canonical != phrase.lower() else phrase.title()
#                     )

#     # Final pass — drop anything that slipped through filters
#     cleaned = [s for s in found.values() if _is_valid_skill(s)]
#     return sorted(cleaned, key=lambda s: s.lower())


# def extract_roles_from_cv(text: str) -> list:
#     """Job titles / roles mentioned in experience section."""
#     roles = []
#     seen = set()

#     for m in EXPERIENCE_HEADERS.finditer(text):
#         chunk = text[m.end() : m.end() + 4000]
#         lines = chunk.split("\n")[:40]
#         for line in lines:
#             line = line.strip()
#             if not line or len(line) < 6:
#                 continue
#             rm = ROLE_LINE.match(line)
#             if rm:
#                 title = _clean_phrase(rm.group(1))
#                 if title and title.lower() not in seen:
#                     seen.add(title.lower())
#                     roles.append(title)
#                 continue
#             # Line looks like a title (short, capitalized, no bullet)
#             if (
#                 len(line) < 70
#                 and line[0].isupper()
#                 and not line.endswith(".")
#                 and sum(c.isdigit() for c in line) < 4
#             ):
#                 words = line.split()
#                 if 2 <= len(words) <= 10:
#                     title = _clean_phrase(line)
#                     if title and title.lower() not in seen:
#                         seen.add(title.lower())
#                         roles.append(title)

#     return roles[:15]


# def _section_after_header(text: str, header_pattern: re.Pattern, max_len: int = 3000) -> str:
#     for m in header_pattern.finditer(text):
#         chunk = text[m.end() : m.end() + max_len]
#         next_hdr = re.search(
#             r"(?:^|\n)\s*(?:work experience|education|skills|projects|certifications|"
#             r"references|contact)\s*[:\-]?\s*\n",
#             chunk,
#             re.I | re.M,
#         )
#         return chunk[: next_hdr.start()] if next_hdr else chunk[:max_len]
#     return ""


# def extract_projects_from_cv(text: str) -> list:
#     """Project names / descriptions from CV projects section."""
#     if not text:
#         return []
#     section = _section_after_header(text, PROJECT_HEADERS)
#     if not section:
#         return []

#     projects = []
#     seen = set()
#     for line in section.split("\n"):
#         line = line.strip()
#         if not line or len(line) < 8:
#             continue
#         cleaned = _clean_phrase(re.sub(r"^[\s•\-\*]+", "", line))
#         if cleaned and cleaned.lower() not in seen and _is_valid_skill(cleaned):
#             seen.add(cleaned.lower())
#             projects.append(cleaned)
#     return projects[:12]


# def extract_certifications_from_cv(text: str) -> list:
#     """Certifications and licenses listed on the CV."""
#     if not text:
#         return []
#     section = _section_after_header(text, CERT_HEADERS, 2000)
#     if not section:
#         return []

#     certs = []
#     seen = set()
#     for part in re.split(r"[,;\n]|(?:\s+and\s+)", section):
#         phrase = _clean_phrase(re.sub(r"^[\s•\-\*]+", "", part))
#         if not phrase or len(phrase) < 4:
#             continue
#         if phrase.lower() in seen:
#             continue
#         if _is_valid_skill(phrase) or re.search(
#             r"\b(pmp|aws|cissp|cscs|cpa|cfa|prince2)\b", phrase, re.I
#         ):
#             seen.add(phrase.lower())
#             certs.append(phrase.title() if phrase.islower() else phrase)
#     return certs[:15]


# def extract_education_from_cv(text: str) -> list:
#     """Degree / institution lines from education section."""
#     if not text:
#         return []
#     section = _section_after_header(text, EDUCATION_HEADERS, 2500)
#     if not section:
#         return []

#     entries = []
#     seen = set()
#     for line in section.split("\n"):
#         line = line.strip()
#         if not line or len(line) < 6:
#             continue
#         if re.search(
#             r"\b(bachelor|master|phd|b\.?sc|m\.?sc|mba|degree|diploma|university|college)\b",
#             line,
#             re.I,
#         ):
#             key = line.lower()[:80]
#             if key not in seen:
#                 seen.add(key)
#                 entries.append(line[:120])
#     return entries[:8]


# def extract_strengths(text: str, skills: list) -> dict:
#     """
#     Weight skills by how prominently they appear on the CV (frequency + skills section).
#     Returns { skill_name: weight 0.0–1.0 }.
#     """
#     if not text:
#         return {s: 1.0 for s in skills}

#     text_lower = text.lower()
#     counts = Counter()

#     for skill in skills:
#         sk = skill.lower()
#         counts[skill] = len(re.findall(re.escape(sk), text_lower))
#         # Also count aliases
#         for alias, canonical in _ALL_ALIASES.items():
#             if canonical.lower() == sk and _find_alias_in_text(text_lower, alias):
#                 counts[skill] += 2

#     # Skills section boost
#     section_boost = set()
#     for m in SKILLS_SECTION_HEADERS.finditer(text):
#         section = text[m.end() : m.end() + 2000].lower()
#         for skill in skills:
#             if skill.lower() in section:
#                 section_boost.add(skill)

#     if not counts:
#         return {s: 1.0 for s in skills}

#     max_c = max(counts.values()) or 1
#     strengths = {}
#     for skill in skills:
#         base = counts.get(skill, 0) / max_c
#         if skill in section_boost:
#             base = min(1.0, base + 0.35)
#         strengths[skill] = round(max(0.25, min(1.0, base)), 3)

#     return strengths


# # Experience / title phrases → inferred canonical skills (priority after explicit skills)
# EXPERIENCE_INFERENCE_RULES = [
#     (re.compile(r"\b(software engineer|software developer|full[- ]?stack|web developer|frontend developer|backend developer|mobile developer|devops engineer|qa engineer|programmer)\b", re.I), ["Software Development", "Programming"]),
#     (re.compile(r"\b(web application|web apps?|frontend|react|vue|angular|javascript|typescript)\b", re.I), ["JavaScript", "Web Development"]),
#     (re.compile(r"\b(rest api|restful|backend|server[- ]side|node\.?js|django|flask|fastapi)\b", re.I), ["REST APIs", "Backend Development"]),
#     (re.compile(r"\b(database|sql|postgresql|mysql|mongodb|redis)\b", re.I), ["Database Management", "SQL"]),
#     (re.compile(r"\b(cloud|aws|azure|gcp|kubernetes|docker|ci/?cd)\b", re.I), ["DevOps", "Cloud"]),
#     (re.compile(r"\b(machine learning|deep learning|data scien|nlp|pytorch|tensorflow)\b", re.I), ["Machine Learning", "Data Science"]),
#     (re.compile(r"\b(marketing manager|digital marketing|seo|content marketing|brand manager)\b", re.I), ["Marketing", "Digital Marketing"]),
#     (re.compile(r"\b(sales executive|account manager|business development|b2b sales)\b", re.I), ["Sales", "Business Development"]),
#     (re.compile(r"\b(financial analyst|accountant|bookkeeper|audit|finance manager)\b", re.I), ["Accounting", "Finance"]),
#     (re.compile(r"\b(registered nurse|clinical nurse|patient care|healthcare assistant)\b", re.I), ["Nursing", "Healthcare"]),
#     (re.compile(r"\b(construction project|site manager|civil engineer|quantity surveyor)\b", re.I), ["Construction", "Project Management"]),
#     (re.compile(r"\b(teacher|lecturer|tutor|classroom|curriculum)\b", re.I), ["Teaching", "Education"]),
#     (re.compile(r"\b(warehouse|logistics|supply chain|inventory|forklift)\b", re.I), ["Logistics", "Warehouse"]),
#     (re.compile(r"\b(hotel|restaurant|chef|hospitality|barista)\b", re.I), ["Hospitality", "Chef"]),
#     (re.compile(r"\b(built|developed|designed|created)\s+(api|apis|rest)\b", re.I), ["REST APIs", "API Development"]),
#     (re.compile(r"\b(managed team|led team|team lead|supervised|mentored)\b", re.I), ["Leadership", "Team Management"]),
#     (re.compile(r"\b(project management|managed projects|project lead|programme manager)\b", re.I), ["Project Management"]),
#     (re.compile(r"\b(automated tests?|unit tests?|qa|quality assurance)\b", re.I), ["Testing", "QA"]),
#     (re.compile(r"\b(agile|scrum|sprint|kanban)\b", re.I), ["Agile", "Project Management"]),
#     (re.compile(r"\b(data analysis|analytics|reporting|dashboards?)\b", re.I), ["Data Analysis", "Excel"]),
# ]

# ROLE_TITLE_INFERENCE = [
#     (re.compile(r"\b(software|developer|engineer|devops|programmer|architect)\b", re.I), ["Software Development"]),
#     (re.compile(r"\b(frontend|ui engineer|web developer)\b", re.I), ["JavaScript", "Web Development"]),
#     (re.compile(r"\b(backend|api developer)\b", re.I), ["Backend Development", "REST APIs"]),
#     (re.compile(r"\b(marketing|brand|seo)\b", re.I), ["Marketing"]),
#     (re.compile(r"\b(sales|account executive|business development)\b", re.I), ["Sales"]),
#     (re.compile(r"\b(finance|accountant|analyst|auditor)\b", re.I), ["Finance", "Accounting"]),
#     (re.compile(r"\b(nurse|clinical|medical|healthcare)\b", re.I), ["Healthcare", "Nursing"]),
#     (re.compile(r"\b(construction|builder|surveyor|site manager)\b", re.I), ["Construction"]),
#     (re.compile(r"\b(teacher|lecturer|educator|tutor)\b", re.I), ["Teaching"]),
#     (re.compile(r"\b(driver|warehouse|logistics)\b", re.I), ["Logistics"]),
#     (re.compile(r"\b(chef|hospitality|waiter|bartender)\b", re.I), ["Hospitality"]),
# ]


# def _experience_section_text(text: str) -> str:
#     """Return work-experience chunk for inference mining."""
#     if not text:
#         return ""
#     chunks = []
#     for m in EXPERIENCE_HEADERS.finditer(text):
#         chunk = text[m.end() : m.end() + 5000]
#         end = EXPERIENCE_HEADERS.search(chunk)
#         chunks.append(chunk[: end.start()] if end else chunk[:4000])
#     return "\n".join(chunks) if chunks else text[:8000]


# def infer_skills_from_experience(text: str, roles: list | None = None) -> list:
#     """
#     Infer skills from work experience, responsibilities, job titles, and projects
#     when explicit skills are sparse or missing.
#     """
#     if not text and not roles:
#         return []

#     inferred = {}
#     exp_text = _experience_section_text(text)
#     blob = f"{exp_text}\n{' '.join(roles or [])}".lower()

#     for pattern, skills in EXPERIENCE_INFERENCE_RULES:
#         if pattern.search(blob):
#             for skill in skills:
#                 inferred[skill.lower()] = skill

#     for role in roles or []:
#         for pattern, skills in ROLE_TITLE_INFERENCE:
#             if pattern.search(role):
#                 for skill in skills:
#                     inferred[skill.lower()] = skill

#     return sorted(inferred.values(), key=lambda s: s.lower())


# def build_matching_skills(
#     explicit_skills: list,
#     cv_text: str = "",
#     roles: list | None = None,
# ) -> tuple[list, list]:
#     """
#     Merge explicit + inferred skills for matching.
#     Returns (all_skills_for_matching, inferred_only).
#     """
#     explicit = list(explicit_skills or [])
#     if not explicit and cv_text:
#         explicit = extract_skills_from_cv_text(cv_text)

#     inferred = infer_skills_from_experience(cv_text, roles)

#     # Mine projects and certifications for additional implicit skills
#     for project in extract_projects_from_cv(cv_text):
#         for pattern, skills in EXPERIENCE_INFERENCE_RULES:
#             if pattern.search(project):
#                 for skill in skills:
#                     inferred.append(skill)
#     for cert in extract_certifications_from_cv(cv_text):
#         canonical = normalize_skill(cert)
#         if _is_valid_skill(canonical):
#             inferred.append(canonical if canonical != cert.lower() else cert)

#     inferred_dedup = {}
#     for s in inferred:
#         inferred_dedup[s.lower()] = s
#     inferred = sorted(inferred_dedup.values(), key=lambda s: s.lower())

#     merged = {}
#     for s in explicit:
#         merged[s.lower()] = s
#     for s in inferred:
#         if s.lower() not in merged:
#             merged[s.lower()] = s

#     all_skills = sorted(merged.values(), key=lambda s: s.lower())
#     inferred_only = [s for s in inferred if s.lower() not in {e.lower() for e in explicit}]
#     return all_skills, inferred_only


# def extract_cv_profile(text: str) -> dict:
#     """Full CV profile for matching."""
#     explicit = extract_skills_from_cv_text(text)
#     roles = extract_roles_from_cv(text)
#     projects = extract_projects_from_cv(text)
#     certifications = extract_certifications_from_cv(text)
#     education = extract_education_from_cv(text)
#     skills, inferred = build_matching_skills(explicit, text, roles)
#     strengths = extract_strengths(text, skills)
#     return {
#         "skills": skills,
#         "explicit_skills": explicit,
#         "inferred_skills": inferred,
#         "roles": roles,
#         "projects": projects,
#         "certifications": certifications,
#         "education": education,
#         "strengths": strengths,
#     }

"""
cv_skill_extractor.py
=====================
Open-domain CV skill extractor — works for ALL industries, not just tech.

Bug fixes applied:
  1. Aggressively rejects names, locations, region names, section headers,
     usernames, email fragments, URLs, and education noise.
  2. Skill phrases must appear in a known alias map OR a skills section;
     never extracted from free-form sentences without validation.
  3. Inferred skills only added when pattern matches experience bullets,
     not arbitrary text.
"""

import re
from collections import Counter
from .skill_ontology import normalize_skill, _REVERSE_MAP, SKILL_ALIASES

# ─────────────────────────────────────────────────────────────────────────────
# 1.  MASTER SKILL REGISTRY  (canonical → aliases)
#     Covers tech + all major non-tech industries.
# ─────────────────────────────────────────────────────────────────────────────
GENERAL_SKILLS = {
    # ── Healthcare ────────────────────────────────────────────────────────────
    "Nursing":              ["registered nurse", "rn ", "lpn ", "nursing", "nurse"],
    "Patient Care":         ["patient care", "bedside care", "vital signs", "wound care"],
    "Healthcare":           ["healthcare", "health care", "medical assistant", "hca"],
    "Pharmacy":             ["pharmacy", "pharmacist", "dispensing"],
    "Phlebotomy":           ["phlebotomy", "venepuncture"],
    "Radiology":            ["radiology", "mri", "ct scan", "ultrasound"],
    "Physiotherapy":        ["physiotherapy", "physical therapy"],
    "Mental Health":        ["mental health", "counselling", "psychotherapy"],
    "First Aid":            ["first aid", "cpr", "bls", "acls", "basic life support"],
    "Clinical Assessment":  ["clinical assessment", "patient assessment"],
    # ── Education ─────────────────────────────────────────────────────────────
    "Teaching":             ["teaching", "teacher", "classroom management", "pedagogy"],
    "Lesson Planning":      ["lesson planning", "curriculum planning", "scheme of work"],
    "Safeguarding":         ["safeguarding", "child protection"],
    "SEND":                 ["send", "special educational needs", "sen support"],
    "TEFL":                 ["tefl", "tesol", "english language teaching"],
    # ── Business & Finance ────────────────────────────────────────────────────
    "Microsoft Office":     ["microsoft office", "ms office", "office suite"],
    "Excel":                ["excel", "spreadsheets", "pivot tables", "ms excel", "google sheets"],
    "PowerPoint":           ["powerpoint", "presentations", "google slides"],
    "Word":                 ["microsoft word", "ms word", "google docs"],
    "Accounting":           ["accounting", "accounts payable", "accounts receivable", "general ledger"],
    "Bookkeeping":          ["bookkeeping", "quickbooks", "xero", "sage", "double entry"],
    "Financial Analysis":   ["financial analysis", "financial modelling", "financial reporting"],
    "Budgeting":            ["budgeting", "budget management", "forecasting", "financial planning"],
    "Audit":                ["audit", "internal audit", "external audit"],
    "Tax":                  ["tax", "vat", "tax returns", "corporation tax"],
    "Payroll":              ["payroll", "payroll processing"],
    "Compliance":           ["compliance", "regulatory compliance", "gdpr"],
    "Risk Management":      ["risk management", "risk assessment"],
    "SAP":                  ["sap", "sap erp", "sap finance"],
    "Salesforce":           ["salesforce", "salesforce crm", "sfdc"],
    "QuickBooks":           ["quickbooks", "quickbooks online"],
    # ── HR ────────────────────────────────────────────────────────────────────
    "Recruitment":          ["recruitment", "talent acquisition", "headhunting", "hiring"],
    "Human Resources":      ["human resources", "hr management", "people management", "hrbp"],
    "Employee Relations":   ["employee relations", "grievance", "disciplinary"],
    "Training":             ["training", "learning and development", "l&d", "coaching"],
    "CIPD":                 ["cipd", "cipd qualified"],
    # ── Sales & Marketing ─────────────────────────────────────────────────────
    "Sales":                ["sales", "b2b sales", "b2c sales", "direct sales", "cold calling"],
    "Account Management":   ["account management", "key account", "client management"],
    "Business Development": ["business development", "biz dev", "new business"],
    "Marketing":            ["marketing", "marketing strategy", "marketing manager"],
    "Digital Marketing":    ["digital marketing", "online marketing"],
    "SEO":                  ["seo", "search engine optimisation", "search engine optimization"],
    "SEM":                  ["sem", "paid search", "ppc", "pay per click"],
    "Google Ads":           ["google ads", "google adwords", "google advertising"],
    "Social Media":         ["social media", "social media management", "social media marketing"],
    "Content Marketing":    ["content marketing", "content creation", "copywriting"],
    "Email Marketing":      ["email marketing", "mailchimp", "klaviyo", "campaign monitor"],
    "HubSpot":              ["hubspot", "hubspot crm", "hubspot marketing"],
    "Brand Management":     ["brand management", "brand strategy"],
    "Market Research":      ["market research", "consumer research"],
    "CRM":                  ["crm", "customer relationship management"],
    "Google Analytics":     ["google analytics", "ga4", "web analytics"],
    # ── Customer Service ──────────────────────────────────────────────────────
    "Customer Service":     ["customer service", "customer support", "customer care",
                             "call centre", "call center", "contact centre"],
    # ── Admin & Operations ────────────────────────────────────────────────────
    "Administration":       ["administration", "administrative", "office admin",
                             "receptionist", "office management"],
    "Project Management":   ["project management", "pmp", "prince2", "programme management"],
    "Agile":                ["agile", "scrum", "kanban", "sprint planning"],
    "Jira":                 ["jira", "confluence", "atlassian"],
    "Microsoft Teams":      ["microsoft teams", "ms teams"],
    # ── Legal ─────────────────────────────────────────────────────────────────
    "Corporate Law":        ["corporate law", "commercial law", "company law"],
    "Contract Law":         ["contract law", "contract drafting", "contract review"],
    "Legal Research":       ["legal research", "case law", "legal analysis"],
    "Due Diligence":        ["due diligence", "m&a due diligence"],
    "Litigation":           ["litigation", "dispute resolution", "arbitration"],
    # ── Logistics & Trades ────────────────────────────────────────────────────
    "Driving":              ["driving", "delivery driver", "hgv", "cdl", "forklift",
                             "courier", "van driver"],
    "Warehouse":            ["warehouse", "pick and pack", "stock control", "goods in"],
    "Logistics":            ["logistics", "supply chain", "inventory management",
                             "freight", "shipping"],
    "Procurement":          ["procurement", "purchasing", "buying", "supplier management"],
    "Construction":         ["construction", "site supervisor", "cscs", "civil works"],
    "Electrician":          ["electrician", "electrical installation", "18th edition"],
    "Plumber":              ["plumber", "plumbing", "pipefitting"],
    "Carpentry":            ["carpentry", "joinery", "woodwork"],
    "HVAC":                 ["hvac", "air conditioning", "refrigeration", "heating"],
    # ── Hospitality & Catering ────────────────────────────────────────────────
    "Hospitality":          ["hospitality", "hotel management", "front of house", "foh"],
    "Chef":                 ["chef", "sous chef", "head chef", "culinary", "kitchen management"],
    "Food Safety":          ["food safety", "food hygiene", "haccp", "level 2 food"],
    "Barista":              ["barista", "coffee", "espresso"],
    "Bartending":           ["bartending", "bar staff", "mixology"],
    # ── Creative & Design ─────────────────────────────────────────────────────
    "Figma":                ["figma", "ui design"],
    "Photoshop":            ["photoshop", "adobe photoshop"],
    "Illustrator":          ["illustrator", "adobe illustrator"],
    "InDesign":             ["indesign", "adobe indesign"],
    "After Effects":        ["after effects", "adobe after effects"],
    "Premiere Pro":         ["premiere pro", "video editing", "adobe premiere"],
    "AutoCAD":              ["autocad", "cad", "computer aided design"],
    "Revit":                ["revit", "bim", "building information modelling"],
    "WordPress":            ["wordpress", "wp", "elementor"],
    "Shopify":              ["shopify", "e-commerce", "ecommerce"],
    # ── Data & Analytics (non-tech) ───────────────────────────────────────────
    "Data Analysis":        ["data analysis", "data analytics", "analysing data"],
    "Power BI":             ["power bi", "powerbi", "business intelligence"],
    "Tableau":              ["tableau", "data visualisation", "data visualization"],
    "SPSS":                 ["spss", "statistical analysis"],
    # ── Soft & Universal Skills ───────────────────────────────────────────────
    "Communication":        ["communication skills", "verbal communication",
                             "written communication", "interpersonal skills"],
    "Leadership":           ["leadership", "people management", "team leadership",
                             "managing teams"],
    "Teamwork":             ["teamwork", "team player", "team collaboration"],
    "Problem Solving":      ["problem solving", "analytical thinking", "critical thinking"],
    "Time Management":      ["time management", "prioritisation", "prioritization",
                             "organisational skills", "organizational skills"],
    "Attention to Detail":  ["attention to detail", "accuracy", "quality control"],
    "Presentation Skills":  ["presentation skills", "public speaking", "presenting"],
    "Negotiation":          ["negotiation", "negotiation skills"],
    "Report Writing":       ["report writing", "technical writing", "documentation"],
    # ── Tech (kept concise — ontology handles the rest) ──────────────────────
    "Python":               ["python", "python3"],
    "Java":                 ["java", "java se", "java ee"],
    "JavaScript":           ["javascript", "js ", "es6", "vanilla js"],
    "TypeScript":           ["typescript", "ts "],
    "React":                ["react", "reactjs", "react.js"],
    "Node.js":              ["node.js", "nodejs", "node js"],
    "SQL":                  ["sql", "mysql", "postgresql", "sqlite", "t-sql", "plsql"],
    "MongoDB":              ["mongodb", "mongo", "nosql"],
    "AWS":                  ["aws", "amazon web services", "amazon aws"],
    "Docker":               ["docker", "containerisation", "containerization"],
    "Git":                  ["git", "github", "gitlab", "version control"],
    "Machine Learning":     ["machine learning", "ml ", "supervised learning"],
    "Data Science":         ["data science", "data scientist"],
    "REST APIs":            ["rest api", "restful api", "rest apis", "api development"],
    "Linux":                ["linux", "ubuntu", "bash scripting", "shell scripting"],
    # ── Data science / academic tools ────────────────────────────────────────
    "Pandas":               ["pandas", "dataframes"],
    "NumPy":                ["numpy", "np "],
    "Matplotlib":           ["matplotlib", "seaborn", "data plotting"],
    "Jupyter":              ["jupyter", "jupyter notebook", "ipython"],
    "R":                    ["r programming", "rstudio"],
    "MATLAB":               ["matlab"],
    "Scikit-learn":         ["scikit-learn", "sklearn"],
    "TensorFlow":           ["tensorflow", "tf "],
    "PyTorch":              ["pytorch", "torch"],
    "VB.NET":               ["vb.net", "visual basic .net", "visual basic"],
    "C#":                   ["c#", "csharp", ".net", "asp.net", "dotnet"],
    "C++":                  ["c++", "cpp"],
}

# Build unified reverse lookup:  alias_lower → canonical
_ALL_ALIASES: dict[str, str] = {}

# First from ontology (tech-focused)
for canonical, aliases in _REVERSE_MAP.items():
    _ALL_ALIASES[canonical.lower()] = canonical if isinstance(canonical, str) else str(canonical)

# Then general (overwrites where needed — we prefer broader labels)
for canonical, aliases in GENERAL_SKILLS.items():
    _ALL_ALIASES[canonical.lower()] = canonical
    for alias in aliases:
        a = alias.lower().strip()
        if a:
            _ALL_ALIASES[a] = canonical


# ─────────────────────────────────────────────────────────────────────────────
# 2.  NOISE / REJECTION FILTERS
#     Everything that must NEVER be extracted as a skill.
# ─────────────────────────────────────────────────────────────────────────────

# Hard-blocked words / phrases that appear in CVs but are not skills
STOP_PHRASES: set[str] = {
    # Personal info labels
    "name", "email", "phone", "address", "mobile", "linkedin", "github",
    "nationality", "gender", "dob", "date of birth", "marital status",
    "contact", "personal details", "personal information",
    # Document structure
    "curriculum vitae", "resume", "cv", "references", "references available",
    "available on request", "objective", "summary", "profile", "personal statement",
    "cover letter", "portfolio",
    # Time / status
    "present", "current", "to date", "employed", "unemployed", "self employed",
    "self-employed", "full-time", "part-time", "internship", "volunteer",
    "freelance", "contract", "permanent", "temporary",
    # Months / generic time
    "january","february","march","april","june","july","august",
    "september","october","november","december",
    # Generic section headers (should never become skills)
    "skills", "technical skills", "core competencies", "key skills",
    "qualifications", "expertise", "proficiencies", "abilities", "strengths",
    "work experience", "professional experience", "employment history",
    "experience", "career history", "education", "academic background",
    "certifications", "awards", "interests", "hobbies", "languages",
    "projects", "achievements", "responsibilities", "duties",
    # Common English stop words
    "the", "and", "for", "with", "from", "this", "that", "have", "has",
    "was", "were", "been", "being", "will", "would", "could", "should",
    "their", "they", "which", "what", "when", "where", "how", "why",
}

# Regex patterns that identify noise — never a skill
_NOISE_RE: list[re.Pattern] = [
    # Education degrees / institutions
    re.compile(
        r"\b(bachelor|master|phd|b\.?sc|m\.?sc|b\.?a\.?|m\.?a\.?|mba|msc|bsc|"
        r"hnd|hnc|a[- ]?level|gcse|degree|diploma|certificate of|"
        r"university|college|faculty|school of|institute of|academy)\b",
        re.I,
    ),
    # Year ranges (2018-2022, 2018 – present)
    re.compile(r"^\d{4}\s*[-–]\s*(\d{4}|present)$", re.I),
    # Pure years
    re.compile(r"^\d{4}$"),
    # "X years of experience" statements
    re.compile(r"\d+\+?\s*years?\s+(of\s+)?experience", re.I),
    # Emails
    re.compile(r"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}", re.I),
    # URLs
    re.compile(r"https?://|www\.", re.I),
    # Phone numbers
    re.compile(r"\+?\d[\d\s\-().]{7,}"),
    # Sentences (too long to be a skill)
    re.compile(r"[.]{1}.{40,}"),
    # Geographic / region patterns  ("Bono Region", "Greater Accra", "Western Region")
    re.compile(r"\b(region|district|province|county|state|city|town|village|country)\b", re.I),
    # "Languages: English" type entries
    re.compile(r"^languages?\s*:\s*", re.I),
    # "Technical/Programmatic: …" section-like labels
    re.compile(r"^[a-z\s]+/[a-z\s]+\s*:.*$", re.I),
    # Username-style strings (no spaces, contains digits + letters mixed oddly)
    re.compile(r"^[a-z]+\d{3,}[a-z]*$", re.I),
    # All-caps words that are > 4 chars and not known acronyms (likely abbreviation/header)
    # handled separately below
]

# Acronyms that ARE valid skills even though they're short / all-caps
VALID_ACRONYMS: set[str] = {
    "sql", "aws", "gcp", "api", "css", "html", "git", "crm", "erp",
    "hr", "ui", "ux", "rn", "lpn", "cpr", "pmp", "bls", "vat",
    "seo", "sem", "ppc", "cad", "bim", "hvac", "send", "tefl", "tesol",
    "spss", "sap", "bi", "ml", "ai", "nlp", "r", "vba",
}

# Known Ghanaian / West-African region / district names to block explicitly
_KNOWN_LOCATIONS: set[str] = {
    # Ghana
    "bono", "bono region", "ahafo", "ashanti", "brong", "central region",
    "eastern region", "greater accra", "northern region", "oti region",
    "savannah", "upper east", "upper west", "volta", "western north",
    "western region", "kumasi", "accra", "tamale", "cape coast", "sunyani",
    "koforidua", "tema", "sekondi", "takoradi", "bolgatanga", "wa",
    # Countries
    "united kingdom", "united states", "united arab emirates",
    "south africa", "new zealand", "saudi arabia",
    "england", "scotland", "wales", "ireland", "nigeria", "kenya",
    "ghana", "canada", "australia", "india", "china", "germany",
    "france", "spain", "italy", "netherlands", "sweden", "norway",
    # UK cities
    "london", "manchester", "birmingham", "leeds", "liverpool",
    "bristol", "sheffield", "edinburgh", "glasgow", "cardiff",
    "newcastle", "nottingham", "coventry", "leicester", "oxford",
    "cambridge", "reading", "milton keynes",
    # US cities
    "new york", "los angeles", "chicago", "houston", "phoenix",
    "philadelphia", "san antonio", "san diego", "dallas", "san jose",
    "austin", "seattle", "denver", "boston", "atlanta",
    # Generic location words
    "remote", "hybrid", "on-site", "onsite", "nationwide", "worldwide",
}

# Section headers that appear as pseudo-skills
_SECTION_HEADER_RE = re.compile(
    r"^(skills?|technical skills?|core competenc|competenc|key skills?|"
    r"qualifications?|expertise|proficienc|abilities|strengths?|languages?|"
    r"interests?|hobbies|references?|contact|education|experience|"
    r"certifications?|awards?|achievements?|projects?|summary|objective|"
    r"profile|personal)\s*[:\-]?\s*$",
    re.I,
)


def _is_valid_skill(phrase: str) -> bool:
    if not phrase:
        return False

    stripped = phrase.strip(" .,;:-–()[]")
    lower    = stripped.lower()

    if len(stripped) < 2 or len(stripped) > 55:
        return False

    if not re.search(r"[a-zA-Z]", stripped):
        return False

    if lower in STOP_PHRASES:
        return False

    if lower in _KNOWN_LOCATIONS:       # ← Fix 6: expanded locations
        return False

    # Fix 3: strip leading single-char bullet artefacts before header check
    clean_for_header = re.sub(r"^[a-z]\s+", "", stripped, flags=re.I)
    if _SECTION_HEADER_RE.match(stripped) or _SECTION_HEADER_RE.match(clean_for_header):
        return False

    for pat in _NOISE_RE:               # ← Fix 1, 2, 4 added to _NOISE_RE
        if pat.search(stripped):
            return False

    if re.search(r"\b(of|in|at|from)\b", lower) and re.search(
        r"\b(science|arts|engineering|studies|university|college|faculty|school|technology|computing)\b",
        lower,
    ):
        return False

    words = stripped.split()
    if len(words) >= 5:
        return False

    if (
        stripped.isupper()
        and len(stripped) > 4
        and " " not in stripped
        and lower not in VALID_ACRONYMS
        and lower not in _ALL_ALIASES
    ):
        return False

    if re.match(r"^[a-zA-Z]+\d{3,}", stripped) and " " not in stripped:
        return False

    if len(words) == 1 and stripped[0].isupper() and lower not in _ALL_ALIASES and lower not in VALID_ACRONYMS:
        return False

    _VERB_STARTS = {
        # Past tense (existing)
        "analysed","analyzed","created","developed","built","designed","managed",
        "led","implemented","improved","maintained","delivered","coordinated",
        "assisted","supported","worked","helped","conducted","performed",
        "provided","prepared","handled","processed","monitored","reviewed",
        "achieved","established","ensured","collaborated","communicated",
        "trained","mentored","supervised","oversaw","generated","produced",
        "utilised","utilized","demonstrated","contributed","participated",
        "gained","undertook","completed","used","wrote","resolved","reduced",
        "increased","introduced","organised","organized","identified",
        "supported","engaged","operated","executed","deployed","configured",
        "tested","debugged","refactored","migrated","integrated","automated",
        "other","responsible","experience",
        # Fix 5: Gerunds
        "building","creating","developing","managing","leading",
        "implementing","designing","working","helping","conducting",
        "performing","providing","preparing","handling","processing",
        "monitoring","reviewing","achieving","establishing","ensuring",
        "collaborating","communicating","training","mentoring",
        "supervising","overseeing","generating","producing",
        "utilising","utilizing","demonstrating","contributing",
        "participating","gaining","undertaking","completing",
        "using","writing","resolving","reducing","increasing",
        "introducing","organising","organizing","identifying",
        "engaging","operating","executing","deploying",
        "configuring","debugging","refactoring","migrating",
        "integrating","automating",
    }
    if words and words[0].lower() in _VERB_STARTS:
        return False

    _PREPOSITIONS = {
        "with","using","in","at","for","by","of","from","on","into",
        "through","across","within","between","during","after","before","and",
    }
    if len(words) >= 3 and any(w.lower() in _PREPOSITIONS for w in words[1:]):
        return False

    _ROLE_SUFFIXES = {
        "worker","operative","sessions","activities","duties","tasks",
        "responsibilities","operations","procedures","processes",
    }
    if len(words) >= 2 and words[-1].lower() in _ROLE_SUFFIXES:
        return False

    return True


def _clean_phrase(phrase: str) -> str:
    """Strip punctuation / whitespace from edges of a candidate phrase."""
    p = re.sub(r"\s+", " ", phrase).strip(" .,;:-–()[]*/•\t")
    return p


def _find_alias_in_text(text_lower: str, alias: str) -> bool:
    """Word-boundary safe alias search. Skips very short aliases (<= 2 chars)."""
    if len(alias) <= 2:
        return False
    # Use lookahead/behind to avoid partial matches ("go" in "good")
    pattern = r"(?<![a-zA-Z0-9\-])" + re.escape(alias) + r"(?![a-zA-Z0-9\-])"
    try:
        return bool(re.search(pattern, text_lower))
    except re.error:
        return alias in text_lower


# Remove single/double-char aliases that cause false positives inside words
_ALL_ALIASES = {k: v for k, v in _ALL_ALIASES.items() if len(k.strip()) >= 3}

# ─────────────────────────────────────────────────────────────────────────────
# 3.  SECTION PARSERS
# ─────────────────────────────────────────────────────────────────────────────

SKILLS_SECTION_RE = re.compile(
    r"(?:^|\n)\s*(skills?|technical skills?|core competenc|competenc|key skills?|"
    r"qualifications?|expertise|proficienc|abilities|areas of expertise)\s*[:\-]?\s*\n",
    re.I | re.M,
)

EXPERIENCE_SECTION_RE = re.compile(
    r"(?:^|\n)\s*(work experience|professional experience|employment history|"
    r"experience|career history|work history)\s*[:\-]?\s*\n",
    re.I | re.M,
)

PROJECT_SECTION_RE = re.compile(
    r"(?:^|\n)\s*(projects?|portfolio|personal projects?|key projects?|"
    r"selected projects?|technical projects?)\s*[:\-]?\s*\n",
    re.I | re.M,
)

CERT_SECTION_RE = re.compile(
    r"(?:^|\n)\s*(certifications?|certificates?|licenses?|credentials?|"
    r"professional certifications?)\s*[:\-]?\s*\n",
    re.I | re.M,
)

EDUCATION_SECTION_RE = re.compile(
    r"(?:^|\n)\s*(education|academic|qualifications?|degrees?)\s*[:\-]?\s*\n",
    re.I | re.M,
)


def _section_text(text: str, header_re: re.Pattern, max_len: int = 3000) -> str:
    """Extract the text block immediately following a section header."""
    chunks = []
    for m in header_re.finditer(text):
        chunk = text[m.end(): m.end() + max_len]
        # Stop at the next major section header
        nxt = re.search(
            r"(?:^|\n)\s*(?:work experience|education|skills|projects|certifications|"
            r"references|contact|achievements|awards|interests|hobbies)\s*[:\-]?\s*\n",
            chunk, re.I | re.M,
        )
        chunks.append(chunk[: nxt.start()] if nxt else chunk[:max_len])
    return "\n".join(chunks)


# ─────────────────────────────────────────────────────────────────────────────
# 4.  MAIN EXTRACTION  — ontology lookup ONLY in skills sections;
#     free text only used for inferred skills (experience bullets).
# ─────────────────────────────────────────────────────────────────────────────

def extract_skills_from_cv_text(text: str) -> list[str]:
    """
    Extract validated, deduplicated skills from the full CV text.

    Strategy (ordered by confidence):
      A) Ontology lookup in dedicated SKILLS section  → highest confidence
      B) Comma/bullet phrase mining in SKILLS section → medium confidence
      C) Ontology lookup in CERTIFICATIONS section    → high confidence
      D) Whole-document ontology scan (aliases only)  → lower confidence,
         but kept because it catches skills mentioned in experience bullets
         (e.g. "Built REST APIs using Node.js")
      E) REJECT anything that fails _is_valid_skill()
    """
    if not text or not text.strip():
        return []

    text_lower   = text.lower()
    found: dict[str, str] = {}   # lower_key → canonical display name

    def add(canonical: str) -> None:
        k = canonical.lower()
        if k not in found and _is_valid_skill(canonical):
            found[k] = canonical

    # ── A) Ontology scan of skills section only ───────────────────────────────
    skills_text   = _section_text(text, SKILLS_SECTION_RE, 3000)
    skills_lower  = skills_text.lower()

    if skills_text:
        for alias, canonical in _ALL_ALIASES.items():
            if _find_alias_in_text(skills_lower, alias):
                add(canonical)

        # Comma / bullet / pipe delimited phrases within the skills section
        for part in re.split(r"[,;•|\n]|(?:\s+and\s+)", skills_text):
            phrase = _clean_phrase(part)
            if not phrase:
                continue
            # Normalise via ontology
            canonical = normalize_skill(phrase)
            if canonical and canonical.lower() != phrase.lower():
                # It resolved to a known canonical name
                add(canonical)
            elif _is_valid_skill(phrase) and len(phrase.split()) <= 5:
                # Unknown to ontology but passes validation — keep as-is (title-cased)
                add(phrase.title() if phrase.islower() else phrase)

    # ── A2) Bullet/comma mining ONLY from skills section ─────────────────────
    # Only extract from the skills section — never from experience bullets
    if skills_text:
        # Comma/semicolon/pipe delimited items (most CVs list skills this way)
        for part in re.split(r"[,;|\n•]", skills_text):
            phrase = _clean_phrase(part.strip("- *\t"))
            if not phrase or len(phrase.split()) >= 5:
                continue
            # Must not start with a verb
            first_word = phrase.split()[0].lower() if phrase.split() else ""
            _VERB_STARTS_LOCAL = {
                "analysed","created","developed","built","designed","managed","led",
                "implemented","assisted","supported","conducted","performed",
                "utilised","utilized","demonstrated","contributed","responsible",
            }
            if first_word in _VERB_STARTS_LOCAL:
                continue
            canonical = normalize_skill(phrase)
            if canonical and _is_valid_skill(canonical):
                add(canonical)

    # ── B) Certifications section ─────────────────────────────────────────────
    cert_text = _section_text(text, CERT_SECTION_RE, 2000)
    if cert_text:
        for alias, canonical in _ALL_ALIASES.items():
            if _find_alias_in_text(cert_text.lower(), alias):
                add(canonical)

    # ── C) Whole-document ontology scan ─────────────────────────────────────
    #    Only accept aliases that appear in the SKILLS/CERTS sections OR
    #    are found with proper word-boundary context in the full document.
    #    Single-char aliases already removed from _ALL_ALIASES above.
    for alias, canonical in _ALL_ALIASES.items():
        # Already found via skills section — skip
        if canonical.lower() in found:
            continue
        # Only scan full document for aliases >= 4 chars to avoid
        # catching "go" inside "good", "r" inside "report", etc.
        if len(alias) < 4:
            continue
        if _find_alias_in_text(text_lower, alias):
            # Prefer skills-section hits — add anything found there
            if _find_alias_in_text(skills_lower, alias):
                add(canonical)
            else:
                # Full-doc hit: only add if alias is clearly a skill term
                # (not a common English word that appears in any sentence)
                COMMON_ENGLISH = {
                    "chef", "word", "ruby", "rust", "flash", "next", "rest",
                    "lean", "swift", "dash", "mint", "sage", "base", "core",
                    "nest", "link", "line", "root", "node", "flow", "spark",
                    "data", "sales", "excel", "audit", "train", "drive",
                }
                if alias.lower() not in COMMON_ENGLISH:
                    add(canonical)
                elif _find_alias_in_text(skills_lower, alias):
                    add(canonical)

    # ── D) Final dedup + sort ─────────────────────────────────────────────────
    result = sorted(
        [v for v in found.values() if _is_valid_skill(v)],
        key=lambda s: s.lower(),
    )
    return result


# ─────────────────────────────────────────────────────────────────────────────
# 5.  ROLE / EXPERIENCE EXTRACTION  (unchanged logic, tightened validation)
# ─────────────────────────────────────────────────────────────────────────────

_ROLE_LINE_RE = re.compile(
    r"^[\s•\-*]*([A-Z][A-Za-z0-9\s/&\-]{4,60}?)"
    r"(?:\s+at\s+|\s+@\s+|\s+\|\s+|\s+[-–]\s+)",
    re.M,
)

_BULLET_RE = re.compile(
    r"^[\s•\-*]+\s*([A-Za-z][A-Za-z0-9\s/+#.&]{2,50})\s*$",
    re.M,
)


def extract_roles_from_cv(text: str) -> list[str]:
    roles, seen = [], set()
    for m in EXPERIENCE_SECTION_RE.finditer(text):
        chunk = text[m.end(): m.end() + 4000]
        for line in chunk.split("\n")[:40]:
            line = line.strip()
            if not line or len(line) < 6:
                continue
            rm = _ROLE_LINE_RE.match(line)
            if rm:
                title = _clean_phrase(rm.group(1))
                if title and title.lower() not in seen and _is_valid_skill(title):
                    seen.add(title.lower())
                    roles.append(title)
            elif (
                2 <= len(line.split()) <= 10
                and line[0].isupper()
                and not line.endswith(".")
                and sum(c.isdigit() for c in line) < 4
                and _is_valid_skill(line)
            ):
                t = _clean_phrase(line)
                if t and t.lower() not in seen:
                    seen.add(t.lower())
                    roles.append(t)
    return roles[:12]


def extract_projects_from_cv(text: str) -> list[str]:
    section = _section_text(text, PROJECT_SECTION_RE, 3000)
    if not section:
        return []
    projects, seen = [], set()
    for line in section.split("\n"):
        line = line.strip()
        if not line or len(line) < 8:
            continue
        cleaned = _clean_phrase(re.sub(r"^[\s•\-*]+", "", line))
        if cleaned and cleaned.lower() not in seen and _is_valid_skill(cleaned):
            seen.add(cleaned.lower())
            projects.append(cleaned)
    return projects[:12]


def extract_certifications_from_cv(text: str) -> list[str]:
    section = _section_text(text, CERT_SECTION_RE, 2000)
    if not section:
        return []
    certs, seen = [], set()
    for part in re.split(r"[,;\n]|(?:\s+and\s+)", section):
        phrase = _clean_phrase(re.sub(r"^[\s•\-*]+", "", part))
        if not phrase or len(phrase) < 4 or phrase.lower() in seen:
            continue
        if _is_valid_skill(phrase) or re.search(
            r"\b(pmp|aws|cissp|cscs|cpa|cfa|prince2|nebosh|iosh|comptia)\b",
            phrase, re.I,
        ):
            seen.add(phrase.lower())
            certs.append(phrase.title() if phrase.islower() else phrase)
    return certs[:15]


def extract_education_from_cv(text: str) -> list[str]:
    section = _section_text(text, EDUCATION_SECTION_RE, 2500)
    if not section:
        return []
    entries, seen = [], set()
    for line in section.split("\n"):
        line = line.strip()
        if not line or len(line) < 6:
            continue
        if re.search(
            r"\b(bachelor|master|phd|b\.?sc|m\.?sc|mba|degree|diploma|university|college|hnd)\b",
            line, re.I,
        ):
            k = line.lower()[:80]
            if k not in seen:
                seen.add(k)
                entries.append(line[:120])
    return entries[:8]


# ─────────────────────────────────────────────────────────────────────────────
# 6.  SKILL STRENGTH WEIGHTING
# ─────────────────────────────────────────────────────────────────────────────

def extract_strengths(text: str, skills: list[str]) -> dict[str, float]:
    """Frequency-based weighting: skills mentioned more often score higher."""
    if not text:
        return {s: 1.0 for s in skills}

    text_lower   = text.lower()
    skills_text  = _section_text(text, SKILLS_SECTION_RE, 3000).lower()
    counts       = Counter()

    for skill in skills:
        sk = skill.lower()
        counts[skill] = len(re.findall(re.escape(sk), text_lower))
        for alias, canonical in _ALL_ALIASES.items():
            if canonical.lower() == sk and _find_alias_in_text(text_lower, alias):
                counts[skill] += 1

    section_boost = {
        skill for skill in skills if skill.lower() in skills_text
    }

    max_c = max(counts.values(), default=1) or 1
    strengths: dict[str, float] = {}
    for skill in skills:
        base = counts.get(skill, 0) / max_c
        if skill in section_boost:
            base = min(1.0, base + 0.35)
        strengths[skill] = round(max(0.25, min(1.0, base)), 3)
    return strengths


# ─────────────────────────────────────────────────────────────────────────────
# 7.  EXPERIENCE INFERENCE  (only from bullet points / role titles)
# ─────────────────────────────────────────────────────────────────────────────

_INFERENCE_RULES: list[tuple[re.Pattern, list[str]]] = [
    # Tech
    (re.compile(r"\b(software engineer|software developer|full.?stack|web developer|frontend|backend|mobile developer|devops|programmer)\b", re.I), ["Software Development"]),
    (re.compile(r"\b(react|vue|angular|javascript|typescript|frontend)\b", re.I), ["JavaScript", "Web Development"]),
    (re.compile(r"\b(rest api|restful|node\.?js|django|flask|fastapi|backend)\b", re.I), ["REST APIs", "Backend Development"]),
    (re.compile(r"\b(postgresql|mysql|mongodb|redis|database|sql)\b", re.I), ["Database Management", "SQL"]),
    (re.compile(r"\b(cloud|aws|azure|gcp|kubernetes|docker|ci/?cd)\b", re.I), ["DevOps", "Cloud"]),
    (re.compile(r"\b(machine learning|deep learning|data scien|nlp|pytorch|tensorflow)\b", re.I), ["Machine Learning", "Data Science"]),
    (re.compile(r"\b(data analysis|analytics|reporting|dashboards?|power bi|tableau)\b", re.I), ["Data Analysis"]),
    # Non-tech
    (re.compile(r"\b(marketing manager|digital marketing|seo|content marketing|brand)\b", re.I), ["Marketing"]),
    (re.compile(r"\b(sales executive|account manager|business development|b2b)\b", re.I), ["Sales"]),
    (re.compile(r"\b(financial analyst|accountant|bookkeeper|audit|finance manager)\b", re.I), ["Accounting", "Financial Analysis"]),
    (re.compile(r"\b(registered nurse|clinical|patient care|healthcare assistant|ward)\b", re.I), ["Nursing", "Patient Care"]),
    (re.compile(r"\b(construction|site manager|civil engineer|quantity surveyor|bim)\b", re.I), ["Construction", "Project Management"]),
    (re.compile(r"\b(teacher|lecturer|tutor|classroom|curriculum|pedagogy)\b", re.I), ["Teaching", "Lesson Planning"]),
    (re.compile(r"\b(warehouse|logistics|supply chain|inventory|forklift|hgv)\b", re.I), ["Logistics", "Warehouse"]),
    (re.compile(r"\b(hotel|restaurant|chef|hospitality|front of house|catering)\b", re.I), ["Hospitality"]),
    (re.compile(r"\b(managed team|led team|team lead|supervised|mentored|line manage)\b", re.I), ["Leadership", "Team Management"]),
    (re.compile(r"\b(project management|managed projects|project lead|programme manager)\b", re.I), ["Project Management"]),
    (re.compile(r"\b(agile|scrum|sprint|kanban)\b", re.I), ["Agile"]),
    (re.compile(r"\b(automated tests?|unit tests?|qa|quality assurance|testing)\b", re.I), ["Testing"]),
    (re.compile(r"\b(recruitment|talent acquisition|hr |human resources|onboarding)\b", re.I), ["Human Resources", "Recruitment"]),
]

_ROLE_INFERENCE: list[tuple[re.Pattern, list[str]]] = [
    (re.compile(r"\b(software|developer|engineer|devops|programmer|architect)\b", re.I), ["Software Development"]),
    (re.compile(r"\b(frontend|ui engineer|web developer)\b", re.I), ["JavaScript", "Web Development"]),
    (re.compile(r"\b(backend|api developer)\b", re.I), ["Backend Development", "REST APIs"]),
    (re.compile(r"\b(data scien|data analyst|bi developer)\b", re.I), ["Data Science", "Data Analysis"]),
    (re.compile(r"\b(marketing|brand|seo|content)\b", re.I), ["Marketing"]),
    (re.compile(r"\b(sales|account executive|business development)\b", re.I), ["Sales"]),
    (re.compile(r"\b(finance|accountant|analyst|auditor)\b", re.I), ["Finance", "Accounting"]),
    (re.compile(r"\b(nurse|clinical|medical|healthcare|care)\b", re.I), ["Healthcare", "Patient Care"]),
    (re.compile(r"\b(construction|builder|surveyor|site manager)\b", re.I), ["Construction"]),
    (re.compile(r"\b(teacher|lecturer|educator|tutor)\b", re.I), ["Teaching"]),
    (re.compile(r"\b(driver|warehouse|logistics|courier)\b", re.I), ["Logistics"]),
    (re.compile(r"\b(chef|hospitality|waiter|bartender|catering)\b", re.I), ["Hospitality"]),
    (re.compile(r"\b(hr|recruiter|talent|people)\b", re.I), ["Human Resources"]),
]


def infer_skills_from_experience(text: str, roles: list[str] | None = None) -> list[str]:
    """Infer skills only from experience bullets and role titles — never free-form."""
    if not text and not roles:
        return []

    inferred: dict[str, str] = {}

    # Only scan the experience section, not the whole document
    exp_section = _section_text(text, EXPERIENCE_SECTION_RE, 5000) or text[:6000]
    blob = f"{exp_section}\n{' '.join(roles or [])}".lower()

    for pattern, skills in _INFERENCE_RULES:
        if pattern.search(blob):
            for s in skills:
                if _is_valid_skill(s):
                    inferred[s.lower()] = s

    for role in (roles or []):
        for pattern, skills in _ROLE_INFERENCE:
            if pattern.search(role):
                for s in skills:
                    if _is_valid_skill(s):
                        inferred[s.lower()] = s

    return sorted(inferred.values(), key=lambda s: s.lower())


def build_matching_skills(
    explicit_skills: list[str],
    cv_text: str = "",
    roles: list[str] | None = None,
) -> tuple[list[str], list[str]]:
    """
    Merge explicit + inferred skills.
    Returns (all_skills_for_matching, inferred_only_list).
    """
    explicit = list(explicit_skills or [])
    if not explicit and cv_text:
        explicit = extract_skills_from_cv_text(cv_text)

    inferred  = infer_skills_from_experience(cv_text, roles)

    # Add cert skills
    for cert in extract_certifications_from_cv(cv_text):
        canonical = normalize_skill(cert)
        if _is_valid_skill(canonical) and canonical != cert.lower():
            inferred.append(canonical)

    # Dedupe inferred
    inferred_map: dict[str, str] = {}
    for s in inferred:
        inferred_map[s.lower()] = s
    inferred = sorted(inferred_map.values(), key=lambda s: s.lower())

    # Merge all
    merged: dict[str, str] = {}
    for s in explicit:
        merged[s.lower()] = s
    for s in inferred:
        if s.lower() not in merged:
            merged[s.lower()] = s

    all_skills    = sorted(merged.values(), key=lambda s: s.lower())
    inferred_only = [s for s in inferred if s.lower() not in {e.lower() for e in explicit}]
    return all_skills, inferred_only


def extract_cv_profile(text: str) -> dict:
    """Full structured CV profile for the matching pipeline."""
    explicit      = extract_skills_from_cv_text(text)
    roles         = extract_roles_from_cv(text)
    projects      = extract_projects_from_cv(text)
    certifications = extract_certifications_from_cv(text)
    education     = extract_education_from_cv(text)
    skills, inferred = build_matching_skills(explicit, text, roles)
    strengths     = extract_strengths(text, skills)

    return {
        "skills":          skills,
        "explicit_skills": explicit,
        "inferred_skills": inferred,
        "roles":           roles,
        "projects":        projects,
        "certifications":  certifications,
        "education":       education,
        "strengths":       strengths,
    }