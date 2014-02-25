DATABASE common_oltp;

CREATE SEQUENCE SEQUENCE_SUBMISSION_SEQ INCREMENT BY 1 START WITH 10000000;
revoke all on "informix".SEQUENCE_SUBMISSION_SEQ from "public";
grant select on "informix".SEQUENCE_SUBMISSION_SEQ to "public" as "informix";

CREATE SEQUENCE SEQUENCE_UPLOAD_SEQ INCREMENT BY 1 START WITH 10000000;
revoke all on "informix".SEQUENCE_UPLOAD_SEQ from "public";
grant select on "informix".SEQUENCE_UPLOAD_SEQ to "public" as "informix";
