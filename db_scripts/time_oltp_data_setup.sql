database time_oltp;

CREATE SEQUENCE SEQUENCE_PROJECT_SEQ INCREMENT BY 1 START WITH 10000000;
revoke all on "informix".SEQUENCE_PROJECT_SEQ from "public";
grant select on "informix".SEQUENCE_PROJECT_SEQ to "public" as "informix";

CREATE SEQUENCE SEQUENCE_ADDRESS_SEQ INCREMENT BY 1 START WITH 11000000;
revoke all on "informix".SEQUENCE_ADDRESS_SEQ from "public";
grant select on "informix".SEQUENCE_ADDRESS_SEQ to "public" as "informix";

CREATE SEQUENCE SEQUENCE_CONTACT_SEQ INCREMENT BY 1 START WITH 12000000;
revoke all on "informix".SEQUENCE_CONTACT_SEQ from "public";
grant select on "informix".SEQUENCE_CONTACT_SEQ to "public" as "informix";

insert into country_name(country_name_id, name, creation_date, creation_user, modification_date, modification_user) values (840, 'United States', CURRENT, '132456', CURRENT, '132456');
insert into state_name(state_name_id, name, abbreviation, creation_date, creation_user, modification_date, modification_user) values (7, 'Connecticut', 'CT', CURRENT, '132456', CURRENT, '132456');

insert into address_type(address_type_id, description, creation_date, creation_user, modification_date, modification_user) values (1, 'PROJECT', CURRENT, '132456', CURRENT, '132456');
insert into address_type(address_type_id, description, creation_date, creation_user, modification_date, modification_user) values (2, 'CLIENT', CURRENT, '132456', CURRENT, '132456');
insert into address_type(address_type_id, description, creation_date, creation_user, modification_date, modification_user) values (3, 'COMPANY', CURRENT, '132456', CURRENT, '132456');
insert into address_type(address_type_id, description, creation_date, creation_user, modification_date, modification_user) values (4, 'USER', CURRENT, '132456', CURRENT, '132456');

insert into contact_type(contact_type_id, description, creation_date, creation_user, modification_date, modification_user) values (1, 'PROJECT', CURRENT, '132456', CURRENT, '132456');
insert into contact_type(contact_type_id, description, creation_date, creation_user, modification_date, modification_user) values (2, 'CLIENT', CURRENT, '132456', CURRENT, '132456');
insert into contact_type(contact_type_id, description, creation_date, creation_user, modification_date, modification_user) values (3, 'COMPANY', CURRENT, '132456', CURRENT, '132456');
insert into contact_type(contact_type_id, description, creation_date, creation_user, modification_date, modification_user) values (4, 'USER', CURRENT, '132456', CURRENT, '132456');