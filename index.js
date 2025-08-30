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
        dragDelayTimer: null
    };

    // Основные элементы
    if (!state.container) return;

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

    const updateDropTarget = (event) => {
        const containerRect = state.container.getBoundingClientRect();
        const {x, y} = getCoordinates(event)

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
            removeGhostElement()
            createGhostElement(itemContainer, 'in')
        } else if (itemElement) {
            // Мы нашли один из элементов
            removeGhostElement();

            const rect = itemElement.getBoundingClientRect()
            // const innerX = x - rect.left; //x position within the element.
            const innerY = y - rect.top;  //y position within the element.

            if (rect.height / 2 > innerY) {
                // Верхняя часть элемента
                createGhostElement(itemElement, 'before')
            } else {
                // Нижняя часть элемента
                createGhostElement(itemElement, 'after')
            }
        } else if (itemContainer) {
            // Мы нашли контейнер
            removeGhostElement();
            createGhostElement(itemContainer, 'in')
        }
    };

    function createGhostElement(referenceElement, position) {
        const positionIndex = ['before', 'after', 'in'].indexOf(position)
        if (positionIndex === -1) {
            throw new Error('Parameter "position" must be string "before", "after" on "in"');
        }

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
        const scrollThreshold = 50; // Пиксели от края для активации скролла
        const scrollSpeed = 10;

        if (y < containerRect.top + scrollThreshold) {
            // Скролл вверх
            state.container.scrollTop -= scrollSpeed;
        } else if (y > containerRect.bottom - scrollThreshold) {
            // Скролл вниз
            state.container.scrollTop += scrollSpeed;
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
        updateDropTarget(e);
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
