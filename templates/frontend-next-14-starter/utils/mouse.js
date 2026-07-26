export const getUniCoords = (event) => {
  const x = event.changedTouches
    ? event.changedTouches[0].clientX
    : event.clientX;
  const y = event.changedTouches
    ? event.changedTouches[0].clientY
    : event.clientY;

  return { x, y };
};
