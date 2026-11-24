import type { ComponentType, CSSProperties, SVGProps } from "react";
import { SHOT_SIZE, projectMedia } from "../config/projectMedia";
import type { Project, ProjectLink, ProjectLinkKind } from "../data";
import { mediaSources } from "../lib/media";
import { useInViewOnce } from "../lib/useInViewOnce";
import CountUp from "./CountUp";
import NewTabHint from "./NewTabHint";
import { BadgeCheckIcon, CodeIcon, GlobeIcon, NotebookIcon } from "./icons";

/** ชิ้นส่วนที่การ์ดบนหน้าแรก (ProjectsSection) กับหน้า explore (ProjectPage) ใช้ร่วมกัน */

const LINKS: Record<ProjectLinkKind, { label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  code: { label: "Code", Icon: CodeIcon },
  demo: { label: "Live demo", Icon: GlobeIcon },
  notebook: { label: "Notebook", Icon: NotebookIcon },
  certificate: { label: "Certificate", Icon: BadgeCheckIcon },
};

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
