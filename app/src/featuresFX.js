import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// 试点：仅作用于「功能亮点」(.features) 一段，背景/配色不动。
// 1) 进度联动：滚动穿过功能段时，进度条 0→100%
// 2) 视差：6 张卡片随滚动以不同速率轻微上移，制造层次
// 3) 滚动揭示：卡片随滚动逐张淡入上移（替代该段原有 IO reveal）
// 钉住(sticky)由 CSS 原生实现，零跳动。
export function initFeaturesFX() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const section = document.querySelector('.features');
  if (!section) return;

  const cards = section.querySelectorAll('.feature-card');
  const grid = section.querySelector('.features-grid');
  const bar = section.querySelector('.fx-progress > span');
  if (!cards.length) return;

  // 进度联动
  if (bar) {
    gsap.fromTo(bar,
      { width: '0%' },
      {
        width: '100%', ease: 'none',
        scrollTrigger: { trigger: section, start: 'top 80%', end: 'bottom top', scrub: true },
      });
  }

  // 滚动揭示（替代该段 reveal）
  gsap.fromTo(cards,
    { autoAlpha: 0, y: 44 },
    {
      autoAlpha: 1, y: 0, ease: 'power2.out', stagger: 0.08,
      scrollTrigger: { trigger: grid, start: 'top 82%', end: 'top 42%', scrub: true },
    });

  // 视差：整段滚动过程中卡片轻微上移，逐列错速制造纵深
  const speeds = [0, -4, -8, -4, -10, -6];
  cards.forEach((card, i) => {
    gsap.to(card, {
      yPercent: speeds[i % speeds.length], ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // 布局稳定后刷新一次（loader 淡出 / 字体加载可能影响测量）
  ScrollTrigger.refresh();
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
