import { defaultSchema } from 'rehype-sanitize';

/**
 * rehype-sanitize schema that allows inline SVG (from our build-time diagram
 * converters) in addition to the default markdown allowlist.
 *
 * IMPORTANT: attribute names are HAST property names (camelCase), NOT HTML
 * attribute spellings. `stroke-width`/`xlink:href` literals are dropped by
 * hast-util-sanitize; use `strokeWidth`/`xLinkHref`.
 */
const SVG_TAG_NAMES = [
  'svg', 'g', 'defs', 'symbol', 'use', 'marker', 'clipPath', 'mask',
  'pattern', 'filter', 'linearGradient', 'radialGradient', 'stop',
  'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'image', 'foreignObject', 'text', 'tspan', 'textPath', 'title', 'desc', 'a',
];

// HAST property names. Broadened onto '*' so they apply wherever SVG uses them.
const SVG_ATTRIBUTES = [
  // core / styling
  'className', 'id', 'style', 'color', 'opacity',
  // coords / geometry
  'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'width', 'height', 'points', 'transform', 'viewBox', 'preserveAspectRatio',
  // fill / stroke
  'fill', 'fillOpacity', 'fillRule', 'clipRule',
  'stroke', 'strokeWidth', 'strokeDasharray', 'strokeLinecap', 'strokeLinejoin',
  'strokeMiterlimit', 'strokeOpacity',
  // text
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontStretch',
  'textAnchor', 'textDecoration', 'letterSpacing', 'wordSpacing',
  'dominantBaseline', 'alignmentBaseline', 'writingMode', 'direction',
  // gradients / markers / filters (subset)
  'gradientUnits', 'gradientTransform', 'spreadMethod', 'offset',
  'stopColor', 'stopOpacity', 'markerUnits', 'markerWidth', 'markerHeight',
  'refX', 'refY', 'orient', 'clipPath', 'mask', 'filter', 'patternUnits',
  'patternTransform', 'result', 'mode', 'in', 'in2', 'values', 'type',
  'stdDeviation', 'floodColor', 'floodOpacity',
  // namespaces + links (mermaid uses xlink)
  'xmlns', 'xmlnsXlink', 'xmlnsX', 'href', 'xLinkHref', 'target', 'rel',
  'role', 'ariaLabel', 'ariaHidden', 'ariaLabelledby', 'tabIndex', 'focusable',
];

export const svgSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), ...SVG_TAG_NAMES],
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    '*': [
      ...((defaultSchema.attributes ?? {})['*'] ?? []),
      ...SVG_ATTRIBUTES,
    ],
  },
  // allow class/id without the user-content- clobber prefix on svg
  clobber: [],
  clobberPrefix: '',
};
