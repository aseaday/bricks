const result = {};
const WS = require('ws')
const _ = require('lodash')
const fs = require('fs')
const moment = require('moment')
const conf = {
    wshost: "wss://api.bitfinex.com/ws/2"
}
const books = {
    btc: {},
    eth: {},
    zec: {},
    eos: {},
    ltc: {},
    xrp: {}
}
const pairs = {
    ETHUSD: 0,
    EOSUSD: 0,
    BTCUSD: 0,
    LTCUSD: 0,
    ZECUSD: 0,
    XRPUSD: 0
};
const trades = {
    btc: 0,
    eth: 0,
    zec: 0,
    eos: 0,
    ltc: 0,
    xrp: 0
}
result.books = books;
result.trades = trades;
result.price = {
    btc: 0,
    eth: 0,
    zec: 0,
    eos: 0,
    ltc: 0,
    xrp: 0
};
result.asks = {
    btc: 0,
    eth: 0,
    zec: 0,
    eos: 0,
    ltc: 0
};
result.bids = {
    btc: 0,
    eth: 0,
    zec: 0,
    eos: 0,
    ltc: 0,
    xrp: 0
};

let connected = false;
let connecting = false;
let cli = undefined;

function connect() {
    let bookTable = {};
    let tradeTable = {};
    if (connecting || connected) return;
    connecting = true;
    for (var key in books) {
        if (books.hasOwnProperty(key)) {
            let BOOK = books[key];
            BOOK.bids = {};
            BOOK.asks = {};
            BOOK.psnap = {};
            BOOK.mcnt = 0;
        }
    }
    cli = new WS(conf.wshost, { /*rejectUnauthorized: false*/ });
    cli.on('open', function open() {
        console.log('open');
        connecting = false;
        connected = true;
        for (var pair in pairs) {
            if (pairs.hasOwnProperty(pair)) {
                cli.send(JSON.stringify({
                    event: "subscribe",
                    channel: "book",
                    pair: pair,
                    prec: "P0"
                }));
                cli.send(JSON.stringify({
                    event: "subscribe",
                    channel: "trades",
                    pair: pair
                }));
            }
        }
    })

    cli.on('close', function open() {
        console.log('close');
        connecting = false;
        connected = false;
    })

    cli.on('message', function (msg) {
        msg = JSON.parse(msg);
        if (msg.chanId && msg.channel == 'book') {
            pairs[msg.pair] = msg.chanId;
        } else if (msg.chanId && msg.channel == 'trades') {
            tradeTable[msg.chanId] = msg.pair;
        } else if (tradeTable[msg[0]]) {
            if (msg[1] === 'hb') return;
            if (msg.event) return;
            let ctype = tradeTable[msg[0]].slice(0, 3).toLowerCase()
            if (msg[1] === 'te' || msg[1] === 'tu') {
                trades[ctype] = msg[2][3];
            }
        } else {
            if (msg[1] === 'hb') return;
            if (msg.event) return;
            if (!bookTable[msg[0]]) {
                for (var pair in pairs) {
                    if (pairs.hasOwnProperty(pair)) {
                        if (pairs[pair] === msg[0]) {
                            bookTable[pairs[pair]] = pair;
                        }
                    }
                }
            }
            let ctype = bookTable[msg[0]].slice(0, 3).toLowerCase();
            buildBook(msg, books[ctype], ctype);
        }
    })
}

function buildBook(msg, BOOK, ctype) {
    if (BOOK.mcnt === 0) {
        _.each(msg[1], function (pp) {
            pp = { price: pp[0], cnt: pp[1], amount: pp[2] }
            const side = pp.amount >= 0 ? 'bids' : 'asks'
            pp.amount = Math.abs(pp.amount)
            BOOK[side][pp.price] = pp
        })
    } else {
        msg = msg[1];
        let pp = { price: msg[0], cnt: msg[1], amount: msg[2] }
        if (!pp.cnt) {
            let found = true
            if (pp.amount > 0) {
                if (BOOK['bids'][pp.price]) {
                    delete BOOK['bids'][pp.price]
                } else {
                    found = false
                }
            } else if (pp.amount < 0) {
                if (BOOK['asks'][pp.price]) {
                    delete BOOK['asks'][pp.price]
                } else {
                    found = false
                }
            }
        } else {
            let side = pp.amount >= 0 ? 'bids' : 'asks'
            pp.amount = Math.abs(pp.amount)
            BOOK[side][pp.price] = pp
        }
    }
    _.each(['bids', 'asks'], function (side) {
        let sbook = BOOK[side]
        let bprices = Object.keys(sbook)

        let prices = bprices.sort(function (a, b) {
            if (side === 'bids') {
                return +a >= +b ? -1 : 1
            } else {
                return +a <= +b ? -1 : 1
            }
        })
        prices = prices.map((p) => {
            return [Number(p), sbook[p]['amount']];
        });
        let sum = 0;
        let am = 0;
        for (var index = 0; index < prices.length; index++) {
            sum += prices[index][0] * prices[index][1];
            am += prices[index][1];
            if (sum >= 2000) {
                break;
            }
        }
        result[side][ctype] = sum / am;
        BOOK.psnap[side] = prices;
    })
    BOOK.mcnt++
}

connect();
setInterval(function () {
    if (connected) {
        return;
    }
    connect()
}, 2500)

module.exports = result;