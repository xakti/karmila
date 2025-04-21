import {reactive} from "vue";
import {Asset, Int64} from "@wharfkit/antelope";
import {client, endpointHyperion} from "./nodes.js";
import {vote2stake} from "./voting.js";
import ChainInfo from "./chain-info.js";

const producers = reactive({rows: [], totalVoteWeight: 0, more: "", pos: 1});

async function fetchProducers(bound, limit = 50) {
    let params = {limit: limit, json: true};
    if (bound && bound.length > 0) params.lower_bound = bound;

    let res = await client.call({
        path: "/v1/chain/get_producers", params: params
    });

    producers.totalVoteWeight = parseInt(res.total_producer_vote_weight);

    let data = res.rows;
    let pos = producers.pos;
    data.forEach(it => {
        let totalVote = parseInt(it.total_votes);
        it.percent = (totalVote / producers.totalVoteWeight) * 100;

        let stake = Asset.fromString("0.0000 VEX");
        stake.units = Int64.from(vote2stake(totalVote));
        it.stake = stake;

        it.blockPay = calcBlockPay(it.unpaid_blocks);
        it.votePay = calcVotePay(it.total_votes);
        it.rewards = Asset.fromUnits(it.blockPay.units.adding(it.votePay.units), it.blockPay.symbol);
        it.pos = pos;
        it.logo = "";
        it.compliance = {value: {}, percent: 0, count: 0};
        pos++;
    });
    res.rows = data;
    return res;
}

function calcBlockPay(unpaidBlock) {
    let global = ChainInfo.vexcoreGlobal;
    let pay = Asset.fromString("0.0000 VEX");

    if (global.total_unpaid_blocks > 0) {
        let amount = (global.perblock_bucket * unpaidBlock) / global.total_unpaid_blocks;
        pay.units = Int64.from(amount);
    }
    return pay;
}

function calcVotePay(totalVotes) {
    let amount = (ChainInfo.vexcoreGlobal.pervote_bucket * totalVotes) / ChainInfo.vexcoreGlobal.total_producer_vote_weight;
    let pay = Asset.fromString("0.0000 VEX");
    pay.units = Int64.from(amount);
    return pay;
}

/**
 *
 * @param {string} url
 * @return {Promise<Object>}
 */
async function fetchBPJson(url) {
    let jsonUrl = `${url}/bp.json`;
    let res = await fetch(jsonUrl, {mode: "cors"});
    if (res.ok) {
        res = await res.json();
        return res;
    } else {
        return {nodes: []};
    }
}

function getCompliance(json) {
    let result = {
        "BP.Json": false, Name: false, Email: false, Website: false, Logo: false, Country: false
    };

    if (json) {
        result["BP.Json"] = true;
        result.Name = json.producer_account_name.length > 0;
        result.Email = json.org.email.length > 0;
        result.Website = json.org.website.length > 0;
        result.Logo = json.org.branding.logo_256.length > 0;
        result.Country = json.org.location.country.length > 0;
    }
    let count = 0;
    Object.values(result).forEach(it => {
        if (it) count++;
    });
    let percent = (count / 6) * 100;
    return {value: result, count, percent};
}

async function fetchVoters(producer, skip = 0, limit = 40) {
    let url = `${endpointHyperion}/v2/state/get_voters?producer=${producer}&skip=${skip}&limit=${limit}`;
    let res = await fetch(url);
    if (res.ok) {
        res = await res.json();
        let no = skip + 1;
        res.voters.forEach(it => {
            it.stake = Asset.fromString("0.0000 VEX");
            it.stake.units = Int64.from(vote2stake(it.weight));
            it.no = no;
            no++;
        });
        return res.voters;
    }
    return [];
}


export {
    producers,
    fetchProducers, fetchVoters, fetchBPJson, getCompliance
};