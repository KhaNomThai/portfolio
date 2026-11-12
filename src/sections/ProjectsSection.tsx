import { AnimatePresence, m } from "framer-motion";
import { useId, useState, useSyncExternalStore, type ComponentType, type CSSProperties, type ReactNode, type SVGProps } from "react";
import NewTabHint from "../components/NewTabHint";
import Section from "../components/Section";
import SkillMarker, { SkillLegend } from "../components/SkillMarker";
import { BadgeCheckIcon, ChevronRightIcon, CodeIcon, GlobeIcon, NotebookIcon } from "../components/icons";
import { SHOT_SIZE, projectMedia } from "../config/projectMedia";
import { familyLabel, groupByFamily } from "../config/skillFamilies";
import { projects, sectionIntros, type Project, type ProjectLinkKind } from "../data";
import CountUp from "../components/CountUp";
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

/** ตัวกรองหลัก = tag ที่มีอย่างน้อย 2 โปรเจกต์ (เรียงตามจำนวน) — ข้อมูล static คำนวณครั้งเดียว */
const FILTER_TAGS = [...projectCountByTag]
  .filter(([, count]) => count >= 2)
  .sort((a, b) => b[1] - a[1])
  .map(([tag]) => tag);

/** แถวแรกของแถบกรองบนจอกว้าง = tag ที่มีอย่างน้อย 3 โปรเจกต์ (พอดีหนึ่งแถวที่ 1280px) ที่เหลืออยู่หลังปุ่ม More */
const PRIMARY_TAGS = new Set(FILTER_TAGS.filter((t) => projectCountByTag.get(t)! >= 3));

/** มือถือแสดงก่อนแค่นี้ (เรียงคอลัมน์เดียว หน้าจะยาวมาก) — จอ md ขึ้นไปแสดงครบเสมอ */
const MOBILE_PREVIEW = 4;

const hasShot = (project: Project) => project.id in projectMedia;

/** จอ md ขึ้นไปไหม: ปุ่ม More ของแถบกรองมีเฉพาะจอกว้าง (มือถือเลื่อนแถบแนวนอนเห็นครบอยู่แล้ว) จึงต้องไม่อยู่ใน DOM ของมือถือ */
const WIDE = "(min-width: 48rem)";
const subscribeWide = (onChange: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

export default function ProjectsSection() {
  const { tag, setTag } = useProjectFilter();
  const [showAll, setShowAll] = useState(false);
  const [moreTags, setMoreTags] = useState(false);
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches);
  const listId = useId();
  const tagsId = useId();
  const visible = tag ? projects.filter((p) => p.tags.includes(tag)) : projects;
  const collapsible = tag === null && visible.length > MOBILE_PREVIEW;
  // tag ที่เลือกมาจากรายการใน Skills อาจไม่อยู่ในแถบหลัก → ต่อท้ายให้เห็นว่ากำลังกรองอะไร
  const filterTags = tag && !FILTER_TAGS.includes(tag) ? [...FILTER_TAGS, tag] : FILTER_TAGS;
  // tag ที่เลือกอยู่ต้องเห็นเสมอ แม้อยู่ในกลุ่มที่พับไว้
  const shownTags = wide && !moreTags ? filterTags.filter((t) => PRIMARY_TAGS.has(t) || t === tag) : filterTags;
  const hiddenTags = filterTags.length - shownTags.length;

  // โปรเจกต์ที่มี screenshot เป็น case study เต็มแถว ที่เหลือเป็นแถวในสมุดบัญชี: จำนวนเท่าไรก็ไม่มีช่องว่างใน grid
  const cases = visible.filter(hasShot);
  const ledger = visible.filter((p) => !hasShot(p));
  // มือถือพับตามลำดับใน data.ts ข้ามทั้งสองกลุ่ม: 4 โปรเจกต์แรกเห็นก่อนไม่ว่าจะอยู่กลุ่มไหน
  const collapsed = (project: Project) => (collapsible && !showAll && visible.indexOf(project) >= MOBILE_PREVIEW ? "max-md:hidden" : "");

  return (
    <Section id="projects" intro={sectionIntros.projects}>
      {/* legend อธิบายสัญลักษณ์ครั้งเดียว ก่อนถึงรายการที่ใช้มัน */}
      <SkillLegend className="mb-6" />

      <div className="mb-8 print:hidden">
        {/* มือถือ: เลื่อนแนวนอน (ขอบขวาจางบอกว่ายังมีต่อ) / จอ md ขึ้นไป: tag หลักแถวเดียว ที่เหลืออยู่หลังปุ่ม More
            py-1 คู่ -mt-1: overflow-x ตัดทุกอย่างที่ล้นกล่อง จึงต้องเว้นที่ให้วง focus ของ chip
            pr-16: เลื่อนสุดแล้ว chip ตัวสุดท้ายต้องพ้นช่วงขอบที่จาง (15% ขวา) */}
        <div
          id={tagsId}
          role="group"
          aria-label="Filter projects by technology"
          className="-mx-4 -mt-1 flex gap-2 overflow-x-auto py-1 pl-4 pr-16 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:[mask-image:none]"
        >
          <FilterChip pressed={tag === null} onClick={() => setTag(null)}>
            All
          </FilterChip>
          {shownTags.map((t) => (
            <FilterChip key={t} pressed={tag === t} onClick={() => setTag(tag === t ? null : t)}>
              {t}
              <span aria-hidden="true" className="type-caption tabular-nums opacity-80">
                {projectCountByTag.get(t)}
              </span>
            </FilterChip>
          ))}
          {wide && (
            // ขอบประ: ปุ่มนี้เปิดรายการ ไม่ใช่ตัวกรอง จึงต้องดูต่างจาก chip ที่กดแล้วกรอง
            <button
              type="button"
              aria-expanded={moreTags}
              aria-controls={tagsId}
              onClick={() => setMoreTags((v) => !v)}
              className="flex h-11 shrink-0 items-center gap-2 rounded-control border border-dashed border-stroke px-3 type-label text-ink-muted transition-colors duration-(--duration-fast) hover:border-pen hover:text-pen"
            >
              {moreTags ? "Fewer" : "More"}
              {!moreTags && (
                <span aria-hidden="true" className="type-caption tabular-nums">
                  +{hiddenTags}
                </span>
              )}
            </button>
          )}
        </div>
        {/* สรุปผลอยู่ใต้แถบกรองชิดซ้าย เป็นบรรทัดกำกับของแถบ และเป็นหัวของรายการข้างล่าง */}
        <p id="projects-status" tabIndex={-1} aria-live="polite" className="mt-3 type-small text-ink-muted outline-none">
          {tag ? `${visible.length} of ${projects.length} projects ${visible.length === 1 ? "uses" : "use"} ${tag}` : `${projects.length} projects`}
        </p>
      </div>

      {/* จางสั้น ๆ ตอนเปลี่ยนตัวกรอง: motion ที่ตอบการกระทำของผู้ใช้ใช้ได้ตามกติกา และไม่เลื่อนตำแหน่ง (ไม่กระทบ layout) */}
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={tag ?? "all"} id={listId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {cases.length > 0 && (
            <ul className="grid gap-8">
              {cases.map((project, i) => (
                <li key={project.id} className={`reveal print:block! ${collapsed(project)}`}>
                  {/* รูปสลับขวา/ซ้าย: แถวที่ซ้อนกันไม่ดูเป็นตารางสองคอลัมน์ที่ข้างหนึ่งเป็นรูปล้วน */}
                  <CaseStudy project={project} flip={i % 2 === 1} />
                </li>
              ))}
            </ul>
          )}
          {/* "More" ต้องมีของก่อนหน้า: ถ้าตัวกรองเหลือแต่แถวในสมุดบัญชี รายการเริ่มที่เส้นบรรทัดเลย */}
          {cases.length > 0 && ledger.length > 0 && <p className="mt-12 mb-2 type-label text-ink-muted">More projects</p>}
          {ledger.length > 0 && (
            <ul className="border-t border-rule">
              {ledger.map((project) => (
                <LedgerRow key={project.id} project={project} className={collapsed(project)} />
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

function FilterChip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  // ไม่ใช้หมึกไหลเต็มปุ่ม (btn-ink): พื้น pen เต็มคือสัญญาณของ chip ที่เลือกอยู่ ตอนชี้จึงเปลี่ยนแค่ขอบและตัวอักษร
  // px-3: tag หลักทั้งแถวกับปุ่ม More ต้องลงในแถวเดียวที่ 1280px
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="flex h-11 shrink-0 items-center gap-2 rounded-control border border-stroke bg-surface px-3 type-label text-ink transition-colors duration-(--duration-fast) not-aria-pressed:hover:border-pen not-aria-pressed:hover:text-pen aria-pressed:border-pen aria-pressed:bg-pen aria-pressed:text-on-pen"
    >
      {children}
    </button>
  );
}

/**
 * case study: บัตรคำเต็มแถวของโปรเจกต์ที่มี screenshot จอ lg ขึ้นไปรูปใหญ่ (3 ใน 5 ส่วน) อยู่ข้างข้อความ จอเล็กกว่ารูปอยู่ใต้ชื่อ
 * พื้นขาว ขอบบาง เส้นแดงใต้ชื่อเหมือนบัตรคำจริง ไม่มีเงาจนกว่าจะชี้ (ของที่วางราบบนกระดาษ)
 * ทั้งใบคลิกได้ด้วย stretched link ของชื่อ ส่วนลิงก์รองอยู่ชั้นบนจึงยังกดแยกได้
 */
function CaseStudy({ project, flip }: { project: Project; flip: boolean }) {
  const tiltRef = useCardTilt<HTMLElement>();
  const [text, shot] = flip ? ["lg:col-start-2", "lg:col-start-1"] : ["lg:col-start-1", "lg:col-start-2"];

  // แถวกลางเป็น 1fr: ถ้ารูปสูงกว่าข้อความ ที่ว่างไปอยู่ใต้ข้อความ ไม่ไปถ่างหัวบัตร
  return (
    <article
      ref={tiltRef}
      className={`card-tilt group relative grid gap-x-8 rounded-card border border-rule bg-surface p-6 transition-[translate,transform,box-shadow,border-color] duration-(--duration-base) ease-out hover:-translate-y-1 hover:border-stroke hover:shadow-overlay motion-reduce:hover:translate-y-0 lg:grid-rows-[auto_1fr_auto] ${flip ? "lg:grid-cols-[3fr_2fr]" : "lg:grid-cols-[2fr_3fr]"}`}
    >
      <div className={`lg:row-start-1 ${text}`}>
        <div className="border-b border-margin pb-2">
          <ProjectTitle project={project} rounded />
        </div>
        <ProjectMeta project={project} />
      </div>
      <ProjectShot
        project={project}
        sizes="(min-width: 64rem) 37.5rem, (min-width: 48rem) min(40rem, 100vw - 8.5rem), calc(100vw - 5rem)"
        className={`mt-6 max-w-measure self-start lg:row-span-2 lg:row-start-1 lg:mt-0 lg:max-w-none ${shot}`}
      />
      <ProjectFields project={project} className={`mt-4 max-w-measure lg:row-start-2 ${text}`} />
      <div className="mt-6 flex flex-col gap-x-8 border-t border-rule pt-4 lg:col-span-2 lg:row-start-3 lg:flex-row lg:items-center lg:justify-between">
        <TechStack tags={project.tags} />
        <ProjectLinks links={project.links} explore={project} className="pt-2 lg:shrink-0 lg:pt-0" />
      </div>
    </article>
  );
}

/**
 * แถวในสมุดบัญชี: โปรเจกต์ที่ไม่มี screenshot เรียงเป็นแถวเต็มความกว้างคั่นด้วยเส้นบรรทัด แบบเดียวกับ timeline ใน Experience
 * ชื่ออยู่คอลัมน์ซ้ายให้กวาดตาหาได้ เนื้อหาอยู่ขวา แต่ละแถวสูงตามเนื้อหาของตัวเอง จึงไม่มีที่ว่างจากการยืดให้เท่าใบข้าง ๆ
 * ไม่ยกหรือเอียงตอนชี้: แถวเป็นบรรทัดบนหน้ากระดาษ ไม่ใช่บัตรที่หยิบขึ้นมาได้
 */
function LedgerRow({ project, className }: { project: Project; className: string }) {
  return (
    // grid-rows auto + 1fr: ลิงก์อยู่ใต้ชื่อพอดี แม้คอลัมน์เนื้อหาจะสูงกว่ามาก
    <li
      className={`reveal group relative grid gap-x-8 border-b border-rule py-6 md:grid-cols-[15rem_minmax(0,1fr)] md:grid-rows-[auto_1fr] print:grid! ${className}`}
    >
      <div>
        <ProjectTitle project={project} />
        <ProjectMeta project={project} />
      </div>
      <div className="mt-4 md:col-start-2 md:row-span-2 md:row-start-1 md:mt-0">
        <ProjectFields project={project} split />
        <TechStack tags={project.tags} className="mt-4" />
      </div>
      <ProjectLinks links={project.links} explore={project} className="pt-2 md:col-start-1 md:row-start-2 md:self-start" />
    </li>
  );
}

/** ชื่อโปรเจกต์ + ปี ชื่อเป็น "stretched link" ไปหน้า explore: ::after คลุมทั้งใบ/แถว → คลิกได้ทั้งหมด แต่ accessible name = ชื่อโปรเจกต์อย่างเดียว */
function ProjectTitle({ project: { id, title, year }, rounded = false }: { project: Project; rounded?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h3 className="type-title text-ink">
        <a
          href={projectPath(id)}
          onClick={onRouteClick}
          className={`decoration-pen decoration-2 underline-offset-4 outline-none group-hover:underline after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus ${rounded ? "after:rounded-card" : ""}`}
        >
          {title}
        </a>
      </h3>
      {year && <span className="type-caption tabular-nums text-ink-muted">{year}</span>}
    </div>
  );
}

function ProjectMeta({ project: { category, context } }: { project: Project }) {
  // " — " คั่นสองกลุ่ม: ในกลุ่มเองใช้ " · " อยู่แล้ว (เช่น "DOH Hackathon · Team of 2") ถ้าใช้ "," จะแบ่งกลุ่มคำผิด
  const meta = [category, context].filter(Boolean).join(" — ");
  return meta ? <p className="mt-2 type-small text-ink-muted">{meta}</p> : null;
}

/**
 * problem → approach → result เมื่อมีทั้ง problem และ approach ถ้าไม่ครบแสดง desc (ไม่มีป้าย) แทน แล้วต่อด้วยผลลัพธ์
 * split (แถวสมุดบัญชี จอ xl): Problem อยู่คอลัมน์ซ้าย Approach กับ Result ซ้อนกันทางขวา (อ่านซ้ายไปขวาแล้วลงล่าง)
 * ไม่แยกเป็นสามคอลัมน์: โปรเจกต์เกินครึ่งไม่มี Result คอลัมน์ที่สามจะว่างเป็นส่วนใหญ่
 */
export function ProjectFields({ project, split = false, className = "" }: { project: Project; split?: boolean; className?: string }) {
  const { desc, problem, approach, result, metric, marks } = project;
  const structured = Boolean(problem && approach);
  const hasResult = Boolean(metric || result);
  return (
    <dl className={`grid content-start gap-3 ${split ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] xl:gap-x-8" : ""} ${className}`}>
      {structured ? (
        <>
          <Field label="Problem" className={split && hasResult ? "xl:row-span-2" : ""}><MarkedText text={problem!} marks={marks} /></Field>
          <Field label="Approach"><MarkedText text={approach!} marks={marks} /></Field>
        </>
      ) : (
        <p className="col-span-full type-body text-ink"><MarkedText text={desc} marks={marks} /></p>
      )}
      {hasResult && (
        <Field label="Result" className={split ? "xl:col-start-2" : ""}>
          {metric && <ResultMark value={metric.value} />} {metric?.label}
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
    <div className={`relative z-10 flex flex-wrap items-center gap-x-6 ${className}`}>
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
      {links.map(({ kind, href }) => {
        const { label, Icon } = LINKS[kind];
        return (
          <a
            key={href}
            {...linkProps(href)}
            className="inline-flex min-h-11 items-center gap-1 type-label text-pen underline underline-offset-3 transition-colors duration-(--duration-fast) hover:text-pen-hover"
          >
            <Icon className="size-4" />
            {label}
            <NewTabHint href={href} />
          </a>
        );
      })}
    </div>
  );
}

/**
 * screenshot ของงานจริงในกรอบหน้าต่างเบราว์เซอร์บาง ๆ (จุดสามจุด + ชื่อโฮสต์ของ demo): บอกว่าเป็นเว็บที่เปิดใช้ได้ ไม่ใช่ภาพประกอบ
 * ไม่ติดเทป: แถบหัวหน้าต่างอยู่ตรงที่เทปจะทับ
 * pointer-events-none: รูปอยู่ชั้นบนของ stretched link การคลิกต้องทะลุไปถึงลิงก์ของการ์ด
 * ไม่พิมพ์: หน้าพิมพ์เป็นเอกสารข้อความ และ screenshot สีเปลืองหมึก
 */
export function ProjectShot({ project: { id, links }, sizes, className }: { project: Project; sizes: string; className: string }) {
  const { src, srcSet } = mediaSources("projects", id, SHOT_SIZE.width);
  const demo = links.find((link) => link.kind === "demo");
  return (
    // ชี้การ์ดแล้วหน้าต่างเบราว์เซอร์ "ตื่น": จุดสามจุดติดสีปากกาสามด้าม ขอบกับ host เข้มขึ้น เปลี่ยนแค่สี รูปไม่ขยับ
    <figure className={`pointer-events-none overflow-hidden rounded-tag border border-rule bg-paper transition-colors duration-(--duration-base) group-hover:border-stroke print:hidden ${className}`}>
      <div aria-hidden="true" className="flex h-6 items-center gap-1 border-b border-rule px-2">
        <span className="size-2 rounded-full bg-rule transition-colors duration-(--duration-base) group-hover:bg-margin" />
        <span className="size-2 rounded-full bg-rule transition-colors duration-(--duration-base) group-hover:bg-marker" />
        <span className="size-2 rounded-full bg-rule transition-colors duration-(--duration-base) group-hover:bg-pen" />
        {demo && (
          <span className="ml-2 truncate type-caption text-ink-muted transition-colors duration-(--duration-base) group-hover:text-ink">
            {new URL(demo.href).host}
          </span>
        )}
      </div>
      <div>
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={projectMedia[id].alt}
          width={SHOT_SIZE.width}
          height={SHOT_SIZE.height}
          loading="lazy"
          decoding="async"
          className="aspect-[16/10] w-full object-cover object-top"
        />
      </div>
    </figure>
  );
}

/** หัวข้อช่อง (sans 600 สีรอง) ซ้อนบนเนื้อหา: คอลัมน์ข้อความใช้ความกว้างเต็มที่ ไม่ต้องแบ่งคอลัมน์ป้าย */
function Field({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <dt className="type-label text-ink-muted">{label}</dt>
      <dd className="mt-1 type-body text-ink">{children}</dd>
    </div>
  );
}

/** ตัวเลขผลลัพธ์: ปากกาเน้นขีดผ่านครั้งแรกที่การ์ดเข้ามาในจอ (สั้นกว่าใน hero คือ --duration-slow: คนอ่านกำลังเลื่อนผ่าน ไม่ได้รอดู) */
function ResultMark({ value }: { value: string }) {
  const [ref, seen] = useInViewOnce<HTMLElement>();
  const style: CSSProperties = { "--swipe-duration": "var(--duration-slow)" };
  return (
    <mark ref={ref} style={style} className={`type-metric ${seen ? "mark-swipe" : "mark-pending"}`}>
      <CountUp value={value} start={seen} />
    </mark>
  );
}
