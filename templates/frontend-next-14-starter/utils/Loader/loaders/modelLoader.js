import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// let loader = null;

function modelLoader(file) {
  // if (!loader) {
  // const loader = new GLTFLoader();
  // }

  return new GLTFLoader().loadAsync(file);
}

export default modelLoader;
