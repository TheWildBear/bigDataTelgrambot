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
		bot.deleteMessage(msg.chat.id, msg.message_id);
		msg.reply.text("You opted in for data collection!");
	});
});

bot.on('/optout', (msg) =>{
	let sqlcmd = "DELETE FROM optintable WHERE userid = " + hash(msg.from.id) + ";";
	db.query(sqlcmd, function(err, result){
		bot.deleteMessage(msg.chat.id, msg.message_id);
		msg.reply.text("You opted out for data collection");
	});
});

bot.on('/checklogging', (msg) => {
	let sqlcmd = "SELECT COUNT(*) AS logging FROM optintable where userid = " + hash(msg.from.id) + ";";
	db.query(sqlcmd, function(err, rows){
		bot.deleteMessage(msg.chat.id, msg.message_id);
		msg.reply.text("Your current status is: " + util.inspect(rows[0].logging,false,null));
	});
});

bot.on('/amount', (msg) => {
        let sqlcmd = "SELECT COUNT(*) AS amount FROM messagetable";
        db.query(sqlcmd, function(err, rows){
		bot.deleteMessage(msg.chat.id, msg.message_id);
                msg.reply.text("The current amount of overall msgs is: " + util.inspect(rows[0].amount,false,null));
        });
});

bot.on('/ownamount', (msg) => {
        let sqlcmd = "SELECT COUNT(*) AS amount FROM messagetable WHERE userid = " + hash(msg.from.id) + ";";
        db.query(sqlcmd, function(err, rows){
                msg.reply.text("Your current  amount of your own msgs is: " + util.inspect(rows[0].amount,false,null), { asReply: true });
        });
});

bot.on('/deletemymsgs', (msg) => {
        let sqlcmd = "DELETE FROM messagetable WHERE userid = " + hash(msg.from.id) + ";";
        db.query(sqlcmd, function(err, rows){
		bot.deleteMessage(msg.chat.id, msg.message_id);
                msg.reply.text("Your msgs have been deleted :(");
        });
});

bot.on(['/start', '/help'], (msg) => {
	let startmsg = "Commands:\n/optin (agree to collecting your messages)\n/optout (disable collection)\n/checklogging (check collection status)\n/amount (total amount of messages collected)\n/ownamount (number of your collected messages)\n/deletemymsgs (remove all collected data from the DB)\n\nThis bot collects data which will be used in the future for analysis and learning big data. It's opt in and does not collect any data if you are opted out. I would appreciate if you would donate me you're data!\nP. S. All data is anonymized";
	bot.deleteMessage(msg.chat.id, msg.message_id);
	msg.reply.text(startmsg);
});


bot.on(/^\/searchandcount (.+)$/, (msg, props) => {
	let searchtext = props.match[1];
	console.log(searchtext);
	let sqlcmd = 'SELECT count(text) FROM messagetable WHERE text LIKE %'+ searchtext +'%;';
	console.log(sqlcmd);
	
	/*db.query(sqlcmd, function(err, rows){
		let answer = "The from you requested data is:\n" + rows[0];
		msg.reply.text();
	});*/
});

/*bot.on('/top', (msg) => {
        let sqlcmd = "SELECT DISTINCT COUNT( `msgid` ) AS `Msgs`, `userid` AS `User` FROM `db`.`messagetable` AS `messagetable` WHERE `text` NOT LIKE '/%' GROUP BY `userid` ORDER BY `Msgs` DESC LIMIT 10;"
	db.query(sqlcmd, function(err, rows){
                let answer = "The from you requested data is:\n" + util.inspect(rows,false,null);
                msg.reply.text();
        });
});*/

bot.on('/licence', (msg) => {
        msg.reply.text('Welcome!\nThis bot is from @thewildbear.\nHe is awsome!\nCheckout his github\nhttps://github.com/TheWildBear\n \nCopyright 2017 TheWildBear\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.', { parseMode: 'markdown' });
});
