# Interactive Demos Use Scenes Hotspots And Transitions

Interactive demos are modeled with `demo_scene`, `demo_hotspot`, and `demo_transition` rather than reusing guide blocks. This separates document reading structure from interactive navigation behavior, while allowing the MVP to stay linear and still support branching later without a schema rewrite.

