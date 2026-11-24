import { createContext, useContext } from "react";
import { projects, type Project } from "../data";

type ProjectFilter = {
  /** tag ที่เลือกอยู่ (null = แสดงทุกโปรเจกต์) */
  tag: string | null;
  setTag: (tag: string | null) => void;
};

/** แชร์ตัวกรองระหว่าง Skills (ปุ่ม skill) กับ Projects (แถบกรอง) */
export const ProjectFilterContext = createContext<ProjectFilter>({ tag: null, setTag: () => {} });

export const useProjectFilter = () => useContext(ProjectFilterContext);

/** ข้อมูล static → นับครั้งเดียวตอนโหลด module */
export const projectCountByTag: ReadonlyMap<string, number> = projects
  .flatMap((p) => p.tags)
  .reduce((counts, tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1), new Map<string, number>());

/** โปรเจกต์ที่ใช้ tag นี้ ชุดเดียวกับที่ projectCountByTag นับ */
export const projectsWithTag = (tag: string) => projects.filter((p) => p.tags.includes(tag));

type SkillEvidence = { kind?: "Decision" | "Step" | "Feature" | "Problem"; text: string };

// ตัดที่ . ! ? + ช่องว่าง + ตัวพิมพ์ใหญ่/ตัวเลขเท่านั้น: "0.90", "Next.js", prompt "wheel. car. water." จึงไม่ถูกตัดกลางประโยค
// ไม่ใช้ lookbehind ทั้งไฟล์: Safari ก่อน 16.4 โยน SyntaxError ตอนสร้าง RegExp (เว็บยังรองรับ iOS 16)
const sentences = (text: string) => text.trim().replace(/([.!?])\s+(?=[A-Z0-9])/g, "$1\n").split("\n");

/**
 * ประโยคหลักฐานว่า skill นี้ช่วยแก้อะไรในโปรเจกต์: ยกจาก data.ts ตรงตัว ไม่แต่งเหตุผลเอง
 * ลำดับ decisions → howItWorks → features เพราะ decisions เป็นที่เดียวที่บอก "ทำไม" จริง ถ้าไม่มีประโยคไหนเอ่ยชื่อ skill ใช้ problem แล้วจึง desc
 */
export function skillEvidence(project: Project, skill: string): SkillEvidence {
  // \b ใช้กับชื่อที่ขึ้น/จบด้วยสัญลักษณ์ไม่ได้ (เช่น C/C++, Next.js) จึงเช็กเองว่าข้างหน้า/หลังไม่ใช่ตัวอักษรหรือตัวเลข
  // ข้ามที่เอ่ยแบบปฏิเสธ ("no Python server"): ประโยคนั้นบอกว่าไม่ได้ใช้ ไม่ใช่หลักฐานว่าใช้
  const name = new RegExp(`(^|[^\\p{L}\\p{N}])${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "giu");
  const named = (s: string) => [...s.matchAll(name)].some((m) => !/\b(?:no|not|without)\s$/i.test(s.slice(0, m.index + m[1].length)));
  const { decisions, howItWorks, features } = project.explore ?? {};
  for (const [kind, list] of [["Decision", decisions], ["Step", howItWorks], ["Feature", features]] as const) {
    const hit = list?.flatMap(sentences).find(named);
    if (hit) return { kind, text: hit };
  }
  return project.problem ? { kind: "Problem", text: project.problem } : { text: sentences(project.desc)[0] };
}
