import React from "react";

import usePrevious from "hooks/usePrevious";

const useChangeEffect = (callback, param) => {
  const callbackRef = React.useRef(callback);
  const prevParam = usePrevious(param);

  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  React.useEffect(() => {
    if (param !== prevParam) {
      callbackRef.current(param);
    }
  }, [param, prevParam]);
};

export default useChangeEffect;
