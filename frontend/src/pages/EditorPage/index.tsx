// EditorPage.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { resumeApi, authApi, onUnauthorized, getToken } from "../../api/client";
import { useReactToPrint } from "react-to-print";
import { Resume, WorkExperience, Education, Skill } from "../../types";
import AuthModal from "../../components/AuthModal";
import ResumeList from "../../components/ResumeList";
import ResumePreview from "../../components/ResumePreview";
import styles from "./EditorPage.module.scss";
// import axios from "axios";

const blankResume = (): Resume => ({
  title: "",
  full_name: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  linkedin: "",
  summary: "",
  work_experience: [],
  education: [],
  skills: [],
});

const blankWork = (): WorkExperience => ({
  company: "",
  position: "",
  start_date: "",
  end_date: "",
  description: "",
});

const blankEdu = (): Education => ({
  institution: "",
  degree: "",
  field_of_study: "",
  start_date: "",
  end_date: "",
  gpa: "",
});

const blankSkill = (): Skill => ({ name: "", level: "intermediate" });

function useDebounce<T>(value: T, delay = 800): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.current = setTimeout(() => setDebouncedValue(value), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ========== Компонент страницы ==========
const EditorPage: React.FC = () => {
  const [authed, setAuthed] = useState(!!getToken());
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [draft, setDraft] = useState<Resume>(blankResume());
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [generatingAI, setGeneratingAI] = useState<any>({});

  const debouncedDraft = useDebounce(draft, 900);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: draft.title || "Resume",
    pageStyle: `
      @page { size: A4; margin: 0 !important; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        #printable_area { padding: 10mm 15mm !important; }
      }
    `,
  });

  const handleAIGenerate = async (
    index: number,
    position: string,
    company: string
  ) => {
    if (!position) return alert("Сначала введи должность, бро!");

    // Прямо здесь указываем (prev: any)
    setGeneratingAI((prev: any) => ({ ...prev, [index]: true }));

    try {
      const response = await fetch(
        "https://resume-builder-618b.onrender.com/api/generate-description",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position, company: company || "" }),
        }
      );

      if (!response.ok) throw new Error("Бэкенд приуныл");

      const data = await response.json();
      setWork(index, { description: data.description });
    } catch (error) {
      console.error(error);
      alert("Ошибка! Проверь, запущен ли Python бэкенд.");
    } finally {
      setGeneratingAI((prev: any) => ({ ...prev, [index]: false }));
    }
  };

  useEffect(() => {
    onUnauthorized(() => setAuthed(false));
  }, []);

  const loadResumes = useCallback(async () => {
    if (!authed) return;
    try {
      const list = await resumeApi.list();
      setResumes(list);
    } catch {}
  }, [authed]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const handleSaveManual = async () => {
    if (!draft.title?.trim()) {
      setSaveMsg("Resume title is required");
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return;
    }
    if (!draft.full_name?.trim()) {
      setSaveMsg("Name is required");
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return;
    }

    setSaving(true);
    setSaveStatus("saving");
    try {
      const saved = draft.id
        ? await resumeApi.update(draft.id, draft)
        : await resumeApi.create(draft);

      setDraft({
        ...saved,
        work_experience: saved.work_experience || [],
        education: saved.education || [],
        skills: saved.skills || [],
      });

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      await loadResumes();
    } catch (e: any) {
      setSaveMsg(e.detail ?? "Error");
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!authed || !debouncedDraft.id) return;
    const autoSave = async () => {
      setSaveStatus("saving");
      try {
        await resumeApi.update(debouncedDraft.id!, debouncedDraft);
        setSaveStatus("idle");
      } catch {
        setSaveStatus("error");
      }
    };
    autoSave();
  }, [debouncedDraft, authed]);

  const set = (patch: Partial<Resume>) => setDraft((d) => ({ ...d, ...patch }));

  const setWork = (i: number, patch: Partial<WorkExperience>) =>
    setDraft((d) => {
      const arr = [...d.work_experience];
      arr[i] = { ...arr[i], ...patch };
      return { ...d, work_experience: arr };
    });

  const setEdu = (i: number, patch: Partial<Education>) =>
    setDraft((d) => {
      const arr = [...d.education];
      arr[i] = { ...arr[i], ...patch };
      return { ...d, education: arr };
    });

  const setSkill = (i: number, patch: Partial<Skill>) =>
    setDraft((d) => {
      const arr = [...d.skills];
      arr[i] = { ...arr[i], ...patch };
      return { ...d, skills: arr };
    });

  const removeItem = <T,>(key: keyof Resume, i: number) =>
    setDraft((d) => {
      const arr = [...(d[key] as T[])];
      arr.splice(i, 1);
      return { ...d, [key]: arr };
    });

  const handleDelete = async (id: number) => {
    await resumeApi.delete(id);
    if (draft.id === id) setDraft(blankResume());
    await loadResumes();
  };

  const handleLogout = () => {
    authApi.logout();
    setAuthed(false);
  };

  if (!authed) return <AuthModal onSuccess={() => setAuthed(true)} />;

  return (
    <div className={styles.editor}>
      {/* Sidebar */}
      <aside className={styles.editor__sidebar}>
        <div className={styles["editor__sidebar-header"]}>
          <h1>
            Resume<span>.</span>
          </h1>
          <button className={styles["editor__user-btn"]} onClick={handleLogout}>
            Logout
          </button>
        </div>
        <div className={styles["editor__sidebar-list"]}>
          <ResumeList
            resumes={resumes}
            activeId={draft.id}
            onSelect={(selectedResume) => {
              setDraft({
                ...selectedResume,
                work_experience: selectedResume.work_experience || [],
                education: selectedResume.education || [],
                skills: selectedResume.skills || [],
              });
            }}
            onDelete={handleDelete}
            onNew={() => setDraft(blankResume())}
          />
        </div>
      </aside>

      {/* Форма */}
      <div className={styles.editor__form_pane}>
        <div className={styles.editor__form_header}>
          <div className={styles.header_left}>
            <input
              type="text"
              className={styles.title_input}
              value={draft.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="Resume title..."
            />
          </div>
          <div className={styles.header_right}>
            <button className="btn btn--secondary" onClick={handlePrint}>
              Download PDF
            </button>
            <button
              className="btn btn--primary"
              onClick={handleSaveManual}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className={styles.editor__form_body}>
          {/* Personal info */}
          <section className={styles["form-section"]}>
            <div className={styles["form-section__title"]}>Personal</div>
            <div className={styles["form-section__grid"]}>
              <div className={styles.field}>
                <label>Full Name</label>
                <input
                  value={draft.full_name}
                  onChange={(e) => set({ full_name: e.target.value })}
                  placeholder="Jane Doe"
                />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder="jane@example.com"
                />
              </div>
              <div className={styles.field}>
                <label>Phone</label>
                <input
                  value={draft.phone ?? ""}
                  onChange={(e) => set({ phone: e.target.value })}
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div className={styles.field}>
                <label>Location</label>
                <input
                  value={draft.location ?? ""}
                  onChange={(e) => set({ location: e.target.value })}
                  placeholder="Milan, Italy"
                />
              </div>
              <div className={styles.field}>
                <label>Website</label>
                <input
                  value={draft.website ?? ""}
                  onChange={(e) => set({ website: e.target.value })}
                  placeholder="https://janedoe.dev"
                />
              </div>
              <div className={styles.field}>
                <label>LinkedIn</label>
                <input
                  value={draft.linkedin ?? ""}
                  onChange={(e) => set({ linkedin: e.target.value })}
                  placeholder="linkedin.com/in/jane"
                />
              </div>
            </div>
            <div className={styles.field} style={{ marginTop: 12 }}>
              <label>Professional Summary</label>
              <textarea
                value={draft.summary ?? ""}
                onChange={(e) => set({ summary: e.target.value })}
                placeholder="Brief professional summary…"
                rows={3}
              />
            </div>
          </section>

          {/* Work Experience */}
          <section>
            <div className={styles["section-title"]}>Experience</div>
            {(draft.work_experience || []).map((w, i) => (
              <div className={styles["entry-card"]} key={i}>
                <div className={styles["entry-card__head"]}>
                  <span>Position {i + 1}</span>
                  <button
                    className={styles["entry-card__remove"]}
                    onClick={() => removeItem("work_experience", i)}
                  >
                    Remove
                  </button>
                </div>

                <div className={styles["entry-card__grid"]}>
                  <div className={styles.field}>
                    <label>Company</label>
                    <input
                      value={w.company}
                      onChange={(e) => setWork(i, { company: e.target.value })}
                      placeholder="Напр. Google"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Position</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        style={{ flex: 1 }}
                        value={w.position}
                        onChange={(e) =>
                          setWork(i, { position: e.target.value })
                        }
                        placeholder="Напр. Frontend Developer"
                      />
                      {/* КНОПКА AI ГЕНЕРАЦИИ */}
                      <button
                        type="button"
                        onClick={() =>
                          handleAIGenerate(i, w.position, w.company)
                        }
                        disabled={generatingAI[i]}
                        style={{
                          padding: "0 15px",
                          backgroundColor: "#0070f3",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {generatingAI[i] ? "⏳" : "AI ✨"}
                      </button>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>Start (YYYY-MM)</label>
                    <input
                      value={w.start_date}
                      onChange={(e) =>
                        setWork(i, { start_date: e.target.value })
                      }
                      placeholder="2022-06"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>End (leave blank = Present)</label>
                    <input
                      value={w.end_date ?? ""}
                      onChange={(e) => setWork(i, { end_date: e.target.value })}
                      placeholder="2024-01"
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Description</label>
                  <textarea
                    value={w.description}
                    onChange={(e) =>
                      setWork(i, { description: e.target.value })
                    }
                    rows={6} // Увеличил, чтобы ИИ текст влезал
                    placeholder="Нажми 'AI ✨' после ввода должности, чтобы сгенерировать описание..."
                  />
                </div>
              </div>
            ))}

            <button
              className={styles["add-btn"]}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  work_experience: [...d.work_experience, blankWork()],
                }))
              }
            >
              + Add position
            </button>
          </section>

          {/* Education */}
          <section>
            <div className={styles["section-title"]}>Education</div>
            {draft.education.map((e, i) => (
              <div className={styles["entry-card"]} key={i}>
                <div className={styles["entry-card__head"]}>
                  <span>Degree {i + 1}</span>
                  <button
                    className={styles["entry-card__remove"]}
                    onClick={() => removeItem("education", i)}
                  >
                    Remove
                  </button>
                </div>
                <div className={styles["entry-card__grid"]}>
                  <div className={styles.field}>
                    <label>Institution</label>
                    <input
                      value={e.institution}
                      onChange={(ev) =>
                        setEdu(i, { institution: ev.target.value })
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Degree</label>
                    <input
                      value={e.degree}
                      onChange={(ev) => setEdu(i, { degree: ev.target.value })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Start</label>
                    <input
                      value={e.start_date}
                      onChange={(ev) =>
                        setEdu(i, { start_date: ev.target.value })
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label>End</label>
                    <input
                      value={e.end_date ?? ""}
                      onChange={(ev) =>
                        setEdu(i, { end_date: ev.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              className={styles["add-btn"]}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  education: [...d.education, blankEdu()],
                }))
              }
            >
              + Add degree
            </button>
          </section>

          {/* Skills */}
          <section>
            <div className={styles["section-title"]}>Skills</div>
            <div className={styles["skills-list"]}>
              {draft.skills.map((s, i) => (
                <div key={i} className={styles["skill-chip"]}>
                  <input
                    value={s.name}
                    onChange={(e) => setSkill(i, { name: e.target.value })}
                    placeholder="Skill"
                  />
                  <select
                    value={s.level}
                    onChange={(e) =>
                      setSkill(i, { level: e.target.value as Skill["level"] })
                    }
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                  <button onClick={() => removeItem("skills", i)}>×</button>
                </div>
              ))}
            </div>
            <button
              className={styles["add-btn"]}
              style={{ marginTop: 8 }}
              onClick={() =>
                setDraft((d) => ({ ...d, skills: [...d.skills, blankSkill()] }))
              }
            >
              + Add skill
            </button>
          </section>
        </div>
      </div>

      {/* Preview pane */}
      <div className={styles.editor__preview_pane}>
        <div
          ref={contentRef}
          id="printable_area"
          className={styles.printable_area}
        >
          <ResumePreview resume={draft} />
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
