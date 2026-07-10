# Third-Party Notices

The repository includes optional development-agent guidance under
`.agents/skills/`. It is not part of the Demo Composer application runtime.

## Apache-2.0 Material

### Impeccable

- Source: <https://github.com/pbakaus/impeccable>
- Commit: `da99645a58400ed7acb201e6904f9413efd89c6e`
- Copyright 2025 Paul Bakaus
- License: Apache License 2.0

A complete copy of the upstream Apache License is preserved at
`.agents/skills/impeccable/LICENSE`.

The installed Codex build was generated from the pinned source. The only local
content change moves the generated unsupported top-level skill `version` value to
`metadata.upstream-version`; no instruction content was changed. No hook manifest
is installed.

## MIT Material

### Emil Kowalski Skills

- Source: <https://github.com/emilkowalski/skills>
- Commit: `f76beceb7d3fc8c43309cefad5a095a206103a4e`
- Installed paths: `emil-design-eng`, `review-animations`,
  `animation-vocabulary`, and `apple-design`
- Copyright 2026 Emil Kowalski

The `review-animations` copy omits the provider-specific
`disable-model-invocation` frontmatter key because it is unsupported by the Codex
skill validator. Its instruction content is unchanged.

### Vercel React Best Practices

- Source: <https://github.com/vercel-labs/agent-skills>
- Commit: `f8a72b9603728bb92a217a879b7e62e43ad76c81`
- Installed path: `react-best-practices`
- Upstream author metadata: Vercel

The reviewed upstream README and skill frontmatter declare MIT. The reviewed
commit does not include a standalone license file or copyright notice.

### Addy Osmani Accessibility Skill

- Source: <https://github.com/addyosmani/web-quality-skills>
- Commit: `95d6e255afe1596b557d7a8498517884438f5b3a`
- Installed path: `accessibility`
- Copyright 2026 Addy Osmani

### MIT License Text

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
