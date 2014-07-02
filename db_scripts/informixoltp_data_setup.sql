database informixoltp;

CREATE SEQUENCE SEQUENCE_ROOM_SEQ INCREMENT BY 1 START WITH 1000000;
revoke all on "informix".SEQUENCE_ROOM_SEQ from "public";
grant select on "informix".SEQUENCE_ROOM_SEQ to "public" as "informix";
