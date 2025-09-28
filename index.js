export default function draggableSorting(options = {}) {
    // Конфигурация с вашими параметрами
    const config = {
        containerSelector: '.container',
        itemSelector: '.item',
        ghostClass: 'item-ghost',
        draggingClass: 'item-dragging',
        cloneClass: 'item-clone',
        handleSelector: null,
        dragDelay: 100,
        scrollSpeed: 10,
        scrollThreshold: 50,
        debug: false,
        ...options
    };

    // Состояние
    const state = {
        container: document.querySelector(config.containerSelector),
        isDragging: false,
        draggedItem: null,
        ghostItem: null,
        dragItemCopy: null,
        currentDropTarget: null,
        startX: 0,
        startY: 0,
        dragDelayTimer: null,
        fromIndex: null,
        fromContainer: null,
        toIndex: null,
        toContainer: null,
        debugContainer: null,
        debugElement: null, // row/cursor/element/level
    };

    // Основные элементы
    if (!state.container) return;

    if (config.debug) {
        const debugInfo = document.createElement('div');
        debugInfo.classList.add('ds-debug-info');

        state.debugContainer = document.createElement('div');
        state.debugContainer.classList.add('ds-debug-container');
        state.debugContainer.id = 'ds-debug-container';

        state.debugElement = document.createElement('div');
        state.debugElement.classList.add('ds-debug-cursor-level');
        state.debugElement.id = 'ds-debug-cursor-level';

        const debugStyle = document.createElement('style');
        debugStyle.textContent = `
            .ds-debug-info {
                position: fixed;
                width: 150px;
                height: 150px;
                background-color: #fff;
                border: 1px solid #ccc;
                display: flex;
                padding: 20px 40px;
                right: 0;
                bottom: 0;
            }
            .ds-debug-container {
                width: 100%;
                height: 100%;
                position: relative;
                background-color: #f0f0f0;
            }
            .ds-debug-cursor-level {
                position: absolute;
                top: 0;
                width: 100%;
                height: 2px;
                background-color: #000;
            }
        `;

        document.head.appendChild(debugStyle);
        document.body.appendChild(debugInfo);
        debugInfo.appendChild(state.debugContainer);
        state.debugContainer.appendChild(state.debugElement);
    }

    const style = document.createElement('style');
    style.textContent = `
        .item-clone {
            position: fixed;
            cursor: grabbing;
        }
        .item-dragging {
            display: none;
        }
        .item-ghost {
            opacity: 0.5;
            background-color: #eee;
            border: 1px dashed #ccc;
        }
    `;
    document.head.appendChild(style);

    // Вспомогательные функции
    const getCoordinates = (e) => {
        const isTouch = e.type.includes('touch');
        return {
            x: isTouch ? e.touches[0].clientX : e.clientX,
            y: isTouch ? e.touches[0].clientY : e.clientY
        };
    };

    const startDrag = (item, x, y) => {
        state.draggedItem = item;
        state.dragItemCopy = item.cloneNode(true);

        // Скрываем оригинальный элемент (но сохраняем его место)
        item.classList.add(config.draggingClass);

        if (item.parentElement.matches(config.containerSelector)) {
            state.fromIndex = Array.from(item.parentElement.children).indexOf(item)
            state.fromContainer = item.parentElement
        }

        // Создаем элемент, который будет следовать за курсором
        state.ghostItem = state.dragItemCopy.cloneNode(true);
        state.ghostItem.classList.add(config.cloneClass);
        Object.assign(state.ghostItem.style, {
            left: `${x}px`,
            top: `${y}px`,
        });

        document.body.appendChild(state.ghostItem);
        state.isDragging = true;

        updateDropTarget(x, y);

        state.container.dispatchEvent(new CustomEvent('dragStart', {
            detail: {
                item,
                fromIndex: state.fromIndex,
                fromContainer: state.fromContainer,
            },
        }));
    };

    const moveGhost = (x, y) => {
        // Полная проверка всех возможных проблем
        if (!state?.ghostItem?.style) {
            console.warn('Ghost item not available for movement');
            return;
        }

        // Захватываем текущие значения в момент вызова
        const validX = Number.isFinite(x) ? x : 0;
        const validY = Number.isFinite(y) ? y : 0;

        requestAnimationFrame(() => {
            // Повторная проверка, так как состояние могло измениться
            if (!state.ghostItem?.style) return;

            try {
                state.ghostItem.style.left = `${validX}px`;
                state.ghostItem.style.top = `${validY}px`;
            } catch (e) {
                console.error('Failed to move ghost:', e);
            }
        });
    };

    const updateDropTarget = (x, y) => {
        const containerRect = state.container.getBoundingClientRect();

        // Обработка скроллинга при приближении к краям контейнера
        handleContainerScrolling(containerRect, y)

        const elementsUnderPointer = document.elementsFromPoint(x, y)
        const itemElement = elementsUnderPointer.find(el => el.matches(config.itemSelector))

        if (itemElement && (itemElement === state.ghostItem || itemElement === state.currentDropTarget)) {
            // skip
            return
        }

        const itemContainer = elementsUnderPointer.find(el => el.matches(config.containerSelector))

        // Проверяем элемент, на который навели, либо его родителя
        if (itemContainer && itemContainer.children.length === 0) {
            // Пустой контейнер
            createGhostElement(itemContainer, 'in')
        } else if (itemElement) {
            // Мы нашли один из элементов
            const rect = itemElement.getBoundingClientRect()
            // const innerX = x - rect.left; //x position within the element.
            const innerY = y - rect.top;  //y position within the element.
            const levelWithinElement = (innerY * 100) / rect.height;

            if (config.debug) {
                // TODO: считать в процентахs
                let debugContainerHeigth = state.debugContainer.getBoundingClientRect().height;
                document.getElementById('ds-debug-cursor-level').style = `top: ${levelWithinElement}%;`;
            }


            if (levelWithinElement < 51) {
                // Top part of the element
                createGhostElement(itemElement, 'before')
            } else {
                // Bottom part of the element
                createGhostElement(itemElement, 'after')
            }

            // Для nested items
//            if (innerY > third * 2) {
//                // Нижняя часть элемента
//                console.log(`${innerY} > ${third * 2}`, `Нижняя часть элемента`);
//                createGhostElement(itemElement, 'after')
//            } else if (innerY < third) {
//                // Верхняя часть элемента
//                console.log(`${innerY} < ${third}`, `Верхняя часть элемента`);
//                createGhostElement(itemElement, 'before')
//            } else {
//                // Средняя часть элемента
//                console.log(`else`, `Средняя часть элемента`);
//                createGhostElement(Array.from(itemElement.children).find((child => child.matches(config.containerSelector))), 'in')
//            }
        } else if (itemContainer) {
            // Мы нашли НЕ пустой контейнер
//            createGhostElement(itemContainer, 'in')
        }
    };

    function createGhostElement(referenceElement, position) {
        const positionIndex = ['before', 'after', 'in'].indexOf(position)
        if (positionIndex === -1) {
            throw new Error('Parameter "position" must be string "before", "after" on "in"');
        }

        removeGhostElement();

        state.currentDropTarget = state.dragItemCopy.cloneNode(true);
        state.currentDropTarget.classList.add(config.ghostClass);

        if (positionIndex === 2) {
            // in
            referenceElement.appendChild(state.currentDropTarget);
        } else if (positionIndex === 0) {
            // before
            referenceElement.before(state.currentDropTarget);
        } else {
            // after
            referenceElement.after(state.currentDropTarget);
        }
    }

    function removeGhostElement() {
        if (state.currentDropTarget) {
            state.currentDropTarget.remove();
            state.currentDropTarget = null;
        }
    }

    function handleContainerScrolling(containerRect, y) {
        if (y < containerRect.top + config.scrollThreshold) {
            // Scroll up
            state.container.scrollTop -= config.scrollSpeed;
        } else if (y > containerRect.bottom - config.scrollThreshold) {
            // Scroll down
            state.container.scrollTop += config.scrollSpeed;
        }
    }

    const stopDrag = () => {
        // Вставляем элемент на новое место
        if (state.currentDropTarget?.parentNode) {
            state.currentDropTarget.replaceWith(state.draggedItem);
            state.toIndex = Array.from(state.draggedItem.parentNode.children).indexOf(state.draggedItem)
            state.toContainer = state.draggedItem.parentNode
        }

        // Очистка
        if (state.ghostItem?.parentNode) {
            state.ghostItem.parentNode.removeChild(state.ghostItem);
        }

        if (state.currentDropTarget?.parentNode) {
            state.currentDropTarget.parentNode.removeChild(state.currentDropTarget);
        }

        state.draggedItem.classList.remove(config.draggingClass);

        state.container.dispatchEvent(new CustomEvent('dragEnd', {
            detail: {...state},
        }));

        // Сброс состояния
        state.isDragging = false;
        state.draggedItem = null;
        state.ghostItem = null;
        state.dragItemCopy = null;
        state.currentDropTarget = null;
    };

    // Обработчики событий
    const onPointerDown = (e) => {
        const target = e.target.closest(config.handleSelector || config.itemSelector);
        if (!target) return;

        const item = target.closest(config.itemSelector);
        if (!item) return;

        e.preventDefault();
        const { x, y } = getCoordinates(e);
        state.startX = x;
        state.startY = y;

        state.dragDelayTimer = setTimeout(() => {
            startDrag(item, x, y);
        }, config.dragDelay);
    };

    const onPointerMove = (e) => {
        if (!state.isDragging) return;
        e.preventDefault();

        const { x, y } = getCoordinates(e);
        moveGhost(x, y);
        updateDropTarget(x, y);
    };

    const onPointerUp = () => {
        clearTimeout(state.dragDelayTimer);
        if (state.isDragging) {
            stopDrag();
        }
    };

    // Инициализация
    state.container.addEventListener('mousedown', onPointerDown);
    state.container.addEventListener('touchstart', onPointerDown, { passive: false });

    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('touchmove', onPointerMove, { passive: false });

    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchend', onPointerUp);
    document.addEventListener('touchcancel', onPointerUp);

    // API для удаления
    return {
        destroy: () => {
            clearTimeout(state.dragDelayTimer);
            document.removeEventListener('mousemove', onPointerMove);
            document.removeEventListener('touchmove', onPointerMove);
            document.removeEventListener('mouseup', onPointerUp);
            document.removeEventListener('touchend', onPointerUp);
            document.removeEventListener('touchcancel', onPointerUp);
        }
    };
}
