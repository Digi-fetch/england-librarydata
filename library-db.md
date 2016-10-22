# Libraries database setup

These are instructions to set up a spatial database using the Libraries Taskforce open dataset.

## Pre-requisites

- A [postGIS](http://postgis.net/install/) database setup.

## Dataset: OS Code-point Open

The Ordnance Survey have an open data product listing all postcodes in the UK, complete with geo-cordinates (the centre of the postcode) and various codes specifying the authorities that postcode falls within.  This data is provided as a series of CSV files.  There are many ways to combine CSV files into one depending on operating system.  

- For a simple Windows PC, run the following command using the cmd.exe tool.

```
copy *.csv postcodes.csv
```

Once the data is in a single CSV file it can be imported into a database. 

- Create the table:

```
create table postcodes
(
  postcode character varying(8) not null,
  positional_quality_indicator integer,
  eastings numeric,
  northings numeric,
  country_code character varying(9),
  nhs_regional_ha_code character varying(9),
  nhs_ha_code character varying(9),
  admin_county_code character varying(9),
  admin_district_code character varying(9),
  admin_ward_code character varying(9),
  constraint pk_postcode primary key (postcode)
)
```

- Import the postcodes.csv data:

```
copy postcodes FROM 'postcodes.csv' delimiter ',' csv;
```

## Dataset: OS boundaries

- Download [Boundary Lines](https://www.ordnancesurvey.co.uk/opendatadownload/products.html) from the OS Open Data products.
- From a command line, run the following commands (requires **shp2pgsql** which should be available with PostGIS).  This will automatically create the relevant tables.

```
shp2pgsql "county_electoral_division_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "county_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "district_borough_unitary_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "district_borough_unitary_ward_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "european_region_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "greater_london_const_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "high_water_polyline.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "parish_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "scotland_and_wales_const_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "scotland_and_wales_region_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "unitary_electoral_division_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "westminster_const_region.shp" | psql -d uklibraries -U "postgres"
```

## Dataset: ONS Population estimates mid-2015

- Download from [ONS mid-year population estimates](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/populationestimatesforukenglandandwalesscotlandandnorthernireland)
- Create a basic table with 3 columns to store the counts.

```
create table population
(
  code character varying(9) not null,
  name text,
  population integer,
  constraint population_pkey primary key (code)
)
```

- Import the data from the CSV file.

```
copy population FROM 'ukpopulation.csv' delimiter ',' csv;
```


## Dataset: Lower super output areas

- Download from [ONS Geoportal](http://geoportal.statistics.gov.uk/datasets?q=LSOA Boundaries)
- Select Lower Super Output Areas (December 2001) Full Clipped Boundaries in England and Wales
- From a command line run:

```
shp2pgsql "LSOA_2001_EW_BFC_V2.shp" | psql -d uklibraries -U "postgres"
```

## Dataset: LSOA population estimates

- Download from [ONS LSOA Population Estimates](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/lowersuperoutputareamidyearpopulationestimates)
- Create a table to store the data.

```
create table lsoa_population
(
	code character varying(9) not null,
	name text,
	all_ages integer,
	age_0 integer,age_1 integer,age_2 integer,age_3 integer,age_4 integer,age_5 integer,age_6 integer,age_7 integer,age_8 integer,age_9 integer,
	age_10 integer,age_11 integer,age_12 integer,age_13 integer,age_14 integer,age_15 integer,age_16 integer,age_17 integer,age_18 integer,age_19 integer,
	age_20 integer,age_21 integer,age_22 integer,age_23 integer,age_24 integer,age_25 integer,age_26 integer,age_27 integer,age_28 integer,age_29 integer,
	age_30 integer,age_31 integer,age_32 integer,age_33 integer,age_34 integer,age_35 integer,age_36 integer,age_37 integer,age_38 integer,age_39 integer,
	age_40 integer,age_41 integer,age_42 integer,age_43 integer,age_44 integer,age_45 integer,age_46 integer,age_47 integer,age_48 integer,age_49 integer,
	age_50 integer,age_51 integer,age_52 integer,age_53 integer,age_54 integer,age_55 integer,age_56 integer,age_57 integer,age_58 integer,age_59 integer,
	age_60 integer,age_61 integer,age_62 integer,age_63 integer,age_64 integer,age_65 integer,age_66 integer,age_67 integer,age_68 integer,age_69 integer,
	age_70 integer,age_71 integer,age_72 integer,age_73 integer,age_74 integer,age_75 integer,age_76 integer,age_77 integer,age_78 integer,age_79 integer,
	age_80 integer,age_81 integer,age_82 integer,age_83 integer,age_84 integer,age_85 integer,age_86 integer,age_87 integer,age_88 integer,age_89 integer,
	age_90 integer,
	constraint lsoa_populations_pkey primary key (code)
)
```

- Import the data

```
copy lsoa_population FROM 'lsoa-2014-population.csv' delimiter ',' csv header;
```

## Dataset: Indices of deprivation

- Download from https://www.gov.uk/government/statistics/english-indices-of-deprivation-2015
- Select to download the CSV *File 7: all ranks, deciles and scores for the indices of deprivation, and population denominators*
- Create the table to store the data.

```
create table imd
(
  lsoa_code character varying(9) not null,
  lsoa_name text,
  district_code character varying(9),
  district_name text,
  imd_score numeric,
  imd_rank integer,
  imd_decile integer,
  income_score numeric,
  income_rank integer,
  income_decile integer,
  employment_score numeric,
  employment_rank integer,
  employment_decile integer,
  education_score numeric,
  education_rank integer,
  education_decile integer,
  health_score numeric,
  health_rank integer,
  health_decile integer,
  crime_score numeric,
  crime_rank integer,
  crime_decile integer,
  housing_score numeric,
  housing_rank integer,
  housing_decile integer,
  environment_score numeric,
  environment_rank integer,
  environment_decile integer,
  idaci_score numeric,
  idaci_rank integer,
  idaci_decile integer,
  idaopi_score numeric,
  idaopi_rank integer,
  idaopi_decile integer,
  children_score numeric,
  children_rank integer,
  children_decile integer,
  adultskills_score numeric,
  adultskills_rank integer,
  adultskills_decile integer,
  geographical_score numeric,
  geographical_rank integer,
  geographical_decile integer,
  wider_score numeric,
  wider_rank integer,
  wider_decile integer,
  indoors_score numeric,
  indoors_rank integer,
  indoors_decile integer,
  outdoors_score numeric,
  outdoors_rank integer,
  outdoors_decile integer,
  population_total integer,
  dependent_children integer,
  sixteen_fiftynine integer,
  over_sixty integer,
  working_age numeric,
  constraint imd_pkey primary key (lsoa_code)
)
```

- Copy the data from the CSV into the table.

```
copy imd from 'File_7_ID_2015_All_ranks_deciles_and_scores_for_the_Indices_of_Deprivation__and_population_denominators.csv' delimiter ',' csv header;
```

## Convert source data

The spreadsheet is distributed as an Excel file.  To convert that file it was opened in Excel, the rows copied and saved to a new file, and then saved as CSV.

## Setup receiving table

The data can then be imported directly into a database.

- Create a table to hold the data.

```
create table raw
(
  authority text,
  library text,
  address text,
  postcode text,
  statutoryapril2010 text,
  statutoryjuly2016 text,
  libtype text,
  closed text,
  yearclosed text,
  new text,
  replacement text,
  notes text,
  hours text,
  staffhours text,
  email text,
  url text
)
```

- Import the data.

```
copy raw from 'librariesraw.csv' delimiter ',' csv;
```

## Create authorities table

- Create the basic table structure.

```
create table authorities
(
  id serial,
  name text,
  code character varying(9),
  constraint pk_authority primary key (id)
)
```

- Insert all the unique authority names from the raw library data.

```
insert into authorities(name)
select distinct trim(both from authority) 
from raw 
order by trim(both from authority) 
```

Then to have a dataset that we can reliably merge from data elsewhere we're going to add the authority codes used in datasets like those published by the Office for National Statistics, and Ordnance Survey.  That data can come from the authority boundaries.

- Try to match using the District/Borough/Unitary region table.

```
update authorities a
set code = (
	select code from district_borough_unitary_region r 
	where replace(replace(replace(replace(r.name, ' City',''), ' London Boro',''), ' (B)',''), ' District','') = a.name)
where code is null
```

- Fill in the missing ones from the County regions table.

```
update authorities a
set code = (
	select code from county_region r 
	where replace(r.name, ' County', '') = a.name)
where code is null
```

That will still leave around 20 with no matching code.  The likely reason for this will be counties that are named irregularly (e.g. Bath and NE Somerset instead of Bath and North East Somerset).

Edit the table manually to fill in the missing values.

- Export an authorities CSV file:

```
copy (
	select a.id as authority_id, a.name as Name, c.descriptio as Type, c.code as Code, c.hectares as Hectares, p.population as Population, avg(i.imd_decile), avg(i.income_decile), avg(i.education_decile), avg(i.health_decile), avg(i.crime_decile), avg(i.housing_decile), avg(i.environment_decile)
	from authorities a
	join county_region c
	on a.code = c.code
	join population p
	on p.code = a.code
	join lsoa_boundaries ls
	on ST_Within(ls.geom, c.geom)
	join imd i
	on i.lsoa_code = ls.lsoa11cd
	group by a.id, a.name, c.descriptio, c.code, c.hectares, p.population
	union
	select b.id as authority_id, b.name as Name, d.descriptio as Type, d.code as Code, d.hectares as Hectares, p.population as Population, avg(i.imd_decile), avg(i.income_decile), avg(i.education_decile), avg(i.health_decile), avg(i.crime_decile), avg(i.housing_decile), avg(i.environment_decile)
	from authorities b
	join district_borough_unitary_region d
	on d.code = b.code
	join population p
	on p.code = b.code
	join lsoa_boundaries ls
	on ST_Within(ls.geom, d.geom)
	join imd i
	on i.lsoa_code = ls.lsoa11cd
	group by b.id, b.name, d.descriptio, d.code, d.hectares, p.population
) to 'authorities.csv' delimiter ',' csv header;
```

Export the authorities as GeoJSON:

```
copy (
	select row_to_json(fc)
	from (
		select 'FeatureCollection' As type, array_to_json(array_agg(f)) as features 
		from (
			select 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json((SELECT l FROM (SELECT authority_id, name, type, code, hectares, population) As l)) as properties
			from (
				select a.id as authority_id, a.name as Name, c.descriptio as Type, c.code as Code, c.hectares as Hectares, p.population as Population, ST_SimplifyPreserveTopology(ST_Transform(ST_SetSRID(geom, 27700),4326), 0.002) as Geom 
				from authorities a
				join county_region c
				on a.code = c.code
				left outer join population p
				on p.code = a.code
				union
				select b.id as authority_id, b.name as Name, d.descriptio as Type, d.code as Code, d.hectares as Hectares, p.population as Population, ST_SimplifyPreserveTopology(ST_Transform(ST_SetSRID(geom, 27700), 4326), 0.002) as Geom 
				from authorities b
				join district_borough_unitary_region d
				on d.code = b.code
				left outer join population p
				on p.code = b.code
			) As lg   
		) As f 
	)  As fc
) To 'authoritiesgeo.json'
```

## Create libraries table

```
create table libraries
(
  id serial,
  name text,
  authority_id integer NOT NULL,
  address text,
  postcode character varying(8),
  postcodelat numeric, 
  postcodelng numeric,
  lat numeric,
  lng numeric,
  type character varying(4),
  closed boolean,
  closed_year integer,
  statutory2010 boolean,
  statutory2016 boolean,
  opened_year integer,
  replacement boolean,
  notes text,
  hours numeric,
  staffhours numeric,
  email text, 
  url text,
  constraint pk_library primary key (id)
)
```

Then take data from lots of tables and put it into the libraries table.

```
insert into libraries(
	name, authority_id, address, postcode, postcodelat, postcodelng, type, closed, closed_year, statutory2010, 
	statutory2016, opened_year, replacement, notes, hours, staffhours, email, url)
select	r.library, a.id, r.address, p.postcode, 
	ST_Y(ST_Transform(ST_SetSRID(ST_MakePoint(p.eastings, p.northings),27700), 4326)),
	ST_X(ST_Transform(ST_SetSRID(ST_MakePoint(p.eastings, p.northings),27700), 4326)),
	case when r.closed is null then false else true end,
	r.libtype,
	cast(r.yearclosed as integer),
	case when r.statutoryapril2010 = 'yes' then true else false end,
	case when r.statutoryjuly2016 = 'yes' then true else false end,
	cast(r.new as integer),
	case when lower(r.replacement) = 'yes' then true else false end,
	r.notes, cast(r.hours as numeric), cast(r.staffhours as numeric), r.email, r.url
from raw r
join authorities a
on a.name = r.authority
left outer join postcodes p
on r.postcode = p.postcode
order by r.authority, r.library
```

Export the libraries data to geocode it.  While doing this, create a bounding box by authority boundaries.  This should give the geocoder more to go on.

```
copy (
	select 	l1.id, l1.name, l1.address, l1.postcode, ST_AsText(ST_Envelope(ST_Transform(ST_SetSRID(d.geom, 27700), 4326))), l1.lat, l1.lng
	from libraries l1
	join authorities a1
	on a1.id = l1.authority_id
	join district_borough_unitary_region d
	on d.code = a1.code
	union
	select 	l2.id, l2.name, l2.address, l2.postcode, ST_AsText(ST_Envelope(ST_Transform(ST_SetSRID(c.geom, 27700), 4326))), l2.lat, l2.lng
	from libraries l2
	join authorities a2
	on a2.id = l2.authority_id
	join county_region c
	on c.code = a2.code
) to 'librariesgeo.csv' delimiter ',' csv header;
```

Or, more simply:

```
copy (
	select 	id, name || ',' || coalesce(address, '') || ',' || coalesce(postcode, '') "address" 
	from libraries
) to 'librariesgeo.csv' delimiter ',' csv header;
```

```
create table librarylocations
(
  libraryid integer not null,
  lat numeric,
  lng numeric,
  constraint librarylocations_pkey primary key (libraryid)
)
```

```
copy librarylocations from 'librarylocations.csv' delimiter ',' csv;
```

Update the libraries table with the lat/lng values.  This checks that the  geocoded value is also within the relevant authority boundary.

```
update libraries u
set 	lat = ll.lat,
	lng = ll.lng
from librarylocations ll
join libraries l
on l.id = ll.libraryid
join authorities a
on a.id = l.authority_id
where ST_Within(
	ST_Transform(ST_SetSRID(ST_MakePoint(ll.lng, ll.lat), 4326), 27700), 
	(select ST_SetSRID(geom, 27700) 
		from (	select code, geom 
			from county_region 
			union 
			select code, geom 
			from district_borough_unitary_region ) ab 
		where ab.code = a.code))
and u.id = ll.libraryid
```

Then, fill in any blanks with the postcode values:

```
update libraries l
set lat = l.postcodelat,
lng = l.postcodelng
where l.lat is null and l.lng is null
```

Finally, export the libraries data.

```
copy (
	select 	l.name,
		a.id "authority_id",
		l.address,
		l.postcode,
		l.lat,
		l.lng,
		l.statutory2010,
		l.statutory2016,
		l.type, 
		l.closed,
		l.closed_year,
		l.opened_year,
		l.replacement,
		l.notes,
		l.hours,
		l.staffhours,
		l.url,
		l.email,
		-- Add the LSOA data
		ls.lsoa11nm "lsoa_name",
		ls.lsoa11cd "lsoa_code",
		-- Add the deprivation data
		i.imd_decile,
		i.income_decile,
		i.education_decile,
		i.health_decile,
		i.crime_decile,
		i.housing_decile,
		i.environment_decile
	from libraries l
	join authorities a
	on a.id = l.authority_id
	left outer join lsoa_boundaries ls
	on ST_Within(ST_Transform(ST_SetSRID(ST_MakePoint(l.lng, l.lat), 4326), 27700), ST_SetSRID(ls.geom, 27700))
	left outer join imd i
	on i.lsoa_code = ls.lsoa11cd
) to 'libraries.csv' delimiter ','csv header;
```

It'd also be good to do some distance analysis.  The following should produce an output that uses the LSOA populations, library locations, and LSOA boundaries to produce a summary of the distance to libraries per authority.

```
copy ( select 
		(select name from authorities a join ( select code, geom 
				from county_region 
				union 
				select code, geom 
				from district_borough_unitary_region ) ab
				on ab.code = a.code where ST_Within(ST_Centroid(lb.geom), ab.geom)) as authority,
		(select round(ST_Distance(ST_Transform(ST_SetSRID(ST_MakePoint(l.lng, l.lat), 4326), 27700), ST_SetSRID(ST_Centroid(lb.geom), 27700))  / 1609.34) as distance 
			from libraries l order by distance limit 1) as distance,
		sum(lp.all_ages) as population
	from lsoa_boundaries lb
	join lsoa_population lp
	on lp.code = lb.lsoa11cd
	group by authority, distance) to 'distances.csv' delimiter ','csv header;
```

That query is probably quite inefficiently written so is likely to take a few hours to complete!

Plus maybe the number of people where there library is not that of their authority:

```
select authority, library_authority, population
	from (select 
		(select name from authorities a join ( select code, geom 
				from county_region 
				union 
				select code, geom 
				from district_borough_unitary_region ) ab
				on ab.code = a.code where ST_Within(ST_Centroid(lb.geom), ab.geom)) as authority,
		(select name from (select a.name, round(ST_Distance(ST_Transform(ST_SetSRID(ST_MakePoint(l.lng, l.lat), 4326), 27700), ST_SetSRID(ST_Centroid(lb.geom), 27700))  / 1609.34) as distance 
		from libraries l join authorities a on a.id = l.authority_id order by distance limit 1) sq2) as library_authority,
		lp.all_ages
		from lsoa_boundaries lb
		join lsoa_population lp
		on lp.code = lb.lsoa11cd) sq1
where authority != library_authority
```