import { m } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { projectMedia } from "../config/projectMedia";
import { profile, projects, type Project } from "../data";
import { navigate, onRouteClick, projectPath, useProjectRoute } from "../lib/route";
import { ProjectFields, ProjectLinks, ProjectShot, TechStack } from "../sections/ProjectsSection";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

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

function ProjectArticle({ project }: { project: Project }) {
  const { id, title, category, year, context, links, tags, explore } = project;
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
          <span className="type-caption tabular-nums text-ink-muted">
            {index + 1} / {projects.length}
          </span>
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
          <p className="type-label text-ink-muted">
            {category}
            {year && <span className="tabular-nums"> · {year}</span>}
          </p>
          <h1 id={TITLE_ID} tabIndex={-1} className="mt-2 outline-none border-b border-margin pb-3 type-headline text-ink">
            {title}
          </h1>
          {context && <p className="mt-4 max-w-measure-lead type-lead text-ink-muted">{context}</p>}
          <ProjectLinks links={links} className="mt-4" />
        </header>

        {hasShot && (
          <ProjectShot
            project={project}
            sizes="(min-width: 75rem) 70rem, calc(100vw - 2rem)"
            className="mt-8"
          />
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
          <div className="grid max-w-measure content-start gap-10">
            {explore?.overview && <p className="type-lead text-ink">{explore.overview}</p>}
            <ProjectFields project={project} />
            {explore?.role && (
              <Block title="My role">
                <p className="type-body text-ink">{explore.role}</p>
              </Block>
            )}
            <List title="Key features" items={explore?.features} />
            <List title="How it works" items={explore?.howItWorks} ordered />
            <List title="Technical decisions" items={explore?.decisions} />
          </div>

          {/* lg: คอลัมน์ข้างติดหัวจอ (ใต้แถบบน 4rem) ให้เห็น tech stack ระหว่างอ่าน */}
          <aside className="self-start border-t border-rule pt-4 lg:sticky lg:top-24">
            <h2 className="type-label text-ink-muted">Tech stack</h2>
            <TechStack tags={tags} className="mt-3 flex-col" />
          </aside>
        </div>

        <nav aria-label="Other projects" className="mt-16 grid gap-4 border-t border-rule pt-6 sm:grid-cols-2">
          <PagerLink project={prev} direction="Previous" />
          <PagerLink project={next} direction="Next" />
        </nav>
      </m.article>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 type-title text-ink">{title}</h2>
      {children}
    </section>
  );
}

function List({ title, items, ordered = false }: { title: string; items?: string[]; ordered?: boolean }) {
  if (!items?.length) return null;
  const Tag = ordered ? "ol" : "ul";
  return (
    <Block title={title}>
      {/* เลขลำดับ = ขั้นตอนที่ข้อมูลไหลผ่านจริง รายการที่ไม่มีลำดับใช้จุด */}
      <Tag className={`grid gap-2 pl-6 type-body text-ink marker:text-ink-muted ${ordered ? "list-decimal" : "list-disc"}`}>
        {items.map((item) => (
          <li key={item} className="pl-1">
            {item}
          </li>
        ))}
      </Tag>
    </Block>
  );
}

/** ไปโปรเจกต์ก่อน/ถัดไปโดยแทนที่ history: ปุ่ม back ของเบราว์เซอร์ยังพากลับหน้าแรกในครั้งเดียว */
function PagerLink({ project, direction }: { project: Project; direction: "Previous" | "Next" }) {
  const next = direction === "Next";
  const Icon = next ? ChevronRightIcon : ChevronLeftIcon;
  return (
    <a
      href={projectPath(project.id)}
      onClick={(e) => onRouteClick(e, { replace: true })}
      className={`group flex min-h-11 items-center gap-3 rounded-control py-2 ${next ? "flex-row-reverse text-right sm:col-start-2" : ""}`}
    >
      <Icon className="size-5 shrink-0 text-pen" />
      <span>
        <span className="block type-caption text-ink-muted">{direction}</span>
        <span className="type-title text-ink decoration-pen decoration-2 underline-offset-4 group-hover:underline">{project.title}</span>
      </span>
    </a>
  );
}

