/**
 * Lazy-loaded framer-motion feature bundles. Passing a loader function (rather
 * than the feature object itself) to <LazyMotion features={...}> makes webpack
 * split the animation engine into its own chunk, fetched after first paint
 * instead of blocking it.
 */
import type { FeatureBundle } from "framer-motion";

export const loadDomAnimation = (): Promise<FeatureBundle> =>
  import("framer-motion").then((mod) => mod.domAnimation);

export const loadDomMax = (): Promise<FeatureBundle> =>
  import("framer-motion").then((mod) => mod.domMax);
