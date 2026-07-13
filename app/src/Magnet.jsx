import React, { useRef } from 'react';

// React Bits - Magnet（纯 React + 鼠标事件忠实移植，零额外依赖）
// wrapper 检测鼠标在 padding 范围内的位移，inner 元素按 magnetStrength 反向偏移产生磁吸感。
export default function Magnet({
  children,
  padding = 30,
  disabled = false,
  magnetStrength = 3,
  activeTransition = 'transform 0.25s ease-out',
  inactiveTransition = 'transform 0.5s ease-in-out',
  wrapperClassName = '',
  innerClassName = '',
}) {
  const wrapRef = useRef(null);
  const innerRef = useRef(null);

  const handleMove = (e) => {
    if (disabled) return;
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    inner.style.transform = `translate(${x / magnetStrength}px, ${y / magnetStrength}px)`;
    inner.style.transition = activeTransition;
  };

  const handleLeave = () => {
    const inner = innerRef.current;
    if (!inner) return;
    inner.style.transform = 'translate(0px, 0px)';
    inner.style.transition = inactiveTransition;
  };

  return (
    <div
      ref={wrapRef}
      className={wrapperClassName}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ display: 'inline-flex', padding }}
    >
      <div ref={innerRef} className={innerClassName} style={{ display: 'inline-flex' }}>
        {children}
      </div>
    </div>
  );
}
