database tcs_catalog;

INSERT INTO 'informix'.input_lu(input_id, input_code, data_type_id, input_desc) VALUES(25936, 'prilower', 1001, 'prize lower bound');
INSERT INTO 'informix'.input_lu(input_id, input_code, data_type_id, input_desc) VALUES(25937, 'priupper', 1001, 'prize upper bound');
INSERT INTO 'informix'.input_lu(input_id, input_code, data_type_id, input_desc) VALUES(25938, 'registstartend', 1005, 'registration start end date');
INSERT INTO 'informix'.input_lu(input_id, input_code, data_type_id, input_desc) VALUES(25939, 'registstartstart', 1005, 'registration start start date');
INSERT INTO 'informix'.input_lu(input_id, input_code, data_type_id, input_desc) VALUES(25940, 'subendend', 1005, 'submission end end date');
INSERT INTO 'informix'.input_lu(input_id, input_code, data_type_id, input_desc) VALUES(25941, 'subendstart', 1005, 'submission end start date');
INSERT INTO 'informix'.input_lu(input_id, input_code, data_type_id, input_desc) VALUES(25942, 'sf', 1005, 'Sort field');
INSERT INTO 'informix'.input_lu(input_id, input_code, data_type_id, input_desc) VALUES(25943, 'frendend', 1005, 'final review end end date');
INSERT INTO 'informix'.input_lu(input_id, input_code, data_type_id, input_desc) VALUES(25944, 'frendstart', 1005, 'final review end start date');
INSERT INTO 'informix'.input_lu(input_id, input_code, data_type_id, input_desc) VALUES(25945, 'fractualend', 1005, 'final review actual end date');
INSERT INTO 'informix'.input_lu(input_id, input_code, data_type_id, input_desc) VALUES(25946, 'fractualstart', 1005, 'final review acutal start date');
INSERT INTO 'informix'.input_lu(input_id, input_code, data_type_id, input_desc) VALUES(25947, 'catalog', 1005, 'project catalog description');

INSERT INTO 'informix'.query(query_id, name, ranking) VALUES(33100, 'restapi_search_active_contest', 0);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33100, 25921, 'N', 0); -- first row index
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33100, 25690, 'N', 1); -- page size
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33100, 25936, 'Y', '-1', 2); -- first prize lower bound
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33100, 25937, 'Y', '1000000', 3); -- first prize upper bound
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33100, 25761, 'Y', '%', 4); -- project name
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33100, 25938, 'Y', '2199-01-01', 5); -- register start end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33100, 25939, 'Y', '1900-01-01', 6); -- register start start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33100, 25940, 'Y', '2199-01-01', 7); -- submission end end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33100, 25941, 'Y', '1900-01-01', 8); -- submission end start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33100, 25430, 'Y', '0', 9); -- tc direct project id
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33100, 25943, 'Y', '2199-01-01', 10); -- final review end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33100, 25944, 'Y', '1900-01-01', 11); -- final review start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33100, 25881, 'Y', '', 12); -- project category description
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33100, 25947, 'Y', '', 13); -- project catalog name
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33100, 25942, 'N', 14); -- sort column
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33100, 16917, 'N', 15); -- sort direction

INSERT INTO 'informix'.query(query_id, name, ranking) VALUES(33101, 'restapi_search_active_contest_count', 0);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33101, 25936, 'Y', '-1', 0); -- first prize lower bound
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33101, 25937, 'Y', '1000000', 1); -- first prize upper bound
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33101, 25761, 'Y', '%', 2); -- project name
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33101, 25938, 'Y', '2199-01-01', 3); -- register start end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33101, 25939, 'Y', '1900-01-01', 4); -- register start start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33101, 25940, 'Y', '2199-01-01', 5); -- submission end end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33101, 25941, 'Y', '1900-01-01', 6); -- submission end start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33101, 25430, 'Y', '0', 7); -- tc direct project id
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33101, 25943, 'Y', '2199-01-01', 8); -- final review end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33101, 25944, 'Y', '1900-01-01', 9); -- final review start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33101, 25881, 'Y', '', 12);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33101, 25947, 'Y', '', 13); -- project catalog name

INSERT INTO 'informix'.command(command_id, command_desc, command_group_id) VALUES(32570, 'restapi_search_active_contest', 11004);
INSERT INTO 'informix'.command_query_xref(command_id, query_id) VALUES(32570, 33100);
INSERT INTO 'informix'.command_query_xref(command_id, query_id) VALUES(32570, 33101);


INSERT INTO 'informix'.query(query_id, name, ranking) VALUES(33102, 'restapi_search_open_contest', 0);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33102, 25921, 'N', 0);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33102, 25690, 'N', 1);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33102, 25430, 'Y', '0', 2); -- tc direct project id
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33102, 25938, 'Y', '2199-01-01', 3); -- register start end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33102, 25939, 'Y', '1900-01-01', 4); -- register start start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33102, 25940, 'Y', '2199-01-01', 5); -- submission end end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33102, 25941, 'Y', '1900-01-01', 6); -- submission end start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33102, 25936, 'Y', '-1', 7); -- first prize lower bound
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33102, 25937, 'Y', '1000000', 8); -- first prize upper bound
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33102, 16912, 'Y', '%', 9); -- winner handle
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33102, 25945, 'Y', '2199-01-01', 10); -- final Review actual end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33102, 25946, 'Y', '1900-01-01', 11); -- final Review actual start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33102, 25761, 'Y', '%', 12); -- project name
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33102, 25881, 'Y', '', 13); -- project category description
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33102, 25947, 'Y', '', 14); -- project catalog name
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33102, 25942, 'N', 15);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33102, 16917, 'N', 16);

INSERT INTO 'informix'.query(query_id, name, ranking) VALUES(33103, 'restapi_search_open_contest_count', 0);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33103, 25430, 'Y', '0', 0); -- tc direct project id
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33103, 25938, 'Y', '2199-01-01', 1); -- register start end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33103, 25939, 'Y', '1900-01-01', 2); -- register start start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33103, 25940, 'Y', '2199-01-01', 3); -- submission end end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33103, 25941, 'Y', '1900-01-01', 4); -- submission end start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33103, 25936, 'Y', '-1', 5); -- first prize lower bound
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33103, 25937, 'Y', '1000000', 6); -- first prize upper bound
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33103, 16912, 'Y', '%', 7); -- winner handle
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33103, 25945, 'Y', '2199-01-01', 8); -- final Review actual end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33103, 25946, 'Y', '1900-01-01', 9); -- final Review actual start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33103, 25761, 'Y', '%', 10); -- project name
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33103, 25881, 'Y', '', 11); -- project category description
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33103, 25947, 'Y', '', 12); -- project catalog name


INSERT INTO 'informix'.command(command_id, command_desc, command_group_id) VALUES(32571, 'restapi_search_open_contest', 11004);
INSERT INTO 'informix'.command_query_xref(command_id, query_id) VALUES(32571, 33102);
INSERT INTO 'informix'.command_query_xref(command_id, query_id) VALUES(32571, 33103);


INSERT INTO 'informix'.query(query_id, name, ranking) VALUES(33104, 'restapi_search_past_contest', 0);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33104, 25921, 'N', 0);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33104, 25690, 'N', 1);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33104, 25761, 'Y', '%', 2); -- project name
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33104, 25938, 'Y', '2199-01-01', 3); -- register start end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33104, 25939, 'Y', '1900-01-01', 4); -- register start start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33104, 25940, 'Y', '2199-01-01', 5); -- submission end end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33104, 25941, 'Y', '1900-01-01', 6); -- submission end start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33104, 25430, 'Y', '0', 7); -- tc direct project id
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33104, 16912, 'Y', '%', 8); -- winner handle
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33104, 25943, 'Y', '2199-01-01', 9); -- final review end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33104, 25944, 'Y', '1900-01-01', 10); -- final review start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33104, 25881, 'Y', '', 11); -- project category description
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33104, 25947, 'Y', '', 12); -- project catalog name
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33104, 25942, 'N', 13);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33104, 16917, 'N', 14);

INSERT INTO 'informix'.query(query_id, name, ranking) VALUES(33105, 'restapi_search_past_contest_count', 0);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33105, 25761, 'Y', '%', 0); -- project name
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33105, 25938, 'Y', '2199-01-01', 1); -- register start end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33105, 25939, 'Y', '1900-01-01', 2); -- register start start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33105, 25940, 'Y', '2199-01-01', 3); -- submission end end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33105, 25941, 'Y', '1900-01-01', 4); -- submission end start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33105, 25430, 'Y', '0', 5); -- tc direct project id
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33105, 16912, 'Y', '%', 6); -- winner handle
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33105, 25943, 'Y', '2199-01-01', 7); -- final review end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33105, 25944, 'Y', '1900-01-01', 8); -- final review start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33105, 25881, 'Y', '', 9); -- project category description
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33105, 25947, 'Y', '', 10); -- project catalog name

INSERT INTO 'informix'.command(command_id, command_desc, command_group_id) VALUES(32572, 'restapi_search_past_contest', 11004);
INSERT INTO 'informix'.command_query_xref(command_id, query_id) VALUES(32572, 33104);
INSERT INTO 'informix'.command_query_xref(command_id, query_id) VALUES(32572, 33105);


INSERT INTO 'informix'.query(query_id, name, ranking) VALUES(33106, 'restapi_search_upcoming_contest', 0);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33106, 25921, 'N', 0);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33106, 25690, 'N', 1);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33106, 25761, 'Y', '%', 2); -- project name
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33106, 25938, 'Y', '2199-01-01', 3); -- register start end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33106, 25939, 'Y', '1900-01-01', 4); -- register start start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33106, 25940, 'Y', '2199-01-01', 5); -- submission end end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33106, 25941, 'Y', '1900-01-01', 6); -- submission end start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33106, 25430, 'Y', '0', 7); -- tc direct project id
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33106, 25936, 'Y', '-1', 8); -- first prize lower bound
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33106, 25937, 'Y', '1000000', 9); -- first prize upper bound
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33106, 25881, 'Y', '', 10); -- project category description
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33106, 25947, 'Y', '', 11); -- project catalog name
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33106, 25942, 'N', 12);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, sort_order) VALUES(33106, 16917, 'N', 13);

INSERT INTO 'informix'.query(query_id, name, ranking) VALUES(33107, 'restapi_search_upcoming_contest_count', 0);
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33107, 25761, 'Y', '%', 0); -- project name
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33107, 25938, 'Y', '2199-01-01', 1); -- register start end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33107, 25939, 'Y', '1900-01-01', 2); -- register start start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33107, 25940, 'Y', '2199-01-01', 3); -- submission end end date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33107, 25941, 'Y', '1900-01-01', 4); -- submission end start date
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33107, 25430, 'Y', '0', 5); -- tc direct project id
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33107, 25936, 'Y', '-1', 6); -- first prize lower bound
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33107, 25937, 'Y', '1000000', 7); -- first prize upper bound
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33107, 25881, 'Y', '', 8); -- project category description
INSERT INTO 'informix'.query_input_xref(query_id, input_id, optional, default_value, sort_order) VALUES(33107, 25947, 'Y', '', 9); -- project catalog name

INSERT INTO 'informix'.command(command_id, command_desc, command_group_id) VALUES(32573, 'restapi_search_upcoming_contest', 11004);
INSERT INTO 'informix'.command_query_xref(command_id, query_id) VALUES(32573, 33106);
INSERT INTO 'informix'.command_query_xref(command_id, query_id) VALUES(32573, 33107);
