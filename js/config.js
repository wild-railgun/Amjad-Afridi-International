/**
 * config.js — ONE place to edit Amjad Afridi's details for this site.
 *
 * Every value below is shown on the pages wherever an element has a matching
 * data-config / data-config-href / data-config-count attribute (see main.js).
 * The HTML also contains these same defaults, so pages still read correctly with
 * JavaScript off — if you change a value here, it updates everywhere on screen.
 *
 * !! Everything marked SAMPLE is placeholder content, not verified facts about
 * !! Amjad. Replace it with his real details before publishing (see README.md).
 */
window.SITE_CONFIG = {
  name: 'Amjad Afridi',
  tagline: 'Editorial, campaign & runway model',
  cities: 'New York · Milan · London · Dubai',            // SAMPLE — cities he books in

  // Contact — SAMPLE placeholders
  email: 'bookings@amjadafridi.example',
  phone: '+1 212 555 0147',
  links: {
    email: 'mailto:bookings@amjadafridi.example',
    phone: 'tel:+12125550147',
    instagram: '#',                                        // e.g. https://instagram.com/<handle>
    tiktok: '#',
  },

  // Agencies — SAMPLE placeholders (do not list agencies he is not signed with)
  agencies: {
    newYork: 'Agency name — New York',
    milan: 'Agency name — Milan',
    london: 'Agency name — London',
  },

  // Home page stats strip — SAMPLE figures
  stats: { years: 6, shoots: 120, brands: 30, countries: 8 },

  // About page comp card — SAMPLE measurements (replace from his real comp card)
  measurements: {
    height: '185 cm / 6\'1"',
    chest: '97 cm / 38"',
    waist: '79 cm / 31"',
    inseam: '84 cm / 33"',
    suit: '40 L / 50 EU',
    shoe: '43 EU / 9.5 UK',
    hair: 'Dark brown',
    eyes: 'Brown',
  },
};
