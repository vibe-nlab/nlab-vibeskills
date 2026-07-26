import React from "react";
import gsap from "gsap";
import { isString } from "lodash";

import ScrollContext from "contexts/ScrollContext";
import sc from "utils/stringToClass";
import uuid from "utils/uuid";

const useLocoTrigger = ({
  active = true,
  styles,
  trigger,
  triggers,
  fixed,
  animations = [],
  bottomOffset,
  onUpdate,
  onComplete,
  onReverseComplete,
  ...props
}) => {
  const scroll = React.useContext(ScrollContext);

  const data = React.useMemo(
    () => ({
      progress: 0,
      scrollId: null,
      scroll: null,
      direction: "vertical",
      trigger: null,
      update: null,
      timeline: null,
      animations: [],
    }),
    []
  );

  const handleProgress = React.useCallback((e) => {
    const element = e.currentElements[data.scrollId];

    if (data.trigger && fixed) {
      data.trigger.style.setProperty(
        "transform",
        `translate3d(0, ${e.scroll.y}px, 0)`
      );
    }

    if (e.scroll.y === 0) {
      data.timeline.progress(0);
    }

    if (element && data.timeline) {
      data.progress = element.progress;

      if (bottomOffset) {
        const coff = (element.bottom - e.scroll.y) / (element.bottom - element.top); //prettier-ignore
        data.progress = 1 - (coff - 1);
      }

      data.update && data.update(data.progress);
      data.timeline.progress(data.progress);
    }
  }, []);

  React.useEffect(() => {
    data.trigger = document.querySelector(sc(styles, trigger));
    data.direction = scroll?.direction;
    data.scrollId = data.trigger.dataset.scrollId;

    if (active) {
      scroll?.on("scroll", handleProgress);
    }

    return () => {
      scroll?.off("scroll", handleProgress);
    };
  }, [active, scroll, animations, handleProgress]);

  React.useLayoutEffect(() => {
    data.update = onUpdate;
    data.complete = onComplete;
    data.reverseComplete = onReverseComplete;
  }, [onUpdate, onComplete, onReverseComplete]);

  React.useEffect(() => {
    data.timeline = gsap.timeline({
      ...props,
      paused: true,
      onComplete: () => data.complete && data.complete(),
      onReverseComplete: () => data.reverseComplete && data.reverseComplete(),
    });

    data.timeline.progress(0);

    return () => {
      data.timeline.kill();
    };
  }, []);

  React.useEffect(() => {
    const q = gsap.utils.selector(data.trigger);

    for (let i = 0; i < animations.length; i++) {
      const animation = animations[i];
      let type = animation[0];
      let target = animation[1];
      let params = animation.slice(2);

      if (typeof type === "boolean") {
        if (type === false) continue;

        type = animation[1];
        target = animation[2];
        params = animation.slice(3);
      }

      if (target === "self") {
        target = data.trigger;
      }

      if (!target) continue;

      target = isString(target)
        ? q(sc(styles, target))
        : target?.current || target;

      data.timeline[type](target, ...params);
    }

    return () => {
      data.timeline.clear();
    };
  }, [animations]);
};

export default useLocoTrigger;
