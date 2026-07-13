import React from 'react';
import { createRoot } from 'react-dom/client';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

// 真·Shader Gradient 动态背景（官方组件；three.js / R3F / framer 已在构建时打包内联，运行时零 CDN）。
// 配色走清新透明水感：浅青白 / 清澈青蓝 / 纯白（去颗粒、降密度、柔和流动）。
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
        color1="#e0f7fa"
        color2="#26c6da"
        color3="#ffffff"
        type="waterPlane"
        grain="off"
        animate="on"
        uSpeed={0.25}
        uDensity={0.8}
        uStrength={2.0}
        uAmplitude={0}
        cAzimuthAngle={180}
        cDistance={4.4}
        cPolarAngle={70}
        lightType="3d"
        positionX={0}
        positionY={0.7}
        rotationZ={0}
        fov={45}
        reflection={0.05}
      />
    </ShaderGradientCanvas>
  );
}

const mount = document.getElementById('shader-bg');
if (mount) {
  createRoot(mount).render(<DynamicBackground />);
}
