import { useEffect, useId, useMemo, useRef, useState, type ComponentType, type KeyboardEvent, type SVGProps } from "react";
import { flushSync } from "react-dom";
import { SECTIONS, TOP_ID } from "../config/sections";
import { githubUrl, linkedinUrl, profile, projects, repoUrl } from "../data";
import { CV_FILENAME, CV_URL } from "../lib/cv";
import { projectCountByTag, useProjectFilter } from "../lib/projectFilter";
import { goTo, navigate, projectPath } from "../lib/route";
import { toggleTheme } from "../lib/theme";
import { useCopyEmail } from "../lib/useCopyEmail";
import {
  ArrowUpIcon,
  BeakerIcon,
  CloseIcon,
  CodeIcon,
  CopyIcon,
  DownloadIcon,
  GitHubIcon,
  GridViewIcon,
  HashIcon,
  LinkedInIcon,
  MailIcon,
  MoonIcon,
  NotebookIcon,
  SearchIcon,
} from "./icons";

type Command = {
  id: string;
  label: string;
  /** ข้อความเล็กด้านขวา (ประเภท/ปลายทาง) — ใช้ค้นหาได้ด้วย */
  hint: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  run: () => void;
  /** เปิดแท็บใหม่: บอก screen reader แบบเดียวกับ NewTabHint ของลิงก์ทั่วไป */
  external?: boolean;
};

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function downloadCv() {
  const a = document.createElement("a");
  a.href = CV_URL;
  a.download = CV_FILENAME;
  a.click();
}

type Props = { open: boolean; onClose: () => void };

/** ⌘K / Ctrl+K — ใช้ <dialog> ของเบราว์เซอร์: trap focus, ปิดด้วย Esc และคืน focus ให้ปุ่มที่เปิดให้เอง */
export default function CommandPalette({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const copyEmail = useCopyEmail();
  const { setTag } = useProjectFilter();
  /** กดลงบนพื้นหลังจริงไหม: ลากเลือกข้อความในช่องค้นหาแล้วปล่อยนอกกล่อง click จะไปตกที่ <dialog> ด้วย */
  const downOnBackdrop = useRef(false);

  const commands = useMemo<Command[]>(
    () => [
      ...SECTIONS.map(({ id, label }) => ({
        id: `go-${id}`,
        label,
        hint: "Section",
        Icon: HashIcon,
        run: () => goTo(id),
      })),
      { id: "go-top", label: "Back to top", hint: "Section", Icon: ArrowUpIcon, run: () => goTo(TOP_ID) },
      { id: "copy-email", label: "Copy email address", hint: profile.email, Icon: CopyIcon, run: copyEmail },
      {
        id: "send-email",
        label: "Send an email",
        hint: "Action",
        Icon: MailIcon,
        run: () => {
          window.location.href = `mailto:${profile.email}`;
        },
      },
      // hint "CV": คนจำนวนมากพิมพ์หา "cv" ไม่ใช่ "resume"
      { id: "download-cv", label: "Download resume (PDF)", hint: "CV", Icon: DownloadIcon, run: downloadCv },
      {
        id: "toggle-theme",
        label: "Switch light / dark theme",
        hint: "Theme",
        Icon: MoonIcon,
        run: () => toggleTheme(),
      },
      {
        id: "toggle-blueprint",
        label: "Toggle blueprint grid mode",
        hint: "Lab inspect",
        Icon: GridViewIcon,
        run: () => {
          document.documentElement.toggleAttribute("data-blueprint");
        },
      },
      ...projects.map((p) => ({
        id: `project-${p.id}`,
        label: p.title,
        hint: `Project · ${p.category}`,
        Icon: NotebookIcon,
        // อยู่ในหน้า explore แล้ว → แทนที่ history แบบเดียวกับ pager ปุ่ม All projects จึงยังพากลับหน้าแรกในครั้งเดียว
        run: () => navigate(projectPath(p.id), { transition: true, replace: location.pathname.startsWith("/projects/") }),
      })),
      ...Array.from(projectCountByTag, ([tag, count]) => ({
        id: `skill-${encodeURIComponent(tag)}`,
        label: `Filter projects by ${tag}`,
        hint: `Skill · ${count} ${count === 1 ? "project" : "projects"}`,
        Icon: BeakerIcon,
        run: () => {
          flushSync(() => setTag(tag));
          goTo("projects");
        },
      })),
      {
        id: "github",
        label: "GitHub",
        hint: `@${profile.github}`,
        Icon: GitHubIcon,
        run: () => openExternal(githubUrl),
        external: true,
      },
      {
        id: "linkedin",
        label: "LinkedIn",
        hint: "Profile",
        Icon: LinkedInIcon,
        run: () => openExternal(linkedinUrl),
        external: true,
      },
      {
        id: "source",
        label: "View source code",
        hint: "GitHub",
        Icon: CodeIcon,
        run: () => openExternal(repoUrl),
        external: true,
      },
    ],
    [copyEmail, setTag]
  );

  const q = query.trim().toLowerCase();
  const results = q ? commands.filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(q)) : commands;
  const active = results[Math.min(activeIndex, results.length - 1)];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // เลื่อนรายการที่เลือกให้อยู่ในกรอบเสมอเมื่อกดลูกศร
  useEffect(() => {
    if (active) document.getElementById(`${listId}-${active.id}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  // ทั้ง Esc, คลิกพื้นหลัง และ dialog.close() จบที่ event "close" นี้ทางเดียว
  const handleClose = () => {
    setQuery("");
    setActiveIndex(0);
    onClose();
  };

  const run = (command: Command) => {
    dialogRef.current?.close(); // คืน focus ก่อน แล้วค่อยทำคำสั่ง (เช่นย้าย focus ไป section)
    command.run();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter ที่ใช้ยืนยันคำของ IME (ไทยไม่ใช้ แต่จีน/ญี่ปุ่น/เกาหลีใช้) ไม่ใช่การเลือกคำสั่ง
    if (e.nativeEvent.isComposing || results.length === 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) => (Math.min(i, results.length - 1) + step + results.length) % results.length);
    } else if (e.key === "Enter" && active) {
      e.preventDefault();
      run(active);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label="Command menu"
      onClose={handleClose}
      onPointerDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (downOnBackdrop.current && e.target === e.currentTarget) dialogRef.current?.close();
      }}
      // ลอยเหนือหน้า → shadow-overlay; ฉากหลังใช้สี paper โปร่ง จึงจางเนื้อหาได้ทั้งโหมดสว่างและมืดโดยไม่ต้องมีสีใหม่
      className="m-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-rule bg-surface p-0 text-ink shadow-overlay backdrop:bg-paper/70 backdrop:backdrop-blur-sm"
    >
      {/* input ไม่มีวง focus ของตัวเอง (กินพื้นที่ทั้งแถว) จึงให้เส้นใต้แถวเป็นสี pen แทนตอนพิมพ์อยู่ */}
      <div className="flex items-center gap-3 border-b border-rule px-4 focus-within:border-pen">
        <SearchIcon className="size-5 shrink-0 text-ink-muted" />
        <input
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active ? `${listId}-${active.id}` : undefined}
          aria-label="Search commands"
          placeholder="Search commands…"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
          className="h-14 min-w-0 flex-1 bg-transparent type-body text-ink outline-none placeholder:text-ink-muted"
        />
        <button
          type="button"
          aria-label="Close command menu"
          onClick={() => dialogRef.current?.close()}
          className="flex size-11 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-paper hover:text-ink"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      <ul id={listId} role="listbox" aria-label="Commands" className="max-h-[min(24rem,55vh)] overflow-y-auto p-2">
        {results.map((command) => {
          const selected = command === active;
          return (
            <li
              key={command.id}
              id={`${listId}-${command.id}`}
              role="option"
              aria-selected={selected}
              onPointerMove={() => setActiveIndex(results.indexOf(command))}
              onClick={() => run(command)}
              // พื้น paper บน surface ต่างกันแค่ราว 1.1:1 จึงมีขีด pen ด้านซ้ายบอกตัวที่เลือกด้วย (ขอบมีตลอดแต่โปร่ง แถวจึงไม่ขยับ)
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-control border-l-2 px-3 type-small ${
                selected ? "border-pen bg-paper text-ink" : "border-transparent text-ink-muted"
              }`}
            >
              <command.Icon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 py-1">
                {command.label}
                {command.external && <span className="sr-only"> (opens in a new tab)</span>}
              </span>
              <span className="max-w-[45%] truncate type-caption text-ink-muted">{command.hint}</span>
            </li>
          );
        })}
      </ul>
      {/* role="status" ต้องอยู่ใน DOM ตลอด screen reader ถึงจะอ่านข้อความที่ใส่เข้ามาทีหลัง */}
      <p role="status" className={results.length === 0 ? "px-4 pb-8 pt-6 type-small text-ink-muted" : "sr-only"}>
        {results.length === 0 && `No results for “${query}”. Try a section name, “email” or “resume”.`}
      </p>

      {/* เฉพาะเครื่องที่มีเมาส์/ทัชแพด: จอสัมผัสไม่มีปุ่มเหล่านี้ */}
      <div aria-hidden="true" className="hidden gap-4 border-t border-rule px-4 py-3 type-caption text-ink-muted pointer-fine:flex">
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> to navigate
        </span>
        <span>
          <kbd>↵</kbd> to select
        </span>
        <span>
          <kbd>esc</kbd> to close
        </span>
      </div>
    </dialog>
  );
}
