/**
 * http://usejsdoc.org/
 */

/*jshint esversion: 6 */

/*
 *Version 1.0.2
 */
const version = "1.0.2";
const Telebot = require('telebot');
const bot = new Telebot({
	token: 'your_token',
	limit: 1000});
const util = require('util');
const mysql = require('mysql'); 
const hash = require('hash-int');
const fs = require('fs');
const logging = 0; //enables logging
var admin = 8846643;
var log;
var db = mysql.createPool({
	connectionLimit : 100,
	host: "localhost",
	user: "your_user",
	password: "your_pwd",
	database: "db",
	charset : 'utf8mb4'
});

var dbwrite = mysql.createPool({
	connectionLimit : 100,
        host: "localhost",
        user: "your_user",
        password: "your_pwd",
        database: "db",
        charset : 'utf8mb4'
});

bot.start();

bot.sendMessage(admin, "Bot started with version: " + version + " at: " + Date());

bot.on('text' ,(msg) => {
	var checkoptin = "SELECT COUNT(*) AS checkOptin FROM optintable where userid = " + hash(msg.from.id) + ";";
	dbwrite.getConnection(function(err, connection){
		connection.query(checkoptin, function(err, rows){
			if(err) throw err;
			if(rows[0].checkOptin==1){
				var sqlcmd = "INSERT INTO messagetable (msgid, userid, groupid, text, chattype) VALUES ?";
		        	var values = [[msg.message_id, hash(msg.from.id), msg.chat.id, msg.text, msg.chat.type]];
				if(logging == 1){console.log("messageid: " + msg.messageid + " userid: " + hash(msg.from.id) + " chatid: " + msg.chat.id + " message_text: " + msg.text + " chattype: " + msg.chat.type);}
		        	connection.query(sqlcmd, [values]);
			}
			connection.release();
		});
	});
});

//updates userinformation
bot.on('/updateuserinfo', (msg) => {
	let sqlcmd = "UPDATE optintable SET username = ? WHERE userid = ?";
	var values = [msg.from.username, hash(msg.from.id)];
	if(logging == 1){console.log(values);}
	dbwrite.getConnection(function(err, connection){
                db.query(sqlcmd, values, function(err, result){
                        if(err) throw err;
                        //bot.deleteMessage(msg.chat.id, msg.message_id);
			msg.reply.text("Your User infos have been updated");
                        connection.release();
                });
        });
});

//updates userinformation
bot.on('/deleteuserinfo', (msg) => {
        let sqlcmd = "UPDATE optintable SET username = null WHERE userid = ?";
        var values = [hash(msg.from.id)];
	if(logging == 1){console.log(values);}
        dbwrite.getConnection(function(err, connection){
                db.query(sqlcmd, values, function(err, result){
                        if(err) throw err;
                        //bot.deleteMessage(msg.chat.id, msg.message_id);
                        msg.reply.text("Your User infos have been updated");
                        connection.release();
                });
        });
});

bot.on('/userinfo', (msg) => {
	bot.getChatMember(msg.chat.id,msg.from.id).then(function (data)
	{
		if(logging == 1){console.log(util.inspect(data,true,null));}
		msg.reply.text(util.inspect(data,true,null));
	});
});

bot.on('/optin', (msg) => {
	bot.sendAction(msg.chat.id, 'typing');
	let sqlcmd = "INSERT IGNORE INTO optintable (userid) VALUES ?";
	var values = [[hash(msg.from.id)]];
	if(logging == 1){console.log(values);}
	dbwrite.getConnection(function(err, connection){
		db.query(sqlcmd, [values], function(err, result){
			if(err) throw err;
			bot.deleteMessage(msg.chat.id, msg.message_id);
			msg.reply.text("You opted in for data collection!");
			connection.release();
		});
	});
});

bot.on('/optout', (msg) =>{
	bot.sendAction(msg.chat.id, 'typing');
	let sqlcmd = "DELETE FROM optintable WHERE userid = ?";
	let values = [[hash(msg.from.id)]];
	if(logging == 1){console.log(values);}
	dbwrite.getConnection(function(err, connection) {
		connection.query(sqlcmd, [values], function(err, result){
			if(err) throw err;
			bot.deleteMessage(msg.chat.id, msg.message_id);
			msg.reply.text("You opted out for data collection");
			connection.release();
		});
	});
});

bot.on('/checklogging', (msg) => {
	bot.sendAction(msg.chat.id, 'typing');
	let sqlcmd = "SELECT COUNT(*) AS logging FROM optintable where userid = ?";
	let values = [[hash(msg.from.id)]];
	if(logging == 1){console.log(values);}
	db.getConnection(function(err, connection) {
		connection.query(sqlcmd, [values], function(err, rows){
			if(err) throw err;
			bot.deleteMessage(msg.chat.id, msg.message_id);
			msg.reply.text("Your current status is: " + util.inspect(rows[0].logging,false,null));
			connection.release();
		});
	});
});

//sends a msg with the total amount of msgs saved by the bot
bot.on('/total_amount', (msg) => {
	bot.sendAction(msg.chat.id, 'typing');
        let sqlcmd = "SELECT COUNT(*) AS amount FROM messagetable";
	db.getConnection(function(err, connection) {
	        connection.query(sqlcmd, function(err, rows){
			if(err) throw err;
			if(logging == 1){console.log(util.inspect(rows[0].amount,false,null));}
			bot.deleteMessage(msg.chat.id, msg.message_id);
	                msg.reply.text("The current amount of overall msgs is: " + util.inspect(rows[0].amount,false,null));
			connection.release();
        	});
	});
});

//sends a msg with the overall amount of msgs sent by the sender of command
bot.on('/total_ownamount', (msg) => {
	bot.sendAction(msg.chat.id, 'typing');
        let SELECT = "SELECT COUNT(*) AS amount, truncate(avg(char_length( `text` )),2) AS AVG_Length";
	let FROM = " FROM messagetable";
	let WHERE = " WHERE userid = " + hash(msg.from.id) + " AND `text` NOT LIKE '/%';";
	let sqlcmd = SELECT + FROM + WHERE;
	db.getConnection(function(err, connection) {
        	connection.query(sqlcmd, function(err, rows){
			if(err)throw err;
			if(logging == 1){console.log(util.inspect(rows[0].amount,false,null));}
                	msg.reply.text("Your current  amount of your own msgs is: " + util.inspect(rows[0].amount,false,null) + " and the AVG_length is: " + rows[0].AVG_Length, { asReply: true });
			connection.release();
	        });
	});
		
});

//sends a msg with the amount of msgs sent by the sender of command in this group
bot.on('/ownamount', (msg) => {
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
                	msg.reply.text("Your current  amount of your own msgs is: " + util.inspect(rows[0].amount,false,null) + " and the AVG_length is: " + rows[0].AVG_Length, { asReply: true });
			connection.release();
	        });
	});
});

//deletes all msgs by sender of command :(
bot.on('/iwanttodeletemymsgs', (msg) => {
        let DELETE = "DELETE FROM messagetable WHERE userid = " + hash(msg.from.id) + ";";
	let sqlcmd = DELTE + WHERE;
	dbwrite.getConnection(function(err, connection) {
	        connection.query(sqlcmd, function(err){
			if(err) throw err;
			if(logging == 1){console.log("Messages deleted!");}
			bot.deleteMessage(msg.chat.id, msg.message_id);
	                msg.reply.text("Your msgs have been deleted :(");
        	});
	});
});

//counts the amount of msgs that have the requested chars in them
bot.on(/^\/count (.+)$/, (msg, props) => {
        bot.sendAction(msg.chat.id, 'typing');
        let searchtext = "";
        let sqlcmd = "SELECT count(text) AS `text`, truncate(avg(char_length( `text` )),2) AS AVG_Length FROM messagetable WHERE text LIKE ?";
        var values = [["%" + props.match[1] + "%"]];
	db.getConnection(function(err, connection) {
	        connection.query(sqlcmd, [values], function(err, rows){
        	        if (err) throw err;
			if(logging == 1){console.log(util.inspect(rows[0].AVG_Length,false,null));}
                	msg.reply.text("Your selected amount of msgs is: " + rows[0].text + " and the average length of the message it is used in is: " + rows[0].AVG_Length, { asReply: true });
	        });
		connection.release();
	});
});

//counts the amount of msgs that have the requested chars in them
bot.on(/^\/count1week (.+)$/, (msg, props) => {
        bot.sendAction(msg.chat.id, 'typing');
        let searchtext = "";
        let sqlcmd = "SELECT count(text) AS `text`, truncate(avg(char_length( `text` )),2) AS AVG_Length FROM messagetable WHERE text LIKE ? AND (time < (now() - INTERVAL 1 WEEK))";
        var values = [["%" + props.match[1] + "%"]];
        db.getConnection(function(err, connection) {
                connection.query(sqlcmd, [values], function(err, rows){
                        if (err) throw err;
			if(logging == 1){console.log(util.inspect(rows[0].AVG_Length,false,null));}
			msg.reply.text("Your selected amount of msgs is: " + rows[0].text + " and the average length of the message it is used in is: " + rows[0].AVG_Length, { asReply: true });
                });
                connection.release();
        });
});

//sends a list containing the top 10 people writing msgs
bot.on('/top', (msg) => {
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
					user = " [" + rows[i].Username + "](t.me/" + rows[i].Username + ")";
				}else{
					user = " " + rows[i].User;
				}
				result = result + i + user + " | Messages#: " + rows[i].Msgs + "| avg. Length: " + rows[i].AVG_Length;
				result = result + "\n";
			}
			result = result + "\nIf you want you're name to show up use: /updateuserinfo\nWhen you want to anonymize youreself again use /deleteuserinfo";
			msg.reply.text(result, { parseMode: 'markdown' });
			connection.release();
			if(logging == 1){console.log(result);}
	        });
	});
});

//sends a list containing the top 10 people writing msgs from last week
bot.on('/top1week', (msg) => {
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
                                        user = " [" + rows[i].Username + "](t.me/" + rows[i].Username + ")";
                                }else{
                                        user = " " + rows[i].User;
                                }
                                result = result + i + user + " | Messages#: " + rows[i].Msgs + "| avg. Length: " + rows[i].AVG_Length;
                                result = result + "\n";
                        }
                        result = result + "\nIf you want you're name to show up use: /updateuserinfo";
                        msg.reply.text(result, { parseMode: 'markdown' });
                        connection.release();
			if(logging == 1){console.log(result);}
                });
        });
});

//sends a list containing the top 10 people writing msgs in the group send from
bot.on('/topingroup', (msg) => {
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
        	        msg.reply.text(result);
			connection.release();
			if(logging == 1){console.log(result);}
        	});	
	});
});

//sends a list containing the top 10 people writing msgs in the group send from
bot.on('/topingroup1week', (msg) => {
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
                        msg.reply.text(result);
                        connection.release();
			if(logging == 1){console.log(result);}
                });
        });
});

//sends the license
bot.on('/license', (msg) => {
        msg.reply.text('Welcome!\nThis bot is from @thewildbear.\nHe is awsome!\nCheckout his github\nhttps://github.com/TheWildBear\n \nCopyright 2017 TheWildBear\nThis bot is licensed under the MIT License!\nSpread the love for free Software!', { parseMode: 'markdown' });
	if(logging == 1){console.log("License sent");}
});


//sends link to repo and informs about the bot
bot.on(['/start', '/help'], (msg) => {
	let startmsg = "Commands:\n/optin (agree to collecting your messages)\n/optout (disable collection)\n/checklogging (check collection status)\n/total_amount (total amount of messages collected)\n/total_ownamount (number of your collected messages)\n/iwanttodeletemymsgs (remove all collected data from the DB)\n\nThis bot collects data which will be used in the future for analysis and learning big data. It's opt in and does not collect any data if you are opted out. I would appreciate if you would donate me you're data!\nP.S. All data is anonymized";
	bot.deleteMessage(msg.chat.id, msg.message_id);
	msg.reply.text(startmsg);
	if(logging == 1){console.log("/start & /help sent");}
});

bot.on('/ping', (msg) => {
	msg.reply.text("Pong, Pung, Ping! Ente!!!! FOOOOOOOSSS!!!");
	if(logging == 1){console.log("/start & /help sent");}
});
