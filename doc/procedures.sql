/*
 * Copyright (C) 2012 - 2013 TopCoder Inc., All Rights Reserved.
 *
 * PoC Assembly - TopCoder NodeJS Contests REST API - Part 2
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */

/********* GET CONTEST DATA ***********/

CREATE PROCEDURE get_contest_data(prj_id INT)
RETURNING
boolean as var1, varchar(255) as var2, int as var3, decimal(10,2) as var4, decimal(10,2) as var5, datetime year to fraction(3) as var6, datetime year to fraction(3) as var7, datetime year to fraction(3) as var8, datetime year to fraction(3) as var9, datetime year to fraction(3) as var10, varchar(254) as var11, decimal(32,0) as var12, decimal(15,0) as var13, decimal(15,0) as var14, int as var15, varchar(254) as var16, lvarchar as var17, lvarchar as var18
DEFINE var1 boolean;
DEFINE var2 varchar(255);
DEFINE var3 int;
DEFINE var4 decimal(10,2);
DEFINE var5 decimal(10,2);
DEFINE var6 DATETIME year to fraction(3);
DEFINE var7 DATETIME year to fraction(3);
DEFINE var8 DATETIME year to fraction(3);
DEFINE var9 DATETIME year to fraction(3);
DEFINE var10 DATETIME year to fraction(3);
DEFINE var11 varchar(254);
DEFINE var12 decimal(32,0);
DEFINE var13 decimal(15,0);
DEFINE var14 decimal(15,0);
DEFINE var15 int;
DEFINE var16 varchar(254);
DEFINE var17 lvarchar;
DEFINE var18 lvarchar;
FOREACH
select (p.project_studio_spec_id IS NOT NULL) as is_studio
     , pn.value as contest_name
     , p.project_id
     , (SELECT pr.prize_amount FROM prize pr
       INNER JOIN project_prize_xref prx ON pr.prize_id = prx.prize_id
       WHERE prx.project_id = p.project_id
       AND pr.prize_type_id = 15 and pr.place = 1)::DECIMAL(10,2) AS first_place_payment
     , (SELECT pr.prize_amount FROM prize pr
       INNER JOIN project_prize_xref prx ON pr.prize_id = prx.prize_id
       WHERE prx.project_id = p.project_id
       AND pr.prize_type_id = 15 and pr.place = 2)::DECIMAL(10,2) AS second_place_payment
     , (select NVL(NVL(ppd.actual_start_time, psd.actual_start_time), ppd.scheduled_start_time)
          from project proj
             , OUTER project_phase psd
             , OUTER project_phase ppd
         where psd.project_id = proj.project_id
           and psd.phase_type_id = 2
           and ppd.project_id = proj.project_id
           and proj.project_id = p.project_id
           and ppd.phase_type_id = 1) as posting_date
     , pp2.scheduled_end_time as submission_date
     , pp6.scheduled_end_time as winner_announced_date
     , pp9.scheduled_end_time final_submission_date
     , nd_phase.scheduled_end_time as next_deadline
     , case when (nd_phase.scheduled_end_time IS NOT NULL) then
                (select phase_type_lu.description from phase_type_lu
                where phase_type_id = nd_phase.phase_type_id)
            else null
            end as next_deadline_description
     , case when pidr.value = 'On' then
       NVL((select value::decimal from project_info pi_dr where pi_dr.project_info_type_id = 30 and pi_dr.project_id = p.project_id), (select round(nvl(pi16.value::decimal, 0)) from project_info pi16 where pi16.project_info_type_id = 16 and pi16.project_id = p.project_id))
       else null end as dr_points
     ,(SELECT COUNT(*)
         FROM resource
        WHERE project_id = p.project_id
          AND resource_role_id = 1) as total_registrants
     ,(SELECT COUNT(*)
         FROM submission s, upload u
        WHERE u.upload_id = s.upload_id
          AND u.project_id = p.project_id
          AND s.submission_type_id in (1, 3)
          AND s.submission_status_id in (1,2,3,4,6,7)) as total_submissions
     , p.project_category_id as project_type_id
     , pcl.description as project_type
     , ps.detailed_requirements
     , ps.final_submission_guidelines
  INTO
  var1, var2, var3, var4, var5, var6, var7, var8, var9, var10, var11, var12, var13, var14, var15, var16, var17, var18
  from project p
     , project_spec ps
     , project_phase pp1
     , project_phase pp2
     , project_phase pp6
     , project_phase pp9
     , project_phase pp3
     , project_phase pp4
     , project_info pn
     , project_info pidr
     , outer project_phase nd_phase
     , project_info pi16
     , project_category_lu pcl
 where 1=1
   and p.project_id = prj_id
   and p.project_id = pn.project_id
   and pn.project_info_type_id = 6
   and pp1.project_id = p.project_id
   and pp1.phase_type_id = 1
   and pp2.project_id = p.project_id
   and pp2.phase_type_id = 2
   and pp6.project_id = p.project_id
   and pp6.phase_type_id = 6
   and pp9.project_id = p.project_id
   and pp9.phase_type_id = 9
   and pi16.project_info_type_id = 16
   and pi16.project_id = p.project_id
   and pp3.project_id = p.project_id
   and pp3.phase_type_id = 3
   and pp4.project_id = p.project_id
   and pp4.phase_type_id = 4
   and pidr.project_id = p.project_id
   and pidr.project_info_type_id = 26
   and p.project_Id = nd_phase.project_id
   and nd_phase.phase_type_id = (select phase_type_id from project_phase where project_id = p.project_id and actual_start_time = (select min(actual_start_time)  from project_phase where phase_status_id = 2 and project_id = p.project_id and phase_type_id in (1,2,3,4,5,6,7,8,9,10,11,12)))
   and p.project_category_id = pcl.project_category_id
   and pcl.project_type_id in (1, 2)
   and ps.project_id = p.project_id
   and ps.version = (select max(version)
                       from project_spec ps2
                      where ps2.project_id = ps.project_id)

RETURN
var1, var2, var3, var4, var5, var6, var7, var8, var9, var10, var11, var12, var13, var14, var15, var16, var17, var18
WITH RESUME;
END FOREACH;
END PROCEDURE;

/********* GET ALL ***********/

CREATE PROCEDURE getall_cat()
RETURNING INT as ins_project_category_id, INT as ins_project_type_id, VARCHAR(64) as ins_name, VARCHAR(254) as ins_description, VARCHAR(64) as ins_create_user, DATETIME YEAR TO FRACTION as ins_create_date, VARCHAR(64) as ins_modify_user, DATETIME YEAR TO FRACTION as ins_modify_date, boolean as ins_display, INT as ins_display_order, INT as ins_project_catalog_id, DECIMAL(12,0) as ins_version
DEFINE ins_project_category_id INT;
DEFINE ins_project_type_id INT;
DEFINE ins_name VARCHAR(64);
DEFINE ins_description VARCHAR(254);
DEFINE ins_create_user VARCHAR(64);
DEFINE ins_create_date DATETIME YEAR TO FRACTION;
DEFINE ins_modify_user VARCHAR(64);
DEFINE ins_modify_date DATETIME YEAR TO FRACTION;
DEFINE ins_display boolean;
DEFINE ins_display_order INT;
DEFINE ins_project_catalog_id INT;
DEFINE ins_version DECIMAL(12,0);

FOREACH SELECT *
              INTO ins_project_category_id, ins_project_type_id, ins_name, ins_description, ins_create_user, ins_create_date, ins_modify_user, ins_modify_date, ins_display, ins_display_order, ins_project_catalog_id, ins_version
              FROM project_category_lu

RETURN ins_project_category_id, ins_project_type_id, ins_name, ins_description, ins_create_user, ins_create_date, ins_modify_user, ins_modify_date, ins_display, ins_display_order, ins_project_catalog_id, ins_version WITH RESUME;
END FOREACH;
END PROCEDURE;

/********* GET BY ID ***********/

CREATE PROCEDURE get_cat(id int)
RETURNING INT as ins_project_category_id, INT as ins_project_type_id, VARCHAR(64) as ins_name, VARCHAR(254) as ins_description, VARCHAR(64) as ins_create_user, DATETIME YEAR TO FRACTION as ins_create_date, VARCHAR(64) as ins_modify_user, DATETIME YEAR TO FRACTION as ins_modify_date, boolean as ins_display, INT as ins_display_order, INT as ins_project_catalog_id, DECIMAL(12,0) as ins_version
DEFINE ins_project_category_id INT;
DEFINE ins_project_type_id INT;
DEFINE ins_name VARCHAR(64);
DEFINE ins_description VARCHAR(254);
DEFINE ins_create_user VARCHAR(64);
DEFINE ins_create_date DATETIME YEAR TO FRACTION;
DEFINE ins_modify_user VARCHAR(64);
DEFINE ins_modify_date DATETIME YEAR TO FRACTION;
DEFINE ins_display boolean;
DEFINE ins_display_order INT;
DEFINE ins_project_catalog_id INT;
DEFINE ins_version DECIMAL(12,0);

FOREACH SELECT *
              INTO ins_project_category_id, ins_project_type_id, ins_name, ins_description, ins_create_user, ins_create_date, ins_modify_user, ins_modify_date, ins_display, ins_display_order, ins_project_catalog_id, ins_version
              FROM project_category_lu
        WHERE project_category_id = id

RETURN ins_project_category_id, ins_project_type_id, ins_name, ins_description, ins_create_user, ins_create_date, ins_modify_user, ins_modify_date, ins_display, ins_display_order, ins_project_catalog_id, ins_version WITH RESUME;
END FOREACH;
END PROCEDURE;

/* ******************** DELETE ******************** */

CREATE PROCEDURE del_cat(cat_id int) returning lvarchar(1000);
DELETE
FROM project_category_lu
WHERE project_category_id = cat_id;
END PROCEDURE;

/* ******************** FUNCTION TO CAST INTO BOOL ******************* */

create function expcast_int_to_bool(i integer) returning boolean;
    if   (i is null) then return null;
    elif (i != 0)    then return 't';
    else                  return 'f';
    end if;
end function;


/********************** INSERT ****************/

CREATE PROCEDURE ins_cat ( ins_project_category_id INT, ins_project_type_id INT, ins_name VARCHAR(64), ins_description VARCHAR(254), ins_create_user VARCHAR(64), ins_create_date DATETIME YEAR TO FRACTION, ins_modify_user VARCHAR(64), ins_modify_date DATETIME YEAR TO FRACTION, ins_display INT, ins_display_order INT, ins_project_catalog_id INT, ins_version DECIMAL(12,0) DEFAULT 0)
INSERT INTO project_category_lu (project_category_id, project_type_id, name, description, create_user, create_date, modify_user, modify_date, display, display_order, project_catalog_id, version )
VALUES ( ins_project_category_id,
         ins_project_type_id,
         ins_name,
         ins_description,
         ins_create_user,
         ins_create_date,
         ins_modify_user,
         ins_modify_date,
         expcast_int_to_bool(ins_display),
         ins_display_order,
         ins_project_catalog_id,
         ins_version );
END PROCEDURE;

/*************** UPDATE ***************/

CREATE PROCEDURE upd_cat ( upd_project_category_id INT, upd_project_type_id INT, upd_name VARCHAR(64), upd_description VARCHAR(254), upd_create_user VARCHAR(64), upd_create_date DATETIME YEAR TO FRACTION, upd_modify_user VARCHAR(64), upd_modify_date DATETIME YEAR TO FRACTION, upd_display INT, upd_display_order INT, upd_project_catalog_id INT, upd_version DECIMAL(12,0) DEFAULT 0)
UPDATE project_category_lu
SET project_type_id = upd_project_type_id,
    name = upd_name,
    description = upd_description,
    create_user = upd_create_user,
    create_date = upd_create_date,
    modify_user = upd_modify_user,
    modify_date = upd_modify_date,
    display = expcast_int_to_bool(upd_display),
    display_order = upd_display_order,
    project_catalog_id = upd_project_catalog_id,
    version = upd_version
WHERE project_category_id = upd_project_category_id ;
END PROCEDURE;