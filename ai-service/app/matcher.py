"""
Job Matching Engine

Uses a combination of:
1. TF-IDF + Cosine Similarity — semantic text matching between CV and job description
2. Skill set overlap — direct comparison of extracted skills vs required skills
3. Experience fit — years of experience vs job requirements
4. Weighted composite score per the spec: 40/30/20/10

All scores are 0–100 integers.
"""

import re
import math
import logging
from typing import Union, Optional, List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from .skill_ontology import normalize_skills_list, normalize_skill, skill_semantic_similarity
from .skill_domains import classify_user_domains, classify_job_domain, domain_alignment_score
from .job_skill_extractor import extract_skills_from_job
from .cv_skill_extractor import (
    extract_roles_from_cv,
    build_matching_skills,
    extract_projects_from_cv,
    extract_certifications_from_cv,
    extract_education_from_cv,
)

MIN_WORKABLE_FIT = 0.45  # Below this — unlikely the user can perform the role well
MIN_DOMAIN_ALIGN = 0.28

logger = logging.getLogger(__name__)

# ── Text preprocessing ────────────────────────────────────────────────────────

# English stop words (common words that add no matching value)
STOP_WORDS = {
    "a","an","the","and","or","but","in","on","at","to","for","of","with",
    "by","from","as","is","was","are","were","be","been","being","have",
    "has","had","do","does","did","will","would","could","should","may",
    "might","shall","can","need","dare","ought","used","able","i","you",
    "he","she","it","we","they","what","which","who","this","that","these",
    "those","my","your","his","her","its","our","their","experience","years",
    "work","working","team","looking","strong","good","excellent","ability",
    "knowledge","understanding","familiarity","skills","skill","using","use",
    "proficient","proficiency","expertise","including","include","such","etc",
    "also","well","great","preferred","required","must","plus","bonus","university","degree","bachelor","master","phd","high","school","college",
}


def preprocess_text(text: str) -> str:
    """
    Clean and normalize text for TF-IDF vectorization.
    - Lowercase
    - Remove special characters (keep alphanumeric + spaces)
    - Remove stop words
    - Collapse whitespace
    """
    text = text.lower()
    # Keep letters, numbers, dots (for things like "node.js" → handled by ontology)
    text = re.sub(r"[^a-z0-9\s\.\+\#]", " ", text)
    # Remove standalone numbers (page numbers etc.) but keep "5 years" context
    tokens = text.split()
    tokens = [t for t in tokens if t not in STOP_WORDS and len(t) > 1]
    return " ".join(tokens)


# ── TF-IDF Engine ─────────────────────────────────────────────────────────────

class JobMatcher:
    """
    Maintains a TF-IDF matrix of all job descriptions.
    When a user's CV text comes in, compute cosine similarity against all jobs.
    """

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),    # Unigrams + bigrams ("machine learning" as one token)
            max_features=5000,     # Top 5k features — keeps it fast
            min_df=1,              # Include terms that appear in at least 1 doc
            sublinear_tf=True,     # Apply log normalization to TF — reduces impact of frequent terms
        )
        self.job_matrix    = None   # TF-IDF matrix for all jobs
        self.jobs_data     = []     # Original job dicts
        self._is_fitted    = False  # Whether vectorizer has been trained

    def fit(self, jobs: list):
        """
        Build the TF-IDF matrix from a list of job documents.
        Call this once when loading jobs, then call match() per user.

        Args:
            jobs: list of dicts with keys: title, description, skills, requirements, etc.
        """
        if not jobs:
            logger.warning("No jobs provided to fit matcher.")
            return

        self.jobs_data = jobs

        # Build the document for each job: combine all text fields
        job_documents = []
        for job in jobs:
            doc = self._build_job_document(job)
            job_documents.append(preprocess_text(doc))

        # Fit and transform — creates the TF-IDF matrix
        self.job_matrix  = self.vectorizer.fit_transform(job_documents)
        self._is_fitted  = True
        logger.info(f"TF-IDF fitted on {len(jobs)} jobs. Vocabulary size: {len(self.vectorizer.vocabulary_)}")

    def _build_job_document(self, job: dict) -> str:
        """
        Concatenate all relevant job fields into one document for TF-IDF.
        We repeat skills 3x to give them extra weight in the vocabulary.
        """
        parts = [
            job.get("title", ""),
            job.get("description", ""),
            job.get("level", ""),
            " ".join(job.get("requirements", [])),
            " ".join(job.get("responsibilities", [])),
            # Repeat skills 3x — skills are the most important matching signal
            " ".join(job.get("skills", [])) * 3,
        ]
        return " ".join(p for p in parts if p)

    def _extract_education_text(self, cv_text: str) -> str:
        """Pull education-related lines for semantic matching."""
        if not cv_text:
            return ""
        edu_headers = re.compile(
            r"(?:^|\n)\s*(education|academic|qualifications?|degrees?)\s*[:\-]?\s*\n",
            re.I | re.M,
        )
        chunks = []
        for m in edu_headers.finditer(cv_text):
            chunk = cv_text[m.end() : m.end() + 1200]
            chunks.append(chunk.split("\n\n")[0])
        if not chunks:
            for line in cv_text.split("\n"):
                if re.search(
                    r"\b(bachelor|master|phd|b\.?sc|m\.?sc|degree|university|college)\b",
                    line,
                    re.I,
                ):
                    chunks.append(line)
        return " ".join(chunks)[:2000]

    def _build_user_document(
        self,
        user_skills: list,
        cv_text: str = "",
        cv_roles: Optional[list] = None,
        projects: Optional[list] = None,
        certifications: Optional[list] = None,
        education: Optional[list] = None,
    ) -> str:
        """Build the user's document for matching against jobs."""
        education_text = self._extract_education_text(cv_text)
        if education:
            education_text = f"{education_text} {' '.join(education)}"
        roles_blob = " ".join(cv_roles or []) * 2
        projects_blob = " ".join(projects or []) * 2
        certs_blob = " ".join(certifications or [])
        parts = [
            cv_text,
            education_text,
            roles_blob,
            projects_blob,
            certs_blob,
            " ".join(user_skills) * 3,
        ]
        return " ".join(p for p in parts if p)

    def _compute_skill_overlap(
        self,
        user_skills: list,
        job_skills: list,
        strengths: Optional[dict] = None,
    ) -> float:
        """
        Weighted overlap — skills the user emphasizes on their CV count more.
        """
        if not job_skills:
            return 0.0

        user_norm = set(normalize_skills_list(user_skills))
        job_norm = set(normalize_skills_list(job_skills))

        if not user_norm:
            return 0.0

        matched = user_norm.intersection(job_norm)
        if not matched:
            # Partial: substring + semantic family overlap
            partial = 0.0
            for js in job_norm:
                for us in user_norm:
                    if js.lower() in us.lower() or us.lower() in js.lower():
                        partial = max(partial, 0.35)
                    else:
                        sim = skill_semantic_similarity(us, js)
                        if sim >= 0.55:
                            partial = max(partial, sim * 0.65)
            return partial

        weighted_hits = 0.0
        for skill in matched:
            w = 1.0
            if strengths:
                for k, v in strengths.items():
                    if k.lower() == skill.lower() or skill.lower() in k.lower():
                        w = max(w, float(v))
                        break
            weighted_hits += w

        recall = weighted_hits / len(job_norm)
        precision = weighted_hits / len(user_norm)
        if recall + precision == 0:
            return 0.0
        f1 = 2 * (precision * recall) / (precision + recall)
        return min(0.7 * recall + 0.3 * f1, 1.0)

    def _compute_role_fit(self, cv_roles: list, job: dict) -> float:
        """How well past job titles align with this posting."""
        if not cv_roles:
            return 0.5

        title = (job.get("title") or "").lower()
        title_tokens = set(re.findall(r"[a-z]{3,}", title))
        if not title_tokens:
            return 0.5

        best = 0.0
        for role in cv_roles:
            role_lower = role.lower()
            role_tokens = set(re.findall(r"[a-z]{3,}", role_lower))
            if not role_tokens:
                continue
            overlap = len(title_tokens & role_tokens) / max(len(title_tokens), 1)
            if role_lower in title or title in role_lower:
                overlap = max(overlap, 0.85)
            best = max(best, overlap)

        return min(best, 1.0)

    def _compute_project_fit(self, projects: list, job: dict, job_skills: list) -> float:
        """Relevance of CV projects to this job."""
        if not projects:
            return 0.0

        job_blob = " ".join(
            [
                job.get("title", ""),
                job.get("description", ""),
                " ".join(job_skills),
            ]
        ).lower()
        hits = 0
        for project in projects:
            tokens = [t for t in re.findall(r"[a-z]{4,}", project.lower()) if t not in STOP_WORDS]
            if any(t in job_blob for t in tokens):
                hits += 1
        return min(1.0, hits / max(len(projects), 1))

    def _compute_education_fit(self, education: list, job: dict) -> float:
        """Education / certification alignment with job requirements."""
        if not education:
            return 0.0

        job_text = " ".join(
            [
                job.get("title", ""),
                job.get("description", ""),
                " ".join(job.get("requirements") or []),
                job.get("industry", ""),
            ]
        ).lower()

        hits = 0
        for entry in education:
            tokens = [t for t in re.findall(r"[a-z]{4,}", entry.lower()) if len(t) > 3]
            if any(t in job_text for t in tokens):
                hits += 1
        return min(1.0, 0.4 + (hits / max(len(education), 1)) * 0.6)

    def _compute_experience_fit(self, user_years: int, job_years_required: int) -> float:
        """
        Score how well the user's experience matches the job's requirement.
        - Exact match or slight over = 1.0
        - Under by 1–2 years = partial credit (employers often hire slightly junior)
        - Over by 3+ years = slight reduction (over-qualified risk)
        Returns 0.0–1.0
        """
        if job_years_required == 0:
            return 0.8  # No requirement stated = most people qualify

        diff = user_years - job_years_required

        if diff >= 0 and diff <= 3:
            return 1.0     # Perfect range
        elif diff > 3:
            # Overqualified — penalize slightly
            return max(0.7, 1.0 - (diff - 3) * 0.05)
        elif diff >= -2:
            # Slightly under — partial credit (employers often stretch)
            return 0.75 + diff * 0.1   # diff is negative here
        else:
            # Significantly under — low but not zero
            return max(0.2, 0.75 + diff * 0.08)

    def _compute_growth_alignment(self, job: dict) -> float:
        """
        Score how well the job aligns with career growth signals.
        Based on demand trend and featured status.
        Returns 0.0–1.0
        """
        trend_scores = {"Increasing": 1.0, "Stable": 0.75, "Decreasing": 0.5}
        trend_score  = trend_scores.get(job.get("demandTrend", "Stable"), 0.75)
        featured_bonus = 0.05 if job.get("featured", False) else 0.0
        return min(trend_score + featured_bonus, 1.0)

    def _compute_cultural_fit(
        self, user_skills: list, job: dict, user_domains: Optional[dict] = None
    ) -> float:
        """
        Industry/domain alignment + remote preference heuristic.
        Returns 0.0–1.0
        """
        remote_bonus = 0.08 if job.get("remote", False) else 0.0

        job_industry = (job.get("industry") or "").lower()
        industry_bonus = 0.0
        if job_industry and user_domains:
            for domain, weight in user_domains.items():
                if domain == "general":
                    continue
                if domain.lower() in job_industry or job_industry in domain.lower():
                    industry_bonus = max(industry_bonus, 0.12 + weight * 0.15)

        if not industry_bonus and job_industry:
            skill_blob = " ".join(user_skills).lower()
            tokens = [t for t in re.findall(r"[a-z]{4,}", job_industry) if t in skill_blob]
            industry_bonus = min(0.12, len(tokens) * 0.04)

        return min(0.55 + remote_bonus + industry_bonus, 1.0)

    def _apply_dynamic_scores(self, results: list) -> list:
        """
        Map raw composite fit (0–1) to display percentages so scores reflect
        actual match quality, not just rank position in the list.
        """
        if not results:
            return results

        for r in results:
            raw = float(r.get("raw_score", 0))
            if r.get("workable"):
                span = max(0.01, 1.0 - MIN_WORKABLE_FIT)
                normalized = (raw - MIN_WORKABLE_FIT) / span
                r["match_score"] = min(97, max(52, int(52 + normalized * 45)))
            else:
                r["match_score"] = min(44, max(8, int(raw * 50)))

        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results

    def _build_match_factors(
        self,
        matched_skills: list,
        missing_skills: list,
        component_scores: dict,
        domain_score: float,
        roles: list,
        inferred_skills: list,
        years_exp: int = 0,
        projects: Optional[list] = None,
    ) -> list:
        """Human-readable reasons this job was matched."""
        factors = []
        if matched_skills:
            top = ", ".join(matched_skills[:5])
            suffix = f" (+{len(matched_skills) - 5} more)" if len(matched_skills) > 5 else ""
            factors.append(f"Matched skills: {top}{suffix}")
        if inferred_skills and matched_skills:
            inf_hits = [
                s for s in inferred_skills
                if s.lower() in {m.lower() for m in matched_skills}
            ]
            if inf_hits:
                factors.append(f"Inferred from experience: {', '.join(inf_hits[:4])}")
        if years_exp and component_scores.get("experience_fit", 0) >= 60:
            factors.append(f"{years_exp} years experience")
        if roles and component_scores.get("role_fit", 0) >= 35:
            factors.append(f"Role fit: {', '.join(roles[:2])}")
        if projects and component_scores.get("project_fit", 0) >= 30:
            factors.append(f"Project relevance: {projects[0][:50]}")
        if component_scores.get("tfidf_sim", 0) >= 0.08:
            factors.append("CV content similarity")
        if domain_score >= 0.5:
            factors.append("Industry/domain alignment")
        if missing_skills and len(missing_skills) <= 4:
            factors.append(f"Skill gaps: {', '.join(missing_skills[:4])}")
        return factors[:6]

    def _build_match_summary(
        self,
        matched_skills: list,
        years_exp: int,
        roles: list,
    ) -> str:
        """Single-line summary e.g. Matched: React, Node.js · 3 years experience."""
        parts = []
        if matched_skills:
            parts.append("Matched: " + ", ".join(matched_skills[:4]))
            if len(matched_skills) > 4:
                parts[-1] += f" (+{len(matched_skills) - 4})"
        if years_exp:
            parts.append(f"{years_exp} years experience")
        if roles:
            parts.append(f"Role: {roles[0]}")
        return " · ".join(parts) if parts else "Profile similarity match"

    def match(
        self,
        user_skills: list,
        cv_text:     str  = "",
        years_exp:   int  = 0,
        top_n:       int  = 20,
        strengths:   dict | None = None,
        cv_roles:    Optional[list] = None,
    ) -> list:
        """
        Main matching function. Returns a list of jobs sorted by match score.

        Args:
            user_skills: List of canonical skill names from the user's profile/CV
            cv_text:     Raw text from the CV (for TF-IDF)
            years_exp:   Years of experience from the CV
            top_n:       Return only the top N matches

        Returns:
            List of dicts: [{job, match_score, component_scores, matched_skills, missing_skills}]
        """
        if not self._is_fitted:
            logger.error("Matcher not fitted. Call fit(jobs) first.")
            return []

        if not user_skills and not cv_text:
            logger.warning("No user skills or CV text provided — returning neutral scores.")

        strengths = strengths or {}
        roles = cv_roles if cv_roles is not None else (
            extract_roles_from_cv(cv_text) if cv_text else []
        )

        user_skills, inferred_skills = build_matching_skills(
            user_skills, cv_text, roles
        )
        logger.info(
            "Matching profile: %d skills (%d inferred), %d roles",
            len(user_skills),
            len(inferred_skills),
            len(roles),
        )
        if inferred_skills:
            logger.debug("Inferred skills: %s", ", ".join(inferred_skills))

        user_domains = classify_user_domains(user_skills, roles, cv_text)

        projects = extract_projects_from_cv(cv_text) if cv_text else []
        certifications = extract_certifications_from_cv(cv_text) if cv_text else []
        education = extract_education_from_cv(cv_text) if cv_text else []

        user_doc = self._build_user_document(
            user_skills, cv_text, roles, projects, certifications, education
        )
        user_vector = self.vectorizer.transform([preprocess_text(user_doc)])
        tfidf_scores = cosine_similarity(user_vector, self.job_matrix).flatten()

        results = []

        for idx, job in enumerate(self.jobs_data):
            tfidf_sim = float(tfidf_scores[idx])
            job_skills = extract_skills_from_job(job)

            skill_score = self._compute_skill_overlap(
                user_skills, job_skills, strengths
            )
            exp_score = self._compute_experience_fit(
                years_exp, job.get("yearsExp", 0)
            )
            role_score = self._compute_role_fit(roles, job)
            project_score = self._compute_project_fit(projects, job, job_skills)
            education_score = self._compute_education_fit(education, job)
            growth_score = self._compute_growth_alignment(job)
            culture_score = self._compute_cultural_fit(user_skills, job, user_domains)

            job_domains = classify_job_domain({**job, "skills": job_skills})
            domain_score = domain_alignment_score(user_domains, job_domains)

            # Priority-weighted blend: skills > experience text > roles > projects > education > domain
            blended_skill = (
                0.40 * skill_score
                + 0.28 * tfidf_sim
                + 0.17 * role_score
                + 0.08 * project_score
                + 0.07 * education_score
            )
            blended_skill = min(1.0, blended_skill * (0.20 + 0.80 * domain_score))

            skill_weight = 0.48 + 0.22 * blended_skill
            exp_weight = 0.24 + 0.08 * exp_score
            role_weight = 0.16
            project_weight = 0.07
            domain_weight = 0.05
            total_w = skill_weight + exp_weight + role_weight + project_weight + domain_weight
            composite = (
                skill_weight * blended_skill
                + exp_weight * exp_score
                + role_weight * role_score
                + project_weight * project_score
                + domain_weight * domain_score
            ) / total_w

            workable = (
                composite >= MIN_WORKABLE_FIT
                and domain_score >= MIN_DOMAIN_ALIGN
                and (
                    skill_score >= 0.15
                    or tfidf_sim >= 0.08
                    or role_score >= 0.40
                )
            )

            user_norm = set(normalize_skills_list(user_skills))
            job_norm = set(normalize_skills_list(job_skills))
            matched_skills = sorted(user_norm.intersection(job_norm))
            missing_skills = sorted(job_norm - user_norm)

            component_scores = {
                "skill_match": int(round(blended_skill * 100)),
                "experience_fit": int(round(exp_score * 100)),
                "role_fit": int(round(role_score * 100)),
                "project_fit": int(round(project_score * 100)),
                "education_fit": int(round(education_score * 100)),
                "domain_align": int(round(domain_score * 100)),
                "tfidf_sim": round(tfidf_sim, 4),
            }
            match_factors = self._build_match_factors(
                matched_skills,
                missing_skills,
                component_scores,
                domain_score,
                roles,
                inferred_skills,
                years_exp,
                projects,
            )
            match_summary = self._build_match_summary(matched_skills, years_exp, roles)

            results.append({
                "job": job,
                "raw_score": composite,
                "workable": workable,
                "match_score": 0,
                "component_scores": component_scores,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "match_factors": match_factors,
                "match_summary": match_summary,
            })

        results = self._apply_dynamic_scores(results)
        workable_only = [r for r in results if r.get("workable")]
        if workable_only:
            pool = workable_only
        else:
            # No strong matches — return empty rather than unrelated defaults
            logger.warning(
                "No workable matches for profile (skills=%d, roles=%d)",
                len(user_skills),
                len(roles),
            )
            pool = []
        pool.sort(key=lambda x: x["match_score"], reverse=True)
        return pool[:top_n]


# ── Singleton instance — initialized once at startup ─────────────────────────
_matcher_instance: Optional[JobMatcher] = None


def get_matcher() -> JobMatcher:
    """Return the singleton matcher instance."""
    global _matcher_instance
    if _matcher_instance is None:
        _matcher_instance = JobMatcher()
    return _matcher_instance