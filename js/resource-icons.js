/**
 * resource-icons.js
 * Placeholder icon set for Linked Resources (CLAUDE.md Section 15) — the
 * "Add Link" Editor.js block's {icon, label, url} cards. Distinct from
 * Quick Links' icon set (js/icons.js — different module, different
 * purpose: site-wide shortcuts vs. per-page file/media attachments).
 * The 10 standard icons per CLAUDE.md: PDF, Document, Presentation, Video,
 * YouTube, Facebook, Calendar/Meeting, Event/Theme Day, Photo, generic Link.
 * Line-based SVGs, currentColor stroke, matching the same treatment as
 * js/icons.js. Swap for commissioned icons later — every Linked Resource
 * card references an icon by id, so a swap only touches this file.
 */
(function (global) {
  "use strict";

  var ICON_WRAPPER_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

  var ICONS = {
    pdf: '<svg ' + ICON_WRAPPER_ATTRS + '><path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4"/><path d="M8.5 17v-4h1.3a1.3 1.3 0 0 1 0 2.6H8.5"/><path d="M12.5 17v-4h1.2c1 0 1.6.9 1.6 2s-.6 2-1.6 2h-1.2Z"/><path d="M17 13v4"/><path d="M17 15h1.3"/></svg>',
    document: '<svg ' + ICON_WRAPPER_ATTRS + '><path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4"/><path d="M8.5 13h7"/><path d="M8.5 16.5h7"/><path d="M8.5 9.5h3"/></svg>',
    presentation: '<svg ' + ICON_WRAPPER_ATTRS + '><rect x="3.5" y="4.5" width="17" height="11" rx="1.5"/><path d="M12 15.5V19"/><path d="M8.5 19h7"/><path d="M7.5 8.5l3 2.5 2.5-2 3.5 2.7"/></svg>',
    video: '<svg ' + ICON_WRAPPER_ATTRS + '><rect x="3.5" y="6" width="13" height="12" rx="1.8"/><path d="M16.5 10.3 20.5 8v8l-4-2.3"/></svg>',
    youtube: '<svg ' + ICON_WRAPPER_ATTRS + '><rect x="3" y="6" width="18" height="12" rx="3.2"/><path d="M10.3 9.8v4.4l4-2.2-4-2.2Z" fill="currentColor" stroke="none"/></svg>',
    facebook: '<svg ' + ICON_WRAPPER_ATTRS + '><circle cx="12" cy="12" r="8.5"/><path d="M13.8 8.5h-1.4c-1 0-1.6.6-1.6 1.6v1.4H9.5v2h1.3V17h2v-3.5h1.6l.3-2h-1.9V10c0-.4.2-.6.6-.6h1.4V8.5Z"/></svg>',
    calendar: '<svg ' + ICON_WRAPPER_ATTRS + '><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M8 14h1"/><path d="M12 14h1"/><path d="M16 14h1"/><path d="M8 17.5h1"/><path d="M12 17.5h1"/></svg>',
    event: '<svg ' + ICON_WRAPPER_ATTRS + '><path d="M12 3v3"/><path d="M5 8.5h14l-1.2 10.4a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3L5 8.5Z"/><path d="M9 3v3"/><path d="M15 3v3"/><path d="M8.5 13.5l2 2 4.5-4.5"/></svg>',
    photo: '<svg ' + ICON_WRAPPER_ATTRS + '><rect x="3.5" y="5.5" width="17" height="13" rx="2.2"/><circle cx="9" cy="10.5" r="1.6"/><path d="M4 17l5-4.5 3 2.5 3.5-3.5 4.5 4"/></svg>',
    link: '<svg ' + ICON_WRAPPER_ATTRS + '><path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 12.6 4.9a3.5 3.5 0 0 1 5 5L15.9 11.6"/><path d="M13 17.5 11.4 19.1a3.5 3.5 0 0 1-5-5L8.1 12.4"/></svg>'
  };

  global.ResourceIcons = {
    get: function (id) {
      return ICONS[id] || ICONS.link;
    }
  };
})(window);
