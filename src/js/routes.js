import Home from "../Home.vue";

const routes = [
    {path: '/', component: Home},
    {path: '/executor', component: () => import("@/pages/Executor.vue")},
    {path: '/newborn', component: () => import("@/pages/Newborn.vue")},
    {path: '/namebids', component: () => import("@/pages/BidName.vue")},
    {path: '/table', component: () => import("@/pages/TableViewer.vue")},

    {path: '/account/:name', component: () => import("@/pages/Account.vue")},
    {path: '/tokens', component: () => import("@/pages/ListToken.vue")},
    {path: '/token/:ticker', component: () => import("@/pages/Token.vue")},
    {path: '/token/:ticker/holder', component: () => import("@/pages/TokenHolder.vue")},
    {path: '/producers', component: () => import("@/pages/ListProducer.vue")},
    {path: '/producer/:name', component: () => import("@/pages/ProducerDetail.vue")},
    {path: '/transaction/:id', component: () => import("@/pages/Transaction.vue")},
    {path: '/block/:number(\\d+)', component: () => import("@/pages/Block.vue")},
    {path: '/setting', component: () => import("@/pages/Setting.vue")}
];

export default routes;