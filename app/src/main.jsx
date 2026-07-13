import React from 'react';
import { createRoot } from 'react-dom/client';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';
import BlurText from './BlurText.jsx';
import Magnet from './Magnet.jsx';

// 真·Shader Gradient 动态背景（官方组件；three.js / R3F / framer 已在构建时打包内联，运行时零 CDN）。
// 配色走水感青蓝：浅水青 / 湖蓝 / 近白青（去颗粒、保留飘荡流动）。
function DynamicBackground() {
  return (
    <ShaderGradientCanvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -2,
        pointerEvents: 'none',
      }}
    >
      <ShaderGradient
        control="props"
        color1="#80d4e6"
        color2="#0092b3"
        color3="#effbff"
        type="waterPlane"
        grain="off"
        animate="on"
        uSpeed={0.4}
        uDensity={1.2}
        uStrength={3.0}
        uAmplitude={0}
        cAzimuthAngle={180}
        cDistance={4.4}
        cPolarAngle={70}
        lightType="3d"
        positionX={0}
        positionY={0.7}
        rotationZ={0}
        fov={45}
        reflection={0.08}
      />
    </ShaderGradientCanvas>
  );
}

const mount = document.getElementById('shader-bg');
if (mount) {
  createRoot(mount).render(<DynamicBackground />);
}

// hero 主标题：React Bits BlurText 错峰模糊揭示（两行错峰）。
const titleMount = document.getElementById('hero-title-mount');
if (titleMount) {
  createRoot(titleMount).render(
    <>
      <BlurText text="让课堂更有趣" animateBy="words" direction="top" delay={120} stepDuration={0.7} startDelay={0} />
      <br />
      <BlurText text="让教学更高效" animateBy="words" direction="top" delay={120} stepDuration={0.7} startDelay={320} />
    </>
  );
}

// hero「免费下载」CTA：React Bits Magnet 磁吸悬浮（保留原锚点与图标）。
const ctaMount = document.getElementById('hero-cta-mount');
if (ctaMount) {
  createRoot(ctaMount).render(
    <Magnet magnetStrength={3} padding={30}>
      <a href="#download" className="primary-btn">
        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v11" />
          <path d="M8 10l4 4 4-4" />
          <path d="M4 19h16" />
        </svg>
        免费下载
      </a>
    </Magnet>
  );
}
