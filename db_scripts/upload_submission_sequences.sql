DATABASE common_oltp;
INSERT INTO 'informix'.id_sequences(name,next_block_start,block_size,exhausted) VALUES ('SEQUENCE_SUBMISSION_SEQ', 10000001, 10, 0);
CREATE SEQUENCE SEQUENCE_SUBMISSION_SEQ INCREMENT BY 1 START WITH 10000000;
revoke all on "informix".SEQUENCE_SUBMISSION_SEQ from "public";
grant select on "informix".SEQUENCE_SUBMISSION_SEQ to "public" as "informix";

INSERT INTO 'informix'.id_sequences(name,next_block_start,block_size,exhausted) VALUES ('SEQUENCE_UPLOAD_SEQ', 10000001, 10, 0);
CREATE SEQUENCE SEQUENCE_UPLOAD_SEQ INCREMENT BY 1 START WITH 10000000;
revoke all on "informix".SEQUENCE_UPLOAD_SEQ from "public";
grant select on "informix".SEQUENCE_UPLOAD_SEQ to "public" as "informix";
