export const serverInstructions = `yumekit builds video content in one project folder. Every change goes through these tools. All time is in whole frames at the frame rate of the project; media tool inputs use seconds.

Work in this order:
1. Call get_project, list_kit_scenes, and list_media_tools.
2. Write the script with set_script and the style with set_bible.
3. Add each scene with put_scene. Prefer a kit scene. Call get_scene_guide before you write custom code, and follow its part Motion design. Check each new scene with preview_scenes twice: with frame 10 for its entry, and with no frame for its settled picture.
4. Make the narration with generate_asset (capability "speech"). Read the word timings with get_asset_words to set the length of each scene.
5. Make the images with generate_asset (capability "image"). Put the style of the bible in each prompt.
6. For a shot that code cannot draw, make a still image first. Check it with the person or with preview_frame. Then call generate_asset with the capability "video" and first_frame_asset_id, and add the clip with place_video.
7. Build the timeline with set_timeline, one output at a time. Add each narration with place_narration (with_captions true for captions). Use copy_timeline for the next output, then change it. Call set_transitions once for the whole video, not once for each clip.
8. Check frames with preview_frames. Correct each scene that has a defect.
9. Call render_video for each output.

A failed call returns kind, message, and hint. The hint says what to call or change next. undo reverts the last change.`;
