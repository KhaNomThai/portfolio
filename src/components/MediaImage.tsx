import { useRef, useState, type ImgHTMLAttributes, type ReactNode } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  width: number;
  height: number;
  /** ครอบรูปด้วยตัวเปิด Lightbox แล้ววางปุ่มลองใหม่เป็น sibling เพื่อไม่ซ้อนปุ่ม */
  wrap?: (image: ReactNode) => ReactNode;
  retryClassName?: string;
};

type Retry = { src: string; attempt: number; status: "failed" | "loading" | "loaded" };

/** คงสัดส่วนเดิมเมื่อรูปหายเพื่อไม่ให้แกลเลอรีและตำแหน่ง focus กระโดด */
export default function MediaImage({ wrap, retryClassName = "relative mt-2", ...props }: Props) {
  const [state, setState] = useState<Retry | null>(null);
  const retry = useRef<HTMLButtonElement>(null);
  const current = state?.src === props.src ? state : null;
  const attempt = current?.attempt ?? 0;
  // ลองใหม่ด้วย URL ใหม่เพื่อข้าม cache ของคำตอบที่เสีย ใช้ไฟล์ใหญ่ที่มีอยู่เหมือนปุ่มลองใหม่ใน Lightbox
  const src = attempt ? `${props.src}${props.src.includes("?") ? "&" : "?"}retry=${attempt}` : props.src;

  const image = !src || current?.status === "failed" ? (
    <span
      role={props.alt ? "img" : undefined}
      aria-label={props.alt ? `Image unavailable: ${props.alt}` : undefined}
      style={{ aspectRatio: `${props.width} / ${props.height}` }}
      className={`grid place-items-center bg-paper px-2 text-center type-caption text-ink-muted ${props.className ?? ""}`}
    >
      {props.alt && <span aria-hidden="true">Image unavailable</span>}
    </span>
  ) : (
    <img
      {...props}
      src={src}
      srcSet={attempt ? undefined : props.srcSet}
      loading={attempt ? "eager" : props.loading}
      tabIndex={props.alt && !wrap ? -1 : undefined}
      onError={() => setState({ src: props.src, attempt, status: "failed" })}
      onLoad={(event) => {
        if (current?.status !== "loading") return;
        const img = event.currentTarget;
        if (document.activeElement === retry.current) {
          const target = img.closest<HTMLElement>("button, a") ?? img;
          target.focus({ preventScroll: true });
        }
        setState({ ...current, status: "loaded" });
      }}
    />
  );

  return (
    <>
      {wrap ? wrap(image) : image}
      {current && current.status !== "loaded" && props.alt && (
        <button
          ref={retry}
          type="button"
          aria-label={`Try again: ${props.alt}`}
          aria-disabled={current.status === "loading"}
          onClick={() => {
            if (current.status === "failed") setState({ ...current, attempt: attempt + 1, status: "loading" });
          }}
          className={`z-20 inline-flex min-h-11 items-center self-start rounded-control border border-stroke bg-paper px-3 type-caption text-pen hover:text-pen-hover ${retryClassName}`}
        >
          {current.status === "loading" ? "Loading image…" : "Try again"}
        </button>
      )}
    </>
  );
}
