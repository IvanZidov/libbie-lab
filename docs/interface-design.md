# Interface refresh

The interface uses the existing Next.js 16 / React 19 application with Motion 13 for page and message transitions, Lucide React for consistent icons, and Radix Dialog for the property detail drawer. Versions are pinned in the lockfile.

The design keeps TextValue blue and supplied Geist fonts, adds a compact navy navigation rail, and groups the conversation, client list and brief into one workspace. The private Ask Libbie command bar sits above the conversation. Property cards use code-drawn architectural concepts, explicitly labelled as illustrations, and open structured details in a drawer. No listing photography or facts were invented.

Motion connects actual state changes: shared navigation selection, page entry/exit, newly appended messages, feedback entry and the property drawer. Loading feedback appears only during an actual request. CSS and MotionConfig respect reduced motion. The drawer traps focus, closes with Escape and returns focus to its originating card.

The workspace transcript scrolls independently while the composer stays inside the visible workbench. Responsive layouts use a compact icon rail and a mobile conversation selector. All icon-only navigation buttons retain explicit accessible names. Conversation filtering is functional and drafts remain in application state when changing pages.

Browser verification covered desktop (1440px), mobile (390px), no horizontal overflow, property drawer open/close, focus restoration and the preserved conversation controls. The existing 14 domain/integration tests pass.
