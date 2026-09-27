/**
 * icons.js
 * Placeholder icon set for the Quick Links module (CLAUDE.md Section 5b).
 * Line-based SVGs, currentColor stroke — matches the existing
 * `.gear-icon svg` treatment in the Póst-IT reference (stroke-width 1.5,
 * round caps/joins). Swap these for commissioned icons later; every
 * QuickLinks item references an icon by id, so a swap only touches this file.
 */
(function (global) {
  "use strict";

  var ICON_WRAPPER_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

  var ICONS = {
    matsedill: '<svg ' + ICON_WRAPPER_ATTRS + '><path d="M7 3v7a2 2 0 0 0 2 2v9"/><path d="M7 3v7"/><path d="M10 3v7"/><path d="M17 3c-1.7 0-3 2-3 5s1.3 5 3 5v8"/></svg>',
    skoladagatal: '<svg ' + ICON_WRAPPER_ATTRS + '><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M8 14h1"/><path d="M12 14h1"/><path d="M16 14h1"/></svg>',
    vinaholl: '<svg ' + ICON_WRAPPER_ATTRS + '><path d="M4 20l6-11 4 6.5"/><path d="M12 20l6-13 2.5 13"/><circle cx="8.5" cy="6" r="1.5"/></svg>',
    leyfisbeidni: '<svg ' + ICON_WRAPPER_ATTRS + '><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h3.5"/></svg>',
    mentor: '<svg ' + ICON_WRAPPER_ATTRS + '><path d="M12 4 3 8l9 4 9-4-9-4Z"/><path d="M7 10.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3v-4.5"/></svg>',
    farsaeld: '<svg ' + ICON_WRAPPER_ATTRS + '><path d="M12 20.5s-7.5-4.7-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 3.1c0 5.5-7.5 10.2-7.5 10.2Z"/></svg>',
    einelti: '<svg ' + ICON_WRAPPER_ATTRS + '><path d="M12 3 4 6.5V11c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6.5L12 3Z"/><path d="M9.5 12.5l2 2 3.5-4"/></svg>',
    link: '<svg ' + ICON_WRAPPER_ATTRS + '><path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 12.6 4.9a3.5 3.5 0 0 1 5 5L15.9 11.6"/><path d="M13 17.5 11.4 19.1a3.5 3.5 0 0 1-5-5L8.1 12.4"/></svg>'
  };

  global.QuickLinkIcons = {
    get: function (id) {
      return ICONS[id] || ICONS.link;
    }
  };
})(window);
