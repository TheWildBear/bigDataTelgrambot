CREATE DATABASE IF NOT EXISTS db;

USE db;

CREATE TABLE IF NOT EXISTS `messagetable` (
        `msgid` DOUBLE NOT NULL,
        `userid` DOUBLE NOT NULL,
        `username` varchar(255),
        `groupid` DOUBLE NOT NULL,
        `text` varchar(255) NOT NULL,
        `chattype` varchar(255) NOT NULL,
        PRIMARY KEY (`msgid`,`userid`,`groupid`)
);

CREATE TABLE IF NOT EXISTS `optintable` (
        `userid` INT NOT NULL,
        PRIMARY KEY (`userid`)
);
