import type { ReactNode } from "react";
import { SECTIONS, type SectionId } from "../config/sections";

type Props = {
  id: SectionId;
  /** บรรทัดนำหนึ่งบรรทัดใต้หัวข้อ (ไม่บังคับ) */
  intro?: string;
  children: ReactNode;
};

/**
 * หัว section ชั้นเดียว: ชื่อเดียวกับเมนู (จาก config/sections.ts) + บรรทัดนำถ้ามี
 * ไม่ซ้อนป้าย/เลขลำดับ/subtitle หลายชั้นในแนวข้อความ เพราะทุกคำที่อยู่ก่อนเนื้อหาคือสิ่งที่ recruiter ต้องอ่านผ่านก่อน
 * (เลขหน้าอยู่ในช่อง margin แยกออกไป)
 * เส้นบน section คือเส้นบรรทัดของหน้าสมุด แบ่งช่วงโดยไม่ต้องใช้กล่อง
 */
export default function Section({ id, intro, children }: Props) {
  const headingId = `${id}-heading`;
  const index = SECTIONS.findIndex((s) => s.id === id);
  const title = SECTIONS[index].label;

  return (
    <section id={id} aria-labelledby={headingId} className="border-t border-rule py-12 md:py-16 xl:py-24">
      <div className="page-container">
        <header className="relative mb-12">
          {/* เลขหน้าจดด้วยปากกาแดงในช่องซ้ายของเส้น margin แล้ววงไว้ (วงวาดตอนเลื่อนมาเห็นด้วย heading-scribble)
              อยู่นอกแนวข้อความ recruiter จึงไม่ต้องอ่านผ่าน แสดงเฉพาะจอ xl ที่ช่องซ้ายของเส้นกว้างพอ
              และซ่อนจาก screen reader เพราะเป็นของตกแต่ง */}
          <span
            aria-hidden="true"
            className="absolute -top-6 right-[calc(100%+var(--margin-line-gap)+1.25rem)] hidden flex-col items-center text-margin xl:flex print:hidden"
          >
            <span className="mb-3 type-caption font-serif italic">page</span>
            <span className="relative type-headline italic tabular-nums">
              {String(index + 1).padStart(2, "0")}
              <svg
                viewBox="0 0 100 60"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -inset-x-3.5 -inset-y-1.5 h-[calc(100%+0.75rem)] w-[calc(100%+1.75rem)] overflow-visible"
              >
                <path
                  d="M30 6C70 0 98 14 94 34C90 54 40 60 14 48C-4 38 4 12 40 6"
                  pathLength={1}
                  fill="none"
                  strokeWidth={3}
                  strokeLinecap="round"
                  className="heading-scribble"
                />
              </svg>
            </span>
          </span>
          {/* w-fit: เส้นขีดใต้ยาวเท่าชื่อหัวข้อ */}
          <h2 id={headingId} className="relative w-fit type-headline text-ink outline-none">
            {title}
            {/* เส้นปากกาแดงขีดใต้หัวข้อแบบมือขีด วาดตัวเองตอนเลื่อนมาเห็น (heading-scribble ใน index.css)
                non-scaling-stroke: เส้นหนาเท่ากันทุกหัวข้อแม้ svg ถูกยืดตามความยาวชื่อ */}
            <svg
              aria-hidden="true"
              viewBox="0 0 200 12"
              preserveAspectRatio="none"
              className="pointer-events-none absolute -bottom-2 left-0 h-3 w-full overflow-visible"
            >
              <path
                d="M2 8C40 3 78 11 118 6s62-2 80 1"
                pathLength={1}
                fill="none"
                strokeWidth={2.5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="heading-scribble"
              />
            </svg>
          </h2>
          {intro && <p className="mt-3 max-w-measure-lead type-lead text-ink-muted">{intro}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}
