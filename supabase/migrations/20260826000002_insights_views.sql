create or replace view yearly_counts as
select extract(year from date_finished)::int as year, type, count(*) as count
from content where status='completed' and date_finished is not null
group by year, type order by year desc;

create or replace view genre_counts as
select unnest(genre) as genre, count(*) as count from film_details group by genre order by count desc;

create or replace view rating_distribution as
select rating, count(*) as count from content where rating is not null group by rating order by rating;
