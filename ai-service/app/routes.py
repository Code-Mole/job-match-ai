"""
Flask route definitions — all API endpoints for the AI service.
"""

import os
import logging
import tempfile
from flask import Blueprint, request, jsonify

from .matcher    import get_matcher
from .cv_parser  import parse_cv, extract_skills_from_text
from .skill_gap  import analyse_skill_gap
from .skill_ontology import normalize_skills_list

logger  = logging.getLogger(__name__)
bp      = Blueprint("api", __name__)
matcher = get_matcher()  # Singleton

# Sample jobs — loaded at startup (Step 5 will fetch from MongoDB instead)
SAMPLE_JOBS = [
    {
        "_id": "1", "title": "Senior Frontend Developer", "company": "Stripe",
        "location": "Remote", "type": "Full-time", "remote": True,
        "salaryMin": 120000, "salaryMax": 150000, "salary": "$120k–$150k",
        "level": "Senior", "yearsExp": 5, "industry": "Fintech", "featured": True,
        "demandTrend": "Increasing",
        "description": "Build and maintain Stripe's web applications used by millions of businesses. Work with React, TypeScript, and GraphQL at scale.",
        "requirements": ["5+ years React", "TypeScript", "GraphQL", "Testing"],
        "skills": ["React", "TypeScript", "JavaScript", "CSS", "GraphQL", "Jest", "REST APIs"],
    },
    {
        "_id": "2", "title": "Full Stack Engineer", "company": "Vercel",
        "location": "San Francisco, CA", "type": "Full-time", "remote": False,
        "salaryMin": 130000, "salaryMax": 160000, "salary": "$130k–$160k",
        "level": "Mid", "yearsExp": 3, "industry": "Developer Tools", "featured": False,
        "demandTrend": "Increasing",
        "description": "Join Vercel to build the future of web development. Work on deployment platform, edge network, and developer tooling.",
        "requirements": ["React", "Next.js", "Node.js", "PostgreSQL"],
        "skills": ["React", "Next.js", "Node.js", "PostgreSQL", "TypeScript", "AWS", "Docker"],
    },
    {
        "_id": "3", "title": "React Developer", "company": "Linear",
        "location": "Remote", "type": "Full-time", "remote": True,
        "salaryMin": 110000, "salaryMax": 140000, "salary": "$110k–$140k",
        "level": "Mid", "yearsExp": 3, "industry": "Productivity Software", "featured": False,
        "demandTrend": "Stable",
        "description": "Build performant React components for Linear's project management platform used by thousands of teams.",
        "requirements": ["React", "GraphQL", "TypeScript", "Testing"],
        "skills": ["React", "GraphQL", "TypeScript", "CSS", "Jest"],
    },
    {
        "_id": "4", "title": "UI Engineer", "company": "Figma",
        "location": "New York, NY", "type": "Full-time", "remote": False,
        "salaryMin": 125000, "salaryMax": 155000, "salary": "$125k–$155k",
        "level": "Mid", "yearsExp": 4, "industry": "Design Software", "featured": False,
        "demandTrend": "Stable",
        "description": "Work on Figma's complex canvas, properties panel and plugin ecosystem. Deep JavaScript and WebGL experience required.",
        "requirements": ["JavaScript", "TypeScript", "React", "WebGL"],
        "skills": ["JavaScript", "TypeScript", "React", "WebGL", "CSS"],
    },
    {
        "_id": "5", "title": "Backend Engineer", "company": "PlanetScale",
        "location": "Remote", "type": "Full-time", "remote": True,
        "salaryMin": 140000, "salaryMax": 180000, "salary": "$140k–$180k",
        "level": "Senior", "yearsExp": 6, "industry": "Database", "featured": False,
        "demandTrend": "Increasing",
        "description": "Build the infrastructure and APIs that power PlanetScale's database-as-a-service product at scale.",
        "requirements": ["Go", "MySQL", "Kubernetes", "Distributed Systems"],
        "skills": ["Go", "MySQL", "Kubernetes", "Docker", "REST APIs", "Linux"],
    },
    {
        "_id": "6", "title": "Machine Learning Engineer", "company": "Hugging Face",
        "location": "Remote", "type": "Full-time", "remote": True,
        "salaryMin": 150000, "salaryMax": 200000, "salary": "$150k–$200k",
        "level": "Senior", "yearsExp": 4, "industry": "AI/ML", "featured": True,
        "demandTrend": "Increasing",
        "description": "Work on open-source ML tools, models and infrastructure used by millions of researchers and developers worldwide.",
        "requirements": ["Python", "PyTorch", "NLP", "Deep Learning"],
        "skills": ["Python", "PyTorch", "NLP", "Machine Learning", "Deep Learning", "Docker"],
    },
]

# Fit the matcher with the sample jobs at startup
matcher.fit(SAMPLE_JOBS)
logger.info("Matcher fitted with sample jobs at startup.")


# ── GET /health ───────────────────────────────────────────────────────────────
@bp.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":       "ok",
        "service":      "JobMatch AI Service",
        "jobs_loaded":  len(SAMPLE_JOBS),
        "matcher_ready": matcher._is_fitted,
    })


# ── POST /match ───────────────────────────────────────────────────────────────
@bp.route("/match", methods=["POST"])
def match_jobs():
    """
    Score a user's skills and CV text against all loaded jobs.

    Request body:
        {
            "skills":     ["React", "TypeScript", ...],
            "cv_text":    "Raw CV text...",
            "years_exp":  3,
            "top_n":      10
        }

    Response:
        {
            "matches": [
                {
                    "job": {...},
                    "match_score": 87,
                    "component_scores": {...},
                    "matched_skills": [...],
                    "missing_skills": [...]
                },
                ...
            ]
        }
    """
    data = request.get_json(silent=True) or {}

    user_skills = data.get("skills", [])
    cv_text     = data.get("cv_text", "")
    years_exp   = int(data.get("years_exp", 0))
    top_n       = int(data.get("top_n", 20))

    # Normalize incoming skills
    user_skills = normalize_skills_list(user_skills)

    if not user_skills and not cv_text:
        return jsonify({"error": "Provide at least one of: skills, cv_text"}), 400

    try:
        matches = matcher.match(
            user_skills=user_skills,
            cv_text=cv_text,
            years_exp=years_exp,
            top_n=top_n,
        )

        # Clean up response — remove raw job object, add id field
        response_matches = []
        for m in matches:
            job = m["job"]
            response_matches.append({
                "job_id":          job.get("_id"),
                "title":           job.get("title"),
                "company":         job.get("company"),
                "location":        job.get("location"),
                "salary":          job.get("salary"),
                "type":            job.get("type"),
                "remote":          job.get("remote"),
                "level":           job.get("level"),
                "industry":        job.get("industry"),
                "match_score":     m["match_score"],
                "component_scores": m["component_scores"],
                "matched_skills":  m["matched_skills"],
                "missing_skills":  m["missing_skills"],
            })

        return jsonify({"success": True, "matches": response_matches, "total": len(response_matches)})

    except Exception as e:
        logger.error(f"/match error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── POST /parse-cv ────────────────────────────────────────────────────────────
@bp.route("/parse-cv", methods=["POST"])
def parse_cv_endpoint():
    """
    Accept a CV file upload, extract text and skills.

    Request: multipart/form-data with field 'file'

    Response:
        {
            "skills":          ["React", "TypeScript", ...],
            "years_experience": 4,
            "word_count":       650,
            "raw_text_preview": "First 300 chars..."
        }
    """
    if "file" not in request.files:
        return jsonify({"error": "No file provided. Use field name 'file'."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    # Save to a temp file — parse it — delete it
    suffix = os.path.splitext(file.filename)[1].lower()
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        result = parse_cv(tmp_path)

    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    if not result["success"]:
        return jsonify({"error": result.get("error", "Parsing failed")}), 500

    return jsonify({
        "success":          True,
        "skills":           result["skills"],
        "years_experience": result["years_experience"],
        "word_count":       result["word_count"],
        "raw_text_preview": result["raw_text"][:300] + "..." if len(result["raw_text"]) > 300 else result["raw_text"],
    })


# ── POST /parse-text ──────────────────────────────────────────────────────────
@bp.route("/parse-text", methods=["POST"])
def parse_text_endpoint():
    """
    Extract skills from plain text (no file upload required).
    Useful for LinkedIn import or manual text paste.

    Request body: { "text": "raw text..." }
    """
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "Provide 'text' field in request body."}), 400

    skills = extract_skills_from_text(text)
    return jsonify({"success": True, "skills": skills, "count": len(skills)})


# ── POST /skill-gap ───────────────────────────────────────────────────────────
@bp.route("/skill-gap", methods=["POST"])
def skill_gap_endpoint():
    """
    Analyse skill gap between user and a specific job.

    Request body:
        {
            "user_skills": ["React", "JavaScript"],
            "job_id":      "1"           (optional — uses job from loaded list)
            "job":         {...}          (optional — provide full job object)
        }
    """
    data = request.get_json(silent=True) or {}

    user_skills = normalize_skills_list(data.get("user_skills", []))
    job_id      = data.get("job_id")
    job_data    = data.get("job")

    # Resolve the job — either from provided object or our sample list
    if job_data:
        job = job_data
    elif job_id:
        job = next((j for j in SAMPLE_JOBS if str(j.get("_id")) == str(job_id)), None)
        if not job:
            return jsonify({"error": f"Job {job_id} not found."}), 404
    else:
        return jsonify({"error": "Provide 'job_id' or 'job' object."}), 400

    try:
        analysis = analyse_skill_gap(user_skills, job)
        return jsonify({"success": True, **analysis})
    except Exception as e:
        logger.error(f"/skill-gap error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── POST /load-jobs ───────────────────────────────────────────────────────────
@bp.route("/load-jobs", methods=["POST"])
def load_jobs():
    """
    Replace the in-memory job list with a new set and refit the TF-IDF model.
    Called by the Express backend after jobs are updated in MongoDB (Step 5).

    Request body: { "jobs": [...] }
    """
    global SAMPLE_JOBS
    data = request.get_json(silent=True) or {}
    jobs = data.get("jobs", [])

    if not jobs:
        return jsonify({"error": "Provide 'jobs' array."}), 400

    SAMPLE_JOBS = jobs
    matcher.fit(jobs)

    return jsonify({
        "success":      True,
        "message":      f"Matcher reloaded with {len(jobs)} jobs.",
        "jobs_loaded":  len(jobs),
    })