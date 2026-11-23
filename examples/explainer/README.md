# The explainer video

This folder is the yumekit project of the 30 second video at the top of the [README](../../README.md). yumekit made the video, and you can open it, change it, and export it again.

## Open it

```sh
yumekit open examples/explainer
```

The editor shows ten scenes and the voice. Click a heading in the preview to change it, or click "Export" for a new MP4. A render needs no key and no download, because the voice and all the footage are in the folder.

## What is in the film

The film is cut on a grid of 120 beats each minute. One beat is 15 frames at 30 frames each second, and each cut falls on a beat or on a half beat.

| Time       | Scene     | What it shows                                                                             |
| ---------- | --------- | ----------------------------------------------------------------------------------------- |
| 0 to 3     | `hook`    | "An idea." "A sentence." "A finished video." A wall of real videos opens on the last line |
| 3 to 5.5   | `type`    | The real start screen: the idea is typed, and "Make the video" is clicked                 |
| 5.5 to 8   | `making`  | The real Making screen while each step becomes done                                       |
| 8 to 12    | `montage` | Three real example videos, cut on each beat and half beat                                 |
| 12 to 15   | `shapes`  | The same video for YouTube, TikTok, and Square, all three playing                         |
| 15 to 17   | `edit`    | A click on the heading in the editor preview, and new words                               |
| 17 to 19.5 | `look`    | A new look in Settings, and the preview in that look                                      |
| 19.5 to 22 | `yours`   | A transition picked, and the export of three files on this computer                       |
| 22 to 27   | `facts`   | 19 scene types and 5 looks, a voice with no key, any model, no account                    |
| 27 to 30   | `end`     | The name, "Open source.", and `npm install -g yumekit` typed in a pill                    |

The film works with the sound off. Each line of the voice is also on the screen.

## How it was made

An agent made the project with the yumekit tools (`yumekit mcp`), as any agent can. No file of the project was written by hand.

1. Three small projects came first, each with kit scenes, motion, and transitions, in three shapes: a product ad in `midnight`, three numbers about the ocean in `neon`, and a calm coffee explainer in `editorial`. `render_video` exported them. Their wide exports are the assets `example-ad`, `example-numbers`, and `example-coffee`.
2. Playwright recorded the running app in the dark theme at 2880 by 1800: the idea typed on the start screen, the Making screen while a stand-in agent called the real tools (so the steps really ran, and Heart really recorded the voice), a heading changed in the preview, two new looks in Settings, a transition, and the Export sheet. The cuts of that recording are the assets `rec-type`, `rec-making`, `rec-edit`, `rec-look`, `rec-transition`, and `rec-export`. The project of that session, exported in three shapes, is `hoshi-youtube`, `hoshi-tiktok`, and `hoshi-square`.
3. `import_asset` added each video and the font Geist.
4. `put_scene` added ten custom scenes. Five scenes use the same code (`screen`), with other footage, other cuts, and another camera path. A camera path is a list of points in the recording, and each cut of the recording plays at its own speed.
5. `generate_asset` recorded one line of the script for each cut with the natural voice Heart. The name has a pronunciation: `{"yumekit": "you may kit"}`.
6. `set_timeline` put the scenes, the twelve voice lines, and an empty music track together. `preview_frames` and three rounds of contact sheets checked each scene, and `render_video` made the MP4.

## Change the voice or add music later

The voice and the music are each one call. The script has one line for each voice clip, so a new voice keeps each line where it starts now.

- A new voice: `replace_narration` with `voice`, and with `server` and `model` when the voice is on a paid service. It records each line of the script again and puts it in the place of the old line.
- Music: `replace_music` with a `prompt` (for example "Warm electronic pulse at 120 beats each minute"), or with `asset_id` for a file of your own. It fills the music track for the whole video and changes nothing else.

The cuts are on a beat of 120 beats each minute, so music at that tempo lands on the cuts.

## The font

The scenes use Geist, the font of the yumekit app. The font is an asset of the project (`assets/files/font-geist.woff2`), and each scene loads it with `FontFace` before the first frame. Geist has the SIL Open Font License, in [Geist-LICENSE.txt](Geist-LICENSE.txt).
