import React from "react";
import useChangeEffect from "hooks/useChangeEffect";

const getBreakpoint = () => {
  if (window.innerWidth <= 480) {
    return { width: 360, height: 800 };
  }
  return { width: 1440, height: 900 };
};

const getFontRatio = () => {
  const breakpoint = getBreakpoint();

  const hRatio = window.innerWidth / breakpoint.width;
  const vRatio = window.innerHeight / breakpoint.height;

  if (window.innerWidth <= 480) {
    return hRatio;
  }

  return Math.min(hRatio, vRatio);
};

const useResponsible = () => {
  const [fontRatio, setFontRatio] = React.useState(1.0);

  const handleResize = () => {
    const ratio = getFontRatio();
    setFontRatio(ratio);
  };

  React.useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useChangeEffect(() => {
    document.documentElement.style.setProperty("font-size", `${fontRatio}px`);
  }, fontRatio);
};

export default useResponsible;
