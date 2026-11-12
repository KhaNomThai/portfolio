import Section from "../components/Section";
import { BadgeCheckIcon } from "../components/icons";
import { certifications, education, type Certification } from "../data";
import NewTabHint from "../components/NewTabHint";
import { linkProps } from "../lib/links";
import { PHOTO_SIZE, experienceMedia } from "../config/experienceMedia";
import { mediaSources } from "../lib/media";

/** บัตรคำเดียวกับการ์ดโปรเจกต์: พื้น surface ขอบ rule เส้นแดงใต้ชื่อ */
const CARD = "rounded-card border border-rule bg-surface p-6";

/** การ์ดที่มีรูปสูงกว่าการ์ดอื่นมาก จึงอยู่คอลัมน์ขวาคนเดียว ส่วนปริญญากับการ์ดที่ไม่มีรูปซ้อนกันทางซ้าย ให้สองฝั่งสูงใกล้กัน */
export default function EducationSection() {
  return (
    <Section id="education">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          {education.map((it) => (
            <article key={it.id} className={`reveal ${CARD} md:p-8`}>
              <h3 className="border-b border-margin pb-2 type-title text-ink">{it.degree}</h3>
              <p className="mt-3 type-body text-ink">{it.school}</p>
              <p className="mt-1 type-small tabular-nums text-ink-muted">
                {it.period}
                {it.graduation && ` · ${it.graduation}`}
              </p>

              {it.coursework.length > 0 && (
                <>
                  <h4 className="mt-6 type-label text-ink-muted">Relevant coursework</h4>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {it.coursework.map((course) => (
                      <li key={course} className="rounded-tag border border-rule px-2 py-1 type-small text-ink">
                        {course}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          ))}
          {certifications.filter((c) => !experienceMedia[c.id]).map((cert) => (
            <CertCard key={cert.id} cert={cert} />
          ))}
        </div>
        {/* ไม่ใส่ content-start: การ์ดยืดสูงเท่าคอลัมน์ซ้าย ขอบล่างสองฝั่งจึงตรงกัน */}
        <div className="grid gap-6">
          {certifications.filter((c) => experienceMedia[c.id]).map((cert) => (
            <CertCard key={cert.id} cert={cert} />
          ))}
        </div>
      </div>
    </Section>
  );
}

function CertCard({ cert }: { cert: Certification }) {
  return (
    <article className={`reveal flex flex-col ${CARD} md:p-8`}>
      <div className="flex items-baseline justify-between gap-4 border-b border-margin pb-2">
        <h3 className="type-title text-ink">{cert.title}</h3>
        <span className="type-caption tabular-nums text-ink-muted">{cert.year}</span>
      </div>
      <p className="mt-3 flex items-center gap-1 type-small text-ink-muted">
        <BadgeCheckIcon className="size-4" />
        {cert.kind === "scholarship" ? "Scholarship" : "Certification"}, {cert.issuer}
      </p>
      <p className="mt-3 type-body text-ink">{cert.desc}</p>
      {experienceMedia[cert.id]?.map((photo) => (
        // รูปกินที่ที่เหลือเมื่อการ์ดถูกยืด (object-cover ตัดขอบซ้ายขวาแทนการเว้นที่ว่างใต้ caption)
        <figure key={photo.file} className="mt-4 flex flex-1 flex-col">
          <img
            {...mediaSources("experience", photo.file, PHOTO_SIZE.width)}
            sizes="(min-width: 64rem) 24rem, 90vw"
            alt={photo.alt}
            {...PHOTO_SIZE}
            loading="lazy"
            decoding="async"
            className="min-h-0 w-full flex-1 rounded-tag border border-rule object-cover"
          />
          <figcaption className="mt-2 type-caption text-ink-muted">{photo.caption}</figcaption>
        </figure>
      ))}
      {cert.href && (
        <a
          {...linkProps(cert.href)}
          className="mt-3 inline-flex min-h-11 self-start items-center gap-1 type-label text-pen underline underline-offset-3 transition-colors duration-(--duration-fast) hover:text-pen-hover"
        >
          <BadgeCheckIcon className="size-4" />
          View certificate
          <NewTabHint href={cert.href} />
        </a>
      )}
    </article>
  );
}
