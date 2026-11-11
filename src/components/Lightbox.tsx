import { m } from "framer-motion";
import { useEffect, useRef, type CSSProperties } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "./icons";

export type LightboxPhoto = {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
};

type Props = {
  photos: LightboxPhoto[];
  /** null = ปิด */
  index: number | null;
  onChange: (index: number | null) => void;
};

const BUTTON =
  "btn-icon flex size-11 shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors duration-(--duration-fast) hover:bg-paper hover:text-ink";

/**
 * ดูรูปขนาดใหญ่: ใช้ <dialog> ของเบราว์เซอร์แบบเดียวกับ CommandPalette จึงได้ trap focus, ปิดด้วย Esc
 * และคืน focus ให้รูปที่กดเปิดมาโดยไม่ต้องเขียนเอง ← / → เปลี่ยนรูป
 * รูปใหม่จางเข้าอย่างเดียว (opacity): ไม่เลื่อนหรือขยาย จึงใช้ได้กับ prefers-reduced-motion
 */
export default function Lightbox({ photos, index, onChange }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  /** กดลงบนพื้นหลังจริงไหม: ลากจากในกล่องแล้วปล่อยข้างนอกไม่ควรปิด */
  const downOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (index !== null && !dialog.open) dialog.showModal();
    if (index === null && dialog.open) dialog.close();
  }, [index]);

  const photo = index === null ? undefined : photos[index];
  const step = (by: number) => {
    if (index !== null) onChange((index + by + photos.length) % photos.length);
  };

  // กล่องกว้างเท่ารูปพอดี: เลือกค่าที่เล็กสุดระหว่างความกว้างจอ ความกว้างที่ทำให้รูปสูงไม่เกินจอ และขนาดจริงของไฟล์
  // (ถ้าปล่อยให้เบราว์เซอร์คิดจาก max-height ของรูป บนจอเตี้ยกล่องจะกว้างกว่ารูปและเหลือที่ว่างข้าง ๆ) 18px = padding + ขอบของกล่อง
  const style: CSSProperties | undefined = photo && {
    width: `min(100vw - 2rem, (100dvh - 9rem) * ${photo.width / photo.height} + 18px, ${photo.width + 18}px)`,
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label="Photo viewer"
      style={style}
      // ทั้ง Esc, คลิกพื้นหลัง และปุ่มปิด จบที่ event "close" นี้ทางเดียว
      onClose={() => onChange(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
      }}
      onPointerDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (downOnBackdrop.current && e.target === e.currentTarget) dialogRef.current?.close();
      }}
      className="m-auto max-w-none rounded-card border border-rule bg-surface p-0 text-ink shadow-overlay backdrop:bg-paper/70 backdrop:backdrop-blur-sm"
    >
      {photo && index !== null && (
        // padding อยู่ที่ figure ไม่ใช่ dialog: คลิกบนกรอบรอบรูปต้องไม่นับเป็นคลิกพื้นหลัง
        <figure className="p-2">
          <m.img
            key={photo.src}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            src={photo.src}
            srcSet={photo.srcSet}
            sizes="(min-width: 80rem) 80rem, 100vw"
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            loading="lazy"
            decoding="async"
            className="h-auto w-full rounded-tag"
          />
          <div className="flex items-center gap-1 pt-2 pl-2">
            <figcaption className="mr-auto type-small text-ink">
              {photo.caption}
              <span className="ml-2 type-caption tabular-nums text-ink-muted">
                {index + 1} / {photos.length}
              </span>
            </figcaption>
            <button type="button" aria-label="Previous photo" onClick={() => step(-1)} className={BUTTON}>
              <ChevronLeftIcon className="size-5" />
            </button>
            <button type="button" aria-label="Next photo" onClick={() => step(1)} className={BUTTON}>
              <ChevronRightIcon className="size-5" />
            </button>
            <button type="button" aria-label="Close photo viewer" onClick={() => dialogRef.current?.close()} className={BUTTON}>
              <CloseIcon className="size-5" />
            </button>
          </div>
        </figure>
      )}
    </dialog>
  );
}
