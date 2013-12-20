database tcs_catalog;
DELETE FROM resource_info WHERE resource_id >= 4000;
DELETE FROM resource WHERE resource_id >= 4000;
DELETE FROM linked_project_xref WHERE source_project_id >= 4000;
DELETE FROM project WHERE project_id >= 4000;

database tcs_dw;
DELETE FROM project_result WHERE project_id >= 4000;
DELETE FROM project WHERE project_id >= 4000;
DELETE FROM user_achievement_xref WHERE user_id = 132456;

database topcoder_dw;
DELETE FROM coder WHERE coder_id >= 132456;


database topcoder_dw;

DELETE FROM user_achievement WHERE coder_id = 132456;
DELETE FROM coder WHERE coder_id <= 132458;

database tcs_catalog;

DELETE FROM reviewer_rating WHERE project_id >= 2000;
DELETE FROM resource_info WHERE resource_id >= 2000;
DELETE FROM resource WHERE resource_id >= 2000 AND resource_id <= 4000;
DELETE FROM linked_project_xref WHERE source_project_id >= 2000;
DELETE FROM project WHERE project_id >= 2000 AND project_id <= 4000;


database tcs_dw;

DELETE FROM user_achievement_xref WHERE user_id = 132456;
DELETE FROM user_rating WHERE user_id = 132456;
DELETE FROM user_rank WHERE user_id = 132456;
DELETE FROM country_user_rank WHERE user_id = 132456;
DELETE FROM school_user_rank WHERE user_id = 132456;
DELETE FROM user_rank_type_lu;
DELETE FROM project_result WHERE project_id >= 1000 and project_id <= 2000;
DELETE FROM project WHERE project_id >= 1000 and project_id <= 2000;