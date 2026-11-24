import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LazyMotion, MotionConfig } from "framer-motion";
// Newsreader แบบมีแกน optical size: ตัวใหญ่ (ชื่อใน hero) ได้รูปตัวที่ออกแบบมาสำหรับขนาดนั้น คมและแน่นกว่า
import "@fontsource-variable/newsreader/opsz.css";
import "@fontsource-variable/ibm-plex-sans";
// ก่อน App: theme.ts อ่าน token --color-paper ตอน import
import "./index.css";
import App from "./App";
import BrokenPage from "./components/BrokenPage";
import ErrorBoundary from "./components/ErrorBoundary";

// Safari ไม่ focus ลิงก์หรือปุ่มตอนคลิก dialog จึงไม่รู้ว่าต้องคืน focus ให้ตัวไหนตอนปิด (VoiceOver หลุดไปต้นหน้า) เบราว์เซอร์อื่น focus ให้แล้วจึงไม่เปลี่ยน
document.addEventListener("click", (e) => {
  if (e.target instanceof Element) e.target.closest<HTMLElement>("a[href], button")?.focus({ preventScroll: true });
}, { capture: true });

// Safari โชว์วง focus ทุกครั้งที่ dialog คืน focus แม้ปิดด้วยเมาส์หรือนิ้ว: วงมีไว้ให้คีย์บอร์ดเท่านั้น ต้อง blur ก่อน focus ซ้ำเฉย ๆ วงไม่หาย
let byPointer = false;
document.addEventListener("pointerdown", () => (byPointer = true), { capture: true });
document.addEventListener("keydown", () => (byPointer = false), { capture: true });
document.addEventListener("close", () => {
  const el = document.activeElement;
  if (!byPointer || !(el instanceof HTMLElement) || !el.matches(":focus-visible")) return;
  el.blur();
  el.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
}, { capture: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* LazyMotion + m.* โหลดแค่ feature ที่ใช้ (animation, hover/tap, inView) แทน motion.* ตัวเต็ม และโหลดทีหลังแบบ dynamic import
        JS ที่ต้องรอก่อนหน้าแรกแสดงจึงเล็กลง strict: ถ้าเผลอใช้ motion.* จะ error ทันที */}
    <LazyMotion features={() => import("./lib/motionFeatures").then((mod) => mod.default)} strict>
      {/* ผู้ใช้ที่ตั้ง "Reduce motion" ใน OS จะไม่เห็น transform animation ของ framer-motion */}
      <MotionConfig reducedMotion="user">
        <ErrorBoundary fallback={<BrokenPage />}>
          <App />
        </ErrorBoundary>
      </MotionConfig>
    </LazyMotion>
  </StrictMode>
);
