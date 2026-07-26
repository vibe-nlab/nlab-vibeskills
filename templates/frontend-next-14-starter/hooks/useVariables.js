import { useMemo } from "react";

const useVariables = (data, deps = []) => {
  return useMemo(() => ({ ...data }), deps);
};

export default useVariables;
