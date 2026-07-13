import React, { useEffect, useRef, useState } from 'react';

// React Bits - BlurText（纯 React + CSS 忠实移植，零额外依赖）
// 按词/字母拆分文本，进入视口后错峰做 blur + translateY 揭示动画。
export default function BlurText({
  text = '',
  animateBy = 'words',
  direction = 'top',
  delay = 150,
  stepDuration = 0.7,
  startDelay = 0,
  threshold = 0.1,
  rootMargin = '0px',
  onAnimationComplete,
  className = '',
  style = {},
}) {
  const ref = useRef(null);
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [inView, setInView] = useState(reduce);

  const items = animateBy === 'letters' ? Array.from(text) : text.split(' ');
  const offset = direction === 'top' ? -1 : 1;

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin, reduce]);

  return (
    <span ref={ref} className={className} style={{ display: 'inline-block', ...style }}>
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            willChange: 'transform, filter, opacity',
            transform: inView ? 'translateY(0)' : `translateY(${offset * 16}px)`,
            filter: inView ? 'blur(0px)' : 'blur(6px)',
            opacity: inView ? 1 : 0,
            transition: reduce
              ? 'none'
              : `transform ${stepDuration}s ease, filter ${stepDuration}s ease, opacity ${stepDuration}s ease`,
            transitionDelay: reduce ? '0ms' : `${startDelay + i * delay}ms`,
            marginRight: animateBy === 'words' ? '0.3em' : '0',
          }}
        >
          {item}
        </span>
      ))}
    </span>
  );
}
