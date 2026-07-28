import React, { useState, useEffect } from "react";

const useViewport = (func) => {
  const [state, setState] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTouchDevice: false,
  });

  const isMobileCheck = React.useCallback((width) => width <= 490, []);
  const isTabletCheck = React.useCallback(
    (width) => width > 490 && width <= 1024,
    []
  );
  const isDesktopCheck = React.useCallback((width) => width > 1024, []);
  const isTouchDeviceCheck = React.useCallback(
    () => "ontouchstart" in window,
    []
  );

  const handleResize = React.useCallback(() => {
    const bcr = window.document.body.getBoundingClientRect();
    const isMobile = isMobileCheck(bcr.width);
    const isTablet = isTabletCheck(bcr.width);
    const isDesktop = isDesktopCheck(bcr.width);
    const isTouchDevice = isTouchDeviceCheck();

    if (state.isMobile !== isMobile) setState({ ...state, isMobile });
    if (state.isTablet !== isTablet) setState({ ...state, isTablet });
    if (state.isDesktop !== isDesktop) setState({ ...state, isDesktop });
    if (state.isTouchDevice !== isTouchDevice)
      setState({ ...state, isTouchDevice });
  }, [state]);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return state;
};

export default useViewport;
