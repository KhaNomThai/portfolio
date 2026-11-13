import { m } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { projectMedia } from "../config/projectMedia";
import { familyLabel, groupByFamily } from "../config/skillFamilies";
import { profile, projects, type Project } from "../data";
import { linkProps } from "../lib/links";
import { navigate, onRouteClick, projectPath, useProjectRoute } from "../lib/route";
import { LinkContent, ProjectShot, ResultMark } from "../sections/ProjectsSection";
import MarkedText from "./MarkedText";
import SkillLogo from "./SkillLogo";
import SkillMarker from "./SkillMarker";
import { ChevronLeftIcon, ChevronRightIcon, TradeOffIcon } from "./icons";

const HOME_TITLE = document.title;
const TITLE_ID = "project-page-title";

/** ปิดหน้า: เข้ามาจากหน้าแรก → ย้อน history (ปุ่ม back กับปุ่มนี้จึงพาไปที่เดียวกัน) / เปิดลิงก์ตรง → แทนที่ URL ด้วยหน้าแรก */
function closePage() {
  if (history.state?.fromHome) history.back();
  else navigate("/#projects", { replace: true });
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
      onCancel={(e) => {
        e.preventDefault();
        closePage();
      }}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-y-auto overscroll-contain border-0 bg-paper p-0 text-ink"
    >
      {project && <ProjectArticle key={project.id} project={project} />}
    </dialog>
  );
}

/**
 * แฟ้มรายงานของโปรเจกต์: หัวรายงาน (ชื่อ + แถบข้อมูล + ปุ่ม) → screenshot → บัตรดัชนีข้างจอ + เนื้อหา
 * บัตรดัชนีมาก่อนเนื้อหาใน DOM: มือถืออ่านผลลัพธ์กับ tech stack ต่อจากรูปเลย จอ lg ย้ายไปคอลัมน์ขวาและติดจอ
 */
function ProjectArticle({ project }: { project: Project }) {
  const { id, title, category, explore } = project;
  const index = projects.indexOf(project);
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const hasShot = id in projectMedia;

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

        {hasShot && (
          // group: กรอบหน้าต่างเบราว์เซอร์ "ตื่น" ตอนชี้แบบเดียวกับบนการ์ด
          <div className="group mt-8">
            <ProjectShot project={project} sizes="(min-width: 75rem) 70rem, calc(100vw - 2rem)" className="" />
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

        <nav aria-label="Other projects" className="mt-16 grid gap-4 border-t border-rule pt-8 sm:grid-cols-2">
          <PagerLink project={prev} direction="Previous" />
          <PagerLink project={next} direction="Next" />
        </nav>
      </m.article>
    </div>
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
    <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
      {fields.map(([label, value]) => (
        <div key={label}>
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
 * บัตรดัชนี: ผลลัพธ์ tech stack และลิงก์ ติดข้างจอ (lg) ระหว่างอ่านเนื้อหาซ้าย
 * ผลลัพธ์อยู่ที่นี่ที่เดียว ปากกาเน้นจึงมีจุดเดียวต่อหน้า (ตัวเลขใหญ่ใน <mark> พื้นเหลืองเฉพาะตัวเลข ไม่ทาทั้งกล่อง:
 * โหมดมืดข้อความอื่นบนพื้นเหลืองอ่านไม่ออก)
 * ติดจอเฉพาะเมื่อจอสูงพอให้เห็นทั้งใบ ไม่อย่างนั้นท้ายบัตรถูกตัดจนเลื่อนถึงท้ายเนื้อหา
 */
function IndexCard({ project: { title, metric, result, marks, tags, links } }: { project: Project }) {
  return (
    <aside
      aria-label="Project summary"
      className="self-start rounded-card border border-rule bg-surface p-6 lg:col-start-2 lg:row-start-1 lg:[@media(min-height:46rem)]:sticky lg:[@media(min-height:46rem)]:top-24"
    >
      <h2 className="border-b border-margin pb-2 type-title text-ink">At a glance</h2>
      {(metric || result) && (
        <CardBlock label="Result">
          {metric && (
            <p className="mt-2">
              <ResultMark value={metric.value} className="type-headline tabular-nums" />
              <span className="mt-1 block type-small text-ink-muted">{metric.label}</span>
            </p>
          )}
          {result && (
            <p className="mt-2 type-body text-ink">
              <MarkedText text={result} marks={marks} />
            </p>
          )}
        </CardBlock>
      )}
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
 * ไม่มี Result ที่นี่: ผลลัพธ์อยู่ในบัตรดัชนี ไม่ไฮไลต์ซ้ำสองที่
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
 */
function Pipeline({ steps }: { steps: string[] }) {
  return (
    <ol role="list" className="grid">
      {steps.map((step, i) => (
        <li key={step} className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 pb-6 last:pb-0">
          {i < steps.length - 1 && <span aria-hidden="true" className="absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 bg-rule" />}
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-control border border-rule bg-surface type-label tabular-nums text-ink"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="pt-1 type-body text-ink">{step}</p>
        </li>
      ))}
    </ol>
  );
}

/** ทางเลือกทางเทคนิค: แต่ละข้อคือการชั่งข้อดีข้อเสีย (ข้อมูลไม่ได้แยกทางเลือกกับเหตุผล จึงใช้สัญลักษณ์เดียวกันทุกข้อ ไม่แต่งป้ายเพิ่ม) */
function Decisions({ items }: { items: string[] }) {
  return (
    <ul role="list" className="border-t border-rule">
      {items.map((item) => (
        <li key={item} className="flex gap-4 border-b border-rule py-4 last:border-b-0 last:pb-0">
          <TradeOffIcon className="mt-0.5 size-5 shrink-0 text-ink-muted" />
          <p className="type-body text-ink">{item}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * ไปโปรเจกต์ก่อน/ถัดไปโดยแทนที่ history: ปุ่ม back ของเบราว์เซอร์ยังพากลับหน้าแรกในครั้งเดียว
 * บัตรมีขอบ: ชี้หรือ focus แล้วขอบเข้ม ลูกศรขยับไปทางที่จะไป (ปิดเมื่อลดการเคลื่อนไหว) ชื่อขีดเส้นใต้
 * จอเล็กทั้งสองใบมีลูกศรซ้ายชื่อจึงเริ่มแนวเดียวกัน จอ sm ขึ้นไป Next ชิดขวาตามทิศ
 */
function PagerLink({ project, direction }: { project: Project; direction: "Previous" | "Next" }) {
  const next = direction === "Next";
  const Icon = next ? ChevronRightIcon : ChevronLeftIcon;
  return (
    <a
      href={projectPath(project.id)}
      onClick={(e) => onRouteClick(e, { replace: true })}
      className={`group flex min-h-11 items-center gap-3 rounded-card border border-rule bg-surface p-4 transition-colors duration-(--duration-base) hover:border-stroke focus-visible:border-stroke ${next ? "sm:col-start-2 sm:flex-row-reverse sm:text-right" : ""}`}
    >
      <Icon
        className={`size-5 shrink-0 text-pen transition-transform duration-(--duration-fast) ${next ? "motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1" : "motion-safe:group-hover:-translate-x-1 motion-safe:group-focus-visible:-translate-x-1"}`}
      />
      <span>
        <span className="block type-caption text-ink-muted">{direction}</span>
        <span className="type-title text-ink decoration-pen decoration-2 underline-offset-4 group-hover:underline group-focus-visible:underline">
          {project.title}
        </span>
      </span>
    </a>
  );
}
