(function (root, factory) {
  var catalogue = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = catalogue;
  } else {
    root.AEUS_SAMPLE_CATALOGUE = catalogue;
  }
}(this, function () {
  return [
    { id: 'preset-camera-shake', name: 'Camera Shake', type: 'preset', source: 'Sample presets', aliases: ['shake', 'handheld', 'camera movement'], tags: ['motion', 'camera'] },
    { id: 'preset-shake-pro', name: 'Shake Pro', type: 'preset', source: 'Sample presets', aliases: ['camera shake', 'handheld'], tags: ['motion'] },
    { id: 'preset-zoom-in', name: 'Zoom In', type: 'preset', source: 'Sample presets', aliases: ['push in', 'camera move'], tags: ['scale', 'motion'] },
    { id: 'preset-zoom-smooth', name: 'Smooth Zoom', type: 'preset', source: 'Sample presets', aliases: ['zoom', 'push'], tags: ['scale', 'motion'] },
    { id: 'preset-soft-focus', name: 'Soft Focus', type: 'preset', source: 'Sample presets', aliases: ['diffusion'], tags: ['glow', 'dreamy'] },
    { id: 'preset-camera-push', name: 'Camera Push', type: 'preset', source: 'Sample presets', aliases: ['zoom in', 'dolly'], tags: ['camera movement', 'motion'] }
  ];
}));
