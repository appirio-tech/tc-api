database common_oltp;
drop table 'informix'.user_social_login;
drop table 'informix'.social_login_provider ;

create table 'informix'.social_login_provider (
  social_login_provider_id decimal(10, 0) not null,
  name VARCHAR(50)
);
 
 
create table 'informix'.user_social_login (
  social_user_id VARCHAR(254),
  user_id decimal(10, 0) not null,
  social_login_provider_id decimal(10, 0) not null,
  social_user_name  VARCHAR(100) not null,
  social_email VARCHAR(100),
  social_email_verified  boolean 
);


INSERT INTO 'informix'.social_login_provider (social_login_provider_id, name) VALUES (1, 'facebook');
INSERT INTO 'informix'.social_login_provider (social_login_provider_id, name) VALUES (2, 'google');
INSERT INTO 'informix'.social_login_provider (social_login_provider_id, name) VALUES (3, 'twitter');
INSERT INTO 'informix'.social_login_provider (social_login_provider_id, name) VALUES (4, 'github');
INSERT INTO 'informix'.social_login_provider (social_login_provider_id, name) VALUES (5, 'salesforce');
INSERT INTO 'informix'.social_login_provider (social_login_provider_id, name) VALUES (50, 'ad');