DATABASE tcs_catalog;

INSERT INTO project (project_id, project_status_id, project_category_id, create_user, create_date, modify_user, modify_date) 
	VALUES (2220001, 1, 14, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project (project_id, project_status_id, project_category_id, create_user, create_date, modify_user, modify_date) 
	VALUES (2220002, 1, 14, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project (project_id, project_status_id, project_category_id, create_user, create_date, modify_user, modify_date) 
	VALUES (2220003, 1, 14, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project (project_id, project_status_id, project_category_id, create_user, create_date, modify_user, modify_date) 
	VALUES (2220004, 1, 14, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project (project_id, project_status_id, project_category_id, create_user, create_date, modify_user, modify_date) 
	VALUES (2220005, 1, 14, "132456", CURRENT, "132456", CURRENT);

INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (7770001, 2220001, 17, 3, CURRENT, CURRENT, 0, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (7770002, 2220002, 17, 3, CURRENT, CURRENT, 0, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (7770003, 2220003, 17, 3, CURRENT, CURRENT, 0, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (7770004, 2220004, 17, 3, CURRENT, CURRENT, 0, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (7770005, 2220005, 17, 3, CURRENT, CURRENT, 0, "132456", CURRENT, "132456", CURRENT);

INSERT INTO resource (resource_id, resource_role_id, project_id, project_phase_id, user_id, create_user, create_date, modify_user, modify_date)
	VALUES (8880001, 20, 2220001, 7770001, 132456, "132456", CURRENT, "132456", CURRENT);
INSERT INTO resource (resource_id, resource_role_id, project_id, project_phase_id, user_id, create_user, create_date, modify_user, modify_date)
	VALUES (8880002, 20, 2220002, 7770002, 132456, "132456", CURRENT, "132456", CURRENT);
INSERT INTO resource (resource_id, resource_role_id, project_id, project_phase_id, user_id, create_user, create_date, modify_user, modify_date)
	VALUES (8880003, 20, 2220003, 7770003, 132456, "132456", CURRENT, "132456", CURRENT);
INSERT INTO resource (resource_id, resource_role_id, project_id, project_phase_id, user_id, create_user, create_date, modify_user, modify_date)
	VALUES (8880004, 20, 2220004, 7770004, 132456, "132456", CURRENT, "132456", CURRENT);
INSERT INTO resource (resource_id, resource_role_id, project_id, project_phase_id, user_id, create_user, create_date, modify_user, modify_date)
	VALUES (8880005, 20, 2220005, 7770005, 132456, "132456", CURRENT, "132456", CURRENT);

INSERT INTO upload (upload_id, project_id, resource_id, upload_type_id, upload_status_id, parameter, create_user, create_date, modify_user, modify_date)
	VALUES (9990001, 2220001, 8880001, 1, 1, "---", "132456", CURRENT, "132456", CURRENT);
INSERT INTO upload (upload_id, project_id, resource_id, upload_type_id, upload_status_id, parameter, create_user, create_date, modify_user, modify_date)
	VALUES (9990002, 2220002, 8880002, 1, 1, "---", "132456", CURRENT, "132456", CURRENT);
INSERT INTO upload (upload_id, project_id, resource_id, upload_type_id, upload_status_id, parameter, create_user, create_date, modify_user, modify_date)
	VALUES (9990003, 2220003, 8880003, 1, 1, "---", "132456", CURRENT, "132456", CURRENT);
INSERT INTO upload (upload_id, project_id, resource_id, upload_type_id, upload_status_id, parameter, create_user, create_date, modify_user, modify_date)
	VALUES (9990004, 2220004, 8880004, 1, 1, "---", "132456", CURRENT, "132456", CURRENT);
INSERT INTO upload (upload_id, project_id, resource_id, upload_type_id, upload_status_id, parameter, create_user, create_date, modify_user, modify_date)
	VALUES (9990005, 2220005, 8880005, 1, 1, "---", "132456", CURRENT, "132456", CURRENT);

INSERT INTO prize (prize_id, project_id, place, prize_amount, prize_type_id, number_of_submissions, create_user, create_date, modify_user, modify_date)
	VALUES (1110001, 2220001, 1, 1000, 14, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO prize (prize_id, project_id, place, prize_amount, prize_type_id, number_of_submissions, create_user, create_date, modify_user, modify_date)
	VALUES (1110002, 2220002, 1, 1000, 14, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO prize (prize_id, project_id, place, prize_amount, prize_type_id, number_of_submissions, create_user, create_date, modify_user, modify_date)
	VALUES (1110003, 2220003, 1, 1000, 14, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO prize (prize_id, project_id, place, prize_amount, prize_type_id, number_of_submissions, create_user, create_date, modify_user, modify_date)
	VALUES (1110004, 2220004, 1, 1000, 14, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO prize (prize_id, project_id, place, prize_amount, prize_type_id, number_of_submissions, create_user, create_date, modify_user, modify_date)
	VALUES (1110005, 2220005, 1, 1000, 14, 1, "132456", CURRENT, "132456", CURRENT);

INSERT INTO submission (submission_id, upload_id, submission_status_id, submission_type_id, create_user, create_date, modify_user, modify_date, prize_id)
	VALUES (2220001, 9990001, 1, 3, "132456", CURRENT, "132456", CURRENT, 1110001);
INSERT INTO submission (submission_id, upload_id, submission_status_id, submission_type_id, create_user, create_date, modify_user, modify_date, prize_id)
	VALUES (2220002, 9990002, 1, 3, "132456", CURRENT, "132456", CURRENT, 1110002);
INSERT INTO submission (submission_id, upload_id, submission_status_id, submission_type_id, create_user, create_date, modify_user, modify_date, prize_id)
	VALUES (2220003, 9990003, 1, 3, "132456", CURRENT, "132456", CURRENT, 1110003);
INSERT INTO submission (submission_id, upload_id, submission_status_id, submission_type_id, create_user, create_date, modify_user, modify_date, prize_id)
	VALUES (2220004, 9990004, 1, 3, "132456", CURRENT, "132456", CURRENT, 1110004);
INSERT INTO submission (submission_id, upload_id, submission_status_id, submission_type_id, create_user, create_date, modify_user, modify_date, prize_id)
	VALUES (2220005, 9990005, 1, 3, "132456", CURRENT, "132456", CURRENT, 1110005);

INSERT INTO scorecard (scorecard_id, scorecard_status_id, scorecard_type_id, project_category_id, name, version, min_score, max_score, create_user, create_date, modify_user, modify_date, version_number)
	VALUES (3330333, 1, 7, 14, "---", "---", 0, 100, "132456", CURRENT, "132456", CURRENT, 1);

INSERT INTO scorecard_group	(scorecard_group_id, scorecard_id, name, weight, sort, create_user, create_date, modify_user, modify_date, version)
	VALUES (3330333, 3330333, "---", 100, 1, "132456", CURRENT, "132456", CURRENT, 1);
	
INSERT INTO scorecard_section (scorecard_section_id, scorecard_group_id, name, weight, sort, create_user, create_date, modify_user, modify_date, version)
	VALUES (3330333, 3330333, "---", 100, 1, "132456", CURRENT, "132456", CURRENT, 1);

INSERT INTO scorecard_question (scorecard_question_id, scorecard_question_type_id, scorecard_section_id, description, weight, sort, upload_document, upload_document_required, create_user, create_date, modify_user, modify_date, version)
	VALUES (3330333, 1, 3330333, '---', 100, 1, 0, 0, "132456", CURRENT, "132456", CURRENT, 1);

INSERT INTO review (review_id, resource_id, submission_id, project_phase_id, scorecard_id, committed, create_user, create_date, modify_user, modify_date)
	VALUES (4440001, 8880001, 2220001, 7770001, 3330333, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO review (review_id, resource_id, submission_id, project_phase_id, scorecard_id, committed, create_user, create_date, modify_user, modify_date)
	VALUES (4440002, 8880002, 2220002, 7770002, 3330333, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO review (review_id, resource_id, submission_id, project_phase_id, scorecard_id, committed, create_user, create_date, modify_user, modify_date)
	VALUES (4440003, 8880003, 2220003, 7770003, 3330333, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO review (review_id, resource_id, submission_id, project_phase_id, scorecard_id, committed, create_user, create_date, modify_user, modify_date)
	VALUES (4440004, 8880004, 2220004, 7770004, 3330333, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO review (review_id, resource_id, submission_id, project_phase_id, scorecard_id, committed, create_user, create_date, modify_user, modify_date)
	VALUES (4440005, 8880005, 2220005, 7770005, 3330333, 1, "132456", CURRENT, "132456", CURRENT);

INSERT INTO review_item	(review_item_id, review_id, scorecard_question_id, upload_id, answer, sort, create_user, create_date, modify_user, modify_date)
	VALUES (5550001, 4440001, 3330333, 9990001, "---", 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO review_item	(review_item_id, review_id, scorecard_question_id, upload_id, answer, sort, create_user, create_date, modify_user, modify_date)
	VALUES (5550002, 4440002, 3330333, 9990002, "---", 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO review_item	(review_item_id, review_id, scorecard_question_id, upload_id, answer, sort, create_user, create_date, modify_user, modify_date)
	VALUES (5550003, 4440003, 3330333, 9990003, "---", 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO review_item	(review_item_id, review_id, scorecard_question_id, upload_id, answer, sort, create_user, create_date, modify_user, modify_date)
	VALUES (5550004, 4440004, 3330333, 9990004, "---", 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO review_item	(review_item_id, review_id, scorecard_question_id, upload_id, answer, sort, create_user, create_date, modify_user, modify_date)
	VALUES (5550005, 4440005, 3330333, 9990005, "---", 1, "132456", CURRENT, "132456", CURRENT);

INSERT INTO review_item_comment (review_item_comment_id, resource_id, review_item_id, comment_type_id, content, sort, create_user, create_date, modify_user, modify_date)
	VALUES (7770001, 8880001, 5550001, 1, "The current user has the right to view this challenge", 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO review_item_comment (review_item_comment_id, resource_id, review_item_id, comment_type_id, content, sort, create_user, create_date, modify_user, modify_date)
	VALUES (7770002, 8880002, 5550002, 1, "The current user has the right to view this challenge", 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO review_item_comment (review_item_comment_id, resource_id, review_item_id, comment_type_id, content, sort, create_user, create_date, modify_user, modify_date)
	VALUES (7770003, 8880003, 5550003, 1, "The current user has the right to view this challenge", 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO review_item_comment (review_item_comment_id, resource_id, review_item_id, comment_type_id, content, sort, create_user, create_date, modify_user, modify_date)
	VALUES (7770004, 8880004, 5550004, 1, "The current user has the right to view this challenge", 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO review_item_comment (review_item_comment_id, resource_id, review_item_id, comment_type_id, content, sort, create_user, create_date, modify_user, modify_date)
	VALUES (7770005, 8880005, 5550005, 1, "The current user has the right to view this challenge", 1, "132456", CURRENT, "132456", CURRENT);
	
INSERT INTO project (project_id, project_status_id, project_category_id, create_user, create_date, modify_user, modify_date) 
	VALUES (1110001, 1, 14, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project (project_id, project_status_id, project_category_id, create_user, create_date, modify_user, modify_date) 
	VALUES (1110002, 1, 14, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project (project_id, project_status_id, project_category_id, create_user, create_date, modify_user, modify_date) 
	VALUES (1110003, 1, 14, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project (project_id, project_status_id, project_category_id, create_user, create_date, modify_user, modify_date) 
	VALUES (1110004, 1, 14, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project (project_id, project_status_id, project_category_id, create_user, create_date, modify_user, modify_date) 
	VALUES (1110005, 1, 14, "132456", CURRENT, "132456", CURRENT);

INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (2220001, 1110001, 1, 2, CURRENT, CURRENT, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (2220002, 1110002, 1, 2, CURRENT, CURRENT, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (2220003, 1110003, 1, 2, CURRENT, CURRENT, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (2220004, 1110004, 1, 2, CURRENT, CURRENT, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (2220005, 1110005, 1, 2, CURRENT, CURRENT, 1, "132456", CURRENT, "132456", CURRENT);

INSERT INTO comp_catalog (component_id, current_version, component_name, status_id, modify_date, public_ind)
	VALUES (3330333, 1, "---", 1, CURRENT, 0);
	
INSERT INTO comp_versions (comp_vers_id, component_id, version, version_text, phase_id, phase_time, price, modify_date)
	VALUES (4440444, 3330333, 1, "1", 113, CURRENT, 1000, CURRENT);

INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110001, 2, "3330333", "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110002, 2, "3330333", "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110003, 2, "3330333", "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110004, 2, "3330333", "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110005, 2, "3330333", "132456", CURRENT, "132456", CURRENT);

INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110001, 6, 3330333, "Not private", CURRENT, "132456", CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110002, 6, 3330333, "Old logic - access allowed", CURRENT, "132456", CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110003, 6, 3330333, "Old logic - access denied", CURRENT, "132456", CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110004, 6, 3330333, "New logic - access allowed", CURRENT, "132456", CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110005, 6, 3330333, "New logic - access denied", CURRENT, "132456", CURRENT);
	
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110001, 79, "---", "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110002, 79, "---", "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110003, 79, "---", "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110004, 79, "---", "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date)
	VALUES (1110005, 79, "---", "132456", CURRENT, "132456", CURRENT);

INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (3330001, 1110001, 2, 2, CURRENT, CURRENT, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (3330002, 1110002, 2, 2, CURRENT, CURRENT, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (3330003, 1110003, 2, 2, CURRENT, CURRENT, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (3330004, 1110004, 2, 2, CURRENT, CURRENT, 1, "132456", CURRENT, "132456", CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, scheduled_start_time, scheduled_end_time, duration, create_user, create_date, modify_user, modify_date)
	VALUES (3330005, 1110005, 2, 2, CURRENT, CURRENT, 1, "132456", CURRENT, "132456", CURRENT);

DATABASE informixoltp;
	
UPDATE coder SET comp_country_code = (
	SELECT MIN(country_code) FROM country WHERE country_name = "United States"
) WHERE coder_id = 132458;

DATABASE common_oltp;

INSERT INTO contest_eligibility (contest_eligibility_id, contest_id, is_studio) VALUES (1110002, 2220002, 0);
INSERT INTO contest_eligibility (contest_eligibility_id, contest_id, is_studio) VALUES (1110003, 2220003, 0);
INSERT INTO contest_eligibility (contest_eligibility_id, contest_id, is_studio) VALUES (1110004, 2220004, 0);
INSERT INTO contest_eligibility (contest_eligibility_id, contest_id, is_studio) VALUES (1110005, 2220005, 0);

INSERT INTO security_groups (group_id, description, challenge_group_ind) VALUES (3330001, "Eligibility - Old logic - with user", 0);
INSERT INTO security_groups (group_id, description, challenge_group_ind) VALUES (3330002, "Eligibility - Old logic - no users", 0);
INSERT INTO security_groups (group_id, description, challenge_group_ind) VALUES (3330003, "Eligibility - New logic - with user", 1);
INSERT INTO security_groups (group_id, description, challenge_group_ind) VALUES (3330004, "Eligibility - New logic - no users", 1);

INSERT INTO user_group_xref (user_group_id, login_id, group_id) VALUES (5550001, 132458, 3330001);

INSERT INTO group_contest_eligibility (contest_eligibility_id, group_id) VALUES (1110002, 3330001);
INSERT INTO group_contest_eligibility (contest_eligibility_id, group_id) VALUES (1110003, 3330002);
INSERT INTO group_contest_eligibility (contest_eligibility_id, group_id) VALUES (1110004, 3330003);
INSERT INTO group_contest_eligibility (contest_eligibility_id, group_id) VALUES (1110005, 3330004);

INSERT INTO contest_eligibility (contest_eligibility_id, contest_id, is_studio) VALUES (1110012, 1110002, 0);
INSERT INTO contest_eligibility (contest_eligibility_id, contest_id, is_studio) VALUES (1110013, 1110003, 0);
INSERT INTO contest_eligibility (contest_eligibility_id, contest_id, is_studio) VALUES (1110014, 1110004, 0);
INSERT INTO contest_eligibility (contest_eligibility_id, contest_id, is_studio) VALUES (1110015, 1110005, 0);

INSERT INTO group_contest_eligibility (contest_eligibility_id, group_id) VALUES (1110012, 3330001);
INSERT INTO group_contest_eligibility (contest_eligibility_id, group_id) VALUES (1110013, 3330002);
INSERT INTO group_contest_eligibility (contest_eligibility_id, group_id) VALUES (1110014, 3330003);
INSERT INTO group_contest_eligibility (contest_eligibility_id, group_id) VALUES (1110015, 3330004);
