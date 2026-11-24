# Project guidelines

- Build a simple website for learning and teaching. Prefer plain HTML, CSS, and JavaScript; avoid frameworks, dependencies, and build steps unless needed.
- Keep the start page (`index.html`) as unstyled HTML for now, with clear links to each learning element.
- Give each element its own page and directory. Elements may contain visualizations, animations, presentations, quizzes, or other interactive learning material.
- Make every element self-contained: keep its assets local, avoid dependencies on the start page or shared global state, and support direct access by URL.
- Make elements easy to embed in other websites using an iframe. Use responsive layouts that work both standalone and embedded.
- Use German for learning content and controls. Keep exercise pages free of site navigation so they can serve directly as iframe content.
- For drag-and-drop exercises, also support selecting a label and a destination with clicks, touch, or keyboard. Provide feedback and a restart control.
- In the Wortarten tree, leaf order within each parent group does not affect correctness.
- Use clear language, semantic HTML, accessible controls, and keyboard support. Respect reduced-motion preferences for animations.
- Keep code readable and changes small. Check that navigation, standalone pages, and iframe embedding work after relevant changes.
