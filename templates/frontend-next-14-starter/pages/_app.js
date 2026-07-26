import React, { useEffect } from "react";
import { useRouter } from "next/router";

import useCalcVh from "hooks/useCalcVh";
import useFoucFix from "hooks/useFoucFix";
import useResponsible from "hooks/useResponsible";
import { useHydrate } from "utils/store";
import { StoreProvider } from "contexts/ZustandProvider";

import "styles/globals.css";
import "styles/colors.css";
import "styles/fonts.css";

import Layout from "components/common/Layout";

function AppContent({ Component, pageProps }) {
  const router = useRouter();

  // Прокрутка страницы вверх при смене маршрута
  useEffect(() => {
    const handleRouteChange = () => {
      window.scrollTo(0, 0);
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  // Показываем AI чат только для авторизованных владельцев

  return (
    <>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

export default function App({ Component, pageProps, router: nextRouter }) {
  // Инициализируем Zustand-стор
  const store = useHydrate(pageProps.cms);

  useFoucFix();
  //   useResponsible();
  useCalcVh();

  return (
    <StoreProvider store={store}>
      {/* <NotificationPopup /> */}
      <AppContent Component={Component} pageProps={pageProps} />
    </StoreProvider>
  );
}
