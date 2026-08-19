/**
 * Progressive enhancement for the tactics ticker's play/pause control.
 *
 * WCAG 2.2 SC 2.2.2 (Pause, Stop, Hide): the marquee starts by itself, runs far
 * longer than five seconds and loops forever, so it has to come with a way to
 * stop it. Stopping it flips animation-play-state on the track, which leaves the
 * loop where the reader stopped it instead of jumping back to the start.
 *
 * The button is hidden by CSS until this file marks the ticker live, so a blocked
 * script leaves no control that does nothing, the way the carousel arrows work.
 * A reader who gets that far still has prefers-reduced-motion, which parks the
 * loop from CSS with no script involved.
 *
 * Written as ES5 (var, IIFE) so it can be pasted into an unknown CMS without a
 * transpile step, matching enhance.js and carousel.js.
 */

(function () {
  'use strict';

  var PAUSE_LABEL = 'Pause the scrolling banner';
  var PLAY_LABEL = 'Play the scrolling banner';

  /*
   * Someone who asked for less motion opens on a stopped loop and a Play button,
   * rather than being offered a Pause for something that is not moving.
   */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-tactics-ticker]').forEach(function (root) {
    setupTicker(root);
  });

  function setupTicker(root) {
    var toggle = root.querySelector('[data-tactics-ticker-toggle]');
    if (!toggle) return;

    root.classList.add('tactics__ticker--live');
    apply(!reduceMotion);

    toggle.addEventListener('click', function () {
      apply(root.dataset.tickerState !== 'playing');
    });

    /*
     * The animation, the glyph and the label all describe the same one thing, so
     * they are only ever written together. Which way round the button is lives in
     * the attributes rather than in a variable beside them, so there is nothing
     * for the three to drift out of step with.
     */
    function apply(playing) {
      root.dataset.tickerState = playing ? 'playing' : 'paused';
      toggle.dataset.state = playing ? 'playing' : 'paused';
      toggle.setAttribute('aria-label', playing ? PAUSE_LABEL : PLAY_LABEL);
    }
  }
})();
