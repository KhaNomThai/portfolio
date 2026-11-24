/**
 * screenshot ของโปรเจกต์: key = id ของ project ใน data.ts ไฟล์อยู่ที่ src/assets/images/projects/<id>/<id>-640.webp และ -1280.webp
 * โปรเจกต์ที่มีลิงก์ demo `npm run shots` จับหน้าแรกให้เอง ส่วนโปรเจกต์ที่ไม่มี demo หรืออยากได้หน้าอื่น วางไฟล์สองขนาดเองแล้วเพิ่ม key ที่นี่ (ใส่ `manual: true`)
 * key ที่มี = case study เต็มแถว ไม่มี key = แถวใน "More projects" ที่ไม่มีรูป (ข้อมูลล้วน ไม่ import asset เหตุผลเดียวกับ experienceMedia.ts)
 */
export type ProjectMedia = {
  /** บรรยายสิ่งที่เห็นใน screenshot จริง */
  alt: string;
  /** ไฟล์วางเอง `npm run shots` ไม่จับทับ: หน้าที่ต้องการอยู่หลังการกดหรือการเลื่อน ซึ่งสคริปต์ทำไม่ได้ */
  manual?: true;
};

/**
 * รูปเพิ่มในหน้า explore: ไฟล์ src/assets/images/projects/<id>/<file>-1280/-640.webp (16:10 ขนาดเดียวกับ screenshot) วางเองเสมอ `npm run shots` ไม่จับ
 * แยกจาก projectMedia เพราะ key ในนั้นทำให้โปรเจกต์กลายเป็น case study บนหน้าแรก ส่วน gallery ขึ้นแค่หน้า explore
 * ต้องเป็นของจริงจาก repo, notebook หรือ demo ของเจ้าของเท่านั้น ห้ามวาดกราฟหรือตัวเลขขึ้นเอง
 * กราฟย่อแบบ contain บนพื้นขาว (ไม่ตัดป้ายแกน) ส่วนภาพเต็มกรอบ (หน้าเว็บ ภาพปก) crop แบบ cover
 */
export type GalleryShot = {
  file: string;
  alt: string;
  caption: string;
  /**
   * รูปใหญ่บนสุดของหน้า explore (หน้าเว็บหรือภาพปกของโปรเจกต์) แทนที่จะอยู่ใน gallery กดแล้วเปิด demo ถ้ามีลิงก์
   * ใช้กับโปรเจกต์ที่ไม่อยู่ใน projectMedia: ได้รูปใหญ่ในหน้า explore โดยหน้าแรกยังเป็นแถวไม่มีรูปเหมือนเดิม
   */
  hero?: true;
  /** หน้าจอมือถือแนวตั้ง: ไฟล์ <file>-800/-400.webp (10:16) ย่อลงกรอบ 16:10 แล้วโทรศัพท์เล็กจนอ่านไม่ออก */
  portrait?: true;
};

/** ขนาดไฟล์ใหญ่ (16:10) ไฟล์เล็กคือครึ่งหนึ่ง */
export const SHOT_SIZE = { width: 1280, height: 800 };

/** ขนาดไฟล์ใหญ่ของรูป portrait (10:16) */
export const PORTRAIT_SIZE = { width: 800, height: 1280 };

export const projectMedia: Record<string, ProjectMedia> = {
  "skin-cancer-screening": {
    alt: "Derma AI web app: a model picker listing ResNet50, EfficientNet-B3 and DenseNet121 beside an upload area for a skin-lesion image",
  },
  katang: {
    alt: "KaTang demo section in Thai: a two-step walkthrough beside a phone mockup showing the balance and today's safe spending amount",
    manual: true,
  },
  wellync: {
    alt: "WELLYNC patient home screen in Thai: a health score of 76 out of 100 above tiles for blood pressure, blood sugar, pulse and BMI",
    manual: true,
  },
};

export const projectGallery: Record<string, GalleryShot[]> = {
  "skin-cancer-screening": [
    {
      file: "skin-cancer-performance",
      alt: "Derma AI Model Performance tab: cards for ResNet50 (71.7% top-1), EfficientNet-B3 (67.6%) and DenseNet121 (68.4%) above a clinical metric comparison table",
      caption: "Model performance: three CNNs compared",
    },
    {
      file: "skin-cancer-result",
      alt: "Derma AI screening result for a dermoscopic image: a level-1 cancer score of 86.4% flagged higher risk, and a top-1 prediction of Melanoma with its description in English and Thai",
      caption: "Two-level screening result",
    },
  ],
  wellync: [
    {
      file: "wellync-doctor",
      alt: "WELLYNC doctor workspace in Thai: a sidebar menu, a care overview banner and counts of patients, follow-ups, care plans and pending suggestions",
      caption: "Doctor workspace",
    },
    {
      file: "wellync-login",
      alt: "WELLYNC sign-in page in Thai under the NTT DATA Health Connect title: role buttons for patient, caregiver and doctor above email and password fields, with sample accounts below",
      caption: "Sign-in with sample accounts",
    },
    {
      file: "wellync-ntt-dic",
      alt: "NTT DATA Digital Innovation Challenge 2026 key visual: the title over a glowing blue and purple burst, with the line Innovate Today, Transform Tomorrow",
      caption: "NTT DATA Digital Innovation Challenge 2026",
    },
  ],
  "peak-electricity-alert": [
    {
      file: "peak-electricity-recall",
      alt: "Bar chart of recall on peak days for the 2019–2020 test set: baseline 0.73, Logistic Regression 0.98 and XGBoost 0.84, with precision 0.73, 0.70 and 0.78",
      caption: "Recall on peak days: baseline vs models",
    },
    {
      file: "peak-electricity-timeline",
      alt: "Line chart of real daily peak load from 2015 to 2020 against the 1,525 MW threshold, marking XGBoost missed peaks and false alarms in the 2019–2020 test period",
      caption: "Real daily peak vs XGBoost alerts",
    },
    {
      file: "peak-electricity-seasonality",
      alt: "Two bar charts of the share of peak days in 2015–2018: highest in April (42%) and May (33%), and on school days (33.2%) with none on weekends",
      caption: "Share of peak days by month and day type",
    },
  ],
  "prim-visualizer": [
    {
      file: "prim-visualizer-home",
      alt: "TangLat web app home: a green header with the logo, inputs to set the number of vertices and add weighted edges, and Calculate MST and Undo buttons",
      caption: "TangLat web app",
      hero: true,
    },
  ],
  "smart-flood-ai": [
    {
      file: "smart-flood-broadcast",
      alt: "Smart Flood Alert cover: a Thai headline about LINE OA broadcast beside a phone showing a flood report flex message with an AI-annotated photo and a water level of 44.0 cm",
      caption: "LINE OA flood broadcast",
      hero: true,
    },
    {
      file: "smart-flood-dashboard",
      alt: "Flood Detection command center in Thai: CCTV status cards on the left and a dark map with a red 5 km avoidance zone and a blue safe route around it",
      caption: "Command center with safe-route map",
    },
    {
      file: "smart-flood-alert",
      alt: "Critical flood alert dialog in Thai showing a 44.0 cm water level at CCTV-01, the AI-detected car, wheel and water, and buttons to reject or confirm",
      caption: "Human-in-the-loop alert confirmation",
    },
    {
      file: "smart-flood-cctv",
      alt: "Full-screen CCTV view of a pickup truck driving through floodwater with Water 44.0 cm overlaid, beside a telemetry panel reading CRITICAL with vehicles and wheels detected",
      caption: "Live CCTV feed with telemetry",
    },
  ],
  "swu-run-checker": [
    {
      file: "swu-run-cover",
      alt: "SWU RUN Order Status Checker cover: the desktop result page and a phone showing the same search, over tags for React 19, Vite, Google Sheets API and Responsive",
      caption: "SWU RUN Order Status Checker",
      hero: true,
    },
    {
      file: "swu-run-desktop-home",
      alt: "SWU RUN order checker home on desktop in Thai: a phone-number search box and a register button over a misty pine forest, with a row of sponsor logos at the bottom",
      caption: "Desktop home",
    },
    {
      file: "swu-run-desktop-result",
      alt: "SWU RUN order details in Thai for a sample runner: payment confirmed, student type, package 3, shirt size L, delivery address and a link to the payment slip",
      caption: "Order details after a search",
    },
    {
      file: "swu-run-mobile-home",
      alt: "SWU RUN order checker on a phone in Thai: the header, register button and phone-number search, with sponsor logos at the bottom",
      caption: "Mobile home",
    },
  ],
  brainfit: [
    {
      file: "brainfit-banner",
      alt: "BrainFit cover in Thai: the logo and a brain-training app description for older adults beside four phone screens showing daily activity, a 6CIT question, the game menu and a math game",
      caption: "BrainFit",
      hero: true,
    },
    {
      file: "brainfit-home",
      portrait: true,
      alt: "BrainFit home screen in Thai: usage statistics with a 7-day bar chart above a daily checklist for exercise, conversation, meals and rest",
      caption: "Home: 7-day stats and health checklist",
    },
    {
      file: "brainfit-6cit",
      portrait: true,
      alt: "BrainFit 6CIT test screen in Thai on question 4 of 6: count backwards from 20 to 1 by tapping numbered bubbles",
      caption: "6CIT screening test",
    },
    {
      file: "brainfit-games",
      portrait: true,
      alt: "BrainFit game menu in Thai listing eight brain games grouped under registration, attention or calculation, and recall",
      caption: "Eight games grouped by cognitive area",
    },
  ],
  "employment-gap-analysis": [
    {
      file: "employment-gap-perception",
      alt: "Grouped bar chart comparing student perception with model weight for technical and academic (32.6% vs 39.0%), soft skills (36.3% vs 37.4%) and experience and portfolio (31.1% vs 23.7%)",
      caption: "Student perception vs model weight",
    },
    {
      file: "employment-gap-feature-importance",
      alt: "Horizontal bar chart of Random Forest feature importance for placement, led by coding skill, mock interview and communication scores at about 6.7%",
      caption: "Feature importance for placement prediction",
    },
  ],
};
