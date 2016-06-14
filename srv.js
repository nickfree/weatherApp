//srv


var http = require ('http');
var mysql = require ('mysql');
var url = require ('url');
var querystring = require('querystring');
var Promise = require ('bluebird');


// mysql connection pool
var pool = mysql.createPool ({
	connectionLimit	:  10,
	host     			: 'localhost',
	user     			: 'phpmyadmin',
	password 			: 'qwe123',
	database 			: 'phpmyadmin'
});

// common msql requedt function
function DBRequest (sql_request, values) {
	return new Promise (function (resolve, reject) {
		console.log ('DB request: ' + sql_request);
		if (values) {
			console.log ('with values: ' + values);
		}
		pool.getConnection(function(err, connection) {
 
			connection.query(sql_request, values, function(err, rows, fields) {
				connection.release();
  				if (err) {
  					reject (err);
  				}
  				console.log (rows, rows.insertId);
  				if (sql_request.slice(0, 6) == 'INSERT') {
  					resolve (rows.insertId);
  				}
  				resolve (rows);
			})
		})
	})
}

http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	
	var route = url.parse(req.url).pathname
	
	console.log ('server route:' + route);
	
	//router
	switch (route) {
		case '/' : {
			admin ();
			break;
		}
		case '/update' : {
			update ();
			break;
		}
		case '/setId' : {
			setId ();
			break;
		}
		case '/getActiveUsers' : {
			getUsers ();
			break;
		}
		default : {
			res.end ('unknown route')
			break;
		}
	}
	
	
	// template for admin page
	function admin () {
		
		sql_request = 'SELECT * from weatherAppUsers';
		DBRequest (sql_request)
			.then (function (result) {
				console.log (result.length);
				res.write ( '<html ng-app = "weatherAdmin">' +
								'<meta charset = "utf-8">' +
								'<script type = "text/javascript" src = "https://ajax.googleapis.com/ajax/libs/angularjs/1.5.6/angular.min.js"></script>' +
								'<script type = "text/javascript">' + 
								'angular.module ("weatherAdmin", [])' +
									'.controller ("adminCtrl", function ($http) {' +
										'var date = this;' +
										'date.activeUsers = 0;' +
										'date.year = ["2016"];' +
										'date.month = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];' +
										'date.day = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];' +
										'date.send = function () {' +
											'var date1 = document.getElementById("year1").value + document.getElementById("month1").value + document.getElementById("day1").value;' +
											'var date2 = document.getElementById("year2").value + document.getElementById("month2").value + document.getElementById("day2").value;' +
											'$http.get ("http://localhost:3000/getActiveUsers?start=" + date1 + "&end=" + date2)' +
												'.then (function (result) {' +
													'date.activeUsers = result.data' +
												'})' +
										'}' +
									'})' +
								'</script>');
				res.write ( '<div>' +
								'Count of installs: <span id = "instCount">'+ result.length + '</span>' +
								'</div>' +
								'<div ng-controller = "adminCtrl as admin">' +
								'Count of active users: {{admin.activeUsers}}<br>' +
								'Set interval<br>' +
								'<form ng-submit = "admin.send ()">' +
									'<select id = "year1">' +
										'<option ng-repeat = "year in admin.year" value = "{{year}}">{{year}}</option>' +
									'</select>' +
									'<select id = "month1">' +
										'<option ng-repeat = "month in admin.month" value = "{{month}}">{{month}}</option>' +
									'</select>' +
									'<select id = "day1">' +
										'<option ng-repeat = "day in admin.day" value = "{{day}}">{{day}}</option>' +
									'</select>'	+
									' - ' +
									'<select id="year2">' +
										'<option ng-repeat = "year in admin.year" value = {{year}}>{{year}}</option>' +
									'</select>' +
									'<select id="month2">' +
										'<option ng-repeat = "month in admin.month" value = "{{month}}">{{month}}</option>' +
									'</select>' +
									'<select id="day2">' +
										'<option ng-repeat = "day in admin.day" value = "{{day}}">{{day}}</option>' +
									'</select>'	+
									'<input type = "submit" value = "load">' +
									'</form>' +				
								'</div>');
				res.write (result.toString());
				res.end ();
			})
			.catch (function (err) {
				console.log (err);
				res.end ();
			})
	}
	
	
	// updating DB with new date
	function update () {
		sql_request = 'UPDATE weatherAppUsers SET date=NOW() WHERE id=?';
		var id = url.parse (req.url).query;
		id = id.slice (3, id.length);
		
		DBRequest (sql_request, [id])
			.then (function (result) {
				res.write (result.toString());
				res.end ();
			})
			.catch (function (err) {
				console.log (err);
				res.end ();
			})
	}
	
	
	// set new user Id
	function setId () {
	
		sql_request = 'INSERT INTO weatherAppUsers (date) VALUES (NOW())';
  		DBRequest (sql_request)
		.then (function (result) {
			res.write (result.toString());
			res.end ();
		})
		.catch (function (err) {
			console.log (err);
			res.end ();
		})
	
	}
	
	
	// get active users in selected period
	function getUsers () {
	
		var start = querystring.parse(url.parse(req.url).query)['start'];
		var end = querystring.parse(url.parse(req.url).query)['end'];
		console.log(start, end);
		var count = 0;
		sql_request = 'SELECT date from weatherAppUsers';
		DBRequest (sql_request)
			.then (function (result) {
				result.forEach (function (item, i, arr) {
					console.log (item);
					var month;
					
					console.log (String(item.date));
					switch (String(item.date).slice(4, 7)) {
						case 'Jan' : {month = '01'; break;}
						case 'Feb' : {month = '02'; break;}
						case 'Mar' : {month = '03'; break;}
						case 'Apr' : {month = '04'; break;}
						case 'May' : {month = '05'; break;}
						case 'Jun' : {month = '06'; break;}
						case 'Jul' : {month = '07'; break;}
						case 'Aug' : {month = '08'; break;}
						case 'Sep' : {month = '09'; break;}
						case 'Oct' : {month = '10'; break;}
						case 'Nov' : {month = '11'; break;}
						case 'Dec' : {month = '12'; break;}
					}
					var searchDate = String(item.date).slice(11, 15) + month + String(item.date).slice(8, 10);
					console.log (searchDate); 
					if ((searchDate >= start) && (searchDate <= end)) {count++}
					
				})
				console.log (count);
				res.end (String(count));
			})
	}
	
}).listen(80);

console.log('Server running on port 80.');
