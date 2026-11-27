import { useState, type ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & { src: string; width: number; height: number };

/** คงสัดส่วนเดิมเมื่อรูปหายเพื่อไม่ให้แกลเลอรีและตำแหน่ง focus กระโดด */
export default function MediaImage(props: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!props.src || failedSrc === props.src) {
    return (
      <span
        role={props.alt ? "img" : undefined}
        aria-label={props.alt ? `Image unavailable: ${props.alt}` : undefined}
        style={{ aspectRatio: `${props.width} / ${props.height}` }}
        className={`grid place-items-center bg-paper px-2 text-center type-caption text-ink-muted ${props.className ?? ""}`}
      >
        Image unavailable
      </span>
    );
  }
  return <img {...props} onError={() => setFailedSrc(props.src)} />;
}
