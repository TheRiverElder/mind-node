/**
 * 生成一个ID，目前以时间为ID
 * @returns {*} 新的ID
 */
function genId() {
    return Date.now();
}

function stopBubble(event) {
    event.stopPropagation();
}

const POOL = document.getElementById('pool');
const NODE_CONTAINER = document.getElementById('node-container');
const LINK_CANVAS = document.getElementById('links');

function resizeCanvas() {
    LINK_CANVAS.width = POOL.offsetWidth;
    LINK_CANVAS.height = POOL.offsetHeight;
}

window.addEventListener('resize', () => {
    resizeCanvas();
    redrawLinks();
});



const NODES = {};

const PANEL = {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
};

const DRAG_STATE = {
    id: null,
    startOffsetX: 0, // 开始时候鼠标相对于节点元素的偏移量
    startOffsetY: 0, 
};

const LINK_STATE = {
    id: null,
    linkEndCb: null,
};

NODE_CONTAINER.addEventListener('dragend', event => {
    if (DRAG_STATE.id) {
        const x = event.offsetX - DRAG_STATE.startOffsetX;
        const y = event.offsetY - DRAG_STATE.startOffsetY;
        NODES[DRAG_STATE.id].moveTo(x, y);
        DRAG_STATE.id = null;
        redrawLinks();
    }
});



function redrawLinks() {
    const cxt = LINK_CANVAS.getContext('2d');
    cxt.clearRect(0, 0, LINK_CANVAS.width, LINK_CANVAS.clientHeight);
    cxt.strokeStyle = '#888';
    cxt.lineWidth = 1.5;
    for (let node of Object.values(NODES)) {
        if (!node.outLinks.size) {
            continue;
        }
        const fromPort = node.getPort();
        for(let targetId of [...node.outLinks]) {
            const target = NODES[targetId];
            const toPort = target.getPort();
            const middle = (fromPort.outX + toPort.inX) / 2;
            cxt.beginPath();
            cxt.moveTo(fromPort.outX + 0.5, fromPort.outY + 0.5);
            cxt.bezierCurveTo(middle, fromPort.outY, middle, toPort.inY, toPort.inX + 0.5, toPort.inY + 0.5);
            cxt.stroke();
        }
    }
}


/**
 * 创建一个不存的的链接，或解除一个已存在的链接
 * @param {Object} from 链接源
 * @param {Object} to 链接尾
 */
function link(from, to) {
    if (!from.outLinks.has(to.id) && !to.inLinks.has(from.id)) {
        console.log('link');
        from.outLinks.add(to.id);
        to.inLinks.add(from.id);
    } else {
        console.log('unlink');
        from.outLinks.delete(to.id);
        to.inLinks.delete(from.id);
    }
    redrawLinks();
}

/**
 * 创建节点
 */
function createNode() {
    const node = {
        id: genId(),
        el: null,
        inLinks: new Set(),
        outLinks: new Set(),
        moveTo(x, y) {
            this.el.style.left = x + 'px';
            this.el.style.top = y + 'px';
        },
        getPort() {
            const el = this.el;
            return {
                inX: el.offsetLeft,
                inY: el.offsetTop + 30,
                outX: el.offsetLeft + el.offsetWidth,
                outY: el.offsetTop + 30,
            };
        },
    };

    node.el = createNodeEl(node);
    return node;
}

/**
 * 为节点创建HTML元素
 * @param {Object} node 节点
 */
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
    const iptContent = Object.assign(document.createElement('textarea'), {className: 'hidden', draggable: false});
    // iptContent.addEventListener('mousedown', stopBubble);
    content.appendChild(txtContent);
    content.appendChild(iptContent);
    el.appendChild(content);

    const actionBar = Object.assign(document.createElement('div'), {className: 'node-button-bar fill-width d-flex align-items-center'});
    const btnEditOrDone = Object.assign(document.createElement('button'), {className: 'flex-grow-1', innerText: 'Edit'});
    const btnDelete = Object.assign(document.createElement('button'), {className: 'flex-grow-1', innerText: 'Delete'});
    const hdlLink = Object.assign(document.createElement('div'), {className: 'node-handle', draggable: false});
    // hdlLink.addEventListener('mousedown', stopBubble);
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

    hdlLink.addEventListener('click', () => {
        if (LINK_STATE.id === node.id) {
            LINK_STATE.id = null;
            LINK_STATE.linkEndCb = null;
            hdlLink.classList.remove('linking');
        } else if (LINK_STATE.id === null) {
            LINK_STATE.id = node.id;
            LINK_STATE.linkEndCb = () => hdlLink.classList.remove('linking');
            hdlLink.classList.add('linking');
        } else {
            link(NODES[LINK_STATE.id], node);
            LINK_STATE.linkEndCb();
            LINK_STATE.id = null;
            LINK_STATE.linkEndCb = null;
            hdlLink.classList.remove('linking');
        }
    });

    el.addEventListener('dragstart', event => {
        DRAG_STATE.id = node.id;
        DRAG_STATE.startOffsetX = event.offsetX - el.offsetLeft;
        DRAG_STATE.startOffsetY = event.offsetY - el.offsetTop;
    });
    return el;
}

/**
 * 创建节点并添加到HTML页面中
 */
function createAndAppendNode() {
    const node = createNode();
    NODES[node.id] = node;
    NODE_CONTAINER.appendChild(node.el);
}

/**
 * 初始化
 */
createAndAppendNode();
resizeCanvas();
redrawLinks();