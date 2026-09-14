function section() {
  const p = distance / TOTAL;
  const base = routeSections.find(s => p > s.from && p < s.to) || calmSection;
  const windIntensity = raceDay?.windIntensity ?? 1;
  const direction = raceDay?.windDirection || 'head';
  const directionEffect = {
    head: {head: 1, cross: 0, load: 1, label: 'VASTATUULI'},
    cross: {head: 0, cross: .55, load: .55, label: 'SIVUTUULI'},
    // A following wind helps, but much less than an equal headwind hurts.
    tail: {head: -.28, cross: .05, load: .25, label: 'MYÖTÄTUULI'}
  }[direction];
  if (!base.wind || windIntensity >= .15) return {
    ...base,
    name: base.name.replace('KOVA TUULI', directionEffect.label),
    speedLoss: base.speedLoss * windIntensity * directionEffect.head,
    windHead: base.speedLoss * windIntensity * directionEffect.head,
    windCross: base.speedLoss * windIntensity * directionEffect.cross,
    windLoad: directionEffect.load,
    sweat: base.sweat * (.9 + .1 * windIntensity) * (.94 + .06 * directionEffect.load)
  };
  return {...base, name: base.name.replace('KOVA TUULI', 'PLÄKKITYYNI'), speedLoss: 0, wind: 0};
}
function pointOnRoute(progress, w, h) {
  const ls = [];
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    const dx = (route[i][0] - route[i - 1][0]) * w,
      dy = (route[i][1] - route[i - 1][1]) * h,
      l = Math.hypot(dx, dy);
    ls.push(l);
    total += l;
  }
  let target = progress * total;
  for (let i = 0; i < ls.length; i++) {
    if (target <= ls[i]) {
      const t = target / ls[i],
        a = route[i],
        b = route[i + 1];
      return {
        x: (a[0] + (b[0] - a[0]) * t) * w,
        y: (a[1] + (b[1] - a[1]) * t) * h,
        angle: Math.atan2((b[1] - a[1]) * h, (b[0] - a[0]) * w)
      };
    }
    target -= ls[i];
  }
  const p = route.at(-1);
  return {
    x: p[0] * w,
    y: p[1] * h,
    angle: 0
  };
}
const routePixels = route.slice(1).reduce((sum, p, i) => sum + Math.hypot((p[0] - route[i][0]) * 805, (p[1] - route[i][1]) * 851), 0);
