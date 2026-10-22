# Character asset provenance

The original collection atlas is retained. See [ANIMATION.md](ANIMATION.md) for the new six-pose animation atlas used during combat.

Generated with the built-in Imagegen tool from the two character images supplied by the user. Final project asset: `dist/assets/heroes.png`.

The generated image preserves the eight character concepts while adapting their poses and composition; it is not a pixel-identical extraction of the supplied art. The transparent output was copied into the project unchanged. The environment is original procedural Canvas artwork.

## Final Imagegen prompt

Use case: identity-preserve. Asset: transparent sprite atlas for a browser pixel fantasy game. Use both supplied character sheets as character identity references. Create exactly eight full-body pixel art characters, ONE per equal cell, arranged exactly FOUR COLUMNS by TWO ROWS in a wide 1536x1024 transparent image. All feet at same relative baseline, all characters centered in their cell, ample transparent padding, no overlap. Row 1 left to right: silver armored knight with red cape and sword (reference 2), green hooded archer (reference 2), purple masked ninja (reference 2), elderly bearded purple wizard (reference 1). Row 2 left to right: purple blue star staff female mage (reference 2), white gold hooded cleric (reference 1), flame armored red gold sword knight (reference 1), purple gold clock staff female chronomancer (reference 1). Preserve their exact recognizable colors clothing faces equipment and detailed pixel art. Neutral standing three-quarter pose facing right, ready for animation. One figure in each cell only. No labels, no text, no floors, no shadows outside sprites, genuinely transparent background. Crisp pixel clusters no blur. Consistent sprite scale fitting inside 75 percent cell height and 80 percent cell width.
