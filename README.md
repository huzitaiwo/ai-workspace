# AI Workspace

An original AI productivity product concept, designed and built by Handsome with plain HTML, CSS and JavaScript.
One workspace for chat, documents, writing, reports, knowledge and projects, with a clear trail back to the source.

> This is a portfolio demo. Models, answers, reports and usage numbers are illustrative.
> Nothing is sent to a server, and no real authentication or payments exist.

## What's inside

**Marketing site:** Home, Features, Solutions, Pricing, Security, Resources, FAQ, Contact, Sign in, Sign up, Onboarding.

**App (`/app`):** Home, AI Chat, Conversations, Projects (+ project page), Documents, Knowledge, AI Writer,
Reports, Prompt Library (+ prompt builder), Team, Usage, Billing, Settings, Profile.

## Run it

It's a static site, so any static server works:

    npx serve .

Open `index.html`, or go straight to `app/dashboard.html`.
Run `node tools/check.mjs` for a static check of links, icons and duplicate ids.

## Structure

    index.html … onboarding.html      marketing + auth pages
    app/*.html                        application pages
    css/tokens.css                    colors, type, spacing, motion (light + dark)
    css/base.css                      reset, typography, layout primitives
    css/components.css                buttons, header, footer, forms, pricing, accordion
    css/app.css                       app shell + shared app components
    css/<page>.css                    one small stylesheet per page group
    js/components.js                  icon sprite, marketing header and footer
    js/app-shell.js                   sidebar, topbar, search palette, notifications, toasts
    js/ai-service.js                  AI service + mock provider
    js/ai-writer-service.js           writer edits + writing partner (mock)
    js/demo-data.js                   all demo content

## Design system

- Tokens first: every color, radius, shadow and duration lives in `tokens.css`.
- Light and dark themes are designed separately, not inverted.
- Components are styled once and reused (rows, dialogs, tiles, menus, forms).
- Motion respects `prefers-reduced-motion`.

## AI architecture

    UI → aiService → provider

The UI only talks to `aiService`. Today the provider is a mock that simulates latency, streaming,
cancellation, rate limits, context limits and failures. To use a real model, replace the provider
(on a server, never in the browser) and the UI stays the same.

## Accessibility

Semantic landmarks, skip link, keyboard-operable menus, tabs, dialogs and palette, focus management,
live regions for AI status, visible focus, reduced-motion support.

## State and data

Everything is saved in the browser (`localStorage`, keys start with `aiw-`).
The Profile page can export or delete it.

## Roadmap

- Firebase Auth for sign-in and sign-up (the `provider` object in `js/auth.js`).
- Firestore for projects, documents and drafts (the small service objects in each page script).
- A real AI provider behind `aiService`.
