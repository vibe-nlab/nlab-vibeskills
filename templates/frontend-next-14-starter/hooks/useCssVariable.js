import React from "react";

const useCssVariable = (name) => {
  const [variable, setVariable] = React.useState("");

  React.useLayoutEffect(() => {
    setVariable(getComputedStyle(document.body).getPropertyValue(name));
  }, []);

  return variable;
};

export default useCssVariable;
