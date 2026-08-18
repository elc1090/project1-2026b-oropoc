# Remake Image Annotator

A small client-side image annotation app built with plain HTML, CSS and JavaScript.

## Features

- Open a folder of images using the browser file picker.
- Add individual image files.
- Capture/add an image using the device camera when supported by the browser.
- Mouse-wheel zoom and touch pinch zoom.
- Pan by dragging empty space.
- Draw, select, move, resize and delete rectangular annotations.
- Add one text tag to each rectangle.
- Coordinates are stored in pixels relative to the original full-resolution image.
- Export all annotations as JSON or CSV.

## Running

Open `index.html` directly in a modern browser, or serve the folder with any static web server.

For example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Browser notes

Folder selection uses the widely supported `webkitdirectory` file-input attribute. Camera capture depends on browser/device support for `capture="environment"`. Both features stay entirely client-side; selected image files are not uploaded anywhere by this app.
