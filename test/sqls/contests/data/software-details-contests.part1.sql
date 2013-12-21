INSERT INTO project (project_id, project_status_id, project_category_id, create_user, create_date, modify_user, modify_date, tc_direct_project_id, project_studio_spec_id) VALUES (30400000, 1, 1, 132456, CURRENT, 132456, CURRENT, 30400001, null);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date) VALUES (30400000, 6, 'this is DETAIL software ACTIVE/OPEN contest 01', 132456, CURRENT, 132456, CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date) VALUES (30400000, 26, 'On', 132456, CURRENT, 132456, CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date) VALUES (30400000, 30, '510.0', 132456, CURRENT, 132456, CURRENT);
INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date) VALUES (30400000, 70, 'ab', 132456, CURRENT, 132456, CURRENT);

INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date) VALUES (30400000, 1, 30400002, 132456, CURRENT, 132456, CURRENT);

INSERT INTO comp_catalog (component_id, current_version, short_desc, component_name, description, function_desc, create_time, status_id, root_category_id, modify_date, public_ind)  
VALUES (30400002, 1, 'a', 'b', 'c', 'd', CURRENT, 1, 27202903, CURRENT, 1);
INSERT INTO comp_categories (comp_categories_id, component_id, category_id)  VALUES (30400002, 30400002, 27202903);
INSERT INTO comp_versions (comp_vers_id, component_id, version, version_text, create_time, phase_id, phase_time, price, comments, modify_date, suspended_ind) 
VALUES (30400002, 30400002, 1, '1.0', CURRENT, 147, CURRENT, 1000.0, 'Comments for version #1', CURRENT, 0);
INSERT INTO comp_version_dates (comp_version_dates_id, comp_vers_id, phase_id, posting_date, initial_submission_date, winner_announced_date, final_submission_date, estimated_dev_date, price, total_submissions, status_id, create_time, level_id, screening_complete_date, review_complete_date, aggregation_complete_date, phase_complete_date, production_date, aggregation_complete_date_comment, phase_complete_date_comment, review_complete_date_comment, winner_announced_date_comment, initial_submission_date_comment, screening_complete_date_comment, final_submission_date_comment, production_date_comment, modify_date) 
VALUES (30400002, 30400002, 112, '1976-06-05', '2000-02-01', '2000-02-01', '2000-02-01', '2000-02-01', 0.00, 0, 301, CURRENT, 100, '2000-02-01', '2000-02-01', '2000-02-01', '2000-02-01', null, null, null, null, null, null, null, null, null, CURRENT);

INSERT INTO component_inquiry (component_inquiry_id, component_id, user_id, comment, agreed_to_terms, rating, phase, tc_user_id, version, create_time, project_id) 
VALUES (30400003, 30400002, 132456, null, 1, 497, 147, 132456, 0, CURRENT, 30400000);


INSERT INTO prize (prize_id, place, prize_amount, prize_type_id, project_id, number_of_submissions, create_user, create_date, modify_user, modify_date) VALUES (30400004, 1, 1000, 15, 30400000, 1, 132456, CURRENT, 132456, CURRENT);
INSERT INTO prize (prize_id, place, prize_amount, prize_type_id, project_id, number_of_submissions, create_user, create_date, modify_user, modify_date) VALUES (30400005, 2, 500, 15, 30400000, 1, 132456, CURRENT, 132456, CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, fixed_start_time, scheduled_start_time, scheduled_end_time, actual_start_time, actual_end_time, duration, create_user, create_date, modify_user, modify_date) VALUES (30400006, 30400000, 1, 3, CURRENT + -44640 UNITS MINUTE, CURRENT + -44640 UNITS MINUTE, CURRENT + -41760 UNITS MINUTE, CURRENT + -44540 UNITS MINUTE, CURRENT + -41760 UNITS MINUTE, 172800000, 132456, CURRENT, 132456, CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, fixed_start_time, scheduled_start_time, scheduled_end_time, actual_start_time, actual_end_time, duration, create_user, create_date, modify_user, modify_date) VALUES (30400007, 30400000, 2, 2, null, CURRENT + -44640 UNITS MINUTE, CURRENT + -36000 UNITS MINUTE, CURRENT + -44640 UNITS MINUTE, null, 518400000, 132456, CURRENT, 132456, CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, fixed_start_time, scheduled_start_time, scheduled_end_time, actual_start_time, actual_end_time, duration, create_user, create_date, modify_user, modify_date) VALUES (30400008, 30400000, 3, 1, null, CURRENT + -36000 UNITS MINUTE, CURRENT + -35280 UNITS MINUTE, null, null, 43200000, 132456, CURRENT, 132456, CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, fixed_start_time, scheduled_start_time, scheduled_end_time, actual_start_time, actual_end_time, duration, create_user, create_date, modify_user, modify_date) VALUES (30400009, 30400000, 4, 1, null, CURRENT + -35280 UNITS MINUTE, CURRENT + -26640 UNITS MINUTE, null, null, 518400000, 132456, CURRENT, 132456, CURRENT);
INSERT INTO resource (resource_id, resource_role_id, project_id, project_phase_id, create_user, create_date, modify_user, modify_date) VALUES (30400010, 1, 30400000, 30400007, 132456, CURRENT, 132456, CURRENT);

INSERT INTO resource_info (resource_id, resource_info_type_id, value, create_user, create_date, modify_user, modify_date) 
VALUES (30400010, 1, '132456', 132456, CURRENT, 132456, CURRENT);

INSERT INTO resource_info (resource_id, resource_info_type_id, value, create_user, create_date, modify_user, modify_date) 
VALUES (30400010, 4, '1800', 132456, CURRENT, 132456, CURRENT);

INSERT INTO resource_info (resource_id, resource_info_type_id, value, create_user, create_date, modify_user, modify_date) 
VALUES (30400010, 5, '100', 132456, CURRENT, 132456, CURRENT);


INSERT INTO upload (upload_id, project_id, resource_id, upload_type_id, upload_status_id, parameter, create_user, create_date, modify_user, modify_date, project_phase_id) VALUES (30400011, 30400000, 30400010, 1, 1, '30010038_30010845_30010535.zip', 132456, '2013-07-10 18:27:31', 132456, CURRENT, 30400007);
INSERT INTO submission (submission_id, upload_id, submission_status_id, screening_score, initial_score, final_score, placement, submission_type_id, create_user, create_date, modify_user, modify_date, prize_id) VALUES (30400012, 30400011, 1, 100, 80, 90, 1, 1, 132456, CURRENT, 132456, CURRENT, null);


INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, fixed_start_time, scheduled_start_time, scheduled_end_time, actual_start_time, actual_end_time, duration, create_user, create_date, modify_user, modify_date) VALUES (30400010, 30400000, 6, 1, null, CURRENT + -35280 UNITS MINUTE, CURRENT + -26640 UNITS MINUTE, null, null, 518400000, 132456, CURRENT, 132456, CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, fixed_start_time, scheduled_start_time, scheduled_end_time, actual_start_time, actual_end_time, duration, create_user, create_date, modify_user, modify_date) VALUES (30400011, 30400000, 9, 1, null, CURRENT + -35280 UNITS MINUTE, CURRENT + -26640 UNITS MINUTE, null, null, 518400000, 132456, CURRENT, 132456, CURRENT);
INSERT INTO project_phase (project_phase_id, project_id, phase_type_id, phase_status_id, fixed_start_time, scheduled_start_time, scheduled_end_time, actual_start_time, actual_end_time, duration, create_user, create_date, modify_user, modify_date) VALUES (30400012, 30400000, 15, 1, null, CURRENT + -35280 UNITS MINUTE, CURRENT + -26640 UNITS MINUTE, null, null, 518400000, 132456, CURRENT, 132456, CURRENT);

INSERT INTO project_info (project_id, project_info_type_id, value, create_user, create_date, modify_user, modify_date) VALUES (30400000, 16, '1000', 132456, CURRENT, 132456, CURRENT);

insert into phase_criteria(project_phase_id, phase_criteria_type_id, parameter, create_user, create_date, modify_user, modify_date)
values (30400009, 1, 1, 132456, CURRENT, 132456, CURRENT);
insert into phase_criteria(project_phase_id, phase_criteria_type_id, parameter, create_user, create_date, modify_user, modify_date)
values (30400008, 1, 3, 132456, CURRENT, 132456, CURRENT);

insert into project_spec(project_spec_id, project_id, version)
values (31500000, 30400000, 1)