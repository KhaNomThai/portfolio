import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlayIcon } from "./icons";

type LightboxPhoto = {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  /** มี = lightbox เล่นวิดีโอแทนรูป (รูปเป็นภาพปกในแถบเท่านั้น) */
  video?: { src: string; width: number; height: number };
};

/** ป้ายปุ่มเล่นบนภาพปกของวิดีโอ: บอกว่ากดแล้วได้วิดีโอ ไม่ใช่รูปนิ่ง (ของตกแต่ง ข้อความสำหรับ screen reader อยู่ที่ปุ่ม) */
export function PlayBadge() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-1/2 left-1/2 flex size-12 -translate-1/2 items-center justify-center rounded-card border border-rule bg-surface/90 text-ink"
    >
      <PlayIcon className="size-6" />
    </span>
  );
}

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
 * รูปใหม่จางเข้าด้วย CSS (fade-in): ถ้า chunk ของ framer-motion โหลดไม่ได้ รูปต้องไม่ค้างโปร่งใส
 */
export default function Lightbox({ photos, index, onChange }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reduceMotion = useReducedMotion();
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
  const box = photo?.video ?? photo;
  const style: CSSProperties | undefined = box && {
    width: `min(100vw - 2rem, (100dvh - 9rem) * ${box.width / box.height} + 18px, ${box.width + 18}px)`,
  };

  return (
    <dialog
      ref={dialogRef}
      data-aux-dialog
      aria-label="Photo viewer"
      style={style}
      // ทั้ง Esc, คลิกพื้นหลัง และปุ่มปิด จบที่ event "close" นี้ทางเดียว
      onClose={() => onChange(null)}
      onKeyDown={(e) => {
        // focus อยู่ที่วิดีโอ: ลูกศรเป็นของปุ่มเลื่อนเวลาในตัวเล่น
        if (e.target instanceof HTMLVideoElement) return;
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
      }}
      onPointerDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (downOnBackdrop.current && e.target === e.currentTarget) dialogRef.current?.close();
      }}
      className="m-auto max-w-none overscroll-contain rounded-card border border-rule bg-surface p-0 text-ink shadow-overlay backdrop:bg-paper/70 backdrop:backdrop-blur-sm"
    >
      {photo && index !== null && (
        // padding อยู่ที่ figure ไม่ใช่ dialog: คลิกบนกรอบรอบรูปต้องไม่นับเป็นคลิกพื้นหลัง
        <figure className="p-2">
          <LightboxMedia key={photo.video?.src ?? photo.src} photo={photo} autoplay={!reduceMotion} />
          <figcaption aria-live="polite" aria-atomic="true" className="px-2 pt-2 type-small text-ink">
            {photo.caption}
            <span className="ml-2 whitespace-nowrap type-caption tabular-nums text-ink-muted">
              {index + 1} / {photos.length}
            </span>
          </figcaption>
        </figure>
      )}
      {photo && (
        <div className="flex flex-wrap items-center justify-end gap-1 px-2 pb-2">
          {!photo.video && (
            <a href={photo.src} target="_blank" rel="noreferrer" className="mr-auto inline-flex min-h-11 items-center px-2 type-caption text-pen underline">
              Open full-size image <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
          {photos.length > 1 && (
            <>
              <button type="button" aria-label="Previous photo" onClick={() => step(-1)} className={BUTTON}>
                <ChevronLeftIcon className="size-5" />
              </button>
              <button type="button" aria-label="Next photo" onClick={() => step(1)} className={BUTTON}>
                <ChevronRightIcon className="size-5" />
              </button>
            </>
          )}
          <button type="button" aria-label="Close photo viewer" onClick={() => dialogRef.current?.close()} className={BUTTON}>
            <CloseIcon className="size-5" />
          </button>
        </div>
      )}
    </dialog>
  );
}

function LightboxMedia({ photo, autoplay }: { photo: LightboxPhoto; autoplay: boolean }) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const media = photo.video ?? photo;
  const src = media.src && (attempt ? `${media.src}?retry=${attempt}` : media.src);

  return (
    <div ref={frame} tabIndex={-1}>
      {failed || !src ? (
        <div className="grid place-content-center justify-items-center gap-2 rounded-tag bg-paper p-4 text-center">
          <p role="status" className="type-small text-ink">Could not load this {photo.video ? "video" : "image"}.</p>
          {src && <button type="button" className="min-h-11 rounded-control border border-stroke px-3 type-label text-pen" onClick={() => {
            frame.current?.focus({ preventScroll: true });
            setFailed(false);
            setAttempt((count) => count + 1);
          }}>Try again</button>}
        </div>
      ) : photo.video ? (
        <video
          key={src}
          src={src}
          poster={photo.src}
          width={photo.video.width}
          height={photo.video.height}
          aria-label={photo.alt}
          controls
          muted
          loop
          playsInline
          autoPlay={autoplay}
          preload="metadata"
          onError={() => setFailed(true)}
          className="h-auto w-full rounded-tag"
        />
      ) : (
        <img
          key={src}
          src={src}
          srcSet={attempt ? undefined : photo.srcSet}
          sizes="(min-width: 80rem) 80rem, 100vw"
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          decoding="async"
          onError={() => setFailed(true)}
          className="fade-in h-auto w-full rounded-tag"
        />
      )}
    </div>
  );
}
