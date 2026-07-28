import { useMemo } from "react";

const useData = (data, deps = []) => {
  return useMemo(() => ({ ...data }), deps);
};

export default useData;
