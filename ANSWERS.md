# ANSWERS.md

## 1. How to Run

No installation required. Open `index.html` directly in a browser, or run a local server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`. No npm, no build step, no dependencies.

---

## 2. Stack & Design Choices

**Stack:** Vanilla HTML, CSS, and JavaScript. No framework. I chose this because the task is a self-contained UI with no server — adding React or Vue would be overhead with no benefit. `localStorage` handles persistence with zero configuration.

**Decision 1 — Dark theme with a single acid-green accent (`#c8f060`):**
In the weekly grid, every cell is visually quiet (dark, low contrast) *except* checked cells, which glow with the accent color and a soft box-shadow. This creates an immediate at-a-glance reading: you can scan the whole week in under a second and see exactly which habits were completed. If I had used multiple colors or a light background, the visual weight would be spread out and harder to parse. The accent is reserved exclusively for "completed" and "today" — it means one thing only.

**Decision 2 — Today's column is highlighted end-to-end, not just in the header:**
The `is-today` class applies to both the `<th>` and every `<td>` in today's column, giving it a faint green-tinted background and a top border stripe. This makes the current day feel like a physical column, not just a label. Users can orient themselves instantly without reading the date numbers. The subtle border also separates "past" from "present" visually.

**Week starts Monday** because a work/habit week is most naturally Monday–Sunday in most of the world. Habits like "exercise 4×/week" are typically measured Mon–Sun. Defending it: ISO 8601 also defines Monday as the first day of the week.

---

## 3. Responsive & Accessibility

**360px phone:** The header stacks vertically (brand on top, nav below). The add-bar becomes a column (input full-width, button full-width). The grid scrolls horizontally — the habit name column is sticky-ish at 130px so the user always knows which row they're on. Row action buttons (rename/delete) are always visible on mobile (no hover-reveal) so touch users can access them.

**1440px laptop:** The habit name column expands to 240px, the full grid breathes with generous padding, and hover states reveal the rename/delete buttons on each row.

**Accessibility handled:** Every interactive element (`check-btn`, `nav-btn`, `icon-btn`) has a visible `:focus-visible` ring using the accent color. Check buttons use `role="checkbox"` and `aria-pressed` so screen readers announce checked/unchecked state. Day header `<th>` elements use `scope="col"`, habit name cells are in the first `<td>` of each row properly scoped. The modal uses `role="dialog"` and `aria-modal="true"` with focus moved to the input on open.

**Accessibility skipped:** I did not implement a full focus trap inside the modal (Tab does not cycle within the modal only). With more time I'd add a `focustrap` utility to keep keyboard focus inside the dialog while it's open.

---

## 4. AI Usage

I used Claude (claude.ai) to generate the initial structure, CSS design system, and JavaScript logic for this project.

**What I asked:** "Build a habit tracker with weekly grid, streaks, week navigation, localStorage persistence, dark theme, and a clean grid table layout."

**What I changed:** The AI's initial streak logic counted a streak only if today was checked — meaning if you haven't ticked today yet, your streak showed 0 even if you'd been perfect for 14 days. I changed it to walk backwards from today and count consecutive checked days regardless of whether today is checked yet. This better reflects real behavior: your streak is alive until you break it, not just when you actively confirm it each day.

The AI also generated the rename UI as a separate page navigation. I changed it to a modal dialog, because leaving the grid to rename a habit breaks the user's flow. The modal keeps context — you can see your grid behind it, confirm the name, and get back without losing your place.

---

## 5. Honest Gap

The weakest part is the streak calculation for weeks other than the current one. Right now, if you navigate to a past week and check/uncheck boxes, the streak badge in that row updates correctly for the current streak — but there's no visual indicator showing how the streak looked *at that point in time*. A past week showing 7/7 checks has no visual celebration; it looks the same as a current week mid-progress.

With another day I would add a per-week "completion rate" indicator (e.g., a small progress bar or fraction like "5/7") shown for past weeks, and only show the live streak badge when viewing the current week. That would make past week views more informative and visually distinct from "live" mode.
