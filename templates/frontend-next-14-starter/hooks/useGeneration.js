import React, { useCallback, useEffect, useState } from "react";

import axios from "axios";
import useStore from "./useStore";

const SERVER_URL = process.env.BACKEND_URL;

const cleanObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== null)
  );
};

const useGeneration = () => {
  const { downloadedMedia, mainMedia, setUploadedImages, uploadedImages } =
    useStore();
  const getProjectData = useStore((state) => state.getProjectData);
  const setBalance = useStore((state) => state.setBalance);
  const token = useStore((state) => state.token);

  const nextStep = useStore((state) => state.nextStep);
  const setLoading = useStore((state) => state.setLoading);
  const setError = useStore((state) => state.setError);
  // const userFreeGen = useStore((state) => state.userFreeGen);
  const { setCreatingGeneration, isCreatingGeneration, setMyGenerations } =
    useStore();

  const projectData = getProjectData();
  // const [isError, setError] = useState(false);

  const makeData = React.useCallback(
    (img_to_upload) => {
      if (projectData.projectType !== "videoGeneration") {
        return {
          cardType: projectData.projectType,
          options: cleanObject({
            resolutionCardType: projectData.cardType,
            description:
              projectData.projectType === "imageUpscale"
                ? null
                : projectData.desc_prompt,
            userStyleDescription: projectData.style_prompt,
            modelId:
              projectData.model !== null ? String(projectData.model) : null,
            styleId: projectData.style !== null ? projectData.style : null,
            images: img_to_upload, // Используем загруженные имена файлов
            itemSize: projectData.size === 4 ? 3 : projectData.size,
            // isFree: userFreeGen[projectData.projectType] || false,
            age: projectData.age || null,
            // hair: projectData.hair || null,
            gender: projectData.gender || null,
            photo_count:
              projectData.projectType === "imageUpscale"
                ? 2
                : projectData.projectType === "generatingPhotoShots" ||
                  projectData.projectType === "modelReplacementPhotoRedesign"
                ? projectData.photo_count
                : projectData.photo_count,
          }),
        };
      } else {
        return {
          options: {
            description: projectData.style
              ? projectData.style
              : projectData.style_prompt,
            images: img_to_upload,
            // isFree: userFreeGen[projectData.projectType] || false,
          },
        };
      }
    },
    [projectData]
  );

  const uploadFiles = async () => {
    // setLoading(true);

    const formData = new FormData();
    if (mainMedia.length > 0) formData.append("images", mainMedia[0]);
    downloadedMedia.forEach((file) => formData.append("images", file));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await axios.post(`${SERVER_URL}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        setUploadedImages(response.data.images);
        return {
          status: true,
          imageUpload: response.data.images,
        };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const isTimeout = axios.isCancel(error) || error.name === "CanceledError";
      setError({
        type: isTimeout ? "timeout" : error.response?.data?.type || "network",
        comment: isTimeout
          ? "Загрузка заняла слишком много времени. Попробуйте еще раз"
          : error.response?.data?.message ||
            "Ошибка при загрузке, попробуйте еще раз",
        btnClose: true,
      });
      setLoading(false);
      return {
        status: false,
      };
    }
  };

  const createImageTask = async (skipStep = false) => {
    const result = await uploadFiles();
    if (!result.status) return;

    const data = makeData(result.imageUpload);
    const url =
      projectData.projectType === "videoGeneration" ? "video" : "image";

    try {
      const response = await axios.post(`${SERVER_URL}/task/${url}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBalance(response.data.balance);
      if (response.data?.tasks) {
        setMyGenerations(response.data.tasks);
      }
      setLoading(false);
      nextStep();

      return response.data;
    } catch (error) {
      setLoading(false);
      setCreatingGeneration(false);
      if (error.response.data.type === "balance") {
        setError({ type: "money", comment: "" });
        setBalance(Number(error?.response?.data?.message));
      } else if (error.response.data.type === "blocked") {
        setError({ type: "blocked", comment: error.response.data.message });
      } else {
        setError({ type: "generation", comment: error.response.data.message });
      }
      console.error(
        "Ошибка при отправке задачи на генерацию:",
        error.response?.data || error.message
      );
    }
  };

  return {
    createImageTask,
  };
};

export default useGeneration;
