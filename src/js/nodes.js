import {reactive} from "vue";
import {APIClient} from '@wharfkit/antelope';
import {ABICache} from "@wharfkit/abicache";

const VEX_RPC = "vexnode"; // untuk simpan di localstorage
const ChainID = "f9f432b1851b5c179d2091a96f593aaed50ec7466b74f89301f957a83e56ce1f";
const listNodes = reactive({
    bitvexa: {name: "Bitvexa", url: "https://api.bitvexa.id", hyperion: true, speed: '?'},
    databisnis: {name: "Databisnis", url: "https://api.databisnis.id", speed: '?'},
    proit: {name: "Proit", url: "https://api.vex.proit.id", speed: '?'},
    explorer: {name: "Vexanium Explorer", url: "https://explorer.vexanium.com:6960", speed: '?'},
    vexascan: {name: "Vexascan", url: "https://vexascan.com:8443", speed: '?'},
    vexascan_v2: {name: "Vexascan V2", url: "https://v2.vexascan.com:2096", hyperion: true, speed: '?'}
});

// node terpilih
let endpoint = '';
let endpointHyperion = '';

/**
 *
 * @type {APIClient}
 */
let client = null;
/**
 *
 * @type {ABICache}
 */
let abiCache = null;

function initWharfkit() {
    client = new APIClient({url: endpoint});
    abiCache = new ABICache(client);
}

async function pingNode(id) {
    let url = listNodes[id].url;
    url += "/v1/chain/get_info";
    let start = Date.now(), end = 0;
    try {
        let res = await fetch(url, {method: 'HEAD'});
        if (res.ok) {
            end = Date.now();
            listNodes[id].speed = (end - start) + " ms";
        } else {
            listNodes[id].speed = "down";
        }
    } catch (e) {
    }
}

async function pingAllNodes() {
    let task = [];
    Object.keys(listNodes).forEach(it => {
        task.push(pingNode(it));
    });
    return Promise.all(task);
}

function saveHyperion(id) {
    endpointHyperion = listNodes[id].url;
    localStorage.setItem("hyperion", id);
}

function saveNode(id) {
    endpoint = listNodes[id].url;
    localStorage.setItem(VEX_RPC, id);
}

function loadNode() {
    let id = localStorage.getItem(VEX_RPC);
    endpoint = id !== null ? listNodes[id].url : listNodes.bitvexa.url;

    let idh = localStorage.getItem("hyperion");
    endpointHyperion = idh !== null ? listNodes[idh].url : listNodes.bitvexa.url;
}

function getSelectedNode() {
    return localStorage.getItem(VEX_RPC) ?? "bitvexa";
}

function getSelectedHyperion() {
    return localStorage.getItem("hyperion") ?? "bitvexa";
}

export {
    ChainID, listNodes, client, abiCache, endpointHyperion,
    pingNode, pingAllNodes, saveNode, loadNode, saveHyperion, getSelectedNode, getSelectedHyperion,
    initWharfkit
};