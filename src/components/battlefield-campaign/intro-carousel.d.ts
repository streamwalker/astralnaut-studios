export interface IntroSlide {
  src: string;
  label?: string;
  alt?: string;
}

export interface IntroOptions {
  slides: IntroSlide[];
  duration?: number;
  mount?: HTMLElement;
  background?: HTMLElement;
  onComplete?: () => void;
}

export interface IntroController {
  finish(options?: { notify?: boolean }): void;
  destroy(): void;
  show(index: number, announce?: boolean): void;
  togglePause(): void;
  element: HTMLElement;
}

export function createIntroCarousel(options: IntroOptions): IntroController;
