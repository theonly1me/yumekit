export function OwnPictureButton(props: {
  locked: boolean;
  onFile: (file: File) => Promise<void>;
}) {
  return (
    <label className="file-button" data-off={String(props.locked)}>
      Use my own picture
      <input
        type="file"
        accept="image/*"
        disabled={props.locked}
        onChange={(event) => {
          const input = event.currentTarget;
          const [file] = input.files ?? [];
          if (file === undefined) return;
          props
            .onFile(file)
            .finally(() => {
              input.value = "";
            })
            .catch(() => undefined);
        }}
      />
    </label>
  );
}
