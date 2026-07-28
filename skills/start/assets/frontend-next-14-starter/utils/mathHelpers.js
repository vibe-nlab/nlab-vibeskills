export const mix = (x, y, a) => {
  return x * (1 - a) + y * a;
};

export const clamp = (x, minVal, maxVal) => {
  return Math.min(Math.max(x, minVal), maxVal);
};

export const round = (t, i) => {
  i = 0 !== i ? Math.pow(10, i) : 1e3; // eslint-disable-line
  return Math.round(t * i) / i;
};

export const roundFloor = (t, i) => {
  i = 0 !== i ? Math.pow(10, i) : 1e3; // eslint-disable-line
  return Math.floor(t * i) / i;
};

export const vhToPx = (vh) => {
  return (vh / 100) * window.innerHeight;
};

export const getUvRate = (width, height) => {
  if (width > height) {
    return { x: 1, y: width / height };
  }

  return { x: height / width, y: 1 };
};

export const randomInRange = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getRandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
};

export const fract = (x) => {
  return x - Math.floor(x);
};

export const getFirstDigit = (position) => {
  return Number(position.toFixed(0)[0]);
};

export const calculateCircumference = (radius) => {
  return 2 * Math.PI * radius;
};

export const getDistance = (x1, x2, y1, y2) => {
  return ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5;
};

export const getDistanceX = (x1, x2) => {
  return ((x2 - x1) ** 2) ** 0.5;
};

export const getRadiusCircle = ({ width, height }) => {
  const diagonal = Math.hypot(width, height);
  const normalizeD = diagonal / Math.min(width, height);
  return normalizeD / 2;
};

export const step = (edge, x) => (x < edge ? 0 : 1);

export const getProgress = (start, end, value) => {
  const dist = end - start;
  return clamp((value - start) / dist, 0, 1);
};

export const tri = (p) => {
  return mix(p, 1 - p, step(0.5, p)) * 2;
};
