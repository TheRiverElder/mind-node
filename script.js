/**
 * 生成一个ID，目前以时间为ID
 * @returns {*} 新的ID
 */
function genId() {
    return Date.now();
}

const NODE_CONTAINER = document.getElementById('node-container');

const NODES = {};

let draggingNodeId = null;

NODE_CONTAINER.addEventListener('dragend', event => {
    console.log('dragend', draggingNodeId, event);
    if (draggingNodeId) {
        const x = event.clientX;
        const y = event.clientY;
        NODES[draggingNodeId].moveTo(x, y);
        draggingNodeId = null;
    }
});








function createNode() {
    const node = {
        id: genId(),
        el: null,
        moveTo(x, y) {
            console.log('move');
            this.el.top = y + 'px';
            this.el.left = x + 'px';
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
        console.log('dragstart', event);
        draggingNodeId = node.id;
    });
    return el;
}

function createAndAppendNode() {
    const node = createNode();
    NODES[node.id] = node;
    NODE_CONTAINER.appendChild(node.el);
}