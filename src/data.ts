/**
 * เนื้อหาทั้งหมดของเว็บอยู่ไฟล์นี้ — แก้ข้อมูลที่นี่ที่เดียว ไม่ต้องแตะ component
 * CV PDF ก็ generate จากไฟล์นี้ (`npm run cv`) → เว็บกับ CV ตรงกันเสมอ
 * ใช้ type annotation (ไม่ใช้ `as`) เพื่อให้ TypeScript ฟ้องเมื่อลืม field ที่ required หรือพิมพ์ชื่อ field ผิด
 * ห้าม import asset ของ Vite ในไฟล์นี้ — สคริปต์ CV รันไฟล์นี้ด้วย Node ตรง ๆ
 */

export type Skill = { name: string };
export type SkillGroup = { title: string; skills: Skill[] };

export type ProjectLinkKind = "code" | "demo" | "notebook" | "certificate";
export type ProjectLink = { kind: ProjectLinkKind; href: string };
export type Project = {
  id: string;
  title: string;
  category: string;
  year?: string;
  /** บริบทของงาน เช่น วิชา/งานแข่ง/ขนาดทีม */
  context?: string;
  desc: string;
  /**
   * การ์ดแบบ problem → approach → result: ถ้าใส่ problem กับ approach การ์ดจะแสดงสามช่องนี้แทน desc
   * ไม่ใส่ (เช่นยังไม่มีข้อมูล) = การ์ดแสดง desc แทน — desc ยังต้องมีเสมอ เพราะ CV PDF ใช้
   */
  problem?: string;
  approach?: string;
  /** ผลลัพธ์ที่เป็นประโยค (ถ้ามี metric จะแสดง metric ที่ถูกขีดเน้นไว้ก่อน) */
  result?: string;
  /** ตัวเลขเด่น — ใส่เฉพาะค่าที่วัดได้จริงและอ้างอิงได้ใน repo */
  metric?: { value: string; label: string };
  /** วลีที่ขีดปากกาเน้นใน problem/approach/result (หรือ desc) — ผลลัพธ์หรือตัวเลข 1 จุดต่อการ์ด เพื่อให้สแกนเจอเร็ว */
  marks?: string[];
  /** เทคที่ชื่อตรงกับ skill → ปุ่ม skill ใช้กรองโปรเจกต์ได้ */
  tags: string[];
  /** ลิงก์แรก = ลิงก์หลักของการ์ด (คลิกได้ทั้งใบ) และของ CV จึงต้องมีอย่างน้อยหนึ่งลิงก์ */
  links: [ProjectLink, ...ProjectLink[]];
} & CvFields;
/**
 * field ที่ CV PDF ใช้อย่างเดียว เว็บไม่อ่าน: CV เล็งสาย Data Science จึงเขียนวิธีทำและผลลัพธ์ละเอียดกว่าการ์ดบนเว็บได้
 * ไม่ใส่ = CV ใช้ข้อความเดียวกับเว็บ (`desc` หรือ `bullets`) และไม่ไฮไลต์อะไร
 */
type CvFields = {
  cvBullets?: string[];
  /** วลีใน cvBullets (หรือ desc/bullets) ที่ CV ไฮไลต์: ผลลัพธ์ 1 จุดต่อรายการ ต้องพิมพ์ให้ตรงทุกตัวอักษร (check:data ตรวจ) */
  cvMarks?: string[];
};
export type TimelineItem = {
  id: string;
  title: string;
  org: string;
  period: string;
  bullets: string[];
  /** วลีใน bullets ที่ขีดปากกาเน้น — 1 จุดต่อรายการ */
  marks?: string[];
} & CvFields;
export type Certification = { id: string; title: string; issuer: string; year: string; desc: string; href?: string };
export type EducationItem = {
  id: string;
  degree: string;
  school: string;
  period: string;
  graduation?: string;
  coursework: string[];
  /** วิชาที่ CV แสดง (เฉพาะที่เกี่ยวกับ Data/AI) ไม่ใส่ = ใช้ coursework ทั้งหมด */
  cvCoursework?: string[];
};
export type CvKeyResult = { value: string; label: string };
export type CvSkillGroup = { title: string; items: string[] };
export type Highlight = {
  value: string;
  label: string;
  /** false = แสดงตัวเลขนิ่ง ๆ: อันดับ (เช่น Top 30) นับขึ้นจาก 0 แล้วอ่านเหมือนคะแนน */
  countUp?: false;
  /** ขีดปากกาเน้นค่านี้ทั้งในแถบใต้ hero และรูป OG */
  mark?: true;
};
export type ContactKind = "linkedin" | "github" | "phone";
export type ContactLink = { kind: ContactKind; label: string; value: string; href: string };

export const profile = {
  name: "Kulachart Parnduangkeaw",
  firstName: "Kulachart",
  lastName: "Parnduangkeaw",
  role: "Computer Engineering Student",
  school: "Srinakharinwirot University",
  focus: "Data Science & ML · Full-Stack",
  availability: "Open to Data/AI & full-stack internships",
  /** แสดงแค่ระดับจังหวัด — ไม่เปิดเผยบ้านเลขที่บนเว็บสาธารณะ (รวมถึง CV PDF ที่ให้ดาวน์โหลดด้วย) */
  location: "Pathum Thani, Thailand",
  phone: "+66 80 091 2939",
  email: "kulachart@kulac.dev",
  github: "KhaNomThai",
  linkedin: "kulachart-parnduangkeaw-247b47395",
  /** ต้องตรงกับ canonical / og:url ใน index.html */
  siteUrl: "https://kulac.dev",
  summary:
    "I build machine-learning systems and the full-stack apps around them, from a skin-cancer classifier benchmarked on 25,000+ images to a flood-monitoring command center that reads water depth from highway CCTV in real time. In 2026 my teams reached the top 30 at the KBTG Hackathon and the top 24 at the NTT DATA Digital Innovation Challenge. Data Science Intern at Botnoi Group (2026).",
  /**
   * วลีใน summary ที่ hero ขีดด้วยปากกาเน้น (หลักฐานที่ recruiter ควรเห็นก่อน) ไม่เกิน 2 วลีต่อจอ
   * ต้องพิมพ์ให้ตรงกับข้อความใน summary ทุกตัวอักษร — ใช้แค่บนเว็บ CV ไม่ได้ใช้
   */
  summaryMarks: ["top 30 at the KBTG Hackathon", "top 24 at the NTT DATA Digital Innovation Challenge"],
  /** บรรทัดใต้ชื่อใน CV: CV เล็งสาย DS จึงไม่ใช้ role/focus (สองค่านั้นอยู่ในรูป OG ด้วย) */
  cvHeadline: "Data Science & Machine Learning · Computer Engineering, SWU",
  /** CV ไม่ใช้สรรพนาม "I" ตามธรรมเนียมเรซูเม่ */
  cvSummary:
    "Computer Engineering student at SWU (expected 2027) and Data Science Intern at Botnoi Group (2026). Builds ML end to end, from leakage-safe validation and threshold tuning to models that run in the browser, plus agentic LLM apps on AWS Bedrock. Seeking a Data Science / AI internship.",
};

/** บรรทัด Key results ใต้ชื่อใน CV: หลักฐานที่ recruiter ควรเห็นในไม่กี่วินาที ทุกค่าต้องมีที่มาใน projects ด้านล่าง */
export const cvKeyResults: CvKeyResult[] = [
  { value: "0.89 AUC-ROC", label: "skin-cancer screening, 3,619 unseen images" },
  { value: "Data Science Intern", label: "Botnoi Group, 2026" },
  { value: "Student Leader", label: "Dept. of Computer Engineering, SWU, 2024 – Present" },
  { value: "Top 30", label: "KBTG Hackathon 2026" },
];

/**
 * Skills ใน CV แยกจาก skillGroups: บนเว็บตัวเลขข้าง skill คือจำนวนโปรเจกต์ที่ใช้ จึงเพิ่มชื่อลงไปเฉย ๆ ไม่ได้
 * ใส่เฉพาะเครื่องมือที่มีในโปรเจกต์หรือ skillGroups จริง
 */
export const cvSkills: CvSkillGroup[] = [
  {
    title: "ML / DL",
    items: ["PyTorch", "scikit-learn", "XGBoost", "Hugging Face Transformers", "OpenCV", "ONNX Runtime", "Gemini API"],
  },
  {
    title: "Methods",
    items: [
      "Demand forecasting",
      "transfer learning",
      "threshold tuning",
      "time-based validation",
      "Monte Carlo",
      "MLOps",
    ],
  },
  { title: "Data", items: ["Pandas", "NumPy", "Matplotlib", "Seaborn", "MySQL", "Google Colab"] },
  {
    title: "Languages & web",
    items: ["Python", "SQL", "TypeScript", "JavaScript", "Java", "C/C++", "FastAPI", "React", "Next.js", "Firebase", "Google Cloud", "Git"],
  },
];

export const githubUrl = `https://github.com/${profile.github}`;
export const linkedinUrl = `https://www.linkedin.com/in/${profile.linkedin}`;
export const repoUrl = `${githubUrl}/portfolio`;

/** บรรทัดนำใต้หัว section (ใช้แค่บนเว็บ) — section ที่ไม่มีในนี้แสดงแค่หัวข้อ */
export const sectionIntros = {
  projects: "Deep learning, computer vision, and full-stack work — from course projects to hackathons and real events.",
  skills: "The number is how many of my projects use a skill. Select it to see those projects.",
  contact: "I'm open to Data/AI and full-stack internship opportunities. Email is the fastest way to reach me.",
};

/** ช่องทางติดต่อนอกจากอีเมล (อีเมลมีปุ่มใหญ่ของตัวเองใน Contact) */
export const contacts: ContactLink[] = [
  // ข้อความที่แสดงต้องเป็น slug เต็ม: คนที่อ่านจาก CV ที่พิมพ์ออกมาจะพิมพ์ตามนี้ ถ้าตัดท้ายออกจะไปไม่ถึงโปรไฟล์
  { kind: "linkedin", label: "LinkedIn", value: `in/${profile.linkedin}`, href: linkedinUrl },
  { kind: "github", label: "GitHub", value: `@${profile.github}`, href: githubUrl },
  { kind: "phone", label: "Phone", value: profile.phone, href: `tel:${profile.phone.replace(/\s+/g, "")}` },
];

/** เรียงตามหมวดใน src/config/skillFamilies.ts: ML / DL → Data → Full-stack → Languages → Tools (ชื่อกลุ่มตรงกับ legend บนเว็บ) */
export const skillGroups: SkillGroup[] = [
  {
    title: "ML / DL",
    skills: [
      { name: "PyTorch" },
      { name: "scikit-learn" },
      { name: "OpenCV" },
      { name: "Machine Learning" },
      { name: "Deep Learning" },
      { name: "Computer Vision" },
    ],
  },
  {
    title: "Data",
    skills: [{ name: "Pandas" }, { name: "NumPy" }, { name: "Matplotlib" }, { name: "Seaborn" }],
  },
  {
    title: "Full-stack",
    skills: [
      { name: "React" },
      { name: "React Native" },
      { name: "Tailwind CSS" },
      { name: "HTML" },
      { name: "CSS" },
      { name: "Node.js" },
      { name: "Firebase" },
      { name: "MySQL" },
      { name: "Google Cloud" },
    ],
  },
  {
    title: "Languages",
    skills: [{ name: "Python" }, { name: "TypeScript" }, { name: "JavaScript" }, { name: "Java" }, { name: "C/C++" }],
  },
  {
    title: "Tools",
    skills: [{ name: "Git" }, { name: "Figma" }, { name: "Unity" }],
  },
];

/** เรียงจากผลงานที่แข็งที่สุดก่อน — recruiter มักอ่านแค่ 2–3 อันแรก. ข้อมูลอ้างอิงจาก README ของแต่ละ repo */
export const projects: Project[] = [
  {
    id: "katang",
    title: "KaTang Cash-flow Co-pilot",
    category: "FinTech",
    year: "2026",
    context: "KBTG Hackathon 2026 · Team of 3 · Data science",
    desc: "Banking-app feature for first jobbers with variable income that suggests a safe daily spending limit and offers to save part of it first. Built the gradient-boosting spending forecast and Monte Carlo prototype behind it on simulated data. Pitched in the top-30 round.",
    problem: "First jobbers with freelance or side-gig income can't tell how much is safe to spend before the next payment arrives.",
    approach: "A daily spending limit built from balance, reserved bills, expected income and a late-payment buffer, plus a save-first offer into a chosen Pocket; Next.js demo with a Python ML + Monte Carlo prototype on simulated data.",
    result: "Selected to pitch in the top-30 round.",
    marks: ["top-30 round"],
    // README ของ repo ระบุว่าผล ML มาจากข้อมูลจำลอง ห้ามใส่ตัวเลขความแม่นยำหรือค่า 86% ของ demo
    cvBullets: [
      "Built the gradient-boosting spending forecast and Monte Carlo prototype (simulated data) behind a safe daily spending limit for variable-income first jobbers; pitched in the top-30 round.",
    ],
    cvMarks: ["pitched in the top-30 round"],
    tags: ["Python", "scikit-learn", "Pandas", "Machine Learning", "Next.js", "TypeScript"],
    links: [
      { kind: "demo", href: "https://kkatang.vercel.app/" },
      { kind: "code", href: "https://github.com/Panupong-xD/KBTG-Hackathon" },
      { kind: "certificate", href: "https://drive.google.com/file/d/1TmOFbQuYGkrZFqnZjb5NZK9-2_aOqLwY/view?usp=sharing" },
    ],
  },  {
    id: "wellync",
    title: "WELLYNC",
    category: "Healthcare · GenAI",
    year: "2026",
    context: "NTT DATA Digital Innovation Challenge 2026 · Team of 3 · Web & LLM dev",
    desc: "Chronic-care prototype on AWS that keeps patients, caregivers and doctors on one shared, consent-checked record. Built the web app and a Bedrock agent that picks role-scoped tools to answer questions and draft care plans for doctors to review. Reached the top 24 teams.",
    problem: "Patients log health data in scattered places, caregivers have to piece it together, and doctors lose context between follow-ups.",
    approach: "One shared record with consent checks for all three roles, a Bedrock agent that drafts requests and care plans for people to confirm, and Nova Lite meal-photo analysis; serverless AWS stack with API Gateway, Lambda, Cognito and DynamoDB.",
    result: "Reached the top 24 teams.",
    marks: ["top 24 teams"],
    // รายละเอียดจาก README, docs/architecture.md และ docs/competition-readiness.md ของ repo NTT-Data
    cvBullets: [
      "Built a Bedrock agent on serverless AWS (Lambda, DynamoDB, Cognito) that picks role-scoped tools to draft care plans for doctor review in a chronic-care prototype; reached the top 24 teams.",
    ],
    cvMarks: ["reached the top 24 teams"],
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "AWS", "Amazon Bedrock", "Generative AI"],
    links: [
      { kind: "demo", href: "https://ntt-data-zeta.vercel.app" },
      { kind: "code", href: "https://github.com/Panupong-xD/NTT-Data" },
    ],
  },  {
    id: "skin-cancer-screening",
    title: "Derma AI: Skin Cancer Screening",
    category: "Deep Learning",
    year: "2026",
    context: "CPE310 Healthcare AI · Solo project",
    desc: "8-class skin-lesion classifier trained on ISIC 2019 (25,331 images). Benchmarked ResNet50, EfficientNet-B3, and DenseNet121 with class-weighted loss; the best model reaches 0.89 AUC-ROC for cancer screening and 88.7% top-2 accuracy. All three models run in the browser with ONNX Runtime Web, so images never leave the device.",
    problem: "Screen skin lesions for cancer across 8 classes (ISIC 2019, 25,331 images).",
    approach: "Benchmarked ResNet50, EfficientNet-B3 and DenseNet121 with class-weighted loss on a lesion-grouped split; exported all three to ONNX so they run in a browser app where images never leave the device.",
    result: "88.7% top-2 accuracy.",
    metric: { value: "0.89", label: "AUC-ROC on 3,619 unseen test images" },
    // วิธี split และ threshold จาก README ของ Healthcare-AI-System (หัวข้อ Partitioning และ cancer threshold)
    cvBullets: [
      "Fine-tuned ImageNet-pretrained ResNet50, EfficientNet-B3 and DenseNet121 on ISIC 2019 (25,331 images, 8 classes) with class-weighted loss for the imbalanced classes.",
      "Split by lesion (StratifiedGroupKFold) so no test lesion is seen in training; tuned each model's cancer threshold on validation to target 90% sensitivity.",
      "Best model: 0.89 AUC-ROC and 88.7% top-2 accuracy on 3,619 unseen test images; exported to ONNX so it runs in the browser and images never leave the device.",
    ],
    cvMarks: ["0.89 AUC-ROC"],
    tags: ["Python", "PyTorch", "scikit-learn", "Pandas", "Deep Learning", "Computer Vision", "ONNX Runtime", "React"],
    links: [
      { kind: "demo", href: "https://kulachart2014-derma-ai.static.hf.space/index.html" },
      { kind: "code", href: "https://github.com/KhaNomThai/Healthcare-AI-System" },
    ],
  },
  {
    id: "peak-electricity-alert",
    title: "Peak Electricity Day Alert",
    category: "Machine Learning",
    year: "2026",
    context: "CPE312 Data Science capstone",
    desc: "Predicts a week ahead which days will hit peak electricity demand, so grid maintenance can avoid them. XGBoost on 2015–2020 Panama load and weather data with leakage-safe features and a time-based split: 0.84 recall on peak days vs 0.73 for a baseline.",
    // ตัวเลขจาก Colab notebook ของเจ้าของ: test ปี 2019–2020 (543 วัน, วันพีค 220 วัน) เกณฑ์ = P80 ของ train
    problem: "Grid operators need to know a week ahead which days will hit peak demand, so they can schedule maintenance around them.",
    approach: "Turned 2015–2020 hourly load and weather data from Panama into daily rows with leakage-safe features, split train and test by time, and compared Logistic Regression and XGBoost with a same-day-last-week baseline.",
    result: "XGBoost catches 0.84 of peak days against 0.73 for the baseline, with higher precision (0.78 vs 0.73).",
    marks: ["0.84 of peak days"],
    cvBullets: [
      "Forecast a week ahead which days hit peak demand from 2015–2020 Panama load and weather data, with leakage-safe daily features and a time-based train/test split.",
      "XGBoost caught 0.84 of peak days vs 0.73 for a same-day-last-week baseline, at higher precision (0.78 vs 0.73); also compared Logistic Regression.",
    ],
    cvMarks: ["0.84 of peak days vs 0.73"],
    tags: ["Python", "XGBoost", "scikit-learn", "Pandas", "Matplotlib", "Machine Learning"],
    links: [
      {
        kind: "notebook",
        href: "https://colab.research.google.com/drive/134nTMQxyBCrZ0LQh8CdX7qjK0NghMNUZ?usp=sharing",
      },
    ],
  },

  {
    id: "smart-flood-ai",
    title: "Smart Flood AI",
    category: "Computer Vision",
    year: "2026",
    context: "DOH Hackathon 2026 · Team of 3 · Web & AI dev",
    desc: "Real-time flood monitoring command center for the Department of Highways hackathon. Zero-shot Grounding DINO finds cars and wheels in CCTV footage to estimate water depth, feeding a Next.js dashboard with flood-aware routing and LINE OA alerts.",
    problem: "Estimate flood depth from Department of Highways CCTV in real time.",
    approach: "Zero-shot Grounding DINO finds cars and wheels in the footage to estimate water depth, feeding a Next.js command center with flood-aware routing and LINE OA alerts.",
    marks: ["estimate water depth"],
    // "ไม่ต้องมีข้อมูล label" และการคิดจากล้อที่จมน้ำ มาจาก README ของ DOH_Hackathon
    cvBullets: [
      "Zero-shot Grounding DINO finds cars and wheels in highway CCTV to estimate water depth from how far the wheels are submerged, with no labeled training data.",
      "Fed a FastAPI + Next.js command center with flood-aware routing and LINE OA alerts.",
    ],
    cvMarks: ["estimate water depth"],
    tags: ["Python", "PyTorch", "OpenCV", "Grounding DINO", "FastAPI", "Next.js", "Firebase", "Computer Vision"],
    links: [{ kind: "code", href: "https://github.com/Panupong-xD/DOH_Hackathon" }],
  },
  {
    id: "swu-run-checker",
    title: "SWU Run Together 2026",
    category: "Web App",
    year: "2026",
    context: "SWU Athletics Club · Team of 2 · Developer",
    desc: "Registration and order-status checker for a university running event. Runners search by phone number to get a digital BIB with their package, shirt size, and payment status, read live from Google Form responses.",
    problem: "Runners needed to check their registration and order status for a university running event.",
    approach: "A React app that searches by phone number and reads live Google Form responses.",
    result: "About 300 runners used it to get a digital BIB with their package, shirt size and payment status.",
    marks: ["About 300 runners"],
    tags: ["React", "JavaScript", "Vite", "Google Sheets"],
    links: [{ kind: "code", href: "https://github.com/Panupong-xD/SwuRun_Register" }],
  },

  {
    id: "brainfit",
    title: "BrainFit",
    category: "Mobile App",
    year: "2025",
    context: "Client project · Team of 5",
    desc: "Brain-training app commissioned by nursing students to support people with brain-related conditions such as Alzheimer's. Runs on iOS and Android with memory and logic mini-games, using Google Sheets as a lightweight backend to track each player's progress.",
    problem: "Nursing students commissioned an app to support people with brain-related conditions such as Alzheimer's.",
    approach: "Cross-platform React Native (Expo) app for iOS and Android with memory and logic mini-games, using Google Sheets as a lightweight backend to track each player's progress.",
    marks: ["Nursing students commissioned an app"],
    tags: ["React Native", "Expo", "JavaScript", "Google Sheets"],
    links: [{ kind: "code", href: "https://github.com/KhaNomThai/BrainFit" }],
  },
  {
    id: "employment-gap-analysis",
    title: "Employment Data Gap Analysis",
    category: "Data Analysis",
    year: "2025",
    context: "Research project",
    desc: "Compares the skills Computer Engineering students think matter for getting hired with what actually predicts job placement: a Random Forest on 100,000 placement records against a survey of 80 CPE students.",
    // ตัวเลขจาก Colab notebook ของเจ้าของ: Random Forest บนข้อมูล Kaggle 100,000 แถว เทียบกับแบบสอบถามนิสิต CPE 80 คน
    // สัดส่วนนิสิต = คะแนนเฉลี่ยแต่ละหมวด / ผลรวม (3.56, 3.96, 3.39 จาก 5) ส่วนของโมเดล = feature importance รวมตามหมวด
    problem: "Do Computer Engineering students value the same skills that predict job placement?",
    approach: "Trained a Random Forest on 100,000 student-placement records, grouped its feature importance into technical, soft-skill and experience factors, and compared them with a survey of 80 CPE students.",
    result: "Students weighted internships and portfolio above the model (31% vs 24%) and technical skills below it (33% vs 39%).",
    marks: ["31% vs 24%"],
    cvBullets: [
      "Random Forest on 100,000 placement records vs a survey of 80 CPE students: students weighted internships and portfolio above the model (31% vs 24%) and technical skills below it (33% vs 39%).",
    ],
    cvMarks: ["31% vs 24%"],
    tags: ["Python", "scikit-learn", "Pandas", "Matplotlib", "Seaborn", "Machine Learning", "Data Analysis"],
    links: [
      {
        kind: "notebook",
        href: "https://colab.research.google.com/drive/1ujTiV7eldCGr3nbqe19WRiARRDcbeWFs?usp=sharing",
      },
    ],
  },
  {
    id: "prim-visualizer",
    title: "Prim's Algorithm Visualizer",
    category: "Algorithms",
    year: "2024",
    context: "CPE101 course project",
    desc: "Interactive tool that builds a Minimum Spanning Tree step by step — add or remove nodes and edges, then watch edge selection and the total cost update in real time.",
    problem: "Make Minimum Spanning Tree construction easy to follow.",
    approach: "Interactive D3.js tool: add or remove nodes and edges, then watch edge selection step by step while the total cost updates in real time.",
    marks: ["updates in real time"],
    tags: ["JavaScript", "D3.js", "HTML", "CSS"],
    links: [
      { kind: "demo", href: "https://khanomthai.github.io/project-cpe101/" },
      { kind: "code", href: "https://github.com/KhaNomThai/project-cpe101" },
    ],
  },
  {
    id: "portfolio",
    title: "This Portfolio",
    category: "Web App",
    year: "2026",
    desc: "The site you're on. One typed data file drives both the website and the PDF CV; built with React 19, Tailwind CSS v4, and Framer Motion, with keyboard and reduced-motion support.",
    problem: "Keep the website and the PDF CV in sync.",
    approach: "One typed data file drives both; React 19, Tailwind CSS v4 and Framer Motion, with keyboard and reduced-motion support.",
    marks: ["keyboard and reduced-motion support"],
    tags: ["React", "TypeScript", "Tailwind CSS", "Framer Motion"],
    links: [{ kind: "code", href: repoUrl }],
  },
];

/** ตัวเลข/จุดเด่นใต้ชื่อใน Hero — อ่านจบได้ในไม่กี่วินาที */
export const highlights: Highlight[] = [
  { value: "Data Science Intern", label: "Botnoi Group · 2026", mark: true },
  { value: "Student Leader", label: "SWU Computer Engineering" },
  { value: "KBTG Top 30", label: "Hackathon 2026 · Cash-flow app", countUp: false },
  { value: "NTT DATA Top 24", label: "Innovation Challenge 2026 · Health app", countUp: false },
];

/** งานสายเทค — เรียงล่าสุดก่อน. `id` ต้องไม่ซ้ำ (ใช้เป็น React key) */
export const work: TimelineItem[] = [
  {
    id: "botnoi-data-science-intern",
    title: "Data Science Intern",
    org: "Botnoi Group",
    // TODO: ใส่ตัวเลขจริงใน bullet ถ้าเปิดเผยได้: ขนาด dataset, metric ก่อน/หลัง, จำนวนโมเดล
    period: "May – Jul 2026",
    bullets: [
      "Developed, trained, and evaluated machine learning models for real-world business use cases.",
      "Cleaned and preprocessed complex datasets and engineered features that improved model accuracy.",
      "Worked with engineering and product teams to deliver AI-powered solutions and data-driven insights.",
      "Applied best practices in data-pipeline design and model-deployment workflows.",
    ],
    marks: ["improved model accuracy"],
    // ลักษณะงานจากเจ้าของ (11 พ.ย. 2026): ระบบทำนายสินค้าให้ลูกค้า SME + MLOps + dashboard ให้บริษัทลูกค้า
    // ไม่มีตัวเลขเพราะเจ้าของเลือกไม่เปิดเผย จึงไม่ไฮไลต์
    cvBullets: [
      "Built product demand forecasting for SME clients: data cleaning, feature engineering, model training and evaluation.",
      "Set up the MLOps pipeline to train and deploy the models, and built dashboards for the client companies.",
    ],
  },
];

/** กิจกรรม/ภาวะผู้นำ — แยกจาก `work` เพื่อให้ประสบการณ์ฝึกงานเด่นที่สุด */
export const leadership: TimelineItem[] = [
  {
    id: "cpe-student-leader",
    title: "Computer Engineering Student Leader",
    org: "Dept. of Computer Engineering, SWU",
    period: "2024 – Present",
    bullets: [
      "Represent Computer Engineering students at faculty meetings and university events as the main link between students and faculty.",
      "Plan and run workshops, meetings, and student-development programs for the department.",
      "Coordinate academic affairs and student activities to build a stronger department community.",
    ],
    marks: ["main link between students and faculty"],
    cvBullets: ["Represent CPE students at faculty meetings; plan and run workshops and student-development programs."],
  },
  {
    id: "robotics-teaching-assistant",
    title: "Robotics Teaching Assistant",
    org: "Srinakharinwirot University",
    period: "2026",
    bullets: [
      "Taught robotics and programming fundamentals to high-school students in hands-on sessions.",
      "Prepared and maintained the robotics equipment and ran live robot-programming demos.",
      "Guided students through club activities to build their problem-solving skills.",
    ],
    marks: ["high-school students"],
    cvBullets: ["Taught robotics and programming fundamentals to high-school students in hands-on sessions."],
  },
  {
    id: "metaverse-presentation-assistant",
    title: "Metaverse Presentation Assistant",
    org: "Srinakharinwirot University",
    period: "2025",
    bullets: [
      "Assisted with a lecture on Metaverse technology, explaining how VR, AR, and AI work together in virtual worlds.",
      "Built interactive slides and live demos to keep the audience engaged.",
    ],
    marks: ["VR, AR, and AI"],
  },
];

export const certifications: Certification[] = [
  {
    id: "google-cloud-genai",
    title: "Google Cloud, Big Data & GenAI Training",
    issuer: "Google Cloud",
    year: "2026",
    desc: "Certified training in Google Cloud Platform fundamentals, Big Data, and Generative AI, with hands-on labs in cloud data processing, storage, and ML services.",
    href: "https://drive.google.com/file/d/1lZSTtlFne0eLOZO3ySYJjWAaIgnuOq2z/view?usp=sharing",
  },
];

export const education: EducationItem[] = [
  {
    id: "swu-cpe",
    degree: "Bachelor of Engineering in Computer Engineering",
    school: "Srinakharinwirot University (SWU)",
    period: "2024 – Present",
    // TODO: เพิ่ม GPA ถ้าอยากโชว์
    graduation: "Expected 2027",
    coursework: [
      "Software Development",
      "Database Systems",
      "Artificial Intelligence",
      "Healthcare AI Systems",
      "Computer Architecture",
      "Electronics",
    ],
    cvCoursework: ["Artificial Intelligence", "Healthcare AI Systems", "Database Systems", "Software Development"],
  },
];
