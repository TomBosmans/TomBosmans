---
layout: post
title: Replication with mysql 5.7
date: 2020-01-22 10:53 +0100
---
## Before we get started
you will get to see a lot of `master` and `slave` as that is the terminology mysql 5.7 still uses.
When you start to [google](https://duckduckgo.com/) it you might come across the newer terminology being `primary` and `replica`.
So note that `master` is `primary` and `slave` is `replica`.

## Setting up the master
You want to edit the `/etc/my.cnf`. If you have issues with your mysql after updating this file try to add `[mysqld]` on top of it.
```shell
[mysqld]
log-bin=mysql-bin
server-id=1
```
- `log-bin` enables binary logging, this is the basis for replicating so without it this will not work.
- `server-id` is required on the master and all the slaves. there is no rule on how to number them as long it is a positive integer between 1 and (2^32)−1.

### Create a user
Good idea is to make a user specifically for replication, although this is not required.

> :warning: You should be aware that the replication user name and password are stored in plain text in the master info repository file or table :see_no_evil: 

[REPLICATION SLAVE](https://dev.mysql.com/doc/refman/5.7/en/privileges-provided.html#priv_replication-slave) is all that needs to be granted.

```sql
mysql> CREATE USER 'repl'@'%.example.com' IDENTIFIED BY 'password';
mysql> GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%.example.com';
```
_With this our user `repl` can connect for replication from any host within the example.com domain._

### Obtain the master binary log coordinates.
1. first start a session on the master by connecting to it with the command-line client and [flush tables with readlock](https://dev.mysql.com/doc/refman/5.7/en/flush.html#flush-tables-with-read-lock)
```sql
mysql> FLUSH TABLES WITH READ LOCK;
```
2. In a different session on the master, use the [SHOW MASTER STATUS](https://dev.mysql.com/doc/refman/5.7/en/show-master-status.html) statement to determine the current binary log file name and position

You will need this info later 
```sql
mysql > SHOW MASTER STATUS;
+------------------+----------+--------------+------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB |
+------------------+----------+--------------+------------------+
| mysql-bin.000003 | 73       |              |                  |
+------------------+----------+--------------+------------------+
```
_The File column shows the name of the log file and the Position column shows the position within the file. In this example, the binary log file is mysql-bin.000003 and the position is 73._

### Synchronize slaves with master
Create a dump!

>  ⚠ If you do not use `--master-data`, then it is necessary to lock all tables in a separate session manually.

The following example dumps all databases to a file named dbdump.db, and includes the `--master-data` option which automatically appends the `CHANGE MASTER TO` statement required on the slave to start the replication process: 
```shell
shell> mysqldump --all-databases --master-data > dbdump.db
``` 
_it is also possible to pick specific db's instead of `--all-databases`_

### UNLOCK!
we configured our master and got the status information we need, make sure to unlock the tables before moving on to the slaves.
```sql
mysql> UNLOCK TABLES;
```

## Setting up slaves
again we will start by editing the `/etc/my.cnf` file. We don't need to log bin, but a unique server-id is a must!
```shell
[mysqld]
server-id=2
```

### Setting up master configuration on the slave
with our dump this should not be necessary, but if at some point you need to change it later on this is how:
```sql
mysql> CHANGE MASTER TO
    ->     MASTER_HOST='master_host_name',
    ->     MASTER_USER='replication_user_name',
    ->     MASTER_PASSWORD='replication_password',
    ->     MASTER_LOG_FILE='recorded_log_file_name',
    ->     MASTER_LOG_POS=recorded_log_position;
```

### Run the dump file
1. Start the slave, using the `--skip-slave-start` option so that replication does not start. 
2. Import the dump file: 
```shell
shell> mysql < dbdump.dump
```

you start/stop a slave with
```sql
mysql> START/STOP SLAVE;
```
or show the status:
```sql
mysql> SHOW SLAVE STATUS\G
```

## sources
- [mysql docs](https://dev.mysql.com/doc/refman/5.7/en/replication-howto-masterbaseconfig.html)
