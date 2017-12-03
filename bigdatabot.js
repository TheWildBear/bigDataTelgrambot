/**
 * http://usejsdoc.org/
 */

/*jshint esversion: 6 */
const Telebot = require('telebot');
const bot = new Telebot({
        token: 'your_token',
        limit: 0});
const util = require('util');
const mysql = require('mysql');
var fs = require('fs');
var log;
var db = mysql.createConnection({
        host: "localhost",
        user: "your_user",
        password: "yourpwd!",
        database: "db"
});

db.connect(function(err) {
        if (err) throw err;
        //db.query("SELECT * FROM messagetable", function (err, result, fields) {
        //      if (err) throw err;
        //      console.log(result);
        //});
});

bot.start();

bot.on('text' ,(msg) => {
        var checkoptin = "SELECT COUNT(*) AS checkOptin FROM optintable where userid = " + msg.from.id + ";";
        db.query(checkoptin, function(err, rows){
                console.log(util.inspect(rows[0].checkOptin,false,null));
                if(rows[0].checkOptin==1){
                        var sqlcmd = "INSERT INTO messagetable (msgid, userid, groupid, text, chattype) VALUES ?";
                        var values = [[msg.message_id, msg.from.id, msg.chat.id, msg.text, msg.chat.type]];
                        db.query(sqlcmd, [values], function(err, result){
                                console.log("debug message");
                        });
                }
        });
});

bot.on('/optin', (msg) => {
        let sqlcmd = "INSERT INTO optintable (userid) VALUES ?";
        var values = [[msg.from.id]];
        db.query(sqlcmd, [values], function(err, resule){
                console.log("user added to whitlist: " + msg.from.id);
        });
});
