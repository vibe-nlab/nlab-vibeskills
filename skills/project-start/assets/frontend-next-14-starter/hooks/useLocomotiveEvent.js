import React from "react";
import ScrollContext from "contexts/ScrollContext";

const useLocomotiveEvent = (event, callback) => {
  const callbackRef = React.useRef(null);
  const scroll = React.useContext(ScrollContext);

  const handleCallback = React.useCallback((event) => {
    callbackRef?.current(event);
  }, []);

  React.useEffect(() => {
    scroll?.on(event, handleCallback);

    return () => {
      scroll?.off(event, handleCallback);
    };
  }, [event, scroll, handleCallback]);

  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return null;
};

export default useLocomotiveEvent;
