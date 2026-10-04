"""Patch index.html: redesign "Visit Our Showroom" into a two-branch,
tab-switchable section with one re-pointable Google Map embed.

Line-number based with content guards, so the edit is deterministic and the
file's CRLF endings / UTF-8 encoding are preserved. Run: python _patch_showroom.py
"""

import sys

PATH = "index.html"

# ---------------------------------------------------------------- new content

ROOT_VARS = """      /* Multi-branch showroom theme (brand red + WhatsApp green) */
      --branch-red: #E52E2E;
      --branch-red-dark: #C41F1F;
      --branch-green: #25D366;
      --branch-ink: #111111;"""

CSS_LOCATION = """    /* --- Location & Multi-Branch Showroom Section --- */
    .store-section {
      background: var(--card-white);
      border-radius: 20px;
      border: 1px solid var(--border-color);
      padding: 30px;
      margin-top: 40px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
    }
    .branch-header { text-align: left; margin-bottom: 18px; }

    /* Branch switcher tabs (Main Showroom / Mobile Shop) */
    .branch-tabs { display: inline-flex; align-items: center; gap: 6px; padding: 6px; margin-bottom: 22px; background: #F3F4F6; border: 1px solid var(--border-color); border-radius: 50px; }
    .branch-tab { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 44px; padding: 10px 20px; border: 1px solid transparent; border-radius: 50px; background: transparent; color: #4B5563; font-family: inherit; font-size: 0.86rem; font-weight: 800; cursor: pointer; transition: background 0.25s ease, color 0.25s ease, box-shadow 0.25s ease; }
    .branch-tab i { font-size: 0.95rem; }
    .branch-tab:hover { background: #FDE8E8; color: var(--branch-red); }
    .branch-tab.is-active { background: linear-gradient(135deg, var(--branch-red) 0%, var(--branch-red-dark) 100%); color: #FFFFFF; box-shadow: 0 8px 18px rgba(229, 46, 46, 0.28); }
    .branch-tab.is-active:hover { color: #FFFFFF; }

    /* Two location cards, side by side */
    .branch-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
    .branch-card {
      position: relative;
      display: flex;
      flex-direction: column;
      min-width: 0;
      padding: 22px;
      background: #FFFFFF;
      border: 1px solid var(--border-color);
      border-radius: 20px;
      box-shadow: 0 6px 18px rgba(17, 24, 39, 0.05);
      cursor: pointer;
      transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
    }
    .branch-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; border-radius: 20px 20px 0 0; background: linear-gradient(90deg, var(--branch-accent) 0%, rgba(255, 255, 255, 0) 118%); opacity: 0; transition: opacity 0.28s ease; }
    .branch-card[data-branch="mall"] { --branch-accent: #E52E2E; }
    .branch-card[data-branch="mobile"] { --branch-accent: #25D366; }
    .branch-card:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(17, 24, 39, 0.10); }
    .branch-card.is-active { border-color: var(--branch-accent); box-shadow: 0 16px 34px rgba(229, 46, 46, 0.14); }
    .branch-card[data-branch="mobile"].is-active { box-shadow: 0 16px 34px rgba(37, 211, 102, 0.16); }
    .branch-card.is-active::before { opacity: 1; }

    .branch-card-top { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 14px; margin-bottom: 18px; }
    .branch-icon { flex: 0 0 48px; width: 48px; height: 48px; display: grid; place-items: center; border-radius: 14px; color: #FFFFFF; font-size: 1.15rem; box-shadow: 0 8px 18px rgba(17, 24, 39, 0.16); }
    .branch-card[data-branch="mall"] .branch-icon { background: linear-gradient(135deg, #E52E2E 0%, #B81412 100%); }
    .branch-card[data-branch="mobile"] .branch-icon { background: linear-gradient(135deg, #25D366 0%, #0F9D58 100%); }
    .branch-brand { flex: 1 1 auto; min-width: 0; }
    .branch-brand h3 { font-size: 1.05rem; font-weight: 800; line-height: 1.32; color: var(--text-dark); }
    .branch-address { display: flex; align-items: flex-start; gap: 7px; margin-top: 6px; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; line-height: 1.45; }
    .branch-address i { margin-top: 3px; font-size: 0.82rem; color: var(--branch-accent); }
    .branch-tag { flex: 0 0 auto; align-self: flex-start; padding: 5px 11px; border: 1px solid #FBD5D5; border-radius: 50px; background: #FEF2F2; color: #C81E1E; font-size: 0.6rem; font-weight: 900; letter-spacing: 0.7px; text-transform: uppercase; }
    .branch-card[data-branch="mobile"] .branch-tag { border-color: #BBF7D0; background: #ECFDF3; color: #15803D; }"""


CSS_ACTIONS = """
    .store-hours { display: flex; align-items: center; gap: 10px; margin: auto 0 18px; padding: 10px 14px; border: 1px dashed var(--border-color); border-radius: 12px; background: #F8F9FA; color: var(--text-muted); font-size: 0.82rem; font-weight: 700; }
    .store-hours i { color: var(--primary-red); font-size: 0.95rem; }
    .store-actions { display: flex; flex-wrap: wrap; gap: 10px; }
    .btn-call,
    .btn-directions { flex: 1 1 150px; min-width: 0; display: inline-flex; align-items: center; justify-content: center; gap: 9px; padding: 12px 18px; border-radius: 50px; text-decoration: none; font-weight: 800; font-size: 0.82rem; transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease; }
    .btn-call { background: linear-gradient(135deg, var(--branch-red) 0%, var(--branch-red-dark) 100%); color: #FFFFFF; box-shadow: 0 8px 18px rgba(229, 46, 46, 0.26); }
    .btn-call:hover { transform: translateY(-2px); background: linear-gradient(135deg, var(--branch-red-dark) 0%, var(--branch-red-dark) 100%); box-shadow: 0 12px 24px rgba(229, 46, 46, 0.34); }
    .btn-directions { background: var(--branch-ink); color: #FFFFFF; box-shadow: 0 8px 18px rgba(17, 17, 17, 0.22); }
    .btn-directions:hover { transform: translateY(-2px); background: #000000; box-shadow: 0 12px 24px rgba(17, 17, 17, 0.30); }"""

CSS_CONTACT = """
    .store-info { display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px; }
    .store-info-item { display: flex; align-items: center; gap: 11px; min-width: 0; font-size: 0.9rem; font-weight: 600; color: var(--text-dark); }
    .store-info-item i { flex: 0 0 auto; font-size: 1rem; color: var(--branch-accent); }
    .store-info-item a { color: inherit; text-decoration: none; }
    .store-info-item a:hover { color: var(--branch-red); text-decoration: underline; }"""

CSS_MAP = """
    .map-box { position: relative; margin-top: 20px; }
    .map-box iframe {
      width: 100%;
      height: 340px;
      border: 0;
      border-radius: 18px;
      box-shadow: 0 10px 28px rgba(17, 24, 39, 0.10);
      display: block;
      background: #F3F4F6;
    }
    .branch-map-badge { position: absolute; top: 14px; left: 14px; z-index: 2; display: inline-flex; align-items: center; gap: 9px; max-width: calc(100% - 28px); padding: 9px 15px; border-radius: 50px; background: rgba(17, 17, 17, 0.88); color: #FFFFFF; font-size: 0.76rem; font-weight: 700; backdrop-filter: blur(6px); }
    .branch-map-badge i { flex: 0 0 auto; color: var(--branch-green); font-size: 0.86rem; }
    .branch-map-badge span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }"""

MQ_500 = """      .branch-tabs { display: flex; width: 100%; gap: 5px; padding: 5px; }
      .branch-tab { flex: 1 1 0; min-width: 0; padding: 10px 8px; font-size: 0.74rem; white-space: nowrap; }
      .branch-tab i { font-size: 0.84rem; }
      .branch-grid { gap: 14px; }
      .branch-card { padding: 18px; border-radius: 18px; }
      .branch-card-top { gap: 12px; margin-bottom: 16px; }
      .branch-brand h3 { font-size: 0.98rem; }
      .store-section { padding: 22px 18px; }
      .map-box { margin-top: 16px; }
      .map-box iframe { height: 240px; border-radius: 16px; }
      .branch-map-badge { top: 10px; left: 10px; padding: 8px 12px; font-size: 0.7rem; }"""

MQ_900_ADD = "      .branch-grid { grid-template-columns: 1fr; }"

MAP_MALL = "https://maps.google.com/maps?q=Sagore%20Bus%20Stand&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=&amp;output=embed"
MAP_MOBILE = "https://maps.google.com/maps?q=Patidar%20Mobile%20Gallery%2C%20Sagore&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=&amp;output=embed"
GOTO_MALL = "https://www.google.com/maps/search/?api=1&amp;query=Sagore%20Bus%20Stand"
GOTO_MOBILE = "https://www.google.com/maps/search/?api=1&amp;query=Patidar%20Mobile%20Gallery%2C%20Sagore"

HTML_SECTION = """    <!-- Location & Store Section (two-branch switcher) -->
    <div class="store-section" id="store-location">
      <div class="section-header branch-header">
        <h2>Visit Our Showroom</h2>
        <p>Two branches in Sagore - electronics, furniture and mobiles under one roof</p>
      </div>

      <div class="branch-tabs" role="group" aria-label="Choose a branch to show on the map">
        <button type="button" class="branch-tab is-active" data-branch="mall" aria-pressed="true" onclick="selectBranch('mall')"><i class="fa-solid fa-store"></i> Main Showroom</button>
        <button type="button" class="branch-tab" data-branch="mobile" aria-pressed="false" onclick="selectBranch('mobile')"><i class="fa-solid fa-mobile-screen-button"></i> Mobile Shop</button>
      </div>

      <div class="branch-grid">
        <article class="branch-card is-active" data-branch="mall" data-map-label="Main Showroom - Bus Stand, Sagore" data-map-src="__MAP_MALL__" onclick="selectBranch('mall')" title="Show Patidar Electronics &amp; Furniture Mall on the map">
          <div class="branch-card-top">
            <span class="branch-icon"><i class="fa-solid fa-store"></i></span>
            <div class="branch-brand">
              <h3>Patidar Electronics &amp; Furniture Mall</h3>
              <p class="branch-address"><i class="fa-solid fa-location-dot"></i><span>Bus Stand, Sagore</span></p>
            </div>
            <span class="branch-tag">Main Showroom</span>
          </div>
          <div class="store-info">
            <div class="store-info-item"><i class="fa-solid fa-phone"></i><span><a href="tel:+919926762999">99267 62999</a> / <a href="tel:+919009909002">90099 09002</a></span></div>
            <div class="store-info-item"><i class="fa-solid fa-couch"></i><span>Electronics, Furniture &amp; Home Appliances</span></div>
          </div>
          <div class="store-hours"><i class="fa-regular fa-clock"></i><span>Opening Hours: 9:00 AM - 9:00 PM</span></div>
          <div class="store-actions">
            <a class="btn-call" href="tel:+919926762999"><i class="fa-solid fa-phone"></i> Call Showroom</a>
            <a class="btn-directions" href="__GOTO_MALL__" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-location-dot"></i> Open in Google Maps</a>
          </div>
        </article>

        <article class="branch-card" data-branch="mobile" data-map-label="Mobile Gallery - Market Road, Sagore" data-map-src="__MAP_MOBILE__" onclick="selectBranch('mobile')" title="Show Patidar Mobile Gallery on the map">
          <div class="branch-card-top">
            <span class="branch-icon"><i class="fa-solid fa-mobile-screen-button"></i></span>
            <div class="branch-brand">
              <h3>Patidar Mobile Gallery</h3>
              <p class="branch-address"><i class="fa-solid fa-location-dot"></i><span>Near Bus Stand / Market Road, Sagore</span></p>
            </div>
            <span class="branch-tag">Mobile Shop</span>
          </div>
          <div class="store-info">
            <div class="store-info-item"><i class="fa-solid fa-phone"></i><span><a href="tel:+919926762999">99267 62999</a></span></div>
            <div class="store-info-item"><i class="fa-solid fa-mobile-screen"></i><span>Smartphones, Accessories &amp; Recharge</span></div>
          </div>
          <div class="store-hours"><i class="fa-regular fa-clock"></i><span>Opening Hours: 9:00 AM - 9:00 PM</span></div>
          <div class="store-actions">
            <a class="btn-call" href="tel:+919926762999"><i class="fa-solid fa-phone"></i> Call Shop</a>
            <a class="btn-directions" href="__GOTO_MOBILE__" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-location-dot"></i> Open in Google Maps</a>
          </div>
        </article>
      </div>

      <div class="map-box">
        <div class="branch-map-badge"><i class="fa-solid fa-map-location-dot"></i><span id="branchMapLabel">Main Showroom - Bus Stand, Sagore</span></div>
        <iframe id="branchMapFrame" src="__MAP_MALL__" title="Patidar Electronics &amp; Furniture Mall, Bus Stand Sagore on Google Maps" allowfullscreen="" loading="lazy"></iframe>
      </div>
    </div>"""

JS_SWITCHER = """    /* --- Showroom Branch Switcher (one map, two branch pins) --- */
    const branchState = { active: 'mall' };

    function selectBranch(branch) {
      const frame = document.getElementById('branchMapFrame');
      const badge = document.getElementById('branchMapLabel');
      let activeCard = null;

      document.querySelectorAll('.branch-card').forEach(card => {
        const isOn = card.dataset.branch === branch;
        card.classList.toggle('is-active', isOn);
        if (isOn) activeCard = card;
      });

      document.querySelectorAll('.branch-tab').forEach(tab => {
        const isOn = tab.dataset.branch === branch;
        tab.classList.toggle('is-active', isOn);
        tab.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      });

      if (!activeCard) return;

      const label = activeCard.dataset.mapLabel;
      const src = activeCard.dataset.mapSrc;
      if (badge && label) badge.textContent = label;

      // Re-point the single embed only when the branch really changed, so the
      // map never reloads while it already shows the right pin.
      if (frame && src && branch !== branchState.active) {
        frame.setAttribute('src', src);
        frame.setAttribute('title', (label || 'Patidar Mobile & Electronics') + ' on Google Maps');
      }
      branchState.active = branch;
    }

    // Keep the tabs, cards and map badge in sync with the default branch.
    if (document.getElementById('branchMapFrame')) selectBranch(branchState.active);
"""

# ------------------------------------------------------- apply (line-guarded)

EDITS = []          # (start_line, end_line | None, new_text, note)


def queue(start, end, new_text, note):
    EDITS.append((start, end, new_text, note))


def main():
    with open(PATH, "r", encoding="utf-8", newline="") as fh:
        raw = fh.read()
    nl = "\r\n" if "\r\n" in raw else "\n"
    lines = raw.replace("\r\n", "\n").split("\n")
    before = len(lines)

    def expect(idx, needle, exact=False):
        line = lines[idx - 1]
        ok = (line == needle) if exact else (needle in line)
        if not ok:
            print("GUARD FAILED at line %d\n  want%s: %r\n  got : %r"
                  % (idx, " exactly" if exact else "", needle, line))
            sys.exit(1)

    expect(27, "--border-color: #E2E8F0;")
    expect(382, "/* --- Location & Store Section --- */")
    expect(391, ".store-layout")
    expect(414, ".btn-call:hover")
    expect(416, ".store-info {")
    expect(424, ".store-info-item i")
    expect(426, ".map-box iframe {")
    expect(433, "    }", exact=True)
    expect(829, ".customers-grid")
    expect(830, ".category-grid")
    expect(888, ".store-layout")
    expect(890, ".map-box iframe { height: 240px; }")
    expect(1459, "<!-- Location & Store Section -->")
    expect(1481, "    </div>", exact=True)
    expect(1482, "", exact=True)
    expect(1510, "/* --- Image Slider Logic --- */")

    html = (HTML_SECTION
            .replace("__MAP_MALL__", MAP_MALL)
            .replace("__MAP_MOBILE__", MAP_MOBILE)
            .replace("__GOTO_MALL__", GOTO_MALL)
            .replace("__GOTO_MOBILE__", GOTO_MOBILE))

    queue(27, 27, "      --border-color: #E2E8F0;\n" + ROOT_VARS, "root theme tokens")
    queue(382, 414, CSS_LOCATION + CSS_ACTIONS, "location + CTA css")
    queue(416, 424, CSS_CONTACT.strip("\n"), "contact css")
    queue(426, 433, CSS_MAP.strip("\n"), "map css")
    queue(830, None, MQ_900_ADD, "stack cards <=900px")
    queue(888, 890, MQ_500, "compact css <=500px")
    queue(1459, 1481, html, "showroom markup")
    queue(1510, None, JS_SWITCHER, "branch switcher js")

    for start, end, text, note in sorted(EDITS, key=lambda e: e[0], reverse=True):
        if end is None:
            lines[start - 1:start - 1] = text.split("\n")
        else:
            lines[start - 1:end] = text.split("\n")
        print("applied: %-22s from line %s" % (note, start))

    out = nl.join(lines)

    for leftover in ("__MAP_MALL__", "__MAP_MOBILE__", "__GOTO_MALL__", "__GOTO_MOBILE__"):
        if leftover in out:
            print("FAILED: placeholder %s still present" % leftover)
            sys.exit(1)
    required = ('class="branch-card is-active"', "data-map-src", 'id="branchMapFrame"',
                "function selectBranch(", "--branch-red: #E52E2E;", ".branch-map-badge",
                "Call Showroom", "Call Shop", "Patidar Mobile Gallery")
    for item in required:
        if item not in out:
            print("FAILED: missing %r after patch" % item)
            sys.exit(1)

    with open(PATH, "w", encoding="utf-8", newline="") as fh:
        fh.write(out)

    print("")
    print("branch cards : %d" % out.count('class="branch-card'))
    print("branch tabs  : %d" % out.count('class="branch-tab'))
    print("lines        : %d -> %d" % (before, len(lines)))
    print("wrote %s (%s endings)" % (PATH, "CRLF" if nl == "\r\n" else "LF"))


if __name__ == "__main__":
    main()


