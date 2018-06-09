ALTER TABLE `db`.`optintable`
ADD COLUMN `username` VARCHAR(255) NULL AFTER `userid`;
ADD COLUMN `state` VARCHAR(255) NULL AFTER `username`;

ALTER TABLE `db`.`messagetable` 
CHANGE COLUMN `msgid` `msgid` DOUBLE NULL DEFAULT NULL ,
CHANGE COLUMN `userid` `userid` DOUBLE NULL DEFAULT NULL ,
CHANGE COLUMN `groupid` `groupid` DOUBLE NULL DEFAULT NULL ,
DROP PRIMARY KEY,
ADD PRIMARY KEY (`time`, `groupid`, `userid`, `msgid`);
