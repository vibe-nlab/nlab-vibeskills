import React, { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import gsap from "gsap";
import s from "./PageTransition.module.scss";

const PageTransition = ({ children }) => {
  const router = useRouter();
  const contentRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Пропускаем анимацию при первой загрузке
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const handleRouteChangeStart = () => {
      if (contentRef.current) {
        // Быстрая анимация выхода: fade out
        gsap.to(contentRef.current, {
          opacity: 0,
          duration: 0.2,
          ease: "power2.in",
        });
      }
    };

    const handleRouteChangeComplete = () => {
      if (contentRef.current) {
        // Устанавливаем начальное состояние для анимации входа
        gsap.set(contentRef.current, {
          opacity: 0,
          y: 15,
        });

        // Небольшая задержка для плавности
        requestAnimationFrame(() => {
          // Анимация входа: fade in + slide up
          gsap.to(contentRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out",
          });
        });
      }
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, [router.events]);

  return (
    <div ref={contentRef} className={s.transitionWrapper}>
      {children}
    </div>
  );
};

export default PageTransition;
