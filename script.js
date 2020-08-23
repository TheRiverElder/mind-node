/**
 * 生成一个ID，目前以时间为ID
 * @returns {*} 新的ID
 */
function genId() {
    return Date.now();
}

const NODE_CONTAINER = document.getElementById('node-container');

const NODES = {};

const DRAG_STATE = {
    id: null,
    startOffsetX: 0, // 开始时候鼠标相对于节点元素的偏移量
    startOffsetY: 0, 
};

NODE_CONTAINER.addEventListener('dragend', event => {
    if (DRAG_STATE.id) {
        const x = event.offsetX - DRAG_STATE.startOffsetX;
        const y = event.offsetY - DRAG_STATE.startOffsetY;
        NODES[DRAG_STATE.id].moveTo(x, y);
        DRAG_STATE.id = null;
    }
});








function createNode() {
    const node = {
        id: genId(),
        el: null,
        moveTo(x, y) {
            this.el.style.left = x + 'px';
            this.el.style.top = y + 'px';
        }
    };

    node.el = createNodeEl(node);
    return node;
}

function createNodeEl(node) {
    const el = Object.assign(document.createElement('div'), {
        id: node.id,
        className: 'node white-bg round shadow',
        draggable: true
    });

    const handle = Object.assign(document.createElement('div'), {className: 'drag-bar'});
    handle.appendChild(Object.assign(document.createElement('div'), {className: 'drag-bar-icon round'}));
    el.appendChild(handle);

    const content = Object.assign(document.createElement('div'), {className: 'content pa-p5', innerText: 'TEXT'});
    el.appendChild(content);

    const actionBar = Object.assign(document.createElement('div'), {className: 'node-button-bar fill-width d-flex align-items-center'});
    actionBar.appendChild(Object.assign(document.createElement('button'), {className: 'flex-grow-1', innerText: 'Edit'}));
    actionBar.appendChild(Object.assign(document.createElement('button'), {className: 'flex-grow-1', innerText: 'Delete'}));
    actionBar.appendChild(Object.assign(document.createElement('div'), {className: 'node-handle'}));
    el.appendChild(actionBar);


    el.addEventListener('dragstart', event => {
        DRAG_STATE.id = node.id;
        DRAG_STATE.startOffsetX = event.offsetX - el.offsetLeft;
        DRAG_STATE.startOffsetY = event.offsetY - el.offsetTop;
    });
    el.addEventListener('mousedown', event => {
        console.log('mousedown', event);
    });
    return el;
}

function createAndAppendNode() {
    const node = createNode();
    NODES[node.id] = node;
    NODE_CONTAINER.appendChild(node.el);
}

createAndAppendNode();