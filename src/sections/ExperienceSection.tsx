import Section from "../components/Section";
import { leadership, work, type TimelineItem } from "../data";
import MarkedText from "../components/MarkedText";

/**
 * บันทึกเรียงตามเวลาแบบสมุด: วันที่อยู่คอลัมน์ซ้าย เนื้อหาอยู่ขวา แต่ละรายการคั่นด้วยเส้นบรรทัด
 * ไม่ใส่เส้น timeline ที่เติมตามการเลื่อนหรือจุดกะพริบ เพราะเป็น motion ที่ไม่ได้ตอบการกระทำของผู้ใช้ (ดู Motion ใน DESIGN_SYSTEM.md)
 * ติ๊กในช่อง margin วาดครั้งเดียวตามการเลื่อน แบบเดียวกับเส้นใต้หัว section
 */
export default function ExperienceSection() {
  return (
    <Section id="experience">
      <TimelineGroup title="Work" items={work} />
      <TimelineGroup title="Leadership & Teaching" items={leadership} className="mt-16" />
    </Section>
  );
}

function TimelineGroup({ title, items, className = "" }: { title: string; items: TimelineItem[]; className?: string }) {
  return (
    <div className={className}>
      <h3 className="mb-2 type-label text-ink-muted">{title}</h3>
      <ol className="border-t border-rule">
        {items.map((item) => (
          <TimelineEntry key={item.id} item={item} />
        ))}
      </ol>
    </div>
  );
}

function TimelineEntry({ item }: { item: TimelineItem }) {
  const current = item.period.includes("Present");

  return (
    <li className="reveal relative grid gap-2 border-b border-rule py-6 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8">
      {/* ติ๊กถูกปากกาแดงในช่องซ้ายของเส้น margin แบบครูตรวจสมุด วาดตอนเลื่อนมาเห็น (heading-scribble)
          มีเฉพาะจอที่มีเส้น margin (md ขึ้นไป) และเป็นของตกแต่งล้วน */}
      <svg
        aria-hidden="true"
        viewBox="0 0 20 16"
        className="pointer-events-none absolute top-7 right-[calc(100%+var(--margin-line-gap)+0.5rem)] hidden w-4 overflow-visible md:block print:hidden"
      >
        <path
          d="M2 9c2 1 4 3 5 5 3-6 7-10 11-12"
          pathLength={1}
          strokeWidth={2}
          className="heading-scribble"
        />
      </svg>
      <p className="type-small tabular-nums text-ink-muted">
        {item.period}
        {current && <span className="ml-2 type-label text-ink md:ml-0 md:block">Current</span>}
      </p>
      <div>
        <h4 className="type-title text-ink">{item.title}</h4>
        <p className="mt-1 type-body text-ink-muted">{item.org}</p>
        <ul className="mt-3 max-w-measure space-y-2 type-body text-ink">
          {item.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3">
              {/* ขีดสั้นแบบจดโน้ต แทนจุดสี */}
              <span aria-hidden="true" className="mt-3 h-px w-3 shrink-0 bg-ink-muted" />
              <span>
                <MarkedText text={bullet} marks={item.marks} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
