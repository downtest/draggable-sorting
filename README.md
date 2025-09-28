# Draggable-sorting native JS module

A lightweight, high-performance, and configurable drag and drop library built with pure JavaScript,
no dependencies required.

[Demo](https://downtest.github.io/)

## Installation

### NPM
```bash
npm install drag-drop-module
```

### Yarn
```bash
yarn add drag-drop-module
```

# Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **containerSelector** | `string` | `'.container'` | CSS selector for the container element that holds sortable items |
| **itemSelector** | `string` | `'.item'` | CSS selector for draggable/sortable items within the container |
| **handleSelector** | `string` \| `null` | `null` | CSS selector for drag handle element. If null, the entire item is draggable |
| **ghostClass** | `string` | `'item-ghost'` | CSS class applied to the drop position indicator element |
| **draggingClass** | `string` | `'item-dragging'` | CSS class applied to the original element during dragging |
| **cloneClass** | `string` | `'item-clone'` | CSS class applied to the element that follows the cursor |
| **dragDelay** | `number` | `100` | Delay in milliseconds before drag operation starts |
| **scrollSpeed** | `number` | `10` | Scroll speed when dragging near container edges (pixels per frame) |
| **scrollThreshold** | `number` | `50` | Distance from container edge in pixels to trigger auto-scrolling |

| **dragThreshold** | `number` | `5` | Minimum pixels to move before drag operation starts |


## Usage example
#### Html
```html
<div class="container">
    <div class="item">
        <div class="item--title">First</div>
        <div class="item--children container"></div>
    </div>
    <div class="item">
        <div class="item--title">Second</div>
        <div class="item--children container">
            <div class="item">
                <div class="item--title">Sub-First</div>
                <div class="item--children container"></div>
            </div>
            <div class="item">
                <div class="item--title">Sub-Second</div>
                <div class="item--children container"></div>
            </div>
            <div class="item">
                <div class="item--title">Sub-Third</div>
                <div class="item--children container"></div>
            </div>
        </div>
    </div>
    <div class="item">
        <div class="item--title">Third</div>
        <div class="item--children container"></div>
    </div>
</div>
```

#### JS
```js
    import draggableSorting from './draggable-sorting';

    const dragManager = draggableSorting({
        containerSelector: '.container',
        itemSelector: '.item',
        ghostClass: 'item-ghost',
        draggingClass: 'item-dragging',
        // handleSelector: '.item-handle',
        dragDelay: 150,
        animation: false,
    });

    // Подписка на события
    document.querySelector('.container').addEventListener('dragStart', (e) => {
        console.log('Drag started', e);
    });
    document.querySelector('.container').addEventListener('dragEnd', (e) => {
        console.log('Drag ended', e);
    });
```