import { useEffect, useState } from "react";
import { PROJECT_TYPES_AND_STATES_MAP } from "../constants/project"; // путь адаптируй под себя
import useStore from "./useStore";

export const useIsLastStep = () => {
  const [isLastStep, setIsLastStep] = useState(false);
  const { projectType, step } = useStore();

  useEffect(() => {
    const steps = PROJECT_TYPES_AND_STATES_MAP.get(projectType);
    const newLastStep = steps?.length - 2 === step;
    if (isLastStep !== newLastStep) {
      setIsLastStep(newLastStep);
    }
  }, [projectType, step, isLastStep]);

  return isLastStep;
};
