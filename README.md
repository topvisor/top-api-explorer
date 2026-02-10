# top-api-explorer

API Explorer на Vue 3 + TypeScript для изучения OpenAPI (YAML).

## Запуск локально

```bash
npm install
npm run dev
```

## Что реализовано

- 3 колонки с независимой прокруткой.
- Группировка эндпоинтов по тегам и выбор активного метода.
- Динамический конструктор запроса (Path/Query/Auth/Body/Body JSON/Headers).
- Синхронизация формы Body ↔ JSON.
- Отправка запроса с отменой предыдущего запроса при новом запуске.
- Просмотр Body/Headers ответа и цветной статус.
- Сохранение состояния в `#api-explorer=...`.
- API key в `localStorage` с простым xor+base64 обфусцированием.
- Настройки источника спецификации: можно указать URL до YAML-файла, либо использовать встроенный demo-spec.

## Публикация на GitHub Pages

Да, проект можно публиковать на GitHub Pages.

Добавлен workflow `.github/workflows/deploy-pages.yml`, который:

1. Собирает проект (`npm ci && npm run build`).
2. Публикует `dist` в GitHub Pages.

Также `vite.config.ts` автоматически проставляет `base` для Pages-сборки на основе `GITHUB_REPOSITORY`.

> В репозитории нужно включить **Settings → Pages → Build and deployment → GitHub Actions**.

## Источник OpenAPI YAML

В левой колонке, в блоке **Настройки**, есть поле:

- `Ссылка на OpenAPI YAML` — принимает URL до YAML-спецификации.
- `Загрузить спецификацию` — загрузка по ссылке.
- `Сбросить` — возврат к встроенной спецификации.

Выбранная ссылка сохраняется в hash URL в параметре `api-spec-url`.
