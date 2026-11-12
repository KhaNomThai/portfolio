import { useSyncExternalStore, type MouseEvent } from "react";
import { flushSync } from "react-dom";

/**
 * router เล็กที่สุดที่เว็บนี้ต้องใช้: มีแค่หน้าแรกกับ /projects/<id> จึงไม่ต้องลง library
 * หน้า explore เปิดทับหน้าแรกที่ยัง mount อยู่ (ProjectPage) ปิดแล้วจึงกลับมาที่ตำแหน่งเลื่อนเดิมและการ์ดเดิมได้เอง
 */

const listeners = new Set<() => void>();

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
};

export const projectPath = (id: string) => `/projects/${id}`;

/** id ของโปรเจกต์ที่เปิดอยู่ (null = หน้าแรก) */
export const useProjectRoute = () =>
  useSyncExternalStore(subscribe, () => /^\/projects\/([^/]+)\/?$/.exec(location.pathname)?.[1] ?? null);

/**
 * flushSync: หน้า explore ต้องปิดเสร็จ (dialog คืน focus ให้ตัวที่เปิด) ก่อนโค้ดถัดไปของผู้เรียก
 * เช่น ⌘K ที่ย้าย focus ไปหัว section ต่อทันที ถ้าปิดทีหลัง focus จะถูกดึงกลับไปที่การ์ด
 */
export function navigate(url: string, { replace = false } = {}) {
  // fromHome: กดเข้ามาจากหน้าแรก → ปิดหน้าได้ด้วย history.back() ส่วนคนที่เปิดลิงก์ตรงไม่มีหน้าก่อนหน้าให้ย้อน
  const state = replace ? history.state : { fromHome: true };
  history[replace ? "replaceState" : "pushState"](state, "", url);
  flushSync(() => listeners.forEach((l) => l()));
}

/** onClick ของ <a href="/projects/..."> ให้เปลี่ยนหน้าโดยไม่โหลดใหม่ แต่คลิกกลาง/⌘/Ctrl/Shift ยังเปิดแท็บใหม่ตามปกติ */
export function onRouteClick(e: MouseEvent<HTMLAnchorElement>, options?: { replace?: boolean }) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  navigate(e.currentTarget.getAttribute("href")!, options);
}
