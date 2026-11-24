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
