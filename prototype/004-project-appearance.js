(function (root) {
  'use strict';
  // Stable keys are project data; all display shades are derived here.
  const palette = Object.freeze({
    violet: ['#7771D6', '#F1F0FF'], blue: ['#4F6BED', '#EEF2FF'],
    teal: ['#12A38F', '#E9F8F5'], sky: ['#2F86C7', '#EAF6FC'],
    amber: ['#D98B18', '#FFF6E5'], coral: ['#E16B5A', '#FFF0ED'],
    purple: ['#8066C9', '#F2EEFF'], rose: ['#C6537A', '#FCEEF3'],
    olive: ['#718C42', '#F2F6E9']
  });
  const keys = Object.keys(palette);
  function keyFor(project = {}) {
    if (Object.hasOwn(palette, project.colorKey)) return project.colorKey;
    const legacy = keys.find(key => palette[key][0].toLowerCase() === String(project.color || '').toLowerCase());
    if (legacy) return legacy;
    let hash = 0;
    for (const char of String(project.id || 'project')) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
    return keys[hash % keys.length];
  }
  function mix(color, target, weight) {
    return '#' + [1, 3, 5].map(i => Math.round(parseInt(color.slice(i, i + 2), 16) * weight + target * (1 - weight)).toString(16).padStart(2, '0')).join('');
  }
  function get(project, theme = 'light') {
    const colorKey = keyFor(project), [base, surface] = palette[colorKey];
    const dark = theme === 'dark';
    return {colorKey, accent: dark ? mix(base, 255, .65) : base,
      surface: dark ? mix(base, 24, .18) : surface,
      border: dark ? mix(base, 24, .55) : mix(base, 255, .38)};
  }
  function normalize(project) {
    const {color, colorBg, lockedGroups, ...data} = project;
    return {...data, colorKey: keyFor(project)};
  }
  function view(project) {
    const data = normalize(project), tone = get(data);
    return {...data, color: tone.accent, colorBg: tone.surface};
  }
  function css(project) {
    const tone = get(project), dark = get(project, 'dark');
    return {accent: `light-dark(${tone.accent}, ${dark.accent})`, surface: `light-dark(${tone.surface}, ${dark.surface})`, border: `light-dark(${tone.border}, ${dark.border})`};
  }
  root.EvaProjectAppearance = Object.freeze({keyFor, get, normalize, view, css});
})(window);
