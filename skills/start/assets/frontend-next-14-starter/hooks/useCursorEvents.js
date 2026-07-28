import { useCallback, useRef, useEffect } from 'react';

import { useCursorEvents } from 'components/common/CustomCursor';

export default ({
  onMouseEnter,
  onMouseLeave,
  onMouseOver,
  disabled,
  cursorType,
  cbData,
  disableCursor,
  disableCursorEnter,
  cursorText,
}) => {
  const refMount = useRef(false);
  const [onCursorEnter, onCursorLeave] = useCursorEvents();

  const handleMouseEnter = useCallback(() => {
    if (onMouseEnter) onMouseEnter(cbData);
    if (!disabled && !disableCursor && !disableCursorEnter) {
      onCursorEnter(cursorType, cursorText);
    }
  }, [
    onMouseEnter,
    onCursorEnter,
    disabled,
    cursorType,
    cbData,
    disableCursor,
    cursorText,
    disableCursorEnter,
  ]);

  const handleMouseLeave = useCallback(() => {
    if (onMouseLeave) onMouseLeave(cbData);
    if (!disableCursor) {
      onCursorLeave();
    }
  }, [
    onMouseLeave,
    onCursorLeave,
    disabled,
    cursorType,
    cbData,
    disableCursor,
  ]); // eslint-disable-line

  const handleMouseMove = useCallback(() => {
    if (!disabled && !disableCursor && !disableCursorEnter) {
      onCursorEnter(cursorType, cursorText);
    }
  }, [
    onCursorEnter,
    disabled,
    cursorType,
    disableCursor,
    cursorText,
    disableCursorEnter,
  ]);

  const handleMouseOver = useCallback(() => {
    if (onMouseOver) onMouseOver(cbData);
  }, [onMouseOver, cbData]);

  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    refMount.current = true;
  }, []);

  return {
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMove,
    handleDoubleClick,
    handleMouseOver,
  };
};
