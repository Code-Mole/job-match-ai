"""
Skill ontology — maps raw text tokens to canonical skill names.
When a CV says "ReactJS" or "React.js", we normalize it to "React"
so it matches jobs that list "React".
"""

# Each key = canonical skill name
# Each value = list of aliases / synonyms that should map to it
SKILL_ALIASES = {
    # ── Frontend ──────────────────────────────────────────────────────────────
    "React":        ["reactjs", "react.js", "react js", "reactjs.org", "react native"],
    "Vue":          ["vuejs", "vue.js", "vue js", "vue 3", "vuex"],
    "Angular":      ["angularjs", "angular.js", "angular 2+", "angular2", "ng"],
    "TypeScript":   ["ts", "typescript", "typed javascript"],
    "JavaScript":   ["js", "javascript", "es6", "es2015", "es2020", "ecmascript", "vanilla js"],
    "HTML":         ["html5", "html 5", "hypertext markup"],
    "CSS":          ["css3", "css 3", "stylesheets", "cascading style sheets"],
    "Tailwind":     ["tailwind css", "tailwindcss"],
    "Next.js":      ["nextjs", "next js", "next.js"],
    "Nuxt":         ["nuxtjs", "nuxt.js", "nuxt js"],
    "GraphQL":      ["graphql", "gql", "apollo", "apollo graphql"],
    "Redux":        ["redux", "redux toolkit", "rtk", "mobx"],
    "Webpack":      ["webpack", "vite", "rollup", "parcel", "esbuild"],
    "WebGL":        ["webgl", "three.js", "threejs", "canvas api"],

    # ── Backend ───────────────────────────────────────────────────────────────
    "Node.js":      ["nodejs", "node js", "node", "express", "expressjs", "express.js"],
    "Python":       ["python3", "python 3", "py", "cpython"],
    "Django":       ["django", "django rest framework", "drf"],
    "Flask":        ["flask", "flask-restful", "flask restful"],
    "FastAPI":      ["fastapi", "fast api"],
    "Java":         ["java", "java 11", "java 17", "jvm", "spring", "spring boot"],
    "Go":           ["golang", "go lang", "go programming"],
    "Rust":         ["rust", "rust lang"],
    "PHP":          ["php", "laravel", "symfony"],
    "Ruby":         ["ruby", "rails", "ruby on rails", "ror"],
    "C#":           ["c#", "csharp", ".net", "asp.net", "dotnet"],
    "C++":          ["c++", "cpp", "c plus plus"],

    # ── Databases ─────────────────────────────────────────────────────────────
    "PostgreSQL":   ["postgres", "postgresql", "pg", "psql"],
    "MySQL":        ["mysql", "mariadb", "aurora mysql"],
    "MongoDB":      ["mongodb", "mongo", "mongoose", "atlas"],
    "Redis":        ["redis", "elasticache", "redis cache"],
    "SQLite":       ["sqlite", "sqlite3"],
    "Elasticsearch":["elasticsearch", "elastic search", "elk", "opensearch"],
    "Cassandra":    ["cassandra", "apache cassandra"],

    # ── Cloud & DevOps ────────────────────────────────────────────────────────
    "AWS":          ["amazon web services", "amazon aws", "ec2", "s3", "lambda", "rds", "ecs", "eks"],
    "GCP":          ["google cloud", "google cloud platform", "gke", "bigquery", "firebase"],
    "Azure":        ["microsoft azure", "azure devops", "az"],
    "Docker":       ["docker", "dockerfile", "docker-compose", "containerization", "containers"],
    "Kubernetes":   ["kubernetes", "k8s", "kubectl", "helm", "aks", "gke", "eks"],
    "Terraform":    ["terraform", "infrastructure as code", "iac", "hashicorp"],
    "CI/CD":        ["ci/cd", "cicd", "github actions", "gitlab ci", "jenkins", "circleci", "travis"],
    "Linux":        ["linux", "ubuntu", "debian", "centos", "bash", "shell scripting", "unix"],

    # ── AI/ML ─────────────────────────────────────────────────────────────────
    "Machine Learning": ["ml", "machine learning", "supervised learning", "unsupervised learning"],
    "Deep Learning":    ["deep learning", "dl", "neural networks", "ann", "cnn", "rnn", "lstm"],
    "PyTorch":          ["pytorch", "torch"],
    "TensorFlow":       ["tensorflow", "tf", "keras"],
    "NLP":              ["natural language processing", "nlp", "text processing", "spacy", "nltk"],
    "Computer Vision":  ["computer vision", "cv", "image processing", "opencv"],
    "scikit-learn":     ["sklearn", "scikit learn", "scikit-learn"],
    "Pandas":           ["pandas", "dataframes"],
    "NumPy":            ["numpy", "np"],
    "HuggingFace":      ["hugging face", "huggingface", "transformers", "bert", "gpt"],

    # ── Tools & Practices ─────────────────────────────────────────────────────
    "Git":              ["git", "github", "gitlab", "bitbucket", "version control"],
    "REST APIs":        ["rest", "restful", "rest api", "rest apis", "api development"],
    "Agile":            ["agile", "scrum", "kanban", "sprint"],
    "Testing":          ["testing", "jest", "pytest", "unit testing", "e2e", "cypress", "selenium"],
    "Figma":            ["figma", "sketch", "adobe xd"],
    "System Design":    ["system design", "distributed systems", "microservices", "architecture"],

    # ── Healthcare, business, trades (open matching — not tech-only) ───────────
    "Nursing":            ["registered nurse", "rn", "lpn", "nursing", "patient care"],
    "Patient Care":       ["patient care", "bedside care", "clinical care"],
    "Healthcare":         ["healthcare", "health care", "medical assistant"],
    "Teaching":           ["teaching", "teacher", "classroom", "lecturer"],
    "Excel":              ["excel", "spreadsheets", "pivot tables"],
    "Accounting":         ["accounting", "bookkeeping", "accounts payable"],
    "Sales":              ["sales", "business development", "b2b", "b2c"],
    "Marketing":          ["marketing", "digital marketing", "seo"],
    "Customer Service":   ["customer service", "call centre", "call center"],
    "Administration":     ["administration", "office admin", "personal assistant"],
    "Human Resources":    ["human resources", "hr", "recruitment"],
    "Project Management": ["project management", "pmp", "prince2"],
    "Driving":            ["driving", "delivery driver", "hgv", "cdl"],
    "Warehouse":          ["warehouse", "pick and pack", "stock control"],
    "Logistics":          ["logistics", "supply chain"],
    "Construction":       ["construction", "site supervisor", "cscs"],
    "Electrician":        ["electrician", "electrical"],
    "Plumber":            ["plumber", "plumbing"],
    "Hospitality":        ["hospitality", "hotel", "restaurant"],
    "Chef":               ["chef", "sous chef", "culinary"],
    "Communication":      ["communication", "verbal communication"],
    "Leadership":         ["leadership", "team lead", "supervisor"],
    "Teamwork":           ["teamwork", "team player", "collaboration"],
}

# Build a reverse lookup: alias → canonical name
# e.g. "reactjs" → "React"
_REVERSE_MAP = {}
for canonical, aliases in SKILL_ALIASES.items():
    _REVERSE_MAP[canonical.lower()] = canonical  # canonical maps to itself
    for alias in aliases:
        _REVERSE_MAP[alias.lower()] = canonical


def normalize_skill(raw_skill: str) -> str:
    """
    Normalize a raw skill string to its canonical form.
    e.g. "ReactJS" → "React", "nodejs" → "Node.js"
    Returns the original (lowercased + stripped) if no mapping found.
    """
    cleaned = raw_skill.lower().strip()
    return _REVERSE_MAP.get(cleaned, raw_skill.strip())


def normalize_skills_list(skills: list) -> list:
    """Normalize a list of skills, removing duplicates."""
    normalized = list(dict.fromkeys(normalize_skill(s) for s in skills if s.strip()))
    return normalized


def get_all_canonical_skills() -> list:
    """Return the full list of canonical skill names for building the TF-IDF vocabulary."""
    return list(SKILL_ALIASES.keys())