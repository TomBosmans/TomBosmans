---
layout: post
title: flatten timeslots in sql
---

This post and sql is based on code written by [Lenny Donnez](https://www.linkedin.com/in/lenny-donnez-139b97b9/), who shall from now on be known as _The SQL Meister_.

To get started, we will create a database named `playground` and create a table in it named `timeslots`:
```sql
CREATE TABLE timeslots (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  date Date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL
);
```
This will create the following table:
```sql
playground=# \d timeslots
                                      Table "public.timeslots"
   Column   |          Type          | Collation | Nullable |                Default
------------+------------------------+-----------+----------+---------------------------------------
 id         | integer                |           | not null | nextval('timeslots_id_seq'::regclass)
 user_id    | integer                |           | not null |
 date       | date                   |           | not null |
 start_time | time without time zone |           | not null |
 end_time   | time without time zone |           | not null |
Indexes:
    "timeslots_pkey" PRIMARY KEY, btree (id)
```

Next we will insert some data:
```sql
INSERT INTO timeslots(user_id, date, start_time, end_time)
VALUES
(1, '2020-12-24', '00:00', '23:00'),
(1, '2020-12-24', '00:00:', '24:00'),

(2, '2020-12-24', '18:00:', '19:00'),
(2, '2020-12-24', '09:00:', '17:00'),

(3, '2020-12-24', '17:00', '19:00'),
(3, '2020-12-24', '09:00', '17:00'),

(4, '2020-12-24', '09:00', '17:00'),
(4, '2020-12-24', '15:00', '19:00'),

(1, '2020-12-25', '11:00', '12:00'),
(1, '2020-12-25', '09:00', '10:00'),
(1, '2020-12-25', '13:00', '14:00'),

(2, '2020-12-25', '09:00', '10:00'),
(2, '2020-12-25', '11:00', '12:00'),
(2, '2020-12-25', '13:00', '14:00'),

(3, '2020-12-25', '09:00', '10:00'),
(3, '2020-12-25', '09:30', '12:00'),
(3, '2020-12-25', '13:00', '14:00'),

(1, '2020-12-26', '09:00', '10:00'),
(1, '2020-12-26', '11:00', '12:00'),
(1, '2020-12-26', '13:00', '14:00'),

(4, '2020-12-26', '08:00', '12:00'),
(4, '2020-12-26', '09:45', '12:00'),
(4, '2020-12-26', '13:00', '18:00'),
(4, '2020-12-26', '15:00', '17:00'),
(4, '2020-12-26', '17:00', '21:00');
```

so when we check our data:
```sql
    date    | user_id | start_time | end_time
------------+---------+------------+----------
 2020-12-24 |       1 | 00:00:00   | 23:00:00
 2020-12-24 |       1 | 00:00:00   | 24:00:00
 2020-12-24 |       2 | 09:00:00   | 17:00:00
 2020-12-24 |       2 | 18:00:00   | 19:00:00
 2020-12-24 |       3 | 09:00:00   | 17:00:00
 2020-12-24 |       3 | 17:00:00   | 19:00:00
 2020-12-24 |       4 | 09:00:00   | 17:00:00
 2020-12-24 |       4 | 15:00:00   | 19:00:00
 2020-12-25 |       1 | 09:00:00   | 10:00:00
 2020-12-25 |       1 | 11:00:00   | 12:00:00
 2020-12-25 |       1 | 13:00:00   | 14:00:00
 2020-12-25 |       2 | 09:00:00   | 10:00:00
 2020-12-25 |       2 | 11:00:00   | 12:00:00
 2020-12-25 |       2 | 13:00:00   | 14:00:00
 2020-12-25 |       3 | 09:00:00   | 10:00:00
 2020-12-25 |       3 | 09:30:00   | 12:00:00
 2020-12-25 |       3 | 13:00:00   | 14:00:00
 2020-12-26 |       1 | 09:00:00   | 10:00:00
 2020-12-26 |       1 | 11:00:00   | 12:00:00
 2020-12-26 |       1 | 13:00:00   | 14:00:00
 2020-12-26 |       4 | 08:00:00   | 12:00:00
 2020-12-26 |       4 | 09:45:00   | 12:00:00
 2020-12-26 |       4 | 13:00:00   | 18:00:00
 2020-12-26 |       4 | 15:00:00   | 17:00:00
 2020-12-26 |       4 | 17:00:00   | 21:00:00
(25 rows)
```

We will be using a few [CTE's](https://www.postgresql.org/docs/9.1/queries-with.html) to keep the sql a little bit more readable. Our first cte, the `timeslots_meta_data` will collect all the meta data we need to start flattening, while the second one, the `flattened_timeslots`, will be used to determine the actual start and end time from the user on a specific date. To make sure we only look at timeslots from the same user on the same date, we use 2 windows. `previous_timeslots` window will contain all the previous timeslots from the same user on the same date. `next_timelsots` window will contain all the next timeslots from the same user ont he same date.
```sql
WITH
  timeslots_meta_data AS (
    SELECT
      user_id,
      date,
      start_time,
      end_time,
      MAX(end_time) OVER previous_timeslots AS previous_end_time,
      MIN(start_time) OVER previous_timeslots AS previous_start_time,
      MAX(end_time) OVER next_timelsots AS next_end_time,
      MIN(end_time) OVER next_timelsots AS next_start_time,
      FIRST_VALUE(end_time) OVER previous_timeslots AS first_end_time,
      FIRST_VALUE(start_time) OVER previous_timeslots AS first_start_time
    FROM timeslots
    GROUP BY user_id, date, start_time, end_time
    WINDOW
      previous_timeslots AS (
        PARTITION BY user_id, date
        ORDER BY start_time ASC, end_time ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ),
      next_timelsots AS (
        PARTITION BY user_id, date
        ORDER BY start_time DESC, end_time DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      )
    ORDER BY date, start_time, end_time
  ),

  flattened_timeslots AS (
    SELECT
      user_id,
      date,
      CASE
        WHEN previous_start_time IS NULL
             THEN start_time
        WHEN start_time >= first_start_time
             AND end_time <= first_end_time
             AND next_start_time IS NULL
             AND next_end_time IS NULL
             THEN first_end_time
        WHEN start_time >= first_start_time
             AND end_time <= first_end_time
             AND next_start_time > first_start_time
             AND next_end_time <= first_end_time
             AND previous_start_time >= first_start_time
             AND previous_end_time <= first_end_time
             THEN first_end_time
        WHEN start_time = previous_start_time
             AND end_time = previous_end_time
             THEN start_time
        WHEN start_time >= previous_end_time
             AND end_time >= start_time
             THEN start_time
        WHEN start_time <= previous_end_time
             AND end_time > previous_end_time
             THEN previous_end_time
        WHEN start_time <= previous_end_time
             AND end_time <= previous_end_time
             THEN previous_end_time
        ELSE next_start_time
      END as actual_start_time,
      CASE
        WHEN previous_end_time IS NULL
             THEN end_time
        WHEN start_time >= first_start_time
             AND end_time <= first_end_time
             AND next_start_time IS NULL
             AND next_end_time IS NULL
             THEN first_end_time
        WHEN start_time >= first_start_time
             AND end_time <= first_end_time
             AND next_start_time > first_start_time
             AND next_end_time <= first_end_time
             AND previous_start_time >= first_start_time
             AND previous_end_time <= first_end_time
             THEN first_end_time
        WHEN start_time = previous_start_time
             AND end_time = previous_end_time
             THEN end_time
        WHEN start_time >= previous_end_time
             AND end_time >= start_time
             THEN end_time
        WHEN start_time <= previous_end_time
             AND end_time >= previous_end_time
             THEN end_time
        ELSE previous_end_time
      END as actual_end_time

    FROM timeslots_meta_data
    GROUP BY user_id, date, start_time, end_time, previous_start_time, previous_end_time,
             next_start_time, next_end_time, first_start_time, first_end_time
    ORDER BY user_id, date, actual_start_time, actual_end_time
  )

SELECT
  user_id,
  date,
  actual_start_time as start_time,
  actual_end_time as end_time
FROM flattened_timeslots
WHERE actual_start_time <> actual_end_time
ORDER BY date, user_id, actual_start_time, actual_end_time;
```

This will give us the following result:
```sql
 user_id |    date    | start_time | end_time
---------+------------+------------+----------
       1 | 2020-12-24 | 00:00:00   | 23:00:00
       1 | 2020-12-24 | 23:00:00   | 24:00:00
       2 | 2020-12-24 | 09:00:00   | 17:00:00
       2 | 2020-12-24 | 18:00:00   | 19:00:00
       3 | 2020-12-24 | 09:00:00   | 17:00:00
       3 | 2020-12-24 | 17:00:00   | 19:00:00
       4 | 2020-12-24 | 09:00:00   | 17:00:00
       4 | 2020-12-24 | 17:00:00   | 19:00:00
       1 | 2020-12-25 | 09:00:00   | 10:00:00
       1 | 2020-12-25 | 11:00:00   | 12:00:00
       1 | 2020-12-25 | 13:00:00   | 14:00:00
       2 | 2020-12-25 | 09:00:00   | 10:00:00
       2 | 2020-12-25 | 11:00:00   | 12:00:00
       2 | 2020-12-25 | 13:00:00   | 14:00:00
       3 | 2020-12-25 | 09:00:00   | 10:00:00
       3 | 2020-12-25 | 10:00:00   | 12:00:00
       3 | 2020-12-25 | 13:00:00   | 14:00:00
       1 | 2020-12-26 | 09:00:00   | 10:00:00
       1 | 2020-12-26 | 11:00:00   | 12:00:00
       1 | 2020-12-26 | 13:00:00   | 14:00:00
       4 | 2020-12-26 | 08:00:00   | 12:00:00
       4 | 2020-12-26 | 13:00:00   | 18:00:00
       4 | 2020-12-26 | 18:00:00   | 21:00:00
(23 rows)
```
