/* bricks Chart */
'use strict';
var config = {
    type: 'line',
    data: {
		labels: [],
        datasets: [{
            label: "LTC",
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: [],
            fill: false,
        }]
	},
    options: {
        responsive: false,
        title:{
            display:true,
            text:'JUBI/BITFINEX'
        },
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Time'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Value'
                }
            }]
        }
    }
};

var APP_ID = '2toxh9juw6j8d9rx9boj4pcp9nk7kp313blc1szv0qy2kprj';
var APP_KEY = '0w99ayota19ctwjoji2ipd4v6hr374u77ejdtiwan6561bfn';

AV.init({
  appId: APP_ID,
  appKey: APP_KEY
});

var lastUpdated = '';
function loadData() {
// var q = new AV.Query('ltd')
// q.find(function(items) {
// console.log(items);
// });
// q.subscribe().then(function(liveQuery) {
// liveQuery.on('create', function(n) {
// console.log(n);
// });
// });
	var where = '';
	if ( lastUpdated != '' ) {
		where = "where createdAt > date('"+lastUpdated+"')";
	}

	var cql = 'select diff from ltd '+where+' order by createdAt desc';
	console.log(cql);
	AV.Query.doCloudQuery(cql).then(function (data) {

		lastUpdated = moment().utc().format('YYYY-MM-DDTHH:mm:ss.SSS')+'Z';

		var results = data.results.reverse();
		var diffs = []
		var labels = []
		results.forEach(function(e){ 
		    config.data.labels.push(moment(e.get('createdAt')).format('h:mm'));
		    config.data.datasets.forEach(function(dataset) {
                dataset.data.push(e.get('diff'));
            });
		})

        window.bricks.update();
        //TODO hide loading indicator

        setTimeout('loadData()',1000 * 5);

	}, function (error) {
		console.log(error);
	});

}

