/** Full-window, silent introductory montage; no dependencies or network services. */
export function createIntroCarousel({
  slides,
  duration = 6000,
  mount = document.body,
  background,
  onComplete = () => {},
} = {}) {
  if (!Array.isArray(slides) || slides.length === 0) {
    throw new TypeError('The intro needs at least one image.');
  }

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shell = document.createElement('section');
  shell.className = 'ba-intro';
  shell.setAttribute('role', 'dialog');
  shell.setAttribute('aria-modal', 'true');
  shell.setAttribute('aria-label', 'Battlefield Atlantis introduction');
  shell.innerHTML = `
    <header class="ba-intro__header">
      <button type="button" class="ba-intro__skip" data-action="finish">Skip intro <span aria-hidden="true">↗</span></button>
    </header>
    <div class="ba-intro__stage" aria-label="Intro scenes"></div>
    <p class="ba-intro__announcement ba-intro__sr" role="status" aria-live="polite"></p>
    <footer class="ba-intro__footer">
      <nav class="ba-intro__navigation" aria-label="Intro controls">
        <span class="ba-intro__count" aria-hidden="true"></span>
        <button type="button" class="ba-intro__icon" data-action="previous" aria-label="Previous scene">←</button>
        <div class="ba-intro__steps" aria-label="Choose a scene"></div>
        <button type="button" class="ba-intro__icon" data-action="next" aria-label="Next scene">→</button>
        <button type="button" class="ba-intro__play" data-action="pause"></button>
      </nav>
    </footer>`;

  const stage = shell.querySelector('.ba-intro__stage');
  const steps = shell.querySelector('.ba-intro__steps');
  const pauseButton = shell.querySelector('[data-action="pause"]');
  const previousButton = shell.querySelector('[data-action="previous"]');
  const nextButton = shell.querySelector('[data-action="next"]');
  const announcement = shell.querySelector('.ba-intro__announcement');
  let index = 0;
  let closed = false;
  let paused = motionPreference.matches;
  let reducedMotion = motionPreference.matches;
  let frameId = null;
  let elapsed = 0;
  let lastTick = null;
  let touchStart = null;
  let previousFocus = document.activeElement;
  const oldOverflow = document.documentElement.style.overflow;
  const inertTargets = background ? [background] : [...mount.children];
  const previousInert = inertTargets.map(element => [element, element.inert]);

  const records = slides.map((slide, slideIndex) => {
    const figure = document.createElement('figure');
    figure.className = 'ba-intro__scene';
    figure.setAttribute('aria-hidden', String(slideIndex !== 0));
    const image = document.createElement('img');
    image.className = 'ba-intro__image';
    image.alt = slide.alt || slide.label || `Scene ${slideIndex + 1}`;
    image.decoding = 'async';
    image.draggable = false;
    if (slideIndex === 0) image.fetchPriority = 'high';
    const error = document.createElement('div');
    error.className = 'ba-intro__image-error';
    error.hidden = true;
    error.innerHTML = '<p>This scene could not load.</p><p class="ba-intro__error-hint">Use the arrows to continue, or skip the intro.</p>';
    const step = document.createElement('button');
    step.type = 'button';
    step.className = 'ba-intro__step';
    step.setAttribute('aria-label', `Show scene ${slideIndex + 1}: ${slide.label || 'Battlefield Atlantis'}`);
    step.addEventListener('click', () => show(slideIndex, true));
    steps.append(step);
    figure.append(image, error);
    stage.append(figure);
    const record = { figure, image, error, step, slide, settled: false, failed: false };
    image.addEventListener('load', () => { record.settled = true; });
    image.addEventListener('error', () => {
      record.failed = true;
      record.settled = true;
      image.hidden = true;
      error.hidden = false;
      if (index === slideIndex) announcement.textContent = `Scene ${slideIndex + 1} could not load. You can continue or skip the intro.`;
    });
    image.src = slide.src;
    if (image.complete && image.naturalWidth > 0) record.settled = true;
    return record;
  });

  function render() {
    shell.classList.toggle('ba-intro--paused', paused);
    shell.classList.toggle('ba-intro--reduced-motion', reducedMotion);
    shell.querySelector('.ba-intro__count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    pauseButton.textContent = paused ? 'Play' : 'Pause';
    pauseButton.setAttribute('aria-label', paused ? 'Play intro' : 'Pause intro');
    previousButton.disabled = index === 0;
    nextButton.setAttribute('aria-label', index === slides.length - 1 ? 'Finish intro' : 'Next scene');
    nextButton.textContent = index === slides.length - 1 ? '↗' : '→';
    records.forEach((record, recordIndex) => {
      const active = recordIndex === index;
      record.figure.classList.toggle('is-active', active);
      record.figure.setAttribute('aria-hidden', String(!active));
      record.step.classList.toggle('is-active', active);
      record.step.setAttribute('aria-current', active ? 'step' : 'false');
      record.step.style.setProperty('--progress', recordIndex < index ? 1 : recordIndex > index ? 0 : elapsed / duration);
      if (active) record.figure.style.setProperty('--motion-progress', elapsed / duration);
    });
  }

  function show(nextIndex, announce = false) {
    if (closed) return;
    if (nextIndex >= slides.length) { finish(); return; }
    index = Math.max(0, nextIndex);
    elapsed = 0;
    lastTick = null;
    render();
    if (announce) announcement.textContent = `${index + 1} of ${slides.length}: ${slides[index].label || 'Battlefield Atlantis'}`;
  }

  function togglePause() {
    paused = !paused;
    lastTick = null;
    render();
  }

  function tick(timestamp) {
    if (closed) return;
    if (lastTick !== null && !paused && !document.hidden && records[index].settled) {
      elapsed += Math.min(timestamp - lastTick, 100);
      if (elapsed >= duration) show(index + 1);
    }
    lastTick = timestamp;
    if (!closed) {
      const progress = Math.min(elapsed / duration, 1);
      records[index].step.style.setProperty('--progress', progress);
      records[index].figure.style.setProperty('--motion-progress', progress);
      frameId = requestAnimationFrame(tick);
    }
  }

  function handleKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape') { event.preventDefault(); finish(); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1, true); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1, true); }
    else if (event.key === 'Home') { event.preventDefault(); show(0, true); }
    else if (event.key === 'End') { event.preventDefault(); show(slides.length - 1, true); }
    else if (event.code === 'Space' && event.target === shell) { event.preventDefault(); togglePause(); }
    else if (event.key === 'Tab') {
      const buttons = [...shell.querySelectorAll('button:not(:disabled)')];
      const first = buttons[0];
      const last = buttons.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === shell)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  }

  function handleMotion(event) {
    reducedMotion = event.matches;
    if (reducedMotion) paused = true;
    lastTick = null;
    render();
  }

  function finish({ notify = true } = {}) {
    if (closed) return;
    closed = true;
    cancelAnimationFrame(frameId);
    motionPreference.removeEventListener('change', handleMotion);
    document.documentElement.style.overflow = oldOverflow;
    previousInert.forEach(([element, wasInert]) => { element.inert = wasInert; });
    shell.remove();
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    if (notify) onComplete();
  }

  shell.addEventListener('click', event => {
    const action = event.target.closest('button[data-action]')?.dataset.action;
    if (action === 'finish') finish();
    if (action === 'previous') show(index - 1, true);
    if (action === 'next') show(index + 1, true);
    if (action === 'pause') togglePause();
  });
  shell.addEventListener('keydown', handleKey);
  stage.addEventListener('pointerdown', event => { touchStart = { x: event.clientX, y: event.clientY, id: event.pointerId }; });
  stage.addEventListener('pointerup', event => {
    if (!touchStart || touchStart.id !== event.pointerId) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1), true);
  });
  stage.addEventListener('pointercancel', () => { touchStart = null; });
  motionPreference.addEventListener('change', handleMotion);
  shell.tabIndex = -1;
  inertTargets.forEach(element => { element.inert = true; });
  document.documentElement.style.overflow = 'hidden';
  mount.append(shell);
  render();
  shell.focus({ preventScroll: true });
  frameId = requestAnimationFrame(tick);

  return { finish, destroy: () => finish({ notify: false }), show, togglePause, element: shell };
}
