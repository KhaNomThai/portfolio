/**
 * screenshot ของโปรเจกต์: key = id ของ project ใน data.ts ไฟล์อยู่ที่ src/assets/images/projects/<id>-640.webp และ -1280.webp
 * โปรเจกต์ที่มีลิงก์ demo `npm run shots` จับหน้าแรกให้เอง ส่วนโปรเจกต์ที่ไม่มี demo หรืออยากได้หน้าอื่น วางไฟล์สองขนาดเองแล้วเพิ่ม key ที่นี่ (ใส่ `manual: true`)
 * key ที่มี = case study เต็มแถว ไม่มี key = แถวใน "More projects" ที่ไม่มีรูป (ข้อมูลล้วน ไม่ import asset เหตุผลเดียวกับ experienceMedia.ts)
 */
export type ProjectMedia = {
  /** บรรยายสิ่งที่เห็นใน screenshot จริง */
  alt: string;
  /** ไฟล์วางเอง `npm run shots` ไม่จับทับ: หน้าที่ต้องการอยู่หลังการกดหรือการเลื่อน ซึ่งสคริปต์ทำไม่ได้ */
  manual?: true;
};

/** ขนาดไฟล์ใหญ่ (16:10) ไฟล์เล็กคือครึ่งหนึ่ง */
export const SHOT_SIZE = { width: 1280, height: 800 };

export const projectMedia: Record<string, ProjectMedia> = {
  "skin-cancer-screening": {
    alt: "Derma AI web app: a model picker listing ResNet50, EfficientNet-B3 and DenseNet121 beside an upload area for a skin-lesion image",
  },
  katang: {
    alt: "KaTang demo section in Thai: a two-step walkthrough beside a phone mockup showing the balance and today's safe spending amount",
    manual: true,
  },
  wellync: {
    alt: "WELLYNC patient home screen in Thai: a health score card above tiles for blood pressure, blood sugar, BMI and pulse",
    manual: true,
  },
};
