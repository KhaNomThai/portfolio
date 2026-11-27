import { useEffect, useRef, useState } from "react";

/**
 * true ตั้งแต่ครั้งแรกที่ element เข้ามาในจอ แล้วค้างไว้ตลอดอายุของ component (ใช้เล่นการขีดปากกาเน้นครั้งเดียว)
 * การ์ดโปรเจกต์ถูกสร้างใหม่ทุกครั้งที่เปลี่ยนตัวกรอง จึงขีดใหม่อีกรอบ ซึ่งช่วยบอกว่ารายการเปลี่ยนแล้ว
 * เริ่มเมื่อเห็นครั้งแรก แม้การ์ดบนมือถือจะสูงกว่าจอและเข้า viewport ได้เพียงบางส่วน
 */
export function useInViewOnce<T extends Element>(threshold = 0.6) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [seen, threshold]);

  return [ref, seen] as const;
}
