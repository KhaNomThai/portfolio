import { useEffect, useRef, useState } from "react";
import avatar320 from "../assets/images/profile/profile-320.webp";
import avatar640 from "../assets/images/profile/profile-640.webp";
import CountUp from "../components/CountUp";
import NewTabHint from "../components/NewTabHint";
import SkillMarker from "../components/SkillMarker";
import { ArrowUpRightIcon, ChevronRightIcon, DownloadIcon, GitHubIcon, LinkedInIcon, MailIcon, MapPinIcon } from "../components/icons";
import { TOP_ID } from "../config/sections";
import { githubUrl, heroTelemetry, heroTracks, highlights, linkedinUrl, profile, type HeroTrack } from "../data";
import { CV_FILENAME, CV_URL } from "../lib/cv";
import { HERO_MARK_DELAY_MS, highlightPhrases } from "../lib/highlight";
import { linkProps } from "../lib/links";
import { jumpToEvidence, onRouteClick, projectPath } from "../lib/route";
import { usePhotoTilt } from "../lib/useCardTilt";
import { useInViewOnce } from "../lib/useInViewOnce";

/** ปุ่มรอง: พื้นบัตรคำ ขอบ stroke (ขอบ control ต้องได้ 3:1) */
const LINE_BUTTON =
  "inline-flex h-11 items-center gap-2 rounded-control border border-stroke bg-surface px-4 type-label text-ink btn-ink";

/**
 * หน้าแรกของสมุด: ภายใน 5 วินาทีต้องบอกได้ว่าเป็นใคร (ชื่อ) ทำอะไร (role + summary) และมองหางานอะไร (availability)
 * ลำดับตามที่ recruiter สแกน: ชื่อ → ตำแหน่ง → งานที่หา → หลักฐาน (ถูกขีดเน้น) → ปุ่ม → ตัวเลขสรุป
 * motion ตอนโหลดเป็น sequence เดียวราว 3.5 วินาที เหมือนมีคนกำลังจดหน้านี้: ชื่อเขียนทีละตัว → ปากกาเน้นขีดหลักฐาน
 * พร้อมตัวเลขสรุปนับขึ้น → ลายมือแดงวงงานที่หาและชี้รูป ข้อความอื่นอ่านได้ทันทีโดยไม่ต้องรอ
 * ตามด้วยลายเซ็นมุมรูป ส่วนหมึกตามเคอร์เซอร์และรูปติดเทป (เอียงตามเมาส์ ปากกาวาดกรอบ คำบรรยาย) ขยับเฉพาะตอนผู้ใช้ชี้
 */
export default function HeroSection() {
  const { inkRef, coordRef, curveRef } = useInkFollowsPointer();
  const photoRef = usePhotoTilt();
  const [activeTrackId, setActiveTrackId] = useState<HeroTrack["id"]>("ml");
  // นับทันทีที่โผล่ขอบจอ: บนมือถือแถวนี้อยู่ขอบล่างของจอแรก ถ้ารอเห็น 60% คนจะเห็น "0.00" ค้างอยู่
  const [factsRef, factsSeen] = useInViewOnce<HTMLDListElement>(0);
  const activeTrack = heroTracks.find((t) => t.id === activeTrackId) ?? heroTracks[0];

  return (
    <section id={TOP_ID} aria-labelledby="hero-heading" className="relative isolate pt-(--nav-height)">
      <div aria-hidden="true" className="hero-grid -z-10 print:hidden">
        <div ref={inkRef} className="hero-ink" />
        <HeroDecisionCanvas curveRef={curveRef} activeTrack={activeTrackId} />
      </div>
      {/* ป้ายพิกัดตารางกราฟสดมุมขวาบนของสมุด: แสดงเฉพาะเมื่อเลื่อนเมาส์ใน hero บนจอใหญ่ */}
      <div
        ref={coordRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-[calc(var(--nav-height)+0.75rem)] right-8 z-10 hidden rounded-tag border border-rule bg-surface/90 px-2.5 py-1 type-caption tabular-nums text-pen opacity-0 transition-opacity duration-(--duration-base) lg:block print:hidden"
      >
        grid (0, 0)
      </div>

      <div className="page-container pb-16 pt-12 md:pb-24 md:pt-16 xl:pt-20">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_16.5rem] lg:gap-14">
          <div>
            {/* จอเล็กไม่มีรูปติดเทปข้างขวา จึงใส่รูปย่อเหนือชื่อแทน เล็กพอที่ชื่อยังอยู่ครึ่งบนของจอแรก
                โหลดรูปจริงเฉพาะจอต่ำกว่า lg ด้วยเหตุผลเดียวกับรูปใหญ่ด้านล่าง */}
            <picture className="taped-photo stamp-in mb-6 block w-fit rounded-card border border-rule bg-surface p-1 [--tilt:-3deg] lg:hidden">
              <source media="(max-width: 63.98rem)" srcSet={`${avatar320} 320w, ${avatar640} 640w`} sizes="80px" />
              <img
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                alt={`Portrait of ${profile.name}`}
                width={80}
                height={80}
                className="size-20 rounded-tag object-cover"
              />
            </picture>
            <h1 id="hero-heading" className="type-display text-ink outline-none [text-shadow:var(--hero-glow)]">
              {/* ตัวอักษรแยกเป็น span ทีละตัวเพื่อเล่น animation จึงซ่อนจาก screen reader แล้วให้อ่านชื่อเต็มแทน */}
              <span className="sr-only">{profile.name}</span>
              <WrittenName />
            </h1>

            {/* สายงานมาก่อนสถานะ: recruiter สาย DS/ML ต้องเห็นคำว่า Data Science & ML ในบรรทัดแรกใต้ชื่อ */}
            <p className="mt-6 type-title text-ink">{profile.focus}</p>
            <p className="mt-1 type-body text-ink-muted">
              {profile.role}, {profile.school}
            </p>
            <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              {/* งานที่มองหา: กรอบบางแบบตราประทับ ให้เห็นแยกจากข้อความรอบข้าง โดยไม่ต้องใช้สีสถานะ */}
              <li className="relative rounded-tag border border-stroke px-2 py-1 type-label text-ink">
                {profile.availability}
                <CircleDoodle />
              </li>
              <li className="flex items-center gap-1 type-small text-ink-muted">
                <MapPinIcon className="size-4" />
                {profile.location}
              </li>
            </ul>

            <p className="mt-6 max-w-measure-lead type-lead text-ink">
              {highlightPhrases(profile.summary, profile.summaryMarks)}
            </p>

            {/* ปุ่มหลัก (สี pen) คือสิ่งที่ recruiter อยากกดที่สุด: resume ส่วนลิงก์อื่นเป็นปุ่มรอง */}
            <div className="mt-8 flex flex-wrap items-center gap-3 print:hidden">
              <a
                href={CV_URL}
                download={CV_FILENAME}
                className="group inline-flex h-11 items-center gap-2 rounded-control bg-pen px-4 type-label text-on-pen btn-lift hover:bg-pen-hover"
              >
                {/* ลูกศรดาวน์โหลดขยับลงนิดหนึ่งตอนชี้: บอกว่ากดแล้วได้ไฟล์ */}
                <DownloadIcon className="size-4 transition-transform duration-(--duration-base) ease-out group-hover:translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0" />
                Download resume (PDF)
              </a>
              <a {...linkProps(githubUrl)} className={LINE_BUTTON}>
                <GitHubIcon className="size-4" />
                GitHub
                <NewTabHint href={githubUrl} />
              </a>
              <a {...linkProps(linkedinUrl)} className={LINE_BUTTON}>
                <LinkedInIcon className="size-4" />
                LinkedIn
                <NewTabHint href={linkedinUrl} />
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex h-11 items-center gap-2 px-2 type-label text-pen underline underline-offset-3 transition-colors duration-(--duration-fast) hover:text-pen-hover"
              >
                <MailIcon className="size-4" />
                Email
              </a>
            </div>

            {/* แผง Interactive Track Lens: ให้ recruiter สลับส่องผลงานเด่น 3 สายงานได้ทันทีตั้งแต่หน้าแรก */}
            <HeroTrackLens activeTrack={activeTrack} onSelectTrack={setActiveTrackId} />
          </div>

          {/* คอลัมน์ขวาเฉพาะจอ lg: รูปโพลารอยด์ติดเทป + บัตรสรุปสเกลข้อมูลจริง (เติมพื้นที่ใต้รูปให้สมดุลกับฝั่งซ้าย) */}
          <div className="hidden flex-col justify-between lg:flex">
            <figure
              ref={photoRef}
              className="taped-photo photo-tilt photo-ink relative self-start rounded-card border border-rule bg-surface p-2"
            >
              <span aria-hidden="true" className="photo-tape" />
              <ArrowDoodle />
              <SignatureDoodle />
              <picture>
                <source media="(min-width: 64rem)" srcSet={`${avatar320} 320w, ${avatar640} 640w`} sizes="248px" />
                <img
                  src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                  alt={`Portrait of ${profile.name}`}
                  width={248}
                  height={248}
                  className="aspect-square w-full rounded-tag object-cover"
                />
              </picture>
              <span aria-hidden="true" className="photo-caption absolute inset-x-2 bottom-2 rounded-b-tag px-3 pt-8 pb-2 type-lead text-ink">
                {profile.photoCaption}
              </span>
            </figure>

            {/* บัตรบันทึกสเกลข้อมูลจริงใต้รูปโพลารอยด์ (เว้น mt-20 ให้พ้นลูกศร ArrowDoodle) */}
            <aside aria-label="Dataset scale highlights" className="surface-sheen mt-20 rounded-card border border-rule bg-surface p-4 print:hidden">
              <div className="flex items-center justify-between border-b border-margin pb-2">
                <p className="type-caption font-semibold text-ink">Empirical scale</p>
                <span className="inline-flex items-center gap-1.5 type-caption text-pen">
                  <span className="size-2 rounded-full bg-pen" />
                  Verified
                </span>
              </div>
              <dl className="mt-3 grid gap-2.5">
                {heroTelemetry.map((item) => (
                  <div key={item.label} className="border-b border-rule pb-2 last:border-b-0 last:pb-0">
                    <dt className="type-caption text-ink-muted">{item.label}</dt>
                    <dd className="type-title tabular-nums text-ink">
                      <CountUp value={item.value} start={factsSeen} delay={HERO_MARK_DELAY_MS} />
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </div>

        {/* บัตรดัชนีหลักฐาน 4 ใบท้าย Hero: ยกระดับจากข้อความเปลือยเป็นบัตรคำที่กดกระโดดไปดูหลักฐานจริงได้ */}
        <dl ref={factsRef} className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 md:mt-14 lg:grid-cols-4 lg:gap-4">
          {highlights.map((h, i) => {
            const val = h.mark ? (
              highlightPhrases(h.value, [h.value])
            ) : h.countUp === false ? (
              h.value
            ) : (
              <CountUp value={h.value} start={factsSeen} delay={HERO_MARK_DELAY_MS} />
            );
            return (
              <div
                key={h.label}
                className="surface-sheen group relative flex flex-col-reverse justify-between gap-2 rounded-card border border-rule bg-surface p-4 transition-[translate,border-color,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-0.5 hover:border-pen/50 hover:shadow-overlay has-[a:focus-visible]:-translate-y-0.5 has-[a:focus-visible]:border-pen/50 has-[a:focus-visible]:shadow-overlay motion-reduce:translate-y-0!"
              >
                <dt className="type-small text-ink-muted">{h.label}</dt>
                <dd className="grid gap-1">
                  <div className="flex items-center justify-between">
                    <span aria-hidden="true" className="type-caption tabular-nums text-ink-muted">
                      0{i + 1}
                    </span>
                    {h.target && (
                      <ArrowUpRightIcon className="size-4 shrink-0 text-ink-muted transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-pen motion-reduce:transition-none" />
                    )}
                  </div>
                  <div className="type-title text-ink">
                    {h.target ? (
                      <a
                        href={`#${h.target.section}`}
                        onClick={(e) => {
                          e.preventDefault();
                          jumpToEvidence(h.target!.section, h.target!.itemId);
                        }}
                        className="outline-none after:absolute after:inset-0 after:rounded-card group-hover:text-pen focus-visible:text-pen"
                      >
                        {val}
                      </a>
                    ) : (
                      <span>{val}</span>
                    )}
                  </div>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

/**
 * แผงสำรวจผลงานแยกตามสายงานใน Hero (Interactive Track Lens):
 * กดสลับดู 3 สายงานหลัก พร้อมไฮไลต์กลุ่มจุดบนกระดาษกราฟข้างหลังและแสดงการ์ดย่อย 3 ใบที่กดไปดูโปรเจกต์ได้ทันที
 */
function HeroTrackLens({
  activeTrack,
  onSelectTrack,
}: {
  activeTrack: HeroTrack;
  onSelectTrack: (id: HeroTrack["id"]) => void;
}) {
  return (
    <div className="surface-sheen mt-10 rounded-card border border-rule bg-surface p-4 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-3">
        <span className="type-caption font-semibold text-ink-muted">Interactive track lens</span>
        <div role="group" aria-label="Explore focus tracks" className="flex flex-wrap gap-1.5">
          {heroTracks.map((track) => {
            const selected = track.id === activeTrack.id;
            return (
              <button
                key={track.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelectTrack(track.id)}
                className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-control border border-stroke bg-paper px-3 type-caption font-semibold text-ink transition-colors duration-(--duration-fast) not-aria-pressed:hover:border-pen not-aria-pressed:hover:text-pen aria-pressed:border-pen aria-pressed:bg-pen aria-pressed:text-on-pen"
              >
                <SkillMarker family={track.id} inherit={selected} />
                {track.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-2.5 type-small text-ink-muted">{activeTrack.summary}</p>

      <ul className="mt-3 grid gap-2.5 sm:grid-cols-3">
        {activeTrack.items.map((item) => (
          <li
            key={item.title}
            className="group relative flex flex-col justify-between rounded-control border border-rule bg-paper p-3 transition-colors duration-(--duration-fast) hover:border-pen"
          >
            <div>
              <div className="flex items-center justify-between gap-1.5">
                <span className="rounded-tag bg-marker px-1.5 py-0.5 type-caption font-semibold tabular-nums text-on-marker">
                  {item.badge}
                </span>
                <ChevronRightIcon className="size-3.5 shrink-0 text-ink-muted transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:text-pen" />
              </div>
              <p className="mt-2 type-label text-ink group-hover:text-pen">
                {item.projectId ? (
                  <a
                    href={projectPath(item.projectId)}
                    onClick={onRouteClick}
                    className="outline-none after:absolute after:inset-0 after:rounded-control"
                  >
                    {item.title}
                  </a>
                ) : item.target ? (
                  <a
                    href={`#${item.target.section}`}
                    onClick={(e) => {
                      e.preventDefault();
                      jumpToEvidence(item.target!.section, item.target!.itemId);
                    }}
                    className="outline-none after:absolute after:inset-0 after:rounded-control"
                  >
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </p>
            </div>
            <p className="mt-1 type-caption text-ink-muted">{item.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** ชื่อเขียนทีละตัว (hero-letter): นามสกุลต่อจังหวะจากชื่อ จึงเหมือนเขียนต่อเนื่องสองบรรทัด */
function WrittenName() {
  const words = [profile.firstName, profile.lastName];
  let index = 0;
  return (
    <span aria-hidden="true">
      {words.map((word) => (
        // nowrap: ตัวอักษรเป็น inline-block แยกกัน browser จึงตัดบรรทัดกลางคำได้ถ้าไม่บังคับ
        <span key={word} className="block whitespace-nowrap">
          {[...word].map((letter, i) => (
            <span key={i} className="hero-letter" style={{ "--i": index++ }}>
              {letter}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

/** จังหวะลายมือ: เริ่มตอนปากกาเน้นวลีแรกขีดเสร็จ (เท่า --duration-intro) ระหว่างที่วลีที่สองยังขีดอยู่ */
const DOODLE_DELAY_MS = HERO_MARK_DELAY_MS + 720;

/** วงปากกาแดงรอบงานที่มองหา: ลากวนเกินจุดเริ่มนิดหนึ่งแบบวงด้วยมือจริง */
function CircleDoodle() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 60"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -inset-x-3 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+1.5rem)] overflow-visible print:hidden"
    >
      <path
        className="doodle"
        pathLength={1}
        style={{ "--doodle-delay": `${DOODLE_DELAY_MS}ms` }}
        d="M38 6C95 0 182 4 195 26C205 48 130 59 64 56C16 53 1 40 6 25C12 9 62 3 120 5"
      />
    </svg>
  );
}

/**
 * ลูกศรลายมือใต้รูปชี้ขึ้นไปที่รูป: เส้นก่อน แล้วค่อยหัวลูกศร
 * ปลายพุ่งขึ้นเฉียง 45° เข้าหารูปและหยุดห่างขอบล่าง ไม่ขนานกับขอบ (ถ้าขนาน ลูกศรดูชี้ไปข้าง ๆ ไม่ใช่ชี้รูป)
 */
function ArrowDoodle() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 56" className="pointer-events-none absolute -bottom-16 -left-6 w-16 overflow-visible">
      <path
        className="doodle"
        pathLength={1}
        style={{ "--doodle-delay": `${DOODLE_DELAY_MS + 300}ms` }}
        d="M8 54C10 36 34 20 46 8"
      />
      <path
        className="doodle"
        pathLength={1}
        style={{ "--doodle-delay": `${DOODLE_DELAY_MS + 800}ms` }}
        d="M33 11L46 8L43 21"
      />
    </svg>
  );
}

/**
 * ลายเซ็น "Kul" มุมรูป: ลอกเส้นจากลายเซ็นท้ายหน้า (Footer) มาแค่ K-u-l จึงเป็นลายมือเดียวกันทั้งเว็บ
 * เส้นที่สามตัดก่อนตัว a แล้วต่อเส้นตวัดสั้นของตัวเอง (C84 48... ไม่มีใน Footer)
 * จอ lg ถึงก่อน xl ขอบขวาของหน้าเหลือแค่ 2rem จึงยื่นออกนอกรูปน้อยกว่า ไม่อย่างนั้นหางตัว l ถูก overflow-x-clip ของหน้าตัดทิ้ง
 * เริ่มพร้อมหัวลูกศร เส้นห่างกัน 200ms ใช้สีแดงแบบลายมืออื่นใน hero เพราะสี ink ทับรูปแล้วกลืนกับพื้นสว่างในรูปตอนโหมดมืด
 */
const KUL_STROKES = [
  "M22 14C21 28 19 42 16 58",
  "M44 16C36 26 27 33 19 37C27 38 33 46 38 56C40 59 43 59 46 55",
  "M46 55C48 48 50 42 52 38C52 46 51 53 55 54C59 55 62 46 64 38C63 46 62 53 66 54C69 54 71 48 73 40C76 28 79 16 80 10C78 22 75 40 75 50C75 55 78 56 81 52C84 48 87 46 90 45",
];

function SignatureDoodle() {
  return (
    <svg aria-hidden="true" viewBox="12 6 82 56" className="pointer-events-none absolute -top-9 -right-8 w-20 xl:-right-12 -rotate-6 overflow-visible">
      {KUL_STROKES.map((d, i) => (
        <path key={d} className="doodle" pathLength={1} style={{ "--doodle-delay": `${DOODLE_DELAY_MS + 700 + i * 200}ms` }} d={d} />
      ))}
    </svg>
  );
}

/**
 * จุดข้อมูลสัญลักษณ์หมวด (● ML/DL, ■ Data, ▲ Full-stack) และเส้นแบ่งเขต Decision Boundary บนกระดาษกราฟใน Hero
 * เมื่อผู้ใช้เลือกสายงานใน HeroTrackLens จุดของสายงานนั้นจะสว่างเป็นสี pen พร้อมเส้นเชื่อมกลุ่ม (cluster mesh)
 */
const SCATTER_POINTS: { x: number; y: number; kind: HeroTrack["id"] }[] = [
  { x: 640, y: 72, kind: "ml" },
  { x: 712, y: 120, kind: "ml" },
  { x: 784, y: 64, kind: "ml" },
  { x: 856, y: 144, kind: "ml" },
  { x: 664, y: 192, kind: "data" },
  { x: 760, y: 216, kind: "data" },
  { x: 832, y: 184, kind: "data" },
  { x: 736, y: 288, kind: "stack" },
  { x: 832, y: 264, kind: "stack" },
  { x: 904, y: 216, kind: "stack" },
];

function HeroDecisionCanvas({
  curveRef,
  activeTrack,
}: {
  curveRef: React.RefObject<SVGPathElement | null>;
  activeTrack: HeroTrack["id"];
}) {
  const activePts = SCATTER_POINTS.filter((p) => p.kind === activeTrack);

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 420"
      preserveAspectRatio="xMidYMin slice"
      className="pointer-events-none absolute inset-0 hidden size-full opacity-65 md:block"
    >
      <path
        ref={curveRef}
        d="M 560 360 Q 740 180 980 48"
        fill="none"
        className="stroke-margin/55"
        strokeWidth={1.5}
        strokeDasharray="5 5"
      />
      {/* เส้นเชื่อมระหว่างจุดในสายงานที่กำลังเลือกอยู่ */}
      {activePts.map((pt, i) => {
        const next = activePts[i + 1];
        if (!next) return null;
        return (
          <line
            key={`edge-${i}`}
            x1={pt.x}
            y1={pt.y}
            x2={next.x}
            y2={next.y}
            className="stroke-pen/45"
            strokeWidth={1.25}
          />
        );
      })}
      {SCATTER_POINTS.map((pt, i) => {
        const highlighted = pt.kind === activeTrack;
        const fillClass = highlighted ? "fill-pen" : "fill-key/35";
        if (pt.kind === "ml") {
          return <circle key={i} cx={pt.x} cy={pt.y} r={highlighted ? 5.5 : 4} className={fillClass} />;
        }
        if (pt.kind === "data") {
          const s = highlighted ? 9 : 7;
          return <rect key={i} x={pt.x - s / 2} y={pt.y - s / 2} width={s} height={s} className={fillClass} />;
        }
        const d = highlighted ? 6 : 4.5;
        return (
          <polygon
            key={i}
            points={`${pt.x},${pt.y - d} ${pt.x + d},${pt.y + d * 0.8} ${pt.x - d},${pt.y + d * 0.8}`}
            className={fillClass}
          />
        );
      })}
    </svg>
  );
}

/**
 * เส้นกราฟรอบเคอร์เซอร์กลายเป็นหมึกสีปากกา (hero-ink ใน index.css) พร้อมอัปเดตป้ายพิกัดตารางและเส้นโค้ง Decision Boundary
 * เฉพาะเมาส์/trackpad และผู้ใช้ที่ไม่ได้ปิด motion เขียนค่าลง DOM ตรง ๆ ทีละเฟรม ไม่ทำให้ React render ใหม่
 */
function useInkFollowsPointer() {
  const inkRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLDivElement>(null);
  const curveRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const ink = inkRef.current;
    const section = ink?.closest("section");
    if (!ink || !section) return;
    const allowed = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;

    const move = (e: PointerEvent) => {
      if (!allowed.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = ink.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ink.style.setProperty("--ink-x", `${x}px`);
        ink.style.setProperty("--ink-y", `${y}px`);
        ink.dataset.active = "";

        const coord = coordRef.current;
        if (coord) {
          const gx = Math.max(0, Math.floor(x / 24));
          const gy = Math.max(0, Math.floor(y / 24));
          const slope = (((y / Math.max(1, rect.height)) - 0.5) * 0.6).toFixed(2);
          coord.textContent = `grid (${gx}, ${gy}) · Δθ ${slope} rad`;
          coord.style.opacity = "1";
        }

        const curve = curveRef.current;
        if (curve) {
          const nx = Math.min(920, Math.max(600, 620 + (x / Math.max(1, rect.width)) * 260));
          const ny = Math.min(300, Math.max(90, 110 + (y / Math.max(1, rect.height)) * 160));
          curve.setAttribute("d", `M 560 360 Q ${Math.round(nx)} ${Math.round(ny)} 980 48`);
        }
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      delete ink.dataset.active;
      if (coordRef.current) coordRef.current.style.opacity = "0";
    };

    section.addEventListener("pointermove", move);
    section.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", leave);
    };
  }, []);

  return { inkRef, coordRef, curveRef };
}
