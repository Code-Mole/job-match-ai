# """
# Skill ontology — maps raw text tokens to canonical skill names.
# When a CV says "ReactJS" or "React.js", we normalize it to "React"
# so it matches jobs that list "React".
# """

# # Each key = canonical skill name
# # Each value = list of aliases / synonyms that should map to it
# SKILL_ALIASES = {
#     # ── Frontend ──────────────────────────────────────────────────────────────
#     "React":        ["reactjs", "react.js", "react js", "reactjs.org", "react native"],
#     "Vue":          ["vuejs", "vue.js", "vue js", "vue 3", "vuex"],
#     "Angular":      ["angularjs", "angular.js", "angular 2+", "angular2", "ng"],
#     "TypeScript":   ["ts", "typescript", "typed javascript"],
#     "JavaScript":   ["js", "javascript", "es6", "es2015", "es2020", "ecmascript", "vanilla js"],
#     "HTML":         ["html5", "html 5", "hypertext markup"],
#     "CSS":          ["css3", "css 3", "stylesheets", "cascading style sheets"],
#     "Tailwind":     ["tailwind css", "tailwindcss"],
#     "Next.js":      ["nextjs", "next js", "next.js"],
#     "Nuxt":         ["nuxtjs", "nuxt.js", "nuxt js"],
#     "GraphQL":      ["graphql", "gql", "apollo", "apollo graphql"],
#     "Redux":        ["redux", "redux toolkit", "rtk", "mobx"],
#     "Webpack":      ["webpack", "vite", "rollup", "parcel", "esbuild"],
#     "WebGL":        ["webgl", "three.js", "threejs", "canvas api"],

#     # ── Backend ───────────────────────────────────────────────────────────────
#     "Node.js":      ["nodejs", "node js", "node", "express", "expressjs", "express.js"],
#     "Python":       ["python3", "python 3", "py", "cpython"],
#     "Django":       ["django", "django rest framework", "drf"],
#     "Flask":        ["flask", "flask-restful", "flask restful"],
#     "FastAPI":      ["fastapi", "fast api"],
#     "Java":         ["java", "java 11", "java 17", "jvm", "spring", "spring boot"],
#     "Go":           ["golang", "go lang", "go programming"],
#     "Rust":         ["rust", "rust lang"],
#     "PHP":          ["php", "laravel", "symfony"],
#     "Ruby":         ["ruby", "rails", "ruby on rails", "ror"],
#     "C#":           ["c#", "csharp", ".net", "asp.net", "dotnet"],
#     "C++":          ["c++", "cpp", "c plus plus"],

#     # ── Databases ─────────────────────────────────────────────────────────────
#     "PostgreSQL":   ["postgres", "postgresql", "pg", "psql"],
#     "MySQL":        ["mysql", "mariadb", "aurora mysql"],
#     "MongoDB":      ["mongodb", "mongo", "mongoose", "atlas"],
#     "Redis":        ["redis", "elasticache", "redis cache"],
#     "SQLite":       ["sqlite", "sqlite3"],
#     "Elasticsearch":["elasticsearch", "elastic search", "elk", "opensearch"],
#     "Cassandra":    ["cassandra", "apache cassandra"],

#     # ── Cloud & DevOps ────────────────────────────────────────────────────────
#     "AWS":          ["amazon web services", "amazon aws", "ec2", "s3", "lambda", "rds", "ecs", "eks"],
#     "GCP":          ["google cloud", "google cloud platform", "gke", "bigquery", "firebase"],
#     "Azure":        ["microsoft azure", "azure devops", "az"],
#     "Docker":       ["docker", "dockerfile", "docker-compose", "containerization", "containers"],
#     "Kubernetes":   ["kubernetes", "k8s", "kubectl", "helm", "aks", "gke", "eks"],
#     "Terraform":    ["terraform", "infrastructure as code", "iac", "hashicorp"],
#     "CI/CD":        ["ci/cd", "cicd", "github actions", "gitlab ci", "jenkins", "circleci", "travis"],
#     "Linux":        ["linux", "ubuntu", "debian", "centos", "bash", "shell scripting", "unix"],

#     # ── AI/ML ─────────────────────────────────────────────────────────────────
#     "Machine Learning": ["ml", "machine learning", "supervised learning", "unsupervised learning"],
#     "Deep Learning":    ["deep learning", "dl", "neural networks", "ann", "cnn", "rnn", "lstm"],
#     "PyTorch":          ["pytorch", "torch"],
#     "TensorFlow":       ["tensorflow", "tf", "keras"],
#     "NLP":              ["natural language processing", "nlp", "text processing", "spacy", "nltk"],
#     "Computer Vision":  ["computer vision", "cv", "image processing", "opencv"],
#     "scikit-learn":     ["sklearn", "scikit learn", "scikit-learn"],
#     "Pandas":           ["pandas", "dataframes"],
#     "NumPy":            ["numpy", "np"],
#     "HuggingFace":      ["hugging face", "huggingface", "transformers", "bert", "gpt"],

#     # ── Tools & Practices ─────────────────────────────────────────────────────
#     "Git":              ["git", "github", "gitlab", "bitbucket", "version control"],
#     "REST APIs":        ["rest", "restful", "rest api", "rest apis", "api development"],
#     "Agile":            ["agile", "scrum", "kanban", "sprint"],
#     "Testing":          ["testing", "jest", "pytest", "unit testing", "e2e", "cypress", "selenium"],
#     "Figma":            ["figma", "sketch", "adobe xd"],
#     "System Design":    ["system design", "distributed systems", "microservices", "architecture"],

#     # ── Healthcare, business, trades (open matching — not tech-only) ───────────
#     "Nursing":            ["registered nurse", "rn", "lpn", "nursing", "patient care"],
#     "Patient Care":       ["patient care", "bedside care", "clinical care"],
#     "Healthcare":         ["healthcare", "health care", "medical assistant"],
#     "Teaching":           ["teaching", "teacher", "classroom", "lecturer"],
#     "Excel":              ["excel", "spreadsheets", "pivot tables"],
#     "Accounting":         ["accounting", "bookkeeping", "accounts payable"],
#     "Sales":              ["sales", "business development", "b2b", "b2c"],
#     "Marketing":          ["marketing", "digital marketing", "seo"],
#     "Customer Service":   ["customer service", "call centre", "call center"],
#     "Administration":     ["administration", "office admin", "personal assistant"],
#     "Human Resources":    ["human resources", "hr", "recruitment"],
#     "Project Management": ["project management", "pmp", "prince2"],
#     "Driving":            ["driving", "delivery driver", "hgv", "cdl"],
#     "Warehouse":          ["warehouse", "pick and pack", "stock control"],
#     "Logistics":          ["logistics", "supply chain"],
#     "Construction":       ["construction", "site supervisor", "cscs"],
#     "Electrician":        ["electrician", "electrical"],
#     "Plumber":            ["plumber", "plumbing"],
#     "Hospitality":        ["hospitality", "hotel", "restaurant"],
#     "Chef":               ["chef", "sous chef", "culinary"],
#     "Communication":      ["communication", "verbal communication"],
#     "Leadership":         ["leadership", "team lead", "supervisor"],
#     "Teamwork":           ["teamwork", "team player", "collaboration"],
# }

# # Build a reverse lookup: alias → canonical name
# # e.g. "reactjs" → "React"
# _REVERSE_MAP = {}
# for canonical, aliases in SKILL_ALIASES.items():
#     _REVERSE_MAP[canonical.lower()] = canonical  # canonical maps to itself
#     for alias in aliases:
#         _REVERSE_MAP[alias.lower()] = canonical


# def normalize_skill(raw_skill: str) -> str:
#     """
#     Normalize a raw skill string to its canonical form.
#     e.g. "ReactJS" → "React", "nodejs" → "Node.js"
#     Returns the original (lowercased + stripped) if no mapping found.
#     """
#     cleaned = raw_skill.lower().strip()
#     return _REVERSE_MAP.get(cleaned, raw_skill.strip())


# def normalize_skills_list(skills: list) -> list:
#     """Normalize a list of skills, removing duplicates."""
#     normalized = list(dict.fromkeys(normalize_skill(s) for s in skills if s.strip()))
#     return normalized


# # Skills in the same family count as partial semantic overlap
# SEMANTIC_SKILL_GROUPS = [
#     {"React", "JavaScript", "TypeScript", "Frontend", "Web Development", "Next.js", "Vue", "Angular", "CSS", "HTML"},
#     {"Node.js", "Backend Development", "REST APIs", "Express", "Python", "Django", "Flask", "FastAPI", "Java", "Go"},
#     {"PostgreSQL", "MySQL", "MongoDB", "Database Management", "SQL", "Redis"},
#     {"AWS", "GCP", "Azure", "Cloud", "DevOps", "Docker", "Kubernetes", "CI/CD"},
#     {"Machine Learning", "Deep Learning", "Python", "PyTorch", "TensorFlow", "NLP", "Data Science"},
#     {"Marketing", "Digital Marketing", "SEO", "Sales", "Business Development"},
#     {"Accounting", "Finance", "Excel", "Bookkeeping"},
#     {"Nursing", "Healthcare", "Patient Care"},
#     {"Construction", "Project Management"},
#     {"Teaching", "Education", "Lesson Planning"},
#     {"Logistics", "Warehouse", "Supply Chain"},
#     {"Leadership", "Project Management", "Team Management"},
# ]

# _GROUP_LOOKUP = {}
# for group in SEMANTIC_SKILL_GROUPS:
#     for skill in group:
#         _GROUP_LOOKUP[normalize_skill(skill).lower()] = group


# def skill_semantic_similarity(user_skill: str, job_skill: str) -> float:
#     """
#     Return 0.0–1.0 relatedness between two skills (exact, substring, or same family).
#     """
#     us = normalize_skill(user_skill).lower()
#     js = normalize_skill(job_skill).lower()
#     if not us or not js:
#         return 0.0
#     if us == js or us in js or js in us:
#         return 1.0

#     user_group = _GROUP_LOOKUP.get(us)
#     job_group = _GROUP_LOOKUP.get(js)
#     if user_group and job_group and user_group is job_group:
#         return 0.55

#     for alias, canonical in _REVERSE_MAP.items():
#         if alias == us or alias == js:
#             other = js if alias == us else us
#             if canonical.lower() == other or canonical.lower() in other:
#                 return 0.85
#     return 0.0


# def get_all_canonical_skills() -> list:
#     """Return the full list of canonical skill names for building the TF-IDF vocabulary."""
#     return list(SKILL_ALIASES.keys())

"""
skill_ontology.py
=================
Canonical skill names and their aliases, covering ALL industries.
Used for normalisation across the matching pipeline.
"""

# Each key = canonical display name
# Each value = list of aliases that should map to it
SKILL_ALIASES: dict[str, list[str]] = {
    # ── Frontend / Web ────────────────────────────────────────────────────────
    "React":          ["reactjs","react.js","react js","react native web"],
    "Vue":            ["vuejs","vue.js","vue js","vue 3","vuex","nuxt"],
    "Angular":        ["angularjs","angular.js","angular 2","angular2","ng "],
    "TypeScript":     ["typescript","ts "],
    "JavaScript":     ["javascript","js ","es6","es2015","es2020","ecmascript","vanilla js","vanilla javascript"],
    "HTML":           ["html5","html 5","hypertext markup"],
    "CSS":            ["css3","css 3","stylesheets","cascading style sheets","scss","sass","less"],
    "Tailwind":       ["tailwind css","tailwindcss","tailwind"],
    "Next.js":        ["nextjs","next js","next.js"],
    "GraphQL":        ["graphql","gql","apollo graphql","apollo"],
    "Redux":          ["redux","redux toolkit","rtk","mobx","zustand"],
    "Webpack":        ["webpack","vite","rollup","parcel","esbuild"],
    "WebGL":          ["webgl","three.js","threejs","canvas api"],
    "Figma":          ["figma","ui design","ux design"],
    "WordPress":      ["wordpress","wp","elementor","woocommerce"],
    "Shopify":        ["shopify","shopify development","e-commerce platform"],
    # ── Backend ───────────────────────────────────────────────────────────────
    "Node.js":        ["nodejs","node js","node","express","expressjs","express.js"],
    "Python":         ["python3","python 3","py "],
    "Django":         ["django","django rest framework","drf"],
    "Flask":          ["flask","flask-restful"],
    "FastAPI":        ["fastapi","fast api"],
    "Java":           ["java se","java ee","jvm","spring","spring boot","spring mvc"],
    "Go":             ["golang","go lang"],
    "Rust":           ["rust lang","rust programming"],
    "PHP":            ["php","laravel","symfony","codeigniter"],
    "Ruby":           ["ruby","rails","ruby on rails","ror"],
    "C#":             ["csharp",".net","asp.net","dotnet","asp .net"],
    "C++":            ["cpp","c plus plus"],
    "Swift":          ["swift","swiftui","ios development"],
    "Kotlin":         ["kotlin","android development"],
    "Scala":          ["scala","play framework"],
    "R":              ["r programming","rstudio","r language"],
    "MATLAB":         ["matlab","simulink"],
    "VB.NET":         ["vb.net","visual basic .net","visual basic","vba"],
    # ── Databases ─────────────────────────────────────────────────────────────
    "SQL":            ["sql","t-sql","pl/sql","mysql","mariadb","sqlite","sqlite3"],
    "PostgreSQL":     ["postgres","postgresql","pg ","psql"],
    "MongoDB":        ["mongo","mongoose","mongodb atlas"],
    "Redis":          ["redis","elasticache"],
    "Elasticsearch":  ["elasticsearch","elastic search","elk stack","opensearch"],
    "Oracle":         ["oracle db","oracle database","oracle sql"],
    "Cassandra":      ["cassandra","apache cassandra"],
    # ── Cloud & DevOps ────────────────────────────────────────────────────────
    "AWS":            ["amazon web services","amazon aws","ec2","s3","lambda","rds","ecs","eks","cloudfront"],
    "GCP":            ["google cloud","google cloud platform","gke","bigquery","firebase","gcp"],
    "Azure":          ["microsoft azure","azure devops","az ","azure cloud"],
    "Docker":         ["dockerfile","docker-compose","containerization","containers","containerisation"],
    "Kubernetes":     ["k8s","kubectl","helm","aks","gke k8s","eks k8s"],
    "Terraform":      ["infrastructure as code","iac","hashicorp"],
    "CI/CD":          ["cicd","github actions","gitlab ci","jenkins","circleci","travis","bamboo","teamcity"],
    "Linux":          ["ubuntu","debian","centos","bash","shell scripting","unix","rhel"],
    "Git":            ["github","gitlab","bitbucket","version control","svn"],
    "REST APIs":      ["rest","restful","rest api","api development","rest apis"],
    "Agile":          ["scrum","kanban","sprint","agile methodology","safe agile"],
    # ── AI / ML / Data ────────────────────────────────────────────────────────
    "Machine Learning":     ["ml ","supervised learning","unsupervised learning","reinforcement learning"],
    "Deep Learning":        ["neural networks","ann","cnn","rnn","lstm"],
    "PyTorch":              ["pytorch","torch"],
    "TensorFlow":           ["tensorflow","tf ","keras"],
    "NLP":                  ["natural language processing","text processing","spacy","nltk","huggingface"],
    "Computer Vision":      ["computer vision","image processing","opencv"],
    "Scikit-learn":         ["sklearn","scikit learn","scikit-learn"],
    "Pandas":               ["pandas","dataframes","pandas python"],
    "NumPy":                ["numpy","np ","numerical python"],
    "Matplotlib":           ["matplotlib","plotly","data plotting"],
    "Seaborn":             ["seaborn","sea born"],
    "Jupyter":              ["jupyter","jupyter notebook","jupyter lab","ipython"],
    "Data Science":         ["data scientist","data science"],
    "Data Analysis":        ["data analysis","data analytics","analysing data","analyzing data"],
    "Power BI":             ["powerbi","power bi","business intelligence","microsoft bi"],
    "Tableau":              ["tableau desktop","tableau server"],
    "SPSS":                 ["spss","statistical analysis software"],
    "Apache Spark":         ["spark","pyspark","apache spark"],
    "Hadoop":               ["hadoop","hdfs","mapreduce","hive"],
    "Airflow":              ["apache airflow","workflow orchestration"],
    "dbt":                  ["dbt","data build tool"],
    # ── Finance & Accounting ──────────────────────────────────────────────────
    "Accounting":           ["bookkeeping","general ledger","double entry","accounts","acca","cpa"],
    "Financial Analysis":   ["financial analysis","financial modelling","financial modeling","financial reporting"],
    "Budgeting":            ["budgeting","budget management","forecasting","financial planning","cost management"],
    "Audit":                ["internal audit","external audit","statutory audit","sox"],
    "Tax":                  ["vat","tax returns","corporation tax","tax compliance","tax planning"],
    "Payroll":              ["payroll processing","payroll management","paye"],
    "Compliance":           ["regulatory compliance","gdpr","aml","kyc","fca compliance"],
    "Risk Management":      ["risk assessment","risk analysis","enterprise risk"],
    "Financial Modelling":  ["dcf","discounted cash flow","excel modelling","lbo"],
    "SAP":                  ["sap erp","sap finance","sap s/4hana","sap hana"],
    "QuickBooks":           ["quickbooks online","quickbooks desktop"],
    "Xero":                 ["xero accounting","xero software"],
    "Sage":                 ["sage accounting","sage 50","sage payroll"],
    "Bloomberg":            ["bloomberg terminal","bloomberg data"],
    # ── Microsoft Office Suite ────────────────────────────────────────────────
    "Excel":                ["ms excel","microsoft excel","spreadsheets","pivot tables","vlookup","macros"],
    "PowerPoint":           ["ms powerpoint","microsoft powerpoint","presentations","keynote","google slides"],
    "Microsoft Office":     ["ms office","office suite","office 365","microsoft 365"],
    "Word":                 ["ms word","microsoft word","google docs","word processing"],
    # ── HR ────────────────────────────────────────────────────────────────────
    "Recruitment":          ["talent acquisition","headhunting","hiring","sourcing","talent management"],
    "Human Resources":      ["hr management","people management","hrbp","hr business partner","people operations"],
    "Employee Relations":   ["er ","employee engagement","grievance","disciplinary","ir "],
    "Training":             ["learning and development","l&d","training delivery","coaching","mentoring"],
    "CIPD":                 ["cipd qualified","chartered cipd"],
    "Performance Management": ["performance reviews","appraisals","okrs","kpis"],
    "Workday":              ["workday hris","workday hr"],
    "BambooHR":             ["bamboo hr","bamboohr"],
    # ── Marketing & PR ────────────────────────────────────────────────────────
    "Digital Marketing":    ["online marketing","digital strategy","performance marketing"],
    "SEO":                  ["search engine optimisation","search engine optimization","organic search","on-page seo","off-page seo"],
    "SEM":                  ["paid search","google ppc","microsoft ads"],
    "Google Ads":           ["google adwords","google advertising","ppc google"],
    "Social Media":         ["social media management","social media marketing","instagram marketing","facebook marketing","tiktok"],
    "Content Marketing":    ["content creation","copywriting","content strategy","blogging"],
    "Email Marketing":      ["email campaigns","mailchimp","klaviyo","campaign monitor","constant contact"],
    "Brand Management":     ["brand strategy","brand identity","brand development"],
    "Market Research":      ["consumer research","market analysis","focus groups","surveys"],
    "CRM":                  ["customer relationship management","crm software"],
    "Google Analytics":     ["ga4","google analytics 4","web analytics","adobe analytics"],
    "HubSpot":              ["hubspot crm","hubspot marketing","hubspot sales"],
    "Salesforce":           ["salesforce crm","sfdc","sales cloud","service cloud"],
    "PR":                   ["public relations","media relations","press releases","communications"],
    # ── Sales ─────────────────────────────────────────────────────────────────
    "Sales":                ["b2b sales","b2c sales","direct sales","cold calling","telesales","inside sales"],
    "Account Management":   ["key account management","client management","account exec"],
    "Business Development": ["biz dev","new business","business growth","partnerships"],
    "Negotiation":          ["negotiation skills","commercial negotiation"],
    # ── Customer Service ──────────────────────────────────────────────────────
    "Customer Service":     ["customer support","customer care","call centre","call center","contact centre","helpdesk"],
    # ── Legal ─────────────────────────────────────────────────────────────────
    "Corporate Law":        ["company law","commercial law","m&a law"],
    "Contract Law":         ["contract drafting","contract review","contract management"],
    "Legal Research":       ["case law","legal analysis","legal writing"],
    "Due Diligence":        ["legal due diligence","commercial due diligence"],
    "Litigation":           ["dispute resolution","arbitration","mediation","court proceedings"],
    "Employment Law":       ["employment legislation","hr law","tribunal"],
    # ── Healthcare ────────────────────────────────────────────────────────────
    "Nursing":              ["registered nurse","rn ","lpn ","staff nurse","charge nurse","band 5","band 6"],
    "Patient Care":         ["bedside care","vital signs","patient assessment","patient monitoring"],
    "Healthcare":           ["health care","medical assistant","hca","healthcare assistant","care worker"],
    "Pharmacy":             ["pharmacist","dispensing","medicines management"],
    "Phlebotomy":           ["venepuncture","blood draw","iv cannulation"],
    "Physiotherapy":        ["physical therapy","physiotherapist","rehabilitation"],
    "Mental Health":        ["counselling","psychotherapy","mental health nursing","cbt","psychiatric"],
    "First Aid":            ["cpr","bls","acls","basic life support","first responder"],
    "Clinical Assessment":  ["patient assessment","clinical skills","clinical examination"],
    "Medication Administration": ["medicines administration","drug administration","controlled drugs"],
    "Wound Care":           ["wound management","dressing changes","tissue viability"],
    # ── Education ─────────────────────────────────────────────────────────────
    "Teaching":             ["classroom teaching","primary teaching","secondary teaching","further education"],
    "Lesson Planning":      ["curriculum planning","scheme of work","lesson preparation"],
    "Safeguarding":         ["child protection","dbs check","prevent","kcsie"],
    "SEND":                 ["special educational needs","sen ","inclusion","learning support"],
    "TEFL":                 ["tesol","efl","english language teaching","elt"],
    "Classroom Management": ["behaviour management","classroom discipline"],
    # ── Logistics & Trades ────────────────────────────────────────────────────
    "Driving":              ["delivery driver","hgv driver","cdl","van driver","courier","lgv"],
    "Warehouse":            ["pick and pack","goods in","stock control","goods out","packing"],
    "Logistics":            ["supply chain","supply chain management","freight","shipping","distribution"],
    "Procurement":          ["purchasing","buying","supplier management","sourcing","vendor management"],
    "Forklift":             ["forklift truck","counterbalance","reach truck","flt"],
    "Construction":         ["site management","civil works","groundworks","structural","building"],
    "Electrician":          ["electrical installation","18th edition","pat testing","wiring"],
    "Plumber":              ["plumbing","pipefitting","gas safe","heating engineer"],
    "HVAC":                 ["air conditioning","refrigeration","heating","ventilation","hvac engineer"],
    "AutoCAD":              ["cad","computer aided design","autocad lt"],
    "Revit":                ["bim","building information modelling","building information modeling"],
    "Health and Safety":    ["h&s","nebosh","iosh","risk assessment h&s","coshh","safety management"],
    # ── Hospitality & Catering ────────────────────────────────────────────────
    "Hospitality":          ["hotel management","front of house","foh","guest services","front desk"],
    "Chef":                 ["sous chef","head chef","kitchen management","culinary","pastry chef","line cook"],
    "Food Safety":          ["food hygiene","haccp","level 2 food","food standards"],
    "Bartending":           ["bar staff","mixology","cocktails","cellar management"],
    # ── Creative & Design ─────────────────────────────────────────────────────
    "Photoshop":            ["adobe photoshop","photo editing","image editing"],
    "Illustrator":          ["adobe illustrator","vector design","vector graphics"],
    "InDesign":             ["adobe indesign","desktop publishing","dtp"],
    "After Effects":        ["adobe after effects","motion graphics","animation"],
    "Premiere Pro":         ["adobe premiere","video editing","video production"],
    "Photography":          ["commercial photography","product photography","photo editing"],
    "UX Design":            ["user experience","ux research","usability","wireframing","prototyping"],
    # ── Project Management ────────────────────────────────────────────────────
    "Project Management":   ["pmp","prince2","programme management","project coordination","project delivery"],
    # ── Soft Skills ───────────────────────────────────────────────────────────
    "Communication":        ["communication skills","verbal communication","written communication","interpersonal"],
    "Leadership":           ["people management","team leadership","managing teams","line management"],
    "Teamwork":             ["team player","team collaboration","working in a team","collaborative"],
    "Problem Solving":      ["analytical thinking","critical thinking","analytical skills"],
    "Time Management":      ["prioritisation","prioritization","organisational skills","time management skills"],
    "Attention to Detail":  ["accuracy","quality control","meticulous","detail-oriented"],
    "Presentation Skills":  ["public speaking","presenting","presenting to stakeholders"],
    "Report Writing":       ["technical writing","business writing","documentation"],
}

# ─────────────────────────────────────────────────────────────────────────────
# BUILD REVERSE LOOKUP  alias_lower → canonical
# ─────────────────────────────────────────────────────────────────────────────

_REVERSE_MAP: dict[str, str] = {}

for _canonical, _aliases in SKILL_ALIASES.items():
    _REVERSE_MAP[_canonical.lower()] = _canonical   # canonical maps to itself
    for _alias in _aliases:
        a = _alias.lower().strip()
        if a:
            _REVERSE_MAP[a] = _canonical


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def normalize_skill(raw: str) -> str:
    """
    Map a raw skill string to its canonical display name.
    Returns the original (title-cased) if no mapping is found.
    """
    cleaned = raw.lower().strip()
    return _REVERSE_MAP.get(cleaned, raw.strip())


def normalize_skills_list(skills: list[str]) -> list[str]:
    """Normalise a list of skills, removing duplicates, preserving order."""
    seen:   set[str]  = set()
    result: list[str] = []
    for s in skills:
        if not s or not s.strip():
            continue
        canonical = normalize_skill(s)
        key = canonical.lower()
        if key not in seen:
            seen.add(key)
            result.append(canonical)
    return result


def skill_semantic_similarity(a: str, b: str) -> float:
    """
    Very lightweight semantic similarity between two skill names.
    Returns 0.0–1.0.  Used as a tiebreaker, not a primary signal.
    """
    a_lower = a.lower()
    b_lower = b.lower()

    if a_lower == b_lower:
        return 1.0

    # One is a substring of the other
    if a_lower in b_lower or b_lower in a_lower:
        shorter = min(len(a_lower), len(b_lower))
        longer  = max(len(a_lower), len(b_lower))
        return shorter / longer * 0.9

    # Shared tokens
    a_tok = set(a_lower.split())
    b_tok = set(b_lower.split())
    shared = a_tok & b_tok
    if shared:
        union = a_tok | b_tok
        return len(shared) / len(union) * 0.7

    return 0.0


def get_all_canonical_skills() -> list[str]:
    """Return all canonical skill names (for building vocabularies)."""
    return list(SKILL_ALIASES.keys())