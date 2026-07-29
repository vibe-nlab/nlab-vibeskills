import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import useStore from "hooks/useStore";

import { removeQueries } from "utils/string";

// Заполнить под свой проект при подключении темплейта.
// Публичный адрес — из env, чтобы дев/прод не расходились и чтобы в коде
// не оседал домен чужого проекта.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

const seo = {
  title: "CHANGE_ME — название проекта",
  description: "CHANGE_ME — одно предложение о том, что делает сервис",
  url: SITE_URL,
  domain: SITE_URL,
  image: "",
  theme: "#272726",
};

const Page = ({
  title,
  image,
  theme,
  keywords,
  description,
  children,
  showHeaderFooter = true,
}) => {
  const { asPath } = useRouter();
  // const { setHistory, history } = useStore();

  // // React.useEffect(() => {
  // //   if (history[history.length - 1] !== asPath) {
  // //     setHistory([...history, asPath]);
  // //   }
  // // }, [asPath, history]);

  const fullTitle = React.useMemo(
    () => [seo.title, title].join(title ? " | " : ""),
    [title]
  );

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <meta name="description" content={description || seo.description} />
        <meta name="keywords" content={keywords || ""} />
        <meta name="theme-color" content={theme || seo.theme} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:type" content="website" />
        <meta
          property="og:description"
          content={description || seo.description}
        />
        <meta property="og:url" content={`${seo.url}${asPath}`} />
        <meta property="og:image" content={removeQueries(image) || seo.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content={seo.domain || ""} />
        <meta property="twitter:url" content={`${seo.url}${asPath}`} />
        <meta name="twitter:title" content={fullTitle} />
        <meta
          name="twitter:description"
          content={description || seo.description}
        />
        <meta name="twitter:image" content={`${seo.url}${seo.image}`} />
        <link rel="icon" href="/images/favicon2.png" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff"></meta>
      </Head>

      {children}
    </>
  );
};

Page.defaultProps = {
  isPreloader: true,
};

export default React.memo(Page);
