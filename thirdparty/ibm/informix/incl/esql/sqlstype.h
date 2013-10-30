/****************************************************************************
 *
 *  Licensed Material - Property Of IBM
 *
 *  "Restricted Materials of IBM"
 *
 *  IBM Informix Client SDK
 *  Copyright IBM Corporation 1997, 2012
 *
 *  Title:       sqlstype.h
 *  Description: Defined symbols for SQL statement types
 *
 ***************************************************************************
 */

#ifndef SQLSTYPE_H_INCLUDED
#define SQLSTYPE_H_INCLUDED

/*
 * SQL statement types
 */

#define SQ_DATABASE	1	/* DATABASE              */
#define SQ_SELECT	2	/* SELECT		 */
#define SQ_SELINTO	3	/* SELECT INTO           */
#define SQ_UPDATE	4	/* UPDATE...WHERE        */
#define SQ_DELETE	5	/* DELETE...WHERE        */
#define SQ_INSERT	6	/* INSERT                */
#define SQ_UPDCURR	7	/* UPDATE WHERE CURRENT OF */
#define SQ_DELCURR	8	/* DELETE WHERE CURRENT OF */
#define SQ_LDINSERT	9	/* for internal use only */
#define SQ_LOCK		10	/* LOCK TABLE            */
#define SQ_UNLOCK	11	/* UNLOCK TABLE          */
#define SQ_CREADB	12	/* CREATE DATABASE       */
#define SQ_DROPDB	13	/* DROP DATABASE         */
#define SQ_CRETAB	14	/* CREATE TABLE          */
#define SQ_DRPTAB	15	/* DROP TABLE            */
#define SQ_CREIDX	16	/* CREATE INDEX          */
#define SQ_DRPIDX	17	/* DROP INDEX            */
#define SQ_GRANT	18	/* GRANT                 */
#define SQ_REVOKE	19	/* REVOKE                */
#define SQ_RENTAB	20	/* RENAME TABLE          */
#define SQ_RENCOL	21	/* RENAME COLUMN         */
#define SQ_CREAUD	22	/* CREATE AUDIT          */
#define SQ_STRAUD	23	/* for internal use only */
#define SQ_STPAUD	24	/* for internal use only */
#define SQ_DRPAUD	25	/* DROP AUDIT            */
#define SQ_RECTAB	26	/* RECOVER TABLE         */
#define SQ_CHKTAB	27	/* for internal use only */
#define SQ_REPTAB	28	/* for internal use only */
#define SQ_ALTER	29	/* ALTER TABLE           */
#define SQ_STATS	30	/* UPDATE STATISTICS     */
#define SQ_CLSDB	31	/* CLOSE DATABASE        */
#define SQ_DELALL	32	/* DELETE (no WHERE)     */
#define SQ_UPDALL	33	/* UPDATE (no WHERE)     */
#define SQ_BEGWORK	34	/* BEGIN WORK            */
#define SQ_COMMIT	35	/* COMMIT WORK           */
#define SQ_ROLLBACK	36	/* ROLLBACK WORK         */
#define SQ_SAVEPOINT	37	/* for internal use only */
#define SQ_STARTDB	38	/* START DATABASE        */
#define SQ_RFORWARD	39	/* ROLLFORWARD DATABASE  */
#define SQ_CREVIEW	40	/* CREATE VIEW           */
#define SQ_DROPVIEW	41	/* DROP VIEW             */
#define SQ_DEBUG	42	/* for internal use only */
#define SQ_CREASYN	43	/* CREATE SYNONYM        */
#define SQ_DROPSYN	44	/* DROP SYNONYM          */
#define SQ_CTEMP	45	/* CREATE TEMP TABLE     */
#define SQ_WAITFOR	46	/* SET LOCK MODE         */
#define SQ_ALTIDX       47	/* ALTER INDEX           */
#define SQ_ISOLATE	48	/* SET ISOLATION         */
#define SQ_SETLOG	49	/* SET LOG               */
#define SQ_EXPLAIN	50	/* SET EXPLAIN           */
#define SQ_SCHEMA	51	/* CREATE SCHEMA         */
#define SQ_OPTIM	52	/* SET OPTIMIZATION      */
#define SQ_CREPROC	53	/* CREATE PROCEDURE      */
#define SQ_DRPPROC	54	/* DROP PROCEDURE        */
#define SQ_CONSTRMODE   55	/* SET CONSTRAINTS       */
#define SQ_EXECPROC	56	/* EXECUTE PROCEDURE     */
#define SQ_DBGFILE	57	/* SET DEBUG FILE TO     */
#define SQ_CREOPCL	58	/* CREATE OPTICAL CLUSTER */
#define SQ_ALTOPCL	59	/* ALTER OPTICAL CLUSTER */
#define SQ_DRPOPCL	60	/* DROP OPTICAL CLUSTER  */
#define SQ_OPRESERVE	61	/* RESERVE (optical)     */
#define SQ_OPRELEASE	62	/* RELEASE (optical)     */
#define SQ_OPTIMEOUT	63	/* SET OPTICAL TIMEOUT  */
#define SQ_PROCSTATS    64	/* UPDATE STATISTICS (for procedure) */

/* 65 and 66 were used for SQ_GRANTGRP and SQ_REVOKGRP for KANJI
 * their functionality is replaced by ROLE
 */

/* 67, 68 and 69 were used for SQ_SKINHIBIT, SQ_SKSHOW and SQ_SKSMALL
 * which are no longer supported
 */

#define SQ_CRETRIG	70	/* CREATE TRIGGER        */
#define SQ_DRPTRIG	71	/* DROP TRIGGER          */

/*
 * This statement type is reserved for identifying new statements with
 * custom syntax extensions to the generic SQL parser
 */
#define SQ_UNKNOWN	72
#define SQ_SETDATASKIP	73	/* SET DATASKIP          */
#define SQ_PDQPRIORITY  74	/* SET PDQPRIORITY       */
#define SQ_ALTFRAG	75	/* ALTER FRAGMENT        */

#define SQ_SETOBJMODE   76      /* SET MODE ENABLED/DISABLED/FILTERING   */
#define SQ_START        77      /* START VIOLATIONS TABLE   */
#define SQ_STOP         78      /* STOP VIOLATIONS TABLE   */

#define SQ_SETMAC       79      /* SET SESSION LEVEL */
#define SQ_SETDAC       80      /* SET SESSION AUTHORIZATION */
#define SQ_SETTBLHI     81	/* SET TABLE HIGH */
#define SQ_SETLVEXT     82	/* SET EXTENT SIZE */

#define SQ_CREATEROLE   83	/* CREATE ROLE */
#define SQ_DROPROLE     84  	/* DROP ROLE */
#define SQ_SETROLE      85	/* SET ROLE */
#define SQ_PASSWD       86	/* SET DBPASSWORD */

#define SQ_RENDB	87	/* RENAME DATABASE */

#define SQ_CREADOM	88	/* CREATE DOMAIN */
#define SQ_DROPDOM	89	/* DROP DOMAIN   */

#define SQ_CREANRT	90	/* CREATE NAMED ROW TYPE */
#define SQ_DROPNRT	91	/* DROP NAMED ROW TYPE   */

#define SQ_CREADT       92      /* CREATE DISTINCT TYPE */
#define SQ_CREACT       93      /* CREATE CAST */
#define SQ_DROPCT       94      /* DROP CAST */

#define SQ_CREABT       95      /* CREATE OPAQUE TYPE */
#define SQ_DROPTYPE     96      /* DROP TYPE */

#define SQ_ALTERROUTINE 97      /* ALTER routine */

#define SQ_CREATEAM	98	/* CREATE ACCESS_METHOD */
#define SQ_DROPAM	99	/* DROP ACCESS_METHOD   */
#define SQ_ALTERAM     100	/* ALTER ACCESS_METHOD   */

#define SQ_CREATEOPC   101	/* CREATE OPCLASS */
#define SQ_DROPOPC     102	/* DROP OPCLASS   */

#define SQ_CREACST     103      /* CREATE CONSTRUCTOR */

#define SQ_SETRES      104     /* SET (MEMORY/NON)_RESIDENT */

#define SQ_CREAGG      105	/* CREATE AGGREGATE */
#define SQ_DRPAGG      106	/* DROP AGGREGATE   */

#define SQ_PLOADFILE	107	/* pload log file command*/
#define SQ_CHKIDX	108	/* onutil check index command */
#define SQ_SCHEDULE	109      /* set schedule          */
#define SQ_SETENV       110      /* "set environment ..." */

#define SQ_CREADUP      111     /* create duplicate - 8.31 xps */
#define SQ_DROPDUP      112     /* drop duplicate - 8.31 xps */
#define SQ_XPS_RES4	113	/* reserved for future use */
#define SQ_XPS_RES5	114	/* reserved for future use */

#define SQ_STMT_CACHE   115     /* SET STMT_CACHE */

#define SQ_RENIDX       116     /* RENAME INDEX   */
#define SQ_CREAGUID	117	/* Create ServerGuid */
#define SQ_DROPGUID	118	/* Drop ServerGuid */
#define SQ_ALTRGUID	119	/* Alter ServerGuid */
#define SQ_ALTERBT	120	/* ALTER TYPE */

#define SQ_ALTERCST	121	/* ALTER CONSTRUCTOR */
#define SQ_TRUNCATE	122     /* truncate table   */

#define SQ_IMPLICITTX   123     /* Implicit transaction */
#define SQ_CRESEQ       124     /* CREATE SEQUENCE*/
#define SQ_DRPSEQ       125     /* DROP SEQUENCE  */
#define SQ_ALTERSEQ     126     /* ALTER SEQUENCE */
#define SQ_RENSEQ       127     /* RENAME SEQUENCE */
#define SQ_MERGE        128     /* MERGE statement */
#define SQ_MVTAB	129	/* MOVE TABLE ... TO DATABASE ... */
#define SQ_EXTD         133     /*save external directive*/
#define SQ_CRXASRCTYPE  134     /* CREATE XAdatasource TYPE */
#define SQ_CRXADTSRC    135     /* CREATE XAdatasource */
#define SQ_DROPXATYPE   136     /* DROP XAdatasource  TYPE */
#define SQ_DROPXADTSRC  137     /* DROP XAdatasource */

#define SQ_SETSVPT      159     /* SAVEPOINT */
#define SQ_RELSVPT      160     /* RELEASE SAVEPOINT */
#define SQ_RBACKSVPT	161	/* ROLLBACK TO SAVEPOINT */

#define SQ_SELINTOEXT   164     /* SELECT INTO EXTERNAL  */

/* If you add any more sql statements don't forget that you also need to
 * make changes to sqscbinf.h, sql.msg, and sysmaster.sql to reflect the new
 * statement number.
 */
#define	SQ_MAXSTMT	SQ_SELINTOEXT

#endif /* SQLSTYPE_H_INCLUDED */
