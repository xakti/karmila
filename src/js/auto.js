import {client} from "./nodes.js";
import {reactive} from "vue";
import {fetchProducers} from "./producer.js";

const suggestions = reactive({account: [], contract: [], producer: []});

async function findAccount(name) {
    let data = await client.v1.chain.get_table_by_scope({
        code: "vexcore", table: "userres",
        lower_bound: name,
        limit: 7
    });

    suggestions.account = [];
    data.rows.forEach(it => {
        suggestions.account.push(it.scope.toString());
    });
}

function completeAccount(val) {
    let len = val.query.length;
    if (len > 0 && len <= 12) {
        findAccount(val.query.toLowerCase());
    }
}

async function findAbiHash(contract) {
    let data = await client.v1.chain.get_table_rows({
        json: true, code: "vexcore", scope: "vexcore",
        table: "abihash",
        index_position: 1, key_type: "i64",
        limit: 7,
        lower_bound: contract
    });
    if (data.rows.length > 0) {
        suggestions.contract = [];
        data.rows.forEach(it => {
            suggestions.contract.push(it.owner);
        });
    }
}

function completeContract(event) {
    let len = event.query.length;
    if (len > 0 && len <= 12) {
        findAbiHash(event.query.toLowerCase());
    }
}

async function completeProducer(event) {
    let len = event.query.length;
    if (len > 0 && len <= 12) {
        let res = await fetchProducers(event.query, 5);
        suggestions.producer = [];
        res.rows.forEach(it => {
            suggestions.producer.push(it.owner);
        });
    }
}


export {suggestions, completeAccount, completeContract, completeProducer};
