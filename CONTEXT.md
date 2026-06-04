# Demo Composer Context

Demo Composer captures real software workflows and turns those captures into shareable guides and interactive demos. This context owns the shared product language for capture, composition, and publishing.

## Language

**Capture**:
Source material recorded from a real software workflow.
_Avoid_: Recording as a synonym for the final guide or demo

**Capture Session**:
One source recording run that groups captured events and assets.
_Avoid_: Guide, demo

**Capture Event**:
One recorded action or moment inside a capture session.
_Avoid_: Step, scene

**Manual Capture**:
A user-triggered capture event that forces a screenshot or step-worthy moment.
_Avoid_: Automatic event

**Redaction**:
The removal or visual hiding of sensitive captured information.
_Avoid_: Deleting original capture

**Suggestion**:
Optional future assistive content proposed by automation or AI for user review.
_Avoid_: Source of truth

**Capture Asset**:
A reusable screenshot, HTML snapshot, or related media file produced by capture.
_Avoid_: Guide screenshot, demo page

**Derived Asset**:
A processed variant of a capture asset, such as a thumbnail or redacted image.
_Avoid_: Edited original

**File**:
A stored binary or text object with physical storage metadata.
_Avoid_: Capture asset

**Screenshot Capture**:
A capture asset that stores the visual screen state as an image.
_Avoid_: HTML replay

**HTML Snapshot**:
A capture asset that stores serialized page structure for future replay or inspection.
_Avoid_: Screenshot

**Instance**:
A hosted Demo Composer deployment that the extension and apps connect to.
_Avoid_: Workspace, organization

**Extension Session**:
An extension-scoped authenticated session for one Demo Composer instance.
_Avoid_: Web session

**Guide**:
A Scribe-style document artifact made for reading and following a process.
_Avoid_: How-to demo, doc demo

**Guide Block**:
One ordered visible unit inside a guide.
_Avoid_: Widget

**Guide Step**:
A guide block that instructs the reader to perform or understand one workflow action.
_Avoid_: Capture event, demo scene

**Guide Annotation**:
A visual mark or callout attached to guide content.
_Avoid_: Hotspot

**Interactive Demo**:
A Storylane-style walkthrough artifact made for guided interaction.
_Avoid_: Guide, walkthrough doc

**Demo Scene**:
One interactive screen state inside an interactive demo.
_Avoid_: Guide block, page

**Demo Hotspot**:
An interactive target inside a demo scene.
_Avoid_: Guide annotation, widget

**Demo Transition**:
A navigation rule from one demo scene to another.
_Avoid_: Step order

**Project**:
A workspace grouping related captures, guides, and interactive demos for a product or workflow area.
_Avoid_: Folder, software

**Organization**:
A team or company that owns users, projects, captures, guides, and interactive demos.
_Avoid_: Company when referring to the tenant

**User**:
A login-capable person using Demo Composer.
_Avoid_: Organization user when referring to authentication identity

**Organization Member**:
A user's membership and role inside an organization.
_Avoid_: User when referring to organization-specific membership

**Org User**:
The canonical implementation name for an organization member.
_Avoid_: Organization member in code/table names

**Owner**:
An organization member with full control over one organization.
_Avoid_: Administrator when referring to an organization-scoped role

**Owner Bootstrap**:
The explicit setup command that creates the first user, default organization, and owner org user for a self-hosted instance.
_Avoid_: Public signup, public bootstrap endpoint

**Deployment Mode**:
Whether an instance is operated as self-hosted or hosted.
_Avoid_: Environment when referring to product setup behavior

**First-Run Setup**:
The self-hosted onboarding flow that creates the first owner, user, and organization for an uninitialized instance.
_Avoid_: Signup

**Web First-Run Setup**:
The browser-based first-run setup screen for self-hosted instances.
_Avoid_: Hosted signup page

**Portal App**:
The React web application used by authenticated Demo Composer users.
_Avoid_: Backend static pages

**API Server**:
The Fastify application that owns HTTP APIs, auth cookies, and backend adapters.
_Avoid_: Portal host when referring to frontend serving

**Signup Onboarding**:
The hosted onboarding flow where a new user registers and creates or joins an organization.
_Avoid_: Owner bootstrap

**Project Inbox**:
A default project-like workspace used only if quick capture needs a place to land before the user organizes it.
_Avoid_: Orphan captures

**Project Workspace**:
The portal surface where a project's captures, guides, and interactive demos are managed.
_Avoid_: Project detail page when referring to the full operational workspace

**Guide Editor**:
The editor for Scribe-style guide documents.
_Avoid_: Demo editor

**Interactive Demo Editor**:
The editor for Storylane-style interactive demos.
_Avoid_: Guide editor

**Published Artifact**:
An immutable published snapshot of a guide or interactive demo.
_Avoid_: Draft, live artifact

**Publish Link**:
A shareable access route to a published artifact.
_Avoid_: Draft link

## Relationships

- A **Project** contains many **Captures**
- A **Capture Session** contains many **Capture Events**
- A **Capture Session** contains many **Capture Assets**
- A **Capture Asset** can have many **Derived Assets**
- A **Capture Asset** references one **File**
- A **Project** contains many **Guides**
- A **Project** contains many **Interactive Demos**
- Every **Capture** belongs to exactly one **Project**
- Every **Capture Session** belongs to exactly one **Project**
- Every **Guide** belongs to exactly one **Project**
- Every **Interactive Demo** belongs to exactly one **Project**
- An **Organization** contains many **Projects**
- A **User** can be an **Organization Member** of many **Organizations**
- An **Organization Member** belongs to exactly one **Organization**
- An **Org User** is the implementation record for an **Organization Member**
- An **Owner** is an **Org User** with full organization control
- **Owner Bootstrap** creates the first **User**, **Organization**, and owner **Org User**
- **Deployment Mode** determines whether an instance defaults to **Web First-Run Setup** or **Signup Onboarding**
- The **Portal App** calls the **API Server**; the API Server does not own portal static hosting by default
- Organization-owned records are audited by **Org User**, not directly by **User**
- A **Capture Asset** can be reused by many **Guides**
- A **Capture Asset** can be reused by many **Interactive Demos**
- A **Guide** contains many **Guide Blocks**
- A **Guide Block** may have exactly one **Guide Step** when its block type is `step`
- A **Guide Step** may reference one **Capture Asset**
- A **Guide Step** may reference one **Capture Event**
- A **Guide Step** may have many **Guide Annotations**
- A **Guide** and an **Interactive Demo** are separate artifact types
- An **Interactive Demo** contains many **Demo Scenes**
- A **Demo Scene** may reference one **Capture Asset**
- A **Demo Scene** can have many **Demo Hotspots**
- A **Demo Hotspot** may trigger one **Demo Transition**
- A **Demo Transition** connects one **Demo Scene** to another **Demo Scene**
- A **Guide** can produce many **Published Artifacts**
- An **Interactive Demo** can produce many **Published Artifacts**
- A **Publish Link** resolves to one **Published Artifact** at a time
- An **Extension Session** belongs to one **Instance**
- An **Extension Session** authenticates a **User** for capture APIs on that **Instance**
- A **Capture Session** is started inside exactly one **Project**

## Example Dialogue

> **Dev:** "When the Chrome extension records a workflow, do we immediately create a demo?"
> **Domain expert:** "No. We create a **Capture Session** first. The user can later use its **Capture Assets** to create either a **Guide** or an **Interactive Demo**."

## Flagged Ambiguities

- "demo" can mean the whole product category or the interactive artifact. Resolution: use **Interactive Demo** for the Storylane-style artifact.
- "ad-hoc capture" should not mean an ownerless capture. Resolution: quick captures may use a **Project Inbox**, but still belong to a **Project**.
- "step" should not describe raw extension events. Resolution: raw actions are **Capture Events**; edited guide units are guide steps.
- "edit capture" should not mean overwriting source capture data. Resolution: source **Capture Events** and original **Capture Assets** are immutable; edits create artifact records or **Derived Assets**.
- "file" and "capture asset" are distinct. Resolution: **File** stores physical storage facts; **Capture Asset** gives that file product meaning.
- "HTML capture" is not part of the MVP replay path. Resolution: MVP uses **Screenshot Capture**; **HTML Snapshot** remains a deferred capture asset type.
- "login to extension" requires an **Instance** first. Resolution: the extension stores the target **Instance** URL before creating an **Extension Session**.
- "quick capture" still needs project context. Resolution: the extension remembers the last **Project** or uses a **Project Inbox**.
- "capture everything" is not the default. Resolution: capture records meaningful workflow events and **Manual Capture** moments, not raw telemetry noise.
- "input capture" should not mean storing raw typed values. Resolution: input values are omitted or redacted by default, and visual **Redaction** creates derived assets.
- "finish capture" should not mean creating a guide or demo. Resolution: finishing capture completes the **Capture Session** and opens the **Project** workspace for explicit artifact creation.
- "project page" should mean the **Project Workspace** when discussing the MVP portal surface.
- "editor" is ambiguous. Resolution: use **Guide Editor** or **Interactive Demo Editor** unless referring to shared low-level editor utilities.
- "AI-generated" content is not part of MVP. Resolution: MVP uses deterministic placeholders; future **Suggestions** may assist users but do not own artifact state.
- "widget" should not describe guide content. Resolution: use **Guide Block** for ordered document units and **Guide Step** for step-specific behavior.
- "page" should not describe an interactive demo screen. Resolution: use **Demo Scene** for the interactive artifact and **Capture Asset** for the source screenshot/HTML.
- "hotspot" should not describe a guide highlight. Resolution: use **Demo Hotspot** for interactive targets and **Guide Annotation** for document visuals.
- "publish link" should not mean a live pointer to draft rows. Resolution: a **Publish Link** resolves to a **Published Artifact** snapshot.
- "user" and "organization member" are distinct. Resolution: **User** is authentication identity; **Organization Member** is organization-scoped membership and role.
- "organization member" is domain language; **Org User** is the canonical code/table term.
- "administrator" should not describe the organization-scoped first user role. Resolution: use **Owner** for the first organization role and **Owner Bootstrap** for first-run setup.
- "setup" and "signup" are different onboarding paths. Resolution: **Web First-Run Setup** is for self-hosted initialization; **Signup Onboarding** is for hosted registration/invites.
