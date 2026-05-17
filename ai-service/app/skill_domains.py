"""
Map skills and job text to career domains for smarter matching.
Tech-skilled users get boosted tech jobs; healthcare skills boost healthcare roles, etc.
"""

SKILL_DOMAINS = {
    "technology": {
        "react", "vue", "angular", "typescript", "javascript", "python", "node.js",
        "java", "go", "rust", "docker", "kubernetes", "aws", "gcp", "azure",
        "postgresql", "mongodb", "redis", "graphql", "machine learning", "pytorch",
        "tensorflow", "nlp", "figma", "css", "html", "tailwind", "devops", "ci/cd",
        "software", "frontend", "backend", "full stack", "api", "linux",
    },
    "healthcare": {
        "nursing", "patient care", "medical", "pharmacy", "healthcare", "clinical",
        "hospital", "care assistant", "midwife", "dentist", "physiotherapy",
    },
    "business": {
        "excel", "accounting", "bookkeeping", "sales", "marketing", "project management",
        "administration", "human resources", "recruitment", "finance", "audit",
    },
    "education": {
        "teaching", "lesson planning", "training", "tutoring", "education", "curriculum",
    },
    "logistics": {
        "driving", "warehouse", "delivery", "inventory", "logistics", "forklift", "courier",
    },
    "hospitality": {
        "hospitality", "hotel", "restaurant", "chef", "barista", "customer service",
    },
    "trades": {
        "electrician", "plumber", "construction", "carpenter", "hvac", "mechanic",
    },
}

DOMAIN_KEYWORDS = {
    "technology": [
        "software", "developer", "engineer", "devops", "data scientist", "it ",
        "programmer", "tech", "saas", "cloud", "cyber",
    ],
    "healthcare": ["nurse", "clinical", "hospital", "medical", "healthcare", "care home"],
    "business": ["accountant", "finance", "marketing", "sales", "hr ", "administrator"],
    "education": ["teacher", "tutor", "school", "education", "lecturer"],
    "logistics": ["driver", "warehouse", "delivery", "logistics", "courier"],
    "hospitality": ["hotel", "restaurant", "hospitality", "chef", "bar"],
    "trades": ["electrician", "plumber", "construction", "builder"],
}


def _norm(s: str) -> str:
    return (s or "").lower().strip()


def classify_skill_domain(skill: str) -> set:
    s = _norm(skill)
    domains = set()
    for domain, skills in SKILL_DOMAINS.items():
        if s in skills or any(alias in s for alias in skills):
            domains.add(domain)
    if not domains:
        for domain, keywords in DOMAIN_KEYWORDS.items():
            if any(kw in s for kw in keywords):
                domains.add(domain)
    return domains or {"general"}


def classify_user_domains(user_skills: list) -> dict:
    """Return domain -> weight (0-1) based on user skill profile."""
    counts = {}
    for skill in user_skills or []:
        for d in classify_skill_domain(skill):
            counts[d] = counts.get(d, 0) + 1
    if not counts:
        return {"general": 1.0}
    total = sum(counts.values())
    return {d: c / total for d, c in counts.items()}


def classify_job_domain(job: dict) -> set:
    domains = set()
    text = " ".join(
        [
            job.get("title", ""),
            job.get("description", ""),
            job.get("industry", ""),
            " ".join(job.get("skills", [])),
        ]
    ).lower()

    for domain, keywords in DOMAIN_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            domains.add(domain)

    for skill in job.get("skills", []):
        domains.update(classify_skill_domain(skill))

    return domains or {"general"}


def domain_alignment_score(user_domains: dict, job_domains: set) -> float:
    if "general" in user_domains or not job_domains or job_domains == {"general"}:
        return 0.85
    overlap = sum(user_domains.get(d, 0) for d in job_domains)
    if overlap >= 0.25:
        return min(1.0, 0.55 + overlap * 1.8)
    if overlap > 0:
        return 0.45 + overlap
    # Strong mismatch: user is tech-heavy but job is unrelated
    primary = max(user_domains, key=user_domains.get)
    if primary in ("technology", "healthcare", "business") and primary not in job_domains:
        return 0.15
    return 0.35
