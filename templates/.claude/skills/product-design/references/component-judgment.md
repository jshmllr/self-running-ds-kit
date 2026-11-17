# Component judgment

Which component to use for a UI problem. Every rule follows the format in `SKILL.md`
§ Rule format and carries a `Source:` you can verify.

<!-- KIT NOTE: start with ONE surface you have evidence for (often choice controls: when a
     select, a segmented control, a radio group or tabs). An honest short file beats a
     long invented one. The example below shows the shape; replace it. -->

## Choice controls

### rule/choice-control-by-option-count

**Rule:** Up to three static options: a segmented control or radio group; more, or options
loaded at runtime: a select.
**Source:** <!-- decisions/NNNN-..., or the PR that settled it -->
**Why:** A select hides two or three options behind a click and a scan; a segmented
control with eight options wraps or truncates and loses its at-a-glance comparison.
**Exceptions:** A field that must match a form of similar fields keeps that form's
control.

Bad: a `Select` with three static options "Low / Medium / High".
Good: a `SegmentedControl` with the same three.

## Labels and badges

### rule/static-label-must-not-look-interactive

**Rule:** A static label (a tag or badge) renders flat and borderless; only an actionable
one carries a border, shadow, or hover state.
**Source:** <!-- -->
**Why:** Users click things that look clickable; a bordered static label wastes the click
and teaches them that affordances lie.
**Exceptions:** none.

Bad: a category tag with a border and a hover colour that does nothing on click.
Good: a flat tag; a removable tag with a border and a real remove button.
