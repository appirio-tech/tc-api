DATABASE common_oltp;

DELETE FROM user_group_xref WHERE group_id > 3330000 AND group_id < 3330100;
DELETE FROM security_groups WHERE group_id > 3330000 AND group_id < 3330100;
DELETE FROM group_contest_eligibility WHERE contest_eligibility_id > 1110000 AND contest_eligibility_id < 1110100;
DELETE FROM contest_eligibility WHERE contest_eligibility_id > 1110000 AND contest_eligibility_id < 1110100;

DATABASE tcs_catalog;

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
