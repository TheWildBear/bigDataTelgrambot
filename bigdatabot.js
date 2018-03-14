/**
 * http://usejsdoc.org/
 */

/*jshint esversion: 6 */

/*
 *Version 1.0.2
 */

var config = require('./config');
const version = '1.0.3';
const Telebot = require('telebot');
const bot = new Telebot({
	token: config.bottoken,
	limit: 1000});
const util = require('util');
const mysql = require('mysql'); 
const hash = require('hash-int');
const fs = require('fs');
const sha1 = require('sha1');
const crypto = require('crypto');
var logging = 0;
var admin = 8846643;
var log;
var db = mysql.createPool({
	connectionLimit : 100,
	host: config.dbreaduserhost,
	user: config.dbreaduser,
	password: config.dbreaduserpwd,
	database: 'db',
	charset : 'utf8mb4'
});

var dbwrite = mysql.createPool({
	connectionLimit : 100,
        host: config.dbwriteuserhost,
        user: config.dbwriteuser,
        password: config.dbwriteuserpwd,
        database: 'db',
        charset : 'utf8mb4'
});

var botname = "bigdatabot";

bot.start();

bot.sendMessage(admin, "Bot started with version: " + version + " at: " + Date());

bot.on('text' ,(msg) => {
	var checkoptin = "SELECT count(*) AS checkOptin, state AS state FROM optintable where userid = " + hash(msg.from.id) + ";";
	dbwrite.getConnection(function(err, connection){
		connection.query(checkoptin, function(err, rows){
			if(err) throw err;
			if(rows[0].checkOptin==1){
				if(rows[0].state == 0)
				{
					var sqlcmd = "INSERT INTO messagetable (text) VALUES ?";
					var values = [[msg.text]];
				}
				if(rows[0].state == 1 || rows[0].state == 2)
				{
					var sqlcmd = "INSERT INTO messagetable (msgid, userid, groupid, text, chattype) VALUES ?";
                                        var values = [[msg.message_id, hash(msg.from.id), msg.chat.id, msg.text, msg.chat.type]];
				}
				if(logging == 1){console.log("messageid: " + msg.messageid + " userid: " + hash(msg.from.id) + " chatid: " + msg.chat.id + " message_text: " + msg.text + " chattype: " + msg.chat.type);}
	        		connection.query(sqlcmd, [values]);
			}
			connection.release();
		});
	});
	
});

//updates userinformation
bot.on('/updateuserinfo', (msg) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/updateuserinfo'))
        {
		let sqlcmd = "UPDATE optintable SET username = ? WHERE userid = ?";
		var values = [msg.from.username, hash(msg.from.id)];
		if(logging == 1){console.log(values);}
		dbwrite.getConnection(function(err, connection){
                	db.query(sqlcmd, values, function(err, result){
                        	if(err) throw err;
	                        //bot.deleteMessage(msg.chat.id, msg.message_id);
				msg.reply.text("Your User infos have been updated", { asReply: true }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
                	        connection.release();
	                });
        	});
	}
});

bot.on('/optin', (msg) => {
	msg.reply.text("When you use /optin0 only the text of the msg you write gets logged.\nWhen you use /optin1  msgid, userid, groupid, text, chattype gets logged.\nWhen you use /optin2 additonally to /optin1 you're username is safed for use in /top commands");
});

bot.on('/optin0', (msg) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/optin'))
        {
		bot.sendAction(msg.chat.id, 'typing');
		let sqlcmd = "INSERT IGNORE INTO optintable (userid, state, username) VALUES ?";
		var values = [[hash(msg.from.id), 0, null]];
		if(logging == 1){console.log(values);}
		dbwrite.getConnection(function(err, connection){
			db.query(sqlcmd, [values], function(err, result){
				if(err) throw err;
				bot.deleteMessage(msg.chat.id, msg.message_id);
				msg.reply.text("You opted in for data collection!", { asReply: true }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
				connection.release();
			});
		});
	}
});

bot.on('/optin1', (msg) => {
        if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/optin'))
        {
                bot.sendAction(msg.chat.id, 'typing');
                let sqlcmd = "INSERT IGNORE INTO optintable (userid, state, username) VALUES ?";
                var values = [[hash(msg.from.id), 1, null]];
                if(logging == 1){console.log(values);}
                dbwrite.getConnection(function(err, connection){
                        db.query(sqlcmd, [values], function(err, result){
                                if(err) throw err;
                                bot.deleteMessage(msg.chat.id, msg.message_id);
                                msg.reply.text("You opted in for data collection!", { asReply: true }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
                                connection.release();
                        });
                });
        }
});

bot.on('/optin2', (msg) => {
        if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/optin'))
        {
                bot.sendAction(msg.chat.id, 'typing');
                let sqlcmd = "INSERT IGNORE INTO optintable (userid, state, username) VALUES ?";
                var values = [[hash(msg.from.id), 2, msg.from.username]];
                if(logging == 1){console.log(values);}
                dbwrite.getConnection(function(err, connection){
                        db.query(sqlcmd, [values], function(err, result){
                                if(err) throw err;
                                bot.deleteMessage(msg.chat.id, msg.message_id);
                                msg.reply.text("You opted in for data collection!", { asReply: true }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
                                connection.release();
                        });
                });
        }
});

bot.on('/optout', (msg) =>{
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/optout'))
        {
		bot.sendAction(msg.chat.id, 'typing');
		let sqlcmd = "DELETE FROM optintable WHERE userid = ?";
		let values = [[hash(msg.from.id)]];
		if(logging == 1){console.log(values);}
		dbwrite.getConnection(function(err, connection) {
			connection.query(sqlcmd, [values], function(err, result){
				if(err) throw err;
				bot.deleteMessage(msg.chat.id, msg.message_id);
				msg.reply.text("You opted out for data collection", { asReply: true }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
				connection.release();
			});
		});
	}
});

bot.on('/checklogging', (msg) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/checklogging'))
        {
		bot.sendAction(msg.chat.id, 'typing');
		let sqlcmd = "SELECT COUNT(*) AS logging, state AS state FROM optintable where userid = ?";
		let values = [[hash(msg.from.id)]];
		if(logging == 1){console.log(values);}
		db.getConnection(function(err, connection) {
			connection.query(sqlcmd, [values], function(err, rows){
				if(err) throw err;
				bot.deleteMessage(msg.chat.id, msg.message_id);
				msg.reply.text("Your current status is: " + util.inspect(rows[0].logging,false,null) + " with the logging level of: " + rows[0].state, { asReply: true }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
				connection.release();
			});
		});
	}
});

//sends a msg with the total amount of msgs saved by the bot
bot.on('/total_amount', (msg) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/total_amount'))
        {
		bot.sendAction(msg.chat.id, 'typing');
	        let sqlcmd = "SELECT COUNT(*) AS amount FROM messagetable";
		db.getConnection(function(err, connection) {
	        	connection.query(sqlcmd, function(err, rows){
				if(err) throw err;
				if(logging == 1){console.log(util.inspect(rows[0].amount,false,null));}
				bot.deleteMessage(msg.chat.id, msg.message_id);
	        	        msg.reply.text("The current amount of overall msgs is: " + util.inspect(rows[0].amount,false,null), { asReply: true }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
				connection.release();
	        	});
		});
	}
});

//sends a msg with the overall amount of msgs sent by the sender of command
bot.on('/total_ownamount', (msg) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/total_ownamount'))
        {
		bot.sendAction(msg.chat.id, 'typing');
        	let SELECT = "SELECT COUNT(*) AS amount, truncate(avg(char_length( `text` )),2) AS AVG_Length";
		let FROM = " FROM messagetable";
		let WHERE = " WHERE userid = " + hash(msg.from.id) + " AND `text` NOT LIKE '/%';";
		let sqlcmd = SELECT + FROM + WHERE;
		db.getConnection(function(err, connection) {
        		connection.query(sqlcmd, function(err, rows){
				if(err)throw err;
				if(logging == 1){console.log(util.inspect(rows[0].amount,false,null));}
                		msg.reply.text("Your current  amount of your own msgs is: " + util.inspect(rows[0].amount,false,null) + " and the AVG_length is: " + rows[0].AVG_Length, { asReply: true }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
				connection.release();
		        });
		});
	}
		
});

//sends a msg with the amount of msgs sent by the sender of command in this group
bot.on('/ownamount', (msg) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/ownamount'))
        {
		bot.sendAction(msg.chat.id, 'typing');
		let groupid = msg.chat.id
	        let SELECT = "SELECT COUNT(*) AS amount, truncate(avg(char_length( `text` )),2) AS AVG_Length";
		let FROM = " FROM messagetable";
		let WHERE = " WHERE userid = " + hash(msg.from.id) + " AND `text` NOT LIKE '/%' AND groupid = " + groupid + ";";
		let sqlcmd = SELECT + FROM + WHERE;
		db.getConnection(function(err, connection) {
		        connection.query(sqlcmd, function(err, rows){
        		        if(err)throw err;
				if(logging == 1){console.log(util.inspect(rows[0].amount,false,null));}
        	        	msg.reply.text("Your current  amount of your own msgs is: " + util.inspect(rows[0].amount,false,null) + " and the AVG_length is: " + rows[0].AVG_Length, { asReply: true }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
				connection.release();
		        });
		});
	}
});

//deletes all msgs by sender of command :(
bot.on('/iwanttodeletemymsgs', (msg) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/iwanttodeletemymsgs'))
        {
	        let DELETE = "DELETE FROM messagetable WHERE userid = " + hash(msg.from.id) + ";";
		let sqlcmd = DELTE + WHERE;
		dbwrite.getConnection(function(err, connection) {
		        connection.query(sqlcmd, function(err){
				if(err) throw err;
				if(logging == 1){console.log("Messages deleted!");}
				bot.deleteMessage(msg.chat.id, msg.message_id);
		                msg.reply.text("Your msgs have been deleted :(");
				connection.release();
	        	});
		});
	}
});

//counts the amount of msgs that have the requested chars in them
bot.on(/^\/count (.+)$/, (msg, props) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/count'))
        {
	        bot.sendAction(msg.chat.id, 'typing');
        	let searchtext = "";
	        let sqlcmd = "SELECT count(text) AS `text`, truncate(avg(char_length( `text` )),2) AS AVG_Length FROM messagetable WHERE text LIKE ?;";
        	var values = [["%" + props.match[1] + "%"]];
		db.getConnection(function(err, connection) {
		        connection.query(sqlcmd, [values], function(err, rows){
        		        if (err) throw err;
				if(logging == 1){console.log(util.inspect(rows[0].AVG_Length,false,null));}
	                	msg.reply.text("Your selected amount of msgs is: " + rows[0].text + " and the average length of the message it is used in is: " + rows[0].AVG_Length, { asReply: true }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
				connection.release();
	        	});
		});
	}
});

//counts the amount of msgs that have the requested chars in them
bot.on(/^\/count1week (.+)$/, (msg, props) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/count1week'))
        {
	        bot.sendAction(msg.chat.id, 'typing');
        	let searchtext = "";
	        let sqlcmd = "SELECT count(text) AS `text`, truncate(avg(char_length( `text` )),2) AS AVG_Length FROM messagetable WHERE text LIKE ? AND (time < (now() - INTERVAL 1 WEEK)) AND `text` NOT LIKE '/%';";
        	var values = [["%" + props.match[1] + "%"]];
	        db.getConnection(function(err, connection) {
        	        connection.query(sqlcmd, [values], function(err, rows){
                	        if (err) throw err;
				if(logging == 1){console.log(util.inspect(rows[0].AVG_Length,false,null));}
				msg.reply.text("Your selected amount of msgs is: " + rows[0].text + " and the average length of the message it is used in is: " + rows[0].AVG_Length, { asReply: true }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
        	        	connection.release();
                	});
	        });
	}
});

//sends a list containing the top 10 people writing msgs
bot.on('/top', (msg) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/top'))
        {
		bot.sendAction(msg.chat.id, 'typing');
        	let SELECT = "SELECT DISTINCT COUNT( `messagetable`.`msgid` ) AS `Msgs`, `messagetable`.`userid` AS `User`, TRUNCATE( AVG( CHAR_LENGTH ( `text` ) ), 2 ) AS `AVG_Length`, `optintable`.`username` AS `Username`"
		let FROM = "FROM { oj `db`.`messagetable` AS `messagetable` NATURAL LEFT OUTER JOIN `db`.`optintable` AS `optintable` }"
		let WHERE = " WHERE `messagetable`.`text` NOT LIKE '/%'"
		let GROUP = " GROUP BY `messagetable`.`userid`"
		let ORDER = " ORDER BY `Msgs` DESC LIMIT 10;"
		let sqlcmd = SELECT + FROM + WHERE + GROUP + ORDER;
		db.getConnection(function(err, connection) {
			connection.query(sqlcmd, function(err, rows){
				if(err) throw err;
				let result = "The top people writing msgs are: \n";
				for(var i in rows)
				{
					let user = "";
					if(rows[i].Username != null)
					{
						user = ". [" + rows[i].Username + "](t.me/" + rows[i].Username + ")";
					}else{
						user = ". " + rows[i].User;
					}
					result = result + i + user + " | Messages: " + rows[i].Msgs + "| avg. Length: " + rows[i].AVG_Length + "\n";
				}
				result = result + "\nIf you want you're name to show up use: /updateuserinfo\nWhen you want to anonymize youreself again use /deleteuserinfo";
				if(msg.chat.type!="private")
				{
					bot.deleteMessage(msg.chat.id, msg.message_id);
				}
				msg.reply.text(result, { parseMode: 'markdown' }).then(function(msg)
				{
					setTimeout(function(){
						bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
					}, 60000);
				});
				connection.release();
				if(logging == 1){console.log(result);}
	        	});
		});
	}
});

//sends a list containing the top 10 people writing msgs of today
bot.on('/toptoday', (msg) => {
        if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/toptoday'))
        {
                bot.sendAction(msg.chat.id, 'typing');
                let SELECT = "SELECT DISTINCT COUNT( `messagetable`.`msgid` ) AS `Msgs`, `messagetable`.`userid` AS `User`, TRUNCATE( AVG( CHAR_LENGTH ( `text` ) ), 2 ) AS `AVG_Length`, `optintable`.`username` AS `Username`"
                let FROM = "FROM { oj `db`.`messagetable` AS `messagetable` NATURAL LEFT OUTER JOIN `db`.`optintable` AS `optintable` }"
                let WHERE = " WHERE `messagetable`.`text` NOT LIKE '/%' AND DATE(`messagetable`.`time`) = CURDATE()"
                let GROUP = " GROUP BY `messagetable`.`userid`"
                let ORDER = " ORDER BY `Msgs` DESC LIMIT 10;"
                let sqlcmd = SELECT + FROM + WHERE + GROUP + ORDER;
                db.getConnection(function(err, connection) {
                        connection.query(sqlcmd, function(err, rows){
                                if(err) throw err;
                                let result = "The top people writing msgs are: \n";
                                for(var i in rows)
                                {
                                        let user = "";
                                        if(rows[i].Username != null)
                                        {
                                                user = ". [" + rows[i].Username + "](t.me/" + rows[i].Username + ")";
                                        }else{
                                                user = ". " + rows[i].User;
                                        }
                                        result = result + i + user + " | Messages#: " + rows[i].Msgs + "| avg. Length: " + rows[i].AVG_Length;
                                        result = result + "\n";
                                }
                                result = result + "\nIf you want you're name to show up use: /updateuserinfo\nWhen you want to anonymize youreself again use /deleteuserinfo";
                                if(msg.chat.type!="private")
                                {
                                        bot.deleteMessage(msg.chat.id, msg.message_id);
                                }
				msg.reply.text(result, { parseMode: 'markdown' }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
                                connection.release();
                                if(logging == 1){console.log(result);}
                        });
                });
        }
});

//sends a list containing the top 10 people writing msgs from last week
bot.on('/top1week', (msg) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/top1week'))
        {
	        bot.sendAction(msg.chat.id, 'typing');
        	let SELECT = "SELECT DISTINCT COUNT( `messagetable`.`msgid` ) AS `Msgs`, `messagetable`.`userid` AS `User`, TRUNCATE( AVG( CHAR_LENGTH ( `text` ) ), 2 ) AS `AVG_Length`, `optintable`.`username` AS `Username`";
		let FROM = "FROM { oj `db`.`messagetable` AS `messagetable` NATURAL LEFT OUTER JOIN `db`.`optintable` AS `optintable` }";
		let WHERE = " WHERE (`messagetable`.`text` NOT LIKE '/%') AND (`messagetable`.`time` < (now() - INTERVAL 1 WEEK))";
		let GROUP = " GROUP BY `messagetable`.`userid`";
		let ORDER = " ORDER BY `Msgs` DESC LIMIT 10;";
		let sqlcmd = SELECT + FROM + WHERE + GROUP + ORDER;
        	db.getConnection(function(err, connection) {
                	connection.query(sqlcmd, function(err, rows){
				if(err) throw err;
	                        let result = "The top people writing msgs are: \n";
        	                for(var i in rows)
                	        {
					let user = "";
                                	if(rows[i].Username != null)
	                                {
        	                                user = ". [" + rows[i].Username + "](t.me/" + rows[i].Username + ")";
                	                }else{
                        	                user = ". " + rows[i].User;
                                	}
	                                result = result + i + user + " | Messages#: " + rows[i].Msgs + "| avg. Length: " + rows[i].AVG_Length;
        	                        result = result + "\n";
                	        }
                        	result = result + "\nIf you want you're name to show up use: /updateuserinfo";
	                        msg.reply.text(result, { parseMode: 'markdown', asReply: true }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
        	                connection.release();
				if(logging == 1){console.log(result);}
        	        });
	        });
	}
});

//sends a list containing the top 10 people writing msgs in the group send from
bot.on('/topingroup', (msg) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/topingroup'))
        {
	        bot.sendAction(msg.chat.id, 'typing');
		let groupid = msg.chat.id
	        let SELECT = "SELECT DISTINCT COUNT( `msgid` ) AS `Msgs`, `userid` AS `User`, truncate(avg(char_length( `text` )),2) AS AVG_Length";
		let FROM = " FROM messagetable AS `messagetable`";
		let WHERE = " WHERE `text` NOT LIKE '/%' AND groupid = " + groupid;
		let GROUP = " GROUP BY `userid`";
		let ORDER = " ORDER BY `Msgs` DESC LIMIT 10;";
		let sqlcmd = SELECT + FROM + WHERE + GROUP + ORDER;
	        db.getConnection(function(err, connection) {
			connection.query(sqlcmd, function(err, rows){
                		if(err) throw err;
		                let result = "In this group the top msg writing people are: \n";
        		        for(var i in rows)
                		{
	                	        result = result + i + ". Messages: " + rows[i].Msgs + "\t\tUser: " + rows[i].User + "\t\tAVG_Length: " + rows[i].AVG_Length;
        	                	result = result + "\n";
		                }
        		        msg.reply.text(result, { asReply: true }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
				connection.release();
				if(logging == 1){console.log(result);}
	        	});	
		});
	}
});

//sends a list containing the top 10 people writing msgs in the group send from
bot.on('/topingroup1week', (msg) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/topingroup1week'))
        {
	        bot.sendAction(msg.chat.id, 'typing');
        	let groupid = msg.chat.id
	        let SELECT = "SELECT DISTINCT COUNT( `msgid` ) AS `Msgs`, `userid` AS `User`, truncate(avg(char_length( `text` )),2) AS AVG_Length";
		let FROM = " FROM messagetable AS `messagetable`";
		let WHERE = " WHERE `text` NOT LIKE '/%' AND groupid = " + groupid + " AND (time < (now() - INTERVAL 1 WEEK))";
		let GROUP = " GROUP BY `userid`";
		let ORDER = " ORDER BY `Msgs` DESC LIMIT 10;";
		let sqlcmd = SELECT + FROM + WHERE + GROUP + ORDER;
        	db.getConnection(function(err, connection) {
	                connection.query(sqlcmd, function(err, rows){
        	                if(err) throw err;
                	        let result = "In this group the top msg writing people are: \n";
                        	for(var i in rows)
	                        {
        	                        result = result + i + ". Messages: " + rows[i].Msgs + "\t\tUser: " + rows[i].User + "\t\tAVG_Length: " + rows[i].AVG_Length;
                	                result = result + "\n";
	                        }
        	                msg.reply.text(result, { asReply: true }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
                	        connection.release();
				if(logging == 1){console.log(result);}
	                });
        	});
	}
});

//sends the license
bot.on('/license', (msg) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/license'))
        {
	        msg.reply.text('Welcome!\nThis bot is from @thewildbear.\nHe is awsome!\nCheckout his github\nhttps://github.com/TheWildBear\nCheckout the repo at:\nhttps://github.com/TheWildBear/bigDataTelgrambot\n\nCopyright 2017 TheWildBear\nThis bot is licensed under the MIT License!\nSpread the love for free Software!', { parseMode: 'markdown', asReply: true });
		if(logging == 1){console.log("License sent");}
	}
});


//sends link to repo and informs about the bot
bot.on(['/start', '/help'], (msg) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/start')||msg.text.split(' ')[0].endsWith('/help'))
        {
		let startmsg = "Commands:\n/optin (agree to collecting your messages)\n/optout (disable collection)\n/checklogging (check collection status)\n/total_amount (total amount of messages collected)\n/total_ownamount (number of your collected messages)\n/iwanttodeletemymsgs (remove all collected data from the DB)\n\nThis bot collects data which will be used in the future for analysis and learning big data. It's opt in and does not collect any data if you are opted out. I would appreciate if you would donate me you're data!\nP.S. All data is anonymized";
		msg.reply.text(startmsg, { asReply: true });
		if(logging == 1){console.log("/start || /help sent");}
	}
});

bot.on('/ping', (msg) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/ping'))
        {
		msg.reply.text("Pong, Pung, Ping! Ente!!!! FOOOOOOOSSS!!!", { asReply: true });
		if(logging == 1){console.log("/start & /help sent");}
	}
});

bot.on('/info', (msg,data,props) => {
	if(msg.text.split(' ')[0].endsWith(botname)||msg.text.split(' ')[0].endsWith('/info'))
	{
		msg.reply.text(util.inspect(msg, true, null));
		msg.reply.text(util.inspect(data, true, null));
		msg.reply.text(util.inspect(props, false, null));
	}
});

bot.on('error', (error) => {
	console.log(util.inspect(error,true,99));
});

bot.on('reconnecting', (reconnecting) => {
	console.log(util.inspect(reconnecting,true,99));
	console.log("connection lost at: " + Date());
});

bot.on('reconnected', (reconnected) => {
        console.log(util.inspect(reconnected,true,99));
        console.log("connection successfully rebuilt at: " + Date());
});

bot.on('/getdata', (msg) => {
	let SELECT = "SELECT `msgid`  AS `Msgs`, `userid` AS `User`, `time` AS `Time`, `text` AS `Text`";
        let FROM = " FROM messagetable AS `messagetable`";
        let sqlcmd = SELECT + FROM;
	msg.reply.text("The data is gathered and saved!");
	db.getConnection(function(err, connection) {
                        connection.query(sqlcmd, function(err, rows){
                                if(err) throw err;
				//var result = "The msgs are:\n";
				var csv = "Counter,Message,User,Text,Time\n";
				var myjson = {};
				var data = {};
				let text = "";
                                for(var i in rows)
                                {
					/*try{
					rows[i].Text.split(" ").forEach(function(data){data = data + "1"; text = text + sha1(data) + " "});}
					catch(err){throw err}*/
					myjson[i] = [];
					data = {
						Message: rows[i].Msgs,
						User: rows[i].User,
						Text: rows[i].Text,
						Time: rows[i].Time
					}
					myjson[i].push(data);
					csv = csv + i + "," + rows[i].Msgs + "," + rows[i].User + "," + rows[i].Text + "," + rows[i].Time + "\n";
					text  = "";
                                }
				var jsonstream = fs.createWriteStream("./upload/output" + Date.now() + ".json");
				jsonstream.once('open', function(fd) {
					jsonstream.end(JSON.stringify(myjson));
				});
				var csvstream = fs.createWriteStream("./upload/output" + Date.now() + ".csv");
				csvstream.once('open', function(fd) {
                                        csvstream.end(csv);
                                });
				msg.reply.text("Data exported!");
                                connection.release();
                                if(logging == 1){console.log(result);}
                        });
                });
});


bot.on('/getdataperday', (msg) => {
	let SELECT = "SELECT `msgid` AS `Msgs`, DATE(`time`) AS `Time`";
        let FROM = " FROM messagetable AS `messagetable`";
	let GROUP = "GROUP BY DAY(`time`)";
        let sqlcmd = SELECT + FROM + GROUP;
	msg.reply.text("The data is gathered and saved!");
	db.getConnection(function(err, connection) {
                        connection.query(sqlcmd, function(err, rows){
                                if(err) throw err;
				//var result = "The msgs are:\n";
				var csv = "Messages,Time\n";
				var myjson = {};
				var data = {};
				let text = "";
                                for(var i in rows)
                                {
					/*try{
					rows[i].Text.split(" ").forEach(function(data){data = data + "1"; text = text + sha1(data) + " "});
					}
					catch(err){throw err}*/
					myjson[rows[i].Time] = [];
					data = {
						Messages: rows[i].Msgs,
					}
					//console.log(util.inspect(data,true,99));
					myjson[rows[i].Time].push(data);
					csv = csv + i + "," + rows[i].Msgs + "," + rows[i].Time + "\n";
					text = "";
                                }
				var jsonstream = fs.createWriteStream("./upload/outputperday" + Date.now() + ".json");
				jsonstream.once('open', function(fd) {
					jsonstream.end(JSON.stringify(myjson));
				});
				var csvstream = fs.createWriteStream("./upload/outputperday" + Date.now() + ".csv");
				csvstream.once('open', function(fd) {
                                        csvstream.end(csv);
                                });
				msg.reply.text("Data exported!");
                                connection.release();
                                if(logging == 1){console.log(result);}
                        });
                });
});


