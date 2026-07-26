import React from "react";
import gsap from "gsap";
import { isString } from "lodash";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

import sc from "utils/stringToClass";

gsap.registerPlugin(ScrollTrigger);

const useScrollTrigger = ({
  active,
  styles,
  trigger,
  scroller,
  animations = [],
  onUpdate,
  onComplete,
  onReverseComplete,
  ...props
}) => {
  const data = React.useMemo(
    () => ({
      update: null,
      timeline: null,
      animations: [],
    }),
    []
  );

  React.useLayoutEffect(() => {
    data.animations = animations;
  }, [animations]);

  React.useLayoutEffect(() => {
    data.update = onUpdate;
    data.complete = onComplete;
    data.reverseComplete = onReverseComplete;
  }, [onUpdate]);

  React.useEffect(() => {
    data.timeline = gsap.timeline({
      scrollTrigger: {
        trigger: isString(trigger) ? sc(styles, trigger) : trigger.current,
        scroller: scroller || "body",
        onUpdate: (self) => data.update && data.update(self),
        onComplete: (self) => data.complete && data.complete(self),
        onReverseComplete: (self) => data.reverseComplete && data.reverseComplete(self), //prettier-ignore
        invalidateOnRefresh: true,
        ...props,
      },
    });

    return () => {
      data.timeline.scrollTrigger.kill(true);
      data.timeline.kill();
      data.timeline = null;
    };
  }, []);

  React.useEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(data.timeline.scrollTrigger.trigger);

      for (let i = 0; i < data.animations.length; i++) {
        const animation = data.animations[i];
        let type = animation[0];
        let target = animation[1];
        let params = animation.slice(2);

        if (!target) continue;

        target = isString(target)
          ? q(sc(styles, animation[1]))
          : target?.current || target;

        data.timeline[type](target, ...params);
      }

      ScrollTrigger.refresh(true);
    });

    return () => {
      ctx.revert();
    };
  }, [data.animations]);

  React.useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      ScrollTrigger.refresh(true);
    });

    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.unobserve(document.body);
      resizeObserver.disconnect();
    };
  }, [scroller]);
};

export default useScrollTrigger;
