import React from "react";
import debounce from "lodash/debounce";

export default () => {
  const handleCalcRealVh = React.useCallback(() => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }, []);

  React.useEffect(() => {
    const debouncedVh = debounce(handleCalcRealVh, 33, {
      trailing: true,
      leading: false,
    });

    debouncedVh();

    window.addEventListener("resize", debouncedVh);

    return () => {
      window.removeEventListener("resize", debouncedVh);
    };
  }, []);
};
