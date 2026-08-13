/** Figma nodes 369:8705 (section), 369:8732, 564:20950 and 564:20949 (slides). */

import { html } from '../lib/html.mjs';

/**
 * Editorial copy lifted from the Holiday Lookback Report, kept next to the
 * markup the same way ARTICLE in lib/layout.mjs is.
 */
export const TACTICS = {
  heading: 'Steal the best tactics most brands last year skipped',
  intro:
    'A handful of features made an outsized difference in performance last peak ' +
    'season, and most last year didn’t use them.',
  leadIn: 'Try these before your next send:',
  items: [
    html`Test
      <a href="https://mailchimp.com/solutions/ai-tools/" target="_blank" rel="noopener noreferrer"
        >generative AI</a
      >
      on your BFCM sends, including integrations with third-party LLMs like ChatGPT, Claude, and
      Gemini, to speed up time to market.`,
    html`Turn on abandoned cart and automation blocks to lift open and click rate without extra
      manual work.`,
    html`Segment and personalize when you can. Most brands are still sending one-size-fits-all
      campaigns, even though targeting drove meaningful lift in average order value during BFCM.`,
  ],
  /**
   * One entry per carousel slide. `crop` is the object-position that reproduces
   * the crop each photo carries in Figma, since the frames there are cropped
   * fills rather than whole images.
   */
  slides: [
    {
      photo: {
        src: 'img/tactics-photo.jpg',
        alt: 'Two marketers reviewing an email campaign in Mailchimp on a laptop.',
        crop: '52% 43%',
      },
      eyebrow: 'Emails using generative AI during BFCM had:',
      stat: '26% more revenue per send',
    },
    {
      photo: {
        src: 'img/tactics-photo-2.jpg',
        alt: 'A marketer at her desk in an open-plan office, looking up from her computer.',
        crop: '53% 41%',
      },
      eyebrow: 'Emails using generative AI during BFCM had:',
      stat: '38% higher average order rate',
    },
    {
      photo: {
        src: 'img/tactics-photo-3.jpg',
        alt: 'Two colleagues laughing while going over a campaign on a laptop together.',
        crop: '37% 34%',
      },
      eyebrow: 'Emails using generative AI during BFCM had:',
      stat: '43% higher average conversion rates',
    },
  ],
};

export function tacticsSection({ content = TACTICS, id = 'tactics' } = {}) {
  const headingId = `${id}-heading`;
  const { slides } = content;

  return html`<section class="tactics" id="${id}" aria-labelledby="${headingId}">
    <div class="tactics__panel">
      <div class="tactics__content">
        <h2 class="tactics__heading" id="${headingId}">${content.heading}</h2>

        <div class="tactics__intro">
          <p>${content.intro}</p>
          <p class="tactics__lead-in">${content.leadIn}</p>
        </div>

        <ul class="tactics__list">
          ${content.items.map(
            (item) => html`<li class="tactics__item">
              <img class="tactics__check" src="img/check-circle.svg" alt="" width="28" height="28" />
              <p class="tactics__item-text">${item}</p>
            </li>`,
          )}
        </ul>
      </div>
    </div>

    <!--
      Every slide ships in the markup and the first one is marked active here, so
      with scripts blocked this renders as the static callout the report falls
      back to. carousel.js takes over from that state; the arrows stay hidden
      until it does, rather than sitting there as controls that do nothing.
    -->
    <div
      class="tactics__media"
      data-tactics-carousel
      role="group"
      aria-roledescription="carousel"
      aria-label="Generative AI performance during BFCM"
    >
      <div class="tactics__figure">
        ${slides.map(
          (slide, index) => html`<div
            class="tactics__photo"
            data-slide="${index}"
            data-active="${index === 0 ? 'true' : 'false'}"
            style="--tactics-crop: ${slide.photo.crop}"
          >
            <img src="${slide.photo.src}" alt="${slide.photo.alt}" width="680" height="436" />
          </div>`,
        )}
      </div>

      <div class="tactics__callout">
        <div class="tactics__callout-inner">
          <div class="tactics__stats" aria-live="polite">
            ${slides.map(
              // Explicit strings: the html tag renders a false value as "".
              (slide, index) => html`<div
                class="tactics__slide-text"
                data-slide="${index}"
                data-active="${index === 0 ? 'true' : 'false'}"
              >
                <p class="tactics__eyebrow">${slide.eyebrow}</p>
                <p class="tactics__stat">${slide.stat}</p>
              </div>`,
            )}
          </div>

          <div class="tactics__arrows">
            <button
              class="tactics__arrow tactics__arrow--prev"
              type="button"
              data-tactics-prev
              aria-label="Previous stat"
            >
              <img src="img/arrow-circle.svg" alt="" width="43" height="43" />
            </button>
            <button class="tactics__arrow" type="button" data-tactics-next aria-label="Next stat">
              <img src="img/arrow-circle-filled.svg" alt="" width="43" height="43" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}
