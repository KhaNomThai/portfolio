import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";

export type Theme = "light" | "dark";

/** key เดียวกับสคริปต์ใน index.html ที่ตั้งธีมก่อนหน้าเว็บถูกวาด */
const STORAGE_KEY = "theme";

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    // storage ถูกปิด → ถือว่ายังไม่เคยเลือก
    return null;
  }
}

/** token ทุกตัวเปลี่ยนค่าตาม data-theme บน <html> (ดู styles/tokens.css) */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  // แถบเบราว์เซอร์บนมือถือให้ตามธีมที่เลือกจริง ไม่ใช่ตามระบบ
  const paper = getComputedStyle(root).getPropertyValue("--color-paper").trim();
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute("content", paper);
    meta.removeAttribute("media");
  }
}

/** ธีมปัจจุบัน + ตัวสลับ: ผู้ใช้ที่ยังไม่เคยกดเลือก จะได้ธีมตามระบบแบบสด ๆ (เช่น macOS เปลี่ยนเป็นมืดตอนค่ำ) */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (storedTheme()) return;
      const next = e.matches ? "dark" : "light";
      applyTheme(next);
      setTheme(next);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(
    (e?: MouseEvent<HTMLElement>) => {
      const next = theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // จำค่าไม่ได้ก็ยังสลับธีมในหน้านี้ได้
      }
      const apply = () => {
        applyTheme(next);
        flushSync(() => setTheme(next)); // ไอคอนในปุ่มต้องเปลี่ยนก่อน browser ถ่ายภาพหน้าใหม่
      };

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!e || reduced || !document.startViewTransition) return apply();
      revealFrom(e.currentTarget, document.startViewTransition(apply));
    },
    [theme]
  );

  return { theme, toggle };
}

/**
 * ธีมใหม่กระจายเป็นวงกลมจากกลางปุ่มจนเต็มจอ (ใช้กลางปุ่มแทนตำแหน่งเมาส์ กดด้วยคีย์บอร์ดจึงได้ผลเหมือนกัน)
 * browser ที่ไม่มี View Transitions (เช่น Firefox รุ่นเก่า) สลับทันทีแบบเดิม
 */
function revealFrom(button: HTMLElement, transition: ViewTransition) {
  const rect = button.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  transition.ready
    .then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        // 560ms กับ ease-out ของ token: เร็วพอไม่ให้รอ แต่ช้าพอให้เห็นว่ากระจายออกจากปุ่ม
        { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
      )
    )
    .catch(() => {
      // transition ถูกยกเลิก (เช่นกดซ้ำเร็ว ๆ) ธีมก็ยังเปลี่ยนแล้ว
    });
}
