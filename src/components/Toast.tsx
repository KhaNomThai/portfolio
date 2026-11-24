import { AnimatePresence, m } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ToastContext } from "../lib/toast";
import { CheckIcon } from "./icons";

const DURATION_MS = 2400;

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((message: string) => {
    window.clearTimeout(timer.current);
    // id ใหม่ทุกครั้ง → ข้อความเดิมซ้ำก็ยังเล่น animation ใหม่
    setToast({ id: Date.now(), message });
    timer.current = window.setTimeout(() => setToast(null), DURATION_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // <dialog> ที่เปิดด้วย showModal อยู่ top layer: z-index ใดก็ขึ้นไม่ถึง และทุกอย่างนอกมันเป็น inert จึงวาด toast ไว้ใน dialog บนสุด
  const dialog = toast && [...document.querySelectorAll("dialog[open]")].at(-1);
  const region = (
    <>
      {/* live region ต้อง render ไว้ตั้งแต่แรก screen reader ถึงจะอ่านข้อความที่ใส่เข้ามาทีหลัง
          จอเล็กยกขึ้นเหนือปุ่ม Back to top (bottom-6 + 44px): ข้อความยาวกว้างเกือบเต็มจอจะทับปุ่ม */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex justify-center px-4 md:bottom-6 print:hidden"
      >
        <AnimatePresence>
          {toast && (
            // จางเข้าด้วย CSS (fade-in) ไม่ใช่ initial ของ framer-motion: chunk โหลดไม่ได้ ข้อความต้องยังเห็น
            // toast ลอยเหนือหน้า จึงมีเงา shadow-overlay ตามกติกาเงาของระบบ (ของที่วางราบบนกระดาษไม่มีเงา)
            // หน้าตาเป็นโน้ตติดเทปเอียงนิดหนึ่ง ชุดเดียวกับรูปติดเทปใน hero (rotate เป็น property แยก ไม่ชนกับ transform ของ framer)
            <m.p
              key={toast.id}
              initial={{ y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="fade-in relative flex -rotate-2 items-center gap-2 rounded-card border border-rule bg-surface px-4 pt-4 pb-3 type-small text-ink shadow-overlay"
            >
              <span aria-hidden="true" className="photo-tape" />
              <CheckIcon className="size-4 text-pen" />
              {toast.message}
            </m.p>
          )}
        </AnimatePresence>
      </div>
    </>
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      {dialog ? createPortal(region, dialog) : region}
    </ToastContext.Provider>
  );
}
