const nextFrame = (fn) => {
  const rafId = requestAnimationFrame(() => {
    fn();
    cancelAnimationFrame(rafId);
  });
};

export default nextFrame;
