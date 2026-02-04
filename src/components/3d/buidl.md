# Visual Manifesto: Lando Norris 100% Match

The goal is to achieve an indistinguishable visual duplicate of [landonorris.com](https://landonorris.com/). This requires moving beyond simple patterns into a **Physical Fluid Display**.

## 1. Visual Pillars (The "Soul")

### Pillar A: Pressure-Based Fluid Displacement
The cursor must feel like it's "pressing" into a gel. 
- **The Look**: Lines should bulge, swirl, and ripple with inertia.
- **The Tech**: Use a high-viscosity GPGPU fluid simulation (`FluidSimulation.tsx`).
- **Optimization**: Use `HalfFloatType` textures for silky smooth displacement without stepping.

### Pillar B: Organic "Clump" & Film Grain
The background is not sterile; it has "grit."
- **The Look**: Sublte mottled shading (clumpy noise) and fine film grain.
- **The Tech**: Layer a secondary low-frequency simplex noise in the `BackgroundMaterial` and add a `Noise` pass from `postprocessing` for the grain.

### Pillar C: "Technical Drawing" Line Quality
Lines must stay hairline-thin regardless of how hard the fluid is swirling.
- **The Look**: Constant-width, slightly aliased 1px lines.
- **The Tech**: Use the neighbor-sampling "Sawtooth" method. It is the only way to maintain line thickness under heavy non-linear distortion.

### Pillar D: Earthy High-Contrast Palette
- **Light Theme**: #F8F8F3 (Bone)
- **Dark Theme**: #1A1D18 (Asphalt Green)
- **Ring Stroke**: #CBCBB9 (Muted Bronze)
- **Highlight**: #D5F500 (Lando Lime - for hotspots)

---

## 2. Updated Proposed Changes

### [BackgroundMaterial.tsx](file:///Users/bikashmarandi/iCloud%20Drive%20%28Archive%29/Documents/Development/Projects/Portfolio%20dev/landonorris-next/src/components/3d/shaders/BackgroundMaterial.tsx) [MODIFY]
- **Internal Clump**: Add a very subtle secondary noise layer to the background color calculation to simulate the "clumpy" look.
- **Hotspot Glow**: Implement a radial glow centered on the cursor's velocity field.

### [FluidSimulation.tsx](file:///Users/bikashmarandi/iCloud%20Drive%20%28Archive%29/Documents/Development/Projects/Portfolio%20dev/landonorris-next/src/components/3d/FluidSimulation.tsx) [MODIFY]
- **Viscosity**: Increase Jacobi iterations to 30 for more accurate pressure solving.
- **Persistence**: Fine-tune `dissipation` to exactly match the site's trailing behavior.

### [PostProcessing Stack] [NEW]
- Introduce a Grain/Noise pass to give the final output the "premium film" feel.

---

## 3. Verification Plan
- **"The Press Test"**: Move cursor rapidly. Do lines swirl and settle with a "gel-like" delay?
- **"The Grain Test"**: Look closely at the background in a dark room. Is there a subtle organic "vibration" (grain)?
- **"The Color Test"**: Hex-match against the live site screenshots.
