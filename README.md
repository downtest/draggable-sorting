# Draggable-sorting native JS module

##Usage example
####Html
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

####JS
```js
    import draggableSorting from './draggableSorting';

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