import { animate, inView, stagger } from "motion";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeOut = [0.22, 1, 0.36, 1] as const;

const heroItems = Array.from(document.querySelectorAll<HTMLElement>("[data-motion='hero']"));
if (heroItems.length) {
  if (reduced) {
    for (const el of heroItems) el.style.opacity = "1";
  } else {
    animate(
      heroItems,
      { opacity: [0, 1], y: [14, 0] } as never,
      { duration: 0.55, delay: stagger(0.09), ease: easeOut },
    );
  }
}

const stage = document.querySelector<HTMLElement>("[data-motion='stage']");
if (stage) {
  if (reduced) {
    stage.style.opacity = "1";
  } else {
    animate(
      stage,
      { opacity: [0, 1], y: [20, 0] } as never,
      { duration: 0.7, delay: 0.28, ease: easeOut },
    );
  }
}

const glow = document.querySelector<HTMLElement>("[data-motion='glow']");
if (glow && !reduced) {
  animate(
    glow,
    { opacity: [0.35, 0.7, 0.35], scale: [1, 1.06, 1] } as never,
    { duration: 8, repeat: Infinity, ease: "easeInOut" },
  );
}

inView(
  "[data-motion='reveal']",
  (element) => {
    const el = element as HTMLElement;
    if (reduced) {
      el.style.opacity = "1";
      return;
    }
    animate(el, { opacity: [0, 1], y: [18, 0] } as never, {
      duration: 0.5,
      ease: easeOut,
    });
  },
  { amount: 0.2 },
);
