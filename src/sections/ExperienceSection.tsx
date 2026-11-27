import MediaImage from "../components/MediaImage";
import { useState, type CSSProperties } from "react";
import Lightbox, { PlayBadge } from "../components/Lightbox";
import MarkedText from "../components/MarkedText";
import NewTabHint from "../components/NewTabHint";
import { BadgeCheckIcon } from "../components/icons";
import { linkProps } from "../lib/links";
import Section from "../components/Section";
import { leadership, projects, work, type TimelineItem } from "../data";
import { fieldPhotos } from "../lib/media";

/**
 * รูปทุกใบเรียงตามลำดับรายการใน timeline ตามด้วยรูปจากงานแข่งของโปรเจกต์: index ของรูปคือตำแหน่งในนี้ lightbox จึงเลื่อน ← / → ได้ครบทุกใบ
 * รูปของโปรเจกต์ใช้ชื่อโปรเจกต์เป็นบรรทัดล่าง เพราะงานแข่งไม่มีรายการใน timeline
 */
const PHOTOS = [...work, ...leadership, ...projects].flatMap((item) => fieldPhotos(item.id, item.title));

/**
 * จอ xl: จำนวนใบต่อแถวที่หารจำนวนรูปลงตัว (แถวสุดท้ายที่มีใบเดียวดูเหมือนรูปหลุดจากชุด) ไม่มีตัวไหนหารลงตัว = 3
 * class ต้องเขียนเต็มให้ Tailwind เห็นตอน build จึงเป็นตาราง ไม่ใช่ต่อ string จากตัวเลข (gap-x-8 = 2rem ต่อช่อง)
 */
const XL_WIDTH = { 3: "xl:w-[calc((100%-4rem)/3)]", 4: "xl:w-[calc((100%-6rem)/4)]", 5: "xl:w-[calc((100%-8rem)/5)]" };
/** ความกว้างของรูปในใบที่จอ xl (container 67.5rem) ให้ sizes ตรง เบราว์เซอร์จะได้ไม่โหลดไฟล์ 1024 เกินจำเป็น */
const XL_SIZE = { 3: "21rem", 4: "15rem", 5: "11.5rem" };
const XL_PER_ROW = ([3, 4, 5] as const).find((n) => PHOTOS.length % n === 0) ?? 3;

/** มุมเอียงของรูปแต่ละใบ วนตามลำดับ: รูปที่ติดด้วยมือไม่เอียงเท่ากัน */
const TILTS = ["-2deg", "1deg", "-1deg", "2deg"];

const GROUP_LABEL = "mb-2 type-label text-ink-muted";

/**
 * บันทึกเรียงตามเวลาแบบสมุด: วันที่อยู่คอลัมน์ซ้าย เนื้อหาอยู่ขวา แต่ละรายการคั่นด้วยเส้นบรรทัด
 * จอ md ขึ้นไปมีเส้นประเชื่อมรายการระหว่างคอลัมน์วันที่กับเนื้อหา จุดของรายการติดสีปากกาตอนรายการนั้นผ่านกลางจอ
 * (ตอบการเลื่อนของผู้อ่านโดยตรง ไม่กะพริบเอง ใช้ CSS ล้วน ดู timeline-node ใน index.css)
 * ติ๊กในช่อง margin วาดครั้งเดียวตามการเลื่อน แบบเดียวกับเส้นใต้หัว section
 * รูปกิจกรรมแยกไปอยู่แถบ In the field ท้าย section: รายการใน timeline เป็นข้อความล้วน คอลัมน์ข้อความจึงกว้างเท่ากันทุกรายการ
 */
export default function ExperienceSection() {
  return (
    <Section id="experience">
      <TimelineGroup title="Work" items={work} />
      <TimelineGroup title="Leadership & Teaching" items={leadership} className="mt-16" />
      <FieldPhotos />
    </Section>
  );
}

function TimelineGroup({ title, items, className = "" }: { title: string; items: TimelineItem[]; className?: string }) {
  return (
    <div className={className}>
      <h3 className={GROUP_LABEL}>{title}</h3>
      <ol className="relative border-t border-rule">
        {/* เส้นประกลางช่องว่างระหว่างสองคอลัมน์ (11rem + ครึ่งของ gap-8) เรืองจาง ๆ ตาม glow (โหมดมืดเห็นชัดกว่า) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-[12rem] hidden border-l border-dashed border-stroke [filter:drop-shadow(0_0_4px_var(--color-glow))] md:block print:hidden"
        />
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
    <li
      id={`evidence-${item.id}`}
      className="reveal timeline-entry evidence-target relative grid gap-2 border-b border-rule py-6 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8"
    >
      {/* จุดบนเส้นประ ตรงกลางบรรทัดชื่อ (py-6 + ครึ่งของระยะบรรทัด type-title − ครึ่งของจุด = 2rem) */}
      <span
        aria-hidden="true"
        className="timeline-node pointer-events-none absolute top-8 left-[12rem] hidden size-3 -translate-x-1/2 rounded-full border-2 md:block print:hidden"
      />
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
        {item.href && (
          <a
            {...linkProps(item.href)}
            className="mt-3 inline-flex min-h-11 items-center gap-1 type-label text-pen underline underline-offset-3 transition-colors duration-(--duration-fast) hover:text-pen-hover"
          >
            <BadgeCheckIcon className="size-4" />
            View certificate
            <NewTabHint href={item.href} />
          </a>
        )}
      </div>
    </li>
  );
}

/**
 * แถบรูปกิจกรรม: โพลารอยด์ติดเทปขนาดเดียว (4:3) คำบรรยายกับชื่อบทบาทเขียนไว้ที่ขอบล่างของรูปแบบโพลารอยด์จริง กดแล้วเปิดดูใหญ่
 * จอ xl เรียงตาม XL_PER_ROW และจอ md 2 ต่อแถว โดยแถวที่ไม่เต็มอยู่กลาง: เหมือนรูปที่จัดวางบนหน้าสมุด ไม่ใช่ตารางที่ขาดช่อง
 * มือถือเลื่อนแนวนอนแบบ snap ทีละใบ (ใบถัดไปโผล่ให้เห็นว่ามีต่อ): เรียงลงมาทุกใบจะยาวกว่า timeline ทั้งหมด
 * ไม่พิมพ์: หน้าพิมพ์เป็นเอกสารข้อความ
 */
function FieldPhotos() {
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  return (
    <div className="mt-16 print:hidden">
      {/* เส้นคั่นอยู่ใต้ป้าย ไม่ใช่บนแถบรูป: แถบรูปบนมือถือกว้างถึงขอบจอ เส้นจะยาวเกินเส้นของ timeline ข้างบน */}
      <h3 className={`${GROUP_LABEL} border-b border-rule pb-2`}>In the field</h3>
      {/* pt-8 / pb-4: overflow-x ตัดทุกอย่างที่ล้นกล่อง จึงต้องเว้นที่ให้เทป มุมรูปที่เอียง และวง focus
          -mx-4 + px-4: แถบเลื่อนได้ถึงขอบจอ แต่ใบแรกยังเริ่มตรงแนวข้อความ (scroll-px-4 ให้จุด snap อยู่แนวเดียวกัน) */}
      <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-8 pb-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:justify-center md:gap-x-8 md:gap-y-10 md:overflow-visible md:px-0 md:pt-10 md:pb-0">
        {PHOTOS.map((photo, index) => {
          const tilt: CSSProperties = { "--tilt": TILTS[index % TILTS.length] };
          return (
            <li key={photo.file} className={`reveal w-4/5 shrink-0 snap-start md:w-[calc((100%-2rem)/2)] ${XL_WIDTH[XL_PER_ROW]}`}>
              <button
                type="button"
                onClick={() => setPhotoIndex(index)}
                style={tilt}
                // h-full: ใบในแถวเดียวกันสูงเท่ากันแม้คำบรรยายยาวไม่เท่ากัน ที่ว่างไปอยู่ขอบล่างแบบโพลารอยด์
                className="taped-photo relative block h-full w-full cursor-zoom-in rounded-card border border-rule bg-surface p-3 text-left"
              >
                <span aria-hidden="true" className="photo-tape" />
                <span className="sr-only">{photo.video ? "Play video: " : "View larger: "}</span>
                {/* relative ครอบเฉพาะรูป: ป้ายเล่นอยู่กลางรูป ไม่ใช่กลางโพลารอยด์ที่รวมคำบรรยาย */}
                <span className="relative block">
                  <MediaImage
                    src={photo.src}
                    srcSet={photo.srcSet}
                    sizes={`(min-width: 80rem) ${XL_SIZE[XL_PER_ROW]}, (min-width: 48rem) 42vw, 75vw`}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full rounded-tag"
                  />
                  {photo.video && <PlayBadge />}
                </span>
                <span className="mt-3 block type-small text-ink">{photo.caption}</span>
                <span className="mt-1 block type-caption text-ink-muted">{photo.role}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Lightbox photos={PHOTOS} index={photoIndex} onChange={setPhotoIndex} />
    </div>
  );
}
