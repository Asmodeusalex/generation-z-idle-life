# Поколение Z — APK через GitHub Actions

Проект готов для ручной сборки в GitHub. Android Studio и компьютер для самой сборки не нужны.

1. Распакуй `Generation-Z-GitHub-Actions.zip` на телефоне.
2. Загрузи **содержимое** архива в корень своего GitHub-репозитория. В корне должны находиться `package.json`, `package-lock.json`, `capacitor.config.json`, папки `dist`, `scripts`, `android` и `.github`. GitHub не распаковывает загруженный ZIP автоматически. Убедись, что файловый менеджер показывает папку `.github`.
3. Открой **Actions → Build Android APK → Run workflow → Run workflow**. Файл workflow должен быть в основной ветке репозитория. Если GitHub предлагает включить Actions, включи их.
4. После успешной сборки открой её и скачай **Artifacts → Generation-Z-debug-APK**.
5. Распакуй скачанный artifact: внутри находится **app-debug.apk**. Открой APK на телефоне для установки; при запросе Android разреши установку из используемого браузера/файлового менеджера.

## Что делает workflow

Node.js 22 → JDK 17 → Android SDK 34 → npm ci → npm run build → npx cap sync android → ./gradlew assembleDebug → загрузка APK в Artifact.

Выходной файл: `android/app/build/outputs/apk/debug/app-debug.apk`.
Название приложения: **Поколение Z**. Идентификатор: `com.generationz.idlelife`.
Capacitor 6.2.1, Android Gradle Plugin 8.2.1, Gradle Wrapper 8.2.1. Минимальная версия Android — 8.0 (API 26), нужен обновлённый Android System WebView.

## Что сохранено

Исходные файлы игры в `dist/` не изменены. Статическая web-сборка копирует их в `www/`; повторные игровые проверки не запускаются. Android-адаптеры добавляются только в копию для APK: сохранён системный экспорт файла и существующая вибрация. Импорт обрабатывает Capacitor. Игра встраивается в APK; удалённый сайт для запуска не нужен.

Новые функции, реклама, платежи, Firebase и AAB не добавлены. Существующая монетизация остаётся в прежнем неподключённом состоянии. Формат сохранений и игровая логика не менялись.

## Ограничения

- Здесь выполнены подготовка web-файлов и Capacitor sync. GitHub Actions в твоём репозитории ещё не запускался; готовый APK появится после успешного запуска workflow.
- Браузер и приложение хранят прогресс отдельно. Для переноса используй прежние кнопки экспорта/импорта в настройках игры.
- Это debug APK. Workflow кеширует отладочный ключ для обновлений поверх предыдущей сборки. Если кеш удалён/истёк, новый ключ может потребовать переустановки. Перед этим экспортируй сохранение, потому что удаление приложения удаляет его локальные данные.
- Artifact хранится 30 дней. Скачай APK на телефон. Подпись Google Play и релизная сборка на этом этапе не настраиваются.

Справка: [ручной запуск Actions](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow), [скачивание artifacts](https://docs.github.com/actions/managing-workflow-runs/downloading-workflow-artifacts).
