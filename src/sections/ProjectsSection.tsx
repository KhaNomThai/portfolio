import { AnimatePresence, m } from "framer-motion";
import { useId, useState, type ComponentType, type CSSProperties, type ReactNode, type SVGProps } from "react";
import NewTabHint from "../components/NewTabHint";
import Section from "../components/Section";
import SkillMarker, { SkillLegend } from "../components/SkillMarker";
import {
  BadgeCheckIcon,
  BeakerIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CodeIcon,
  GlobeIcon,
  GridViewIcon,
  ListViewIcon,
  NotebookIcon,
  ProblemIcon,
} from "../components/icons";
import { PORTRAIT_SIZE, SHOT_SIZE, projectGallery, projectMedia } from "../config/projectMedia";
import { SKILL_FAMILIES, familyLabel, familyOf, groupByFamily } from "../config/skillFamilies";
import { projects, sectionIntros, type Project, type ProjectLink, type ProjectLinkKind } from "../data";
import CountUp from "../components/CountUp";
import LabFigure from "../components/LabFigure";
import MarkedText from "../components/MarkedText";
import { linkProps } from "../lib/links";
import { mediaSources } from "../lib/media";
import { projectCountByTag, useProjectFilter } from "../lib/projectFilter";
import { onRouteClick, projectPath } from "../lib/route";
import { useCardTilt } from "../lib/useCardTilt";
import { useInViewOnce } from "../lib/useInViewOnce";

const LINKS: Record<ProjectLinkKind, { label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  code: { label: "Code", Icon: CodeIcon },
  demo: { label: "Live demo", Icon: GlobeIcon },
  notebook: { label: "Notebook", Icon: NotebookIcon },
  certificate: { label: "Certificate", Icon: BadgeCheckIcon },
};

/** ตัวกรองละเอียด = tag ที่มีอย่างน้อย 2 โปรเจกต์ (เรียงตามจำนวน) — ข้อมูล static คำนวณครั้งเดียว */
const FILTER_TAGS = [...projectCountByTag]
  .filter(([, count]) => count >= 2)
  .sort((a, b) => b[1] - a[1])
  .map(([tag]) => tag);

/**
 * ตัวกรองหลัก = หมวดของ skill (ชื่อและสัญลักษณ์เดียวกับ legend) ไม่รวม Languages เพราะเกือบทุกโปรเจกต์มี
 * โปรเจกต์อยู่ในหมวดเมื่อมี tag ใดในหมวดนั้น หนึ่งโปรเจกต์จึงอยู่ได้หลายหมวด (งาน AI ที่มีหน้าเว็บนับทั้ง ML และ Full-stack)
 */
const CATEGORIES = SKILL_FAMILIES.filter(({ id }) => id !== "lang");
type CategoryId = (typeof CATEGORIES)[number]["id"];
const inCategory = (project: Project, id: CategoryId) => project.tags.some((t) => familyOf(t) === id);
const CATEGORY_COUNT = new Map(CATEGORIES.map(({ id }) => [id, projects.filter((p) => inCategory(p, id)).length]));

/** มือถือแสดงก่อนแค่นี้ (เรียงคอลัมน์เดียว หน้าจะยาวมาก) — จอ md ขึ้นไปแสดงครบเสมอ */
const MOBILE_PREVIEW = 4;

const hasShot = (project: Project) => project.id in projectMedia;

/**
 * span ใน grid 6 คอลัมน์ ให้ทุกแถวเต็มไม่ว่าตัวกรองจะเหลือกี่ใบ (แถวที่ขาดช่องดูเหมือนการ์ดหลุดหาย)
 * การ์ด Bento มีกราฟและแถบพรีวิวโต้ตอบได้ จึงวางแถวละ 2 ใบ (col-span-3) ให้กว้างพอที่ปุ่มและตัวเลขไม่ตกบรรทัด
 * ถ้ามีใบเศษท้ายสุด (n เป็นเลขคี่) ใบสุดท้ายจะกางเต็มแถว (col-span-6) แบบแบ่ง 2 คอลัมน์ข้างใน
 */
const SPAN_HALF = "md:col-span-3 lg:col-span-3";
const SPAN_FULL = "md:col-span-6 lg:col-span-6";
const bentoWide = (i: number, n: number) => n % 2 === 1 && i === n - 1;
function cardSpan(i: number, n: number) {
  return bentoWide(i, n) ? SPAN_FULL : SPAN_HALF;
}
/** การ์ด flagship: ใบแรกเต็มแถว (รูปข้างข้อความ) ที่เหลือคู่ละครึ่งแถว ถ้าเหลือเศษใบเดียวก็เต็มแถว */
const flagshipWide = (i: number, n: number) => i === 0 || (n % 2 === 0 && i === n - 1);

type View = "showcase" | "ledger";

export default function ProjectsSection() {
  const { tag, setTag } = useProjectFilter();
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [view, setView] = useState<View>("showcase");
  const [showAll, setShowAll] = useState(false);
  const [moreTags, setMoreTags] = useState(false);
  const listId = useId();
  const tagsId = useId();
  // tag (จากแถบละเอียดหรือปุ่มใน Skills) ล้างหมวดทิ้ง: เห็นตัวกรองเดียวที่ทำงานอยู่ และล้าง tag แล้วหมวดเก่าไม่กลับมาเอง
  // ตั้ง state ระหว่าง render (แบบ "adjusting state when a prop changes" ของ React) แทน effect ที่ render สองรอบ
  if (tag && category) setCategory(null);
  const activeCategory = tag ? null : category;
  const visible = tag ? projects.filter((p) => p.tags.includes(tag)) : activeCategory ? projects.filter((p) => inCategory(p, activeCategory)) : projects;
  const collapsible = view === "showcase" && !tag && !activeCategory && visible.length > MOBILE_PREVIEW;
  // tag ที่เลือกมาจากรายการใน Skills อาจไม่อยู่ในแถบ → ต่อท้ายให้เห็นว่ากำลังกรองอะไร
  const filterTags = tag && !FILTER_TAGS.includes(tag) ? [...FILTER_TAGS, tag] : FILTER_TAGS;
  const tagsOpen = moreTags || tag !== null;
  const activeLabel = tag ?? CATEGORIES.find((c) => c.id === activeCategory)?.label;

  const pickCategory = (id: CategoryId | null) => {
    setTag(null);
    setCategory(id);
  };

  // โปรเจกต์ที่มี screenshot เป็น flagship ใบใหญ่ ที่เหลือเป็นการ์ดเล็กในตาราง bento
  const cases = visible.filter(hasShot);
  const others = visible.filter((p) => !hasShot(p));
  // มือถือพับตามลำดับใน data.ts ข้ามทั้งสองกลุ่ม: 4 โปรเจกต์แรกเห็นก่อนไม่ว่าจะอยู่กลุ่มไหน
  const collapsed = (project: Project) => (collapsible && !showAll && visible.indexOf(project) >= MOBILE_PREVIEW ? "max-md:hidden" : "");

  return (
    <Section id="projects" intro={sectionIntros.projects}>
      {/* legend อธิบายสัญลักษณ์ครั้งเดียว ก่อนถึงรายการที่ใช้มัน */}
      <SkillLegend className="mb-6" />

      <div className="mb-8 print:hidden">
        {/* ViewSwitch ขึ้นแถวเดียวกับ chip ตั้งแต่ lg: ที่ md chip ทั้ง 5 ปุ่มลงแถวเดียวพอดีเมื่อไม่มีปุ่มสลับแบ่งที่ */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          {/* มือถือ: เลื่อนแนวนอน (ขอบขวาจางบอกว่ายังมีต่อ) / จอ md ขึ้นไป: ตัดบรรทัดตามปกติ
              py-1 คู่ -my-1: overflow-x ตัดทุกอย่างที่ล้นกล่อง จึงต้องเว้นที่ให้วง focus และวงเรืองของ chip */}
          <div
            role="group"
            aria-label="Filter projects by category"
            className="-mx-4 -my-1 flex gap-2 overflow-x-auto py-1 pl-4 pr-16 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:[mask-image:none]"
          >
            <FilterChip pressed={!tag && !activeCategory} onClick={() => pickCategory(null)} count={projects.length}>
              All
            </FilterChip>
            {CATEGORIES.map(({ id, label }) => (
              <FilterChip key={id} pressed={activeCategory === id} onClick={() => pickCategory(activeCategory === id ? null : id)} count={CATEGORY_COUNT.get(id)!}>
                <SkillMarker family={id} inherit />
                {label}
              </FilterChip>
            ))}
            {/* ขอบประ: ปุ่มนี้เปิดแถบ ไม่ใช่ตัวกรอง จึงต้องดูต่างจาก chip ที่กดแล้วกรอง */}
            <button
              type="button"
              aria-expanded={tagsOpen}
              aria-controls={tagsId}
              // พับแถบ = เลิกกรองด้วย tag ด้วย: tag ที่เลือกอยู่ต้องมองเห็นเสมอ จึงซ่อนแถบทั้งที่ยังกรองอยู่ไม่ได้
              onClick={() => {
                if (tagsOpen) setTag(null);
                setMoreTags(!tagsOpen);
              }}
              className="flex h-11 shrink-0 items-center gap-1 rounded-control border border-dashed border-stroke px-3 type-label text-ink-muted transition-colors duration-(--duration-fast) hover:border-pen hover:text-pen aria-expanded:border-pen aria-expanded:text-pen"
            >
              Technology
              <ChevronDownIcon className={`size-4 motion-safe:transition-[rotate] motion-safe:duration-(--duration-fast) ${tagsOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
          <ViewSwitch view={view} onChange={setView} />
        </div>

        {/* แถบละเอียดตาม technology: เปิดเองเมื่อมีปุ่ม skill ใน Skills เลือก tag มา (ต้องเห็นว่ากำลังกรองอะไร) */}
        <div
          id={tagsId}
          role="group"
          aria-label="Filter projects by technology"
          hidden={!tagsOpen}
          className="-mx-4 mt-3 flex gap-2 overflow-x-auto py-1 pl-4 pr-16 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:[mask-image:none]"
        >
          {filterTags.map((t) => (
            <FilterChip
              key={t}
              small
              pressed={tag === t}
              // แถบเปิดค้างไว้ก่อนล้าง tag: ไม่อย่างนั้นแถบ (ที่เปิดอยู่เพราะ tag จาก Skills) ซ่อนตัวทั้งที่ chip นี้ถือ focus อยู่ focus หลุดไป body
              onClick={() => {
                setMoreTags(true);
                setTag(tag === t ? null : t);
              }} count={projectCountByTag.get(t)!}>
              {t}
            </FilterChip>
          ))}
        </div>

        {/* สรุปผลอยู่ใต้แถบกรองชิดซ้าย เป็นบรรทัดกำกับของแถบ และเป็นหัวของรายการข้างล่าง (Skills โฟกัสบรรทัดนี้หลังกรอง) */}
        <p id="projects-status" tabIndex={-1} aria-live="polite" className="mt-3 type-small text-ink-muted outline-none">
          {!activeLabel
            ? `${projects.length} projects`
            : tag
              ? `${visible.length} of ${projects.length} projects ${visible.length === 1 ? "uses" : "use"} ${tag}`
              : `${visible.length} of ${projects.length} projects in ${activeLabel}`}
        </p>
      </div>

      {/* จางสั้น ๆ ตอนเปลี่ยนตัวกรองหรือมุมมอง: motion ที่ตอบการกระทำของผู้ใช้ และไม่เลื่อนตำแหน่ง (ไม่กระทบ layout) */}
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={`${view}:${tag ?? activeCategory ?? "all"}`} id={listId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {view === "ledger" ? (
            <Ledger projects={visible} />
          ) : (
            <ul
              // grid-cols-1 = minmax(0, 1fr): คอลัมน์ auto จะขยายตามเนื้อหาที่ยาวที่สุดจนการ์ดล้นจอมือถือ
              className="grid grid-cols-1 gap-6 md:grid-cols-6"
            >
              {cases.map((project, i) => {
                const wide = flagshipWide(i, cases.length);
                return (
                  // group อยู่ที่ <li> ที่ไม่ขยับ: การ์ดยกขึ้น 4px แล้วเมาส์ที่ขอบล่างยังอยู่ใน li จึงไม่กระพริบขึ้นลง
                  <li key={project.id} className={`group reveal grid grid-cols-1 md:col-span-6 print:block! ${wide ? "" : "lg:col-span-3"} ${collapsed(project)}`}>
                    <CaseStudy project={project} wide={wide} />
                  </li>
                );
              })}
              {others.map((project, i) => (
                <li key={project.id} className={`group reveal grid grid-cols-1 ${cardSpan(i, others.length)} print:block! ${collapsed(project)}`}>
                  <BentoCard project={project} wide={bentoWide(i, others.length)} />
                </li>
              ))}
            </ul>
          )}
        </m.div>
      </AnimatePresence>

      {collapsible && (
        <div className="mt-6 md:hidden print:hidden">
          <button
            type="button"
            aria-expanded={showAll}
            aria-controls={listId}
            onClick={() => setShowAll((v) => !v)}
            className="h-11 w-full rounded-control border border-stroke bg-surface px-4 type-label text-ink btn-ink"
          >
            {showAll ? "Show fewer projects" : `Show all ${projects.length} projects`}
          </button>
        </div>
      )}
    </Section>
  );
}

/**
 * chip ตัวกรอง: ที่เลือกอยู่พื้น pen เต็มพร้อมวงแหวนเรืองสีปากกา (glow) ตอนชี้เปลี่ยนแค่ขอบและตัวอักษร
 * ไม่ใช้หมึกไหลเต็มปุ่ม (btn-ink): พื้น pen เต็มคือสัญญาณของ chip ที่เลือกอยู่
 * small: chip ของแถบ technology สูง 44px เท่ากัน (ขนาดกดขั้นต่ำ) แต่ตัวอักษรบางกว่า แยกลำดับชั้นจากหมวดหลัก
 */
function FilterChip({ pressed, onClick, count, small = false, children }: { pressed: boolean; onClick: () => void; count: number; small?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex h-11 shrink-0 items-center gap-2 rounded-control border border-stroke bg-surface px-3 text-ink transition-[color,background-color,border-color,box-shadow] duration-(--duration-fast) not-aria-pressed:hover:border-pen not-aria-pressed:hover:text-pen aria-pressed:border-pen aria-pressed:bg-pen aria-pressed:text-on-pen aria-pressed:ring-4 aria-pressed:ring-glow ${small ? "type-small" : "type-label"}`}
    >
      {children}
      {/* จำนวนเป็นส่วนหนึ่งของชื่อปุ่ม: screen reader อ่าน "Data 4" ได้ความหมายครบโดยไม่ต้องอ่านแยก */}
      <span className="type-caption tabular-nums opacity-80">{count}</span>
    </button>
  );
}

/** สลับมุมมอง: Showcase (การ์ดรูปเต็มตา) กับ Ledger (ตารางตามปี สำหรับ recruiter ที่อยากสแกนเร็ว) — segmented control แบบ aria-pressed */
function ViewSwitch({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  const options = [
    { id: "showcase", label: "Showcase", Icon: GridViewIcon },
    { id: "ledger", label: "Ledger", Icon: ListViewIcon },
  ] as const;
  return (
    <div role="group" aria-label="Project view" className="flex shrink-0 self-start rounded-control border border-stroke bg-surface p-0.5">
      {options.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          onClick={() => onChange(id)}
          className="flex h-11 items-center gap-2 rounded-tag px-3 type-label text-ink-muted transition-colors duration-(--duration-fast) not-aria-pressed:hover:text-pen aria-pressed:bg-ink aria-pressed:text-paper"
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

/** ขอบและเงาของบัตรคำตอนชี้ หรือเมื่อ focus ลิงก์ใดในการ์ดด้วยคีย์บอร์ด (ผู้ใช้คีย์บอร์ดเห็นว่ากำลังอยู่ที่ใบไหนแบบเดียวกับเมาส์) */
const CARD =
  "card-tilt evidence-target surface-sheen relative rounded-card border border-rule bg-surface p-6 transition-[translate,transform,box-shadow,border-color] duration-(--duration-base) ease-out group-hover:-translate-y-1 group-hover:border-pen/40 group-hover:shadow-overlay has-[a:focus-visible]:-translate-y-1 has-[a:focus-visible]:border-pen/40 has-[a:focus-visible]:shadow-overlay motion-reduce:translate-y-0!";

/**
 * flagship: บัตรคำใบใหญ่ของโปรเจกต์ที่มี screenshot
 * wide (เต็มแถว): จอ lg รูปใหญ่ 3 ใน 5 ส่วนอยู่ข้างข้อความ / ครึ่งแถว: รูปอยู่ใต้ชื่อเสมอ
 * ทั้งใบคลิกได้ด้วย stretched link ของชื่อ ส่วนลิงก์รองอยู่ชั้นบนจึงยังกดแยกได้
 */
function CaseStudy({ project, wide }: { project: Project; wide: boolean }) {
  const tiltRef = useCardTilt<HTMLElement>();
  const layout = wide ? "grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-rows-[auto_1fr_auto]" : "grid-cols-1 grid-rows-[auto_auto_1fr_auto]";

  // แถวกลางเป็น 1fr: ถ้ารูปสูงกว่าข้อความ ที่ว่างไปอยู่ใต้ข้อความ ไม่ไปถ่างหัวบัตร
  return (
    <article id={`evidence-${project.id}`} ref={tiltRef} className={`${CARD} grid gap-x-8 ${layout}`}>
      <div className={wide ? "lg:col-start-1 lg:row-start-1" : ""}>
        <div className="border-b border-margin pb-2">
          <ProjectTitle project={project} rounded />
        </div>
        <ProjectMeta project={project} />
      </div>
      <ProjectShot
        project={project}
        stamp
        sizes={
          wide
            ? "(min-width: 64rem) 37.5rem, (min-width: 48rem) min(40rem, 100vw - 8.5rem), calc(100vw - 5rem)"
            : "(min-width: 64rem) 30rem, (min-width: 48rem) min(40rem, 100vw - 8.5rem), calc(100vw - 5rem)"
        }
        className={`mt-6 self-start ${wide ? "max-w-measure lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:max-w-none" : ""}`}
      />
      <ProjectFields project={project} className={`mt-6 ${wide ? "max-w-measure lg:col-start-1 lg:row-start-2" : ""}`} />
      <div className={`mt-6 flex flex-col gap-x-8 self-end border-t border-rule pt-4 ${wide ? "lg:col-span-2 lg:row-start-3 lg:flex-row lg:items-center lg:justify-between" : ""}`}>
        <TechStack tags={project.tags} />
        <ProjectLinks links={project.links} explore={project} className={`pt-2 ${wide ? "lg:shrink-0 lg:pt-0" : ""}`} />
      </div>
    </article>
  );
}

/**
 * การ์ดในตาราง bento: โปรเจกต์ที่ไม่มี screenshot หลัก แสดง desc พร้อมกราฟโต้ตอบได้ (labFigure) หรือแถบฟิล์มตัวอย่างรูป (FilmstripPeek)
 * กลุ่ม widget + tech stack + ลิงก์ อยู่ติดขอบล่างด้วย mt-auto การ์ดคู่ซ้าย-ขวาในแถวเดียวกันจึงมีระดับกล่อง widget และแถบลิงก์ตรงกันเป๊ะโดยไม่เหลือช่องว่างคั่นกลาง
 * wide (ใบเศษท้ายตารางที่กางเต็มแถว): แบ่ง 2 คอลัมน์บนจอ lg ให้ข้อความอยู่ซ้ายและ widget อยู่ขวา
 */
function BentoCard({ project, wide = false }: { project: Project; wide?: boolean }) {
  const tiltRef = useCardTilt<HTMLElement>();
  const { desc, marks, metric, labFigure } = project;
  const gallery = projectGallery[project.id];
  const widget = labFigure ? (
    <LabFigure figure={labFigure} />
  ) : gallery?.length ? (
    <FilmstripPeek project={project} />
  ) : null;

  if (wide && widget) {
    return (
      <article id={`evidence-${project.id}`} ref={tiltRef} className={`${CARD} grid gap-6 lg:grid-cols-2 lg:gap-8`}>
        <div className="flex flex-col">
          <div className="border-b border-margin pb-2">
            <ProjectTitle project={project} rounded />
          </div>
          <ProjectMeta project={project} />
          <p className="mt-4 max-w-measure type-body text-ink">
            <MarkedText text={desc} marks={marks} />
          </p>
          <div className="mt-auto pt-5">
            <TechStack tags={project.tags} className="border-t border-rule pt-4" />
            <ProjectLinks links={project.links} explore={project} className="pt-2" />
          </div>
        </div>
        <div className="self-center">{widget}</div>
      </article>
    );
  }

  return (
    <article id={`evidence-${project.id}`} ref={tiltRef} className={`${CARD} flex flex-col`}>
      <div>
        <div className="border-b border-margin pb-2">
          <ProjectTitle project={project} rounded />
        </div>
        <ProjectMeta project={project} />
        <p className="mt-4 max-w-measure type-body text-ink">
          <MarkedText text={desc} marks={marks} />
        </p>
        {metric && (
          <p className="mt-3 type-body text-ink">
            <ResultMark value={metric.value} /> {metric.label}
          </p>
        )}
      </div>
      <div className="mt-auto pt-5">
        {widget && <div className="mb-4">{widget}</div>}
        <div className="flex min-h-24 flex-col justify-between border-t border-rule pt-4">
          <TechStack tags={project.tags} />
          <ProjectLinks links={project.links} explore={project} className="pt-2" />
        </div>
      </div>
    </article>
  );
}

/**
 * แถบฟิล์มตัวอย่างรูปจาก projectGallery สำหรับโปรเจกต์ที่ไม่มี labFigure (เช่น SWU Run, BrainFit)
 * ชี้การ์ดแล้วแผ่นตัวอย่างยกขึ้นและเอียงสลับมุมเบา ๆ กดแล้วพาไปเปิดหน้า explore ของโปรเจกต์นั้น
 */
function FilmstripPeek({ project, className = "" }: { project: Project; className?: string }) {
  const shots = (projectGallery[project.id] ?? []).slice(0, 3);
  if (!shots.length) return null;
  const total = projectGallery[project.id]!.length;
  return (
    <div aria-hidden="true" className={`pointer-events-none grid gap-3 rounded-control border border-rule bg-paper p-3.5 print:hidden ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="type-caption font-medium text-ink">Dossier preview ({total} screens)</p>
        <span className="inline-flex h-7 items-center whitespace-nowrap rounded-tag border border-stroke bg-surface px-2.5 type-caption text-pen">
          Inspect →
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {shots.map((shot, i) => {
          const size = shot.portrait ? PORTRAIT_SIZE : SHOT_SIZE;
          const { src, srcSet } = mediaSources("projects", project.id, shot.file, size.width);
          const tilt = i % 2 === 0 ? "-1deg" : "1deg";
          return (
            <div
              key={shot.file}
              style={{ "--film-tilt": tilt }}
              className="film-thumb overflow-hidden rounded-tag border border-rule bg-surface p-1.5"
            >
              <img
                src={src}
                srcSet={srcSet}
                sizes="8rem"
                alt=""
                width={size.width}
                height={size.height}
                loading="lazy"
                decoding="async"
                className="aspect-[16/10] w-full rounded-tag object-cover object-top"
              />
              <p className="mt-1 truncate px-0.5 type-caption text-ink">{shot.caption}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** ปีล่าสุดก่อน ในปีเดียวกันคงลำดับของ data.ts (เจ้าของเรียงตามความสำคัญไว้แล้ว) */
// ไม่ใช้ Map.groupBy: Safari ก่อน 17.4 ไม่มี (เว็บยังรองรับ iOS 16)
const byYear = (list: Project[]) =>
  [...list]
    .sort((a, b) => (b.year ?? "").localeCompare(a.year ?? ""))
    .reduce((groups, p) => groups.set(p.year ?? "", [...(groups.get(p.year ?? "") ?? []), p]), new Map<string, Project[]>());

/**
 * Engineering ledger: ทุกโปรเจกต์เรียงตามปีแบบบรรทัดในสมุดบัญชี สำหรับ recruiter ที่อยากสแกนประวัติกับ tech stack เร็ว ๆ
 * แต่ละแถว: ชื่อ (ลิงก์ไปหน้า explore) + หมวด | tech stack | ลิงก์ภายนอก ไม่มีรูปและไม่ยก/เอียงตอนชี้: เป็นบรรทัดบนหน้ากระดาษ
 */
function Ledger({ projects: list }: { projects: Project[] }) {
  return (
    <div className="grid gap-10">
      {[...byYear(list)].map(([year, items]) => (
        // div ไม่ใช่ section: section ที่มีชื่อกลายเป็น landmark ทุกปี รายการ landmark ของ screen reader จะรก
        <div key={year}>
          <h3 className="flex items-baseline gap-3 border-b border-margin pb-2 type-title tabular-nums text-ink">
            {year}
            <span className="type-caption text-ink-muted">
              {items.length} {items.length === 1 ? "project" : "projects"}
            </span>
          </h3>
          <ul>
            {items.map((project) => (
              <li
                key={project.id}
                // คอลัมน์ลิงก์กว้างคงที่ (ไม่ใช่ auto): ทุกแถวเป็น grid แยกกัน ถ้ากว้างตามจำนวนลิงก์ คอลัมน์ tech จะเริ่มไม่ตรงกันแบบฟันปลา
                // px-4: พื้นตอนชี้ต้องมีขอบรอบข้อความ ถ้าไม่มี ชื่อกับลิงก์จะชิดขอบพื้นพอดี
                className="group relative grid gap-x-8 gap-y-3 border-b border-rule px-4 py-4 transition-colors duration-(--duration-fast) hover:bg-glow md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_15rem] lg:items-start"
              >
                <div>
                  <ProjectTitle project={project} hideYear level="h4" />
                  <p className="mt-1 type-small text-ink-muted">
                    {project.category}
                  </p>
                  {project.metric && (
                    <p className="mt-1 type-small text-ink">
                      <mark className="type-metric">{project.metric.value}</mark> {project.metric.label}
                    </p>
                  )}
                </div>
                <TechStack tags={project.tags} className="md:pt-1" />
                <ProjectLinks links={project.links} className="md:col-span-2 lg:col-span-1 lg:justify-end" />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** ชื่อโปรเจกต์ + ปี ชื่อเป็น "stretched link" ไปหน้า explore: ::after คลุมทั้งใบ/แถว → คลิกได้ทั้งหมด แต่ accessible name = ชื่อโปรเจกต์อย่างเดียว */
function ProjectTitle({
  project: { id, title, year },
  rounded = false,
  hideYear = false,
  level: Heading = "h3",
}: {
  project: Project;
  rounded?: boolean;
  hideYear?: boolean;
  /** Ledger ใช้ h4: ชื่อโปรเจกต์อยู่ใต้หัวปี (h3) */
  level?: "h3" | "h4";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <Heading className="type-title text-ink">
        <a
          href={projectPath(id)}
          onClick={onRouteClick}
          className={`decoration-pen decoration-2 underline-offset-4 outline-none group-hover:underline focus-visible:underline after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus ${rounded ? "after:rounded-card" : ""}`}
        >
          {title}
        </a>
      </Heading>
      {year && !hideYear && <span className="type-caption tabular-nums text-ink-muted">{year}</span>}
    </div>
  );
}

function ProjectMeta({ project: { category, context } }: { project: Project }) {
  // " — " คั่นสองกลุ่ม: ในกลุ่มเองใช้ " · " อยู่แล้ว (เช่น "DOH Hackathon · Team of 2") ถ้าใช้ "," จะแบ่งกลุ่มคำผิด
  const meta = [category, context].filter(Boolean).join(" — ");
  return meta ? <p className="mt-2 type-small text-ink-muted">{meta}</p> : null;
}

/**
 * problem → approach → result ของการ์ด flagship เมื่อมีทั้ง problem และ approach ถ้าไม่ครบแสดง desc (ไม่มีป้าย) แทน แล้วต่อด้วยผลลัพธ์
 * แต่ละช่องเป็นกล่องแยกพร้อมไอคอน สีขอบบอกบทบาทตามความหมายเดิมของสี
 * — Problem = แดง margin (ของที่ครูวงไว้), Approach = หมึกกลาง, Result = ปากกาเน้น (หลักฐาน) ไม่ใช้ pen เพราะ pen แปลว่ากดได้
 * metric ในช่อง Result เป็นตัวหนาธรรมดา: ตราประทับบนรูปคือปากกาเน้นจุดเดียวของการ์ด (กติกา 1 จุดต่อการ์ด)
 */
function ProjectFields({ project, className = "" }: { project: Project; className?: string }) {
  const { desc, problem, approach, result, metric, marks } = project;
  return (
    <dl className={`grid content-start gap-2 ${className}`}>
      {problem && approach ? (
        <>
          <Field label="Problem" tone="problem"><MarkedText text={problem} marks={marks} /></Field>
          <Field label="Approach" tone="approach"><MarkedText text={approach} marks={marks} /></Field>
        </>
      ) : (
        <p className="type-body text-ink"><MarkedText text={desc} marks={marks} /></p>
      )}
      {(metric || result) && (
        <Field label="Result" tone="result">
          {metric && <span className="type-metric">{metric.value}</span>} {metric?.label}
          {result && <span className="block"><MarkedText text={result} marks={marks} /></span>}
        </Field>
      )}
    </dl>
  );
}

export function TechStack({ tags, className = "" }: { tags: string[]; className?: string }) {
  return (
    <ul aria-label="Tech stack" className={`flex flex-wrap gap-x-4 gap-y-2 type-small text-ink ${className}`}>
      {groupByFamily(tags).map(({ family, names }) => (
        // items-start + mt: สัญลักษณ์อยู่ตรงบรรทัดแรกเสมอ แม้รายชื่อยาวจนขึ้นบรรทัดใหม่ ((20px − 10px) / 2 = 5px)
        <li key={family ?? "other"} className="flex items-start gap-1">
          {family && <SkillMarker family={family} className="mt-[5px]" />}
          {family && <span className="sr-only">{familyLabel(family)}: </span>}
          {names.join(", ")}
        </li>
      ))}
    </ul>
  );
}

/** explore: ใส่บนการ์ด → ปุ่ม Explore นำหน้าลิงก์ภายนอก (หน้า explore เองไม่ใส่ เพราะคือหน้านั้นอยู่แล้ว) */
export function ProjectLinks({ links, explore, className }: { links: Project["links"]; explore?: Project; className: string }) {
  return (
    // z-10 ให้อยู่เหนือ ::after ของ stretched link → ลิงก์รองยังกดได้
    <div className={`relative z-10 flex flex-wrap items-center gap-x-6 gap-y-2 ${className}`}>
      {explore && (
        // ปุ่มรองแบบมีขอบ (btn-ink): ต่างจากลิงก์ขีดเส้นใต้ข้างๆ ที่ออกไปเว็บอื่น ปุ่มนี้อยู่ในเว็บนี้
        <a
          href={projectPath(explore.id)}
          onClick={onRouteClick}
          className="btn-ink inline-flex h-11 items-center gap-1 rounded-control border border-stroke bg-surface pl-4 pr-3 type-label text-ink"
        >
          Explore<span className="sr-only"> {explore.title}</span>
          <ChevronRightIcon className="size-4" />
        </a>
      )}
      {links.map((link) => (
        <a
          key={link.href}
          {...linkProps(link.href)}
          className="inline-flex min-h-11 items-center gap-1 type-label text-pen underline underline-offset-3 transition-colors duration-(--duration-fast) hover:text-pen-hover"
        >
          <LinkContent {...link} />
        </a>
      ))}
    </div>
  );
}

/** ไอคอน + ชื่อของลิงก์ภายนอก + hint แท็บใหม่ ใช้ร่วมกับปุ่มในหน้า explore */
export function LinkContent({ kind, href }: ProjectLink) {
  const { label, Icon } = LINKS[kind];
  return (
    <>
      <Icon className="size-4" />
      {label}
      <NewTabHint href={href} />
    </>
  );
}

/**
 * screenshot ของงานจริงในกรอบหน้าต่างเบราว์เซอร์ (จุดสามจุด + แถบที่อยู่ของ demo): บอกว่าเป็นเว็บที่เปิดใช้ได้ ไม่ใช่ภาพประกอบ
 * ชี้การ์ดแล้วหน้าต่าง "ตื่น": จุดติดสีปากกาสามด้าม ขอบกับ host เข้มขึ้น และรูปขยาย 2% (shot-zoom) ภายในกรอบ
 * stamp: ตัวเลขผลลัพธ์ (metric) เป็นตราประทับผลการทดลองที่มุมรูป ซ่อนจาก screen reader เพราะช่อง Result อ่านค่าเดียวกันอยู่แล้ว
 * pointer-events-none: รูปอยู่ชั้นบนของ stretched link การคลิกต้องทะลุไปถึงลิงก์ของการ์ด
 * ไม่พิมพ์: หน้าพิมพ์เป็นเอกสารข้อความ และ screenshot สีเปลืองหมึก
 */
export function ProjectShot({
  project: { id, links, metric },
  shot,
  stamp = false,
  sizes,
  className,
}: {
  project: Project;
  /** ไม่ใส่ = screenshot หลักใน projectMedia (หน้า explore ส่งรูป hero จาก projectGallery มาแทนได้) */
  shot?: { file: string; alt: string };
  stamp?: boolean;
  sizes: string;
  className: string;
}) {
  const { file, alt } = shot ?? { file: id, alt: projectMedia[id].alt };
  const { src, srcSet } = mediaSources("projects", id, file, SHOT_SIZE.width);
  const demo = links.find((link) => link.kind === "demo");
  return (
    <figure className={`pointer-events-none relative overflow-hidden rounded-control border border-rule bg-paper transition-colors duration-(--duration-base) group-hover:border-stroke group-has-[a:focus-visible]:border-stroke print:hidden ${className}`}>
      <div aria-hidden="true" className="surface-sheen relative z-10 flex h-7 items-center gap-1.5 border-b border-rule bg-surface px-3">
        <span className="size-2 rounded-full bg-stroke/50 transition-colors duration-(--duration-base) group-hover:bg-margin group-has-[a:focus-visible]:bg-margin" />
        <span className="size-2 rounded-full bg-stroke/50 transition-colors duration-(--duration-base) group-hover:bg-marker group-has-[a:focus-visible]:bg-marker" />
        <span className="size-2 rounded-full bg-stroke/50 transition-colors duration-(--duration-base) group-hover:bg-pen group-has-[a:focus-visible]:bg-pen" />
        {demo && (
          <span className="mx-auto min-w-0 truncate rounded-tag border border-rule bg-paper px-3 type-caption text-ink-muted transition-colors duration-(--duration-base) group-hover:text-ink group-has-[a:focus-visible]:text-ink">
            {new URL(demo.href).host}
          </span>
        )}
      </div>
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={SHOT_SIZE.width}
        height={SHOT_SIZE.height}
        loading="lazy"
        decoding="async"
        className="shot-zoom aspect-[16/10] w-full object-cover object-top"
      />
      {stamp && metric && (
        // ตราประทับเอียงนิดหนึ่งแบบปั๊มด้วยมือ: เอียงด้วย rotate (transform) ไม่กระทบ layout
        <span
          aria-hidden="true"
          className="absolute right-3 bottom-3 z-10 flex max-w-44 -rotate-3 flex-col rounded-control border-2 border-on-marker/70 bg-marker px-3 py-1.5 text-on-marker"
        >
          <span className="type-metric text-24 leading-none">{metric.value}</span>
          <span className="mt-1 type-caption">{metric.label}</span>
        </span>
      )}
    </figure>
  );
}

type Tone = "problem" | "approach" | "result";
/** พื้นจางมากของแต่ละสี: ข้อความ ink บนพื้นนี้ยังเกิน 11.5:1 ทั้งสองโหมด ขอบซ้ายเป็นตัวบอกบทบาทหลัก */
const TONES: Record<Tone, { box: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  problem: { box: "border-margin bg-margin/6", Icon: ProblemIcon },
  approach: { box: "border-stroke bg-ink/4", Icon: BeakerIcon },
  result: { box: "border-marker bg-marker/12", Icon: CheckIcon },
};

/** กล่องหนึ่งช่องของ lab card: หัวข้อ (sans 600 สีรอง + ไอคอน) ซ้อนบนเนื้อหา คอลัมน์ข้อความใช้ความกว้างเต็มที่ */
function Field({ label, tone, children }: { label: string; tone: Tone; children: ReactNode }) {
  const { box, Icon } = TONES[tone];
  return (
    <div className={`rounded-control border-l-2 px-3 py-2 ${box}`}>
      <dt className="flex items-center gap-1 type-label text-ink-muted">
        <Icon className="size-4" />
        {label}
      </dt>
      <dd className="mt-1 type-body text-ink">{children}</dd>
    </div>
  );
}

/** ตัวเลขผลลัพธ์: ปากกาเน้นขีดผ่านครั้งแรกที่การ์ดเข้ามาในจอ (สั้นกว่าใน hero คือ --duration-slow: คนอ่านกำลังเลื่อนผ่าน ไม่ได้รอดู) */
export function ResultMark({ value, className = "type-metric" }: { value: string; className?: string }) {
  const [ref, seen] = useInViewOnce<HTMLElement>();
  const style: CSSProperties = { "--swipe-duration": "var(--duration-slow)" };
  return (
    <mark ref={ref} style={style} className={`${className} ${seen ? "mark-swipe" : "mark-pending"}`}>
      <CountUp value={value} start={seen} />
    </mark>
  );
}
