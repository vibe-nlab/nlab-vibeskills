import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import useStore from "hooks/useStore";

import { removeQueries } from "utils/string";

const seo = {
  title: "Griplo CRM",
  description:
    "AI-powered product photo and video creation for marketplace sellers",
  // url: "https://www.reclaim-your-dna-html.heycusp.com",
  url: "https://app.griplo.com/",
  // domain: "https://www.reclaim-your-dna-html.heycusp.us",
  domain: "https://app.griplo.com/",
  image: "",
  theme: "#000000",
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
