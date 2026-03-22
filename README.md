# Resume Builder — Frontend

React (CRA) + TypeScript + SCSS. No external UI libraries.

---

## Screenshots

### Register Page
<!-- Add screenshot here -->
![Register Page](./screenshots/register.png)

### Resume Building Page
<!-- Add screenshot here -->
![Resume Building Page](./screenshots/building.png)

### Preview Page
<!-- Add screenshot here -->
![Preview Page](./screenshots/preview.png)

### PDF Downloading Page
<!-- Add screenshot here -->
![PDF Downloading Page](./screenshots/pdf-download.png)

---

## Project Structure

```
src/
├── api/
│   └── client.ts          # fetch wrapper: auth, JWT, 401 handler
├── components/
│   ├── AuthModal/
│   │   ├── index.tsx       # Login / Register modal
│   │   └── AuthModal.module.scss
│   ├── ResumeList/
│   │   ├── index.tsx       # Resume list in sidebar
│   │   └── ResumeList.module.scss
│   └── ResumePreview/
│       ├── index.tsx       # A4 live preview
│       └── ResumePreview.module.scss
├── pages/
│   └── EditorPage/
│       ├── index.tsx       # Main page (form + preview)
│       └── EditorPage.module.scss
├── styles/
│   └── global.scss        # Variables, reset, .btn, .field utilities
├── types/
│   └── index.ts           # User, Resume, WorkExperience, Education, Skill
├── App.tsx
└── index.tsx
```

---

## Getting Started

```bash
npm install
npm start
```

The FastAPI backend must be running at `http://127.0.0.1:8000`.

---

## Responsive Design

The app is fully responsive across all screen sizes:

| Breakpoint     | Width          | Layout                                      |
|----------------|----------------|---------------------------------------------|
| Desktop        | ≥ 1200px       | Sidebar + Form + A4 Preview (3 columns)     |
| Laptop         | 1000px–1199px  | Sidebar + Form (preview hidden)             |
| Tablet         | 768px–999px    | Sidebar collapses to top bar                |
| Mobile         | < 768px        | Single column, stacked fields               |

### Responsive SCSS — add to `EditorPage.module.scss`

```scss
// ── Laptop: hide preview pane ─────────────────────────────────────────────────
@media (max-width: 999px) {
  .editor {
    &__preview-pane { display: none; }
    &__sidebar      { width: 220px; }
  }
}

// ── Tablet: sidebar becomes a top bar ────────────────────────────────────────
@media (max-width: 768px) {
  .editor {
    flex-direction: column;
    height: auto;
    min-height: 100vh;

    &__sidebar {
      width: 100%;
      height: auto;
      border-right: none;
      border-bottom: 1px solid $color-border;
      flex-direction: row;
      align-items: center;
      padding: 0 16px;
    }

    &__sidebar-header {
      border-bottom: none;
      padding: 12px 0;
      flex: 1;
    }

    &__sidebar-list { display: none; }

    &__form-pane {
      border-right: none;
      height: auto;
    }

    &__form-header {
      padding: 12px 16px;
      flex-wrap: wrap;
      gap: 8px;
    }

    &__form-body {
      padding: 16px;
      gap: 24px;
    }
  }

  .entry-card__grid  { grid-template-columns: 1fr; }
  .form-section__grid { grid-template-columns: 1fr; }
}

// ── Mobile: fine-tune font sizes ─────────────────────────────────────────────
@media (max-width: 480px) {
  .editor__form-header input[type='text'] {
    font-size: 0.9375rem;
  }
}
```

### Responsive SCSS — add to `ResumePreview.module.scss`

```scss
.preview {
  @media (max-width: 1400px) {
    transform: scale(0.75);
    margin-bottom: calc(-297mm * 0.25);
  }
  @media (max-width: 1200px) {
    transform: scale(0.65);
    margin-bottom: calc(-297mm * 0.35);
  }
  @media (max-width: 1000px) {
    transform: scale(0.55);
    margin-bottom: calc(-297mm * 0.45);
  }

  // Full-width on mobile (shown in tab/drawer mode)
  @media (max-width: 768px) {
    transform: none;
    width: 100%;
    min-height: auto;
    padding: 12mm 8mm;
    margin-bottom: 0;
    box-shadow: none;
    border: 1px solid $color-border;
    border-radius: $radius-md;
  }
}
```

### Responsive SCSS — add to `AuthModal.module.scss`

```scss
@media (max-width: 480px) {
  .auth-modal {
    padding: 28px 20px;
    border-radius: $radius-md;
    margin: 0 12px;
  }
}
```

---

## Key Design Decisions

- **No external libraries** — plain `fetch`, React, TypeScript, and SCSS only.
- **JWT** is stored in `localStorage` under the key `resume_builder_token`. On a 401 response the token is removed and `unauthorizedCallback` fires → `AuthModal` is shown.
- **Auto-save**: `useDebounce` (900 ms) watches `draft`. If the resume has an `id`, changes are automatically persisted via `PUT /resumes/{id}`.
- **A4 preview** renders at `210mm × 297mm` and scales via `transform: scale()` based on viewport width — no iframes involved.
- **SCSS modules** per component + global utilities (`.btn`, `.field`) in `global.scss`.

---

## API Endpoints (FastAPI)

| Method | Path            | Description         |
|--------|-----------------|---------------------|
| POST   | /auth/token     | OAuth2 login → JWT  |
| POST   | /auth/register  | Register a new user |
| GET    | /users/me       | Get current user    |
| GET    | /resumes        | List all resumes    |
| POST   | /resumes        | Create a resume     |
| GET    | /resumes/{id}   | Get a single resume |
| PUT    | /resumes/{id}   | Update a resume     |
| DELETE | /resumes/{id}   | Delete a resume     |