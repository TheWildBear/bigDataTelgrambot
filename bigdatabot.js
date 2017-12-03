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
                        var sqlcmd = "INSERT INTO messagetable (msgid, userid, groupid, text, chattype, time) VALUES ?";
                        var values = [[msg.message_id, hash(msg.from.id), msg.chat.id, msg.text, msg.chat.type, msg.date]];
                        db.query(sqlcmd, [values], function(err, result){
                                console.log("message added");
                        });
                }
        });
});

bot.on('/optin', (msg) => {
        let sqlcmd = "INSERT INTO optintable (userid) VALUES ?";
        var values = [[hash(msg.from.id)]];
        db.query(sqlcmd, [values], function(err, result){
                msg.reply.text("You opted in for data collection!");
        });
});

bot.on('/optout', (msg) =>{
        let sqlcmd = "DELETE FROM optintable WHERE userid = " + hash(msg.from.id) + ";";
        db.query(sqlcmd, function(err, result){
                msg.reply.text("You opted out for data collection");
        });
});

bot.on('/checklogging', (msg) => {
        let sqlcmd = "SELECT COUNT(*) AS logging FROM optintable where userid = " + hash(msg.from.id) + ";";
        db.query(sqlcmd, function(err, rows){
                msg.reply.text("Your current status is: " + util.inspect(rows[0].logging,false,null));
        });
});

bot.on('/amount', (msg) => {
        let sqlcmd = "SELECT COUNT(*) AS amount FROM messagetable";
        db.query(sqlcmd, function(err, rows){
                msg.reply.text("Your current amount of msgs is: " + util.inspect(rows[0].amount,false,null));
        });
});

bot.on('/ownamount', (msg) => {
        let sqlcmd = "SELECT COUNT(*) AS amount FROM messagetable WHERE userid = " + hash(msg.from.id) + ";";
        db.query(sqlcmd, function(err, rows){
                msg.reply.text("Your current  amount of your own msgs is: " + util.inspect(rows[0].amount,false,null));
        });
});
