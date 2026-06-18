/* global AFRAME, THREE */
/**
 * cloud-layer — an A-Frame component that paints a living, drifting sky over
 * the upper (sky) region of a tracked photo. Pure real-time WebGL: no video
 * file to host, no decoding hitch, and it scales to any screen.
 *
 * The shader replaces the flat photo sky with a soft gradient + animated
 * fractal-noise clouds, then fades to fully transparent at the horizon so the
 * real treeline / water in the photograph show through untouched.
 *
 * Schema:
 *   horizon  : v-coordinate (0=bottom,1=top of plane) of the treeline.
 *   soft     : height of the fade band above the horizon.
 *   speed    : wind speed multiplier.
 *   coverage : max opacity of the new sky in the sky region (0..1).
 */
AFRAME.registerComponent('cloud-layer', {
  schema: {
    horizon: { type: 'number', default: 0.58 },
    soft: { type: 'number', default: 0.1 },
    speed: { type: 'number', default: 1.0 },
    coverage: { type: 'number', default: 0.92 },
  },

  init: function () {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uHorizon;
      uniform float uSoft;
      uniform float uCoverage;
      uniform vec3 uSkyLow;    // sky colour near the horizon
      uniform vec3 uSkyHigh;   // sky colour at the top
      uniform vec3 uCloud;     // sunlit cloud highlight
      uniform vec3 uCloudDark; // cloud underside

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 6; i++) {
          v += amp * noise(p);
          p *= 2.0;
          amp *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = vUv;

        // Two cloud layers drifting at different speeds -> parallax/depth.
        vec2 p1 = vec2(uv.x * 3.0 + uTime * 0.012, uv.y * 2.2 + uTime * 0.002);
        vec2 p2 = vec2(uv.x * 6.5 - uTime * 0.022, uv.y * 4.5 + 7.3);
        float n = fbm(p1) * 0.62 + fbm(p2) * 0.38;

        // Shape the noise into soft cloud puffs.
        float density = smoothstep(0.50, 0.92, n);

        // Base sky gradient: paler near the horizon, deeper blue up high.
        float g = smoothstep(uHorizon, 1.0, uv.y);
        vec3 sky = mix(uSkyLow, uSkyHigh, g);

        // Clouds: dark underside blending up to a sunlit top.
        vec3 cloudCol = mix(uCloudDark, uCloud, smoothstep(0.45, 1.0, n));
        vec3 col = mix(sky, cloudCol, density);

        // Vertical masks: nothing below the horizon, gentle fade at the top.
        float horizonMask = smoothstep(uHorizon, uHorizon + uSoft, uv.y);
        float topMask = smoothstep(1.0, 0.90, uv.y);
        float alpha = horizonMask * topMask * uCoverage;

        gl_FragColor = vec4(col, alpha);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHorizon: { value: this.data.horizon },
        uSoft: { value: this.data.soft },
        uCoverage: { value: this.data.coverage },
        uSkyLow: { value: new THREE.Color(0.88, 0.88, 0.85) },
        uSkyHigh: { value: new THREE.Color(0.55, 0.71, 0.88) },
        uCloud: { value: new THREE.Color(0.99, 0.99, 0.98) },
        uCloudDark: { value: new THREE.Color(0.72, 0.75, 0.80) },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const apply = () => {
      const mesh = this.el.getObject3D('mesh');
      if (mesh) {
        mesh.material = this.material;
        return true;
      }
      return false;
    };
    if (!apply()) {
      this.el.addEventListener('object3dset', apply);
    }
  },

  tick: function (time) {
    if (this.material) {
      this.material.uniforms.uTime.value = (time / 1000) * this.data.speed;
    }
  },
});
