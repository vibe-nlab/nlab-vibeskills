import React from "react";
import sc from "utils/stringToClass";

const useStringToClass = (styles) => {
  const savedStyled = React.useMemo(() => styles, [styles]);

  return React.useCallback(
    (...args) => {
      return sc(savedStyled, [...args].join(" "));
    },
    [savedStyled]
  );
};

export default useStringToClass;
