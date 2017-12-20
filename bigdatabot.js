/**
 * http://usejsdoc.org/
 */

/*jshint esversion: 6 */
const Telebot = require('telebot');
const bot = new Telebot({
	token: 'your_token',
	limit: 1000});
const util = require('util');
const mysql = require('mysql'); 
const hash = require('hash-int');
var fs = require('fs');
var log;
var db = mysql.createConnection({
	host: "localhost",
	user: "your_user",
	password: "your_pwd",
	database: "db"
});

db.connect(function(err) {
	if (err) throw err;
});

bot.start();

bot.on('text' ,(msg) => {
	var checkoptin = "SELECT COUNT(*) AS checkOptin FROM optintable where userid = " + hash(msg.from.id) + ";";
	db.query(checkoptin, function(err, rows){
		if(err) throw err;
		if(rows[0].checkOptin==1){
			var sqlcmd = "INSERT INTO messagetable (msgid, userid, groupid, text, chattype) VALUES ?";
		        var values = [[msg.message_id, hash(msg.from.id), msg.chat.id, msg.text, msg.chat.type]];
		        db.query(sqlcmd, [values]);
		}
	});
});

bot.on('/optin', (msg) => {
	let sqlcmd = "INSERT INTO optintable (userid) VALUES ?";
	var values = [[hash(msg.from.id)]];
	db.query(sqlcmd, [values], function(err, result){
		if(err) throw err;
		bot.deleteMessage(msg.chat.id, msg.message_id);
		msg.reply.text("You opted in for data collection!");
	});
});

bot.on('/optout', (msg) =>{
	let sqlcmd = "DELETE FROM optintable WHERE userid = " + hash(msg.from.id) + ";";
	db.query(sqlcmd, function(err, result){
		if(err) throw err;
		bot.deleteMessage(msg.chat.id, msg.message_id);
		msg.reply.text("You opted out for data collection");
	});
});

bot.on('/checklogging', (msg) => {
	let sqlcmd = "SELECT COUNT(*) AS logging FROM optintable where userid = " + hash(msg.from.id) + ";";
	db.query(sqlcmd, function(err, rows){
		if(err) throw err;
		bot.deleteMessage(msg.chat.id, msg.message_id);
		msg.reply.text("Your current status is: " + util.inspect(rows[0].logging,false,null));
	});
});

bot.on('/amount', (msg) => {
        let sqlcmd = "SELECT COUNT(*) AS amount FROM messagetable";
        db.query(sqlcmd, function(err, rows){
		if(err) throw err;
		bot.deleteMessage(msg.chat.id, msg.message_id);
                msg.reply.text("The current amount of overall msgs is: " + util.inspect(rows[0].amount,false,null));
        });
});

bot.on('/ownamount', (msg) => {
        let sqlcmd = "SELECT COUNT(*) AS amount FROM messagetable WHERE userid = " + hash(msg.from.id) + " AND `text` NOT LIKE '/%';";
        db.query(sqlcmd, function(err, rows){
		if(err)throw err;
                msg.reply.text("Your current  amount of your own msgs is: " + util.inspect(rows[0].amount,false,null), { asReply: true });
        });
});

bot.on('/deletemymsgs', (msg) => {
        let sqlcmd = "DELETE FROM messagetable WHERE userid = " + hash(msg.from.id) + ";";
        db.query(sqlcmd, function(err){
		if(err) throw err;
		bot.deleteMessage(msg.chat.id, msg.message_id);
                msg.reply.text("Your msgs have been deleted :(");
        });
});

bot.on(['/start', '/help'], (msg) => {
	let startmsg = "Commands:\n/optin (agree to collecting your messages)\n/optout (disable collection)\n/checklogging (check collection status)\n/amount (total amount of messages collected)\n/ownamount (number of your collected messages)\n/deletemymsgs (remove all collected data from the DB)\n\nThis bot collects data which will be used in the future for analysis and learning big data. It's opt in and does not collect any data if you are opted out. I would appreciate if you would donate me you're data!\nP. S. All data is anonymized";
	bot.deleteMessage(msg.chat.id, msg.message_id);
	msg.reply.text(startmsg);
});


bot.on(/^\/count (.+)$/, (msg, props) => {
	let searchtext = "";
        let sqlcmd = "SELECT count(text) AS `text` FROM messagetable WHERE text LIKE ?";
	var values = [[props.match[1]]];
       	db.query(sqlcmd, [values], function(err, rows){
		if (err) throw err;
		msg.reply.text("Your selected amount of msgs is: " + rows[0].text, { asReply: true });
        });
});

bot.on('/top', (msg) => {
        let sqlcmd = "SELECT DISTINCT COUNT( `msgid` ) AS `Msgs`, `userid` AS `User` FROM `db`.`messagetable` AS `messagetable` WHERE `text` NOT LIKE '/%' GROUP BY `userid` ORDER BY `Msgs` DESC LIMIT 10;"
	db.query(sqlcmd, function(err, rows){
		if(err) throw err;
		let result = "";
		for(var i in rows)
		{
			result = result + i + ". Positon" + "Messages: " + rows[i].Msgs + "\t\tUser: " + rows[i].User;
			result = result + "\n";
		}
		msg.reply.text(result);
        });
});

bot.on('/licence', (msg) => {
        msg.reply.text('Welcome!\nThis bot is from @thewildbear.\nHe is awsome!\nCheckout his github\nhttps://github.com/TheWildBear\n \nCopyright 2017 TheWildBear\nThis bot is licensed under the MIT License!\nSpread the love for free Software!', { parseMode: 'markdown' });
});
