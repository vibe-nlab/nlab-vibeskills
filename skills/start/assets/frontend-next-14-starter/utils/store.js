// store.js

import { useMemo } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

let store;

const initialState = {
  projectType: null,
  cardType: "story",
  username: null,
  balance: 0,
  userInfo: null, // Полная информация о пользователе: { id, email, first_name, last_name, telegram_id, telegram_username, balance, ... }
  isLoading: false,
  isError: false,
  payments: [],
  token: null,
  tg: null,
  typePrice: null,
  myGenerations: [],
  refObject: null,
  isDeposit: false,
  isAuth: false,
  authType: "",
  subscribe: null,
  telegramId: null,
  refCode: null,
  isLoginFromService: false,
  lang: "eng",
  current_gens_in_process: 0,
  // Поле для генерации фона и модели:
  generateBackgroundAndModel: {
    mainImage: { url: "" },
    cloathDescription: "",
    face: "",
    background: {
      type: "ready",
      url: "",
      prompt: "",
      back_id: null,
      downloaded_back: null,
    },
    model: {
      type: "",
      gender: "female",
      age: { value: "24 y.o", label: "Молодой (от 20 до 30 лет)" },
      photoUrl: "",
    },
  },

  // Данные для фотосессии:
  generatePhotoSession: {
    photosessionMainImage: { url: "" },
    photosessionCloathDescription: "",
    photosessionBackground: { type: "", url: "", prompt: "" },
    photosessionModel: {
      gender: "female",
      age: { value: "24 y.o", label: "Молодой (от 20 до 30 лет)" },
      photoUrl: "",
    },
    photoSessionPrompt: {
      category: "",
      type: "",
      combinantion: "",
      shoes: "",
    },
  },

  // Данные для каталога:
  generateCatology: {
    catologyMainImage: { url: "" },
    catologyCloathDescription: "",
    catologyBackground: { type: "", url: "", prompt: "" },
    catologyModel: {
      gender: "female",
      age: { value: "24 y.o", label: "Молодой (от 20 до 30 лет)" },
      photoUrl: "",
    },
    catologyPrompt: {
      category: "",
      type: "",
      combinantion: "",
      shoes: "",
    },
  },

  // Данные для отзывов:
  generatePhotoReviews: {
    mainImage: { url: "" },
    cloathDescription: "",
    face: "",
  },

  // Данные для Creative Image:
  generateCreativeImage: {
    creativeImageMainImage: { url: "" },
    creativeImageStyle: {
      type: "ready",
      url: "",
      prompt: "",
      back_id: null,
      downloaded_back: null,
    },
    face: "",
    clothingDescription: "",
  },

  // Поле для уведомлений (сообщения) и управления popup'ом:
  notification: {
    type: "", // "error" или "message"
    text: "", // текст уведомления
    messegeType: "", // дополнительный тег, например "money"
  },

  // Поле для открытия попапов:
  activePopup: "", // пусто или ключ типа попапа

  // Поле для промокод попапа:
  isPromoCodePopupOpen: false,

  // Данные для улучшения фото:
  ImageUpscaleUrl: "",

  // Данные для генерации видео:
  videoGeneration: {
    imageUrl: "",
    type: "",
    prompt: [],
  },

  // Поле для попапа редактирования изображения:
  isImageEditPopoverOpen: false,
  imageEditUrl: "",
  imageEditData: null, // { url, id, projectId }

  // Поле для плейсхолдера генерации на канвасе:
  generationPlaceholder: null, // { id, x, y, width, height, requestId, projectId }

  // Поле для попапа подписки:
  isSubscriptionPopupOpen: false,

  // Поле для тостов (уведомлений):
  toast: null, // { type: "success" | "error", message: string, duration?: number, autoHide?: boolean, isVisible?: boolean }
};

function initStore(preloadedState = initialState) {
  return create(
    immer((set, get) => ({
      ...initialState,
      ...preloadedState,

      // ─── Существующие сеттеры ───
      setProjectType: (projectType) =>
        set(
          (state) => {
            state.projectType = projectType;
          },
          false,
          "SET_PROJECT_TYPE"
        ),

      setMyGenerations: (myGenerations) =>
        set(() => ({ myGenerations }), false, "SET_MY_GENERATIONS"),

      setCardType: (cardType) =>
        set(
          (state) => {
            state.cardType = cardType;
          },
          false,
          "SET_CARD_TYPE"
        ),

      setGensInProcess: (current_gens_in_process) =>
        set(
          (state) => {
            state.current_gens_in_process = current_gens_in_process;
          },
          false,
          "SET_CARD_TYPE"
        ),

      setLang: (lang) =>
        set(
          (state) => {
            state.lang = lang;
          },
          false,
          "SET_LANG"
        ),

      setIsLoginFromService: (isLoginFromService) =>
        set(
          (state) => {
            state.isLoginFromService = isLoginFromService;
          },
          false,
          "SET_ISLOGINFROMSERVICE"
        ),

      setTelegramId: (telegramId) =>
        set(
          (state) => {
            state.telegramId = telegramId;
          },
          false,
          "SET_TELEGRAM_ID"
        ),

      setDeposit: (isDeposit) =>
        set(
          (state) => {
            state.isDeposit = isDeposit;
          },
          false,
          "SET_DEPOSIT"
        ),

      setSubscribe: (subscribe) =>
        set(
          (state) => {
            state.subscribe = subscribe;
          },
          false,
          "SET_SUBSCRIBE"
        ),

      setPayments: (payments) =>
        set(
          (state) => {
            state.payments = payments;
          },
          false,
          "SET_PAYMENTS"
        ),

      setRefCode: (refCode) =>
        set(
          (state) => {
            state.refCode = refCode;
          },
          false,
          "SET_REF_CODE"
        ),

      setTypePrice: (typePrice) =>
        set(
          (state) => {
            state.typePrice = typePrice;
          },
          false,
          "SET_TYPE_PRICE"
        ),

      setLoading: (isLoading) =>
        set(
          (state) => {
            state.isLoading = isLoading;
          },
          false,
          "SET_LOADING"
        ),

      setToken: (token) =>
        set(
          (state) => {
            state.token = token;
          },
          false,
          "SET_TOKEN"
        ),

      setIsAuth: (isAuth) =>
        set(
          (state) => {
            state.isAuth = isAuth;
          },
          false,
          "SET_AUTH"
        ),

      setAuthType: (authType) =>
        set(
          (state) => {
            state.authType = authType;
          },
          false,
          "SET_AUTH_TYPE"
        ),

      setRefObject: (refObject) =>
        set(
          (state) => {
            state.refObject = refObject;
          },
          false,
          "SET_REFOBJECT"
        ),

      setError: (isError) =>
        set(
          (state) => {
            state.isError = isError;
          },
          false,
          "SET_ERROR"
        ),

      setUsername: (username) =>
        set(
          (state) => {
            state.username = username;
          },
          false,
          "SET_USERNAME"
        ),

      setBalance: (balance) =>
        set(
          (state) => {
            const formattedBalance = new Intl.NumberFormat("ru-RU", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(balance);
            state.balance = formattedBalance;
            // Также обновляем баланс в userInfo, если он есть
            if (state.userInfo) {
              state.userInfo.balance = balance;
            }
          },
          false,
          "SET_BALANCE"
        ),

      setUserInfo: (userInfo) =>
        set(
          (state) => {
            state.userInfo = userInfo;
            // Обновляем баланс из userInfo
            if (userInfo && userInfo.balance !== undefined) {
              state.balance = new Intl.NumberFormat("ru-RU", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(userInfo.balance);
            }
            // Обновляем username из userInfo
            if (userInfo) {
              const firstName = userInfo.first_name || "";
              const lastName = userInfo.last_name || "";
              state.username =
                (firstName + " " + lastName).trim() ||
                userInfo.email ||
                userInfo.telegram_username ||
                null;
            }
          },
          false,
          "SET_USER_INFO"
        ),

      // ─── Сеттеры для generateBackgroundAndModel ───
      setMainImageUrl: (url) =>
        set(
          (state) => {
            state.generateBackgroundAndModel.mainImage.url = url;
          },
          false,
          "SET_MAIN_IMAGE_URL"
        ),

      setCloathDescription: (text) =>
        set(
          (state) => {
            state.generateBackgroundAndModel.cloathDescription = text;
          },
          false,
          "SET_CLOATH_DESCRIPTION"
        ),

      setFace: (faceValue) =>
        set(
          (state) => {
            state.generateBackgroundAndModel.face = faceValue;
          },
          false,
          "SET_FACE"
        ),

      setBackground: ({ type, url, prompt = "", back_id, downloaded_back }) =>
        set(
          (state) => {
            const bg = state.generateBackgroundAndModel.background;
            bg.type = type;
            bg.url = url || "";
            bg.back_id = back_id;
            bg.downloaded_back = downloaded_back;

            if (type === "make_your") bg.prompt = prompt;
            else delete bg.prompt;
          },
          false,
          "SET_BACKGROUND"
        ),

      setModel: ({ type, gender, age, photoUrl }) =>
        set(
          (state) => {
            const m = state.generateBackgroundAndModel.model;
            (m.type = type), (m.gender = gender);
            m.age = age;
            m.photoUrl = photoUrl;
          },
          false,
          "SET_MODEL"
        ),

      resetGenerateBackgroundAndModel: () =>
        set(
          (state) => {
            state.generateBackgroundAndModel = {
              mainImage: { url: "" },
              cloathDescription: "",
              face: "",
              background: { type: "ready", url: "", prompt: "" },
              model: {
                type: "1",
                gender: "female",
                info: { gender: "female", age: "" },
              },
            };
          },
          false,
          "RESET_GENERATE_BACKGROUND_AND_MODEL"
        ),

      // ─── Сеттеры для generatePhotoReviews───
      setPhotoReviewsMainImageUrl: (url) =>
        set(
          (state) => {
            state.generatePhotoReviews.mainImage.url = url;
          },
          false,
          "SET_MAIN_IMAGE_URL"
        ),

      setPhotoReviewsCloathDescription: (text) =>
        set(
          (state) => {
            state.generatePhotoReviews.cloathDescription = text;
          },
          false,
          "SET_CLOATH_DESCRIPTION"
        ),

      setPhotoReviewsFace: (faceValue) =>
        set(
          (state) => {
            state.generatePhotoReviews.face = faceValue;
          },
          false,
          "SET_FACE"
        ),

      resetPhotoReviews: () =>
        set(
          (state) => {
            state.generatePhotoReviews = {
              mainImage: { url: "" },
              cloathDescription: "",
              face: "",
            };
          },
          false,
          "RESET_PhotoReviews"
        ),

      // ─── Сеттеры для generatePhotoSession ───
      setPhotosessionMainImageUrl: (url) =>
        set(
          (state) => {
            state.generatePhotoSession.photosessionMainImage.url = url;
          },
          false,
          "SET_PHOTOSESSION_MAIN_IMAGE_URL"
        ),

      setPhotosessionCloathDescription: (text) =>
        set(
          (state) => {
            state.generatePhotoSession.photosessionCloathDescription = text;
          },
          false,
          "SET_PHOTOSESSION_CLOATH_DESCRIPTION"
        ),

      setPhotosessionBackground: ({ type, url, prompt = "" }) =>
        set(
          (state) => {
            const bgPS = state.generatePhotoSession.photosessionBackground;
            bgPS.type = type;
            bgPS.url = url || "";
            if (type === "make_your") bgPS.prompt = prompt;
            else delete bgPS.prompt;
          },
          false,
          "SET_PHOTOSESSION_BACKGROUND"
        ),

      setPhotosessionModel: ({ gender, age, photoUrl }) =>
        set(
          (state) => {
            const mPS = state.generatePhotoSession.photosessionModel;
            mPS.gender = gender;
            mPS.age = age;
            mPS.photoUrl = photoUrl;
          },
          false,
          "SET_PHOTOSESSION_MODEL"
        ),
      setPhotosessionPrompt: (type) =>
        set(
          (state) => {
            state.generatePhotoSession.photoSessionPrompt = type;
          },
          false,
          "SET_PHOTOSESSION_PROMPT"
        ),

      resetGeneratePhotoSession: () =>
        set(
          (state) => {
            state.generatePhotoSession = {
              photosessionMainImage: { url: "" },
              photosessionCloathDescription: "",
              photosessionBackground: { type: "ready", url: "", prompt: "" },
              photosessionModel: {
                gender: "female",
                age: { value: "young", label: "Молодой (от 20 до 30 лет)" },
                photoUrl: "",
              },
            };
          },
          false,
          "RESET_GENERATE_PHOTOSESSION"
        ),

      // ─── Сеттеры для generateCatology ───
      setCatologyMainImageUrl: (url) =>
        set(
          (state) => {
            state.generateCatology.catologyMainImage.url = url;
          },
          false,
          "SET_PHOTOSESSION_MAIN_IMAGE_URL"
        ),

      setCatologyCloathDescription: (text) =>
        set(
          (state) => {
            state.generateCatology.catologyCloathDescription = text;
          },
          false,
          "SET_PHOTOSESSION_CLOATH_DESCRIPTION"
        ),

      setCatologyBackground: ({ type, url, prompt = "" }) =>
        set(
          (state) => {
            const bgPS = state.generateCatology.catologyBackground;
            bgPS.type = type;
            bgPS.url = url || "";
            if (type === "make_your") bgPS.prompt = prompt;
            else delete bgPS.prompt;
          },
          false,
          "SET_PHOTOSESSION_BACKGROUND"
        ),

      setCatologyModel: ({ gender, age, photoUrl }) =>
        set(
          (state) => {
            const mPS = state.generateCatology.catologyModel;
            mPS.gender = gender;
            mPS.age = age;
            mPS.photoUrl = photoUrl;
          },
          false,
          "SET_PHOTOSESSION_MODEL"
        ),
      setCatologyPrompt: (type) =>
        set(
          (state) => {
            state.generateCatology.catologyPrompt = type;
          },
          false,
          "SET_PHOTOSESSION_PROMPT"
        ),

      resetGenerateCatology: () =>
        set(
          (state) => {
            state.generateCatology = {
              catologyMainImage: { url: "" },
              catologyCloathDescription: "",
              catologyBackground: { type: "ready", url: "", prompt: "" },
              catologyModel: {
                gender: "female",
                age: { value: "young", label: "Молодой (от 20 до 30 лет)" },
                photoUrl: "",
              },
            };
          },
          false,
          "RESET_GENERATE_CATALOGY"
        ),

      setCreativeImageStyle: ({
        type,
        url,
        prompt = "",
        back_id = null,
        downloaded_back = null,
      }) =>
        set(
          (state) => {
            const style = state.generateCreativeImage.creativeImageStyle;
            style.type = type;
            style.url = url || "";
            style.back_id = back_id;
            style.downloaded_back = downloaded_back;
            if (type === "make_your") style.prompt = prompt;
            else delete style.prompt;
          },
          false,
          "SET_CREATIVE_IMAGE_STYLE"
        ),

      setCreativeImageFace: (face) =>
        set(
          (state) => {
            state.generateCreativeImage.face = face;
          },
          false,
          "SET_CREATIVE_IMAGE_FACE"
        ),

      setCreativeImageClothingDescription: (description) =>
        set(
          (state) => {
            state.generateCreativeImage.clothingDescription = description;
          },
          false,
          "SET_CREATIVE_IMAGE_CLOTHING_DESCRIPTION"
        ),

      // ─── Сеттеры для уведомлений и popup ───
      setNotification: ({ type, text, messegeType }) =>
        set(
          (state) => {
            state.notification.type = type;
            state.notification.text = text;
            state.notification.messegeType = messegeType;
          },
          false,
          "SET_NOTIFICATION"
        ),

      clearNotification: () =>
        set(
          (state) => {
            state.notification = { type: "", text: "", messegeType: "" };
          },
          false,
          "CLEAR_NOTIFICATION"
        ),

      setActivePopup: (popupType) =>
        set(
          (state) => {
            state.activePopup = popupType;
          },
          false,
          "SET_ACTIVE_POPUP"
        ),

      // ─── Действия для промокод попапа ───
      openPromoCodePopup: () =>
        set(
          (state) => {
            state.isPromoCodePopupOpen = true;
          },
          false,
          "OPEN_PROMO_CODE_POPUP"
        ),

      closePromoCodePopup: () =>
        set(
          (state) => {
            state.isPromoCodePopupOpen = false;
          },
          false,
          "CLOSE_PROMO_CODE_POPUP"
        ),

      // ─── Новые сеттеры для улучшения фото ───
      setImageUpscaleUrl: (url) =>
        set(
          (state) => {
            state.ImageUpscaleUrl = url;
          },
          false,
          "SET_IMAGE_UPSCALE_URL"
        ),

      resetImageUpscaleUrl: () =>
        set(
          (state) => {
            state.ImageUpscaleUrl = "";
          },
          false,
          "RESET_IMAGE_UPSCALE_URL"
        ),

      // ─── Новые сеттеры для генерации видео ───
      setVideoGenerationImageUrl: (imageUrl) =>
        set(
          (state) => {
            state.videoGeneration.imageUrl = imageUrl;
          },
          false,
          "SET_VIDEO_GENERATION_IMAGE_URL"
        ),

      setVideoGenerationType: (type) =>
        set(
          (state) => {
            state.videoGeneration.type = type;
          },
          false,
          "SET_VIDEO_GENERATION_TYPE"
        ),

      setVideoGenerationPrompt: (prompt) =>
        set(
          (state) => {
            state.videoGeneration.prompt = prompt;
          },
          false,
          "SET_VIDEO_GENERATION_PROMPT"
        ),

      resetVideoGeneration: () =>
        set(
          (state) => {
            state.videoGeneration = {
              imageUrl: "",
              type: "make_your",
              prompt: "",
            };
          },
          false,
          "RESET_VIDEO_GENERATION"
        ),
      resetAfterLogout: () =>
        set(
          (state) => {
            state.token = null;
            state.payments = [];
            state.balance = 0;
            state.refObject = null;
            state.subscribe = null;
            state.username = null;
            state.userInfo = null;
            state.telegramId = null;
            state.myGenerations = [];
          },
          false,
          "RESET_GENERATE_PHOTOSESSION"
        ),

      // ─── Действия для попапа редактирования изображения ───
      openImageEditPopover: (imageData) =>
        set(
          (state) => {
            state.isImageEditPopoverOpen = true;
            if (typeof imageData === "string") {
              // Обратная совместимость
              state.imageEditUrl = imageData || "";
              state.imageEditData = { url: imageData };
            } else if (imageData) {
              state.imageEditUrl = imageData.url || "";
              state.imageEditData = imageData;
            } else {
              state.imageEditUrl = "";
              state.imageEditData = null;
            }
          },
          false,
          "OPEN_IMAGE_EDIT_POPOVER"
        ),

      closeImageEditPopover: () =>
        set(
          (state) => {
            state.isImageEditPopoverOpen = false;
            state.imageEditUrl = "";
            state.imageEditData = null;
          },
          false,
          "CLOSE_IMAGE_EDIT_POPOVER"
        ),

      // ─── Действия для попапа подписки ───
      openSubscriptionPopup: () =>
        set(
          (state) => {
            state.isSubscriptionPopupOpen = true;
          },
          false,
          "OPEN_SUBSCRIPTION_POPUP"
        ),

      closeSubscriptionPopup: () =>
        set(
          (state) => {
            state.isSubscriptionPopupOpen = false;
          },
          false,
          "CLOSE_SUBSCRIPTION_POPUP"
        ),

      // ─── Действия для плейсхолдера генерации ───
      showGenerationPlaceholder: (data) =>
        set(
          (state) => {
            state.generationPlaceholder = {
              id: data.id || `generation-${Date.now()}`,
              x: data.x || 0,
              y: data.y || 0,
              width: data.width || 200,
              height: data.height || 200,
              requestId: data.requestId || null,
              projectId: data.projectId || null,
            };
          },
          false,
          "SHOW_GENERATION_PLACEHOLDER"
        ),

      updateGenerationPlaceholder: (updates) =>
        set(
          (state) => {
            if (state.generationPlaceholder) {
              Object.assign(state.generationPlaceholder, updates);
            }
          },
          false,
          "UPDATE_GENERATION_PLACEHOLDER"
        ),

      hideGenerationPlaceholder: () =>
        set(
          (state) => {
            state.generationPlaceholder = null;
          },
          false,
          "HIDE_GENERATION_PLACEHOLDER"
        ),

      // ─── Действия для тостов (уведомлений) ───
      showToast: (type, message, options = {}) =>
        set(
          (state) => {
            state.toast = {
              type, // "success" | "error"
              message,
              duration: options.duration || 5000,
              autoHide: options.autoHide !== false,
              isVisible: true,
            };
          },
          false,
          "SHOW_TOAST"
        ),

      showSuccessToast: (message, options = {}) =>
        set(
          (state) => {
            state.toast = {
              type: "success",
              message,
              duration: options.duration || 5000,
              autoHide: options.autoHide !== false,
              isVisible: true,
            };
          },
          false,
          "SHOW_SUCCESS_TOAST"
        ),

      showErrorToast: (message, options = {}) =>
        set(
          (state) => {
            state.toast = {
              type: "error",
              message,
              duration: options.duration || 5000,
              autoHide: options.autoHide !== false,
              isVisible: true,
            };
          },
          false,
          "SHOW_ERROR_TOAST"
        ),

      hideToast: () =>
        set(
          (state) => {
            if (state.toast) {
              state.toast.isVisible = false;
              // Полностью удаляем через небольшую задержку для анимации
              const currentStore = get();
              setTimeout(() => {
                set((state) => {
                  // Проверяем, что это все еще тот же тост
                  if (state.toast && !state.toast.isVisible) {
                    state.toast = null;
                  }
                });
              }, 300);
            }
          },
          false,
          "HIDE_TOAST"
        ),
    }))
  );
}

export const initializeStore = (preloadedState) => {
  // Всегда используем английский язык по умолчанию для предотвращения hydration ошибок
  // Язык будет обновлен на клиенте через useEffect в Layout
  const stateWithLang = {
    ...initialState,
    ...preloadedState,
    lang: "eng", // Всегда английский по умолчанию
  };

  let _store = store ?? initStore(stateWithLang);

  if (preloadedState && store) {
    _store = initStore({ ...store.getState(), ...preloadedState });
    store = undefined;
  }

  if (typeof window === "undefined") return _store;
  if (!store) store = _store;

  return _store;
};

export function useHydrate(initialState) {
  const state =
    typeof initialState === "string" ? JSON.parse(initialState) : initialState;
  return useMemo(() => initializeStore(state), [state]);
}
