DATABASE common_oltp;

DELETE FROM user_group_xref WHERE group_id > 3330000 AND group_id < 3330100;
DELETE FROM security_groups WHERE group_id > 3330000 AND group_id < 3330100;
DELETE FROM group_contest_eligibility WHERE contest_eligibility_id > 1110000 AND contest_eligibility_id < 1110100;
DELETE FROM contest_eligibility WHERE contest_eligibility_id > 1110000 AND contest_eligibility_id < 1110100;

DATABASE informixoltp;

-- UPDATE coder SET comp_country_code = NULL WHERE user_id = 132458;

DATABASE tcs_dw;

DELETE FROM project WHERE project_id > 4440000 AND project_id < 4440100;

DATABASE tcs_catalog;

DELETE FROM project_info WHERE project_id > 5550000 AND project_id < 5550100;
DELETE FROM project_phase WHERE project_id > 5550000 AND project_id < 5550100;
DELETE FROM project WHERE project_id > 5550000 AND project_id < 5550100;

DELETE FROM project_info WHERE project_id > 4440000 AND project_id < 4440100;
DELETE FROM project_phase WHERE project_id > 4440000 AND project_id < 4440100;
DELETE FROM prize WHERE project_id > 4440000 AND project_id < 4440100;
DELETE FROM project WHERE project_id > 4440000 AND project_id < 4440100;

DELETE FROM resource_info WHERE resource_id IN (SELECT resource_id FROM resource WHERE project_id > 3330000 AND project_id < 3330100);
DELETE FROM resource WHERE project_id > 3330000 AND project_id < 3330100;
DELETE FROM project_info WHERE project_id > 3330000 AND project_id < 3330100;
DELETE FROM project_phase WHERE project_id > 3330000 AND project_id < 3330100;
DELETE FROM project WHERE project_id > 3330000 AND project_id < 3330100;
DELETE FROM project_studio_specification WHERE project_studio_spec_id = 3330333;

DELETE FROM prize WHERE project_id > 1110000 AND project_id < 1110100;
DELETE FROM project_payment_adjustment WHERE project_id > 1110000 AND project_id < 1110100;
DELETE FROM notification WHERE project_id > 1110000 AND project_id < 1110100;
DELETE FROM project_result WHERE project_id > 1110000 AND project_id < 1110100;
DELETE FROM project_user_audit WHERE project_id > 1110000 AND project_id < 1110100;
DELETE FROM component_inquiry WHERE project_id > 1110000 AND project_id < 1110100;
DELETE FROM resource_info WHERE resource_id IN (SELECT resource_id FROM resource WHERE project_id > 1110000 AND project_id < 1110100);
DELETE FROM resource WHERE project_id > 1110000 AND project_id < 1110100;

DELETE FROM review_application WHERE review_auction_id IN (SELECT review_auction_id FROM review_auction WHERE project_id > 1110000 AND project_id < 1110100);
DELETE FROM review_auction WHERE project_id > 1110000 AND project_id < 1110100;
DELETE FROM project_info WHERE project_id > 1110000 AND project_id < 1110100;
DELETE FROM comp_versions WHERE component_id = 3330333;
DELETE FROM comp_catalog WHERE component_id = 3330333;
DELETE FROM phase_criteria WHERE project_phase_id > 1110000 AND project_phase_id < 1110100;
DELETE FROM project_phase WHERE project_id > 1110000 AND project_id < 1110100;
DELETE FROM project WHERE project_id > 1110000 AND project_id < 1110100;

DELETE FROM review_item_comment WHERE review_item_comment_id > 7770000 AND review_item_id < 7770100;
DELETE FROM review_item WHERE review_item_id > 5550000 AND review_item_id < 5550100;
DELETE FROM review WHERE review_id > 4440000 AND review_id < 4440100;
DELETE FROM scorecard_question WHERE scorecard_question_id = 3330333;
DELETE FROM scorecard_section WHERE scorecard_section_id = 3330333;
DELETE FROM scorecard_group WHERE scorecard_group_id = 3330333;
DELETE FROM scorecard WHERE scorecard_id = 3330333;
DELETE FROM submission WHERE submission_id > 2220000 AND submission_id < 2220100;
DELETE FROM prize WHERE project_id > 2220000 AND project_id < 2220100;
DELETE FROM upload WHERE project_id > 2220000 AND project_id < 2220100;
DELETE FROM resource WHERE project_id > 2220000 AND project_id < 2220100;
DELETE FROM project_phase WHERE project_id > 2220000 AND project_id < 2220100;
DELETE FROM project WHERE project_id > 2220000 AND project_id < 2220100;
