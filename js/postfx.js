/**
 * 星尘遗迹 / Aether Ruins — post-processing (gentle bloom + soft vignette)
 *
 * Preferred: three@0.160 EffectComposer + RenderPass + UnrealBloomPass + ShaderPass
 * Fallback: plain renderer.render (pair with CSS vignette overlay — see INTEGRATION.md)
 *
 * Standalone module — does not edit world.js / materials.js.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/** Soft radial vignette — mild edge falloff, cool night tint */
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 0.72 },
    darkness: { value: 0.42 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform float darkness;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - 0.5) * 2.0;
      float dist = dot(uv, uv);
      float vig = smoothstep(offset, offset - 0.55, dist);
      float factor = mix(1.0 - darkness, 1.0, vig);
      vec3 edgeTint = vec3(0.02, 0.05, 0.09);
      vec3 lit = texel.rgb * factor;
      vec3 color = mix(lit, mix(lit, edgeTint, 0.12 * darkness), 1.0 - vig);
      gl_FragColor = vec4(color, texel.a);
    }
  `,
};

/**
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @returns {{
 *   render: () => void,
 *   setSize: (w: number, h: number) => void,
 *   enabled: boolean,
 *   mode: string,
 *   setBloom: (opts: object) => void,
 *   setVignette: (opts: object) => void,
 *   setPortalBloom: (power: number) => void,
 * }}
 */
export function createPostFX(renderer, scene, camera) {
  // Layer-4 polish: slightly fuller lantern/portal bloom; still ACES-safe
  const BLOOM = { strength: 0.32, radius: 0.50, threshold: 0.78 };
  const VIGNETTE = { darkness: 0.40, offset: 0.74 };

  let composer = null;
  let bloomPass = null;
  let vignettePass = null;
  let mode = 'fallback';

  try {
    const size = new THREE.Vector2();
    renderer.getSize(size);
    const pr = Math.min(typeof renderer.getPixelRatio === 'function' ? renderer.getPixelRatio() : 1, 2);

    composer = new EffectComposer(renderer);
    composer.setPixelRatio(pr);
    composer.setSize(size.x || 1, size.y || 1);

    composer.addPass(new RenderPass(scene, camera));

    const res = new THREE.Vector2(
      Math.max(1, Math.floor((size.x || 1) * pr)),
      Math.max(1, Math.floor((size.y || 1) * pr))
    );
    bloomPass = new UnrealBloomPass(res, BLOOM.strength, BLOOM.radius, BLOOM.threshold);
    composer.addPass(bloomPass);

    vignettePass = new ShaderPass(VignetteShader);
    vignettePass.uniforms.darkness.value = VIGNETTE.darkness;
    vignettePass.uniforms.offset.value = VIGNETTE.offset;
    vignettePass.renderToScreen = true;
    composer.addPass(vignettePass);

    mode = 'composer';
  } catch (err) {
    console.warn('[postfx] EffectComposer unavailable — falling back to renderer.render()', err);
    composer = null;
    bloomPass = null;
    vignettePass = null;
    mode = 'fallback';
  }

  function render() {
    if (composer && mode === 'composer') {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  function setSize(w, h) {
    if (composer) {
      composer.setSize(w, h);
      if (bloomPass) {
        const pr = Math.min(typeof renderer.getPixelRatio === 'function' ? renderer.getPixelRatio() : 1, 2);
        bloomPass.resolution.set(
          Math.max(1, Math.floor(w * pr)),
          Math.max(1, Math.floor(h * pr))
        );
      }
    }
  }

  /**
   * Map portal power (0..1) → bloom surge near climax.
   * Does not change world.setPortalPower API — call from index after setPortalPower.
   */
  function setPortalBloom(power) {
    if (!bloomPass) return;
    const p = Math.max(0, Math.min(1, Number(power) || 0));
    const surge = Math.max(0, (p - 0.55) / 0.45); // 0 below 0.55, 1 at full
    const s2 = surge * surge;
    bloomPass.strength = BLOOM.strength + s2 * 0.26; // ~0.32 → 0.58
    bloomPass.radius = BLOOM.radius + s2 * 0.22;
    bloomPass.threshold = Math.max(0.55, BLOOM.threshold - s2 * 0.14);
  }

  return {
    render,
    setSize,
    get enabled() {
      return mode === 'composer';
    },
    get mode() {
      return mode;
    },
    setBloom(opts = {}) {
      if (!bloomPass) return;
      if (opts.strength != null) bloomPass.strength = opts.strength;
      if (opts.radius != null) bloomPass.radius = opts.radius;
      if (opts.threshold != null) bloomPass.threshold = opts.threshold;
    },
    setVignette(opts = {}) {
      if (!vignettePass) return;
      if (opts.darkness != null) vignettePass.uniforms.darkness.value = opts.darkness;
      if (opts.offset != null) vignettePass.uniforms.offset.value = opts.offset;
    },
    setPortalBloom,
    /** Base bloom knobs (for reset / debug) */
    BLOOM,
    VIGNETTE,
  };
}
