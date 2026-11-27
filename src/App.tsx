import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import BackToTop from "./components/BackToTop";
import CommandPalette from "./components/CommandPalette";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProjectPage from "./components/ProjectPage";
import ToastProvider from "./components/Toast";
import { projects } from "./data";
import { useProjectRoute } from "./lib/route";
import { closeAuxiliaryDialogs } from "./lib/topDialog";
import { ProjectFilterContext } from "./lib/projectFilter";
import ContactSection from "./sections/ContactSection";
import EducationSection from "./sections/EducationSection";
import ExperienceSection from "./sections/ExperienceSection";
import HeroSection from "./sections/HeroSection";
import ProjectsSection from "./sections/ProjectsSection";
import SkillsSection from "./sections/SkillsSection";

export default function App() {
  const projectId = useProjectRoute();
  const isProject = projects.some(({ id }) => id === projectId);
  const [homeReady, setHomeReady] = useState(!isProject);
  // คนที่เปิดลิงก์ตรงอ่านรายงานก่อน ส่วนคนที่มาจากหน้าแรกเก็บ scroll และ focus เดิมไว้
  if (!isProject && !homeReady) setHomeReady(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tag, setTag] = useState<string | null>(null);
  const projectFilter = useMemo(() => ({ tag, setTag }), [tag]);

  useLayoutEffect(() => {
    // เก็บ HTML สำรองจนกว่า UI จริงจะวาดสำเร็จ
    if (homeReady) document.getElementById("site-fallback")?.remove();
  }, [homeReady]);

  // ⌘K (Mac) / Ctrl+K เปิด-ปิด command palette จากที่ไหนก็ได้
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.repeat && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("popstate", closeAuxiliaryDialogs, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("popstate", closeAuxiliaryDialogs, true);
    };
  }, []);

  const openPalette = () => setPaletteOpen(true);

  return (
    <ToastProvider>
      <ProjectFilterContext.Provider value={projectFilter}>
        {/* overflow-x-clip (ไม่ใช่ hidden) → ไม่กลายเป็น scroll container จึงไม่ตัดเนื้อหาตอนพิมพ์ */}
        <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-paper text-ink">
          {homeReady && <>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:bg-pen focus:px-4 focus:py-3 focus:type-label focus:text-on-pen"
            >
              Skip to content
            </a>
            {/* เส้น margin สีแดงของหน้าสมุด: อยู่เหนือ navbar (z สูงกว่า) เส้นจึงต่อกันตลอดหน้า และไม่รับการคลิก */}
            <div aria-hidden="true" className="margin-line z-[60] print:hidden" />

            <Navbar onOpenPalette={openPalette} />
            <main id="main" tabIndex={-1} className="flex-1 outline-none">
              <ErrorBoundary>
                <HeroSection />
              </ErrorBoundary>
              <ErrorBoundary>
                <ProjectsSection />
              </ErrorBoundary>
              <ErrorBoundary>
                <ExperienceSection />
              </ErrorBoundary>
              <ErrorBoundary>
                <SkillsSection />
              </ErrorBoundary>
              <ErrorBoundary>
                <EducationSection />
              </ErrorBoundary>
              <ErrorBoundary>
                <ContactSection />
              </ErrorBoundary>
            </main>
            <Footer onOpenPalette={openPalette} />

            <BackToTop />
          </>}
          <ProjectPage />
          <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </div>
      </ProjectFilterContext.Provider>
    </ToastProvider>
  );
}
