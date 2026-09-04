# cv

A single-page personal CV / vCard site for **Victor Albulescu** — static HTML, CSS and jQuery, with one PHP endpoint for the contact form.

Built on the *Karizma – Modern vCard / Resume / CV / Portfolio* template (Ideas_Factory), trimmed down and rewritten with personal content.

---

## Running it

There is no build step, no package manager, no dependencies to install. Every asset is vendored under `assets/`.

Open `index.html` directly in a browser and everything works **except** the contact form, which posts to `send.php`.

To exercise the form you need PHP with a working `mail()`:

```bash
php -S localhost:8000     # then visit http://localhost:8000
```

Deployment is a plain file copy to any PHP-capable host (`.idea/deployment.xml` records a PhpStorm SFTP target named `wat ercvert`).

---

## Layout

```
index.html                 # the live page
index_old.html             # full untouched template (6 sections)
index_particles.html       # hero variant: particles.js, app.js config
index_particles_2.html     # hero variant: particles.js, nasa-particles.js config
index_slider.html          # hero variant: pogo-slider image slideshow
index_youtube_video.html   # hero variant: YouTube background video
send.php                   # contact form mail handler
assets/css/                # bootstrap, template styles, 5 colour themes
assets/js/                 # jquery + plugins + custom.js
assets/fonts/              # FontAwesome, Pe-icon-7-stroke, glyphicons
assets/images/             # photos, plus unused template imagery
```

`index.html` is the only page that ships. The other `index_*.html` files are **kept-as-reference variants of the same template**, each demonstrating a different hero background; they still carry the original template's title and its full six sections (about, resume, services, portfolio, blog, contact). They are not linked from anywhere and are not maintained.

The live page keeps only three sections: **about**, **resume**, **contact**. Its hero uses the `particles_2` variant (`particles.min.js` + `nasa-particles.js`).

---

## How the page works

**Split layout.** `#splitlayout` holds two halves: `.intro` (left — hero, name, social links, nav) and `.page-right` (right — content sections). Clicking a nav item toggles `open-right` / `close-right` on `#splitlayout`, which slides the intro aside and reveals the content pane. `#home` slides it back.

**Section transitions.** All sections live in the DOM at once inside `#pt-main`. Navigation never scrolls; `custom.js` swaps `pt-page-current` / `active_sec` classes and applies a randomly-cycled pair of in/out animation classes from `animations.css`. An `animationend` listener strips the animation classes afterwards.

**Responsive split.** `Modernizr.mq('(max-width: 991px)')` decides between the desktop split-panel behaviour and a mobile flow with a hamburger overlay (`.mob-menu`).

**Contact form.** `custom.js` intercepts the submit click, validates name/email/message client-side, then POSTs serialized form data to `send.php` via AJAX. It shows `.msg_success` only when the response body is exactly the string `SENDING`.

`assets/js/custom.js` is the single behaviour file; its header carries a 14-item table of contents. Several of those items (isotope grid, magnific popup, slick carousel, pogo-slider, YTPlayer) are dead on `index.html` — every block is guarded by a `.length` check on markup that only the template variants contain.

---

## Editing content

All CV content is hard-coded in `index.html`:

| What | Where |
|---|---|
| Typed hero strings | `#typed-strings` (~line 91) |
| Personal details (DOB, address, e-mail) | `.more_info` block (~line 97) |
| Bio paragraphs | `.more-about-me` (~line 217) |
| Skills & languages | `.skills` — five `<span>`s per row, `true` = filled dot, `false` = empty (~line 223) |
| Education & experience | `#resume` section `.item` blocks (~line 355) |
| Contact details | `#contact` section (~line 450) |
| Social links | `.social-icons` (~line 166) |

**Age is computed, not written.** `calculateAge()` at the end of `custom.js` fills every `.my-age` element on load. The literal `111` in the HTML is a placeholder that is only visible if JavaScript fails.

**Colour theme.** `assets/css/style.css` ships the default. To change accent colour, uncomment one of the five `color-*.css` links in `<head>` (yellow, purple, green, red, blue) — each overrides the same set of selectors.

---

## Known issues

- **The date of birth is written twice** — as `birthDate` in `custom.js` and as text in the `.more_info` block of `index.html`. Changing one does not change the other.
- **`send.php` reads `$_POST` keys unconditionally**, emitting warnings on a bare GET.
- **Typo in the hero typed strings**: `VICTOR ALBULESCu`.
- **`<html lang="zxx">`** is a template leftover (`zxx` means "no linguistic content"); it should be `en`.
- **Three social icons are placeholders** — Twitter, Instagram and Vimeo point at `javascript:void(0)`.
- **Working tree shows 87 modified files with no content change.** They are permission-only diffs (`100755` → `100644`). Either commit them or set `git config core.fileMode false`.

## License

MIT — see `LICENSE`.
