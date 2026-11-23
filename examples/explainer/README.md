# The explainer video

This folder is the yumekit project of the 15 second video at the top of the [README](../../README.md). yumekit made the video, and you can open it, change it, and export it again.

## Open it

```sh
yumekit open examples/explainer
```

The editor shows five scenes and the voice. Click a heading in the preview to change it, or click "Export" for a new MP4. A render needs no key and no download, because the voice is already in the folder.

## How it was made

An agent made the project with the yumekit tools (`yumekit mcp`), as any agent can. No file of the project was written by hand.

1. The pictures in the window are real screenshots of yumekit at 1440 by 900 in the dark theme: the start screen, the Making screen, and the editor. A small video project about sleep was made first, so each screen shows a real state.
2. `import_asset` added the screenshots, three frames of the exported files of that project (YouTube, TikTok, and Square), and the font Geist.
3. `put_scene` added five custom scenes. Three of them use the same code, with other screenshots and another camera move. The colors are the colors of the yumekit app, so the video looks like the product.
4. `generate_asset` recorded one line for each scene with the natural voice Heart. The name has a pronunciation: `{"yumekit": "you may kit"}`.
5. `set_timeline`, `place_narration`, and `set_transitions` put the scenes, the voice, and a short fade together.
6. `preview_scenes` checked each scene during its entry and after it settled, and `render_video` made the MP4.

## The font

The scenes use Geist, the font of the yumekit app. The font is an asset of the project (`assets/files/font-geist.woff2`), and each scene loads it with `FontFace` before the first frame. Geist has the SIL Open Font License, in [Geist-LICENSE.txt](Geist-LICENSE.txt).
