# """
# Job Matching Engine

# Uses a combination of:
# 1. TF-IDF + Cosine Similarity — semantic text matching between CV and job description
# 2. Skill set overlap — direct comparison of extracted skills vs required skills
# 3. Experience fit — years of experience vs job requirements
# 4. Weighted composite score per the spec: 40/30/20/10

# All scores are 0–100 integers.
# """

# import re
# import math
# import logging
# from typing import Union, Optional, List, Dict, Any
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity
# import numpy as np

# from .skill_ontology import normalize_skills_list, normalize_skill, skill_semantic_similarity
# from .skill_domains import classify_user_domains, classify_job_domain, domain_alignment_score
# from .job_skill_extractor import extract_skills_from_job
# from .cv_skill_extractor import (
#     extract_roles_from_cv,
#     build_matching_skills,
#     extract_projects_from_cv,
#     extract_certifications_from_cv,
#     extract_education_from_cv,
# )

# MIN_WORKABLE_FIT = 0.45  # Below this — unlikely the user can perform the role well
# MIN_DOMAIN_ALIGN = 0.28

# logger = logging.getLogger(__name__)

# # ── Text preprocessing ────────────────────────────────────────────────────────

# # English stop words (common words that add no matching value)
# STOP_WORDS = {
#     "a","an","the","and","or","but","in","on","at","to","for","of","with",
#     "by","from","as","is","was","are","were","be","been","being","have",
#     "has","had","do","does","did","will","would","could","should","may",
#     "might","shall","can","need","dare","ought","used","able","i","you",
#     "he","she","it","we","they","what","which","who","this","that","these",
#     "those","my","your","his","her","its","our","their","experience","years",
#     "work","working","team","looking","strong","good","excellent","ability",
#     "knowledge","understanding","familiarity","skills","skill","using","use",
#     "proficient","proficiency","expertise","including","include","such","etc",
#     "also","well","great","preferred","required","must","plus","bonus","university","degree","bachelor","master","phd","high","school","college",
# }


# def preprocess_text(text: str) -> str:
#     """
#     Clean and normalize text for TF-IDF vectorization.
#     - Lowercase
#     - Remove special characters (keep alphanumeric + spaces)
#     - Remove stop words
#     - Collapse whitespace
#     """
#     text = text.lower()
#     # Keep letters, numbers, dots (for things like "node.js" → handled by ontology)
#     text = re.sub(r"[^a-z0-9\s\.\+\#]", " ", text)
#     # Remove standalone numbers (page numbers etc.) but keep "5 years" context
#     tokens = text.split()
#     tokens = [t for t in tokens if t not in STOP_WORDS and len(t) > 1]
#     return " ".join(tokens)


# # ── TF-IDF Engine ─────────────────────────────────────────────────────────────

# class JobMatcher:
#     """
#     Maintains a TF-IDF matrix of all job descriptions.
#     When a user's CV text comes in, compute cosine similarity against all jobs.
#     """

#     def __init__(self):
#         self.vectorizer = TfidfVectorizer(
#             ngram_range=(1, 2),    # Unigrams + bigrams ("machine learning" as one token)
#             max_features=5000,     # Top 5k features — keeps it fast
#             min_df=1,              # Include terms that appear in at least 1 doc
#             sublinear_tf=True,     # Apply log normalization to TF — reduces impact of frequent terms
#         )
#         self.job_matrix    = None   # TF-IDF matrix for all jobs
#         self.jobs_data     = []     # Original job dicts
#         self._is_fitted    = False  # Whether vectorizer has been trained

#     def fit(self, jobs: list):
#         """
#         Build the TF-IDF matrix from a list of job documents.
#         Call this once when loading jobs, then call match() per user.

#         Args:
#             jobs: list of dicts with keys: title, description, skills, requirements, etc.
#         """
#         if not jobs:
#             logger.warning("No jobs provided to fit matcher.")
#             return

#         self.jobs_data = jobs

#         # Build the document for each job: combine all text fields
#         job_documents = []
#         for job in jobs:
#             doc = self._build_job_document(job)
#             job_documents.append(preprocess_text(doc))

#         # Fit and transform — creates the TF-IDF matrix
#         self.job_matrix  = self.vectorizer.fit_transform(job_documents)
#         self._is_fitted  = True
#         logger.info(f"TF-IDF fitted on {len(jobs)} jobs. Vocabulary size: {len(self.vectorizer.vocabulary_)}")

#     def _build_job_document(self, job: dict) -> str:
#         """
#         Concatenate all relevant job fields into one document for TF-IDF.
#         We repeat skills 3x to give them extra weight in the vocabulary.
#         """
#         parts = [
#             job.get("title", ""),
#             job.get("description", ""),
#             job.get("level", ""),
#             " ".join(job.get("requirements", [])),
#             " ".join(job.get("responsibilities", [])),
#             # Repeat skills 3x — skills are the most important matching signal
#             " ".join(job.get("skills", [])) * 3,
#         ]
#         return " ".join(p for p in parts if p)

#     def _extract_education_text(self, cv_text: str) -> str:
#         """Pull education-related lines for semantic matching."""
#         if not cv_text:
#             return ""
#         edu_headers = re.compile(
#             r"(?:^|\n)\s*(education|academic|qualifications?|degrees?)\s*[:\-]?\s*\n",
#             re.I | re.M,
#         )
#         chunks = []
#         for m in edu_headers.finditer(cv_text):
#             chunk = cv_text[m.end() : m.end() + 1200]
#             chunks.append(chunk.split("\n\n")[0])
#         if not chunks:
#             for line in cv_text.split("\n"):
#                 if re.search(
#                     r"\b(bachelor|master|phd|b\.?sc|m\.?sc|degree|university|college)\b",
#                     line,
#                     re.I,
#                 ):
#                     chunks.append(line)
#         return " ".join(chunks)[:2000]

#     def _build_user_document(
#         self,
#         user_skills: list,
#         cv_text: str = "",
#         cv_roles: Optional[list] = None,
#         projects: Optional[list] = None,
#         certifications: Optional[list] = None,
#         education: Optional[list] = None,
#     ) -> str:
#         """Build the user's document for matching against jobs."""
#         education_text = self._extract_education_text(cv_text)
#         if education:
#             education_text = f"{education_text} {' '.join(education)}"
#         roles_blob = " ".join(cv_roles or []) * 2
#         projects_blob = " ".join(projects or []) * 2
#         certs_blob = " ".join(certifications or [])
#         parts = [
#             cv_text,
#             education_text,
#             roles_blob,
#             projects_blob,
#             certs_blob,
#             " ".join(user_skills) * 3,
#         ]
#         return " ".join(p for p in parts if p)

#     def _compute_skill_overlap(
#         self,
#         user_skills: list,
#         job_skills: list,
#         strengths: Optional[dict] = None,
#     ) -> float:
#         """
#         Weighted overlap — skills the user emphasizes on their CV count more.
#         """
#         if not job_skills:
#             return 0.0

#         user_norm = set(normalize_skills_list(user_skills))
#         job_norm = set(normalize_skills_list(job_skills))

#         if not user_norm:
#             return 0.0

#         matched = user_norm.intersection(job_norm)
#         if not matched:
#             # Partial: substring + semantic family overlap
#             partial = 0.0
#             for js in job_norm:
#                 for us in user_norm:
#                     if js.lower() in us.lower() or us.lower() in js.lower():
#                         partial = max(partial, 0.35)
#                     else:
#                         sim = skill_semantic_similarity(us, js)
#                         if sim >= 0.55:
#                             partial = max(partial, sim * 0.65)
#             return partial

#         weighted_hits = 0.0
#         for skill in matched:
#             w = 1.0
#             if strengths:
#                 for k, v in strengths.items():
#                     if k.lower() == skill.lower() or skill.lower() in k.lower():
#                         w = max(w, float(v))
#                         break
#             weighted_hits += w

#         recall = weighted_hits / len(job_norm)
#         precision = weighted_hits / len(user_norm)
#         if recall + precision == 0:
#             return 0.0
#         f1 = 2 * (precision * recall) / (precision + recall)
#         return min(0.7 * recall + 0.3 * f1, 1.0)

#     def _compute_role_fit(self, cv_roles: list, job: dict) -> float:
#         """How well past job titles align with this posting."""
#         if not cv_roles:
#             return 0.5

#         title = (job.get("title") or "").lower()
#         title_tokens = set(re.findall(r"[a-z]{3,}", title))
#         if not title_tokens:
#             return 0.5

#         best = 0.0
#         for role in cv_roles:
#             role_lower = role.lower()
#             role_tokens = set(re.findall(r"[a-z]{3,}", role_lower))
#             if not role_tokens:
#                 continue
#             overlap = len(title_tokens & role_tokens) / max(len(title_tokens), 1)
#             if role_lower in title or title in role_lower:
#                 overlap = max(overlap, 0.85)
#             best = max(best, overlap)

#         return min(best, 1.0)

#     def _compute_project_fit(self, projects: list, job: dict, job_skills: list) -> float:
#         """Relevance of CV projects to this job."""
#         if not projects:
#             return 0.0

#         job_blob = " ".join(
#             [
#                 job.get("title", ""),
#                 job.get("description", ""),
#                 " ".join(job_skills),
#             ]
#         ).lower()
#         hits = 0
#         for project in projects:
#             tokens = [t for t in re.findall(r"[a-z]{4,}", project.lower()) if t not in STOP_WORDS]
#             if any(t in job_blob for t in tokens):
#                 hits += 1
#         return min(1.0, hits / max(len(projects), 1))

#     def _compute_education_fit(self, education: list, job: dict) -> float:
#         """Education / certification alignment with job requirements."""
#         if not education:
#             return 0.0

#         job_text = " ".join(
#             [
#                 job.get("title", ""),
#                 job.get("description", ""),
#                 " ".join(job.get("requirements") or []),
#                 job.get("industry", ""),
#             ]
#         ).lower()

#         hits = 0
#         for entry in education:
#             tokens = [t for t in re.findall(r"[a-z]{4,}", entry.lower()) if len(t) > 3]
#             if any(t in job_text for t in tokens):
#                 hits += 1
#         return min(1.0, 0.4 + (hits / max(len(education), 1)) * 0.6)

#     def _compute_experience_fit(self, user_years: int, job_years_required: int) -> float:
#         """
#         Score how well the user's experience matches the job's requirement.
#         - Exact match or slight over = 1.0
#         - Under by 1–2 years = partial credit (employers often hire slightly junior)
#         - Over by 3+ years = slight reduction (over-qualified risk)
#         Returns 0.0–1.0
#         """
#         if job_years_required == 0:
#             return 0.8  # No requirement stated = most people qualify

#         diff = user_years - job_years_required

#         if diff >= 0 and diff <= 3:
#             return 1.0     # Perfect range
#         elif diff > 3:
#             # Overqualified — penalize slightly
#             return max(0.7, 1.0 - (diff - 3) * 0.05)
#         elif diff >= -2:
#             # Slightly under — partial credit (employers often stretch)
#             return 0.75 + diff * 0.1   # diff is negative here
#         else:
#             # Significantly under — low but not zero
#             return max(0.2, 0.75 + diff * 0.08)

#     def _compute_growth_alignment(self, job: dict) -> float:
#         """
#         Score how well the job aligns with career growth signals.
#         Based on demand trend and featured status.
#         Returns 0.0–1.0
#         """
#         trend_scores = {"Increasing": 1.0, "Stable": 0.75, "Decreasing": 0.5}
#         trend_score  = trend_scores.get(job.get("demandTrend", "Stable"), 0.75)
#         featured_bonus = 0.05 if job.get("featured", False) else 0.0
#         return min(trend_score + featured_bonus, 1.0)

#     def _compute_cultural_fit(
#         self, user_skills: list, job: dict, user_domains: Optional[dict] = None
#     ) -> float:
#         """
#         Industry/domain alignment + remote preference heuristic.
#         Returns 0.0–1.0
#         """
#         remote_bonus = 0.08 if job.get("remote", False) else 0.0

#         job_industry = (job.get("industry") or "").lower()
#         industry_bonus = 0.0
#         if job_industry and user_domains:
#             for domain, weight in user_domains.items():
#                 if domain == "general":
#                     continue
#                 if domain.lower() in job_industry or job_industry in domain.lower():
#                     industry_bonus = max(industry_bonus, 0.12 + weight * 0.15)

#         if not industry_bonus and job_industry:
#             skill_blob = " ".join(user_skills).lower()
#             tokens = [t for t in re.findall(r"[a-z]{4,}", job_industry) if t in skill_blob]
#             industry_bonus = min(0.12, len(tokens) * 0.04)

#         return min(0.55 + remote_bonus + industry_bonus, 1.0)

#     def _apply_dynamic_scores(self, results: list) -> list:
#         """
#         Map raw composite fit (0–1) to display percentages so scores reflect
#         actual match quality, not just rank position in the list.
#         """
#         if not results:
#             return results

#         for r in results:
#             raw = float(r.get("raw_score", 0))
#             if r.get("workable"):
#                 span = max(0.01, 1.0 - MIN_WORKABLE_FIT)
#                 normalized = (raw - MIN_WORKABLE_FIT) / span
#                 r["match_score"] = min(97, max(52, int(52 + normalized * 45)))
#             else:
#                 r["match_score"] = min(44, max(8, int(raw * 50)))

#         results.sort(key=lambda x: x["match_score"], reverse=True)
#         return results

#     def _build_match_factors(
#         self,
#         matched_skills: list,
#         missing_skills: list,
#         component_scores: dict,
#         domain_score: float,
#         roles: list,
#         inferred_skills: list,
#         years_exp: int = 0,
#         projects: Optional[list] = None,
#     ) -> list:
#         """Human-readable reasons this job was matched."""
#         factors = []
#         if matched_skills:
#             top = ", ".join(matched_skills[:5])
#             suffix = f" (+{len(matched_skills) - 5} more)" if len(matched_skills) > 5 else ""
#             factors.append(f"Matched skills: {top}{suffix}")
#         if inferred_skills and matched_skills:
#             inf_hits = [
#                 s for s in inferred_skills
#                 if s.lower() in {m.lower() for m in matched_skills}
#             ]
#             if inf_hits:
#                 factors.append(f"Inferred from experience: {', '.join(inf_hits[:4])}")
#         if years_exp and component_scores.get("experience_fit", 0) >= 60:
#             factors.append(f"{years_exp} years experience")
#         if roles and component_scores.get("role_fit", 0) >= 35:
#             factors.append(f"Role fit: {', '.join(roles[:2])}")
#         if projects and component_scores.get("project_fit", 0) >= 30:
#             factors.append(f"Project relevance: {projects[0][:50]}")
#         if component_scores.get("tfidf_sim", 0) >= 0.08:
#             factors.append("CV content similarity")
#         if domain_score >= 0.5:
#             factors.append("Industry/domain alignment")
#         if missing_skills and len(missing_skills) <= 4:
#             factors.append(f"Skill gaps: {', '.join(missing_skills[:4])}")
#         return factors[:6]

#     def _build_match_summary(
#         self,
#         matched_skills: list,
#         years_exp: int,
#         roles: list,
#     ) -> str:
#         """Single-line summary e.g. Matched: React, Node.js · 3 years experience."""
#         parts = []
#         if matched_skills:
#             parts.append("Matched: " + ", ".join(matched_skills[:4]))
#             if len(matched_skills) > 4:
#                 parts[-1] += f" (+{len(matched_skills) - 4})"
#         if years_exp:
#             parts.append(f"{years_exp} years experience")
#         if roles:
#             parts.append(f"Role: {roles[0]}")
#         return " · ".join(parts) if parts else "Profile similarity match"

#     def match(
#         self,
#         user_skills: list,
#         cv_text:     str  = "",
#         years_exp:   int  = 0,
#         top_n:       int  = 20,
#         strengths:   dict | None = None,
#         cv_roles:    Optional[list] = None,
#     ) -> list:
#         """
#         Main matching function. Returns a list of jobs sorted by match score.

#         Args:
#             user_skills: List of canonical skill names from the user's profile/CV
#             cv_text:     Raw text from the CV (for TF-IDF)
#             years_exp:   Years of experience from the CV
#             top_n:       Return only the top N matches

#         Returns:
#             List of dicts: [{job, match_score, component_scores, matched_skills, missing_skills}]
#         """
#         if not self._is_fitted:
#             logger.error("Matcher not fitted. Call fit(jobs) first.")
#             return []

#         if not user_skills and not cv_text:
#             logger.warning("No user skills or CV text provided — returning neutral scores.")

#         strengths = strengths or {}
#         roles = cv_roles if cv_roles is not None else (
#             extract_roles_from_cv(cv_text) if cv_text else []
#         )

#         user_skills, inferred_skills = build_matching_skills(
#             user_skills, cv_text, roles
#         )
#         logger.info(
#             "Matching profile: %d skills (%d inferred), %d roles",
#             len(user_skills),
#             len(inferred_skills),
#             len(roles),
#         )
#         if inferred_skills:
#             logger.debug("Inferred skills: %s", ", ".join(inferred_skills))

#         user_domains = classify_user_domains(user_skills, roles, cv_text)

#         projects = extract_projects_from_cv(cv_text) if cv_text else []
#         certifications = extract_certifications_from_cv(cv_text) if cv_text else []
#         education = extract_education_from_cv(cv_text) if cv_text else []

#         user_doc = self._build_user_document(
#             user_skills, cv_text, roles, projects, certifications, education
#         )
#         user_vector = self.vectorizer.transform([preprocess_text(user_doc)])
#         tfidf_scores = cosine_similarity(user_vector, self.job_matrix).flatten()

#         results = []

#         for idx, job in enumerate(self.jobs_data):
#             tfidf_sim = float(tfidf_scores[idx])
#             job_skills = extract_skills_from_job(job)

#             skill_score = self._compute_skill_overlap(
#                 user_skills, job_skills, strengths
#             )
#             exp_score = self._compute_experience_fit(
#                 years_exp, job.get("yearsExp", 0)
#             )
#             role_score = self._compute_role_fit(roles, job)
#             project_score = self._compute_project_fit(projects, job, job_skills)
#             education_score = self._compute_education_fit(education, job)
#             growth_score = self._compute_growth_alignment(job)
#             culture_score = self._compute_cultural_fit(user_skills, job, user_domains)

#             job_domains = classify_job_domain({**job, "skills": job_skills})
#             domain_score = domain_alignment_score(user_domains, job_domains)

#             # Priority-weighted blend: skills > experience text > roles > projects > education > domain
#             blended_skill = (
#                 0.40 * skill_score
#                 + 0.28 * tfidf_sim
#                 + 0.17 * role_score
#                 + 0.08 * project_score
#                 + 0.07 * education_score
#             )
#             blended_skill = min(1.0, blended_skill * (0.20 + 0.80 * domain_score))

#             skill_weight = 0.48 + 0.22 * blended_skill
#             exp_weight = 0.24 + 0.08 * exp_score
#             role_weight = 0.16
#             project_weight = 0.07
#             domain_weight = 0.05
#             total_w = skill_weight + exp_weight + role_weight + project_weight + domain_weight
#             composite = (
#                 skill_weight * blended_skill
#                 + exp_weight * exp_score
#                 + role_weight * role_score
#                 + project_weight * project_score
#                 + domain_weight * domain_score
#             ) / total_w

#             workable = (
#                 composite >= MIN_WORKABLE_FIT
#                 and domain_score >= MIN_DOMAIN_ALIGN
#                 and (
#                     skill_score >= 0.15
#                     or tfidf_sim >= 0.08
#                     or role_score >= 0.40
#                 )
#             )

#             user_norm = set(normalize_skills_list(user_skills))
#             job_norm = set(normalize_skills_list(job_skills))
#             matched_skills = sorted(user_norm.intersection(job_norm))
#             missing_skills = sorted(job_norm - user_norm)

#             component_scores = {
#                 "skill_match": int(round(blended_skill * 100)),
#                 "experience_fit": int(round(exp_score * 100)),
#                 "role_fit": int(round(role_score * 100)),
#                 "project_fit": int(round(project_score * 100)),
#                 "education_fit": int(round(education_score * 100)),
#                 "domain_align": int(round(domain_score * 100)),
#                 "tfidf_sim": round(tfidf_sim, 4),
#             }
#             match_factors = self._build_match_factors(
#                 matched_skills,
#                 missing_skills,
#                 component_scores,
#                 domain_score,
#                 roles,
#                 inferred_skills,
#                 years_exp,
#                 projects,
#             )
#             match_summary = self._build_match_summary(matched_skills, years_exp, roles)

#             results.append({
#                 "job": job,
#                 "raw_score": composite,
#                 "workable": workable,
#                 "match_score": 0,
#                 "component_scores": component_scores,
#                 "matched_skills": matched_skills,
#                 "missing_skills": missing_skills,
#                 "match_factors": match_factors,
#                 "match_summary": match_summary,
#             })

#         results = self._apply_dynamic_scores(results)
#         workable_only = [r for r in results if r.get("workable")]
#         if workable_only:
#             pool = workable_only
#         else:
#             # No strong matches — return empty rather than unrelated defaults
#             logger.warning(
#                 "No workable matches for profile (skills=%d, roles=%d)",
#                 len(user_skills),
#                 len(roles),
#             )
#             pool = []
#         pool.sort(key=lambda x: x["match_score"], reverse=True)
#         return pool[:top_n]


# # ── Singleton instance — initialized once at startup ─────────────────────────
# _matcher_instance: Optional[JobMatcher] = None


# def get_matcher() -> JobMatcher:
#     """Return the singleton matcher instance."""
#     global _matcher_instance
#     if _matcher_instance is None:
#         _matcher_instance = JobMatcher()
#     return _matcher_instance

"""
matcher.py  —  Smart Job Matching Engine
=========================================
Works for ALL industries: tech, healthcare, finance, education,
logistics, hospitality, construction, legal, HR, sales, etc.

Scoring formula (weighted composite):
  skill_overlap      35%  — how many job-required skills the user has
  tfidf_similarity   20%  — semantic CV–job text similarity
  role_alignment     20%  — past job titles vs this job's title
  experience_fit     15%  — years of exp vs job requirement
  domain_alignment   10%  — industry/sector match

All scores normalised to 0–100 integer percentages.
"""

import re
import logging
from typing import Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .skill_ontology import normalize_skills_list

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# TEXT PRE-PROCESSING
# ─────────────────────────────────────────────────────────────────────────────

_STOP = {
    "a","an","the","and","or","but","in","on","at","to","for","of","with",
    "by","from","as","is","was","are","were","be","been","have","has","had",
    "do","does","did","will","would","could","should","may","might","can",
    "i","you","he","she","it","we","they","this","that","these","those",
    "my","your","his","her","its","our","their","what","which","who",
    # CV-specific noise
    "experience","years","work","working","team","strong","good","excellent",
    "ability","knowledge","understanding","skills","skill","using","use",
    "proficient","proficiency","expertise","including","include","etc",
    "also","well","great","preferred","required","must","plus","bonus",
    "university","degree","bachelor","master","phd","high","school","college",
}


def _preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s.#+]", " ", text)
    tokens = [t for t in text.split() if t not in _STOP and len(t) > 1]
    return " ".join(tokens)


# ─────────────────────────────────────────────────────────────────────────────
# DOMAIN TAXONOMY  —  maps skills + role keywords → sector
# ─────────────────────────────────────────────────────────────────────────────

DOMAIN_SKILLS: dict[str, set[str]] = {
    "technology": {
        "react","vue","angular","typescript","javascript","python","node.js","java",
        "go","rust","docker","kubernetes","aws","gcp","azure","postgresql","mongodb",
        "redis","graphql","machine learning","pytorch","tensorflow","nlp","css","html",
        "tailwind","devops","ci/cd","software development","web development",
        "backend development","api development","rest apis","linux","database management",
        "data science","cloud","scikit-learn","pandas","numpy","matplotlib","jupyter",
        "vb.net","c#","c++","git","sql","r","matlab",
    },
    "healthcare": {
        "nursing","patient care","medical","pharmacy","healthcare","clinical",
        "hospital","care assistant","midwife","dentist","physiotherapy",
        "phlebotomy","radiology","mental health","first aid","medication administration",
        "wound care","bls","acls","cpr","clinical assessment",
    },
    "finance": {
        "accounting","bookkeeping","financial analysis","budgeting","audit","tax",
        "payroll","compliance","risk management","sap","quickbooks","xero","sage",
        "excel","financial modelling","credit analysis","investment banking",
        "bloomberg","gaap","ifrs","vat","accounts payable","accounts receivable",
        "financial reporting",
    },
    "education": {
        "teaching","lesson planning","safeguarding","send","tefl","tesol",
        "curriculum","classroom management","pedagogy","tutoring","e-learning",
    },
    "marketing": {
        "seo","sem","google ads","social media","content marketing","email marketing",
        "hubspot","brand management","market research","crm","google analytics",
        "digital marketing","ppc","copywriting","marketing",
    },
    "sales": {
        "sales","account management","business development","cold calling","crm",
        "negotiation","pipeline management","b2b sales","b2c sales","salesforce",
        "lead generation",
    },
    "hr": {
        "recruitment","human resources","employee relations","training","cipd",
        "performance management","onboarding","payroll","hris","workday","bamboohr",
    },
    "logistics": {
        "driving","warehouse","logistics","supply chain","inventory management",
        "procurement","forklift","hgv","fleet management","delivery","shipping",
    },
    "hospitality": {
        "hospitality","chef","food safety","barista","bartending","hotel management",
        "front of house","catering","customer service",
    },
    "construction": {
        "construction","autocad","revit","project management","health and safety",
        "nebosh","iosh","cscs","electrician","plumber","carpentry","hvac","bim",
    },
    "legal": {
        "corporate law","contract law","legal research","due diligence",
        "litigation","compliance","gdpr","employment law",
    },
    "creative": {
        "figma","photoshop","illustrator","indesign","after effects","premiere pro",
        "wordpress","shopify","ux design","ui design","graphic design",
        "photography","videography",
    },
    "data": {
        "data analysis","power bi","tableau","spss","excel","reporting",
        "data science","machine learning","sql","python","r",
    },
}

DOMAIN_TITLE_RE: dict[str, re.Pattern] = {
    "technology":  re.compile(r"\b(software|developer|engineer|devops|programmer|architect|data scientist|ml|ai|cloud|cyber|it |sysadmin)\b", re.I),
    "healthcare":  re.compile(r"\b(nurse|clinical|medical|doctor|pharmacy|care|health|ward|gp |therapist|midwife|dentist)\b", re.I),
    "finance":     re.compile(r"\b(accountant|finance|auditor|analyst|bookkeeper|tax|payroll|treasury|credit|actuary)\b", re.I),
    "education":   re.compile(r"\b(teacher|lecturer|tutor|educator|teaching|classroom|school|college)\b", re.I),
    "marketing":   re.compile(r"\b(marketing|seo|content|brand|digital|social media|pr |communications?)\b", re.I),
    "sales":       re.compile(r"\b(sales|account exec|business development|bde|bdm|account manager)\b", re.I),
    "hr":          re.compile(r"\b(recruiter|hr |human resources|talent|people operations|l&d)\b", re.I),
    "logistics":   re.compile(r"\b(driver|warehouse|logistics|supply chain|courier|delivery|freight)\b", re.I),
    "hospitality": re.compile(r"\b(chef|hotel|restaurant|hospitality|barista|waiter|bartender|catering)\b", re.I),
    "construction":re.compile(r"\b(construction|builder|site manager|surveyor|electrician|plumber|carpenter|hvac)\b", re.I),
    "legal":       re.compile(r"\b(solicitor|barrister|lawyer|paralegal|legal|compliance officer)\b", re.I),
    "creative":    re.compile(r"\b(designer|creative|illustrator|photographer|videographer|animator|ux|ui)\b", re.I),
    "data":        re.compile(r"\b(data analyst|data engineer|bi developer|data scientist|reporting analyst)\b", re.I),
}


def _user_domains(skills: list[str], roles: list[str], cv_text: str) -> dict[str, float]:
    """Return domain → weight (0–1) for the user's profile."""
    counts: dict[str, int] = {}

    skills_lower = {s.lower() for s in skills}
    for domain, domain_skills in DOMAIN_SKILLS.items():
        hit = len(skills_lower & domain_skills)
        if hit:
            counts[domain] = counts.get(domain, 0) + hit * 2

    combined = (" ".join(roles) + " " + cv_text[:3000]).lower()
    for domain, pat in DOMAIN_TITLE_RE.items():
        if pat.search(combined):
            counts[domain] = counts.get(domain, 0) + 3

    if not counts:
        return {"general": 1.0}
    total = sum(counts.values()) or 1
    return {d: c / total for d, c in counts.items()}


def _job_domains(job: dict) -> set[str]:
    """Detect which domains a job belongs to."""
    text = " ".join([
        job.get("title", ""),
        job.get("description", "")[:500],
        job.get("industry", ""),
        " ".join(job.get("skills", [])),
    ]).lower()

    domains: set[str] = set()
    for domain, pat in DOMAIN_TITLE_RE.items():
        if pat.search(text):
            domains.add(domain)

    job_skills_lower = {s.lower() for s in job.get("skills", [])}
    for domain, domain_skills in DOMAIN_SKILLS.items():
        if len(job_skills_lower & domain_skills) >= 2:
            domains.add(domain)

    return domains or {"general"}


def _domain_alignment(user_domains: dict[str, float], job_domains: set[str]) -> float:
    """
    How well does the user's domain profile align with this job's domain(s)?
    Returns 0.0 – 1.0.
    """
    if "general" in job_domains and len(job_domains) == 1:
        return 0.6   # No domain info on the job — neutral

    overlap = sum(user_domains.get(d, 0.0) for d in job_domains if d != "general")
    if overlap >= 0.5:
        return min(1.0, 0.6 + overlap * 0.8)
    if overlap > 0.1:
        return 0.45 + overlap
    # Primary user domain not in job domains — cross-sector application
    return 0.15


# ─────────────────────────────────────────────────────────────────────────────
# SKILL OVERLAP
# ─────────────────────────────────────────────────────────────────────────────

def _skill_overlap(
    user_skills: list[str],
    job_skills: list[str],
    strengths: dict[str, float] | None = None,
) -> float:
    """
    Weighted recall of required job skills.
    Returns 0.0 – 1.0.
    """
    if not job_skills:
        return 0.5   # No requirements stated — neutral

    user_norm = set(normalize_skills_list(user_skills))
    job_norm  = set(normalize_skills_list(job_skills))

    if not user_norm:
        return 0.0

    matched = user_norm & job_norm
    if not matched:
        # Partial credit for substring / alias overlap
        partial = 0.0
        for js in job_norm:
            for us in user_norm:
                if js in us or us in js:
                    partial = max(partial, 0.25)
        return partial

    # Weighted recall: emphasise skills the CV highlights (via strengths dict)
    weighted_hits = 0.0
    for skill in matched:
        w = 1.0
        if strengths:
            for k, v in strengths.items():
                if k.lower() == skill.lower():
                    w = max(w, float(v))
                    break
        weighted_hits += w

    recall    = weighted_hits / len(job_norm)       # coverage of what the job wants
    precision = weighted_hits / max(len(user_norm), 1)   # how focused the user is
    f1        = 2 * recall * precision / (recall + precision) if (recall + precision) > 0 else 0.0

    # Weight toward recall — covering job requirements is most important
    return min(0.65 * recall + 0.35 * f1, 1.0)


# ─────────────────────────────────────────────────────────────────────────────
# ROLE ALIGNMENT
# ─────────────────────────────────────────────────────────────────────────────

def _role_alignment(cv_roles: list[str], job: dict) -> float:
    """
    How well do the user's past job titles match this job posting?
    Returns 0.0 – 1.0.
    """
    if not cv_roles:
        return 0.4   # Unknown past roles — soft neutral

    job_title  = (job.get("title") or "").lower()
    job_tokens = set(re.findall(r"[a-z]{3,}", job_title))
    if not job_tokens:
        return 0.4

    best = 0.0
    for role in cv_roles:
        role_lower  = role.lower()
        role_tokens = set(re.findall(r"[a-z]{3,}", role_lower))
        if not role_tokens:
            continue

        overlap = len(job_tokens & role_tokens) / max(len(job_tokens), 1)

        # Exact substring match bonus
        if role_lower in job_title or job_title in role_lower:
            overlap = max(overlap, 0.9)

        best = max(best, overlap)

    return min(best, 1.0)


# ─────────────────────────────────────────────────────────────────────────────
# EXPERIENCE FIT
# ─────────────────────────────────────────────────────────────────────────────

def _experience_fit(user_years: int, required_years: int) -> float:
    """
    Score years-of-experience fit.
    Returns 0.0 – 1.0.
    """
    if required_years <= 0:
        return 0.8   # No stated requirement — most candidates qualify

    diff = user_years - required_years
    if 0 <= diff <= 3:
        return 1.0                                   # Ideal range
    if diff > 3:
        return max(0.7, 1.0 - (diff - 3) * 0.06)   # Slightly overqualified
    if diff >= -2:
        return max(0.55, 0.75 + diff * 0.10)        # Slightly under (employers often flex)
    return max(0.20, 0.55 + diff * 0.08)             # Significantly under


# ─────────────────────────────────────────────────────────────────────────────
# COMPOSITE SCORE → DISPLAY PERCENTAGE
# ─────────────────────────────────────────────────────────────────────────────

# Minimum composite score for a job to be shown as a "workable" match.
# Below this the job is simply not returned.
_MIN_COMPOSITE = 0.22


def _composite_to_display(raw: float, skill_score: float) -> int:
    """
    Map 0–1 composite to a 1–99 integer the UI shows.

    Calibration:
      raw ≥ 0.75  → 85–97%   (strong match)
      raw ≥ 0.55  → 65–84%
      raw ≥ 0.35  → 45–64%
      raw ≥ 0.22  → 25–44%
    """
    if raw >= 0.75:
        pct = 85 + int((raw - 0.75) / 0.25 * 12)
    elif raw >= 0.55:
        pct = 65 + int((raw - 0.55) / 0.20 * 19)
    elif raw >= 0.35:
        pct = 45 + int((raw - 0.35) / 0.20 * 19)
    else:
        pct = 25 + int((raw - _MIN_COMPOSITE) / (0.35 - _MIN_COMPOSITE) * 19)

    return max(1, min(99, pct))


# ─────────────────────────────────────────────────────────────────────────────
# TF-IDF ENGINE
# ─────────────────────────────────────────────────────────────────────────────

class JobMatcher:
    """
    Maintains a TF-IDF matrix over job documents.
    Thread-safe to READ after fit(); not designed for concurrent writes.
    """

    def __init__(self):
        self.vectorizer   = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=8000,
            min_df=1,
            sublinear_tf=True,
        )
        self.job_matrix   = None
        self.jobs_data: list[dict] = []
        self._is_fitted   = False

    # ── fit ───────────────────────────────────────────────────────────────────
    def fit(self, jobs: list[dict]) -> None:
        if not jobs:
            logger.warning("No jobs provided to fit matcher.")
            return
        self.jobs_data = jobs
        docs = [_preprocess(self._job_doc(j)) for j in jobs]
        self.job_matrix  = self.vectorizer.fit_transform(docs)
        self._is_fitted  = True
        logger.info(
            "TF-IDF fitted on %d jobs | vocab=%d",
            len(jobs), len(self.vectorizer.vocabulary_),
        )

    def _job_doc(self, job: dict) -> str:
        """Concatenate all job fields into one TF-IDF document."""
        parts = [
            job.get("title", ""),
            job.get("description", "")[:2000],
            job.get("industry", ""),
            job.get("level", ""),
            " ".join(job.get("requirements", [])),
            " ".join(job.get("responsibilities", [])),
            # Skills repeated 3× to increase their TF-IDF weight
            " ".join(job.get("skills", [])) * 3,
        ]
        return " ".join(p for p in parts if p)

    def _user_doc(
        self,
        skills: list[str],
        cv_text: str,
        roles: list[str],
    ) -> str:
        parts = [
            cv_text[:3000],
            " ".join(roles) * 2,
            " ".join(skills) * 3,
        ]
        return " ".join(p for p in parts if p)

    # ── match ─────────────────────────────────────────────────────────────────
    def match(
        self,
        user_skills: list[str],
        cv_text:     str  = "",
        years_exp:   int  = 0,
        top_n:       int  = 20,
        strengths:   dict | None = None,
        cv_roles:    list[str] | None = None,
    ) -> list[dict]:
        """
        Score all loaded jobs for a user and return top_n matches.

        Returns list of dicts sorted by match_score descending.
        Each dict contains:
          job, match_score, component_scores,
          matched_skills, missing_skills,
          match_factors, match_summary
        """
        if not self._is_fitted:
            logger.error("Matcher not fitted — call fit(jobs) first.")
            return []

        strengths = strengths or {}
        cv_roles  = cv_roles  or []

        # Normalise skills
        user_skills = normalize_skills_list(user_skills)

        # Compute user domain profile once
        user_domains = _user_domains(user_skills, cv_roles, cv_text)
        logger.info(
            "Matching: %d skills | %d roles | top domains: %s",
            len(user_skills),
            len(cv_roles),
            ", ".join(f"{d}={v:.2f}" for d, v in
                      sorted(user_domains.items(), key=lambda x: -x[1])[:3]),
        )

        # TF-IDF cosine similarities
        user_doc    = self._user_doc(user_skills, cv_text, cv_roles)
        user_vec    = self.vectorizer.transform([_preprocess(user_doc)])
        tfidf_sims  = cosine_similarity(user_vec, self.job_matrix).flatten()

        results = []

        for idx, job in enumerate(self.jobs_data):
            tfidf = float(tfidf_sims[idx])

            job_skills = list(job.get("skills") or [])

            # ── Component scores ──────────────────────────────────────────────
            s_skill  = _skill_overlap(user_skills, job_skills, strengths)
            s_role   = _role_alignment(cv_roles, job)
            s_exp    = _experience_fit(years_exp, job.get("yearsExp") or 0)
            s_domain = _domain_alignment(user_domains, _job_domains(job))
            s_tfidf  = tfidf

            # ── Weighted composite (must sum to 1.0) ──────────────────────────
            # skill_overlap  35%
            # tfidf          20%
            # role_alignment 20%
            # experience     15%
            # domain         10%
            composite = (
                0.35 * s_skill   +
                0.20 * s_tfidf   +
                0.20 * s_role    +
                0.15 * s_exp     +
                0.10 * s_domain
            )

            # ── Minimum threshold ─────────────────────────────────────────────
            if composite < _MIN_COMPOSITE:
                continue

            # ── Which skills matched / are missing ────────────────────────────
            user_norm    = set(normalize_skills_list(user_skills))
            job_norm     = set(normalize_skills_list(job_skills))
            matched      = sorted(user_norm & job_norm)
            missing      = sorted(job_norm - user_norm)

            display_score = _composite_to_display(composite, s_skill)

            # ── Human-readable factors ────────────────────────────────────────
            factors = []
            if matched:
                top = ", ".join(matched[:5])
                suffix = f" (+{len(matched)-5} more)" if len(matched) > 5 else ""
                factors.append(f"Matched skills: {top}{suffix}")
            if s_role >= 0.6:
                factors.append(f"Title alignment: {cv_roles[0] if cv_roles else 'your experience'}")
            if years_exp and s_exp >= 0.8:
                factors.append(f"{years_exp} years experience")
            if s_tfidf >= 0.10:
                factors.append("Strong CV–job text similarity")
            if missing and len(missing) <= 4:
                factors.append(f"Skills to develop: {', '.join(missing[:4])}")
            top_domain = max(user_domains, key=user_domains.get)
            if top_domain in _job_domains(job):
                factors.append(f"Industry match: {top_domain}")

            summary_parts = []
            if matched:
                summary_parts.append(f"Matched: {', '.join(matched[:3])}")
            if years_exp:
                summary_parts.append(f"{years_exp} yrs exp")
            if cv_roles:
                summary_parts.append(f"Role: {cv_roles[0]}")
            match_summary = " · ".join(summary_parts) or "Profile similarity"

            results.append({
                "job":            job,
                "match_score":    display_score,
                "raw_score":      round(composite, 4),
                "component_scores": {
                    "skill_match":    int(round(s_skill  * 100)),
                    "tfidf_sim":      round(s_tfidf, 4),
                    "role_fit":       int(round(s_role   * 100)),
                    "experience_fit": int(round(s_exp    * 100)),
                    "domain_align":   int(round(s_domain * 100)),
                },
                "matched_skills":  matched,
                "missing_skills":  missing,
                "match_factors":   factors[:6],
                "match_summary":   match_summary,
            })

        # Sort by display score descending
        results.sort(key=lambda x: x["match_score"], reverse=True)

        logger.info(
            "Matching complete: %d/%d jobs above threshold | top score=%s",
            len(results),
            len(self.jobs_data),
            results[0]["match_score"] if results else "–",
        )

        return results[:top_n]


# ─────────────────────────────────────────────────────────────────────────────
# SINGLETON
# ─────────────────────────────────────────────────────────────────────────────

_matcher_instance: Optional[JobMatcher] = None


def get_matcher() -> JobMatcher:
    global _matcher_instance
    if _matcher_instance is None:
        _matcher_instance = JobMatcher()
    return _matcher_instance