"""
Skill Gap Analyser
Compares a user's skills against a specific job's requirements
and generates a personalised learning path.
"""

from .skill_ontology import normalize_skills_list
from .job_skill_extractor import extract_skills_from_job


# Learning resources for common skills
# In production this would come from a database or 3rd-party API
LEARNING_RESOURCES = {
    "TypeScript": [
        {"title": "TypeScript Handbook", "provider": "Official Docs", "url": "https://www.typescriptlang.org/docs/", "duration": "10h", "free": True},
        {"title": "TypeScript Fundamentals", "provider": "Frontend Masters", "url": "https://frontendmasters.com", "duration": "4h", "free": False},
    ],
    "React": [
        {"title": "React Official Tutorial", "provider": "React Dev", "url": "https://react.dev/learn", "duration": "8h", "free": True},
        {"title": "React - The Complete Guide", "provider": "Udemy", "url": "https://udemy.com", "duration": "40h", "free": False},
    ],
    "Next.js": [
        {"title": "Next.js Documentation", "provider": "Vercel", "url": "https://nextjs.org/docs", "duration": "6h", "free": True},
        {"title": "Next.js 14 Crash Course", "provider": "YouTube", "url": "https://youtube.com", "duration": "3h", "free": True},
    ],
    "Node.js": [
        {"title": "Node.js Official Docs", "provider": "Node.js", "url": "https://nodejs.org/docs", "duration": "8h", "free": True},
        {"title": "The Complete Node.js Developer", "provider": "Udemy", "url": "https://udemy.com", "duration": "35h", "free": False},
    ],
    "AWS": [
        {"title": "AWS Cloud Practitioner", "provider": "AWS Training", "url": "https://aws.amazon.com/training", "duration": "20h", "free": True},
        {"title": "AWS Solutions Architect", "provider": "A Cloud Guru", "url": "https://acloudguru.com", "duration": "50h", "free": False},
    ],
    "Docker": [
        {"title": "Docker Getting Started", "provider": "Docker Docs", "url": "https://docs.docker.com", "duration": "5h", "free": True},
        {"title": "Docker & Kubernetes", "provider": "Udemy", "url": "https://udemy.com", "duration": "22h", "free": False},
    ],
    "Kubernetes": [
        {"title": "Kubernetes Basics", "provider": "Google", "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "duration": "8h", "free": True},
        {"title": "CKA Exam Prep", "provider": "KodeKloud", "url": "https://kodekloud.com", "duration": "30h", "free": False},
    ],
    "PostgreSQL": [
        {"title": "PostgreSQL Tutorial", "provider": "postgresqltutorial.com", "url": "https://www.postgresqltutorial.com", "duration": "10h", "free": True},
    ],
    "Python": [
        {"title": "Python Official Tutorial", "provider": "python.org", "url": "https://docs.python.org/3/tutorial/", "duration": "12h", "free": True},
        {"title": "100 Days of Code: Python", "provider": "Udemy", "url": "https://udemy.com", "duration": "60h", "free": False},
    ],
    "Machine Learning": [
        {"title": "ML Crash Course", "provider": "Google", "url": "https://developers.google.com/machine-learning/crash-course", "duration": "15h", "free": True},
        {"title": "Machine Learning Specialization", "provider": "Coursera (Andrew Ng)", "url": "https://coursera.org", "duration": "90h", "free": False},
    ],
    "System Design": [
        {"title": "System Design Primer", "provider": "GitHub", "url": "https://github.com/donnemartin/system-design-primer", "duration": "20h", "free": True},
        {"title": "Grokking System Design", "provider": "Educative", "url": "https://educative.io", "duration": "25h", "free": False},
    ],
    "GraphQL": [
        {"title": "GraphQL Official Learn", "provider": "GraphQL.org", "url": "https://graphql.org/learn/", "duration": "5h", "free": True},
    ],
    "Go": [
        {"title": "A Tour of Go", "provider": "go.dev", "url": "https://tour.golang.org", "duration": "8h", "free": True},
    ],
    "Testing": [
        {"title": "JavaScript Testing Best Practices", "provider": "GitHub", "url": "https://github.com/goldbergyoni/javascript-testing-best-practices", "duration": "5h", "free": True},
    ],
}

# Default resource for skills not in our database
DEFAULT_RESOURCE = {
    "title":    "Search on Coursera",
    "provider": "Coursera",
    "url":      "https://coursera.org",
    "duration": "Varies",
    "free":     False,
}


def analyse_skill_gap(user_skills: list, job: dict) -> dict:
    """
    Compare the user's skills against a job's required skills.
    Returns a structured gap analysis with readiness score and learning path.

    Args:
        user_skills: User's current skills (canonical names)
        job:         Job document dict

    Returns:
        {
            "overall_readiness": int (0-100),
            "matched_skills": list,
            "missing_skills": list,
            "learning_path": list of course recommendations,
            "skill_breakdown": list with per-skill proficiency estimate,
        }
    """
    user_norm = set(normalize_skills_list(user_skills))
    job_skills = job.get("skills") or extract_skills_from_job(job)
    job_norm = set(normalize_skills_list(job_skills))

    if not job_norm:
        return {
            "overall_readiness": 75,
            "matched_skills": list(user_norm),
            "missing_skills": [],
            "learning_path":  [],
            "skill_breakdown": [],
        }

    matched = user_norm.intersection(job_norm)
    missing = job_norm - user_norm

    # Readiness = % of required skills the user already has
    readiness = int(round(len(matched) / len(job_norm) * 100))

    # Build per-skill breakdown with a proficiency estimate
    # (In a real system this would come from user self-assessment or quiz results)
    skill_breakdown = []

    for skill in sorted(matched):
        skill_breakdown.append({
            "skill":      skill,
            "status":     "have",
            "proficiency": 75,  # Placeholder — would be assessed in Step 11
        })

    for skill in sorted(missing):
        skill_breakdown.append({
            "skill":      skill,
            "status":     "missing",
            "proficiency": 0,
        })

    # Build learning path — prioritise missing skills with available resources
    learning_path = []
    for skill in sorted(missing):
        resources = LEARNING_RESOURCES.get(skill, [DEFAULT_RESOURCE.copy()])
        # Pick the best free resource first, then paid
        free_resources = [r for r in resources if r.get("free")]
        paid_resources = [r for r in resources if not r.get("free")]

        recommended = (free_resources[0] if free_resources else
                       paid_resources[0] if paid_resources else DEFAULT_RESOURCE.copy())

        learning_path.append({
            "skill":    skill,
            "priority": "high" if len(missing) <= 3 else ("medium" if len(missing) <= 6 else "low"),
            "resource": recommended,
        })

    return {
        "overall_readiness": readiness,
        "matched_skills":    sorted(matched),
        "missing_skills":    sorted(missing),
        "learning_path":     learning_path,
        "skill_breakdown":   skill_breakdown,
        "job_title":         job.get("title", ""),
        "job_company":       job.get("company", ""),
    }