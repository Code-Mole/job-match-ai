"""
Verify job matching is personalized per CV profile.
Run: python -m unittest tests.test_matcher -v
"""

import unittest

from app.matcher import JobMatcher
from app.cv_skill_extractor import build_matching_skills, infer_skills_from_experience


def _job(_id, title, skills, description=""):
    return {
        "_id": _id,
        "title": title,
        "company": "Acme",
        "location": "Remote",
        "type": "Full-time",
        "remote": True,
        "level": "Mid",
        "yearsExp": 3,
        "industry": title.split()[0],
        "featured": False,
        "demandTrend": "Stable",
        "description": description or f"Role focused on {title}.",
        "requirements": skills,
        "skills": skills,
    }


JOBS = [
    _job("1", "Software Engineer", ["JavaScript", "React", "Node.js", "REST APIs"]),
    _job("2", "Frontend Developer", ["React", "TypeScript", "CSS", "JavaScript"]),
    _job("3", "Senior Construction Project Manager", ["Construction", "Project Management"]),
    _job("4", "Digital Marketing Manager", ["Marketing", "SEO", "Sales"]),
    _job("5", "Financial Analyst", ["Accounting", "Excel", "Finance"]),
    _job("6", "Registered Nurse", ["Nursing", "Patient Care", "Healthcare"]),
]


class TestExperienceInference(unittest.TestCase):
    def test_infers_api_skills_from_responsibilities(self):
        cv = """
        Work Experience
        Software Developer
        - Built REST APIs for mobile clients
        - Managed team of 4 engineers
        """
        inferred = infer_skills_from_experience(cv, ["Software Developer"])
        blob = " ".join(inferred).lower()
        self.assertIn("api", blob)
        self.assertTrue(
            any("leadership" in blob or "team" in blob or "project" in blob for _ in [1]),
            f"Expected leadership/team inference, got {inferred}",
        )


class TestPersonalizedMatching(unittest.TestCase):
    def setUp(self):
        self.matcher = JobMatcher()
        self.matcher.fit(JOBS)

    def _top_titles(self, skills, cv_text="", roles=None):
        results = self.matcher.match(
            user_skills=skills,
            cv_text=cv_text,
            cv_roles=roles or [],
            top_n=4,
        )
        return [r["job"]["title"] for r in results]

    def test_software_cv_prefers_software_jobs(self):
        skills, _ = build_matching_skills(
            ["JavaScript", "React", "Node.js"],
            "Software developer with 3 years building web apps.",
            ["Software Developer"],
        )
        titles = self._top_titles(skills, cv_text="Software developer React Node.js")
        self.assertIn("Software Engineer", titles[0:2] + titles)
        self.assertNotIn(titles[0], ["Senior Construction Project Manager"])

    def test_marketing_cv_differs_from_software(self):
        mkt_skills, _ = build_matching_skills(
            ["Marketing", "SEO"],
            "Digital marketing manager with campaign experience.",
            ["Marketing Manager"],
        )
        mkt_titles = self._top_titles(mkt_skills, cv_text="digital marketing SEO campaigns")

        dev_skills, _ = build_matching_skills(
            ["JavaScript", "React"],
            "Full stack developer.",
            ["Software Developer"],
        )
        dev_titles = self._top_titles(dev_skills, cv_text="React Node developer")

        self.assertNotEqual(mkt_titles[:3], dev_titles[:3])
        self.assertIn("Digital Marketing Manager", mkt_titles[:3])

    def test_construction_cv_gets_construction_job(self):
        skills, _ = build_matching_skills(
            ["Construction", "Project Management"],
            "Site supervisor on commercial builds.",
            ["Construction Site Manager"],
        )
        titles = self._top_titles(skills, cv_text="construction site supervisor CSCS")
        self.assertIn("Senior Construction Project Manager", titles[:3])


if __name__ == "__main__":
    unittest.main()
