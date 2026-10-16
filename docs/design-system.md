# Design System

The appraisal UI uses a restrained teal/blue palette, clear hierarchy, Noto Sans Thai, and mobile-first layouts. Reuse existing UI primitives and tokens before adding components or values.

## Implementation

- Theme variables and Tailwind v4 mappings are in `src/app/globals.css`; use semantic utilities such as `bg-surface`, `text-ink`, and `border-line`. Dark mode follows the system preference.
- Keep color, type, spacing (4 px base), radius, shadow, and motion values on shared tokens instead of adding arbitrary component-level values.
- Local Noto Sans Thai files are loaded through `@font-face`; `tnum` gives tabular price digits. Printed `report-sheet` content stays black on white.
- Default Tailwind breakpoints apply: below 768px uses one-column forms and bottom navigation; `md` restores wider grids/tables; `lg` uses a persistent sidebar; `xl` can show a sticky summary rail.
- Keep long Thai labels, addresses, job IDs, and filenames wrappable. Preserve image aspect ratios and avoid horizontal page overflow.
- Print layouts hide navigation, actions, and animation, and keep the report legible on A4 pages.

## Interaction and accessibility

- Show loading, empty, error, success, and disabled states where relevant; prevent duplicate submissions and explain unavailable actions.
- Use semantic controls, labels, visible focus, keyboard access, and screen-reader announcements for important feedback. Do not convey status through color alone.
- Keep important mobile targets easy to tap, including drawing controls; provide button or numeric alternatives to gesture-only editing.
- Motion should explain state changes, remain brief, honor `prefers-reduced-motion`, and disappear from print output.
- Pages should compose existing UI primitives. Put genuinely new UI in its own component file and import it into the page rather than embedding new markup in the page file.

For validation and future CI policy, see [quality-and-ci.md](quality-and-ci.md).
