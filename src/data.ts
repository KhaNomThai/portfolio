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
  /** ลิงก์แรก = ลิงก์หลักของ CV และลิงก์แรกในหน้า explore จึงต้องมีอย่างน้อยหนึ่งลิงก์ */
  links: [ProjectLink, ...ProjectLink[]];
  /**
   * เนื้อหาเพิ่มของหน้า explore (/projects/<id>) ที่การ์ดไม่มีที่พอ: ทุกข้อต้องมีที่มาใน README/docs ของ repo หรือ notebook
   * ไม่ใส่ = หน้า explore แสดงแค่ข้อมูลเดียวกับการ์ด (รูปใหญ่ ลิงก์ทั้งหมด) CV ไม่อ่าน field นี้
   */
  explore?: {
    /** งานนี้คืออะไร ใครใช้ (ไม่ซ้ำ problem/approach ที่หน้าแสดงอยู่แล้ว) */
    overview: string;
    /** งานทีมเท่านั้น: สิ่งที่ทำเอง ห้ามเกินที่ desc/context/cvBullets บอก เพราะ README เล่างานของทั้งทีม */
    role?: string;
    features?: string[];
    /** เรียงตามลำดับที่ข้อมูลไหลจริง หน้าแสดงเป็นรายการมีเลข */
    howItWorks?: string[];
    /** ทางเลือกทางเทคนิคพร้อมเหตุผล ใส่เฉพาะที่แหล่งที่มาบอกเหตุผลไว้ */
    decisions?: string[];
  };
} & CvFields;
/**
 * field ที่ CV PDF ใช้อย่างเดียว เว็บไม่อ่าน: เขียนวิธีทำและผลลัพธ์ละเอียดกว่าการ์ดบนเว็บได้
 * ไม่ใส่ = CV ใช้ข้อความเดียวกับเว็บ (`desc` หรือ `bullets`) และไม่ไฮไลต์อะไร
 */
type CvFields = {
  cvBullets?: string[];
  /** วลีใน cvBullets (หรือ desc/bullets) ที่ CV ไฮไลต์: ผลลัพธ์ 1 จุดต่อรายการ ต้องพิมพ์ให้ตรงทุกตัวอักษร (check:data ตรวจ) */
  cvMarks?: string[];
  /** ป้ายหมวดหน้าชื่อโปรเจกต์ใน CV เช่น "AI · Web" ต้องเป็นข้อความ ATS จึงอ่านได้ */
  cvTrack?: string;
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
export type Certification = {
  id: string;
  title: string;
  issuer: string;
  year: string;
  desc: string;
  href?: string;
  /** ไม่ใส่ = certification */
  kind?: "scholarship";
};
export type EducationItem = {
  id: string;
  degree: string;
  school: string;
  period: string;
  graduation?: string;
  coursework: string[];
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
  availability: "Open to Data, AI/ML & full-stack internships",
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
  /** บรรทัดใต้ชื่อใน CV: เป็นรายการสาย ATS จึงได้ keyword ครบ ไม่ใช้ role/focus เพราะสองค่านั้นอยู่ในรูป OG ด้วย */
  cvHeadline: "Machine Learning · Full-Stack Web & Mobile · Computer Engineering, SWU",
  /** CV ไม่ใช้สรรพนาม "I" ตามธรรมเนียมเรซูเม่ ทุกข้อเท็จจริงต้องมีที่มาใน projects/work/leadership ด้านล่าง */
  cvSummary:
    "Computer Engineering student at SWU (expected 2028) who builds AI systems end to end, from the model to the app people use. Data Science Intern at Botnoi Group (2026), building demand forecasting and MLOps for SME clients. Shipped a skin-cancer classifier that runs in the browser, a Bedrock agent on serverless AWS, and a React app about 300 runners used; top 30 at KBTG Hackathon and top 24 at NTT DATA Challenge 2026. Department student leader who has taught robotics to high-school students. Seeking an internship in AI / ML, Data Science or Full-Stack Development.",
};

/** บรรทัด Key results ใต้ชื่อใน CV: หลักฐานที่ recruiter ควรเห็นในไม่กี่วินาที ทุกค่าต้องมีที่มาใน projects ด้านล่าง */
export const cvKeyResults: CvKeyResult[] = [
  { value: "Data Science Intern", label: "Botnoi Group, 2026" },
  { value: "Student Leader", label: "Dept. of Computer Engineering, SWU, 2024 – Present" },
  { value: "Top 30", label: "KBTG Hackathon 2026" },
  { value: "Top 24", label: "NTT DATA Innovation Challenge 2026" },
  { value: "~300 users", label: "SWU Run web app, 2026" },
];

/** หัวข้อ Honors ใน CV 2 หน้า (certifications ต่อท้ายให้เอง): ผลงานแข่งที่มีหลักฐานใน projects เท่านั้น */
export const cvHonors = [
  "Top 30, KBTG Hackathon 2026 (KaTang Cash-flow Co-pilot)",
  "Top 24, NTT DATA Digital Innovation Challenge 2026 (WELLYNC)",
];

/**
 * Skills ใน CV แยกจาก skillGroups: บนเว็บตัวเลขข้าง skill คือจำนวนโปรเจกต์ที่ใช้ จึงเพิ่มชื่อลงไปเฉย ๆ ไม่ได้
 * ใส่เฉพาะเครื่องมือที่มีใน tags หรือ bullets ของโปรเจกต์/งานจริง
 */
export const cvSkills: CvSkillGroup[] = [
  {
    title: "AI / ML",
    items: ["PyTorch", "scikit-learn", "XGBoost", "OpenCV", "Grounding DINO", "ONNX Runtime", "Amazon Bedrock (LLM agents)"],
  },
  {
    title: "Methods",
    items: ["Demand forecasting", "transfer learning", "time-based validation", "threshold tuning", "Monte Carlo simulation", "MLOps"],
  },
  { title: "Data", items: ["Python", "Pandas", "Matplotlib", "Seaborn", "Google Colab"] },
  { title: "Web", items: ["React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "D3.js", "HTML/CSS", "Vite"] },
  { title: "Mobile", items: ["React Native", "Expo"] },
  {
    title: "Backend & cloud",
    items: ["FastAPI", "AWS (Lambda, API Gateway, DynamoDB, Cognito)", "Firebase", "Google Apps Script", "Google Cloud"],
  },
  { title: "Tools", items: ["Git", "GitHub Actions", "Vercel"] },
  // ระดับจากเจ้าของ (12 พ.ย. 2026): อ่านเขียนได้ พูดได้บ้าง เจ้าของเลือกเขียนว่า intermediate
  { title: "Languages", items: ["Thai (native)", "English (intermediate)"] },
];

export const githubUrl = `https://github.com/${profile.github}`;
export const linkedinUrl = `https://www.linkedin.com/in/${profile.linkedin}`;
export const repoUrl = `${githubUrl}/portfolio`;

/** บรรทัดนำใต้หัว section (ใช้แค่บนเว็บ) — section ที่ไม่มีในนี้แสดงแค่หัวข้อ */
export const sectionIntros = {
  projects: "Deep learning, computer vision, and full-stack work — from course projects to hackathons and real events.",
  skills: "The number is how many of my projects use a skill. Select it to see those projects.",
  contact: "I'm open to Data Science, AI/ML engineering and full-stack internship opportunities. Email is the fastest way to reach me.",
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
      { name: "AWS" },
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
    cvTrack: "AI",
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
    // explore: จาก README/docs ของ repo (โปรเจกต์ notebook: จาก Colab ของเจ้าของ) ร่างแล้วตรวจทีละข้อกับแหล่งที่มา
    explore: {
      overview: "KaTang is a non-official banking-app concept for first jobbers whose income comes from freelance work or side gigs. Its browser-only Next.js demo runs on fixture numbers with no AI API, banking API or database, and no money moves. A separate Python prototype runs the ML forecast and Monte Carlo on simulated data only.",
      role: "Built the gradient-boosting spending forecast and Monte Carlo prototype behind the safe daily spending limit, on simulated data (data science role in a team of 3).",
      features: [
        "The phone home has two swipe cards: a financial overview and a save-first card that offers part of today's limit to a chosen Pocket.",
        "Choosing not to save moves no money, keeps the full limit spendable, and can be changed later the same day.",
        "An Account Summary explains where today's limit comes from and shows a 30-day timeline, including a buffer for late wages.",
        "A Customize screen lets users correct the income day, mark extra income as certain or maybe, confirm guessed bills, and preview the new limit.",
        "Pending income is never counted as cash, and in the demo a bill the system guessed counts only after the user confirms it.",
      ],
      howItWorks: [
        "Simulated transactions cover salaried, freelance and side-gig users; recurring bills are three or more similar payments to one payee about a month apart.",
        "A HistGradientBoostingRegressor predicts daily spending relative to the user's normal level from calendar, days-since-income and balance features; residuals set daily uncertainty.",
        "An income-timing model learns how late each payer usually pays, blended with a bank-wide average that new payers use until they have history.",
        "Monte Carlo simulates 4,000 thirty-day cash-flow paths and finds, for each path, the highest daily budget that never goes negative.",
        "The shown budget is capped at the forecast normal spending, so it drops only when money is at risk and any gap becomes a saving offer.",
      ],
      decisions: [
        "The budget is capped at forecast normal spending because without the cap the system recommended far more than usual, using up lump-sum income due within 30 days.",
        "The web demo uses a simple fixture formula instead of the trained models to explain where the limit comes from and how edits change it.",
        "After a save or plan edit the demo shows that risk needs reassessment, so the old percentage never looks like a fresh calculation.",
      ],
    },
    tags: ["Python", "scikit-learn", "Pandas", "Machine Learning", "Next.js", "TypeScript"],
    links: [
      { kind: "demo", href: "https://kkatang.vercel.app/" },
      { kind: "code", href: "https://github.com/Panupong-xD/KBTG-Hackathon" },
      { kind: "certificate", href: "https://drive.google.com/file/d/1TmOFbQuYGkrZFqnZjb5NZK9-2_aOqLwY/view?usp=sharing" },
    ],
  },  {
    id: "wellync",
    cvTrack: "AI · Web",
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
      "Built the Next.js web app where patients, caregivers and doctors share one consent-checked record.",
    ],
    cvMarks: ["reached the top 24 teams"],
    // explore: จาก README/docs ของ repo (โปรเจกต์ notebook: จาก Colab ของเจ้าของ) ร่างแล้วตรวจทีละข้อกับแหล่งที่มา
    explore: {
      overview: "WELLYNC is a chronic-care prototype from the NTT DATA Digital Innovation Challenge 2026 where patients, caregivers and doctors work on the same follow-up cases. Its AWS mode uses Cognito, API Gateway, Lambda, DynamoDB and private S3, and the Amazon Bedrock AI features are optional and off by default. It is a competition prototype, not a system for clinical decisions.",
      role: "Web & LLM dev in a team of 3: built the web app and a Bedrock agent that picks role-scoped tools to answer questions and draft care plans for doctors to review.",
      features: [
        "Patients can analyze a meal photo or a menu name, then check the name and portion before the meal is saved to their history.",
        "Caregivers add notes to a follow-up case and can forward it to the patient's doctor only after the patient has given consent.",
        "Doctors review the evidence and publish care plans themselves, and published plans feed into later context reads and patient and caregiver pages.",
        "Chat answers and doctor drafts show the data sources sent to the model and the tools the agent actually used.",
        "A demo mode runs on synthetic data in the browser, without AWS or AI, for trying out the UI.",
      ],
      howItWorks: [
        "Users sign in through Cognito with email OTP and PKCE, and API Gateway sends requests that need a JWT to the backend Lambda.",
        "For each agent request, the backend checks identity, role, patient assignment and consent, then picks recent context such as reviewed plans, preferences and summaries.",
        "A Bedrock model chooses from role-specific read and draft tools, with at most two model calls and three tool runs per chat request.",
        "Draft tools only fill a confirmation card, and the record is saved only after a person confirms through a separate role-scoped API.",
        "Meals, daily summaries, follow-up cases and quotas are stored in DynamoDB, and meal photos are sent to Nova Lite in a single image-analysis call.",
      ],
      decisions: [
        "Uses only native Bedrock foundation models with no Marketplace subscriptions or external model APIs, because the competition rules required native AWS services.",
        "Kept the stack serverless and on-demand with a bounded agent and no GPU, EC2, RDS or vector store, to fit the competition budget.",
        "Uses S3 and DynamoDB managed encryption instead of customer-managed KMS keys to reduce cost and key management in the prototype.",
      ],
    },
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "AWS", "Amazon Bedrock", "Generative AI"],
    links: [
      { kind: "demo", href: "https://ntt-data-zeta.vercel.app" },
      { kind: "code", href: "https://github.com/Panupong-xD/NTT-Data" },
    ],
  },  {
    id: "skin-cancer-screening",
    cvTrack: "AI · Web",
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
    // explore: จาก README/docs ของ repo (โปรเจกต์ notebook: จาก Colab ของเจ้าของ) ร่างแล้วตรวจทีละข้อกับแหล่งที่มา
    explore: {
      overview: "Derma AI classifies dermatoscopic skin-lesion images into 8 disease classes and gives a two-level result: cancer or pre-cancer versus benign, then a sub-type breakdown. It was built for the CPE310 Healthcare AI course as an academic decision-support tool for preliminary screening, not a substitute for a dermatologist's diagnosis.",
      features: [
        "Two-level output: a high or low cancer-risk decision from grouped class probabilities, plus a probability breakdown across the 8 sub-types.",
        "Reports exact top-1 accuracy plus top-2 and top-3 differential accuracy, the way dermatology triage reads a shortlist.",
        "The Clinical Screening tab accepts an upload or one of 8 held-out test samples and shows the top diagnosis in English and Thai.",
        "Users can switch between the three trained models live, each shown with its top-1 accuracy and download size.",
        "The Model Performance tab compares the models with summary cards, a metric table, per-class F1 bars and confusion matrices.",
      ],
      howItWorks: [
        "Images are split by lesion_id with StratifiedGroupKFold into about 71% training, 14% validation and 14% test.",
        "Each ImageNet-pretrained backbone gets a new head (Linear 512, ReLU, BatchNorm, Dropout 0.3, Linear 8) and only its later blocks are fine-tuned.",
        "Training uses class-weighted cross-entropy with AdamW, halves the learning rate when validation F1 plateaus, and stops early when it no longer improves.",
        "Cancer probability sums MEL, BCC, SCC and AK; each model's cutoff is the highest validation threshold still flagging at least 90% of cancers, capped at 0.50.",
        "export_onnx.py converts each checkpoint to ONNX and checks its outputs against PyTorch on sample images before the React app uses it.",
      ],
      decisions: [
        "Split by lesion instead of by image so the model is never tested on a lesion it saw in training, which gives stricter, lower scores.",
        "Run the models in the browser with ONNX Runtime Web so the app is plain static files with no Python server.",
        "Train the unfrozen backbone layers at a tenth of the head's learning rate so the pretrained weights are not wrecked early in training.",
      ],
    },
    tags: ["Python", "PyTorch", "scikit-learn", "Pandas", "Deep Learning", "Computer Vision", "ONNX Runtime", "React"],
    links: [
      { kind: "demo", href: "https://kulachart2014-derma-ai.static.hf.space/index.html" },
      { kind: "code", href: "https://github.com/KhaNomThai/Healthcare-AI-System" },
    ],
  },
  {
    id: "peak-electricity-alert",
    cvTrack: "Data",
    title: "Peak Electricity Day Alert",
    category: "Machine Learning",
    year: "2026",
    context: "CPE312 Data Science capstone",
    desc: "Predicts a week ahead which days will hit peak electricity demand, so grid maintenance can avoid them. XGBoost on 2015–2020 Panama load and weather data with leakage-safe features and a time-based split: 84% recall on peak days vs 73% for a baseline.",
    // ตัวเลขจาก Colab notebook ของเจ้าของ: test ปี 2019–2020 (543 วัน, วันพีค 220 วัน) เกณฑ์ = P80 ของ train
    problem: "Grid operators need to know a week ahead which days will hit peak demand, so they can schedule maintenance around them.",
    approach: "Turned 2015–2020 hourly load and weather data from Panama into daily rows with leakage-safe features, split train and test by time, and compared Logistic Regression and XGBoost with a same-day-last-week baseline.",
    result: "XGBoost catches 84% of peak days against 73% for the baseline, with higher precision (78% vs 73%).",
    marks: ["84% of peak days"],
    cvBullets: [
      "Forecast a week ahead which days hit peak demand from 2015–2020 Panama load and weather data, with leakage-safe daily features and a time-based train/test split.",
      "XGBoost reached 84% recall on peak days vs 73% for a same-day-last-week baseline, at higher precision (78% vs 73%); also compared Logistic Regression.",
    ],
    cvMarks: ["84% recall on peak days vs 73%"],
    // explore: จาก README/docs ของ repo (โปรเจกต์ notebook: จาก Colab ของเจ้าของ) ร่างแล้วตรวจทีละข้อกับแหล่งที่มา
    explore: {
      overview: "A CPE312 Data Science capstone notebook that warns grid managers a week ahead which days will hit peak electricity demand. It is built on public hourly load and weather data from Panama and checks every feature so the model only sees data available at prediction time. The notebook also covers EDA, error analysis, alert-threshold tuning and a test of AI-suggested shortcuts that leak future data.",
      features: [
        "Forecasts run every Sunday at 18:00 for Monday through Sunday of the next week, using only data that exists at that time.",
        "A day is labelled a peak day when its highest hourly load exceeds the 80th percentile of daily peaks in the training years.",
        "Error analysis of XGBoost found nearly half of missed peaks and false alarms fall within 3% of the threshold.",
        "A trade-off table shows missed peaks, false alarms and share of alert days for probability cutoffs from 0.15 to 0.6.",
        "An AI-usage check tests a random split and an unshifted 3-day rolling mean; only the rolling mean inflated recall and precision.",
      ],
      howItWorks: [
        "Hourly national load and Tocumen weather readings for 2015–2020 are shifted back one hour and rolled up into one row per day, with asserts for complete days.",
        "Each day gets target-date calendar features, a same-weekday load lag, and 7- and 28-day load plus 7-day weather summaries ending the Saturday before the forecast.",
        "Years 2015–2018 form the training set and 2019–2020 the test set, and the peak threshold is computed from the training set only.",
        "Class-weighted Logistic Regression and XGBoost are compared with a same-day-last-week baseline and simple rules such as alerting on every workday.",
        "The alert cutoff is tuned on 2018 as a validation year, picking the highest cutoff that keeps XGBoost recall at 0.90 or above.",
      ],
      decisions: [
        "Recall on peak days is the main metric, because a missed peak could put maintenance on the wrong day, causing outages or costly backup generation.",
        "Features stop at Saturday, because at Sunday 18:00 the day is not over and many daily peaks happen between 19:00 and 21:00.",
        "Accuracy is not used, because predicting no peak every day still scores almost 60% accuracy while catching no peak days.",
      ],
    },
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
    cvTrack: "AI · Web",
    title: "Smart Flood AI",
    category: "Computer Vision",
    year: "2026",
    context: "DOH Hackathon 2026 · Team of 3 · Web & AI dev",
    desc: "Real-time flood monitoring command center for the Department of Highways hackathon. I built the zero-shot Grounding DINO pipeline that finds cars and wheels in CCTV footage to estimate water depth, and the Next.js dashboard that shows it alongside the team's flood-aware routing and LINE OA alerts.",
    problem: "Estimate flood depth from Department of Highways CCTV in real time.",
    approach: "Built a zero-shot Grounding DINO pipeline that finds cars and wheels in the footage and logic to estimate water depth from how far the wheels are submerged, then the Next.js command-center dashboard on the team's FastAPI backend.",
    marks: ["estimate water depth"],
    // "ไม่ต้องมีข้อมูล label" และการคิดจากล้อที่จมน้ำ มาจาก README ของ DOH_Hackathon
    // ส่วนที่ทำเอง (pipeline, logic ความลึก, dashboard) เจ้าของยืนยันแล้ว ส่วน routing กับ LINE OA เป็นของทีม
    cvBullets: [
      "Built the zero-shot Grounding DINO pipeline that finds cars and wheels in highway CCTV, and the logic to estimate water depth from how far the wheels are submerged, with no labeled training data.",
      "Built the Next.js command-center dashboard on the team's FastAPI backend, with flood-aware routing and LINE OA alerts.",
    ],
    cvMarks: ["estimate water depth"],
    // explore: จาก README/docs ของ repo (โปรเจกต์ notebook: จาก Colab ของเจ้าของ) ร่างแล้วตรวจทีละข้อกับแหล่งที่มา
    explore: {
      overview: "Smart Flood AI is a flood monitoring system and command center built for the DOH Hackathon 2026. It estimates water depth from highway CCTV with a zero-shot Grounding DINO model and shows each camera on a live map. Officers confirm alerts before they go out on LINE OA.",
      role: "Built the zero-shot Grounding DINO pipeline that finds cars and wheels in CCTV footage, the logic that estimates water depth from submerged wheels, and the Next.js command-center dashboard on the team's FastAPI backend.",
      features: [
        "A Google Maps view shows each CCTV location with a green, yellow or red status pin.",
        "Officers review each AI detection and confirm or reject it before broadcasting, to reduce false alarms.",
        "A confirmed flood draws a 5 km red zone on the map, and the routing feature calculates detours around it.",
        "LINE alerts go out as Flex Message carousels with the annotated site capture, water level and a link to the dashboard.",
        "Firebase login with two roles: admins confirm, resolve and broadcast, while guests get read-only feeds, flood zones and routing.",
      ],
      howItWorks: [
        "A FastAPI server runs two threads per camera: one encodes JPEG preview frames for an MJPEG stream, the other runs Grounding DINO on a frame at intervals.",
        "The model is prompted with \"wheel. car. water.\", and each wheel is matched to the car box that contains its center.",
        "Wheels sitting high on the car body are skipped as far-side wheels; depth is each wheel's hidden share times a 60 cm wheel reference.",
        "Depth counts only when water is detected in the frame; 10 cm sets a warning status and 30 cm a critical alert.",
        "Confirm requests pass through a Next.js API route that checks the Firebase token and admin role, and Firestore syncs confirmed floods to every client.",
      ],
      decisions: [
        "Video reading and AI inference run in separate threads per camera so the live preview stays smooth while the model runs.",
        "Alert images stay in memory and are written to disk only when an admin confirms, not on every frame.",
        "Depth is forced to zero when no water is detected, and the submerged-ratio cutoff was raised to 15%, to cut false positives from imprecise boxes.",
      ],
    },
    tags: ["Python", "PyTorch", "OpenCV", "Grounding DINO", "FastAPI", "Next.js", "Firebase", "Computer Vision"],
    links: [{ kind: "code", href: "https://github.com/Panupong-xD/DOH_Hackathon" }],
  },
  {
    id: "swu-run-checker",
    cvTrack: "Web",
    title: "SWU Run Together 2026",
    category: "Web App",
    year: "2026",
    context: "SWU Athletics Club · Team of 2 · Developer",
    desc: "Registration and order-status checker for a university running event. Runners search by phone number to get a digital BIB with their package, shirt size, and payment status, read live from Google Form responses.",
    problem: "Runners needed to check their registration and order status for a university running event.",
    approach: "A React app that searches by phone number and reads live Google Form responses.",
    result: "About 300 runners used it to get a digital BIB with their package, shirt size and payment status.",
    marks: ["About 300 runners"],
    cvBullets: [
      "Built the React web app and its live Google Sheets connection for a university running event: runners search by phone number to get a digital BIB with package, shirt size and payment status; used by about 300 runners.",
    ],
    cvMarks: ["used by about 300 runners"],
    // explore: จาก README/docs ของ repo (โปรเจกต์ notebook: จาก Colab ของเจ้าของ) ร่างแล้วตรวจทีละข้อกับแหล่งที่มา
    explore: {
      overview: "SWU Run Together 2026 is a web app for the Srinakharinwirot University Athletics Club running event that lets runners check their shirt order, registration and payment status. It is a React 19 and Vite front end that reads Google Form responses directly from Google Sheets.",
      role: "Developer on a team of two.",
      features: [
        "Every search fetches the response sheet again, so admin edits and new form submissions appear without reloading the page.",
        "Phone input is normalized, so formats like 081-234-5678, 081 234 5678 or +66 numbers find the same runner.",
        "The result card shows the form fields, including package, shirt size, receiving option, order time and a link to the payment slip.",
        "Payment status is shown as a badge styled separately for paid, cancelled and pending orders.",
        "A call-to-action button links to the official Google Form for ordering shirts or registering.",
      ],
      howItWorks: [
        "Runners register through a Google Form, and its response sheet is published to the web as CSV.",
        "The CSV URL comes from a Vite environment variable, and bundled demo data is used when none is set.",
        "On search, the app downloads the CSV and parses it with a custom CSV parser.",
        "The parser maps English or Thai column headers onto one runner record, defaulting payment status to pending review.",
        "The app compares the normalized phone number with each row and shows the order details or a not-found message.",
      ],
      decisions: [
        "Each request adds a timestamp parameter and no-store cache headers to force a fresh fetch instead of a cached copy of the sheet.",
      ],
    },
    tags: ["React", "JavaScript", "Vite", "Google Sheets"],
    links: [{ kind: "code", href: "https://github.com/Panupong-xD/SwuRun_Register" }],
  },

  {
    id: "brainfit",
    cvTrack: "Mobile",
    title: "BrainFit",
    category: "Mobile App",
    year: "2025",
    context: "Client project · Team of 5",
    desc: "Brain-training app commissioned by nursing students to support people with brain-related conditions such as Alzheimer's. Runs on iOS and Android with memory and logic mini-games, using Google Sheets as a lightweight backend to track each player's progress.",
    problem: "Nursing students commissioned an app to support people with brain-related conditions such as Alzheimer's.",
    approach: "Cross-platform React Native (Expo) app for iOS and Android with memory and logic mini-games, using Google Sheets as a lightweight backend to track each player's progress.",
    marks: ["Nursing students commissioned an app"],
    // บทบาทและการส่งมอบจากเจ้าของ (12 พ.ย. 2026): ทำหน้า sign-in ที่เชื่อม backend กับบางหน้าในแอป ส่งมอบแล้ว ลูกค้าใช้ประกอบงานวิจัย ยังไม่ได้ใช้งานจริง
    cvBullets: [
      "Cross-platform React Native (Expo) brain-training app for iOS and Android with memory and logic mini-games, commissioned by nursing students to support people with conditions such as Alzheimer's; delivered to the client for their research.",
      "Built the sign-in flow connected to the Google Sheets backend (via Apps Script) and parts of the app screens.",
    ],
    cvMarks: ["delivered to the client for their research"],
    // explore: จาก README/docs ของ repo (โปรเจกต์ notebook: จาก Colab ของเจ้าของ) ร่างแล้วตรวจทีละข้อกับแหล่งที่มา
    explore: {
      overview: "BrainFit is a React Native (Expo) brain-training app for iOS and Android, built as a client project for nursing students to support people with brain-related conditions such as Alzheimer's. Players sign in, take a 6CIT cognitive test, play mini-games grouped by cognitive skill, and see their activity for the last seven days.",
      features: [
        "Eight mini-games are grouped into Registration, Attention or Calculation, and Recall sections, including word matching, sound recognition, quick math and story recall.",
        "A built-in six-question 6CIT cognitive test scores each answer and saves the result to the backend.",
        "The home screen shows total and today's play counts plus a bar chart of the last seven days.",
        "Reminders for exercise, meals, talking with others and sleep can be switched on in the menu and are scheduled as local notifications at fixed times.",
        "Sign-up and password reset each require a six-digit OTP sent to the user's email.",
      ],
      howItWorks: [
        "On launch, the app checks local storage for a saved token and email, then opens the main tabs or the welcome screen.",
        "A bottom tab bar links four screens: Home, the 6CIT test, the game menu and a settings menu.",
        "Each game times the session and saves the play time, plus a score where the game has one, with a \"savegametime\" request.",
        "Every request goes through one helper that POSTs JSON with an action field to a Google Apps Script web app, with Google Sheets storing the data.",
        "The home screen fetches per-day and total save counts to draw the seven-day activity chart.",
      ],
    },
    tags: ["React Native", "Expo", "JavaScript", "Google Sheets"],
    links: [{ kind: "code", href: "https://github.com/KhaNomThai/BrainFit" }],
  },
  {
    id: "employment-gap-analysis",
    cvTrack: "Data",
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
    // explore: จาก README/docs ของ repo (โปรเจกต์ notebook: จาก Colab ของเจ้าของ) ร่างแล้วตรวจทีละข้อกับแหล่งที่มา
    explore: {
      overview: "A Colab research notebook in two parts: a placement-prediction model and a gap analysis. The model is a Random Forest trained on a Kaggle student-placement dataset. The gap analysis compares the model's feature importance with how surveyed CPE students rated the same kinds of skills.",
      features: [
        "Trains a scikit-learn Random Forest with 100 trees to predict placement status from the dataset's student attributes.",
        "Plots a confusion matrix heatmap and a ranked feature-importance bar chart, saving each as a 300 dpi image.",
        "Maps 14 dataset columns into three groups: technical and academic, soft skills, and experience and portfolio.",
        "Draws a side-by-side bar chart of student perception versus model weight, with a gap label above each skill group.",
        "Counts each student's top-ranked skill in a forced-choice question; internships were picked most often, then projects and GitHub.",
      ],
      howItWorks: [
        "Pandas loads the 100,000-row, 26-column placement CSV and drops the student ID and salary columns.",
        "Text columns are label-encoded and the data is split 80/20 into training and test sets.",
        "The Random Forest is trained, evaluated on the test set, and its feature importances are extracted as percentages.",
        "Importances are summed per skill group and rescaled so the three groups add up to 100%.",
        "Survey ratings (out of 5) are averaged per group, converted to shares of 100%, and the model's share is subtracted to get each gap.",
      ],
      decisions: [
        "Student ID and salary columns are dropped before training, which the notebook notes is to prevent data leakage.",
        "Group importances are rescaled to 100% because the dataset also contains non-skill columns such as age and sleep hours.",
      ],
    },
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
    cvTrack: "Web",
    title: "Prim's Algorithm Visualizer",
    category: "Algorithms",
    year: "2024",
    context: "CPE101 course project",
    desc: "Interactive tool that builds a Minimum Spanning Tree step by step — add or remove nodes and edges, then watch edge selection and the total cost update in real time.",
    problem: "Make Minimum Spanning Tree construction easy to follow.",
    approach: "Interactive D3.js tool: add or remove nodes and edges, then watch edge selection step by step while the total cost updates in real time.",
    marks: ["updates in real time"],
    cvBullets: ["Interactive D3.js tool that builds a Minimum Spanning Tree step by step while the total cost updates in real time."],
    // explore: จาก README/docs ของ repo (โปรเจกต์ notebook: จาก Colab ของเจ้าของ) ร่างแล้วตรวจทีละข้อกับแหล่งที่มา
    explore: {
      overview: "A browser-based learning tool that shows how Prim's algorithm builds a Minimum Spanning Tree on a graph the user creates. It is aimed at computer science and engineering students who find graph algorithms hard to grasp through text alone. The app is a single static page written in HTML, CSS and JavaScript.",
      features: [
        "Generate a chosen number of vertices, placed evenly around a circle in the middle of the canvas.",
        "Add weighted edges by entering two vertex numbers and a distance in meters.",
        "Adding an edge moves the second vertex so the drawn line length matches its weight, at 20 pixels per meter.",
        "Vertices can be dragged with the mouse to rearrange the graph.",
        "An Undo button reverts the last vertex generation or edge addition.",
      ],
      howItWorks: [
        "Before generating vertices or adding an edge, the app pushes a copy of the vertex and edge lists onto a history stack for Undo.",
        "Prim's algorithm starts from vertex 1 and marks it as part of the tree.",
        "Each pass scans every edge for the cheapest one linking a tree vertex to a vertex outside the tree, then adds that vertex.",
        "It repeats until the tree has one fewer edge than there are vertices, adding up the chosen weights.",
        "The tree edges are drawn as thick green lines over the graph, and the total distance is shown in meters.",
      ],
    },
    tags: ["JavaScript", "D3.js", "HTML", "CSS"],
    links: [
      { kind: "demo", href: "https://khanomthai.github.io/project-cpe101/" },
      { kind: "code", href: "https://github.com/KhaNomThai/project-cpe101" },
    ],
  },
  {
    id: "portfolio",
    cvTrack: "Web",
    title: "This Portfolio",
    category: "Web App",
    year: "2026",
    desc: "The site you're on. One typed data file drives both the website and the PDF CV; built with React 19, Tailwind CSS v4, and Framer Motion, with keyboard and reduced-motion support.",
    problem: "Keep the website and the PDF CV in sync.",
    approach: "One typed data file drives both; React 19, Tailwind CSS v4 and Framer Motion, with keyboard and reduced-motion support.",
    marks: ["keyboard and reduced-motion support"],
    cvBullets: [
      "One typed data file drives this website and its PDF CV; React 19 and Tailwind CSS v4, with lint, data and CV-sync checks in CI on every push.",
    ],
    // explore: จาก README/docs ของ repo (โปรเจกต์ notebook: จาก Colab ของเจ้าของ) ร่างแล้วตรวจทีละข้อกับแหล่งที่มา
    explore: {
      overview: "A personal portfolio site that also generates the downloadable two-page PDF CV from the same content. It holds the profile, projects, experience, skills and education.",
      features: [
        "Projects can be filtered by technology, and selecting a skill jumps to the projects that use it.",
        "A ⌘K command palette jumps to any section, copies the email, downloads the CV, or opens GitHub and LinkedIn.",
        "Light and dark themes come from one set of design tokens in a lab-notebook style, with WCAG AA contrast in both.",
        "Accessibility includes semantic landmarks, a skip link, visible focus states and screen-reader hints for links that open a new tab.",
        "Open Graph and Twitter cards use a generated preview image, plus JSON-LD structured data.",
      ],
      howItWorks: [
        "The website and the PDF CV both read src/data.ts; CV-only wording sits in cv* fields that the website ignores.",
        "A Node script renders the CV with headless Chrome and fails if it does not come out at exactly two A4 pages.",
        "The CV build stores a hash of its source HTML, because Chrome embeds a date in the PDF, so CI can check it without Chrome.",
        "Other scripts generate the link-preview image, crop activity photos and capture project demo screenshots.",
        "GitHub Actions runs lint, token and data checks, the CV sync check and the build on every push and pull request; Vercel deploys main.",
      ],
      decisions: [
        "The CV embeds static font files instead of variable ones, because Chrome embeds variable fonts as Type3, which some ATS parsers cannot read.",
        "Tailwind's default colors, sizes, radii and shadows are turned off, and a token check script exists because Tailwind silently ignores unknown classes.",
        "Decorative effects only change properties that don't affect layout, such as transform and opacity, so nothing shifts on the page.",
      ],
    },
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
      // สองข้อท้ายจาก bullets ของเว็บ
      "Engineered features that improved model accuracy on real-world business data.",
      "Worked with engineering and product teams to deliver AI-powered solutions and data-driven insights.",
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
    // ปีจากเจ้าของ (12 พ.ย. 2026): สอน micro:bit และเป็นพิธีกรปี 2025 ผู้เรียนส่วนใหญ่เป็นนักเรียนมัธยมปลาย
    cvBullets: [
      "Represent Computer Engineering students at faculty meetings and university events as the main link between students and faculty.",
      "Plan and run workshops, meetings, and student-development programs for the department.",
      "Taught micro:bit programming to high-school students at a faculty activity and emceed a university event (2025).",
    ],
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

/**
 * กิจกรรมที่มีเฉพาะใน CV (ยังไม่ขึ้นเว็บ) build-cv.ts เลือกด้วย id ใน CV_LEADERSHIP เหมือน leadership
 * ข้อมูลจากเจ้าของ (12 พ.ย. 2026) และโปสเตอร์งานวิจัย: เจ้าของช่วยอาจารย์นำเสนอ ไม่ได้เป็นผู้วิจัย จึงห้ามใส่ผลลัพธ์ของงานวิจัยเป็นผลงานตัวเอง
 */
export const cvLeadership: TimelineItem[] = [
  {
    id: "research-poster-assistant",
    title: "Research Presentation Assistant",
    org: "Dept. of Computer Engineering, SWU",
    // ปีจากเจ้าของ (12 พ.ย. 2026)
    period: "2025",
    bullets: [
      "Helped a faculty member present a research poster at Chulachomklao Royal Military Academy on classifying Acanthamoeba cysts in microscope images with pretrained CNN features and an SVM classifier.",
    ],
  },
];

export const certifications: Certification[] = [
  {
    id: "bki-scholarship",
    title: "Bangkok Insurance Scholarship",
    issuer: "Bangkok Insurance",
    // ปีจากวันที่ถ่ายรูปพิธีมอบทุน (พ.ย. 2025)
    year: "2025",
    desc: "Education scholarship covering my studies through graduation, together with personal accident insurance.",
    kind: "scholarship",
  },
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
    graduation: "Expected 2028",
    coursework: [
      "Software Development",
      "Database Systems",
      "Artificial Intelligence",
      "Healthcare AI Systems",
      "Computer Architecture",
      "Electronics",
    ],
  },
];
