import React from 'react';
import { createRoot } from 'react-dom/client';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

// 真·Shader Gradient 动态背景（官方组件；three.js / R3F / framer 已在构建时打包内联，运行时零 CDN）。
// 配色沿用 TeachSack 调性：珊瑚 / 板岩灰 / 冷白。
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
        color1="#ff7a4d"
        color2="#5c6470"
        color3="#fafafb"
        type="sphere"
        grain="on"
        animate="on"
        uSpeed={0.4}
        uDensity={1.2}
        uStrength={3.0}
        cAzimuthAngle={180}
        cDistance={3.4}
        cPolarAngle={95}
        lightType="3d"
        positionX={-0.4}
        positionY={0.1}
        rotationZ={20}
        fov={42}
        reflection={0.1}
      />
    </ShaderGradientCanvas>
  );
}

const mount = document.getElementById('shader-bg');
if (mount) {
  createRoot(mount).render(<DynamicBackground />);
}
