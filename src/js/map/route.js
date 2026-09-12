function section() {
  const p = distance / TOTAL;
  return routeSections.find(s => p > s.from && p < s.to) || calmSection;
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
