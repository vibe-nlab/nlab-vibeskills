import { useState, useEffect } from "react";

/**
 * Хук для глобального drag & drop функционала
 * @param {Function} onFilesDrop - функция для обработки загруженных файлов
 * @param {boolean} disabled - отключить drag & drop (например, во время генерации)
 * @returns {Object} - состояние и обработчики для drag & drop
 */
const useGlobalDragDrop = (onFilesDrop, disabled = false) => {
  const [isGlobalDragOver, setIsGlobalDragOver] = useState(false);

  // Глобальные Drag & Drop handlers для всего экрана
  const handleGlobalDragOver = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsGlobalDragOver(true);
  };

  const handleGlobalDragLeave = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    // Проверяем, что мы действительно покидаем окно браузера
    if (!e.relatedTarget) {
      setIsGlobalDragOver(false);
    }
  };

  const handleGlobalDrop = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsGlobalDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFiles = droppedFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length > 0 && typeof onFilesDrop === "function") {
      onFilesDrop({ target: { files: imageFiles } });
    }
  };

  // Устанавливаем глобальные обработчики drag & drop
  useEffect(() => {
    if (disabled) return;

    const handleGlobalDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsGlobalDragOver(true);
    };

    // Добавляем обработчики на document
    document.addEventListener("dragover", handleGlobalDragOver);
    document.addEventListener("dragenter", handleGlobalDragEnter);
    document.addEventListener("dragleave", handleGlobalDragLeave);
    document.addEventListener("drop", handleGlobalDrop);

    // Очищаем обработчики при размонтировании
    return () => {
      document.removeEventListener("dragover", handleGlobalDragOver);
      document.removeEventListener("dragenter", handleGlobalDragEnter);
      document.removeEventListener("dragleave", handleGlobalDragLeave);
      document.removeEventListener("drop", handleGlobalDrop);
    };
  }, [onFilesDrop, disabled]);

  return {
    isGlobalDragOver,
    setIsGlobalDragOver,
  };
};

export default useGlobalDragDrop;
