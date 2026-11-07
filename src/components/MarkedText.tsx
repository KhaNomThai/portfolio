import { highlightPhrases } from "../lib/highlight";
import { useInViewOnce } from "../lib/useInViewOnce";

/**
 * ข้อความบนการ์ด/รายการที่มีวลีถูกขีดเน้นตอนเลื่อนมาเห็นครั้งแรก
 * ส่ง marks ของทั้งรายการมาได้เลย ตัวนี้เลือกเฉพาะวลีที่อยู่ในข้อความนี้ (วลีที่ไม่อยู่ในช่องไหนเลย check:data จับให้)
 */
export default function MarkedText({ text, marks = [] }: { text: string; marks?: readonly string[] }) {
  const own = marks.filter((phrase) => text.includes(phrase));
  return own.length === 0 ? text : <InViewMarks text={text} phrases={own} />;
}

function InViewMarks({ text, phrases }: { text: string; phrases: string[] }) {
  const [ref, seen] = useInViewOnce<HTMLSpanElement>();
  return <span ref={ref}>{highlightPhrases(text, phrases, seen)}</span>;
}
