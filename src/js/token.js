import {reactive, ref} from "vue";
import {client} from "./nodes.js";

const VEXTOKENLIST = "vextokenlist";
const listToken = ref([]);
const totalToken = ref(0);
const mapTokens = reactive({});

export async function fetchTotalToken() {
    let args = {
        json: true, reverse: true, code: VEXTOKENLIST, scope: VEXTOKENLIST, table: "global",
        limit: 1, key_type: "i64", index_position: 1
    };
    let res = await client.v1.chain.get_table_rows(args);
    totalToken.value = res.rows[0].total_token;
}

export async function fetchTokenByTime(limit = 50) {
    let args = {
        json: true, reverse: true, code: VEXTOKENLIST, scope: VEXTOKENLIST, table: "tokenstat",
        limit: limit, key_type: "i64", index_position: 4
    };
    return client.v1.chain.get_table_rows(args);
}

export async function findToken(contract, symbol) {
    let args = {
        json: true, code: VEXTOKENLIST, scope: VEXTOKENLIST, table: "tokenstat",
        limit: 20, key_type: "i64", index_position: 2, lower_bound: contract
    };
    let res = await client.v1.chain.get_table_rows(args);
    return res.rows.filter(it => {
        return (it.contract === contract) && (it.code === symbol);
    });
}

export async function findTokenBySymbol(symbol) {
    let args = {
        json: true, code: VEXTOKENLIST, scope: VEXTOKENLIST, table: "tokenstat",
        limit: 40, key_type: "i64", index_position: 3, lower_bound: symbol
    };
    let res = await client.v1.chain.get_table_rows(args);
    return res.rows;
}

export async function fetchDetail(contract, id) {
    let args = {
        json: true, code: VEXTOKENLIST, scope: contract, table: "tokendetail",
        limit: 1, key_type: "i64", index_position: 1, lower_bound: id
    };
    let res = await client.v1.chain.get_table_rows(args);
    res.rows.forEach(it => {
        if (it.socials) it.socials = it.socials.split(",");
    });
    return res.rows;
}

export function addMapTokens(data) {
    let key = `${data.contract}-${data.code}`;
    mapTokens[key] = data;
}

export function intoMapTokens(rows) {
    rows.forEach(it => {
        let key = `${it.contract}-${it.code}`;
        if (it.icon.length === 0) it.icon = '/token-default.png';
        mapTokens[key] = it;
    });
}

export {VEXTOKENLIST, totalToken, listToken, mapTokens};