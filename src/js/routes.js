import Home from "../Home.vue";
import Executor from "../pages/Executor.vue";
import Newborn from "../pages/Newborn.vue";
import BidName from "../pages/BidName.vue";
import TableViewer from "../pages/TableViewer.vue";
import Rex from "../pages/Rex.vue";

import Account from "../pages/Account.vue";
import ListToken from "../pages/ListToken.vue";
import ListProducer from "../pages/ListProducer.vue";
import Token from "../pages/Token.vue";
import ProducerDetail from "../pages/ProducerDetail.vue";
import TokenHolder from "../pages/TokenHolder.vue";
import TokenForm from "../pages/TokenForm.vue";
import Transaction from "../pages/Transaction.vue";
import Block from "../pages/Block.vue";
import Setting from "../pages/Setting.vue";

const routes = [
    {path: '/', component: Home},
    {path: '/executor', component: Executor},
    {path: '/newborn', component: Newborn},
    {path: '/namebids', component: BidName},
    {path: '/table', component: TableViewer},
    {path: '/rex', component: Rex},

    {path: '/account/:name', component: Account},
    {path: '/tokens', component: ListToken},
    {path: '/token/form/:ticker', component: TokenForm},
    {path: '/token/:ticker', component: Token},
    {path: '/token/:ticker/holder', component: TokenHolder},
    {path: '/producers', component: ListProducer},
    {path: '/producer/:name', component: ProducerDetail},
    {path: '/transaction/:id', component: Transaction},
    {path: '/block/:number(\\d+)', component: Block},
    {path: '/setting', component: Setting}
];

export default routes;