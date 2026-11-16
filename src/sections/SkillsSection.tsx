import { AnimatePresence, m } from "framer-motion";
import { useId, useState } from "react";
import { flushSync } from "react-dom";
import { ChevronRightIcon, GraphViewIcon, ListViewIcon } from "../components/icons";
import Section from "../components/Section";
import SkillLogo from "../components/SkillLogo";
import SkillMarker from "../components/SkillMarker";
import { familyLabel, familyOf, type SkillFamilyId } from "../config/skillFamilies";
import { projects, sectionIntros, skillGroups, type Skill, type SkillGroup } from "../data";
import { projectCountByTag, projectsWithTag, skillEvidence, useProjectFilter } from "../lib/projectFilter";
import { onRouteClick, projectPath } from "../lib/route";

/**
 * Skills แบบดัชนีท้ายเล่ม: ชื่อ ....... จำนวนโปรเจกต์ที่ใช้ (แทนเลขหน้า)
 * ไม่มี progress bar แบบ % เพราะไม่มีหน่วยวัดจริง ตัวเลขที่แสดงคือนับจากโปรเจกต์ใน data.ts
 * กลุ่มใน data.ts เรียงตามหมวด (ML / DL, Data, Full-stack, Languages, Tools) สัญลักษณ์ของหมวดจึงอยู่ที่หัวกลุ่มครั้งเดียว
 */
/**
 * กลุ่มที่ยาวที่สุดกินสองแถว: ไม่อย่างนั้นแถวทั้งแถวสูงตามกลุ่มนี้ กลุ่มสั้นข้าง ๆ เหลือที่ว่างใหญ่ข้างใต้
 * (md 2 คอลัมน์: กลุ่มอื่นสองกลุ่มซ้อนข้างมัน / xl 3 คอลัมน์: อยู่คอลัมน์ขวาข้างสองแถว)
 */
const TALLEST = skillGroups.reduce((a, b) => (b.skills.length > a.skills.length ? b : a)).title;

type SkillView = "index" | "graph";

/** รายการ skill ที่มีโปรเจกต์ใช้จริงบนเว็บ สำหรับแสดงในมุมมอง Connection Graph */
const LINKED_SKILLS = skillGroups
  .flatMap((g) => g.skills)
  .filter((s) => (projectCountByTag.get(s.name) ?? 0) > 0);

export default function SkillsSection() {
  const { setTag } = useProjectFilter();
  const [view, setView] = useState<SkillView>("index");

  const showProjects = (skill: string) => {
    // flushSync: ข้อความสรุปผลต้องเป็นค่าใหม่ก่อนรับ focus ไม่อย่างนั้น screen reader อ่านค่าเก่า
    flushSync(() => setTag(skill));
    document.getElementById("projects")?.scrollIntoView();
    // ย้าย focus ไปที่สรุปผลการกรอง → ผู้ใช้คีย์บอร์ด/screen reader รู้ว่ากดแล้วเกิดอะไรขึ้น
    document.getElementById("projects-status")?.focus({ preventScroll: true });
  };

  return (
    <Section id="skills" intro={sectionIntros.skills}>
      <div className="mb-8 flex items-center justify-between gap-4 print:hidden">
        <p className="type-small text-ink-muted">
          {view === "index"
            ? "Select any skill to inspect its engineering evidence."
            : "Hover a skill to preview its links; select it to pin the evidence below."}
        </p>
        <div role="group" aria-label="Skills view" className="flex shrink-0 rounded-control border border-stroke bg-surface p-0.5">
          {(
            [
              { id: "index", label: "Index", Icon: ListViewIcon },
              { id: "graph", label: "Graph", Icon: GraphViewIcon },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className="flex h-11 items-center gap-2 rounded-tag px-3 type-label text-ink-muted transition-colors duration-(--duration-fast) not-aria-pressed:hover:text-pen aria-pressed:bg-ink aria-pressed:text-paper"
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <m.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {view === "graph" ? (
            <SkillConnectionGraph onSelectSkill={showProjects} />
          ) : (
            <div className="grid gap-x-12 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
              {skillGroups.map((group) => {
                const family = groupFamily(group);
                return (
                  <div key={group.title} className={`reveal ${group.title === TALLEST ? "md:row-span-2" : ""}`}>
                    <h3 className="flex items-center gap-2 border-b border-margin pb-2 type-title text-ink">
                      {family && <SkillMarker family={family} className="size-3" />}
                      {group.title}
                    </h3>
                    <ul className="mt-2">
                      {group.skills.map((skill) => (
                        <li key={skill.name}>
                          {/* กลุ่มที่ทุก skill อยู่หมวดเดียวกันไม่ต้องใส่สัญลักษณ์ซ้ำทุกแถว */}
                          <SkillRow skill={skill} showMarker={!family} onSelect={showProjects} />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </m.div>
      </AnimatePresence>
    </Section>
  );
}

/**
 * มุมมอง Bipartite Connection Graph (Skill ↔ Project):
 * ด้านซ้ายคือรายชื่อ skill ที่มีโปรเจกต์ใช้ ด้านขวาคือโปรเจกต์ทั้ง 10 ตัว เชื่อมด้วยเส้นโค้ง SVG Bezier
 * เมื่อชี้หรือเลือก skill เส้นเชื่อมและโปรเจกต์ที่ใช้จะสว่างขึ้น พร้อมแสดงประโยคหลักฐานจริงด้านล่าง
 */
function SkillConnectionGraph({ onSelectSkill }: { onSelectSkill: (name: string) => void }) {
  // เลือก (กด) กับดูชั่วคราว (ชี้) แยกกัน: ลากเมาส์ผ่าน skill อื่นระหว่างทางไปปุ่ม Filter แล้วสิ่งที่เลือกไว้ต้องไม่เปลี่ยน
  const [selectedSkill, setSelectedSkill] = useState(LINKED_SKILLS[0]?.name ?? "Python");
  const [previewSkill, setPreviewSkill] = useState<string | null>(null);
  const activeSkill = previewSkill ?? selectedSkill;
  const matchedProjects = projectsWithTag(activeSkill);
  const count = matchedProjects.length;

  // คำนวณพิกัด y ใน SVG (viewBox 0 0 160 440) ให้ตรงกึ่งกลางของแต่ละแถวในคอลัมน์ซ้ายและขวา
  const svgHeight = Math.max(LINKED_SKILLS.length * 36, projects.length * 44);
  const skillY = (i: number) => ((i + 0.5) / LINKED_SKILLS.length) * svgHeight;
  const projY = (i: number) => ((i + 0.5) / projects.length) * svgHeight;

  return (
    <div className="rounded-card border border-rule bg-surface p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1.15fr)] lg:items-stretch lg:gap-0">
        {/* คอลัมน์ซ้าย: ปุ่มเลือก Skill */}
        {/* justify-around (ไม่ใช่ between): แถวสูงเท่ากันแล้วจุดกึ่งกลางแถวที่ i อยู่ที่ (i + 0.5) / N พอดี ตรงกับปลายเส้นใน SVG
            ปุ่ม skill สูง 32px: รายการเรียงชิดกัน 19 แถว ถ้าสูง 44px กราฟยาวเกินจอ (ยังเกินเกณฑ์ WCAG 2.2 AA ที่ 24px) */}
        <ul
          aria-label="Skills in projects"
          onPointerLeave={() => setPreviewSkill(null)}
          className="flex flex-wrap gap-1.5 lg:flex-col lg:justify-around lg:gap-1"
        >
          {LINKED_SKILLS.map((skill) => {
            const selected = skill.name === selectedSkill;
            const previewed = skill.name === activeSkill && !selected;
            const family = familyOf(skill.name);
            const c = projectCountByTag.get(skill.name) ?? 0;
            return (
              <li key={skill.name}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setPreviewSkill(skill.name)}
                  onClick={() => {
                    setSelectedSkill(skill.name);
                    setPreviewSkill(null);
                  }}
                  className={`flex min-h-8 w-full items-center justify-between gap-2 rounded-control border px-2.5 py-1 text-left type-small transition-colors duration-(--duration-fast) ${
                    selected
                      ? "border-pen bg-pen text-on-pen"
                      : previewed
                        ? "border-pen bg-paper text-pen"
                        : "border-rule bg-paper text-ink hover:border-pen hover:text-pen"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {family && <SkillMarker family={family} inherit={selected} />}
                    <SkillLogo name={skill.name} className="size-4 shrink-0" />
                    <span className="truncate">{skill.name}</span>
                  </span>
                  <span className="type-caption tabular-nums opacity-80">{c}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* คอลัมน์กลาง (เฉพาะจอ lg): เส้นเชื่อม SVG Bezier ระหว่าง Skill กับ Project */}
        <svg
          aria-hidden="true"
          viewBox={`0 0 160 ${svgHeight}`}
          preserveAspectRatio="none"
          className="pointer-events-none hidden h-full w-40 lg:block"
        >
          {LINKED_SKILLS.map((skill, si) => {
            const y1 = skillY(si);
            const isSelected = skill.name === activeSkill;
            return projects.map((proj, pi) => {
              if (!proj.tags.includes(skill.name)) return null;
              const y2 = projY(pi);
              return (
                <path
                  key={`${skill.name}-${proj.id}`}
                  d={`M 0 ${y1} C 80 ${y1}, 80 ${y2}, 160 ${y2}`}
                  fill="none"
                  className={isSelected ? "stroke-pen" : "stroke-rule"}
                  strokeWidth={isSelected ? 2.25 : 1}
                  opacity={isSelected ? 1 : 0.45}
                />
              );
            });
          })}
        </svg>

        {/* คอลัมน์ขวา: รายการโปรเจกต์ทั้ง 10 ตัว (สว่างขึ้นเมื่อใช้ activeSkill) */}
        <ul aria-label="Connected projects" className="grid gap-1.5 lg:flex lg:flex-col lg:justify-around lg:gap-1">
          {projects.map((proj) => {
            const linked = proj.tags.includes(activeSkill);
            return (
              <li key={proj.id}>
                <a
                  href={projectPath(proj.id)}
                  onClick={onRouteClick}
                  className={`flex min-h-11 items-center justify-between gap-2 rounded-control border px-3 py-1.5 type-small transition-colors duration-(--duration-fast) ${
                    linked
                      ? "border-pen bg-paper font-semibold text-ink hover:text-pen"
                      : // ไม่ใช้ opacity: ยังเป็นลิงก์ที่กดได้ ข้อความต้องผ่าน 4.5:1 จึงจางแค่ขอบกับพื้น
                        "border-rule bg-transparent text-ink-muted hover:border-pen hover:text-pen"
                  }`}
                >
                  <span className="truncate">{proj.title}</span>
                  <span className="shrink-0 type-caption tabular-nums text-ink-muted">{proj.year}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      {/* แผงหลักฐานของ activeSkill ด้านล่างกราฟ */}
      <div className="mt-6 border-t border-rule pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="type-label text-ink">
            Engineering evidence for <span className="text-pen">{activeSkill}</span> ({count} {count === 1 ? "project" : "projects"})
          </h3>
          <button
            type="button"
            onClick={() => onSelectSkill(activeSkill)}
            className="inline-flex min-h-11 items-center type-label text-pen underline underline-offset-3 transition-colors duration-(--duration-fast) hover:text-pen-hover"
          >
            Filter {count} {count === 1 ? "project" : "projects"} in Projects →
          </button>
        </div>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {matchedProjects.map((project) => {
            const evidence = skillEvidence(project, activeSkill);
            return (
              <li key={project.id} className="rounded-control border border-rule bg-paper p-3">
                <a
                  href={projectPath(project.id)}
                  onClick={onRouteClick}
                  className="type-label text-pen underline underline-offset-3 hover:text-pen-hover"
                >
                  {project.title}
                </a>
                <p className="mt-1 type-small text-ink">
                  {evidence.kind && <span className="type-caption text-ink-muted">{evidence.kind} — </span>}
                  {evidence.text}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** หมวดของทั้งกลุ่ม ถ้าทุก skill ในกลุ่มอยู่หมวดเดียวกัน (Tools ไม่มีหมวด → undefined) */
function groupFamily(group: SkillGroup): SkillFamilyId | undefined {
  const first = familyOf(group.skills[0]?.name ?? "");
  return first && group.skills.every((skill) => familyOf(skill.name) === first) ? first : undefined;
}

function SkillRow({ skill, showMarker, onSelect }: { skill: Skill; showMarker: boolean; onSelect: (name: string) => void }) {
  const family = familyOf(skill.name);
  const count = projectCountByTag.get(skill.name) ?? 0;
  // แต่ละแถวเก็บสถานะเอง: เปิดหลายแผงพร้อมกันได้ เทียบกันได้
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const name = (
    <>
      {showMarker && family && <SkillMarker family={family} />}
      {showMarker && family && <span className="sr-only">{familyLabel(family)}: </span>}
      {/* ช่อง logo กว้างคงที่ ชื่อ skill ทุกแถวจึงเริ่มตรงกันแม้บางตัวไม่มี logo */}
      <span className="flex size-6 shrink-0 items-center justify-center">
        <SkillLogo name={skill.name} className="size-5" />
      </span>
      <span>{skill.name}</span>
    </>
  );

  if (count === 0) {
    return <span className="group flex min-h-11 items-center gap-3 type-body text-ink">{name}</span>;
  }

  return (
    <>
      {/* disclosure: เปิดดูว่าใช้ในโปรเจกต์ไหนก่อน การกรองรายการ Projects แบบเดิมย้ายไปเป็นปุ่มในแผง */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="group flex min-h-11 w-full items-center gap-3 rounded-control text-left type-body text-ink transition-[color,scale] duration-(--duration-fast) hover:text-pen motion-safe:active:scale-[0.97]"
      >
        {name}
        {/* เส้นจุดนำสายตา (dot leader) แบบดัชนีท้ายเล่ม พาจากชื่อไปหาตัวเลข */}
        <span aria-hidden="true" className="mx-1 h-0 flex-1 translate-y-1 border-b border-dotted border-stroke group-hover:border-pen" />
        <span className="type-label tabular-nums text-pen underline underline-offset-3">
          {count}
          <span className="sr-only"> {count === 1 ? "project" : "projects"}</span>
        </span>
        <ChevronRightIcon
          className={`size-4 shrink-0 text-ink-muted group-hover:text-pen motion-safe:transition-[rotate] motion-safe:duration-(--duration-fast) ${open ? "-rotate-90" : "rotate-90"}`}
        />
      </button>
      {/* hidden: ลิงก์ในแผงที่ปิดไม่อยู่ในลำดับ Tab / เยื้องเท่าช่องก่อนชื่อ skill (สัญลักษณ์หมวด + logo 24px + gap 12px) */}
      <div
        id={panelId}
        hidden={!open}
        className={`border-t border-dotted border-rule pb-3 ${showMarker && family ? "ml-[calc(var(--key-size)+3rem)]" : "ml-9"}`}
      >
        {/* ความสูงเปลี่ยนทันที เนื้อหาข้างในจางขึ้นมา (skill-note ใน index.css) */}
        <div className="skill-note pt-3">
          <p className="type-caption text-ink-muted">Used in</p>
          <ul className="space-y-3">
            {projectsWithTag(skill.name).map((project) => {
              const evidence = skillEvidence(project, skill.name);
              return (
                <li key={project.id}>
                  <a
                    href={projectPath(project.id)}
                    onClick={onRouteClick}
                    className="inline-flex min-h-11 items-center type-small text-pen underline underline-offset-3 transition-colors duration-(--duration-fast) hover:text-pen-hover"
                  >
                    {project.title}
                  </a>
                  <p className="type-caption tabular-nums text-ink-muted">{[project.category, project.year].filter(Boolean).join(" · ")}</p>
                  <p className="mt-1 type-small text-ink">
                    {evidence.kind && <span className="type-caption text-ink-muted">{evidence.kind} — </span>}
                    {evidence.text}
                  </p>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => onSelect(skill.name)}
            className="mt-2 inline-flex min-h-11 items-center type-label text-pen underline underline-offset-3 transition-[color,scale] duration-(--duration-fast) hover:text-pen-hover motion-safe:active:scale-[0.97]"
          >
            Show {count} {count === 1 ? "project" : "projects"}
            <span className="sr-only"> using {skill.name} in Projects</span>
          </button>
        </div>
      </div>
    </>
  );
}
