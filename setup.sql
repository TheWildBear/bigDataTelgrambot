CREATE DATABASE IF NOT EXISTS db;

USE db;

CREATE TABLE IF NOT EXISTS `messagetable` (
        `msgid` DOUBLE NOT NULL,
        `userid` DOUBLE NOT NULL,
        `username` varchar(255),
        `groupid` DOUBLE NOT NULL,
        `text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
        `chattype` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
        PRIMARY KEY (`msgid`,`userid`,`groupid`)
);

CREATE TABLE IF NOT EXISTS `optintable` (
        `userid` DOUBLE NOT NULL,
	`username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        PRIMARY KEY (`userid`)
);

CREATE TABLE IF NOT EXISTS `broadcast` (
        `userid` DOUBLE NOT NULL,
	PRIMARY KEY (`userid`)
);
