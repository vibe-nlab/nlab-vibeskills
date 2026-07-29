import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ru">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// Аналитика намеренно НЕ зашита в темплейт.
// Нужна — подключай своим идентификатором из env
// (NEXT_PUBLIC_METRIKA_ID и т.п.) и только с согласия владельца проекта.
// Никогда не оставляй здесь чужой счётчик: webvisor пишет сессии
// пользователей, и они уедут не туда.
