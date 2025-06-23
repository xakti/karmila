import Home from "@/Home.vue";
import Executor from "@/pages/Executor.vue";
import Newborn from "@/pages/Newborn.vue";
import BidName from "@/pages/BidName.vue";
import TableViewer from "@/pages/TableViewer.vue";

import Account from "@/pages/Account.vue";
import ListToken from "@/pages/ListToken.vue";
import ListProducer from "@/pages/ListProducer.vue";
import Token from "@/pages/Token.vue";

const routes = [
    {path: '/', component: Home},
    {path: '/executor', component: Executor},
    {path: '/newborn', component: Newborn},
    {path: '/namebids', component: BidName},
    {path: '/table', component: TableViewer},

    {path: '/account/:name', component: Account},
    {path: '/tokens', component: ListToken},
    {path: '/token/form/:ticker', component: () => import("@/pages/TokenForm.vue")},
    {path: '/token/:ticker', component: Token},
    {path: '/token/:ticker/holder', component: () => import("@/pages/TokenHolder.vue")},
    {path: '/producers', component: ListProducer},
    {path: '/producer/:name', component: () => import("@/pages/ProducerDetail.vue")},
    {path: '/transaction/:id', component: () => import("@/pages/Transaction.vue")},
    {path: '/block/:number(\\d+)', component: () => import("@/pages/Block.vue")},
    {path: '/setting', component: () => import("@/pages/Setting.vue")}
];

export default routes;