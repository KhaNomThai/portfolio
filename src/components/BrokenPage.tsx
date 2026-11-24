import { profile } from "../data";
import { CV_FILENAME, CV_URL } from "../lib/cv";

const LINK = "inline-flex min-h-11 items-center type-label text-pen underline underline-offset-3 hover:text-pen-hover";

/** ทั้งหน้าพัง: สิ่งที่ recruiter ยังต้องได้คือ CV กับอีเมล */
export default function BrokenPage() {
  return (
    <main className="page-container py-16 text-ink">
      <h1 className="type-headline">{profile.name}</h1>
      <p className="mt-4 type-body">Something went wrong while loading this page.</p>
      <p className="mt-2 flex flex-wrap gap-x-6">
        <a href={CV_URL} download={CV_FILENAME} className={LINK}>
          Download resume (PDF)
        </a>
        <a href={`mailto:${profile.email}`} className={LINK}>
          {profile.email}
        </a>
      </p>
    </main>
  );
}
