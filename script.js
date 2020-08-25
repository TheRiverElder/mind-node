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
const NODE_EL_TEMPLATE = document.getElementById('node-el-template');
const SL_PANEL = document.getElementById('sl-panel');
const POOL_TEXT = document.getElementById('pool-text');

function resizeCanvas() {
    LINK_CANVAS.width = POOL.offsetWidth;
    LINK_CANVAS.height = POOL.offsetHeight;
}

window.addEventListener('resize', () => {
    resizeCanvas();
    redrawLinks();
});


window.addEventListener('keydown', event => {
    if (event.key === 's' && event.ctrlKey) {
        cachePool();
        event.preventDefault();
    }
});


const NODES = {};

const PANEL = {
    offsetX: 20,
    offsetY: 20,
    scale: 1,
};

const LINK_STATE = {
    id: null,
    linkEndCb: null,
};

const DRAG_STATE = {
    id: null,
    startX: 0,
    startY: 0, 
    startMouseX: 0,
    startMouseY: 0,
    mouseOffsetX: 0, // 开始时候鼠标相对于节点元素的偏移量
    mouseOffsetY: 0,
};

NODE_CONTAINER.addEventListener('dragend', event => {
    if (DRAG_STATE.id) {
        const x = DRAG_STATE.startX + (event.offsetX - DRAG_STATE.startMouseX) - DRAG_STATE.mouseOffsetX;
        const y = DRAG_STATE.startY + (event.offsetY - DRAG_STATE.startMouseY) - DRAG_STATE.mouseOffsetY;
        NODES[DRAG_STATE.id].moveTo(x, y);
        DRAG_STATE.id = null;
        redrawLinks();
    }
});

//#region 面板拖动

const PANEL_MOVE_STATE = {
    moving: false,
    startOffsetX: 0, // 开始时候面板的偏移量
    startOffsetY: 0, 
    startMouseX: 0, // 开始时候鼠标相对于节点元素的偏移量
    startMouseY: 0, 
};

function movePanelStart(event) {
    if (event.button === 1 && !PANEL_MOVE_STATE.moving) { // 判断滚轮按下
        PANEL_MOVE_STATE.moving = true;
        PANEL_MOVE_STATE.startMouseX = event.clientX;
        PANEL_MOVE_STATE.startMouseY = event.clientY;
        PANEL_MOVE_STATE.startOffsetX = PANEL.offsetX;
        PANEL_MOVE_STATE.startOffsetY = PANEL.offsetY;
        NODE_CONTAINER.classList.add('moving');
    }
}

function movePanelMove(event) {
    if ((event.button === 1 || (event.buttons & 4) > 0) && PANEL_MOVE_STATE.moving) {
        movePanelTo(
            PANEL_MOVE_STATE.startOffsetX + event.clientX - PANEL_MOVE_STATE.startMouseX, 
            PANEL_MOVE_STATE.startOffsetY + event.clientY - PANEL_MOVE_STATE.startMouseY);
    }
}

function movePanelEnd(event) {
    if (event.button === 1 && PANEL_MOVE_STATE.moving) {
        movePanelTo(
            PANEL_MOVE_STATE.startOffsetX + event.clientX - PANEL_MOVE_STATE.startMouseX, 
            PANEL_MOVE_STATE.startOffsetY + event.clientY - PANEL_MOVE_STATE.startMouseY);
        PANEL_MOVE_STATE.moving = false;
        PANEL_MOVE_STATE.startMouseX = 0;
        PANEL_MOVE_STATE.startMouseY = 0;
        PANEL_MOVE_STATE.startOffsetX = PANEL.offsetX;
        PANEL_MOVE_STATE.startOffsetY = PANEL.offsetY;
        NODE_CONTAINER.classList.remove('moving');
        
    }
}

function movePanelTo(x, y) {
    PANEL.offsetX = x;
    PANEL.offsetY = y;
    Object.values(NODES).forEach(node => node.redrawNode());
    redrawLinks();
}

//#endregion

/**
 * 绘制链接的线条
 */
function redrawLinks() {
    const cxt = LINK_CANVAS.getContext('2d');
    cxt.clearRect(0, 0, LINK_CANVAS.width, LINK_CANVAS.clientHeight);
    cxt.strokeStyle = '#888';
    cxt.fillStyle = '#888';
    cxt.lineWidth = 1.5;
    for (let node of Object.values(NODES)) {
        if (!node.outLinks.size) {
            continue;
        }
        const fromPort = node.getPort();
        const x1 = fromPort.outX + PANEL.offsetX + 0.5;
        const y1 = fromPort.outY + PANEL.offsetY + 0.5;
        for(let targetId of [...node.outLinks]) {
            const toPort = NODES[targetId].getPort();
            const x2 = toPort.inX + PANEL.offsetX + 0.5;
            const y2 = toPort.inY + PANEL.offsetY + 0.5;
            const hdx = Math.abs(x1 - x2) / 2;
            cxt.beginPath();
            cxt.moveTo(x1, y1);
            cxt.bezierCurveTo(x1 + hdx, y1, x2 - hdx, y2, x2, y2);
            cxt.stroke();
            const arrowCX = (x1 + x2) / 2;
            const arrowCY = (y1 + y2) / 2;
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const arrowSize = 8;
            cxt.beginPath();
            cxt.moveTo(arrowCX + arrowSize * Math.cos(angle), arrowCY + arrowSize * Math.sin(angle));
            cxt.lineTo(arrowCX + arrowSize * Math.cos(angle + 0.8 * Math.PI), arrowCY + arrowSize * Math.sin(angle + 0.8 * Math.PI));
            cxt.lineTo(arrowCX + arrowSize * Math.cos(angle + 1.2 * Math.PI), arrowCY + arrowSize * Math.sin(angle + 1.2 * Math.PI));
            cxt.closePath();
            cxt.fill();
        }
    }
}

//#region 节点操作

/**
 * 创建一个不存的的链接，或解除一个已存在的链接
 * @param {Object} from 链接源
 * @param {Object} to 链接尾
 */
function toggleLink(fromId, toId) {
    const from = NODES[fromId];
    const to = NODES[toId];
    if (!from.outLinks.has(to.id) && !to.inLinks.has(from.id) && fromId !== toId) {
        from.outLinks.add(to.id);
        to.inLinks.add(from.id);
    } else {
        from.outLinks.delete(to.id);
        to.inLinks.delete(from.id);
    }
    redrawLinks();
}

/**
 * 处理按下链接按钮时的处理逻辑
 * @param {Number} id 要处理的节点ID
 * @param {Function} cb 当链接结束后要执行的逻辑
 */
function handleLinkAction(id, cb) {
    if (LINK_STATE.id) {
        toggleLink(LINK_STATE.id, id);
        if (LINK_STATE.linkEndCb) {
            LINK_STATE.linkEndCb();
        }
        cb();
        LINK_STATE.id = null;
        LINK_STATE.linkEndCb = null;
    } else {
        LINK_STATE.id = id;
        LINK_STATE.linkEndCb = cb;
    }
}

/**
 * 创建节点及其对应的HTML元素
 */
function createNode(prev = {}) {
    const node = {
        id: prev.id || genId(),
        x: prev.x || (NODE_CONTAINER.offsetWidth / 2 - PANEL.offsetX ),
        y: prev.y || (NODE_CONTAINER.offsetHeight / 2 - PANEL.offsetY),
        content: prev.content || 'TEXT',
        el: null,
        inLinks: new Set(prev.inLinks || []),
        outLinks: new Set(prev.outLinks || []),
        updateEl: null,
        moveTo(x, y) {
            this.x = x;
            this.y = y;
            this.redrawNode();
        },
        redrawNode() {
            this.el.style.left = (this.x + PANEL.offsetX) + 'px';
            this.el.style.top = (this.y + PANEL.offsetY) + 'px';
        },
        getPort() {
            return {
                inX: this.x,
                inY: this.y + 30,
                outX: this.x + this.el.offsetWidth,
                outY: this.y + 30,
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
    const el = Object.assign(document.importNode(NODE_EL_TEMPLATE.content, true).children[0], { id: node.id });

    const content = el.getElementsByClassName('content')[0];
    const txtContent = content.getElementsByTagName('span')[0];
    const iptContent = content.getElementsByTagName('textarea')[0];
    // iptContent.addEventListener('mousedown', stopBubble);

    const actionBar = el.getElementsByClassName('node-action-bar')[0];
    const [btnEditOrDone, btnDelete, hdlLink] = actionBar.children;
    // hdlLink.addEventListener('drag', stopBubble);

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
            node.content = iptContent.value;
            btnEditOrDone.innerText = 'Edit';
            txtContent.classList.remove('hidden');
            iptContent.classList.add('hidden');
        }
    });

    btnDelete.addEventListener('click', () => deleteNode(node.id));

    const cb = () => hdlLink.classList.remove('linking');
    hdlLink.addEventListener('click', () => {
        hdlLink.classList.add('linking');
        handleLinkAction(node.id, cb);
    });

    el.addEventListener('dragstart', event => {
        DRAG_STATE.id = node.id;
        DRAG_STATE.startX = node.x;
        DRAG_STATE.startY = node.y;
        DRAG_STATE.satrtMouseX = event.offsetX;
        DRAG_STATE.startMouseY = event.offsetY;
        DRAG_STATE.mouseOffsetX = event.offsetX;
        DRAG_STATE.mouseOffsetY = event.offsetY;
    });

    node.updateEl = () => {
        txtContent.innerText = node.content;
        iptContent.value = node.content;
    };
    return el;
}

/**
 * 删除节点
 * @param {Number} id 要删除节点的ID 
 */
function deleteNode(id) {
    const node = NODES[id];
    [...node.inLinks].forEach(i => NODES[i].outLinks.delete(id));
    [...node.outLinks].forEach(i => NODES[i].inLinks.delete(id));
    delete NODES[id];
    node.el.remove();
    redrawLinks();
    if (LINK_STATE.id === id) {
        LINK_STATE.id = null;
        LINK_STATE.linkEndCb = null;
    }
}

function clearNodes() {
    Object.values(NODES).forEach(node => {
        node.el.remove();
        delete NODES[node.id];
    });
    redrawLinks();
    LINK_STATE.id = null;
    LINK_STATE.linkEndCb = null;
}

//#endregion

/**
 * 创建节点并添加到HTML页面中
 */
function createAndAppendNode() {
    const node = createNode();
    NODES[node.id] = node;
    NODE_CONTAINER.appendChild(node.el);
    node.redrawNode();
}

//#region 导入导出

function loadPool(str) {
    if (str) {
        try {
            const pool = JSON.parse(str);
            Object.assign(PANEL, pool.panel);
            clearNodes();
            pool.nodes.map(n => createNode(n)).forEach(node => {
                NODES[node.id] = node;
                NODE_CONTAINER.appendChild(node.el);
                node.redrawNode();
                node.updateEl();
            });
            redrawLinks();
        } catch (e) {
            console.log(e);
        }
    }
}

function savePool() {
    return JSON.stringify({
        nodes: Object.values(NODES).map(node => ({
            id: node.id,
            x: node.x,
            y: node.y,
            content: node.content,
            inLinks: [...node.inLinks],
            outLinks: [...node.outLinks],
        })),
        panel: PANEL,
    });
}

function tryLoadPool() {
    loadPool(POOL_TEXT.value);
}

function trySavePool() {
    const data = savePool();
    POOL_TEXT.value = data;
    cachePool();
}

function cachePool(data) {
    if (!data) {
        data = savePool();
    }
    localStorage.setItem('mind-node-pool', data);
    console.debug('cache finished');
}

function copyPool() {
    POOL_TEXT.select();
    document.execCommand("Copy")
}

function openSLPanel() {
    SL_PANEL.classList.remove('hidden');
}

function closeSLPanel() {
    SL_PANEL.classList.add('hidden');
}


//#endregion

//初始化
resizeCanvas();
redrawLinks();
const loadedPool = localStorage.getItem('mind-node-pool') || null;
if (loadedPool) {
    loadPool(loadedPool);
}