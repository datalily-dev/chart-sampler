/**
 * Progressive enhancement for the tactics callout carousel.
 *
 * Every slide is already in the HTML with the first one marked active, so with
 * this file blocked or failed the section renders as the single static callout
 * the report falls back to, and all three stats stay readable to a crawler that
 * never runs scripts. The arrows are hidden by CSS until this script marks the
 * carousel live, so no-JS never gets controls that do nothing.
 *
 * Written as ES5 (var, IIFE) so it can be pasted into an unknown CMS without a
 * transpile step, matching enhance.js.
 */

(function () {
  'use strict';

  var ACTIVE = 'true';
  var INACTIVE = 'false';
  var ENTERING = 'tactics__photo--entering';
  var LEAVING = 'tactics__photo--leaving';
  var TEXT_ENTERING = 'tactics__slide-text--entering';

  /*
   * Added to the incoming photo's slide duration before the outgoing one is
   * dropped. The duration is read off the running animation rather than repeated
   * here, so retiming --tactics-slide-ms in components.css needs no change to
   * this file. Used on its own only if the browser has no getAnimations.
   */
  var SETTLE_MS = 120;
  var FALLBACK_SLIDE_MS = 1400;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-tactics-carousel]').forEach(function (root) {
    setupCarousel(root);
  });

  function setupCarousel(root) {
    var photos = root.querySelectorAll('.tactics__photo');
    var texts = root.querySelectorAll('.tactics__slide-text');
    var previous = root.querySelector('[data-tactics-prev]');
    var next = root.querySelector('[data-tactics-next]');

    if (photos.length < 2 || !previous || !next) return;

    var index = 0;
    // The single pending hold timer, so a superseded one can be cancelled.
    var hold = null;

    root.classList.add('tactics__media--live');

    previous.addEventListener('click', function () {
      go(-1);
    });

    next.addEventListener('click', function () {
      go(1);
    });

    /*
     * Left and right arrows on the carousel itself. The buttons already answer
     * to Enter and Space as native buttons; this only adds the arrow keys a
     * carousel is expected to respond to once focus is inside it.
     */
    root.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') {
        go(-1);
        previous.focus();
      } else if (event.key === 'ArrowRight') {
        go(1);
        next.focus();
      }
    });

    function go(direction) {
      var from = index;
      // Wraps, so neither arrow is ever a dead end.
      index = (index + direction + photos.length) % photos.length;
      if (index !== from) show(index, from, direction);
    }

    function show(target, from, direction) {
      for (var i = 0; i < photos.length; i += 1) {
        var isTarget = i === target;
        photos[i].dataset.active = isTarget ? ACTIVE : INACTIVE;
        texts[i].dataset.active = isTarget ? ACTIVE : INACTIVE;
      }

      if (reduceMotion) return;

      var incoming = photos[target];
      var outgoing = photos[from];
      var text = texts[target];

      // Forward brings the new photo in from the right, back from the left.
      incoming.style.setProperty('--tactics-from', direction > 0 ? '100%' : '-100%');

      /*
       * Restarting an animation means taking the class off, forcing a reflow, and
       * putting it back: re-adding a class that is already there does not replay
       * it. One reflow covers every class touched before it.
       */
      incoming.classList.remove(ENTERING, LEAVING);
      outgoing.classList.remove(ENTERING, LEAVING);
      text.classList.remove(TEXT_ENTERING);
      void incoming.offsetWidth;

      incoming.classList.add(ENTERING);
      text.classList.add(TEXT_ENTERING);
      keepUntilDone(outgoing, slideDuration(incoming));
    }

    /*
     * How long the incoming photo's travel lasts, straight from the animation the
     * class just started. Only the photo's own animation is on this element; the
     * zoom belongs to the img inside it and does not move the frame.
     */
    function slideDuration(photo) {
      if (!photo.getAnimations) return FALLBACK_SLIDE_MS;
      var running = photo.getAnimations();
      if (!running.length) return FALLBACK_SLIDE_MS;
      return running[0].effect.getTiming().duration;
    }

    /*
     * The outgoing photo has no animation of its own to wait on, so a timer holds
     * it until the incoming one has finished travelling. Waiting out the whole
     * slide rather than the moment coverage is reached costs nothing — the photo
     * is hidden underneath the incoming one well before then — and it avoids
     * pinning this to a fraction of an easing curve.
     *
     * Exactly one photo is ever held. Losing the entering class snaps the
     * outgoing photo back to its resting position, so it alone covers the ground
     * the incoming one has not travelled over yet, and any photo left over from
     * an earlier click is redundant.
     *
     * Cancelling the previous timer is what makes clicking faster than the slide
     * safe. Each timer only knows the photo it was given, so a stale one would
     * come due mid-slide and drop the photo doing the covering, opening a gap on
     * to whatever was behind it.
     */
    function keepUntilDone(photo, slideMs) {
      window.clearTimeout(hold);

      for (var i = 0; i < photos.length; i += 1) {
        if (photos[i] !== photo) photos[i].classList.remove(LEAVING);
      }

      photo.classList.add(LEAVING);

      hold = window.setTimeout(function () {
        photo.classList.remove(LEAVING);
      }, slideMs + SETTLE_MS);
    }
  }
})();
