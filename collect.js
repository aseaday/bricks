const ccxt = require('ccxt');
const fs = require('fs');
const bfx = require('./bfx');
const cts = ['btc', 'eth', 'ltc', 'bcc'];
const okurl = 'https://www.okcoin.cn/api/v1/ticker.do?symbol=';
const fetch = require('node-fetch');
const jubi = new ccxt.jubi();
const eosStream = fs.createWriteStream('eos-record.csv', {
    flags: 'a'
});
const ethStream = fs.createWriteStream('eth-record.csv', {
    flags: 'a'
});
const xrpStream = fs.createWriteStream('xrp-record.csv', {
    flags: 'a'
});
const jsonFetch = (url) => {
    console.log
    return fetch(url).then(
        (res) => res.json()
    )
}
async function record() {
    let ts = (Date.now() / 1000) | 0;
    let okEth = await jsonFetch(okurl + 'eth_cny');
    let jubiPrice = await jubi.fetchTickers();
    ethStream.write(
        `${ts}, ${jubiPrice['ETH/CNY'].last}, ${bfx.bids.eth * 6.63}, ${bfx.asks.eth * 6.63}, ${okEth.ticker.last}\n`
    );
    eosStream.write(
        `${ts}, ${jubiPrice['EOS/CNY'].last}, ${bfx.bids.eos * 6.63}, ${bfx.asks.eos * 6.63}\n`
    );
    xrpStream.write(
        `${ts}, ${jubiPrice['XRP/CNY'].last}, ${bfx.bids.xrp * 6.63}, ${bfx.asks.xrp * 6.63}\n`
    );
}
setInterval(function () {
    record();
}, 1000)