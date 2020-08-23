/**
 * 生成一个ID，目前以时间为ID
 * @returns {*} 新的ID
 */
function genId() {
    return Date.now();
}

function stopBubble(event) {
    console.log(event);
    event.stopPropagation();
}

const NODE_CONTAINER = document.getElementById('node-container');

const NODES = {};

const DRAG_STATE = {
    id: null,
    startOffsetX: 0, // 开始时候鼠标相对于节点元素的偏移量
    startOffsetY: 0, 
};

const LINK_STATE = {
    id: null,
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
        },
        getPort() {
            
        },
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

    const hdlMove = Object.assign(document.createElement('div'), {className: 'drag-bar'});
    hdlMove.appendChild(Object.assign(document.createElement('div'), {className: 'drag-bar-icon round'}));
    el.appendChild(hdlMove);

    const content = Object.assign(document.createElement('div'), {className: 'content pa-p5'});
    const txtContent = Object.assign(document.createElement('span'), {innerText: 'TEXT'});
    const iptContent = Object.assign(document.createElement('textarea'), {className: 'hidden'});
    iptContent.addEventListener('mousedown', stopBubble);
    content.appendChild(txtContent);
    content.appendChild(iptContent);
    el.appendChild(content);

    const actionBar = Object.assign(document.createElement('div'), {className: 'node-button-bar fill-width d-flex align-items-center'});
    const btnEditOrDone = Object.assign(document.createElement('button'), {className: 'flex-grow-1', innerText: 'Edit'});
    const btnDelete = Object.assign(document.createElement('button'), {className: 'flex-grow-1', innerText: 'Delete'});
    const hdlLink = Object.assign(document.createElement('div'), {className: 'node-handle'});
    hdlLink.addEventListener('mousedown', stopBubble);
    actionBar.appendChild(btnEditOrDone);
    actionBar.appendChild(btnDelete);
    actionBar.appendChild(hdlLink);
    el.appendChild(actionBar);

    let editing = false;
    btnEditOrDone.addEventListener('click', () => {
        editing = !editing;
        if (editing) {
            btnEditOrDone.innerText = 'Done';
            iptContent.value = txtContent.innerText;
            txtContent.classList.add('hidden');
            iptContent.classList.remove('hidden');
        } else {
            txtContent.innerText = iptContent.value;
            btnEditOrDone.innerText = 'Edit';
            txtContent.classList.remove('hidden');
            iptContent.classList.add('hidden');
        }
    });

    el.addEventListener('dragstart', event => {
        DRAG_STATE.id = node.id;
        DRAG_STATE.startOffsetX = event.offsetX - el.offsetLeft;
        DRAG_STATE.startOffsetY = event.offsetY - el.offsetTop;
    });
    return el;
}

function createAndAppendNode() {
    const node = createNode();
    NODES[node.id] = node;
    NODE_CONTAINER.appendChild(node.el);
}

createAndAppendNode();