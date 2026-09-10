# """
# Skill Gap Analyser
# Compares a user's skills against a specific job's requirements
# and generates a personalised learning path.
# """

# from .skill_ontology import normalize_skills_list
# from .job_skill_extractor import extract_skills_from_job


# # Learning resources for common skills
# # In production this would come from a database or 3rd-party API
# LEARNING_RESOURCES = {
#     "TypeScript": [
#         {"title": "TypeScript Handbook", "provider": "Official Docs", "url": "https://www.typescriptlang.org/docs/", "duration": "10h", "free": True},
#         {"title": "TypeScript Fundamentals", "provider": "Frontend Masters", "url": "https://frontendmasters.com", "duration": "4h", "free": False},
#     ],
#     "React": [
#         {"title": "React Official Tutorial", "provider": "React Dev", "url": "https://react.dev/learn", "duration": "8h", "free": True},
#         {"title": "React - The Complete Guide", "provider": "Udemy", "url": "https://udemy.com", "duration": "40h", "free": False},
#     ],
#     "Next.js": [
#         {"title": "Next.js Documentation", "provider": "Vercel", "url": "https://nextjs.org/docs", "duration": "6h", "free": True},
#         {"title": "Next.js 14 Crash Course", "provider": "YouTube", "url": "https://youtube.com", "duration": "3h", "free": True},
#     ],
#     "Node.js": [
#         {"title": "Node.js Official Docs", "provider": "Node.js", "url": "https://nodejs.org/docs", "duration": "8h", "free": True},
#         {"title": "The Complete Node.js Developer", "provider": "Udemy", "url": "https://udemy.com", "duration": "35h", "free": False},
#     ],
#     "AWS": [
#         {"title": "AWS Cloud Practitioner", "provider": "AWS Training", "url": "https://aws.amazon.com/training", "duration": "20h", "free": True},
#         {"title": "AWS Solutions Architect", "provider": "A Cloud Guru", "url": "https://acloudguru.com", "duration": "50h", "free": False},
#     ],
#     "Docker": [
#         {"title": "Docker Getting Started", "provider": "Docker Docs", "url": "https://docs.docker.com", "duration": "5h", "free": True},
#         {"title": "Docker & Kubernetes", "provider": "Udemy", "url": "https://udemy.com", "duration": "22h", "free": False},
#     ],
#     "Kubernetes": [
#         {"title": "Kubernetes Basics", "provider": "Google", "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "duration": "8h", "free": True},
#         {"title": "CKA Exam Prep", "provider": "KodeKloud", "url": "https://kodekloud.com", "duration": "30h", "free": False},
#     ],
#     "PostgreSQL": [
#         {"title": "PostgreSQL Tutorial", "provider": "postgresqltutorial.com", "url": "https://www.postgresqltutorial.com", "duration": "10h", "free": True},
#     ],
#     "Python": [
#         {"title": "Python Official Tutorial", "provider": "python.org", "url": "https://docs.python.org/3/tutorial/", "duration": "12h", "free": True},
#         {"title": "100 Days of Code: Python", "provider": "Udemy", "url": "https://udemy.com", "duration": "60h", "free": False},
#     ],
#     "Machine Learning": [
#         {"title": "ML Crash Course", "provider": "Google", "url": "https://developers.google.com/machine-learning/crash-course", "duration": "15h", "free": True},
#         {"title": "Machine Learning Specialization", "provider": "Coursera (Andrew Ng)", "url": "https://coursera.org", "duration": "90h", "free": False},
#     ],
#     "System Design": [
#         {"title": "System Design Primer", "provider": "GitHub", "url": "https://github.com/donnemartin/system-design-primer", "duration": "20h", "free": True},
#         {"title": "Grokking System Design", "provider": "Educative", "url": "https://educative.io", "duration": "25h", "free": False},
#     ],
#     "GraphQL": [
#         {"title": "GraphQL Official Learn", "provider": "GraphQL.org", "url": "https://graphql.org/learn/", "duration": "5h", "free": True},
#     ],
#     "Go": [
#         {"title": "A Tour of Go", "provider": "go.dev", "url": "https://tour.golang.org", "duration": "8h", "free": True},
#     ],
#     "Testing": [
#         {"title": "JavaScript Testing Best Practices", "provider": "GitHub", "url": "https://github.com/goldbergyoni/javascript-testing-best-practices", "duration": "5h", "free": True},
#     ],
# }

# # Default resource for skills not in our database
# DEFAULT_RESOURCE = {
#     "title":    "Search on Coursera",
#     "provider": "Coursera",
#     "url":      "https://coursera.org",
#     "duration": "Varies",
#     "free":     False,
# }


# def analyse_skill_gap(user_skills: list, job: dict) -> dict:
#     """
#     Compare the user's skills against a job's required skills.
#     Returns a structured gap analysis with readiness score and learning path.

#     Args:
#         user_skills: User's current skills (canonical names)
#         job:         Job document dict

#     Returns:
#         {
#             "overall_readiness": int (0-100),
#             "matched_skills": list,
#             "missing_skills": list,
#             "learning_path": list of course recommendations,
#             "skill_breakdown": list with per-skill proficiency estimate,
#         }
#     """
#     user_norm = set(normalize_skills_list(user_skills))
#     job_skills = job.get("skills") or extract_skills_from_job(job)
#     job_norm = set(normalize_skills_list(job_skills))

#     if not job_norm:
#         return {
#             "overall_readiness": 75,
#             "matched_skills": list(user_norm),
#             "missing_skills": [],
#             "learning_path":  [],
#             "skill_breakdown": [],
#         }

#     matched = user_norm.intersection(job_norm)
#     missing = job_norm - user_norm

#     # Readiness = % of required skills the user already has
#     readiness = int(round(len(matched) / len(job_norm) * 100))

#     # Build per-skill breakdown with a proficiency estimate
#     # (In a real system this would come from user self-assessment or quiz results)
#     skill_breakdown = []

#     for skill in sorted(matched):
#         skill_breakdown.append({
#             "skill":      skill,
#             "status":     "have",
#             "proficiency": 75,  # Placeholder — would be assessed in Step 11
#         })

#     for skill in sorted(missing):
#         skill_breakdown.append({
#             "skill":      skill,
#             "status":     "missing",
#             "proficiency": 0,
#         })

#     # Build learning path — prioritise missing skills with available resources
#     learning_path = []
#     for skill in sorted(missing):
#         resources = LEARNING_RESOURCES.get(skill, [DEFAULT_RESOURCE.copy()])
#         # Pick the best free resource first, then paid
#         free_resources = [r for r in resources if r.get("free")]
#         paid_resources = [r for r in resources if not r.get("free")]

#         recommended = (free_resources[0] if free_resources else
#                        paid_resources[0] if paid_resources else DEFAULT_RESOURCE.copy())

#         learning_path.append({
#             "skill":    skill,
#             "priority": "high" if len(missing) <= 3 else ("medium" if len(missing) <= 6 else "low"),
#             "resource": recommended,
#         })

#     return {
#         "overall_readiness": readiness,
#         "matched_skills":    sorted(matched),
#         "missing_skills":    sorted(missing),
#         "learning_path":     learning_path,
#         "skill_breakdown":   skill_breakdown,
#         "job_title":         job.get("title", ""),
#         "job_company":       job.get("company", ""),
#     }

"""
skill_gap.py
============
Compares user skills to a job's requirements across ALL industries
and generates a personalised learning path.
"""

from .skill_ontology     import normalize_skills_list
from .cv_skill_extractor import _ALL_ALIASES

# ─────────────────────────────────────────────────────────────────────────────
# LEARNING RESOURCES  —  covers all sectors
# ─────────────────────────────────────────────────────────────────────────────

LEARNING_RESOURCES: dict[str, list[dict]] = {
    # ── Technology ────────────────────────────────────────────────────────────
    "React":          [{"title":"React Official Tutorial","provider":"React Dev","url":"https://react.dev/learn","duration":"8h","free":True},
                       {"title":"React – The Complete Guide","provider":"Udemy","url":"https://udemy.com","duration":"40h","free":False}],
    "TypeScript":     [{"title":"TypeScript Handbook","provider":"Official Docs","url":"https://www.typescriptlang.org/docs/","duration":"10h","free":True}],
    "JavaScript":     [{"title":"JavaScript.info","provider":"javascript.info","url":"https://javascript.info","duration":"20h","free":True}],
    "Node.js":        [{"title":"Node.js Docs","provider":"nodejs.org","url":"https://nodejs.org/docs","duration":"8h","free":True}],
    "Python":         [{"title":"Python Official Tutorial","provider":"python.org","url":"https://docs.python.org/3/tutorial/","duration":"12h","free":True},
                       {"title":"100 Days of Code: Python","provider":"Udemy","url":"https://udemy.com","duration":"60h","free":False}],
    "SQL":            [{"title":"SQLZoo","provider":"sqlzoo.net","url":"https://sqlzoo.net","duration":"8h","free":True}],
    "PostgreSQL":     [{"title":"PostgreSQL Tutorial","provider":"postgresqltutorial.com","url":"https://www.postgresqltutorial.com","duration":"10h","free":True}],
    "MongoDB":        [{"title":"MongoDB University","provider":"MongoDB","url":"https://university.mongodb.com","duration":"10h","free":True}],
    "AWS":            [{"title":"AWS Cloud Practitioner Essentials","provider":"AWS Training","url":"https://aws.amazon.com/training","duration":"20h","free":True},
                       {"title":"AWS Solutions Architect","provider":"A Cloud Guru","url":"https://acloudguru.com","duration":"50h","free":False}],
    "Docker":         [{"title":"Docker Getting Started","provider":"Docker Docs","url":"https://docs.docker.com","duration":"5h","free":True}],
    "Kubernetes":     [{"title":"Kubernetes Basics","provider":"Google","url":"https://kubernetes.io/docs/tutorials/kubernetes-basics/","duration":"8h","free":True}],
    "Machine Learning":[{"title":"ML Crash Course","provider":"Google","url":"https://developers.google.com/machine-learning/crash-course","duration":"15h","free":True},
                        {"title":"Machine Learning Specialization","provider":"Coursera","url":"https://coursera.org","duration":"90h","free":False}],
    "Data Science":   [{"title":"Data Science with Python","provider":"Kaggle","url":"https://www.kaggle.com/learn","duration":"20h","free":True}],
    "Git":            [{"title":"Pro Git Book","provider":"git-scm.com","url":"https://git-scm.com/book","duration":"6h","free":True}],
    "REST APIs":      [{"title":"REST API Tutorial","provider":"restfulapi.net","url":"https://restfulapi.net","duration":"4h","free":True}],
    "GraphQL":        [{"title":"GraphQL Official Learn","provider":"GraphQL.org","url":"https://graphql.org/learn/","duration":"5h","free":True}],
    "Linux":          [{"title":"Linux Command Line Basics","provider":"Udacity","url":"https://udacity.com","duration":"5h","free":True}],
    "Pandas":         [{"title":"Pandas Documentation","provider":"pandas.pydata.org","url":"https://pandas.pydata.org/docs/getting_started/","duration":"6h","free":True}],
    "Matplotlib":     [{"title":"Matplotlib Tutorials","provider":"matplotlib.org","url":"https://matplotlib.org/stable/tutorials/","duration":"4h","free":True}],
    "Scikit-learn":   [{"title":"Scikit-learn Tutorials","provider":"scikit-learn.org","url":"https://scikit-learn.org/stable/tutorial/","duration":"8h","free":True}],
    # ── Finance & Accounting ──────────────────────────────────────────────────
    "Accounting":     [{"title":"Accounting Fundamentals","provider":"Corporate Finance Institute","url":"https://corporatefinanceinstitute.com","duration":"15h","free":False},
                       {"title":"Introduction to Accounting","provider":"Coursera","url":"https://coursera.org","duration":"12h","free":False}],
    "Excel":          [{"title":"Excel for Beginners","provider":"GCFGlobal","url":"https://edu.gcfglobal.org/en/excel/","duration":"5h","free":True},
                       {"title":"Microsoft Excel – Excel from Beginner to Advanced","provider":"Udemy","url":"https://udemy.com","duration":"18h","free":False}],
    "Financial Analysis":[{"title":"Financial Modelling & Valuation","provider":"CFI","url":"https://corporatefinanceinstitute.com","duration":"20h","free":False}],
    "Bookkeeping":    [{"title":"Bookkeeping Basics","provider":"QuickBooks","url":"https://quickbooks.intuit.com/r/training/","duration":"5h","free":True}],
    "Audit":          [{"title":"Internal Audit Fundamentals","provider":"IIA","url":"https://www.theiia.org","duration":"10h","free":False}],
    "SAP":            [{"title":"SAP Learning Hub","provider":"SAP","url":"https://learning.sap.com","duration":"20h","free":False}],
    "QuickBooks":     [{"title":"QuickBooks Training","provider":"Intuit","url":"https://quickbooks.intuit.com/r/training/","duration":"5h","free":True}],
    "Power BI":       [{"title":"Power BI Guided Learning","provider":"Microsoft","url":"https://learn.microsoft.com/en-us/power-bi/guided-learning/","duration":"8h","free":True}],
    "Tableau":        [{"title":"Tableau Free Training","provider":"Tableau","url":"https://www.tableau.com/learn/training","duration":"10h","free":True}],
    # ── HR ────────────────────────────────────────────────────────────────────
    "Recruitment":    [{"title":"Recruitment Fundamentals","provider":"CIPD","url":"https://www.cipd.org","duration":"8h","free":False}],
    "Human Resources":[{"title":"HR Fundamentals","provider":"Coursera","url":"https://coursera.org","duration":"15h","free":False}],
    "CIPD":           [{"title":"CIPD Qualifications","provider":"CIPD","url":"https://www.cipd.org/qualifications/","duration":"Varies","free":False}],
    # ── Marketing & Sales ─────────────────────────────────────────────────────
    "Digital Marketing":[{"title":"Google Digital Garage","provider":"Google","url":"https://learndigital.withgoogle.com/digitalgarage","duration":"40h","free":True}],
    "SEO":            [{"title":"SEO Starter Guide","provider":"Google","url":"https://developers.google.com/search/docs/beginner/seo-starter-guide","duration":"4h","free":True},
                       {"title":"SEO Training Course","provider":"Moz","url":"https://moz.com/academy","duration":"8h","free":False}],
    "Google Ads":     [{"title":"Google Ads Certification","provider":"Google Skillshop","url":"https://skillshop.withgoogle.com","duration":"10h","free":True}],
    "Social Media":   [{"title":"Social Media Marketing","provider":"HubSpot Academy","url":"https://academy.hubspot.com","duration":"6h","free":True}],
    "Content Marketing":[{"title":"Content Marketing Certification","provider":"HubSpot Academy","url":"https://academy.hubspot.com","duration":"5h","free":True}],
    "HubSpot":        [{"title":"HubSpot CRM Training","provider":"HubSpot Academy","url":"https://academy.hubspot.com","duration":"4h","free":True}],
    "Sales":          [{"title":"Sales Training and Strategy","provider":"Coursera","url":"https://coursera.org","duration":"12h","free":False}],
    "CRM":            [{"title":"CRM Fundamentals","provider":"Salesforce Trailhead","url":"https://trailhead.salesforce.com","duration":"5h","free":True}],
    "Salesforce":     [{"title":"Salesforce Admin Beginner","provider":"Salesforce Trailhead","url":"https://trailhead.salesforce.com","duration":"8h","free":True}],
    # ── Healthcare ────────────────────────────────────────────────────────────
    "Patient Care":   [{"title":"Patient Care Technician","provider":"Coursera","url":"https://coursera.org","duration":"15h","free":False}],
    "First Aid":      [{"title":"First Aid & CPR","provider":"Red Cross","url":"https://www.redcross.org/take-a-class/first-aid","duration":"4h","free":False}],
    "Mental Health":  [{"title":"Mental Health First Aid","provider":"MHFA England","url":"https://mhfaengland.org","duration":"12h","free":False}],
    # ── Education ─────────────────────────────────────────────────────────────
    "Teaching":       [{"title":"Preparing to Teach","provider":"FutureLearn","url":"https://www.futurelearn.com","duration":"8h","free":False}],
    "Lesson Planning":[{"title":"Curriculum Design","provider":"Coursera","url":"https://coursera.org","duration":"10h","free":False}],
    "TEFL":           [{"title":"TEFL/TESOL Certificate","provider":"TEFL.org","url":"https://www.tefl.org","duration":"20h","free":False}],
    # ── Project Management ────────────────────────────────────────────────────
    "Project Management":[{"title":"Project Management Basics","provider":"Google","url":"https://grow.google/certificates/project-management/","duration":"30h","free":False},
                           {"title":"Prince2 Foundation","provider":"AXELOS","url":"https://www.axelos.com/certifications/propath/prince2","duration":"20h","free":False}],
    "Agile":          [{"title":"Agile Fundamentals","provider":"Atlassian University","url":"https://university.atlassian.com","duration":"4h","free":True}],
    # ── Construction & Trades ─────────────────────────────────────────────────
    "AutoCAD":        [{"title":"AutoCAD for Beginners","provider":"Autodesk","url":"https://www.autodesk.com/certification/learn","duration":"10h","free":True}],
    "Revit":          [{"title":"Revit Essentials","provider":"Autodesk","url":"https://www.autodesk.com/certification/learn","duration":"12h","free":True}],
    # ── Creative ──────────────────────────────────────────────────────────────
    "Figma":          [{"title":"Figma for Beginners","provider":"Figma","url":"https://help.figma.com/hc/en-us/sections/4405269443991","duration":"4h","free":True}],
    "Photoshop":      [{"title":"Photoshop Essential Training","provider":"LinkedIn Learning","url":"https://linkedin.com/learning","duration":"8h","free":False}],
    # ── Logistics ─────────────────────────────────────────────────────────────
    "Logistics":      [{"title":"Supply Chain Fundamentals","provider":"Coursera","url":"https://coursera.org","duration":"12h","free":False}],
    # ── Communication & Soft Skills ───────────────────────────────────────────
    "Communication":  [{"title":"Improving Communication Skills","provider":"Coursera","url":"https://coursera.org","duration":"8h","free":False}],
    "Leadership":     [{"title":"Inspiring and Motivating Individuals","provider":"Coursera","url":"https://coursera.org","duration":"10h","free":False}],
    "Problem Solving":[{"title":"Problem Solving Skills","provider":"LinkedIn Learning","url":"https://linkedin.com/learning","duration":"4h","free":False}],
    "Data Analysis":  [{"title":"Data Analysis with Python","provider":"Kaggle","url":"https://www.kaggle.com/learn/pandas","duration":"5h","free":True}],
}

_DEFAULT_RESOURCE = {
    "title":    "Search on Coursera",
    "provider": "Coursera",
    "url":      "https://coursera.org",
    "duration": "Varies",
    "free":     False,
}


def _best_resource(skill: str) -> dict:
    """Return the best (preferably free) learning resource for a skill."""
    resources = LEARNING_RESOURCES.get(skill, [])
    if not resources:
        # Try case-insensitive lookup
        for k, v in LEARNING_RESOURCES.items():
            if k.lower() == skill.lower():
                resources = v
                break
    if not resources:
        return dict(_DEFAULT_RESOURCE)
    free = [r for r in resources if r.get("free")]
    return free[0] if free else resources[0]


# ─────────────────────────────────────────────────────────────────────────────
# MAIN FUNCTION
# ─────────────────────────────────────────────────────────────────────────────

def analyse_skill_gap(user_skills: list[str], job: dict) -> dict:
    """
    Compare user skills to job requirements and return a gap analysis.

    Returns:
      overall_readiness  int (0–100)
      matched_skills     list[str]
      missing_skills     list[str]
      learning_path      list of {skill, priority, resource}
      skill_breakdown    list of {skill, status, proficiency}
      job_title          str
      job_company        str
    """
    user_norm = set(normalize_skills_list(user_skills))

    # Pull job skills — also try mining from description if skills list is empty
    job_skills_raw = job.get("skills") or []
    if not job_skills_raw:
        from .cv_skill_extractor import extract_skills_from_cv_text
        text = " ".join([
            job.get("title", ""),
            job.get("description", ""),
            " ".join(job.get("requirements") or []),
        ])
        job_skills_raw = extract_skills_from_cv_text(text)

    job_norm = set(normalize_skills_list(job_skills_raw))

    if not job_norm:
        return {
            "overall_readiness": 70,
            "matched_skills":    sorted(user_norm),
            "missing_skills":    [],
            "learning_path":     [],
            "skill_breakdown":   [{"skill": s, "status": "have", "proficiency": 75} for s in sorted(user_norm)],
            "job_title":         job.get("title",   ""),
            "job_company":       job.get("company", ""),
        }

    matched = user_norm & job_norm
    missing = job_norm - user_norm

    readiness = int(round(len(matched) / len(job_norm) * 100))

    # Per-skill breakdown
    breakdown = []
    for skill in sorted(matched):
        breakdown.append({"skill": skill, "status": "have",    "proficiency": 75})
    for skill in sorted(missing):
        breakdown.append({"skill": skill, "status": "missing", "proficiency": 0})

    # Learning path — sorted: high priority (fewest missing) first
    n = len(missing)
    priority = "high" if n <= 3 else "medium" if n <= 6 else "low"

    learning_path = [
        {
            "skill":    skill,
            "priority": priority,
            "resource": _best_resource(skill),
        }
        for skill in sorted(missing)
    ]

    return {
        "overall_readiness": readiness,
        "matched_skills":    sorted(matched),
        "missing_skills":    sorted(missing),
        "learning_path":     learning_path,
        "skill_breakdown":   breakdown,
        "job_title":         job.get("title",   ""),
        "job_company":       job.get("company", ""),
    }