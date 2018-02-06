ALTER TABLE `db`.`optintable`
ADD COLUMN `username` VARCHAR(255) NULL AFTER `userid`;
ADD COLUMN `state` VARCHAR(255) NULL AFTER `username`;
