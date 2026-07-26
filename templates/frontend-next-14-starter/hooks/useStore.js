import React from "react";
import { StoreContext } from "contexts/ZustandProvider";

const useStore = (selector, eqFn) => {
  const store = React.useContext(StoreContext);
  return store(selector, eqFn);
};

export default useStore;
