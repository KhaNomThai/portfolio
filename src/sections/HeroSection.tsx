import { useEffect, useRef } from "react";
import avatar320 from "../assets/images/profile/profile-320.webp";
import avatar640 from "../assets/images/profile/profile-640.webp";
import CountUp from "../components/CountUp";
import NewTabHint from "../components/NewTabHint";
import { DownloadIcon, GitHubIcon, LinkedInIcon, MailIcon, MapPinIcon } from "../components/icons";
import { TOP_ID } from "../config/sections";
import { githubUrl, highlights, linkedinUrl, profile } from "../data";
import { CV_FILENAME, CV_URL } from "../lib/cv";
import { HERO_MARK_DELAY_MS, highlightPhrases } from "../lib/highlight";
import { linkProps } from "../lib/links";
import { useInViewOnce } from "../lib/useInViewOnce";

/** ปุ่มรอง: พื้นบัตรคำ ขอบ stroke (ขอบ control ต้องได้ 3:1) */
const LINE_BUTTON =
  "inline-flex h-11 items-center gap-2 rounded-control border border-stroke bg-surface px-4 type-label text-ink btn-ink";

/**
 * หน้าแรกของสมุด: ภายใน 5 วินาทีต้องบอกได้ว่าเป็นใคร (ชื่อ) ทำอะไร (role + summary) และมองหางานอะไร (availability)
 * ลำดับตามที่ recruiter สแกน: ชื่อ → ตำแหน่ง → งานที่หา → หลักฐาน (ถูกขีดเน้น) → ปุ่ม → ตัวเลขสรุป
 * motion ตอนโหลดเป็น sequence เดียวราว 3 วินาที เหมือนมีคนกำลังจดหน้านี้: ชื่อเขียนทีละตัว → ปากกาเน้นขีดหลักฐาน
 * พร้อมตัวเลขสรุปนับขึ้น → ลายมือแดงวงงานที่หาและชี้รูป ข้อความอื่นอ่านได้ทันทีโดยไม่ต้องรอ
 * ส่วนหมึกตามเคอร์เซอร์และรูปติดเทปขยับเฉพาะตอนผู้ใช้ชี้
 */
export default function HeroSection() {
  const inkRef = useInkFollowsPointer();
  // นับทันทีที่โผล่ขอบจอ: บนมือถือแถวนี้อยู่ขอบล่างของจอแรก ถ้ารอเห็น 60% คนจะเห็น "0.00" ค้างอยู่
  const [factsRef, factsSeen] = useInViewOnce<HTMLDListElement>(0);

  return (
    <section id={TOP_ID} aria-labelledby="hero-heading" className="relative isolate pt-(--nav-height)">
      <div aria-hidden="true" className="hero-grid -z-10 print:hidden">
        <div ref={inkRef} className="hero-ink" />
      </div>

      <div className="page-container pb-16 pt-12 md:pb-24 md:pt-16 xl:pt-24">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16">
          <div>
            {/* จอเล็กไม่มีรูปติดเทปข้างขวา จึงใส่รูปย่อเหนือชื่อแทน เล็กพอที่ชื่อยังอยู่ครึ่งบนของจอแรก
                โหลดรูปจริงเฉพาะจอต่ำกว่า lg ด้วยเหตุผลเดียวกับรูปใหญ่ด้านล่าง */}
            <picture className="mb-6 block w-fit rounded-card border border-rule bg-surface p-1 lg:hidden">
              <source media="(max-width: 63.98rem)" srcSet={`${avatar320} 320w, ${avatar640} 640w`} sizes="80px" />
              <img
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                alt={`Portrait of ${profile.name}`}
                width={80}
                height={80}
                className="size-20 rounded-tag object-cover"
              />
            </picture>
            <h1 id="hero-heading" className="type-display text-ink outline-none">
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
          </div>

          {/* รูปอยู่ข้างขวาเฉพาะจอใหญ่: บนจอเล็กถ้าวางรูปไว้บนสุด ชื่อจะถูกดันลงไปราว 1 ใน 3 ของจอ จึงไม่แสดงรูป */}
          {/* รูปติดเทปบนหน้าสมุดแบบรูปโพลารอยด์ (taped-photo, photo-tape ใน index.css) */}
          <figure className="taped-photo relative hidden self-start rounded-card border border-rule bg-surface p-2 lg:block">
            <span aria-hidden="true" className="photo-tape" />
            <ArrowDoodle />
            {/* <img> ที่ซ่อนด้วย CSS ยังถูกโหลดอยู่ดี → ใช้ <picture> ให้เลือกรูปจริงเฉพาะจอ lg (64rem) ขึ้นไป
                จอเล็กได้ GIF โปร่งใสขนาด 1px ที่ฝังในหน้า ไม่ต้องโหลดอะไร และไม่แย่ง bandwidth กับ JS/ฟอนต์ */}
            <picture>
              <source media="(min-width: 64rem)" srcSet={`${avatar320} 320w, ${avatar640} 640w`} sizes="240px" />
              <img
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                alt={`Portrait of ${profile.name}`}
                width={240}
                height={240}
                className="aspect-square w-full rounded-tag object-cover"
              />
            </picture>
          </figure>
        </div>

        {/* ตัวเลขสรุป: dt/dd ตามความหมาย แต่สลับลำดับที่ตาเห็น ค่าจึงอยู่บน */}
        <dl ref={factsRef} className="mt-12 grid grid-cols-2 gap-x-6 border-t border-rule md:mt-16 lg:grid-cols-4">
          {highlights.map((h) => (
            <div key={h.label} className="flex flex-col-reverse justify-end gap-1 pt-4 pb-2">
              <dt className="type-small text-ink-muted">{h.label}</dt>
              <dd className="type-title text-ink">
                {h.countUp === false ? h.value : <CountUp value={h.value} start={factsSeen} delay={HERO_MARK_DELAY_MS} />}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
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

/** ลูกศรลายมือใต้รูปชี้ขึ้นไปที่รูป: เส้นก่อน แล้วค่อยหัวลูกศร */
function ArrowDoodle() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 56" className="pointer-events-none absolute -bottom-14 -left-10 w-16 overflow-visible">
      <path
        className="doodle"
        pathLength={1}
        style={{ "--doodle-delay": `${DOODLE_DELAY_MS + 300}ms` }}
        d="M6 52C6 30 22 14 52 10"
      />
      <path
        className="doodle"
        pathLength={1}
        style={{ "--doodle-delay": `${DOODLE_DELAY_MS + 800}ms` }}
        d="M40 3L53 10L42 20"
      />
    </svg>
  );
}

/**
 * เส้นกราฟรอบเคอร์เซอร์กลายเป็นหมึกสีปากกา (hero-ink ใน index.css) เฉพาะเมาส์/trackpad และผู้ใช้ที่ไม่ได้ปิด motion
 * เขียนค่าลง CSS variable ตรง ๆ ทีละเฟรม ไม่ผ่าน state จึงไม่ทำให้ React render ใหม่ทุกครั้งที่ขยับเมาส์
 */
function useInkFollowsPointer() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ink = ref.current;
    const section = ink?.closest("section");
    if (!ink || !section) return;
    const allowed = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;

    const move = (e: PointerEvent) => {
      if (!allowed.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = ink.getBoundingClientRect();
        ink.style.setProperty("--ink-x", `${e.clientX - rect.left}px`);
        ink.style.setProperty("--ink-y", `${e.clientY - rect.top}px`);
        ink.dataset.active = "";
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      delete ink.dataset.active;
    };

    section.addEventListener("pointermove", move);
    section.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", leave);
    };
  }, []);

  return ref;
}
