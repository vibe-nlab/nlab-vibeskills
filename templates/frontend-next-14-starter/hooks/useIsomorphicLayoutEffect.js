import { useEffect, useLayoutEffect } from "react";

// Хук для безопасного использования useLayoutEffect на сервере и клиенте
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
