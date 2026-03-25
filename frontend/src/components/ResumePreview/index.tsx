import React from "react";
import { Resume } from "../../types";
import styles from "./ResumePreview.module.scss";

interface Props {
  resume: Resume;
}

const ResumePreview: React.FC<Props> = ({ resume }) => {
  const hasWork = resume.work_experience?.length > 0;
  const hasEdu = resume.education?.length > 0;
  const hasSkills = resume.skills?.length > 0;

  return (
    <div className={styles.preview}>
      <div className={styles.preview__header}>
        <h1 className={styles.preview__name}>
          {resume.full_name || "Your Name"}
        </h1>
        <div className={styles.preview__contact}>
          {resume.email && <span>📧 {resume.email}</span>}
          {resume.phone && <span>📞 {resume.phone}</span>}
          {resume.location && <span>📍 {resume.location}</span>}
          {resume.website && (
            <a
              href={resume.website}
              target="_blank"
              rel="noreferrer"
              className={styles.preview__link}
            >
              🌐 Website
            </a>
          )}
          {resume.linkedin && (
            <a
              href={resume.linkedin}
              target="_blank"
              rel="noreferrer"
              className={styles.preview__link}
            >
              🔗 LinkedIn
            </a>
          )}
        </div>
      </div>

      {resume.summary && (
        <section className={styles.preview__section}>
          <h2 className={styles.preview__section_title}>Summary</h2>
          <p className={styles.preview__text}>{resume.summary}</p>
        </section>
      )}

      {hasWork && (
        <section className={styles.preview__section}>
          <h2 className={styles.preview__section_title}>Experience</h2>
          {resume.work_experience.map((w, i) => (
            <div key={i} className={styles.preview__entry}>
              <div className={styles.preview__entry_head}>
                <strong>{w.position}</strong>
                <span className={styles.preview__entry_date}>
                  {w.start_date} – {w.end_date ?? "Present"}
                </span>
              </div>
              <div className={styles.preview__company}>{w.company}</div>
              {w.description && (
                <p className={styles.preview__text}>{w.description}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {hasEdu && (
        <section className={styles.preview__section}>
          <h2 className={styles.preview__section_title}>Education</h2>
          {resume.education.map((e, i) => (
            <div key={i} className={styles.preview__entry}>
              <div className={styles.preview__entry_head}>
                <strong>
                  {e.degree}
                  {e.field_of_study ? `, ${e.field_of_study}` : ""}
                </strong>
                <span className={styles.preview__entry_date}>
                  {e.start_date} – {e.end_date ?? "Present"}
                </span>
              </div>
              <div className={styles.preview__company}>{e.institution}</div>
              {e.gpa && <p className={styles.preview__text}>GPA: {e.gpa}</p>}
            </div>
          ))}
        </section>
      )}

      {hasSkills && (
        <section className={styles.preview__section}>
          <h2 className={styles.preview__section_title}>Skills</h2>
          <div className={styles.preview__skills}>
            {resume.skills.map((s, i) => (
              <span key={i} className={styles.preview__skill}>
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ResumePreview;