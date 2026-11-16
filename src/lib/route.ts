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
 * เมื่อเปลี่ยนเส้นทางหน้า explore (/projects/<id>) ใช้ View Transitions API ถ้าเบราว์เซอร์รองรับและไม่ได้ปิด motion
 */
export function navigate(url: string, { replace = false, transition = false } = {}) {
  // fromHome: กดเข้ามาจากหน้าแรก → ปิดหน้าได้ด้วย history.back() ส่วนคนที่เปิดลิงก์ตรงไม่มีหน้าก่อนหน้าให้ย้อน
  const state = replace ? history.state : { fromHome: true };
  const commit = () => {
    history[replace ? "replaceState" : "pushState"](state, "", url);
    flushSync(() => listeners.forEach((l) => l()));
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (transition && !reduced && document.startViewTransition) {
    document.startViewTransition(commit);
  } else {
    commit();
  }
}

/** เลื่อนไปที่ section แล้วย้าย focus ไปที่หัวข้อ → Tab ถัดไปเริ่มจากตรงนั้น และ screen reader อ่านชื่อ section */
export function goTo(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  // navigate (ไม่ใช่ pushState ตรงๆ): ถ้าหน้า explore เปิดอยู่จะปิดก่อน แล้วจึงเลื่อนหน้าแรกที่อยู่ข้างหลัง
  navigate(`/#${id}`);
  target.scrollIntoView();
  // หาหัวข้อจาก aria-labelledby ของ section: hero ใช้ id "hero-heading" ไม่ใช่ "top-heading" ตามแบบของ section อื่น
  const headingId = target.getAttribute("aria-labelledby");
  const heading = headingId ? document.getElementById(headingId) : null;
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

let spotlightTimer = 0;

/**
 * กระโดดจากแถบสรุปใน Hero ไปยังการ์ดโปรเจกต์หรือรายการประสบการณ์จริง พร้อมกรอบปากกาแดงชั่วคราว (data-spotlight)
 * ให้สายตาจับเจอหลักฐานทันทีโดยไม่ต้องกวาดหาทั้ง section
 * การ์ดอาจไม่อยู่บนหน้า (ตัวกรองเหลือแต่ใบอื่น, มุมมอง Ledger) หรือถูกซ่อน (มือถือแสดง 4 ใบแรก):
 * โปรเจกต์ → เปิดหน้า explore ของมันแทน ส่วนอย่างอื่น → ไปหัว section ด้วย goTo กดแล้วจึงไม่มีทางตกไปที่ว่าง
 */
export function jumpToEvidence(sectionId: string, itemId: string) {
  const el = document.getElementById(`evidence-${itemId}`);
  // getClientRects ว่าง = display:none (ไม่ใช้ checkVisibility: Safari ก่อน 17.4 ไม่มี)
  if (!el || el.getClientRects().length === 0) {
    if (sectionId === "projects") navigate(projectPath(itemId), { transition: true });
    else goTo(sectionId);
    return;
  }
  // replace: กดหลายใบติดกันไม่สร้าง history ให้ปุ่ม Back ต้องย้อนผ่านทีละอัน
  navigate(`/#${sectionId}`, { replace: true });
  // start (ไม่ใช่ center): การ์ดบนมือถือสูงกว่าจอ center จะดันชื่อการ์ดออกเหนือจอ scroll-padding-top เผื่อ navbar ไว้แล้ว
  el.scrollIntoView({ block: "start" });

  // ล้างสถานะเก่าก่อนตั้งใหม่ เพื่อให้กดซ้ำแล้วกรอบขึ้นใหม่ได้ทันที
  window.clearTimeout(spotlightTimer);
  for (const prev of document.querySelectorAll("[data-spotlight]")) prev.removeAttribute("data-spotlight");
  el.setAttribute("data-spotlight", "");
  spotlightTimer = window.setTimeout(() => el.removeAttribute("data-spotlight"), 1600);

  // focus ชื่อรายการ: Tab ถัดไปเริ่มจากการ์ดนี้ และ screen reader อ่านชื่อหลักฐาน
  const heading = el.querySelector<HTMLElement>("h3, h4") ?? el;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

/** onClick ของ <a href="/projects/..."> ให้เปลี่ยนหน้าโดยไม่โหลดใหม่ แต่คลิกกลาง/⌘/Ctrl/Shift ยังเปิดแท็บใหม่ตามปกติ */
export function onRouteClick(e: MouseEvent<HTMLAnchorElement>, options?: { replace?: boolean }) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  navigate(e.currentTarget.getAttribute("href")!, { ...options, transition: true });
}
