import { createContext, useContext } from "react";
import { flushSync } from "react-dom";
import { goTo } from "./route";
import { projects, type Project } from "../data";

type ProjectFilter = {
  /** tag ที่เลือกอยู่ (null = แสดงทุกโปรเจกต์) */
  tag: string | null;
  setTag: (tag: string | null) => void;
};

/** แชร์ตัวกรองระหว่าง Skills (ปุ่ม skill) กับ Projects (แถบกรอง) */
export const ProjectFilterContext = createContext<ProjectFilter>({ tag: null, setTag: () => {} });

export const useProjectFilter = () => useContext(ProjectFilterContext);

/** อัปเดตผลก่อนย้าย focus เพื่อให้โปรแกรมอ่านหน้าจออ่านข้อความใหม่ */
export function showProjectsByTag(setTag: ProjectFilter["setTag"], tag: string) {
  flushSync(() => setTag(tag));
  goTo("projects", { focusId: "projects-status" });
}

/** ข้อมูล static → นับครั้งเดียวตอนโหลด module */
export const projectCountByTag: ReadonlyMap<string, number> = projects
  .flatMap((p) => [...new Set(p.tags)])
  .reduce((counts, tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1), new Map<string, number>());

/** โปรเจกต์ที่ใช้ tag นี้ ชุดเดียวกับที่ projectCountByTag นับ */
export const projectsWithTag = (tag: string) => projects.filter((p) => p.tags.includes(tag));

type SkillEvidence = { kind?: "Decision" | "Step" | "Feature"; text: string };

// ตัดที่ . ! ? + ช่องว่าง + ตัวพิมพ์ใหญ่/ตัวเลขเท่านั้น: "0.90", "Next.js", prompt "wheel. car. water." จึงไม่ถูกตัดกลางประโยค
// ไม่ใช้ lookbehind ทั้งไฟล์: Safari ก่อน 16.4 โยน SyntaxError ตอนสร้าง RegExp; หลีกเลี่ยง syntax นี้เพื่อให้ไฟล์ JS เปิดได้ก่อนแสดง fallback
const sentences = (text: string) => text.trim().replace(/([.!?])\s+(?=[A-Z0-9])/g, "$1\n").split("\n");

/**
 * ใช้คำอธิบายรายทักษะก่อน แล้วค่อยหาประโยคที่เอ่ยชื่อทักษะในหน้าโปรเจกต์
 * ถ้าหาไม่ได้ แสดงแค่ลิงก์โปรเจกต์จาก tag เพราะโจทย์ของงานยังไม่ได้บอกว่าทักษะนั้นใช้ทำอะไร
 */
export function skillEvidence(project: Project, skill: string): SkillEvidence | undefined {
  const evidence = project.skillEvidence?.[skill];
  if (evidence) return { text: evidence };
  // \b ใช้กับชื่อที่ขึ้น/จบด้วยสัญลักษณ์ไม่ได้ (เช่น C/C++, Next.js) จึงเช็กเองว่าข้างหน้า/หลังไม่ใช่ตัวอักษรหรือตัวเลข
  // ข้ามที่เอ่ยแบบปฏิเสธ ("no Python server"): ประโยคนั้นบอกว่าไม่ได้ใช้ ไม่ใช่หลักฐานว่าใช้
  const name = new RegExp(`(^|[^\\p{L}\\p{N}])${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "giu");
  const named = (s: string) => [...s.matchAll(name)].some((m) => !/\b(?:no|not|without)\s$/i.test(s.slice(0, m.index + m[1].length)));
  const { decisions, howItWorks, features } = project.explore ?? {};
  for (const [kind, list] of [["Decision", decisions], ["Step", howItWorks], ["Feature", features]] as const) {
    const hit = list?.flatMap(sentences).find(named);
    if (hit) return { kind, text: hit };
  }
}
