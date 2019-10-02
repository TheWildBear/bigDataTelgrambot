/**
 * http://usejsdoc.org/
 */
/* jshint esversion: 6 */
/*
 * Version 1.0.2
 */
var config = require('./config');
const version = '1.0.3.3';

// libs for exporting and encrypting
const csv = require('fast-csv');
const util = require('util');
const hash = require('hash-int');
const fs = require('fs');
const sha1 = require('sha1');
const crypto = require('crypto');
const HashTable = require('hashtable');

// var config
var logging = 0;
var admin = 8846643;

// telegram lib + config
const Telebot = require('telebot');
const bot = new Telebot({
	token: config.bottoken,
	usePlugins: ['commandButton'],
	limit: 1000
});

// database lib + config
const mysql = require('mysql');
var db = mysql.createPool({
	connectionLimit: 100,
	host: config.dbreaduserhost,
	user: config.dbreaduser,
	password: config.dbreaduserpwd,
	database: 'db',
	charset: 'utf8mb4'
});
var dbwrite = mysql.createPool({
	connectionLimit: 100,
	host: config.dbwriteuserhost,
	user: config.dbwriteuser,
	password: config.dbwriteuserpwd,
	database: 'db',
	charset: 'utf8mb4'
});

var botname = "bigdatabot";

bot.start();

//Here start the informational Commands
//they are without any user interaction

bot.sendMessage(admin, "Bot started with version: ```" + version + "``` at: " + Date());

bot.on(['/dsgvo', '/gdpr', '/privacy'], (msg) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/dsgvo') || msg.text.split(' ')[0].endsWith('/gdpr') || msg.text.split(' ')[0].endsWith('/privacy')) {
		msg.reply.text("This bot saves according to your user settings some data. Please choose accordingly.\nIf you decide you don't want to save any data more just run /iwanttodeletemymsgs.\nThe data will be gathered to show everybody what bigdata is capable of doing.\nIf you don't choose any settings and you are not /optin than no data of you will be saved. The data will be published to the gitlab from thevillage. You can download all the data. You can lookup the src on github:\nhttps://github.com/TheWildBear/bigDataTelgrambot.");
	}
});

//sends the license
bot.on('/license', (msg) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/license')) {
		msg.reply.text('Welcome!\nThis bot is from @thewildbear.\nHe is awsome!\nCheckout his github\nhttps://github.com/TheWildBear\nCheckout the repo at:\nhttps://github.com/TheWildBear/bigDataTelgrambot\n\nCopyright 2018 TheWildBear\nThis bot is licensed under the MIT License!\nSpread the love for free Software!', {
			parseMode: 'markdown',
			asReply: true
		});
		if (logging == 1) {
			log("License sent");
		}
	}
});

//sends link to repo and informs about the bot
bot.on(['/start', '/help'], (msg) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/start') || msg.text.split(' ')[0].endsWith('/help')) {
		let startmsg = "Commands:\n/optin (agree to collecting your messages)\n/optout (disable collection)\n/checklogging (check collection status)\n/total_amount (total amount of messages collected)\n/total_ownamount (number of your collected messages)\n/iwanttodeletemymsgs (remove all collected data from the DB)\n\nThis bot collects data which will be used in the future for analysis and learning big data. It's opt in and does not collect any data if you are opted out. I would appreciate if you would donate me you're data!\nP.S. All data is anonymized. The version now running is: " + version;
		return msg.reply.text(startmsg, {
			asReply: true
		});
		if (logging == 1) {
			log("/start || /help sent");
		}
	}
});

bot.on('/ping', (msg) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/ping')) {
		let timediff = Date.now()/1000 - msg.date;
		log(timediff);
		msg.reply.text("Pong, Pung, Ping! Ente!!!! FOOOOOOOSSS!!!\n\nThe message was recieved with a timediff of: " + timediff, {
			asReply: true
		});
		if (logging == 1) {
			log("/ping sent");
		}
	}
});

bot.on('/info', (msg, data, props) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/info')) {
		msg.reply.text(util.inspect(msg, true, null));
		msg.reply.text(util.inspect(data, true, null));
		msg.reply.text(util.inspect(props, false, null));
		bot.sendMessage(msg.from.id, "Your hashed id is: " + hash(msg.from.id) + ". Your unhashed id is: " + msg.from.id);
		
	}
});

bot.on('error', (error) => {
	log(util.inspect(error, true, 99));
});

bot.on('reconnecting', (reconnecting) => {
	log(util.inspect(reconnecting, true, 99));
	log("connection lost at: " + Date());
});

bot.on('reconnected', (reconnected) => {
	log(util.inspect(reconnected, true, 99));
	log("connection successfully rebuilt at: " + Date());
});

//commandlist :D

bot.on('/commands', (msg) => {
	let commandlist = "/gdpr, /license, /start, /ping, /info, /updateuserinfo, /optin, /optin1, /optin2, /optout, /iwanttodeletemymsgs, /checklogging, /total_amount, /total_ownamount, /ownamount, /subscribe, /unsubscribe, /wordlist, /getdataperday, /getdata, /topingroup1week, /topingroup, /top1week, /toptoday, /top, /count1week, /count, /ownamount, /total_ownamount, /total_amount, /checklogging";
	msg.reply.text("Here is a list of all commands :D");
	msg.reply.text(commandlist);
});


//datagathering
bot.on('text', (msg) => {
	var checkoptin = "SELECT count(*) AS checkOptin, state AS state FROM optintable where userid = " + hash(msg.from.id) + ";";
	dbwrite.getConnection(function(err, connection) {
		connection.query(checkoptin, function(err, rows) {
			if (err) throw err;
			if (rows[0].checkOptin == 1) {
				if (rows[0].state == 0) {
					var sqlcmd = "INSERT INTO messagetable (text) VALUES ?";
					var values = [
						[msg.text]
					];
				}
				if (rows[0].state == 1 || rows[0].state == 2) {
					var sqlcmd = "INSERT INTO messagetable (msgid, userid, groupid, text, chattype) VALUES ?";
					var values = [
						[msg.message_id, hash(msg.from.id), msg.chat.id, msg.text, msg.chat.type]
					];
				}
				if (logging == 1) {
					log("messageid: " + msg.messageid + " userid: " + hash(msg.from.id) + " chatid: " + msg.chat.id + " message_text: " + msg.text + " chattype: " + msg.chat.type);
				}
				connection.query(sqlcmd, [values]);
			}
			connection.release();
		});
	});
});

bot.on('/optin', (msg) => {
	const replyMarkup = bot.inlineKeyboard([
        [
            bot.inlineButton('Optin State: 0', {callback: 'optin0'})
        ],
        [
            bot.inlineButton('Optin State: 1', {callback: 'optin1'})
        ],
        [
        	bot.inlineButton('Optin State: 2', {callback: 'optin2'})
        ],
        [
        	bot.inlineButton('Optin State: Optout', {callback: 'optout'})
        ],
        [
        	bot.inlineButton('delete this msg', {callback: 'deletemsg'})
        ]
    ]);
	msg.reply.text("When you use State 0 only the text of the msg you write gets logged.\nWhen you use State 1  msgid, userid, groupid, text, chattype gets logged.\nWhen you use State 2 additonally to State 1 your username is safed for use in /top commands", {replyMarkup});
});

function optin(userid, state, username, msg)
{
	let sqlcmd = "REPLACE INTO optintable (userid, state, username) VALUES ?";
	var values = [[userid, state, username]];
	if (logging == 1) {
		log(values);
	}
	log(msg);
	dbwrite.getConnection(function(err, connection) {
		connection.query(sqlcmd, [values], function(err, result) {
			if (err) throw err;
			bot.deleteMessage(msg.message.chat.id, msg.message.message_id);
			let userinfo;
			if(msg.from.username!=" ")
			{
				userinfo = "@" + msg.from.username;
			}else{
				userinfo = msg.from.first_name + " " + msg.from.last_name;
			}
			bot.sendMessage(msg.message.chat.id, userinfo + " opted in for data collection in state: " + state + ". Thank you!", {
				asReply: true
			});
			connection.release();
		});
	});
}

function optout(userid, msg)
{
	let sqlcmd = "DELETE FROM optintable WHERE userid = ?";
	let values = [[userid]];
	if (logging == 1) {
		log(values);
	}
	dbwrite.getConnection(function(err, connection) {
		connection.query(sqlcmd, [values], function(err, result) {
			if (err) throw err;
			/*bot.deleteMessage(msg.message.chat.id, msg.message.message_id);
			bot.sendMessage(msg.message.chat.id, "You opted out for data collection", {
				asReply: true
			});*/
			connection.release();
		});
	});
}

bot.on('/sqlread', (msg) => {
	if(msg.from.id==admin)
	{
		let command = msg.text.split(" ");
		command = "" + command.slice(1, command.length).join(" ");
		db.getConnection(function(err, connection) {
			connection.query(command, function(err, result) {
				if (err) throw err;
				log(util.inspect(result,false,null));
				msg.reply.text(util.inspect(result,false,null));
				connection.release();
			});
		});
	}
	else{
		log("userid: " + msg.from.id + " with username: " + msg.from.username + " tried to access without rights");
		msg.reply.text("Your not authorized for this action!");
	}
});


bot.on('/optout', (msg) => {
	optout(hash(msg.from.id),msg);
});

//delete all msgs
bot.on('/iwanttodeletemymsgs', (msg) => {
	const replyMarkup = bot.inlineKeyboard([
        [
            bot.inlineButton('Yes', {callback: 'deleteallmymsgs'})
        ],
        [
            bot.inlineButton('No', {callback: 'deletemsg'})
        ]
    ]);
	return msg.reply.text('Do you really wanna delete all your data?', {replyMarkup});
});

function deleteallmymsgs(id){
	log(id);
	let sqlcmd = "DELETE FROM messagetable WHERE userid = " + id + ";";
	let sqlcmd2 = "DELETE FROM optintable WHERE userid = " + id + ";";
	dbwrite.getConnection(function(err, connection) {
		connection.query(sqlcmd, function(err) {
			if (err) throw err;
			if (logging == 1) {
				log("Messages deleted!");
			}
		});
		connection.query(sqlcmd2, function(err) {
			if (err) throw err;
			if (logging == 1) {
				log("Userid deleted!");
			}				
		});
		connection.release();
	});
}

bot.on('/checklogging', (msg) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/checklogging')) {
		bot.sendAction(msg.chat.id, 'typing');
		let sqlcmd = "SELECT COUNT(*) AS logging, state AS state FROM optintable where userid = ?";
		let values = [[hash(msg.from.id)]];
		if (logging == 1) {
			log(values);
		}
		db.getConnection(function(err, connection) {
			connection.query(sqlcmd, [values], function(err, rows) {
				if (err) throw err;
				bot.deleteMessage(msg.chat.id, msg.message_id);
				msg.reply.text("Your current status is: " + util.inspect(rows[0].logging, false, null) + " with the logging level of: " + rows[0].state, {
					asReply: true
				});
				connection.release();
			});
		});
	}
});

// sends a msg with the total amount of msgs saved by the bot
bot.on('/total_amount', (msg) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/total_amount')) {
		bot.sendAction(msg.chat.id, 'typing');
		let sqlcmd = "SELECT COUNT(*) AS amount FROM messagetable";
		db.getConnection(function(err, connection) {
			connection.query(sqlcmd, function(err, rows) {
				if (err) throw err;
				if (logging == 1) {
					log(util.inspect(rows[0].amount, false, null));
				}
				bot.deleteMessage(msg.chat.id, msg.message_id);
				msg.reply.text("The current amount of overall msgs is: " + util.inspect(rows[0].amount, false, null), {
					asReply: true
				});
				connection.release();
			});
		});
	}
});

// sends a msg with the overall amount of msgs sent by the sender of command
bot.on('/total_ownamount', (msg) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/total_ownamount')) {
		bot.sendAction(msg.chat.id, 'typing');
		let SELECT = "SELECT COUNT(*) AS amount, truncate(avg(char_length( `text` )),2) AS AVG_Length";
		let FROM = " FROM messagetable";
		let WHERE = " WHERE userid = " + hash(msg.from.id) + " AND `text` NOT LIKE '/%';";
		let sqlcmd = SELECT + FROM + WHERE;
		db.getConnection(function(err, connection) {
			connection.query(sqlcmd, function(err, rows) {
				if (err) throw err;
				if (logging == 1) {
					log(util.inspect(rows[0].amount, false, null));
				}
				msg.reply.text("Your current  amount of your own msgs is: " + util.inspect(rows[0].amount, false, null) + " and the AVG_length is: " + rows[0].AVG_Length, {
					asReply: true
				});
				connection.release();
			});
		});
	}

});

// sends a msg with the amount of msgs sent by the sender of command in this
// group
bot.on('/ownamount', (msg) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/ownamount')) {
		bot.sendAction(msg.chat.id, 'typing');
		let groupid = msg.chat.id
		let SELECT = "SELECT COUNT(*) AS amount, truncate(avg(char_length( `text` )),2) AS AVG_Length";
		let FROM = " FROM messagetable";
		let WHERE = " WHERE userid = " + hash(msg.from.id) + " AND `text` NOT LIKE '/%' AND groupid = " + groupid + ";";
		let sqlcmd = SELECT + FROM + WHERE;
		db.getConnection(function(err, connection) {
			connection.query(sqlcmd, function(err, rows) {
				if (err) throw err;
				if (logging == 1) {
					log(util.inspect(rows[0].amount, false, null));
				}
				msg.reply.text("Your current  amount of your own msgs is: " + util.inspect(rows[0].amount, false, null) + " and the AVG_length is: " + rows[0].AVG_Length, {
					asReply: true
				});
				connection.release();
			});
		});
	}
});



// counts the amount of msgs that have the requested chars in them
bot.on(/^\/count (.+)$/, (msg, props) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/count')) {
		bot.sendAction(msg.chat.id, 'typing');
		let searchtext = "";
		let sqlcmd = "SELECT count(text) AS `text`, truncate(avg(char_length( `text` )),2) AS AVG_Length FROM messagetable WHERE text LIKE ?;";
		var values = [
			["%" + props.match[1] + "%"]
		];
		db.getConnection(function(err, connection) {
			connection.query(sqlcmd, [values], function(err, rows) {
				if (err) throw err;
				if (logging == 1) {
					log(util.inspect(rows[0].AVG_Length, false, null));
				}
				msg.reply.text("Your selected amount of msgs is: " + rows[0].text + " and the average length of the message it is used in is: " + rows[0].AVG_Length + " characters.",{
					asReply: true
				});
				connection.release();
			});
		});
	}
});

// counts the amount of msgs that have the requested chars in them
bot.on(/^\/count1week (.+)$/, (msg, props) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/count1week')) {
		bot.sendAction(msg.chat.id, 'typing');
		let searchtext = "";
		let sqlcmd = "SELECT count(text) AS `text`, truncate(avg(char_length( `text` )),2) AS AVG_Length FROM messagetable WHERE text LIKE ? AND (time < (now() - INTERVAL 1 WEEK)) AND `text` NOT LIKE '/%';";
		var values = [
			["%" + props.match[1] + "%"]
		];
		db.getConnection(function(err, connection) {
			connection.query(sqlcmd, [values], function(err, rows) {
				if (err) throw err;
				if (logging == 1) {
					log(util.inspect(rows[0].AVG_Length, false, null));
				}
				msg.reply.text("Your selected amount of msgs is: " + rows[0].text + " and the average length of the message it is used in is: " + rows[0].AVG_Length, {
					asReply: true
				});
				connection.release();
			});
		});
	}
});

//sends statistical the amount of saved data per day

bot.on('/stats', (msg) =>{
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/stats')) {
		let sqlcmd = "SELECT COUNT(*) AS Amount, Date(time) AS Day from messagetable GROUP BY DATE(time) DESC LIMIT 7;";
		db.getConnection(function(err, connection) {
			connection.query(sqlcmd, function(err, rows) {
				if (err) throw err;
				let result = "The stats are:\nDay | Amount of msgs per Day\n";
				for(var i in rows){
					result = result + rows[i].Day + " | " + rows[i].Amount + "\n";
				}
				msg.reply.text(result);
			});
			connection.release();
		});
	}
});

function top(msg)
{
	let SELECT ="";
	let FROM ="";
	let WHERE ="";
	let GROUP ="";
	let ORDER ="";
	let sqlcmd = SELECT + FROM + WHERE + GROUP + ODER;
}

// sends a list containing the top 10 people writing msgs
bot.on('/top', (msg) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/top')) {
		bot.sendAction(msg.chat.id, 'typing');
		let SELECT = "SELECT DISTINCT COUNT( `messagetable`.`msgid` ) AS `Msgs`, `messagetable`.`userid` AS `User`, TRUNCATE( AVG( CHAR_LENGTH ( `text` ) ), 2 ) AS `AVG_Length`, `optintable`.`username` AS `Username`"
		let FROM = "FROM { oj `db`.`messagetable` AS `messagetable` NATURAL LEFT OUTER JOIN `db`.`optintable` AS `optintable` }"
		let WHERE = " WHERE `messagetable`.`text` NOT LIKE '/%'"
		let GROUP = " GROUP BY `messagetable`.`userid`"
		let ORDER = " ORDER BY `Msgs` DESC LIMIT 10;"
		let sqlcmd = SELECT + FROM + WHERE + GROUP + ORDER;
		db.getConnection(function(err, connection) {
			connection.query(sqlcmd, function(err, rows) {
				if (err) throw err;
				let result = "The top people writing msgs are: \n";
				for (var i in rows) {
					let user = "";
					if (rows[i].Username != null) {
						user = ". [" + rows[i].Username + "](t.me/" + rows[i].Username + ")";
					} else {
						user = ". " + rows[i].User;
					}
					result = result + i + user + " | Messages: " + rows[i].Msgs + "| avg. Length: " + rows[i].AVG_Length + "\n";
				}
				result = result + "\nIf you want you're name to show up use: /optin2\nWhen you want to anonymize youreself again use /optin1";
				if (msg.chat.type != "private") {
					bot.deleteMessage(msg.chat.id, msg.message_id);
				}
				msg.reply.text(result, {
					parseMode: 'markdown'
				});
				connection.release();
				if (logging == 1) {
					log(result);
				}
			});
		});
	}
});

// sends a list containing the top 10 people writing msgs of today
bot.on('/toptoday', (msg) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/toptoday')) {
		bot.sendAction(msg.chat.id, 'typing');
		let SELECT = "SELECT DISTINCT COUNT( `messagetable`.`msgid` ) AS `Msgs`, `messagetable`.`userid` AS `User`, TRUNCATE( AVG( CHAR_LENGTH ( `text` ) ), 2 ) AS `AVG_Length`, `optintable`.`username` AS `Username`"
		let FROM = "FROM { oj `db`.`messagetable` AS `messagetable` NATURAL LEFT OUTER JOIN `db`.`optintable` AS `optintable` }"
		let WHERE = " WHERE `messagetable`.`text` NOT LIKE '/%' AND DATE(`messagetable`.`time`) = CURDATE()"
		let GROUP = " GROUP BY `messagetable`.`userid`"
		let ORDER = " ORDER BY `Msgs` DESC LIMIT 10;"
		let sqlcmd = SELECT + FROM + WHERE + GROUP + ORDER;
		db.getConnection(function(err, connection) {
			connection.query(sqlcmd, function(err, rows) {
				if (err) throw err;
				let result = "The top people writing msgs are: \n";
				for (var i in rows) {
					let user = "";
					if (rows[i].Username != null) {
						user = ". [" + rows[i].Username + "](t.me/" + rows[i].Username + ")";
					} else {
						user = ". " + rows[i].User;
					}
					result = result + i + user + " | Messages#: " + rows[i].Msgs + "| avg. Length: " + rows[i].AVG_Length;
					result = result + "\n";
				}
				result = result + "\nIf you want you're name to show up use: /optin2\nWhen you want to anonymize youreself again use /optin1";
				if (msg.chat.type != "private") {
					bot.deleteMessage(msg.chat.id, msg.message_id);
				}
				msg.reply.text(result, {
					parseMode: 'markdown'
				});
				connection.release();
				if (logging == 1) {
					log(result);
				}
			});
		});
	}
});

// sends a list containing the top 10 people writing msgs from last week
bot.on('/top1week', (msg) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/top1week')) {
		bot.sendAction(msg.chat.id, 'typing');
		let SELECT = "SELECT DISTINCT COUNT( `messagetable`.`msgid` ) AS `Msgs`, `messagetable`.`userid` AS `User`, TRUNCATE( AVG( CHAR_LENGTH ( `text` ) ), 2 ) AS `AVG_Length`, `optintable`.`username` AS `Username`";
		let FROM = "FROM { oj `db`.`messagetable` AS `messagetable` NATURAL LEFT OUTER JOIN `db`.`optintable` AS `optintable` }";
		let WHERE = " WHERE (`messagetable`.`text` NOT LIKE '/%') AND (`messagetable`.`time` < (now() - INTERVAL 1 WEEK))";
		let GROUP = " GROUP BY `messagetable`.`userid`";
		let ORDER = " ORDER BY `Msgs` DESC LIMIT 10;";
		let sqlcmd = SELECT + FROM + WHERE + GROUP + ORDER;
		db.getConnection(function(err, connection) {
			connection.query(sqlcmd, function(err, rows) {
				if (err) throw err;
				let result = "The top people writing msgs are: \n";
				for (var i in rows) {
					let user = "";
					if (rows[i].Username != null) {
						user = ". [" + rows[i].Username + "](t.me/" + rows[i].Username + ")";
					} else {
						user = ". " + rows[i].User;
					}
					result = result + i + user + " | Messages: " + rows[i].Msgs + "| avg. Length: " + rows[i].AVG_Length;
					result = result + "\n";
				}
				result = result + "\nIf you want you're name to show up use: /optin1 or lower";
				msg.reply.text(result, {
					parseMode: 'markdown',
					asReply: true
				});
				connection.release();
				if (logging == 1) {
					log(result);
				}
			});
		});
	}
});

// sends a list containing the top 10 people writing msgs in the group send from
bot.on('/topingroup', (msg) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/topingroup')) {
		bot.sendAction(msg.chat.id, 'typing');
		let groupid = msg.chat.id
		let SELECT = "SELECT DISTINCT COUNT( `msgid` ) AS `Msgs`, `userid` AS `User`, truncate(avg(char_length( `text` )),2) AS AVG_Length";
		let FROM = " FROM messagetable AS `messagetable`";
		let WHERE = " WHERE `text` NOT LIKE '/%' AND groupid = " + groupid;
		let GROUP = " GROUP BY `userid`";
		let ORDER = " ORDER BY `Msgs` DESC LIMIT 10;";
		let sqlcmd = SELECT + FROM + WHERE + GROUP + ORDER;
		db.getConnection(function(err, connection) {
			connection.query(sqlcmd, function(err, rows) {
				if (err) throw err;
				let result = "In this group the top msg writing people are: \n";
				for (var i in rows) {
					result = result + i + ". Messages: " + rows[i].Msgs + "\t\tUser: " + rows[i].User + "\t\tAVG_Length: " + rows[i].AVG_Length;
					result = result + "\n";
				}
				msg.reply.text(result, {
					asReply: true
				});
				connection.release();
				if (logging == 1) {
					log(result);
				}
			});
		});
	}
});

// sends a list containing the top 10 people writing msgs in the group send from
bot.on('/topingroup1week', (msg) => {
	if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/topingroup1week')) {
		bot.sendAction(msg.chat.id, 'typing');
		let groupid = msg.chat.id
		let SELECT = "SELECT DISTINCT COUNT( `msgid` ) AS `Msgs`, `userid` AS `User`, truncate(avg(char_length( `text` )),2) AS AVG_Length";
		let FROM = " FROM messagetable AS `messagetable`";
		let WHERE = " WHERE `text` NOT LIKE '/%' AND groupid = " + groupid + " AND (time < (now() - INTERVAL 1 WEEK))";
		let GROUP = " GROUP BY `userid`";
		let ORDER = " ORDER BY `Msgs` DESC LIMIT 10;";
		let sqlcmd = SELECT + FROM + WHERE + GROUP + ORDER;
		db.getConnection(function(err, connection) {
			connection.query(sqlcmd, function(err, rows) {
				if (err) throw err;
				let result = "In this group the top msg writing people are: \n";
				for (var i in rows) {
					result = result + i + ". Messages: " + rows[i].Msgs + "\t\tUser: " + rows[i].User + "\t\tAVG_Length: " + rows[i].AVG_Length;
					result = result + "\n";
				}
				msg.reply.text(result, {
					asReply: true
				});
				connection.release();
				if (logging == 1) {
					log(result);
				}
			});
		});
	}
});

// exports the data from the database to a csv file and a json file
bot.on('/getdata', (msg) => {
	msg.reply.text("The data is gathered and saved!");
	let SELECT = "SELECT `msgid`  AS `Msgs`, `groupid` AS `Groupid`, `userid` AS `User`, unix_timestamp(`time`) AS `Time`, `text` AS `Text`";
	let FROM = " FROM messagetable AS `messagetable`";
	let sqlcmd = SELECT + FROM;
	db.getConnection(function(err, connection) {
		connection.query(sqlcmd, function(err, rows) {
			if (err) throw err;
			// var result = "The msgs are:\n";
			let myjson = {};
			let data = {};
			let csvStream = csv.createWriteStream({
					headers: true
				}),
				writableStream = fs.createWriteStream("./upload/messages" + Date.now() + ".csv");

			writableStream.on("finish", function() {
				log("DONE!");
			});

			csvStream.pipe(writableStream);
			for (var i in rows) {
				/*
				 * try{ rows[i].Text.split(" ").forEach(function(data){data =
				 * data + "1"; text = text + sha1(data) + " "});}
				 * catch(err){throw err}
				 */
				myjson[i] = [];
				data = {
					Message: rows[i].Msgs,
					Groupid: rows[i].Groupid,
					User: rows[i].User,
					Text: rows[i].Text,
					Time: rows[i].Time
				}
				myjson[i].push(data);
				myjson[i].push();
				csvStream.write({
					Counter: i,
					Message: rows[i].Msgs,
					Groupid: rows[i].Groupid,
					User: rows[i].User,
					Text: '"' + rows[i].Text + '"',
					Time: rows[i].Time
				});
			}
			csvStream.end();
			var jsonstream = fs.createWriteStream("./upload/messages" + Date.now() + ".json");
			jsonstream.once('open', function(fd) {
				jsonstream.end(JSON.stringify(myjson));
			});

			msg.reply.text("Data exported!");
			connection.release();
			if (logging == 1) {
				log(result);
			}
		});
	});
});

bot.on('/getdataperday', (msg) => {
	msg.reply.text("The data is gathered and saved!");
	let SELECT = "SELECT `msgid` AS `Msgs`, unix_timestamp(DATE(`time`)) AS `Time`";
	let FROM = " FROM messagetable AS `messagetable`";
	let GROUP = "GROUP BY DAY(`time`)";
	let sqlcmd = SELECT + FROM + GROUP;
	db.getConnection(function(err, connection) {
		connection.query(sqlcmd, function(err, rows) {
			if (err) throw err;
			let csvStream = csv.createWriteStream({
					headers: true
				}),
				writableStream = fs.createWriteStream("./upload/messagesperday" + Date.now() + ".csv");

			writableStream.on("finish", function() {
				log("DONE!");
			});
			var myjson = {};
			var data = {};
			for (var i in rows) {
				/*
				 * try{ rows[i].Text.split(" ").forEach(function(data){data =
				 * data + "1"; text = text + sha1(data) + " "}); }
				 * catch(err){throw err}
				 */
				myjson[rows[i].Time] = [];
				data = {
					Messages: rows[i].Msgs,
				}
				// log(util.inspect(data,true,99));
				myjson[rows[i].Time].push(data);
				csvStream.write({
					Counter: i,
					Message: rows[i].Msgs,
					Time: rows[i].Time
				});
			}
			csvStream.end();
			let jsonstream = fs.createWriteStream("./upload/outputperday" + Date.now() + ".json");
			jsonstream.once('open', function(fd) {
				jsonstream.end(JSON.stringify(myjson));
			});

			msg.reply.text("Data exported!");
			connection.release();
			if (logging == 1) {
				log(result);
			}
			connection.release();
		});
	});
});


bot.on('/wordlist', (msg) => {
	let counter = 0;
	let SELECT = "SELECT `msgid`  AS `Msgs`, `userid` AS `User`, `time` AS `Time`, `text` AS `Text`";
	let FROM = " FROM messagetable AS `messagetable`;";
	let sqlcmd = SELECT + FROM;
	log("wordlist gathering started!")
	db.getConnection(function(err, connection) {
		connection.query(sqlcmd, function(err, rows) {
			if (err) throw err;
			var hashtable = new HashTable();
			let texttowordlist;
			let amount;
			let output = "Word,Times\n";
			let outputtelegram = "Word,Times\n";
			for (var i in rows) {
				rows[i].Text.replace(/(\.|,|\?|!|\n)/g, '').split(" ").forEach(function(data)
					// rows[i].Text.split("").forEach(function(data)
					{
						if (hashtable.get(data) === undefined) {
							amount = 1;
						} else {
							amount = hashtable.get(data) + 1;
						}
						hashtable.put(data, amount);
					});
			}
			log("wordlist gathered!")
			// saves Wordlist to file
			let keys = hashtable.keys();
			keys.forEach((data) => {
				output += data + "," + hashtable.get(data) + "\n";
				/*
				 * outputtelegram += data + "," + hashtable.get(data) + "\n";
				 * counter++; if (counter == 80) { bot.sendMessage(msg.chat.id,
				 * outputtelegram, { asReply: true }); outputtelegram = "";
				 * counter = 0; }
				 */
			});
			//log(output);
			log("wordlist sorted!");
			let wordlistfile = fs.writeFile("./upload/wordlist" + Date.now() + ".csv", output, function (err){
				if (err) throw err;
				log("wordlist written");
			});
			
			/*
			 * //sends Wordlist to chat keys.forEach((data) => { outputtelegram +=
			 * data + "," + hashtable.get(data) + "\n"; counter++;
			 * if(counter==80) { setTimeout(function () {
			 * bot.sendMessage(msg.chat.id,outputtelegram, { asReply: true
			 * }).then(function(msg) { log(msg); });
			 * 
			 * outputtelegram = ""; counter = 0; }, 5000); }
			 * 
			 * });
			 */
			connection.release();
		});
	});
});

bot.on('/uptime', (msg) => {
	
});

bot.on('/subscribe', (msg) => {
	let sqlcmd = "REPLACE INTO broadcast (userid) VALUES ?";
	var values = [[msg.from.id]];
	dbwrite.getConnection(function(err, connection) {
		connection.query(sqlcmd, [values], function(err, result) {
			if (err) throw err;
			msg.reply.text("You successfully subscribed! Of course your real userid has to be saved for that. It will not be exported to anywhere! If you don't want this service anymore run /unsubscribe");
			connection.release();
		});
	});
	
});

bot.on('/unsubscribe', (msg) => {
	let sqlcmd = "DELETE FROM broadcast WHERE userid = ?";
	let values = [[(msg.from.id)]];
	dbwrite.getConnection(function(err, connection) {
		connection.query(sqlcmd, [values], function(err, result) {
			if (err) throw err;
			bot.deleteMessage(msg.chat.id, msg.message_id);
			msg.reply.text("You successfully unsubscribed! Your userid has been deleted from this list!", {
				asReply: true
			});
			connection.release();
		});
	});
});

bot.on(/^\/broadcast (.+)$/, (msg, props) => {
	log(props.match[1]);
	if(msg.from.id==admin){
		if (msg.text.split(' ')[0].endsWith(botname) || msg.text.split(' ')[0].endsWith('/broadcast')) {
			let sqlcmd = "SELECT userid AS User FROM broadcast";
			db.getConnection(function(err, connection) {
				connection.query(sqlcmd, function(err, rows) {
					if (err) throw err;
					for (var i in rows) {
						log(rows[i]);
						bot.sendMessage(rows[i].User,props.match[1]);
					}
				});
				connection.release();
			});
		}
	}
});

/*
//last action on day
jeden abend um 23:59 anzahl an leuten in jeder gruppe in die datenbank speichern
*/

//var statssqlcmd = "UPDATE statstable SET msgs = msgs+1 WHERE day = CURDATE();";


//function for auto insert of msgs
/*
var checktoday = "SELECT COUNT(msgs) AS amount from statstable where day = CURDATE()";
var updatetoday = "INSERT IGNORE INTO statstable (groupid, day) VALUES ?";
var values = [[msg.chat.id, CURDATE()]];
let amount;
dbwrite.getConnection(function(err, connection) {
	connection.query(checktoday, function(err, rows) {
		if(rows[0].amount==0)
		{
			amount = 1;
		}else{
			amount = rows[0].msgs + 1;
		}
			
		connection.query(updatetoday, function(err, rows) {
			
		});
	});
	connection.release();
});*/


//testcommand
bot.on('/test', (msg) => {
	let replyMarkup = bot.keyboard([
        [bot.button('contact', 'Your contact'), bot.button('location', 'Your location')],
        ['/back', '/hide']
    ], {resize: true});
	return bot.sendMessage(msg.from.id, "Test", {replyMarkup});
});

//Hide keyboard
bot.on('/hide', msg => {
    return bot.sendMessage(
        msg.from.id, 'Hide keyboard example. Type /back to show.', {replyMarkup: 'hide'}
    );
});

//callback query backend
bot.on('callbackQuery', (msg) => {
    log('callbackQuery data:', msg.data);
    bot.answerCallbackQuery(msg.id);
    if(msg.data=="deleteallmymsgs")
    {
    	deleteallmymsgs(hash(msg.from.id));
    }
    if(msg.data=="deletemsg")
    {
    	deletemsg(msg.message.chat.id, msg.message.message_id);
    }
    if(msg.data=="optin0")
    {
    	optin(hash(msg.from.id), 0, null, msg);
    }
    if(msg.data=="optin1")
    {
    	optin(hash(msg.from.id), 1, null, msg);
    }
    if(msg.data=="optin2")
    {
    	optin(hash(msg.from.id), 2, msg.from.username, msg);
    }
    if(msg.data=="optout")
    {
    	optout(hash(msg.from.id),msg);
    }
});

function deletemsg(chatid, msgid){
	bot.deleteMessage(chatid, msgid);
}

function test(id){
	log("test worked" + id);
}

function log(data){
	data = data +  "\n";
	fs.appendFile(config.log, data, function(err){
		if (err) throw err;
	});
}
