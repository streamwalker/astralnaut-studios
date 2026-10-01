import { useEffect, useRef } from 'react';
import { createIntroCarousel, type IntroSlide } from './intro-carousel.js';
import './intro-carousel.css';

/** Mount inside the selected route; use a stable slides array. */
export function BattlefieldIntro({
  slides,
  backgroundId,
  onComplete,
}: {
  slides: IntroSlide[];
  backgroundId?: string;
  onComplete?: () => void;
}) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const intro = createIntroCarousel({
      slides,
      background: backgroundId ? document.getElementById(backgroundId) ?? undefined : undefined,
      onComplete: () => onCompleteRef.current?.(),
    });
    return () => intro.destroy();
  }, [slides, backgroundId]);

  return null;
}
