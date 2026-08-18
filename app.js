(() => {
  'use strict';

  const folderInput = document.getElementById('folderInput');
  const fileInput = document.getElementById('fileInput');
  const cameraInput = document.getElementById('cameraInput');
  const imageList = document.getElementById('imageList');
  const imageCount = document.getElementById('imageCount');
  const viewport = document.getElementById('viewport');
  const stage = document.getElementById('stage');
  const mainImage = document.getElementById('mainImage');
  const overlay = document.getElementById('overlay');
  const emptyState = document.getElementById('emptyState');
  const annotationForm = document.getElementById('annotationForm');
  const annotationFormTemplate = document.getElementById('annotationFormTemplate');
  const selectToolBtn = document.getElementById('selectToolBtn');
  const drawToolBtn = document.getElementById('drawToolBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomResetBtn = document.getElementById('zoomResetBtn');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const imageStatus = document.getElementById('imageStatus');
  const annotationStatus = document.getElementById('annotationStatus');

  const state = {
    images: [],
    activeImageId: null,
    selectedAnnotationId: null,
    tool: 'select',
    scale: 1,
    panX: 0,
    panY: 0,
    pointerMode: null,
    pointerStart: null,
    pointerStartPan: null,
    workingAnnotation: null,
    activePointers: new Map(),
    pinchStartDistance: 0,
    pinchStartScale: 1,
    pinchAnchorImage: null,
    pinchAnchorViewport: null
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const activeImage = () => state.images.find(img => img.id === state.activeImageId) || null;
  const activeAnnotation = () => activeImage()?.annotations.find(a => a.id === state.selectedAnnotationId) || null;

  function addFiles(fileList) {
    const files = [...fileList].filter(file => file.type.startsWith('image/'));
    if (!files.length) return;

    for (const file of files) {
      const objectUrl = URL.createObjectURL(file);
      state.images.push({
        id: uid(),
        name: file.name || `camera-${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`,
        relativePath: file.webkitRelativePath || '',
        file,
        objectUrl,
        width: 0,
        height: 0,
        annotations: []
      });
    }

    renderImageList();
    if (!state.activeImageId && state.images.length) selectImage(state.images[0].id);

    folderInput.value = '';
    fileInput.value = '';
    cameraInput.value = '';
  }

  function renderImageList() {
    imageList.innerHTML = '';
    for (const image of state.images) {
      const button = document.createElement('button');
      button.className = `image-item${image.id === state.activeImageId ? ' active' : ''}`;
      button.type = 'button';
      button.innerHTML = `
        <img src="${image.objectUrl}" alt="" />
        <span class="image-meta">
          <span class="image-name" title="${escapeHtml(image.name)}">${escapeHtml(image.name)}</span>
          <span class="image-sub">${image.annotations.length} annotation${image.annotations.length === 1 ? '' : 's'}</span>
        </span>`;
      button.addEventListener('click', () => selectImage(image.id));
      imageList.appendChild(button);
    }
    imageCount.textContent = state.images.length;
  }

  function selectImage(id) {
    state.activeImageId = id;
    state.selectedAnnotationId = null;
    state.scale = 1;
    state.panX = 0;
    state.panY = 0;
    const image = activeImage();
    if (!image) return;

    mainImage.onload = () => {
      image.width = mainImage.naturalWidth;
      image.height = mainImage.naturalHeight;
      stage.style.width = `${image.width}px`;
      stage.style.height = `${image.height}px`;
      overlay.style.width = `${image.width}px`;
      overlay.style.height = `${image.height}px`;
      stage.style.display = 'block';
      emptyState.style.display = 'none';
      fitImageToViewport();
      renderAnnotations();
      renderImageList();
      updateStatus();
    };
    mainImage.src = image.objectUrl;
  }

  function fitImageToViewport() {
    const image = activeImage();
    if (!image?.width || !image?.height) return;
    const rect = viewport.getBoundingClientRect();
    const margin = 30;
    const fitScale = Math.min((rect.width - margin * 2) / image.width, (rect.height - margin * 2) / image.height, 1);
    state.scale = clamp(fitScale, 0.05, 10);
    state.panX = (rect.width - image.width * state.scale) / 2;
    state.panY = (rect.height - image.height * state.scale) / 2;
    applyTransform();
  }

  function applyTransform() {
    stage.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;
    zoomResetBtn.textContent = `${Math.round(state.scale * 100)}%`;
  }

  function viewportPointToImage(clientX, clientY) {
    const rect = viewport.getBoundingClientRect();
    return {
      x: (clientX - rect.left - state.panX) / state.scale,
      y: (clientY - rect.top - state.panY) / state.scale
    };
  }

  function setTool(tool) {
    state.tool = tool;
    selectToolBtn.classList.toggle('active', tool === 'select');
    drawToolBtn.classList.toggle('active', tool === 'draw');
    viewport.classList.toggle('drawing', tool === 'draw');
  }

  function renderAnnotations() {
    overlay.innerHTML = '';
    const image = activeImage();
    if (!image) return;

    for (const annotation of image.annotations) {
      const el = document.createElement('div');
      el.className = `annotation${annotation.id === state.selectedAnnotationId ? ' selected' : ''}`;
      el.dataset.id = annotation.id;
      el.style.left = `${annotation.x}px`;
      el.style.top = `${annotation.y}px`;
      el.style.width = `${annotation.width}px`;
      el.style.height = `${annotation.height}px`;

      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = annotation.tag || '(untagged)';
      el.appendChild(label);

      if (annotation.id === state.selectedAnnotationId) {
        for (const corner of ['nw', 'ne', 'sw', 'se']) {
          const handle = document.createElement('div');
          handle.className = `handle ${corner}`;
          handle.dataset.corner = corner;
          el.appendChild(handle);
        }
      }

      overlay.appendChild(el);
    }

    renderAnnotationForm();
    updateStatus();
  }

  function selectAnnotation(id) {
    state.selectedAnnotationId = id;
    renderAnnotations();
  }

  function renderAnnotationForm() {
    const annotation = activeAnnotation();
    deleteBtn.disabled = !annotation;
    if (!annotation) {
      annotationForm.className = 'annotation-form empty';
      annotationForm.innerHTML = '<p>Select an annotation to edit its tag.</p>';
      return;
    }

    annotationForm.className = 'annotation-form';
    annotationForm.innerHTML = '';
    annotationForm.appendChild(annotationFormTemplate.content.cloneNode(true));
    const tagInput = annotationForm.querySelector('#tagInput');
    tagInput.value = annotation.tag || '';
    tagInput.addEventListener('input', () => {
      annotation.tag = tagInput.value;
      const label = overlay.querySelector(`.annotation[data-id="${annotation.id}"] .label`);
      if (label) label.textContent = annotation.tag || '(untagged)';
    });

    for (const field of ['x', 'y', 'width', 'height']) {
      annotationForm.querySelector(`[data-field="${field}"]`).textContent = Math.round(annotation[field]);
    }
  }

  function updateStatus() {
    const image = activeImage();
    if (!image) {
      imageStatus.textContent = 'No image';
      annotationStatus.textContent = '0 annotations';
      return;
    }
    imageStatus.textContent = `${image.name} · ${image.width}×${image.height}px`;
    annotationStatus.textContent = `${image.annotations.length} annotation${image.annotations.length === 1 ? '' : 's'}`;
  }

  function startDraw(point) {
    const image = activeImage();
    if (!image) return;
    const x = clamp(point.x, 0, image.width);
    const y = clamp(point.y, 0, image.height);
    const annotation = { id: uid(), tag: '', x, y, width: 0, height: 0 };
    image.annotations.push(annotation);
    state.selectedAnnotationId = annotation.id;
    state.workingAnnotation = { annotation, startX: x, startY: y };
    state.pointerMode = 'draw';
    renderAnnotations();
  }

  function updateDraw(point) {
    const image = activeImage();
    const work = state.workingAnnotation;
    if (!image || !work) return;
    const x = clamp(point.x, 0, image.width);
    const y = clamp(point.y, 0, image.height);
    work.annotation.x = Math.min(work.startX, x);
    work.annotation.y = Math.min(work.startY, y);
    work.annotation.width = Math.abs(x - work.startX);
    work.annotation.height = Math.abs(y - work.startY);
    updateAnnotationElement(work.annotation);
  }

  function finishDraw() {
    const work = state.workingAnnotation;
    if (!work) return;
    if (work.annotation.width < 3 || work.annotation.height < 3) {
      const image = activeImage();
      image.annotations = image.annotations.filter(a => a.id !== work.annotation.id);
      state.selectedAnnotationId = null;
    }
    state.workingAnnotation = null;
    state.pointerMode = null;
    renderAnnotations();
    renderImageList();
  }

  function updateAnnotationElement(annotation) {
    const el = overlay.querySelector(`.annotation[data-id="${annotation.id}"]`);
    if (!el) return;
    el.style.left = `${annotation.x}px`;
    el.style.top = `${annotation.y}px`;
    el.style.width = `${annotation.width}px`;
    el.style.height = `${annotation.height}px`;
    renderAnnotationForm();
    updateStatus();
  }

  function startMove(annotation, point) {
    state.pointerMode = 'move';
    state.pointerStart = point;
    state.workingAnnotation = {
      annotation,
      original: { x: annotation.x, y: annotation.y, width: annotation.width, height: annotation.height }
    };
  }

  function updateMove(point) {
    const image = activeImage();
    const work = state.workingAnnotation;
    if (!image || !work) return;
    const dx = point.x - state.pointerStart.x;
    const dy = point.y - state.pointerStart.y;
    work.annotation.x = clamp(work.original.x + dx, 0, image.width - work.annotation.width);
    work.annotation.y = clamp(work.original.y + dy, 0, image.height - work.annotation.height);
    updateAnnotationElement(work.annotation);
  }

  function startResize(annotation, corner, point) {
    state.pointerMode = 'resize';
    state.pointerStart = point;
    state.workingAnnotation = {
      annotation,
      corner,
      original: { x: annotation.x, y: annotation.y, width: annotation.width, height: annotation.height }
    };
  }

  function updateResize(point) {
    const image = activeImage();
    const work = state.workingAnnotation;
    if (!image || !work) return;
    const { annotation, original, corner } = work;
    const minSize = 3;
    let left = original.x;
    let top = original.y;
    let right = original.x + original.width;
    let bottom = original.y + original.height;

    const x = clamp(point.x, 0, image.width);
    const y = clamp(point.y, 0, image.height);
    if (corner.includes('w')) left = Math.min(x, right - minSize);
    if (corner.includes('e')) right = Math.max(x, left + minSize);
    if (corner.includes('n')) top = Math.min(y, bottom - minSize);
    if (corner.includes('s')) bottom = Math.max(y, top + minSize);

    annotation.x = left;
    annotation.y = top;
    annotation.width = right - left;
    annotation.height = bottom - top;
    updateAnnotationElement(annotation);
  }

  function deleteSelected() {
    const image = activeImage();
    if (!image || !state.selectedAnnotationId) return;
    image.annotations = image.annotations.filter(a => a.id !== state.selectedAnnotationId);
    state.selectedAnnotationId = null;
    renderAnnotations();
    renderImageList();
  }

  function zoomAt(clientX, clientY, factor) {
    const image = activeImage();
    if (!image) return;
    const rect = viewport.getBoundingClientRect();
    const vx = clientX - rect.left;
    const vy = clientY - rect.top;
    const imageX = (vx - state.panX) / state.scale;
    const imageY = (vy - state.panY) / state.scale;
    const newScale = clamp(state.scale * factor, 0.05, 10);
    state.panX = vx - imageX * newScale;
    state.panY = vy - imageY * newScale;
    state.scale = newScale;
    applyTransform();
  }

  function zoomCenter(factor) {
    const rect = viewport.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  }

  function beginPan(clientX, clientY) {
    state.pointerMode = 'pan';
    state.pointerStartPan = { clientX, clientY, panX: state.panX, panY: state.panY };
    viewport.classList.add('panning');
  }

  function updatePan(clientX, clientY) {
    if (!state.pointerStartPan) return;
    state.panX = state.pointerStartPan.panX + (clientX - state.pointerStartPan.clientX);
    state.panY = state.pointerStartPan.panY + (clientY - state.pointerStartPan.clientY);
    applyTransform();
  }

  function endPointerOperation() {
    if (state.pointerMode === 'draw') finishDraw();
    state.pointerMode = null;
    state.pointerStart = null;
    state.pointerStartPan = null;
    state.workingAnnotation = null;
    viewport.classList.remove('panning');
  }

  viewport.addEventListener('pointerdown', event => {
    if (!activeImage()) return;
    viewport.setPointerCapture?.(event.pointerId);
    state.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (state.activePointers.size === 2) {
      const [a, b] = [...state.activePointers.values()];
      state.pinchStartDistance = Math.hypot(b.x - a.x, b.y - a.y);
      state.pinchStartScale = state.scale;
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const rect = viewport.getBoundingClientRect();
      state.pinchAnchorViewport = { x: cx - rect.left, y: cy - rect.top };
      state.pinchAnchorImage = {
        x: (state.pinchAnchorViewport.x - state.panX) / state.scale,
        y: (state.pinchAnchorViewport.y - state.panY) / state.scale
      };
      state.pointerMode = 'pinch';
      return;
    }

    const annotationEl = event.target.closest('.annotation');
    const handleEl = event.target.closest('.handle');
    const point = viewportPointToImage(event.clientX, event.clientY);

    if (state.tool === 'draw' && !annotationEl) {
      startDraw(point);
      return;
    }

    if (handleEl && annotationEl) {
      const annotation = activeImage().annotations.find(a => a.id === annotationEl.dataset.id);
      selectAnnotation(annotation.id);
      startResize(annotation, handleEl.dataset.corner, point);
      return;
    }

    if (annotationEl) {
      const annotation = activeImage().annotations.find(a => a.id === annotationEl.dataset.id);
      selectAnnotation(annotation.id);
      startMove(annotation, point);
      return;
    }

    state.selectedAnnotationId = null;
    renderAnnotations();
    beginPan(event.clientX, event.clientY);
  });

  viewport.addEventListener('pointermove', event => {
    if (!state.activePointers.has(event.pointerId)) return;
    state.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (state.activePointers.size >= 2 && state.pointerMode === 'pinch') {
      const [a, b] = [...state.activePointers.values()];
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      if (!state.pinchStartDistance) return;
      const nextScale = clamp(state.pinchStartScale * (distance / state.pinchStartDistance), 0.05, 10);
      state.scale = nextScale;
      state.panX = state.pinchAnchorViewport.x - state.pinchAnchorImage.x * nextScale;
      state.panY = state.pinchAnchorViewport.y - state.pinchAnchorImage.y * nextScale;
      applyTransform();
      return;
    }

    const point = viewportPointToImage(event.clientX, event.clientY);
    if (state.pointerMode === 'draw') updateDraw(point);
    else if (state.pointerMode === 'move') updateMove(point);
    else if (state.pointerMode === 'resize') updateResize(point);
    else if (state.pointerMode === 'pan') updatePan(event.clientX, event.clientY);
  });

  const pointerUp = event => {
    state.activePointers.delete(event.pointerId);
    if (state.pointerMode === 'pinch' && state.activePointers.size < 2) {
      state.pointerMode = null;
      state.pinchStartDistance = 0;
      return;
    }
    if (state.activePointers.size === 0) endPointerOperation();
  };

  viewport.addEventListener('pointerup', pointerUp);
  viewport.addEventListener('pointercancel', pointerUp);

  viewport.addEventListener('wheel', event => {
    if (!activeImage()) return;
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.0015);
    zoomAt(event.clientX, event.clientY, factor);
  }, { passive: false });

  viewport.addEventListener('dblclick', () => fitImageToViewport());

  document.addEventListener('keydown', event => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (document.activeElement?.tagName !== 'INPUT') deleteSelected();
    }
    if (event.key.toLowerCase() === 'd') setTool('draw');
    if (event.key.toLowerCase() === 's') setTool('select');
    if (event.key === 'Escape') {
      state.selectedAnnotationId = null;
      setTool('select');
      renderAnnotations();
    }
  });

  folderInput.addEventListener('change', event => addFiles(event.target.files));
  fileInput.addEventListener('change', event => addFiles(event.target.files));
  cameraInput.addEventListener('change', event => addFiles(event.target.files));
  selectToolBtn.addEventListener('click', () => setTool('select'));
  drawToolBtn.addEventListener('click', () => setTool('draw'));
  deleteBtn.addEventListener('click', deleteSelected);
  zoomOutBtn.addEventListener('click', () => zoomCenter(0.8));
  zoomInBtn.addEventListener('click', () => zoomCenter(1.25));
  zoomResetBtn.addEventListener('click', fitImageToViewport);

  exportJsonBtn.addEventListener('click', () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      images: state.images.map(image => ({
        fileName: image.name,
        relativePath: image.relativePath || null,
        width: image.width,
        height: image.height,
        annotations: image.annotations.map(a => ({
          id: a.id,
          tag: a.tag,
          x: round(a.x),
          y: round(a.y),
          width: round(a.width),
          height: round(a.height)
        }))
      }))
    };
    downloadBlob(JSON.stringify(data, null, 2), 'annotations.json', 'application/json');
  });

  exportCsvBtn.addEventListener('click', () => {
    const rows = [['file_name', 'relative_path', 'image_width', 'image_height', 'annotation_id', 'tag', 'x', 'y', 'width', 'height']];
    for (const image of state.images) {
      for (const a of image.annotations) {
        rows.push([
          image.name,
          image.relativePath || '',
          image.width,
          image.height,
          a.id,
          a.tag,
          round(a.x),
          round(a.y),
          round(a.width),
          round(a.height)
        ]);
      }
    }
    const csv = rows.map(row => row.map(csvCell).join(',')).join('\n');
    downloadBlob(csv, 'annotations.csv', 'text/csv;charset=utf-8');
  });

  window.addEventListener('resize', () => {
    if (activeImage()) applyTransform();
  });

  function round(value) { return Math.round(value * 100) / 100; }

  function csvCell(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));
  }
})();
