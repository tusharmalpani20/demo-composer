# Project Versions Are Release Contexts

A Project Version is one maintained release state or release line inside exactly one Project. It uses a stable ID, free-form name, project-scoped canonical slug, permanent slug aliases, explicit manual ordering, and `active | archived` lifecycle; every Project transactionally creates one real active `Main` record as its initial default.

Project Versions do not represent audiences, permission groups, environments, channels, folders, semantic-version components, or moving “latest” aliases. Older active versions remain editable, archived versions remain directly addressable and usable as carry-forward sources, and changing the default never moves existing content.
