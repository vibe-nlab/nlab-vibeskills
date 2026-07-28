import React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

if (typeof document === "undefined") {
  React.useLayoutEffect = React.useEffect;
}

const useLocomotive = (props) => {
  const [scroll, setScroll] = React.useState(null);

  const data = React.useMemo(
    () => ({
      scroll: null,
      resizeObserver: null,
    }),
    []
  );

  React.useLayoutEffect(() => {
    const element = document.querySelector(
      props?.element || `[data-scroll-container]`
    );

    data.scroll = new LocomotiveScroll({
      el: element,
      smooth: props?.smooth || true,
      ...props,
    });

    data.resizeObserver = new ResizeObserver(() => {
      window.dispatchEvent(new Event("resize"));
    });

    // data.scroll.scrollTo(0, { duration: 0, disableLerp: true });

    // ScrollTrigger.scrollerProxy(element, {
    //   scrollTop: (value) => {
    //     return data.scroll.scroll.instance.scroll.y;
    //   },
    //   scrollLeft: (value) => {
    //     return data.scroll.scroll.instance.scroll.x;
    //   },
    //   scrollHeight: () => data.scroll.scroll.instance.limit.y,
    //   getBoundingClientRect: () => {
    //     return {
    //       top: 0,
    //       left: 0,
    //       width: window.innerWidth,
    //       height: window.innerHeight,
    //     };
    //   },
    //   pinType: "transform",
    // });

    // const refreshScroll = () => data.scroll.update();

    // ScrollTrigger.addEventListener("refresh", refreshScroll);
    // data.scroll.on("scroll", ScrollTrigger.update);
    data.resizeObserver.observe(element);
    setScroll(data.scroll);

    // ScrollTrigger.normalizeScroll(true);
    // ScrollTrigger.refresh(true);

    return () => {
      // ScrollTrigger.removeEventListener("refresh", refreshScroll);
      // data.scroll.off("scroll", ScrollTrigger.update);
      data.resizeObserver.unobserve(element);
      data.scroll.destroy();
    };
  }, []);

  return scroll;
};

export default useLocomotive;
