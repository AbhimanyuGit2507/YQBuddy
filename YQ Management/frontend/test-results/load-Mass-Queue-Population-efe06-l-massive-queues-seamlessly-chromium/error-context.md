# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: load.spec.ts >> Mass Queue Population & Load Test >> Dashboard should render all massive queues seamlessly
- Location: tests/e2e/load.spec.ts:12:7

# Error details

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('a[href^="/dashboard/queues/"]').first()
    - locator resolved to <a href="/dashboard/queues/c108c53e-b889-4dd1-a36f-b10fe903b939" class="w-full block text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">Manage Workspace</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <path d="M1280,0L0,0L0,720L1280,720L1280,0Z↵    M11,132 h233 a5,5 0 0 1 5,5 v60 a5,5 0 0 1 -5,5 h-233 a5,5 0 0 1 -5,-5 v-60 a5,5 0 0 1 5,-5 z"></path> from <svg version="1.1" xmlSpace="preserve" viewBox="0 0 1280 720" preserveAspectRatio="xMinYMin slice" xmlnsXlink="http://www.w3.org/1999/xlink" class="driver-overlay driver-overlay-animated">…</svg> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <path d="M1280,0L0,0L0,720L1280,720L1280,0Z↵    M11,132 h233 a5,5 0 0 1 5,5 v60 a5,5 0 0 1 -5,5 h-233 a5,5 0 0 1 -5,-5 v-60 a5,5 0 0 1 5,-5 z"></path> from <svg version="1.1" xmlSpace="preserve" viewBox="0 0 1280 720" preserveAspectRatio="xMinYMin slice" xmlnsXlink="http://www.w3.org/1999/xlink" class="driver-overlay driver-overlay-animated">…</svg> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    4 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <path d="M1280,0L0,0L0,720L1280,720L1280,0Z↵    M11,132 h233 a5,5 0 0 1 5,5 v60 a5,5 0 0 1 -5,5 h-233 a5,5 0 0 1 -5,-5 v-60 a5,5 0 0 1 5,-5 z"></path> from <svg version="1.1" xmlSpace="preserve" viewBox="0 0 1280 720" preserveAspectRatio="xMinYMin slice" xmlnsXlink="http://www.w3.org/1999/xlink" class="driver-overlay driver-overlay-animated">…</svg> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms

```

```
Error: browserContext.close: Target page, context or browser has been closed
```