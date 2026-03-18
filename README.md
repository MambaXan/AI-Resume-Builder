# Resume Builder — Frontend

React (CRA) + TypeScript + SCSS. No external UI libraries.

## Структура проекта

```
src/
├── api/
│   └── client.ts          # fetch-обёртка: авторизация, JWT, 401-хендлер
├── components/
│   ├── AuthModal/
│   │   ├── index.tsx       # Login / Register modal
│   │   └── AuthModal.module.scss
│   ├── ResumeList/
│   │   ├── index.tsx       # Список резюме в сайдбаре
│   │   └── ResumeList.module.scss
│   └── ResumePreview/
│       ├── index.tsx       # A4 live-превью
│       └── ResumePreview.module.scss
├── pages/
│   └── EditorPage/
│       ├── index.tsx       # Главная страница (форма + превью)
│       └── EditorPage.module.scss
├── styles/
│   └── global.scss        # Переменные, reset, .btn, .field утилиты
├── types/
│   └── index.ts           # User, Resume, WorkExperience, Education, Skill
├── App.tsx
└── index.tsx
```

## Запуск

```bash
npm install
npm start
```

Бэкенд должен быть запущен на `http://127.0.0.1:8000`.

## Ключевые решения

- **Нет внешних библиотек** — только `fetch`, React, TypeScript, SCSS.
- **JWT** хранится в `localStorage` под ключом `resume_builder_token`. При 401 токен удаляется и вызывается `unauthorizedCallback` → показывается `AuthModal`.
- **Auto-save**: `useDebounce` (900 мс) следит за `draft`. Если у резюме есть `id`, изменения сохраняются автоматически через `PUT /resumes/{id}`.
- **A4 preview** рендерится как `210mm × 297mm` и масштабируется через `transform: scale()` в зависимости от ширины экрана — никаких iframe.
- **SCSS modules** на каждом компоненте + глобальные утилиты (`.btn`, `.field`) в `global.scss`.

## API-эндпоинты (FastAPI)

| Метод  | Путь              | Описание                        |
|--------|-------------------|---------------------------------|
| POST   | /auth/token       | OAuth2 login → JWT              |
| POST   | /auth/register    | Регистрация нового пользователя |
| GET    | /users/me         | Текущий пользователь            |
| GET    | /resumes          | Список резюме                   |
| POST   | /resumes          | Создать резюме                  |
| GET    | /resumes/{id}     | Получить одно резюме            |
| PUT    | /resumes/{id}     | Обновить резюме                 |
| DELETE | /resumes/{id}     | Удалить резюме                  |