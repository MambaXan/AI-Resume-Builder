import React, { useCallback, useEffect, useRef, useState } from "react";
import { resumeApi, authApi, onUnauthorized, getToken } from "../../api/client";
import { useReactToPrint } from "react-to-print";
import { Resume, WorkExperience, Education, Skill } from "../../types";
import AuthModal from "../../components/AuthModal";
import ResumeList from "../../components/ResumeList";
import ResumePreview from "../../components/ResumePreview";
import styles from "./EditorPage.module.scss";

// ─── Blank state factories ────────────────────────────────────────────────────

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

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 800): T {
  const [dv, setDv] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    timer.current = setTimeout(() => setDv(value), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, delay]);
  return dv;
}

// ─── Component ────────────────────────────────────────────────────────────────

const EditorPage: React.FC = () => {
  const [authed, setAuthed] = useState(!!getToken());
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [draft, setDraft] = useState<Resume>(blankResume());
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const debouncedDraft = useDebounce(draft, 900);

  // ── Auth ──────────────────────────────────────────────────────────────────

  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: draft.title || "Resume",
    pageStyle: `
      @page { 
        size: A4; 
        margin: 10mm; 
      }
      @media print {
        body { -webkit-print-color-adjust: exact; }
      }
    `,
  });

  useEffect(() => {
    onUnauthorized(() => setAuthed(false));
  }, []);

  // ── Load list ─────────────────────────────────────────────────────────────

  const loadResumes = useCallback(async () => {
    if (!authed) return;
    try {
      const list = await resumeApi.list();
      setResumes(list);
    } catch {
      // swallow
    }
  }, [authed]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  // ── Auto-save (only when draft has an id) ─────────────────────────────────

  useEffect(() => {
    if (!authed || !debouncedDraft.id) return;
    (async () => {
      try {
        setSaving(true);
        await resumeApi.update(debouncedDraft.id!, debouncedDraft);
        setSaveMsg("Saved");
        setTimeout(() => setSaveMsg(""), 1800);
        await loadResumes();
      } catch {
        setSaveMsg("Save failed");
      } finally {
        setSaving(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDraft]);

  // ── Helpers ───────────────────────────────────────────────────────────────

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

  // ── Save (create or update) ───────────────────────────────────────────────

  const handleSave = async () => {
    if (!draft.title || draft.title.trim() === "") {
      setSaveMsg("Resume title is required");
      return;
    }

    if (!draft.full_name) {
      setSaveMsg("Name is required");
      return;
    }

    setSaving(true);
    setSaveMsg("");
    try {
      let saved;
      if (draft.id) {
        saved = await resumeApi.update(draft.id, draft);
      } else {
        saved = await resumeApi.create(draft);
      }

      setDraft({
        ...saved,
        work_experience: saved.work_experience || [],
        education: saved.education || [],
        skills: saved.skills || [],
      });

      setSaveMsg("Saved ✓");
      setTimeout(() => setSaveMsg(""), 2000);
      await loadResumes();
    } catch (e: any) {
      const errorDetail =
        typeof e.detail === "object"
          ? JSON.stringify(e.detail)
          : e.detail ?? "Error";

      setSaveMsg(errorDetail);
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await resumeApi.delete(id);
    if (draft.id === id) setDraft(blankResume());
    await loadResumes();
  };

  const handleLogout = () => {
    authApi.logout();
    setAuthed(false);
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (!authed) {
    return <AuthModal onSuccess={() => setAuthed(true)} />;
  }

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
            onSelect={(r) => setDraft(r)}
            onDelete={handleDelete}
            onNew={() => setDraft(blankResume())}
          />
        </div>
      </aside>

      {/* Form pane */}
      <div className={styles["editor__form-pane"]}>
        <div className={styles["editor__form-header"]}>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Resume title..."
          />
          <div className={styles["editor__form-header-actions"]}>
            {saveMsg && (
              <span style={{ fontSize: "0.8125rem", color: "#6e6e73" }}>
                {saveMsg}
              </span>
            )}
            <button
              className="btn btn--primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : draft.id ? "Save" : "Create"}
            </button>
            <button
              className="btn btn--secondary"
              onClick={() => handlePrint()}
              style={{ marginRight: "8px" }}
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className={styles["editor__form-body"]}>
          {/* Personal Info */}
          <section className="form-section">
            <div
              className={`${styles["form-section__title"]} form-section__title`}
            >
              Personal
            </div>
            <FormSection>
              <FieldGrid>
                <Field label="Full Name">
                  <input
                    value={draft.full_name}
                    onChange={(e) => set({ full_name: e.target.value })}
                    placeholder="Jane Doe"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) => set({ email: e.target.value })}
                    placeholder="jane@example.com"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={draft.phone ?? ""}
                    onChange={(e) => set({ phone: e.target.value })}
                    placeholder="+1 555 000 0000"
                  />
                </Field>
                <Field label="Location">
                  <input
                    value={draft.location ?? ""}
                    onChange={(e) => set({ location: e.target.value })}
                    placeholder="Milan, Italy"
                  />
                </Field>
                <Field label="Website">
                  <input
                    value={draft.website ?? ""}
                    onChange={(e) => set({ website: e.target.value })}
                    placeholder="https://janedoe.dev"
                  />
                </Field>
                <Field label="LinkedIn">
                  <input
                    value={draft.linkedin ?? ""}
                    onChange={(e) => set({ linkedin: e.target.value })}
                    placeholder="linkedin.com/in/jane"
                  />
                </Field>
              </FieldGrid>
              <div style={{ marginTop: 12 }}>
                <Field label="Professional Summary">
                  <textarea
                    value={draft.summary ?? ""}
                    onChange={(e) => set({ summary: e.target.value })}
                    placeholder="Brief professional summary…"
                    rows={3}
                  />
                </Field>
              </div>
            </FormSection>
          </section>

          {/* Work Experience */}
          <section>
            <SectionTitle>Experience</SectionTitle>
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
                  <Field label="Company">
                    <input
                      value={w.company}
                      onChange={(e) => setWork(i, { company: e.target.value })}
                    />
                  </Field>
                  <Field label="Position">
                    <input
                      value={w.position}
                      onChange={(e) => setWork(i, { position: e.target.value })}
                    />
                  </Field>
                  <Field label="Start (YYYY-MM)">
                    <input
                      value={w.start_date}
                      onChange={(e) =>
                        setWork(i, { start_date: e.target.value })
                      }
                      placeholder="2022-06"
                    />
                  </Field>
                  <Field label="End (leave blank = Present)">
                    <input
                      value={w.end_date ?? ""}
                      onChange={(e) => setWork(i, { end_date: e.target.value })}
                      placeholder="2024-01"
                    />
                  </Field>
                </div>
                <Field label="Description">
                  <textarea
                    value={w.description}
                    onChange={(e) =>
                      setWork(i, { description: e.target.value })
                    }
                    rows={2}
                  />
                </Field>
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
            <SectionTitle>Education</SectionTitle>
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
                  <Field label="Institution">
                    <input
                      value={e.institution}
                      onChange={(ev) =>
                        setEdu(i, { institution: ev.target.value })
                      }
                    />
                  </Field>
                  <Field label="Degree">
                    <input
                      value={e.degree}
                      onChange={(ev) => setEdu(i, { degree: ev.target.value })}
                    />
                  </Field>
                  <Field label="Field of Study">
                    <input
                      value={e.field_of_study}
                      onChange={(ev) =>
                        setEdu(i, { field_of_study: ev.target.value })
                      }
                    />
                  </Field>
                  <Field label="GPA (optional)">
                    <input
                      value={e.gpa ?? ""}
                      onChange={(ev) => setEdu(i, { gpa: ev.target.value })}
                    />
                  </Field>
                  <Field label="Start">
                    <input
                      value={e.start_date}
                      onChange={(ev) =>
                        setEdu(i, { start_date: ev.target.value })
                      }
                      placeholder="2018-09"
                    />
                  </Field>
                  <Field label="End">
                    <input
                      value={e.end_date ?? ""}
                      onChange={(ev) =>
                        setEdu(i, { end_date: ev.target.value })
                      }
                      placeholder="2022-06"
                    />
                  </Field>
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
            <SectionTitle>Skills</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {draft.skills.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    border: "1px solid #e0e0e5",
                    borderRadius: 6,
                    padding: "4px 10px",
                    background: "#fff",
                  }}
                >
                  <input
                    value={s.name}
                    onChange={(e) => setSkill(i, { name: e.target.value })}
                    placeholder="Skill"
                    style={{
                      border: "none",
                      outline: "none",
                      width: 90,
                      fontSize: "0.875rem",
                    }}
                  />
                  <select
                    value={s.level}
                    onChange={(e) =>
                      setSkill(i, { level: e.target.value as Skill["level"] })
                    }
                    style={{
                      border: "none",
                      outline: "none",
                      fontSize: "0.75rem",
                      color: "#6e6e73",
                      background: "transparent",
                    }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                  <button
                    style={{ color: "#ff3b30", fontSize: 14, lineHeight: 1 }}
                    onClick={() => removeItem("skills", i)}
                  >
                    ×
                  </button>
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
      <div className={styles["editor__preview-pane"]}>
        <div ref={contentRef} className={styles.printable_area}>
          <ResumePreview resume={draft} />
        </div>
      </div>
    </div>
  );
};

// ─── Small helper components (keep in same file — no extra re-renders) ────────

const FormSection: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

const FieldGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
    {children}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="field">
    <label>{label}</label>
    {children}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      fontSize: "0.75rem",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "#6e6e73",
      marginBottom: 14,
      paddingBottom: 8,
      borderBottom: "1px solid #e0e0e5",
    }}
  >
    {children}
  </div>
);

export default EditorPage;
