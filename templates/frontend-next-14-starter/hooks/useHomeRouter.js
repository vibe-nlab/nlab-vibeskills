import React from "react";
import { useRouter } from "next/router";
import { delay } from "lodash";

import { TransitionContext } from "components/common/Transition";

import modelLoader from "utils/Loader/loaders/modelLoader";

import cache from "constants/cache";
import { maskRoutes } from "constants/routes";

const useHomeRouter = (
  scroll,
  animate,
  gallery,
  onSetMask,
  onSetGallery,
  onSetAnimate
) => {
  const router = useRouter();
  const { enterAnimation, exitAnimation } = React.useContext(TransitionContext);

  const loadModelByUrl = React.useCallback(
    (route) => {
      modelLoader(route.model).then(({ scene }) => {
        onSetGallery(false);
        onSetMask({ id: route.id, model: scene });
      });
    },
    [onSetGallery, onSetMask]
  );

  const loadModelFromCache = React.useCallback(
    (route, cacheModel) => {
      onSetGallery(false);
      onSetMask({ id: route.id, model: cacheModel.clone(true) });
    },
    [onSetGallery, onSetMask]
  );

  const handleBackToGallery = React.useCallback(() => {
    if (gallery) return;

    exitAnimation().then(() => {
      onSetGallery(true);
      onSetAnimate(true);
      onSetMask(null);

      scroll.scroll.instance.scroll.y = 0;
      scroll.scroll.instance.delta.y = 0;
      scroll.scroll?.update();

      delay(enterAnimation, 400);
    });
  }, [gallery, scroll, enterAnimation, exitAnimation]);

  React.useEffect(() => {
    return () => onSetMask(null);
  }, [onSetMask]);

  React.useLayoutEffect(() => {
    const route = maskRoutes[router.asPath];

    if (route) {
      onSetAnimate(false);
      const cacheModel = cache.models[route.model];

      try {
        if (cacheModel) {
          loadModelFromCache(route, cacheModel);
        } else {
          loadModelByUrl(route);
        }
      } catch (err) {
        loadModelByUrl(route);
      }
    }
  }, []);

  React.useEffect(() => {
    const handleRouteChange = (hash) => {
      const route = maskRoutes[hash];
      if (hash === "/") handleBackToGallery();

      if (hash !== "/" && gallery && route) {
        onSetAnimate(false);

        exitAnimation().then(() => {
          onSetGallery(false);

          scroll.scroll.instance.scroll.y = 0;
          scroll.scroll.instance.delta.y = 0;
          scroll.scroll.update();

          modelLoader(route.model).then(({ scene }) => {
            onSetMask({ id: route.id, model: scene });
            delay(enterAnimation, 400);
          });
        });
      }
    };

    router.events.on("hashChangeStart", handleRouteChange);

    return () => {
      router.events.off("hashChangeStart", handleRouteChange);
    };
  }, [gallery]);
};

export default useHomeRouter;
