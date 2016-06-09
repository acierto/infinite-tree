import { test } from 'tap';
import fs from 'fs';
import path from 'path';
import jsdom from 'jsdom';

const document = jsdom.jsdom(undefined, {
    virtualConsole: jsdom.createVirtualConsole().sendTo(console)
});
const window = document.defaultView;

global.document = document;
global.window = window;
global.navigator = window.navigator;

const treeData = Object.freeze(require('./fixtures/tree.json'));
const InfiniteTree = require('../src');

const getTreeElement = () => {
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }

    const el = document.createElement('div');
    el.setAttribute('id', 'tree');
    document.body.appendChild(el);

    return el;
};

test('Close all nodes on tree initialization', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: false,
        data: { ...treeData }
    });

    t.same(tree.nodes.length, 1);
    t.same(tree.rows.length, 1);
    t.end();
});

test('Open all nodes on tree initialization', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: { ...treeData }
    });

    t.same(tree.nodes.length, 12);
    t.same(tree.rows.length, 12);
    t.end();
});

test('It should generate expected output for empty result', (t) => {
    const el = getTreeElement();
    const options = {
        noDataClass: 'my-no-data-class',
        noDataText: 'My no data text'
    };
    const tree = new InfiniteTree(el, options);
    const innerHTML = `<div id="tree"><div class="infinite-tree infinite-tree-scroll"><div class="infinite-tree infinite-tree-content" tabindex="0"><div class="${options.noDataClass}">${options.noDataText}</div></div></div></div>`;

    t.same(window.document.body.innerHTML, innerHTML);
    t.same(tree.nodes.length, 0);
    t.same(tree.rows.length, 0);
    t.end();
});

test('tree.clear', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: { ...treeData }
    });

    t.same(tree.nodes.length, 12);
    tree.clear();
    t.same(tree.nodes.length, 0);

    t.end();
});

test('tree.closeNode', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: { ...treeData }
    });

    let eventFiredCount = 0;

    tree.on('closeNode', (node) => {
        ++eventFiredCount;
    });

    t.same(tree.nodes.length, 12);
    tree.closeNode(tree.getNodeById('india'));
    t.same(tree.nodes.length, 11);
    tree.closeNode(tree.getNodeById('delta'));
    t.same(tree.nodes.length, 9);
    tree.closeNode(tree.getNodeById('hotel'));
    t.same(tree.nodes.length, 8);
    tree.closeNode(tree.getNodeById('charlie'));
    t.same(tree.nodes.length, 6);
    tree.closeNode(tree.getNodeById('bravo'));
    t.same(tree.nodes.length, 3);
    tree.closeNode(tree.getNodeById('<root>'), { silent: true }); // Prevent event from being triggered
    t.same(tree.nodes.length, 1);

    // Check event fired count
    t.same(eventFiredCount, 5);

    t.end();
});

test('tree.flattenChildNodes', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: { ...treeData }
    });

    { // #1: Flatten all nodes within the tree
        const nodes = tree.flattenChildNodes();
        const wanted = tree.nodes;
        t.same(nodes, wanted);
    }

    { // #2: Flatten all child nodes of a node
        const node = tree.getNodeById('<root>');
        const nodes = tree.flattenChildNodes(node);
        const wanted = tree.nodes.slice(tree.nodes.indexOf(node) + 1);
        t.same(nodes, wanted);
    }

    t.end();
});

test('tree.flattenNode', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: { ...treeData }
    });

    { // #1: Flatten a node
        const node = tree.getNodeById('bravo');
        const nodes = tree.flattenNode(node);
        const wanted = tree.nodes.slice(tree.nodes.indexOf(node) + 0);
        t.same(nodes, wanted);
    }

    { // #2: Pass null as a parameter
        const nodes = tree.flattenNode(null);
        const wanted = [];
        t.same(nodes, wanted);
    }

    { // #3: Pass empty parameter
        const nodes = tree.flattenNode();
        const wanted = [];
        t.same(nodes, wanted);
    }

    t.end();
});

test('tree.getNodeById', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        data: { ...treeData }
    });

    const rootNode = tree.getNodeById('<root>');
    const noneNode = tree.getNodeById('none');

    t.same(rootNode.id, '<root>');
    t.same(noneNode, null);

    t.end();
});

test('tree.openNode', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: false,
        data: { ...treeData }
    });

    let eventFiredCount = 0;

    tree.on('openNode', (node) => {
        ++eventFiredCount;
    });

    t.same(tree.nodes.length, 1);
    tree.openNode(tree.getNodeById('<root>'), { silent: true }); // Prevent event from being triggered
    t.same(tree.nodes.length, 3);
    tree.openNode(tree.getNodeById('bravo'));
    t.same(tree.nodes.length, 6);
    tree.openNode(tree.getNodeById('charlie'));
    t.same(tree.nodes.length, 8);
    tree.openNode(tree.getNodeById('hotel'));
    t.same(tree.nodes.length, 9);
    tree.openNode(tree.getNodeById('delta'));
    t.same(tree.nodes.length, 11);
    tree.openNode(tree.getNodeById('india'));
    t.same(tree.nodes.length, 12);

    // Check event fired count
    t.same(eventFiredCount, 5);

    t.end();
});

test('tree.selectNode', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: { ...treeData }
    });

    let eventFiredCount = 0;

    tree.on('selectNode', (node) => {
        ++eventFiredCount;
    });

    // Select Node
    t.same(tree.getSelectedNode(), null);
    tree.selectNode(tree.getNodeById('<root>'), { silent: true }); // Prevent event from being triggered
    t.same(tree.getSelectedNode(), tree.getNodeById('<root>'));
    tree.selectNode(tree.getNodeById('bravo'));
    t.same(tree.getSelectedNode(), tree.getNodeById('bravo'));
    tree.selectNode(tree.getNodeById('charlie'));
    t.same(tree.getSelectedNode(), tree.getNodeById('charlie'));
    tree.selectNode(tree.getNodeById('hotel'));
    t.same(tree.getSelectedNode(), tree.getNodeById('hotel'));
    tree.selectNode(tree.getNodeById('delta'));
    t.same(tree.getSelectedNode(), tree.getNodeById('delta'));
    tree.selectNode(tree.getNodeById('india'));
    t.same(tree.getSelectedNode(), tree.getNodeById('india'));
    tree.selectNode(tree.getNodeById('juliet'));
    t.same(tree.getSelectedNode(), tree.getNodeById('juliet'));

    // Check event fired count
    t.same(eventFiredCount, 6);

    // Close Node
    tree.closeNode(tree.getNodeById('india'));
    t.same(tree.getSelectedNode(), tree.getNodeById('india'));
    tree.closeNode(tree.getNodeById('hotel'));
    t.same(tree.getSelectedNode(), tree.getNodeById('hotel'));
    tree.closeNode(tree.getNodeById('bravo'));
    t.same(tree.getSelectedNode(), tree.getNodeById('bravo'));
    tree.closeNode(tree.getNodeById('<root>'), { silent: true });
    t.same(tree.getSelectedNode(), tree.getNodeById('<root>'));

    // Check event fired count
    t.same(eventFiredCount, 6 + 3);

    t.end();
});
