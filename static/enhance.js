/**
 * Progressive enhancement only.
 *
 * Everything this file adds is optional: hover/focus tooltips and a line draw-in.
 * The chart, its labels, the toggle, and the data tables all work with this
 * script blocked or failed. That separation is deliberate, because it is what
 * lets the component be fully readable to a crawler that never runs scripts.
 *
 * Written as ES5 (var, IIFE) so it can be pasted into an unknown CMS without a
 * transpile step. Build-time code under src/ is modern ESM; this file is not.
 */

(function () {
  'use strict';

  if (document.documentElement.dataset.chartEnhanced) return;
  document.documentElement.dataset.chartEnhanced = 'true';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.card--chart').forEach(function (card) {
    setupTooltip(card);
    setupResponsiveAxis(card);
    if (!reduceMotion) animateLines(card);
  });

  /**
   * Progressive-enhancement responsiveness for the static SVG.
   *
   * The server-rendered chart is a fixed viewBox: with no JavaScript it fits the
   * column and, below its min-width, scrolls sideways. That keeps the whole chart
   * (and every label) in the crawler-visible HTML, but it cannot recompute its
   * own geometry the way the React variant can.
   *
   * What a few lines of vanilla JS *can* do is measure the rendered width and
   * thin the x-axis labels so they stop colliding, then drop the horizontal
   * scroll once the chart is wide enough to read without it. It cannot hold the
   * font size constant, because the text scales with the viewBox; that is the
   * ceiling on this approach and the reason the React build exists.
   */
  function setupResponsiveAxis(card) {
    var scroll = card.querySelector('.chart__scroll');
    var svg = card.querySelector('.chart__plot');
    if (!scroll || !svg) return;

    var labels = Array.prototype.slice.call(svg.querySelectorAll('.chart__xaxis text'));
    if (!labels.length) return;

    function apply() {
      var available = scroll.clientWidth;
      if (!available) return;

      // Below 640px the chart is too cramped to read unscrolled, so keep the
      // scroll fallback. Above it, let the chart shrink to fit the column.
      var fits = available >= 640;
      card.classList.toggle('card--chart-fit', fits);

      // One label per ~72px of the width the labels are actually drawn across.
      var drawnWidth = fits ? available : Math.max(available, svg.scrollWidth);
      var maxLabels = Math.max(2, Math.floor(drawnWidth / 72));
      var step = Math.ceil(labels.length / maxLabels);

      labels.forEach(function (label, i) {
        label.style.display = i % step === 0 ? '' : 'none';
      });
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(apply).observe(scroll);
    } else {
      window.addEventListener('resize', apply, { passive: true });
    }
    apply();
  }

  function setupTooltip(card) {
    var tooltip = document.createElement('div');
    tooltip.className = 'chart__tooltip';
    tooltip.setAttribute('role', 'presentation');

    var valueEl = document.createElement('strong');
    var unitText = document.createTextNode('');
    var metaEl = document.createElement('span');
    tooltip.appendChild(valueEl);
    tooltip.appendChild(unitText);
    tooltip.appendChild(document.createElement('br'));
    tooltip.appendChild(metaEl);
    card.appendChild(tooltip);

    var scroll = card.querySelector('.chart__scroll');
    var svg = card.querySelector('.chart__plot');
    var cardOrigin = null;
    var activeDot = null;

    card.querySelectorAll('.chart__dot').forEach(function (dot) {
      if (!dot.hasAttribute('tabindex')) dot.setAttribute('tabindex', '0');
    });

    function invalidateOrigin() {
      cardOrigin = null;
    }

    function getCardOrigin() {
      if (!cardOrigin) cardOrigin = card.getBoundingClientRect();
      return cardOrigin;
    }

    function showTooltip(dot) {
      var holiday = dot.dataset.holiday;
      valueEl.textContent = dot.dataset.value;
      unitText.textContent = ' ' + dot.dataset.unit;
      metaEl.textContent = dot.dataset.date + (holiday ? ' \u00b7 ' + holiday : '');

      var box = dot.getBoundingClientRect();
      var origin = getCardOrigin();
      tooltip.style.left = box.left + box.width / 2 - origin.left + 'px';
      tooltip.style.top = box.top - origin.top - 10 + 'px';
      tooltip.dataset.visible = 'true';

      if (activeDot && activeDot !== dot) delete activeDot.dataset.active;
      activeDot = dot;
      dot.dataset.active = 'true';
    }

    function hideTooltip(dot) {
      tooltip.dataset.visible = 'false';
      if (dot) delete dot.dataset.active;
      if (activeDot === dot) activeDot = null;
    }

    function targetDot(event) {
      var node = event.target;
      if (node && node.classList && node.classList.contains('chart__dot')) return node;
      return null;
    }

    if (svg) {
      svg.addEventListener('mouseover', function (event) {
        var dot = targetDot(event);
        if (dot) showTooltip(dot);
      });
      svg.addEventListener('mouseout', function (event) {
        var dot = targetDot(event);
        if (dot) hideTooltip(dot);
      });
      svg.addEventListener('focusin', function (event) {
        var dot = targetDot(event);
        if (dot) showTooltip(dot);
      });
      svg.addEventListener('focusout', function (event) {
        var dot = targetDot(event);
        if (dot) hideTooltip(dot);
      });
    }

    // The tooltip is positioned against the card, so a scroll would strand it.
    if (scroll) {
      scroll.addEventListener(
        'scroll',
        function () {
          invalidateOrigin();
          tooltip.dataset.visible = 'false';
          if (activeDot) {
            delete activeDot.dataset.active;
            activeDot = null;
          }
        },
        { passive: true },
      );
    }

    window.addEventListener('resize', invalidateOrigin, { passive: true });
  }

  function animateLines(card) {
    var lines = Array.prototype.slice.call(card.querySelectorAll('.chart__line'));
    if (!lines.length) return;

    var lengths = lines.map(function (line) {
      return line.getTotalLength();
    });

    lines.forEach(function (line, i) {
      line.style.strokeDasharray = lengths[i];
      line.style.strokeDashoffset = lengths[i];
    });

    // Flush layout once so the browser records the dashed starting state
    // before the transition to offset 0 begins. Without this, some engines
    // skip the draw-in and paint the finished line immediately.
    lines[0].getBoundingClientRect();

    requestAnimationFrame(function () {
      lines.forEach(function (line) {
        line.style.transition = 'stroke-dashoffset 900ms ease-out';
        line.style.strokeDashoffset = '0';
      });
    });
  }
})();
