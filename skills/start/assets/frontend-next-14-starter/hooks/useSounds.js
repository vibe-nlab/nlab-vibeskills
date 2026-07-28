import { useContext } from "react";
import SoundContext from "contexts/SoundProvider/SoundContext";

const useSounds = () => {
  return useContext(SoundContext);
};

export default useSounds;
