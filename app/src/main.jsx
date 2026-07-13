import React from 'react';
import { createRoot } from 'react-dom/client';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

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
