import { m } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { PORTRAIT_SIZE, SHOT_SIZE, projectGallery, projectMedia } from "../config/projectMedia";
import { familyLabel, groupByFamily } from "../config/skillFamilies";
import { profile, projects, type Project } from "../data";
import { linkProps } from "../lib/links";
import { fieldPhotos, mediaSources } from "../lib/media";
import { navigate, onRouteClick, projectPath, useProjectRoute } from "../lib/route";
import { LinkContent, ProjectShot, ResultMark } from "../sections/ProjectsSection";
import LabFigure from "./LabFigure";
import Lightbox, { PlayBadge } from "./Lightbox";
import MarkedText from "./MarkedText";
import NewTabHint from "./NewTabHint";
import SkillLogo from "./SkillLogo";
import SkillMarker from "./SkillMarker";
import { ChevronLeftIcon, ChevronRightIcon, TradeOffIcon } from "./icons";

const HOME_TITLE = document.title;
const TITLE_ID = "project-page-title";

/** ปิดหน้า: เข้ามาจากหน้าแรก → ย้อน history (ปุ่ม back กับปุ่มนี้จึงพาไปที่เดียวกัน) / เปิดลิงก์ตรง → แทนที่ URL ด้วยหน้าแรก */
function closePage() {
  if (history.state?.fromHome) history.back();
  else navigate("/#projects", { replace: true, transition: true });
}

/** โปรเจกต์ก่อน/ถัดไปแบบวนรอบ: ปุ่ม pager กับคีย์ลัด ←/→ ต้องพาไปที่เดียวกัน */
function neighbor(project: Project, step: 1 | -1) {
  return projects[(projects.indexOf(project) + step + projects.length) % projects.length];
}

/**
 * หน้า explore ของโปรเจกต์ (/projects/<id>): <dialog> เต็มจอที่เปิดทับหน้าแรก ไม่ได้แทนที่หน้าแรก
 * หน้าแรกจึงไม่ unmount: ปิดแล้วกลับมาที่ตำแหน่งเลื่อนเดิม focus กลับไปที่การ์ดที่กด และ scroll-spy ของ navbar ยังทำงาน
 * showModal ให้ trap focus, Esc และ inert พื้นหลังมาฟรีแบบเดียวกับ command palette
 */
export default function ProjectPage() {
  const id = useProjectRoute();
  const project = projects.find((p) => p.id === id);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // id ที่ไม่มีจริง (ลิงก์เก่า/พิมพ์ผิด) → หน้าแรก แทนที่จะเป็นหน้าว่าง
  useEffect(() => {
    if (id && !project) navigate("/", { replace: true });
  }, [id, project]);

  // layout effect: navigate() ใช้ flushSync และหวังว่า dialog ปิดเสร็จก่อนมันคืนค่า (ดู lib/route.ts)
  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    if (project && !dialog.open) dialog.showModal();
    if (!project && dialog.open) dialog.close();
    document.title = project ? `${project.title} — ${profile.firstName} ${profile.lastName}` : HOME_TITLE;
    // เปิดหรือเปลี่ยนไปโปรเจกต์ถัดไป → เริ่มอ่านจากบนสุด และ focus ที่ชื่อโปรเจกต์ (screen reader อ่านชื่อ, Tab ถัดไปเริ่มที่เนื้อหา)
    // ไม่ปล่อยให้ showModal focus ปุ่มแรกเอง: ปุ่ม All projects จะมีวง focus ค้างตั้งแต่เปิด และกด Next แล้ว focus หลุดไปที่ body
    dialog.scrollTop = 0;
    document.getElementById(TITLE_ID)?.focus({ preventScroll: true });
  }, [project]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={TITLE_ID}
      data-project-page
      // Esc: ให้ URL เป็นตัวกำหนดว่าเปิดหรือปิด (ไม่ให้ dialog ปิดเองแล้ว URL ค้างที่ /projects/...)
      // cancel ของ dialog ข้างใน (lightbox ของ Gallery) ถูก React ส่งต่อขึ้นมาถึงที่นี่ด้วย: Esc ตรงนั้นต้องปิดแค่ lightbox
      onCancel={(e) => {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        closePage();
      }}
      // ←/→ เปลี่ยนโปรเจกต์: ข้ามเมื่อกดคู่ modifier (ปุ่มลัดของเบราว์เซอร์/ระบบ), อยู่ใน lightbox ข้างใน (มันใช้ลูกศรเลื่อนรูปเอง) หรือช่องพิมพ์
      onKeyDown={(e) => {
        const step = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
        if (!step || !project || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        const target = e.target as Element;
        if (target.closest("dialog") !== e.currentTarget) return;
        if (target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return;
        e.preventDefault();
        navigate(projectPath(neighbor(project, step).id), { replace: true, transition: true });
      }}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-y-auto overscroll-contain border-0 bg-paper p-0 text-ink"
    >
      {project && <ProjectArticle key={project.id} project={project} />}
    </dialog>
  );
}

/**
 * แฟ้มรายงานของโปรเจกต์: หัวรายงาน (ชื่อ + แถบข้อมูล + ปุ่ม) → screenshot → บัตรดัชนีข้างจอ + เนื้อหา
 * บัตรดัชนีมาก่อนเนื้อหาใน DOM: มือถืออ่าน tech stack ต่อจากรูปเลย จอ lg ย้ายไปคอลัมน์ขวาและติดจอ
 */
function ProjectArticle({ project }: { project: Project }) {
  const { id, title, category, explore } = project;
  const index = projects.indexOf(project);
  // รูปใหญ่บนสุด: screenshot หลัก หรือรูป hero จาก gallery ของโปรเจกต์ที่ไม่ได้เป็น case study บนหน้าแรก
  // โปรเจกต์ที่มีรูปบนสุดแล้ว: หน้าจอแนวนอนอื่นใน gallery สลับดูในกรอบเดียวกันได้ (และไม่ซ้ำใน Gallery ข้างล่าง)
  // โปรเจกต์ที่ไม่มี (peak, employment-gap): กราฟจาก notebook ไม่ใช่หน้าเว็บ จึงไม่ใส่กรอบเบราว์เซอร์ อยู่ใน Gallery ตามเดิม
  const gallery = projectGallery[id] ?? [];
  const lead = id in projectMedia ? { file: id, alt: projectMedia[id].alt, caption: "Main screen" } : gallery.find((shot) => shot.hero);
  const landscapeShots = lead ? [lead, ...gallery.filter((shot) => !shot.portrait && !shot.hero)] : [];
  const [activeShotIndex, setActiveShotIndex] = useState(0);
  const currentShot = landscapeShots[activeShotIndex] ?? landscapeShots[0];
  const demo = project.links.find((link) => link.kind === "demo");

  return (
    <div className="relative min-h-full">
      <div aria-hidden="true" className="margin-line" />
      {/* แถบบนติดหัวจอ: ปุ่มกลับต้องกดได้เสมอแม้อ่านลงไปลึกแล้ว */}
      <div className="sticky top-0 z-20 border-b border-rule bg-paper/90 backdrop-blur-sm">
        <div className="page-container flex h-16 items-center justify-between gap-4">
          <button
            type="button"
            onClick={closePage}
            className="btn-icon -ml-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 type-label text-pen transition-colors duration-(--duration-fast) hover:text-pen-hover"
          >
            <ChevronLeftIcon className="size-4" />
            All projects
          </button>
          <p className="type-caption tabular-nums text-ink-muted">
            <span className="sr-only">Project {index + 1} of {projects.length}</span>
            <span aria-hidden="true">
              {String(index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
            </span>
          </p>
        </div>
      </div>

      {/* เลื่อนขึ้นเบาๆ ตอนเปิด: transform กับ opacity ไม่กระทบ layout และ MotionConfig ปิดให้เองถ้าผู้ใช้ตั้ง reduce motion */}
      <m.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="page-container pb-16 pt-10 md:pt-16"
      >
        <header>
          <p className="type-label text-ink-muted">{category}</p>
          <h1 id={TITLE_ID} tabIndex={-1} className="mt-2 border-b border-margin pb-3 type-headline text-ink outline-none">
            {title}
          </h1>
          <MetaStrip project={project} />
          <ActionLinks links={project.links} className="mt-6" />
        </header>

        {currentShot && (
          <div className="mt-8">
            {landscapeShots.length > 1 && (
              <div
                role="group"
                aria-label="Switch preview screen"
                className="mb-3 flex flex-wrap items-center gap-1.5 print:hidden"
              >
                {landscapeShots.map((shot, i) => (
                  <button
                    key={shot.file}
                    type="button"
                    aria-pressed={i === activeShotIndex}
                    onClick={() => setActiveShotIndex(i)}
                    className="min-h-11 rounded-control border border-stroke bg-surface px-3 py-1 type-caption text-ink transition-colors duration-(--duration-fast) not-aria-pressed:hover:border-pen not-aria-pressed:hover:text-pen aria-pressed:border-pen aria-pressed:bg-pen aria-pressed:text-on-pen"
                  >
                    {shot.caption}
                  </button>
                ))}
              </div>
            )}
            {/* group: กรอบหน้าต่างเบราว์เซอร์ "ตื่น" ตอนชี้แบบเดียวกับบนการ์ด
                มี demo = กดรูปแล้วเปิดเว็บจริง (ProjectShot เป็น pointer-events-none คลิกจึงตกที่ลิงก์ที่ครอบอยู่) */}
            {demo ? (
              <a {...linkProps(demo.href)} className="group relative block rounded-tag">
                <span className="sr-only">Open the live demo: </span>
                <ProjectShot project={project} shot={currentShot} sizes="(min-width: 75rem) 70rem, calc(100vw - 2rem)" className="" />
                <ShotFade />
                <NewTabHint href={demo.href} />
              </a>
            ) : (
              <div className="group relative">
                <ProjectShot project={project} shot={currentShot} sizes="(min-width: 75rem) 70rem, calc(100vw - 2rem)" className="" />
                <ShotFade />
              </div>
            )}
          </div>
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <IndexCard project={project} />

          <div className="grid max-w-measure content-start gap-12 lg:col-start-1 lg:row-start-1">
            {/* หัวข้อซ่อน: บัตรดัชนีมาก่อนใน DOM คนที่กระโดดตามหัวข้อจะข้ามเนื้อหาหลักไป My role ถ้าส่วนนี้ไม่มีหัวข้อ */}
            <section className="grid gap-8">
              <h2 className="sr-only">Overview</h2>
              {explore?.overview && <p className="type-lead text-ink">{explore.overview}</p>}
              <RecordTable project={project} />
            </section>
            <Outcome project={project} />
            {explore?.role && (
              <Block title="My role">
                <p className="type-body text-ink">{explore.role}</p>
              </Block>
            )}
            {explore?.features?.length ? (
              <Block title="Key features">
                <ul className="grid list-disc gap-2 pl-6 type-body text-ink marker:text-ink-muted">
                  {explore.features.map((item) => (
                    <li key={item} className="pl-1">
                      {item}
                    </li>
                  ))}
                </ul>
              </Block>
            ) : null}
            {explore?.howItWorks?.length ? (
              <Block title="How it works">
                <Pipeline steps={explore.howItWorks} />
              </Block>
            ) : null}
            {explore?.decisions?.length ? (
              <Block title="Technical decisions">
                <Decisions items={explore.decisions} />
              </Block>
            ) : null}
          </div>
        </div>

        <Gallery project={project} exclude={new Set(landscapeShots.map((shot) => shot.file))} />

        <nav aria-label="Other projects" className="mt-16 border-t border-rule pt-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <PagerLink project={neighbor(project, -1)} direction="Previous" />
            <PagerLink project={neighbor(project, 1)} direction="Next" />
          </div>
          {/* บอกคีย์ลัดเฉพาะเครื่องที่มีเมาส์/ทัชแพด (คนใช้จอสัมผัสไม่มีลูกศร) screen reader ได้จาก aria-keyshortcuts ของลิงก์แทน */}
          <p aria-hidden="true" className="mt-3 hidden type-caption text-ink-muted pointer-fine:block">
            ← / → to switch projects
          </p>
        </nav>
      </m.article>
    </div>
  );
}

/** ไล่ขอบล่างของ screenshot ให้กลืนกับกระดาษ: ตกแต่งล้วน ไม่มีข้อความทับรูป (contrast บนรูปเดาไม่ได้) */
function ShotFade() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 rounded-b-tag bg-linear-to-t from-paper to-transparent print:hidden"
    />
  );
}

/**
 * แถบข้อมูลใต้ชื่อแบบหัวกระดาษรายงาน: ปี + context ที่แยกเป็นช่อง
 * context ใน data.ts เขียนเป็น "งาน · ทีม · บทบาท" (ส่วนทีมขึ้นต้นด้วย Team of / Solo) จึงแยกช่องได้โดยไม่ต้องเพิ่ม field
 * ไม่มีส่วนทีม = ทั้งข้อความเป็นช่อง Context ช่องเดียว จะไม่เดาว่าส่วนไหนคือบทบาท
 */
function metaFields({ year, context }: Pick<Project, "year" | "context">): [string, string][] {
  const fields: [string, string][] = year ? [["Year", year]] : [];
  if (!context) return fields;
  const parts = context.split(" · ");
  const team = parts.findIndex((part) => /^(Team of|Solo)/.test(part));
  if (team === -1) return [...fields, ["Context", context]];
  const before = parts.slice(0, team).join(" · ");
  const after = parts.slice(team + 1).join(" · ");
  if (before) fields.push(["Context", before]);
  fields.push(["Team", parts[team].replace(/^Team of (\d+)$/, "$1 people").replace(/^Solo.*/, "Solo")]);
  if (after) fields.push(["Role", after]);
  return fields;
}

function MetaStrip({ project }: { project: Project }) {
  const fields = metaFields(project);
  if (!fields.length) return null;
  return (
    // ป้ายแบบตรายางบนแฟ้ม: กรอบบางบนบัตรขาว แยกช่องให้กวาดตาอ่านได้ทีละค่า
    <dl className="mt-4 flex flex-wrap gap-2">
      {fields.map(([label, value]) => (
        <div key={label} className="rounded-tag border border-rule bg-surface px-3 py-1.5">
          <dt className="type-caption text-ink-muted">{label}</dt>
          <dd className="type-small tabular-nums text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** ลิงก์แรกเป็นปุ่มหลักสี pen (data.ts: ลิงก์แรก = ลิงก์หลัก) ที่เหลือเป็นปุ่มรองแบบหมึกไหล */
function ActionLinks({ links, className }: { links: Project["links"]; className: string }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {links.map((link, i) => (
        <a
          key={link.href}
          {...linkProps(link.href)}
          className={
            i === 0
              ? "inline-flex h-11 items-center gap-2 rounded-control bg-pen px-4 type-label text-on-pen btn-lift hover:bg-pen-hover"
              : "btn-ink inline-flex h-11 items-center gap-2 rounded-control border border-stroke bg-surface px-4 type-label text-ink"
          }
        >
          <LinkContent {...link} />
        </a>
      ))}
    </div>
  );
}

/**
 * บัตรดัชนี: tech stack และลิงก์ ติดข้างจอ (lg) ระหว่างอ่านเนื้อหาซ้าย ผลลัพธ์อยู่ใน Outcome ที่เดียว (ปากกาเน้นมีจุดเดียวต่อหน้า)
 * ติดจอเฉพาะเมื่อจอสูงพอให้เห็นทั้งใบ ไม่อย่างนั้นท้ายบัตรถูกตัดจนเลื่อนถึงท้ายเนื้อหา
 * overflow-clip ไม่ใช่ overflow-hidden: hidden ทำให้บัตรเป็นตัวเลื่อน แถบ progress (scroll(nearest)) จะจับบัตรแทน dialog
 */
function IndexCard({ project: { title, tags, links } }: { project: Project }) {
  return (
    <aside
      aria-label="Project summary"
      className="relative self-start overflow-clip rounded-card border border-rule bg-surface p-6 lg:col-start-2 lg:row-start-1 lg:[@media(min-height:46rem)]:sticky lg:[@media(min-height:46rem)]:top-24"
    >
      {/* ความคืบหน้าการอ่านหน้านี้: มีความหมายเฉพาะตอนบัตรติดจอ (จอเล็กบัตรเลื่อนหายไปพร้อมเนื้อหา) */}
      <span aria-hidden="true" className="hidden lg:[@media(min-height:46rem)]:block">
        <span className="dossier-progress" />
      </span>
      <h2 className="border-b border-margin pb-2 type-title text-ink">At a glance</h2>
      <CardBlock label="Tech stack">
        <ul aria-label={`Tech stack of ${title}`} className="mt-3 grid gap-3">
          {groupByFamily(tags).map(({ family, names }) => (
            // สัญลักษณ์หมวดนำหน้ากลุ่มครั้งเดียว logo อยู่หน้าชื่อแต่ละตัว (ตัวที่ไม่มี logo ไม่เว้นช่อง เพราะเรียงต่อกันในบรรทัด)
            <li key={family ?? "other"} className="flex items-start gap-2">
              {family && <SkillMarker family={family} className="mt-[5px] shrink-0" />}
              {family && <span className="sr-only">{familyLabel(family)}: </span>}
              <ul className="flex flex-wrap gap-x-3 gap-y-1 type-small text-ink">
                {names.map((name) => (
                  <li key={name} className="inline-flex items-center gap-1">
                    <SkillLogo name={name} className="size-4" />
                    {name}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </CardBlock>
      {/* ลิงก์ซ้ำกับปุ่มใต้ชื่อ: มีไว้เฉพาะจอ lg ที่บัตรติดจอ อ่านลึกแล้วยังกดได้โดยไม่ต้องเลื่อนกลับขึ้นไป */}
      <CardBlock label="Links" className="hidden lg:block">
        <ul className="mt-1">
          {links.map((link) => (
            <li key={link.href}>
              <a
                {...linkProps(link.href)}
                className="inline-flex min-h-11 items-center gap-2 type-label text-pen underline underline-offset-3 transition-colors duration-(--duration-fast) hover:text-pen-hover"
              >
                <LinkContent {...link} />
              </a>
            </li>
          ))}
        </ul>
      </CardBlock>
    </aside>
  );
}

function CardBlock({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <section className={`mt-4 border-t border-rule pt-4 first-of-type:border-t-0 ${className}`}>
      <h3 className="type-label text-ink-muted">{label}</h3>
      {children}
    </section>
  );
}

/**
 * Problem / Approach แบบตารางบันทึกผล: ป้ายอยู่คอลัมน์ซ้าย เนื้อหาขวา คั่นแถวด้วยเส้นบรรทัด (จอเล็กป้ายซ้อนบนเนื้อหา)
 * ไม่มี Result ที่นี่: ผลลัพธ์อยู่ใน Outcome ถัดไป ไม่ไฮไลต์ซ้ำสองที่
 */
function RecordTable({ project: { desc, problem, approach, marks } }: { project: Project }) {
  if (!problem || !approach) {
    return (
      <p className="type-body text-ink">
        <MarkedText text={desc} marks={marks} />
      </p>
    );
  }
  const rows: [string, string][] = [
    ["Problem", problem],
    ["Approach", approach],
  ];
  return (
    <dl className="border-t border-rule">
      {rows.map(([label, text]) => (
        <div key={label} className="grid gap-1 border-b border-rule py-4 md:grid-cols-[7rem_minmax(0,1fr)] md:gap-6">
          <dt className="type-label text-ink-muted">{label}</dt>
          <dd className="type-body text-ink">
            <MarkedText text={text} marks={marks} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * การ์ดผลลัพธ์: ตัวเลขที่วัดได้ (metric) และสรุปผล (result) จาก data.ts เท่านั้น ไม่มีทั้งสองอย่าง = ไม่แสดง
 * ชื่อเป็นคำกลางเพราะ result มีหลายชนิด (อันดับในงานแข่ง จำนวนผู้ใช้ ผลสำรวจ) มีแค่ metric ที่เป็นผลวัดจริง จึงมีป้าย Measured เฉพาะแถวนั้น
 * บรรทัดที่มา: ใบเซอร์ (หลักฐานของผลงานแข่ง) หรือ notebook/repo เฉพาะเมื่อมี metric เพราะ repo พิสูจน์ตัวเลขที่วัดได้
 * แต่ไม่ได้พิสูจน์อันดับในงานแข่งหรือจำนวนผู้ใช้ ไม่มีหลักฐานที่ตรง = ไม่แสดงบรรทัดนี้
 */
function Outcome({ project: { year, metric, result, marks, links, labFigure } }: { project: Project }) {
  if (!metric && !result && !labFigure) return null;
  const source =
    links.find((link) => link.kind === "certificate") ?? (metric ? links.find((link) => link.kind === "notebook" || link.kind === "code") : undefined);
  return (
    <section aria-labelledby="outcome-title" className="rounded-card border border-rule bg-surface p-6">
      <div className="flex items-baseline justify-between gap-4 border-b border-margin pb-2">
        <h2 id="outcome-title" className="type-title text-ink">
          Outcome
        </h2>
        {year && <p className="type-caption tabular-nums text-ink-muted">{year}</p>}
      </div>
      {(metric || result) && (
        <dl className="mt-4 grid gap-4">
          {metric && (
            <div>
              <dt className="type-label text-ink-muted">Measured</dt>
              <dd className="mt-1">
                <ResultMark value={metric.value} className="type-headline tabular-nums" />
                <span className="mt-1 block type-small text-ink-muted">{metric.label}</span>
              </dd>
            </div>
          )}
          {result && (
            <div>
              <dt className="type-label text-ink-muted">Result</dt>
              <dd className="mt-1 type-body text-ink">
                <MarkedText text={result} marks={marks} />
              </dd>
            </div>
          )}
        </dl>
      )}
      {labFigure && <LabFigure figure={labFigure} className="mt-4" />}
      {source && (
        <p className="mt-3 flex flex-wrap items-center gap-x-1 border-t border-rule pt-2 type-caption text-ink-muted">
          Source:
          <a
            {...linkProps(source.href)}
            className="inline-flex min-h-11 items-center gap-1 text-pen underline underline-offset-3 transition-colors duration-(--duration-fast) hover:text-pen-hover"
          >
            <LinkContent {...source} />
          </a>
        </p>
      )}
    </section>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 type-title text-ink">{title}</h2>
      {children}
    </section>
  );
}

/**
 * ขั้นตอนตามลำดับที่ข้อมูลไหลจริง: เลขขั้นในกรอบเล็ก ต่อกันด้วยเส้นแนวตั้งแบบ pipeline
 * ยังเป็น <ol> (role="list": Safari ตัดความเป็นรายการทิ้งเมื่อไม่มี list-style) screen reader จึงอ่านลำดับเอง เลขในกรอบเป็นของตกแต่ง
 * pt-1: บรรทัดแรกของข้อความ (24px) อยู่กลางกรอบเลข (32px)
 * pipeline-step (index.css): ขั้นที่ผ่านกลางจอเปลี่ยนกรอบเลขเป็นสี pen และเส้นเชื่อมสี pen ยืดตามการเลื่อน ด้วย CSS ล้วน
 */
function Pipeline({ steps }: { steps: string[] }) {
  return (
    <ol role="list" className="grid">
      {steps.map((step, i) => (
        <li key={step} className="pipeline-step relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 pb-6 last:pb-0">
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 bg-rule">
              <span className="pipeline-fill" />
            </span>
          )}
          <span
            aria-hidden="true"
            className="pipeline-num flex size-8 items-center justify-center rounded-control border border-rule bg-surface type-label tabular-nums text-ink"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="pt-1 type-body text-ink">{step}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * คำเชื่อมที่แยก "ทางเลือก" กับ "เหตุผล" ในประโยคของ data.ts ได้โดยไม่ต้องแต่งคำ
 * ไม่มี ", which ": คำหลัง which อาจเป็นประธานของอีกประโยค ("which the notebook notes is to …") ตัดแล้วเหตุผลอ่านผิด
 */
const DECISION_CONNECTORS = [", because ", " because ", " so ", ", to "];

/**
 * แยกประโยคที่คำเชื่อมแรกสุด ตัวอักษรเดิมทุกตัว (ไม่เปลี่ยนตัวพิมพ์ ไม่เติมคำ) ตัดแค่คำเชื่อมออก
 * ส่วนทางเลือกที่ลงท้ายด้วยเครื่องหมาย (", so ") = คำเชื่อมจริงยาวกว่าที่รู้จัก ไม่แยก: ไม่อย่างนั้นเหลือจุลภาคค้างท้าย
 */
function splitDecision(text: string): [string, string] | null {
  let at = -1;
  let connector = "";
  for (const c of DECISION_CONNECTORS) {
    const i = text.indexOf(c);
    if (i > 0 && (at === -1 || i < at)) [at, connector] = [i, c];
  }
  if (at === -1) return null;
  const decision = text.slice(0, at);
  const why = text.slice(at + connector.length);
  return why && !/[,;:]$/.test(decision) ? [decision, why] : null;
}

/** ทางเลือกทางเทคนิคเป็นบัตรคำ: ทางเลือก (หัวบัตรเส้นแดง) + เหตุผล ประโยคที่แยกไม่ได้เป็นบัตรช่องเดียว ไม่แต่งเหตุผลเพิ่ม */
function Decisions({ items }: { items: string[] }) {
  return (
    <ul role="list" className="grid gap-4">
      {items.map((item) => {
        const parts = splitDecision(item);
        return (
          <li key={item} className="rounded-card border border-rule bg-surface p-5">
            <dl className="grid gap-3">
              {/* ลูกของ <dl> ต้องเป็น dt/dd หรือ div ที่มีแค่ dt/dd: ไอคอนจึงอยู่ใน dt แล้วลอยไปช่องซ้าย (div ซ้อนทำให้ screen reader ไม่จับคู่คำกับความหมาย) */}
              <div className={`relative pl-8 ${parts ? "border-b border-margin pb-3" : ""}`}>
                <dt className="type-label text-ink-muted">
                  <TradeOffIcon className="absolute top-0.5 left-0 size-5" />
                  Decision
                </dt>
                <dd className="mt-1 type-body text-ink">{parts ? parts[0] : item}</dd>
              </div>
              {parts && (
                <div className="pl-8">
                  <dt className="type-label text-ink-muted">Why</dt>
                  {/* ตัดมาจากกลางประโยคจึงขึ้นต้นด้วยตัวเล็ก: ทำตัวแรกให้ใหญ่ตอนแสดงผลเท่านั้น ข้อความใน data.ts ไม่เปลี่ยน */}
                  <dd className="mt-1 type-body text-ink first-letter:uppercase">{parts[1]}</dd>
                </div>
              )}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * รูปเพิ่มของโปรเจกต์: รูปจาก repo/notebook/demo (projectGallery, 16:10 หรือ 10:16 สำหรับหน้าจอมือถือ) ตามด้วยรูปและวิดีโอจากงานแข่ง (experienceMedia ชุดเดียวกับแถบ In the field)
 * เต็มความกว้างใต้เนื้อหา ไม่อยู่ในคอลัมน์ข้อความ: รูปเล็กเท่าคอลัมน์ 65ch อ่านรายละเอียดไม่ออก กดแล้วเปิด lightbox ตัวเดียวกับหน้าแรก
 * รูปที่ขึ้นในกรอบบนสุดแล้ว (exclude: รูป hero และหน้าจอที่สลับดูได้) ไม่อยู่ที่นี่
 * จำนวนคอลัมน์หารจำนวนรูปลงตัวเสมอ (4 รูป = 2×2): แถวสุดท้ายที่มีรูปเดียวโดด ๆ ดูเหมือนรูปหลุดจากชุด
 */
function Gallery({ project: { id, title }, exclude }: { project: Project; exclude: Set<string> }) {
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const photos = [
    ...(projectGallery[id] ?? [])
      .filter((shot) => !shot.hero && !exclude.has(shot.file))
      .map((shot) => {
        const size = shot.portrait ? PORTRAIT_SIZE : SHOT_SIZE;
        return { ...shot, ...size, ...mediaSources("projects", id, shot.file, size.width), video: undefined };
      }),
    ...fieldPhotos(id, title),
  ];
  if (!photos.length) return null;

  return (
    <section className="mt-16">
      <h2 className="mb-4 type-title text-ink">Gallery</h2>
      <ul className={`grid gap-4 sm:grid-cols-2 ${photos.length % 3 === 0 ? "lg:grid-cols-3" : ""}`}>
        {photos.map((photo, index) => (
          <li key={photo.file}>
            <button
              type="button"
              onClick={() => setPhotoIndex(index)}
              className="block h-full w-full cursor-zoom-in rounded-card border border-rule bg-surface p-2 text-left transition-colors duration-(--duration-base) hover:border-stroke"
            >
              <span className="sr-only">{photo.video ? "Play video: " : "View larger: "}</span>
              <span className="relative block">
                <img
                  src={photo.src}
                  srcSet={photo.srcSet}
                  sizes="(min-width: 40rem) 34rem, 90vw"
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full rounded-tag"
                />
                {photo.video && <PlayBadge />}
              </span>
              <span className="mt-2 block px-1 type-small text-ink">{photo.caption}</span>
            </button>
          </li>
        ))}
      </ul>
      <Lightbox photos={photos} index={photoIndex} onChange={setPhotoIndex} />
    </section>
  );
}

/**
 * ไปโปรเจกต์ก่อน/ถัดไปโดยแทนที่ history: ปุ่ม back ของเบราว์เซอร์ยังพากลับหน้าแรกในครั้งเดียว
 * บัตรมีขอบ: ชี้หรือ focus แล้วขอบเข้ม ลูกศรขยับไปทางที่จะไป (ปิดเมื่อลดการเคลื่อนไหว) ชื่อขีดเส้นใต้
 * จอเล็กทั้งสองใบมีลูกศรซ้ายชื่อจึงเริ่มแนวเดียวกัน จอ sm ขึ้นไป Next ชิดขวาตามทิศ
 * รูปย่อ: screenshot หลักหรือรูป hero ของโปรเจกต์ปลายทาง (alt ว่าง: ชื่อในลิงก์บอกแล้ว) ไม่มีรูป = ไม่มีช่องรูป ไม่วาดรูปแทน
 * กดแล้วยุบนิดหนึ่งแบบปุ่มอื่นของเว็บ (ปิดเมื่อลดการเคลื่อนไหว)
 */
function PagerLink({ project, direction }: { project: Project; direction: "Previous" | "Next" }) {
  const next = direction === "Next";
  const Icon = next ? ChevronRightIcon : ChevronLeftIcon;
  const thumb = project.id in projectMedia ? project.id : projectGallery[project.id]?.find((shot) => shot.hero)?.file;
  const sources = thumb && mediaSources("projects", project.id, thumb, SHOT_SIZE.width);
  return (
    <a
      href={projectPath(project.id)}
      onClick={(e) => onRouteClick(e, { replace: true })}
      aria-keyshortcuts={next ? "ArrowRight" : "ArrowLeft"}
      className={`group flex min-h-11 items-center gap-3 rounded-card border border-rule bg-surface p-4 transition-[border-color,scale] duration-(--duration-fast) hover:border-stroke focus-visible:border-stroke motion-safe:active:scale-97 ${next ? "sm:col-start-2 sm:flex-row-reverse sm:text-right" : ""}`}
    >
      <Icon
        className={`size-5 shrink-0 text-pen transition-transform duration-(--duration-fast) ${next ? "motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1" : "motion-safe:group-hover:-translate-x-1 motion-safe:group-focus-visible:-translate-x-1"}`}
      />
      {sources && (
        <img
          src={sources.src}
          srcSet={sources.srcSet}
          sizes="6rem"
          alt=""
          width={SHOT_SIZE.width}
          height={SHOT_SIZE.height}
          loading="lazy"
          decoding="async"
          className="aspect-[16/10] w-24 shrink-0 rounded-tag border border-rule object-cover object-top"
        />
      )}
      <span className="min-w-0">
        <span className="block type-caption text-ink-muted">{direction}</span>
        <span className="type-title text-ink decoration-pen decoration-2 underline-offset-4 group-hover:underline group-focus-visible:underline">
          {project.title}
        </span>
      </span>
    </a>
  );
}
