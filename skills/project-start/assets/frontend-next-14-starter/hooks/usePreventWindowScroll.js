import { useCallback, useEffect } from "react";

const usePreventWindowScroll = () => {
  const handleWheel = useCallback((e) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchmove", handleWheel, { passive: false });
    window.addEventListener("mousewheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleWheel);
      window.removeEventListener("mousewheel", handleWheel);
    };
  }, [handleWheel]);
};

export default usePreventWindowScroll;
