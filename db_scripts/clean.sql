database tcs_catalog;

DELETE FROM input_lu WHERE input_id >= 25936 AND input_id <=25947;

DELETE FROM command_query_xref WHERE query_id = 33100;
DELETE FROM command_query_xref WHERE query_id = 33101;
DELETE FROM command_query_xref WHERE query_id = 33102;
DELETE FROM command_query_xref WHERE query_id = 33103;
DELETE FROM command_query_xref WHERE query_id = 33104;
DELETE FROM command_query_xref WHERE query_id = 33105;
DELETE FROM command_query_xref WHERE query_id = 33106;
DELETE FROM command_query_xref WHERE query_id = 33107;

DELETE FROM query_input_xref WHERE query_id = 33100;
DELETE FROM query_input_xref WHERE query_id = 33101;
DELETE FROM query_input_xref WHERE query_id = 33102;
DELETE FROM query_input_xref WHERE query_id = 33103;
DELETE FROM query_input_xref WHERE query_id = 33104;
DELETE FROM query_input_xref WHERE query_id = 33105;
DELETE FROM query_input_xref WHERE query_id = 33106;
DELETE FROM query_input_xref WHERE query_id = 33107;


DELETE FROM query WHERE query_id = 33100;
DELETE FROM query WHERE query_id = 33101;
DELETE FROM query WHERE query_id = 33102;
DELETE FROM query WHERE query_id = 33103;
DELETE FROM query WHERE query_id = 33104;
DELETE FROM query WHERE query_id = 33105;
DELETE FROM query WHERE query_id = 33106;
DELETE FROM query WHERE query_id = 33107;

DELETE FROM command_execution WHERE command_id = 32570;
DELETE FROM command_execution WHERE command_id = 32571;
DELETE FROM command_execution WHERE command_id = 32572;
DELETE FROM command_execution WHERE command_id = 32573;

DELETE FROM command WHERE command_id = 32570;
DELETE FROM command WHERE command_id = 32571;
DELETE FROM command WHERE command_id = 32572;
DELETE FROM command WHERE command_id = 32573;
