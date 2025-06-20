import {reactive} from "vue";
import {Asset, Int64} from "@wharfkit/antelope";
import {client, endpointHyperion} from "./nodes.js";
import {vote2stake} from "./voting.js";
import {ProducerData} from "@/js/ProducerData.js";

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
    let all = [];
    data.forEach(it => {
        let bp = new ProducerData(it);
        bp.position = pos;
        all.push(bp);
        pos++;
    });
    res.rows = all;
    return res;
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
    fetchProducers, fetchVoters
};