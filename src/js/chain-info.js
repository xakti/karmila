import {reactive, ref} from "vue";
import {Asset, Serializer} from "@wharfkit/antelope";
import {client, endpointHyperion} from "./nodes.js";

const ChainInfo = Object.create(null);

ChainInfo.vexPrice = ref(0);
ChainInfo.usdtPrice = ref(0);
ChainInfo.vexcoreGlobal = reactive({max_ram_size:0, total_unpaid_blocks:0});
ChainInfo.chainInfo = reactive({head_block_num: 0, head_block_producer: "", last_irreversible_block_num: 0});
ChainInfo.actions = ref([]);
ChainInfo.actionUsage = reactive({ready: false, data: {tx_count: 0, action_count: 0, unique_actors: 0}});
ChainInfo.ramPrice = ref(0);

ChainInfo.fetchVexPrice = async function () {
    let res = await fetch('https://indodax.com/api/ticker/vexidr');
    if (res.ok) {
        res = await res.json();
        ChainInfo.vexPrice.value = res.ticker.last;
    }
}
ChainInfo.getChainInfo = async function () {
    let data = await client.v1.chain.get_info();
    Object.assign(ChainInfo.chainInfo, Serializer.objectify(data));
}
ChainInfo.fetchVexcoreGlobal = async function () {
    let args = {
        "json": true,
        "code": "vexcore",
        "scope": "vexcore",
        "table": "global",
        "limit": 1
    };
    let res = await client.v1.chain.get_table_rows(args);
    if (res.rows.length > 0) {
        Object.assign(ChainInfo.vexcoreGlobal, res.rows[0]);
    }
}
ChainInfo.getActionUsage = async function () {
    let url = `${endpointHyperion}/v2/stats/get_action_usage?period=1h&unique_actors=true`;
    try {
        let res = await fetch(url, {
            headers: {"Content-Type": "application/json"}
        });
        if (res.ok) {
            res = await res.json();
            ChainInfo.actionUsage.data = res;
            ChainInfo.actionUsage.ready = true;
        }
    } catch (e) {
        console.log(e.message);
    }
}
ChainInfo.fetchRamMarket = async function () {
    let args = {
        "json": true,
        "code": "vexcore",
        "scope": "vexcore",
        "table": "rammarket",
        "limit": 1
    };
    let res = await client.v1.chain.get_table_rows(args);
    if (res.rows.length > 0) {
        let market = res.rows[0];
        let ram = parseInt(market.base.balance);
        let vex = parseFloat(market.quote.balance);
        let price = (vex / ram) * 1024;
        ChainInfo.ramPrice.value = price.toFixed(4);
    }
}
ChainInfo.toIDR = function (asset) {
    let price = parseFloat(ChainInfo.vexPrice.value);
    let idr = Asset.fromString("0.00 IDR");
    idr.value = price * asset.value;
    return idr;
}
ChainInfo.getCreator = async function (account) {
    let url = `${endpointHyperion}/v2/history/get_creator?account=${account}`;
    try {
        let res = await fetch(url, {
            headers: {"Content-Type": "application/json"}
        });
        if (res.ok) {
            res = await res.json();
            return res.creator;
        } else {
            return "";
        }
    } catch (e) {
        console.log(e.message);
    }
}
export default ChainInfo;