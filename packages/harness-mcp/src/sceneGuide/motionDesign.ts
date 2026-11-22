export const motionDesignSection = `## Motion design

A scene that only fades in looks like a slide. Follow these rules in each custom scene. Example 1 follows all of them.

1. One idea in each scene. A scene of 2 to 4 seconds holds one headline or one number.
2. A scene has three parts: it comes in during the first 20 to 30 percent, it holds, and its last 10 percent is quiet for the transition. Use \`holdSplit\`, and fit the motion with \`paceFrame\`.
3. The eye goes to the largest thing first. One thing is the largest. One accent color in a scene: \`stylePack.colors.accent\`.
4. Things come in one after another, never all at once. Use \`sequence\` for the start frames, not numbers that you write by hand. A stagger is 3 to 6 frames at 30 frames each second for small things (\`eachSeconds\` 0.1 to 0.2), and 8 to 12 for lines of text (\`eachSeconds\` 0.27 to 0.4).
5. Nothing is still. Draw \`<Backdrop />\` first, and give the main thing a \`drift\` for the whole scene.
6. Text is large. A headline uses 60 to 80 percent of the width. A viewer reads on a phone.
7. A number counts up (\`countUp\`). A list builds (\`sequence\`). A comparison shows the old side first.
8. Take each color and each font from the look. Keep the caption area free.
9. Each platform shape gets its own layout: stack in tall, side by side in wide. Read \`layout\` from useSceneContext. Text stays left aligned in each layout.
10. Check each scene with \`preview_scenes\` in each output (wide and tall): at the frame after it settles (no \`frame\`), and at one frame during its entry (\`frame\` 10). Correct each defect that you see.

### Fit the motion to the clip

All times of the functions below are in seconds, and all frames are scene frames. Each function is pure.

1. Plan the motion at full speed. Compute \`settleFrame\`: the frame where the last thing has come in (its start frame plus its length).
2. Call \`const motionFrame = paceFrame({ frame, durationFrames, settleFrame })\`. In a short clip it runs faster, and a clip of 1 frame shows the settled picture.
3. Pass \`motionFrame\` to \`enter\`, \`words\`, \`draw\`, \`countUp\`, \`typed\`, and \`pulse\`. Pass the real \`frame\` to \`drift\`.
4. Give each function \`unit\` from useSceneContext. Without it, a distance is in pixels for a small picture.
5. A settled style has \`transform: "none"\`. Never join two transform strings. Put each motion on its own element: for example drift on the outer element, \`enter\` on a child, \`pulse\` on a grandchild.

### The functions of @yumekit/scene-kit/motion

\`MotionStyle\` is \`{ opacity: number; transform: string; filter?: string; clipPath?: string }\`. Spread it into \`style\`.

- \`enter({ frame, framesPerSecond, startFrame?, kind?, durationSeconds?, unit?, distanceUnits?, calm? }): MotionStyle\`. The style of a thing that comes in. \`kind\`: "rise" (default), "fade", "scale", "slide-left", "slide-right", "blur", "wipe", "pop". Defaults: startFrame 0, durationSeconds 0.6, distanceUnits 5. Use "pop" for a dot or an icon, "scale" for a number or a picture, "rise" or "slide-left" for a line of text.
- \`exit({ frame, framesPerSecond, endFrame, kind?, durationSeconds?, unit?, distanceUnits?, calm? }): MotionStyle\`. The reverse of \`enter\`, which ends at \`endFrame\`. You rarely need it: a transition takes the scene out.
- \`sequence({ count, framesPerSecond, startFrame?, eachSeconds?, itemSeconds?, durationFrames? }): number[]\`. The start frame of each of \`count\` items. Defaults: eachSeconds 0.15, itemSeconds 0.6. With \`durationFrames\`, the stagger shrinks so the last item settles by 70 percent of the clip. Leave \`durationFrames\` out when you use \`paceFrame\`.
- \`words({ text, frame, framesPerSecond, startFrame?, kind?, unit?, distanceUnits?, calm?, eachSeconds?, wordSeconds? }): { words: { text: string; startFrame: number; style: MotionStyle }[]; settleFrame: number }\`. A headline that comes in word by word. Defaults: eachSeconds 0.09, wordSeconds 0.6. Draw each word as \`<span style={{ display: "inline-block", ...word.style }}>\` with a space between the words, inside the one element that has \`data-text-prop\`. \`settleFrame\` does not change with \`frame\`.
- \`typed({ text, frame, framesPerSecond, startFrame?, charactersPerSecond?, blinkSeconds? }): { shown: string; cursorVisible: boolean; done: boolean }\`. A line that is typed, for a request or a search. Default: 24 characters each second.
- \`countUp({ frame, framesPerSecond, to, from?, startFrame?, durationSeconds?, fractionDigits?, prefix?, suffix? }): { value: number; text: string }\`. A number that runs up and settles. Default durationSeconds 1.2. \`text\` has the format, for example "$1,250".
- \`drift({ frame, framesPerSecond, durationFrames, kind?, amount?, unit?, seed?, calm? }): { x: number; y: number; scale: number; rotate: number; transform: string }\`. A slow move for the whole clip. \`kind\`: "scale" (default), "move", "turn". The move is largest at frame 0 and rests at the last frame. Put \`transform\` on the main element, with a \`transformOrigin\`.
- \`pulse({ frame, framesPerSecond, atFrame, amount?, durationSeconds? }): number\`. A scale of 1, which grows a little after \`atFrame\` and comes back. Defaults: amount 0.08, durationSeconds 0.4. Use it as \`transform: "scale(" + String(value) + ")"\` to mark the moment a number settles.
- \`draw({ frame, framesPerSecond, startFrame?, durationSeconds? }): number\`. The share from 0 to 1 of a line that is drawn. Default durationSeconds 0.7. Use it as a width in percent, or on an SVG path with \`pathLength={1} strokeDasharray={1} strokeDashoffset={1 - share}\`. Draw the line only when the share is above 0.02: a round end shows as a dot at the start.
- \`holdSplit({ durationFrames }): { in: FrameRange; hold: FrameRange; out: FrameRange; settleFrame: number }\`. \`FrameRange\` is \`{ startFrame: number; endFrame: number }\`. "in" ends at 25 percent of the last frame, "out" starts at 90 percent, and \`settleFrame\` is at 70 percent.
- \`paceFrame({ frame, durationFrames, settleFrame }): number\`. The frame to pass to the other functions, as above.

Leave \`calm\` out.

### Backdrop from @yumekit/scene-kit

\`<Backdrop seed?={string} kind?={"flat" | "glow" | "grid" | "grain"} />\` draws the moving background of the look. Leave \`kind\` out, so the look decides it. Give each scene its own \`seed\`, for example its scene id, so two scenes of one video differ. Draw it as the first child of the root element. Backdrop fills its parent with \`position: "absolute"\`, so put the content in a second element with \`position: "absolute", inset: 0\`, or the backdrop covers it.
`;
