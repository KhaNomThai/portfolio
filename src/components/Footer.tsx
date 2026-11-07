import { profile, repoUrl } from "../data";
import { linkProps } from "../lib/links";
import { PALETTE_SHORTCUT } from "../lib/platform";
import { useInViewOnce } from "../lib/useInViewOnce";
import NewTabHint from "./NewTabHint";

export default function Footer({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <footer className="border-t border-rule print:hidden">
      <div className="page-container flex flex-col gap-3 py-8 type-small text-ink-muted md:flex-row md:items-center md:justify-between">
        <div>
          <Signature />
          <p>
            © {new Date().getFullYear()} {profile.name}
          </p>
        </div>
        <p>
          Built with React, TypeScript, Tailwind CSS and Framer Motion.{" "}
          {/* ลิงก์กลางประโยค: ขีดเส้นใต้เสมอ ไม่บอกด้วยสีอย่างเดียว (axe: link-in-text-block) */}
          <a
            {...linkProps(repoUrl)}
            className="text-pen underline underline-offset-3 transition-colors duration-(--duration-fast) hover:text-pen-hover"
          >
            Source code
            <NewTabHint href={repoUrl} />
          </a>
        </p>
        <button
          type="button"
          onClick={onOpenPalette}
          className="hidden min-h-11 items-center gap-2 rounded-control text-left transition-colors duration-(--duration-fast) hover:text-ink md:inline-flex"
        >
          Press
          <kbd className="rounded-tag border border-stroke px-1.5 py-0.5 type-caption text-ink">{PALETTE_SHORTCUT}</kbd>
          for quick actions
        </button>
      </div>
    </footer>
  );
}

/** เส้นของลายเซ็นตามลำดับที่มือเซ็น: [path, เริ่มที่ ms, ใช้เวลา ms] รวมราว 2 วินาที */
const SIGNATURE: [string, number, number][] = [
  ["M22 14C21 28 19 42 16 58", 0, 220],
  ["M44 16C36 26 27 33 19 37C27 38 33 46 38 56C40 59 43 59 46 55", 240, 320],
  [
    "M46 55C48 48 50 42 52 38C52 46 51 53 55 54C59 55 62 46 64 38C63 46 62 53 66 54C69 54 71 48 73 40C76 28 79 16 80 10C78 22 75 40 75 50C75 55 78 56 81 52C83 47 86 42 91 42C86 42 83 47 84 52C85 56 90 55 92 49C92 44 94 41 95 42C94 47 94 53 97 54C100 54 102 50 104 46C102 42 99 42 97 45",
    560,
    420,
  ],
  [
    // path ย่อยแยกเป็นอีกเส้น: pathLength={1} กับ dash คิดความยาวรวมทุก path ย่อย จังหวะวาดจะเพี้ยนถ้ารวมกัน
    "M104 46C106 42 110 41 113 43C109 41 105 45 106 51C107 55 112 55 116 50C119 42 122 26 124 12C121 28 119 44 118 55C121 46 125 42 129 42C132 42 132 48 131 53C131 56 134 56 137 52C139 47 142 42 147 42C142 42 139 47 140 52C141 56 146 55 148 49C148 44 150 41 151 42C150 47 150 53 153 54C156 54 158 49 160 44C161 47 161 50 162 54C163 48 166 43 171 43C174 42 176 45 177 47C179 38 181 26 183 16C181 30 180 44 181 52C182 56 186 56 189 52",
    1000,
    680,
  ],
  ["M172 30C178 30 186 29 194 28", 1700, 160],
  ["M30 64C80 60 140 59 214 54", 1900, 300],
];

/**
 * ลายเซ็นปิดท้ายสมุด เซ็นตัวเองครั้งแรกที่เลื่อนมาเห็น (signature-stroke ใน index.css)
 * ชื่อจริงอยู่ในบรรทัด © ข้างล่างแล้ว ลายเซ็นจึงซ่อนจาก screen reader
 */
function Signature() {
  const [ref, seen] = useInViewOnce<SVGSVGElement>();
  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox="0 0 240 70"
      data-seen={seen ? "" : undefined}
      className="mb-1 w-36 text-ink"
    >
      {SIGNATURE.map(([d, delay, duration]) => (
        <path
          key={d}
          d={d}
          pathLength={1}
          className="signature-stroke"
          style={{ "--sig-delay": `${delay}ms`, "--sig-dur": `${duration}ms` }}
        />
      ))}
    </svg>
  );
}
