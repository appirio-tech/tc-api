/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1997, 2010
 *
 *  Title:       sqliapi.h
 *  Description: Header file for all "external" SQLI apis for internal users.
 *
 *  These apis are NOT intended for direct use by external users.
 *
 ***************************************************************************
 */

#ifndef _SQLIAPI_H
#define _SQLIAPI_H

#include "sqlhdr.h"

#ifdef __cplusplus
extern "C" {
#endif

#define ESQLINTVERSION		1

MI_EXT_DECL void SqlFreeMem(void * MemAddr, int FreeType);
MI_EXT_DECL mint sqli_cl_alloc(int4 version, ifx_collection_t **collection, ifx_typerow_t *typed);
MI_EXT_DECL 	mint sqli_desc_alloc(const char *descname, mint occurrence);
MI_EXT_DECL 	mint sqli_desc_dealloc(const char *desc_name);
MI_EXT_DECL 	mint sqli_desc_get(int4 version, const char *desc_name, mint sqlvar_num, ifx_hostvar_t *hosttab, mint xopen_flg);
MI_EXT_DECL 	mint sqli_desc_set(int4 version, const char *desc_name, mint sqlvar_num, ifx_hostvar_t *hosttab, mint xopen_flg);
MI_EXT_DECL 	mint sqli_trans_begin(void);
MI_EXT_DECL 	mint sqli_trans_begin2(mint replication);
MI_EXT_DECL 	mint sqli_trans_release_svpt(const char *svpt_name);
MI_EXT_DECL 	mint sqli_trans_set_svpt(const char *svpt_name, mint unique_flag);
MI_EXT_DECL 	mint sqli_trans_rollback_svpt(void);
MI_EXT_DECL 	mint sqli_trans_rollback_svptname(const char *svpt_name);
MI_EXT_DECL 	mint sqli_trans_commit(void);
MI_EXT_DECL 	mint sqli_trans_rollback(void);
MI_EXT_DECL 	mint sqli_curs_decl_stat(int4 version, ifx_cursor_t *cursor, const char *curname, const char **cmdtxt, ifx_sqlda_t *idesc, ifx_sqlda_t *odesc, int4 flags, ifx_literal_t *litvalues, ifx_namelist_t *namelist, mint statement_type, mint position, mint col_stmt_flag);
MI_EXT_DECL 	mint sqli_curs_decl_dynm(int4 version, ifx_cursor_t *cursor, const char *curname, ifx_cursor_t *stmt, int4 flags, mint col_stmt_flag);
MI_EXT_DECL 	mint sqli_curs_fetch(int4 version, ifx_cursor_t *cursor, ifx_sqlda_t *idesc, ifx_sqlda_t *odesc, const char *odesc_name, _FetchSpec *fetchspec);
MI_EXT_DECL  mint sqli_autofree_set(int4 version, ifx_cursor_t *cursor, mint status);
MI_EXT_DECL 	mint sqli_defprep_set(mint status);
MI_EXT_DECL 	mint sqli_curs_open(int4 version, ifx_cursor_t *cursor, ifx_sqlda_t *idesc, const char *desc_name, struct value *ivalues, mint useflag, mint reoptflag);
MI_EXT_DECL 	ifx_cursor_t *sqli_curs_locate(int4 version, const char *name, mint type);
MI_EXT_DECL 	mint sqli_curs_flush(int4 version, ifx_cursor_t *cursor);
MI_EXT_DECL 	mint sqli_curs_close(int4 version, ifx_cursor_t *cursor);
MI_EXT_DECL 	mint sqli_curs_free(int4 version, ifx_cursor_t *cursor);
MI_EXT_DECL 	ifx_cursor_t *sqli_prep(int4 version, const char *name, const char *stmt, ifx_literal_t *litvalues, ifx_namelist_t *namelist, mint statement_type, mint position, mint col_stmt_flag);
MI_EXT_DECL 	mint sqli_describe_stmt(int4 version, ifx_cursor_t *cursor, ifx_sqlda_t **descp, const char *desc_name);
MI_EXT_DECL 	mint sqli_describe_input_stmt(int4 version, ifx_cursor_t *cursor, ifx_sqlda_t **descp, const char *desc_name);
MI_EXT_DECL 	mint sqli_describe_output_stmt(int4 version, ifx_cursor_t *cursor, ifx_sqlda_t **descp, const char *desc_name);
MI_EXT_DECL 	mint sqli_db_open(const char *db_name, mint exclusive);
MI_EXT_DECL 	mint sqli_db_close(void);
MI_EXT_DECL 	mint sqli_exec(int4 version, ifx_cursor_t *cursor, ifx_sqlda_t *idesc, const char *idesc_name, struct value *ivalues, ifx_sqlda_t *odesc, const char *odesc_name, struct value *ovalues, mint chkind);
MI_EXT_DECL 	mint sqli_exec_immed(const char *stmt);
MI_EXT_DECL 	mint sqli_proc_create(char *fname);
MI_EXT_DECL 	mint sqli_proc_exec(int4 version, ifx_cursor_t *cursor, const char **cmdtxt, mint icnt, ifx_sqlvar_t *ibind, mint ocnt, ifx_sqlvar_t *obind, mint chkind, mint freecursor);
MI_EXT_DECL 	mint sqli_proc_exec_2(int4 version, ifx_cursor_t *cursor, const char **cmdtxt, mint icnt, ifx_sqlvar_t *ibind, mint ocnt, ifx_sqlvar_t *obind, mint sysdesc, mint chkind, mint freecursor);
MI_EXT_DECL 	mint sqli_proc_exec_2i(int4 version, ifx_cursor_t *cursor, const char **cmdtxt, mint icnt, ifx_sqlvar_t *ibind, mint ocnt, ifx_sqlvar_t *obind, mint sysdesc, mint chkind, mint freecursor);
MI_EXT_DECL	mint sqli_diag_get(int4 version, ifx_hostvar_t *hosttab, mint exception_num);
MI_EXT_DECL 	mint sqli_curs_put(int4 version, ifx_cursor_t *cursor, ifx_sqlda_t *idesc, const char *desc_name);
MI_EXT_DECL 	mint sqli_slct(int4 version, ifx_cursor_t *cursor, const char **cmdtxt, mint icnt, ifx_sqlvar_t *ibind, mint ocnt, ifx_sqlvar_t *obind, mint chkind, ifx_literal_t *litvalues, ifx_namelist_t *namelist, mint col_smt_flag);
MI_EXT_DECL	mint sqli_stmt(int4 version, ifx_statement_t *scb, const char **cmdtxt, mint icnt, ifx_sqlvar_t *ibind, struct value *ivalues, ifx_literal_t *litvalues, ifx_namelist_t *namelist, ifx_cursor_t *cur_wco, mint stmttype, mint position, mint col_smt_flag);
MI_EXT_DECL 	void sqli_stop_whenever(void);

MI_EXT_DECL	void sqli_connect_open(int4 version, mint conn_kw, const char *dbenv, const char *conn_name, ifx_conn_t *conn_spec, mint concur_trusted_flag);
MI_EXT_DECL	void sqli_connect_close(mint conn_kw, const char *conn_name, mint flag, mint from_reassoc);
MI_EXT_DECL	void sqli_connect_set(mint conn_kw, const char *conn_name, mint dormant);
MI_EXT_DECL 	void _iqseterr(mint sys_errno);
MI_EXT_DECL	void sqli_mt_ibc(mint cnt);
MI_EXT_DECL	void sqli_mt_ibind(mint type, char *address, mint length, mint itype, char *iaddress, mint ilength, mint ownerlen, char *owner, mint udtlen, char *udtname, mint complexlen, char *complexname, int2 sourcetype, int4 sourceid);
MI_EXT_DECL	void sqli_mt_obc(mint cnt);
MI_EXT_DECL	void sqli_mt_obind(mint type, char *address, mint length, mint itype, char *iaddress, mint ilength, mint ownerlen, char *owner, mint udtlen, char *udtname, mint complexlen, char *complexname, int2 sourcetype, int4 sourceid);
MI_EXT_DECL	void sqli_mt_stmnt(const char *sqlcmdtxt[], mint incnt);
MI_EXT_DECL	void sqli_mt_slct(char *sqlcmdtxt[], mint incnt, mint outcnt, mint chkind);
MI_EXT_DECL	void sqli_mt_copen(int4 version, const char *curname, mint incnt, ifx_sqlda_t *desc, char *dname, mint useflag, mint reoptflag);
MI_EXT_DECL	void sqli_mt_nftch(int4 version, const char *curname, mint outcnt, mint incnt, mint fetch_type, int4 value, ifx_sqlda_t *odesc, ifx_sqlda_t *idesc, mint chk, const char *odname);
MI_EXT_DECL	void sqli_mt_free(const char *name);
MI_EXT_DECL	void sqli_mt_close(const char *name);
MI_EXT_DECL	void sqli_mt_flush(const char *name);
MI_EXT_DECL	void sqli_mt_insput(int4 version, const char *curname, mint incnt, ifx_sqlda_t *desc, char *dname);
MI_EXT_DECL	void sqli_mt_dclcur(int4 version, const char *curname, const char *sqlcmdtxt[], mint incnt, mint outcnt, int4 scrflag, ifx_literal_t *lit, ifx_namelist_t *namelist, mint stmttype, mint position, mint collstmt);
MI_EXT_DECL	void sqli_mt_prepare(const char *name, char *from);
MI_EXT_DECL	void sqli_mt_execute(const char *name, mint incnt, char *indname, mint outcnt, const char *outdname, mint chkind);
MI_EXT_DECL	void sqli_mt_dyndcl(const char *curname, char *sname, int4 flags);
MI_EXT_DECL	void sqli_mt_describe(int4 version, char *sname, ifx_sqlda_t **desc, const char *dname);
MI_EXT_DECL	void sqli_mt_describe_input(int4 version, char *sname, ifx_sqlda_t **desc, const char *dname);
MI_EXT_DECL	void sqli_mt_describe_output(int4 version, char *sname, ifx_sqlda_t **desc, const char *dname);
MI_EXT_DECL	void sqli_mt_database(char *dbname, mint excl);
MI_EXT_DECL	void sqli_mt_exproc(char *stmt, mint num_ibind, mint num_obind, mint chkind);
MI_EXT_DECL	void sqli_mt_connect(int4 version, mint conn_kw, char *dbenv, char *conn_name, void *conn_hdl, mint concur_trusted_flag);
MI_EXT_DECL	void sqli_mt_disconnect(mint conn_kw, char *conn_name);
MI_EXT_DECL	void sqli_mt_setconnect(mint conn_kw, char *conn_name);
MI_EXT_DECL	void sqli_mt_rerror(char *msg);
MI_EXT_DECL	void *sqli_mt_alloc_isqlda(int4 version, mint cnt);
MI_EXT_DECL	ifx_literal_t *sqli_mt_alloc_literal(int4 version, mint cnt);
MI_EXT_DECL	void *sqli_mt_alloc_osqlda(int4 version, mint cnt);
MI_EXT_DECL	void sqli_mt_hostbind(int4 version, ifx_hostvar_t *htab, mint vnum, mint type, mint qualifier, mint length, char *addr);
MI_EXT_DECL	void sqli_mt_litbind(int4 version, ifx_literal_t *lit, char *addr, int2 type, int2 len, int2 qual, int2 literal);

MI_EXT_DECL	mint sqli_setdormant(int2 status);

#ifdef IFX_THREAD
MI_EXT_DECL struct sqlca_s *ifx_sqlca_tcb(void *alltcbp);
MI_EXT_DECL int4 *ifx_sqlcode_tcb(void *alltcbp);
MI_EXT_DECL mint sqli_cl_alloc_tcb(int4 version, ifx_collection_t **collection, ifx_typerow_t *typed, void *alltcbp);
MI_EXT_DECL 	mint sqli_desc_alloc_tcb(const char *descname, mint occurrence, void *alltcbp);
MI_EXT_DECL 	mint sqli_desc_dealloc_tcb(const char *desc_name, void *alltcbp);
MI_EXT_DECL 	mint sqli_desc_get_tcb(int4 version, const char *desc_name, mint sqlvar_num, ifx_hostvar_t *hosttab, mint xopen_flg, void *alltcbp);
MI_EXT_DECL 	mint sqli_desc_set_tcb(int4 version, const char *desc_name, mint sqlvar_num, ifx_hostvar_t *hosttab, mint xopen_flg, void *alltcbp);
MI_EXT_DECL 	mint sqli_trans_begin_tcb(void *alltcbp);
MI_EXT_DECL 	mint sqli_trans_begin2_tcb(mint replication, void *alltcbp);
MI_EXT_DECL 	mint sqli_trans_release_svpt_tcb(const char *svpt_name, void *alltcbp);
MI_EXT_DECL 	mint sqli_trans_set_svpt_tcb(const char *svpt_name, mint unique_flag, void *alltcbp);
MI_EXT_DECL 	mint sqli_trans_rollback_svpt_tcb(void *alltcbp);
MI_EXT_DECL 	mint sqli_trans_rollback_svptname_tcb(const char *svpt_name, void *alltcbp);
MI_EXT_DECL 	mint sqli_trans_commit_tcb(void *alltcbp);
MI_EXT_DECL 	mint sqli_trans_rollback_tcb(void *alltcbp);
MI_EXT_DECL 	mint sqli_curs_decl_stat_tcb(int4 version, ifx_cursor_t *cursor,const char *curname, const char **cmdtxt, ifx_sqlda_t *idesc, ifx_sqlda_t *odesc, int4 flags, ifx_literal_t *litvalues, ifx_namelist_t *namelist, mint statement_type, mint position, mint col_stmt_flag, void *alltcbp);
MI_EXT_DECL 	mint sqli_curs_decl_dynm_tcb(int4 version, ifx_cursor_t *cursor,const char *curname, ifx_cursor_t *stmt, int4 flags, mint col_stmt_flag, void *alltcbp);
MI_EXT_DECL 	mint sqli_curs_fetch_tcb(int4 version, ifx_cursor_t *cursor, ifx_sqlda_t *idesc, ifx_sqlda_t *odesc, const char *odesc_name, _FetchSpec *fetchspec, void *alltcbp);
MI_EXT_DECL  mint sqli_autofree_set_tcb(int4 version, ifx_cursor_t *cursor, mint status, void *alltcbp);
MI_EXT_DECL 	mint sqli_defprep_set_tcb(mint status, void *alltcbp);
MI_EXT_DECL 	mint sqli_curs_open_tcb(int4 version, ifx_cursor_t *cursor, ifx_sqlda_t *idesc, char *desc_name, struct value *ivalues, mint useflag, mint reoptflag, void *alltcbp);
MI_EXT_DECL 	ifx_cursor_t *sqli_curs_locate_tcb(int4 version, const char *name, mint type, void *alltcbp);
MI_EXT_DECL 	mint sqli_curs_flush_tcb(int4 version, ifx_cursor_t *cursor, void *alltcbp);
MI_EXT_DECL 	mint sqli_curs_close_tcb(int4 version, ifx_cursor_t *cursor, void *alltcbp);
MI_EXT_DECL 	mint sqli_curs_free_tcb(int4 version, ifx_cursor_t *cursor, void *alltcbp);
MI_EXT_DECL 	ifx_cursor_t *sqli_prep_tcb(int4 version, const char *name, const char *stmt, ifx_literal_t *litvalues, ifx_namelist_t *namelist, mint statement_type, mint position, mint col_stmt_flag, void *alltcbp);
MI_EXT_DECL 	mint sqli_describe_stmt_tcb(int4 version, ifx_cursor_t *cursor, ifx_sqlda_t **descp, const char *desc_name, void *alltcbp);
MI_EXT_DECL 	mint sqli_describe_input_stmt_tcb(int4 version, ifx_cursor_t *cursor, ifx_sqlda_t **descp, const char *desc_name, void *alltcbp);
MI_EXT_DECL 	mint sqli_describe_output_stmt_tcb(int4 version, ifx_cursor_t *cursor, ifx_sqlda_t **descp, const char *desc_name, void *alltcbp);
MI_EXT_DECL 	mint sqli_db_close_tcb(void *alltcbp);
MI_EXT_DECL 	mint sqli_exec_tcb(int4 version, ifx_cursor_t *cursor, ifx_sqlda_t *idesc, const char *idesc_name, struct value *ivalues, ifx_sqlda_t *odesc, const char *odesc_name, struct value *ovalues, mint chkind, void *alltcbp);
MI_EXT_DECL 	mint sqli_exec_immed_tcb(const char *stmt, void *alltcbp);
MI_EXT_DECL 	mint sqli_proc_create_tcb(char *fname, void *alltcbp);
MI_EXT_DECL 	mint sqli_proc_exec_2_tcb(int4 version, ifx_cursor_t *cursor,const char **cmdtxt, mint icnt, ifx_sqlvar_t *ibind, mint ocnt, ifx_sqlvar_t *obind, mint sysdesc, mint chkind, mint freecursor, void *alltcbp);
MI_EXT_DECL	mint sqli_diag_get_tcb(int4 version, ifx_hostvar_t *hosttab, mint exception_num, void *alltcbp);
MI_EXT_DECL 	mint sqli_curs_put_tcb(int4 version, ifx_cursor_t *cursor, ifx_sqlda_t *idesc, const char *desc_name, void *alltcbp);
MI_EXT_DECL 	mint sqli_slct_tcb(int4 version, ifx_cursor_t *cursor, const char **cmdtxt, mint icnt, ifx_sqlvar_t *ibind, mint ocnt, ifx_sqlvar_t *obind, mint chkind, ifx_literal_t *litvalues, ifx_namelist_t *namelist, mint col_smt_flag, void *alltcbp);
MI_EXT_DECL	mint sqli_stmt_tcb(int4 version, ifx_statement_t *scb, const char **cmdtxt, mint icnt, ifx_sqlvar_t *ibind, struct value *ivalues, ifx_literal_t *litvalues, ifx_namelist_t *namelist, ifx_cursor_t *cur_wco, mint stmttype, mint position, mint col_smt_flag, void *alltcbp);
MI_EXT_DECL 	void sqli_stop_whenever_tcb(void *alltcbp);
MI_EXT_DECL	void sqli_connect_open_tcb(int4 version, mint conn_kw, const char *dbenv, const char *conn_name, ifx_conn_t *conn_spec, mint concur_trusted_flag, void *alltcbp);
MI_EXT_DECL	void sqli_connect_close_tcb(mint conn_kw, const char *conn_name, mint flag, mint from_reassoc, void *alltcbp);
MI_EXT_DECL	void sqli_connect_set_tcb(mint conn_kw, const char *conn_name, mint dormant, void *alltcbp);
MI_EXT_DECL	void sqli_mt_ibind_tcb(mint type, char *address, mint length, mint itype, char *iaddress, mint ilength, mint ownerlen, char *owner, mint udtlen, char *udtname, mint complexlen, char *complexname, int2 sourcetype, int4 sourceid, void *alltcbp);
MI_EXT_DECL	void sqli_mt_obind_tcb(mint type, char *address, mint length, mint itype, char *iaddress, mint ilength, mint ownerlen, char *owner, mint udtlen, char *udtname, mint complexlen, char *complexname, int2 sourcetype, int4 sourceid, void *alltcbp);
MI_EXT_DECL	void sqli_mt_free_tcb(const char *name, void *alltcbp);
MI_EXT_DECL	void sqli_mt_dclcur_tcb(int4 version, const char *curname, const char *sqlcmdtxt[], mint incnt, mint outcnt, int4 scrflag, ifx_literal_t *lit, ifx_namelist_t *namelist, mint stmttype, mint position, mint collstmt, void *alltcbp);
MI_EXT_DECL	ifx_literal_t *sqli_mt_alloc_literal_tcb(int4 version, mint cnt, void *alltcbp);
MI_EXT_DECL	mint sqli_setdormant_tcb(int2 status, void *alltcbp);
MI_EXT_DECL	void * sqli_mt_gettcb(void);
#endif /* IFX_THREAD */

#define	SQLI_cl_alloc(coll, typed)	sqli_cl_alloc(ESQLINTVERSION, coll, typed)
#define	SQLI_alloc(descname, occ)	sqli_desc_alloc(descname, occ)
#define SQLI_dealloc(descname)		sqli_desc_dealloc(descname)
#define SQLI_get_desc(descname, sqlvar_num, hosttab, xopen_flg)	\
	sqli_desc_get(ESQLINTVERSION, descname, sqlvar_num, hosttab, xopen_flg)
#define SQLI_set_desc(descname, sqlvar_num, hosttab, xopen_flg)	\
	sqli_desc_set(ESQLINTVERSION, descname, sqlvar_num, hosttab, xopen_flg)
#define SQLI_beginwork()		sqli_trans_begin()
#define SQLI_beginwork2(replication)    sqli_trans_begin2(replication)
#define	SQLI_commitwork()		sqli_trans_commit()
#define	SQLI_rollback()			sqli_trans_rollback()
#define	SQLI_declare_curs(curs, cname, cmd, in, out, flg, lit, nm, type, pos, is_coll) \
	sqli_curs_decl_stat(ESQLINTVERSION, curs, cname, cmd, in, out, flg, lit, nm, type, pos, is_coll)
#define SQLI_declare_dyn_curs(curs, cname, stmt, flg, is_coll) \
	sqli_curs_decl_dynm(ESQLINTVERSION, curs, cname, stmt, flg, is_coll)
#define SQLI_fetch(cursor, idesc, odesc, odesc_name, fetchspec)	\
	sqli_curs_fetch(ESQLINTVERSION, cursor, idesc, odesc, odesc_name, fetchspec)
#define	SQLI_set_autofree(cursor, status)			\
	sqli_autofree_set(ESQLINTVERSION, cursor, status)
#define	SQLI_set_defprep(status)	sqli_defprep_set(status)
#define	SQLI_open_curs(curs, idesc, dname, ivalues, flg, reopt) \
	sqli_curs_open(ESQLINTVERSION, curs, idesc, dname, ivalues, flg, reopt)
#define SQLI_locate_curs(name, type)				\
	sqli_curs_locate(ESQLINTVERSION, name, type)
#define SQLI_flush_curs(curs)		sqli_curs_flush(ESQLINTVERSION, curs)
#define	SQLI_close_curs(curs)		sqli_curs_close(ESQLINTVERSION, curs)
#define	SQLI_free_curs(curs)		sqli_curs_free(ESQLINTVERSION, curs)
#define SQLI_prepare(name, stmt, litv, namelist, type, pos, iscoll) \
	sqli_prep(ESQLINTVERSION, name, stmt, litv, namelist, type, pos, iscoll)
#define SQLI_describe(curs, desc, name)				\
	sqli_describe_stmt(ESQLINTVERSION, curs, desc, name)
#define SQLI_describe_input(curs, desc, name)				\
	sqli_describe_input_stmt(ESQLINTVERSION, curs, desc, name)
#define SQLI_describe_output(curs, desc, name)				\
	sqli_describe_output_stmt(ESQLINTVERSION, curs, desc, name)
#define	SQLI_dbase(name, excl)		sqli_db_open(name, excl)
#define	SQLI_dbclose()			sqli_db_close()
#define	SQLI_execute(curs, idesc, iname, ivalues, odesc, oname, ovalues, chk) \
	sqli_exec(ESQLINTVERSION, curs, idesc, iname, ivalues, odesc, oname, ovalues, chk)
#define	SQLI_exim(stmt)			sqli_exec_immed(stmt)
#define	SQLI_create_proc(name)		sqli_proc_create(name)
#define SQLI_exec_proc(curs, cmd, icnt, ibind, ocnt, obind, chkind, freecurs) \
	sqli_proc_exec(ESQLINTVERSION, curs, cmd, icnt, ibind, ocnt, obind, chkind, freecurs)
#define SQLI_exec_proc_2(curs, cmd, icnt, ibind, ocnt, obind, sysdesc, chkind, freecurs) \
	sqli_proc_exec_2i(ESQLINTVERSION, curs, cmd, icnt, ibind, ocnt, obind, sysdesc, chkind, freecurs)
#define SQLI_get_diag(hosttab, enum)				\
	sqli_diag_get(ESQLINTVERSION, hosttab, enum)
#define SQLI_put(curs, idesc, dname)				\
	sqli_curs_put(ESQLINTVERSION, curs, idesc, dname)
#define SQLI_select(curs, cmd, icnt, ibind, ocnt, obind, chk, lit, nl, iscoll) \
    	sqli_slct(ESQLINTVERSION, curs, cmd, icnt, ibind, ocnt, obind, chk, lit, nl, iscoll)
#define	SQLI_statement(scb, cmd, icnt, ibind, ival, lit, nl, cur_wco, stmt, pos, iscoll) \
	sqli_stmt(ESQLINTVERSION, scb, cmd, icnt, ibind, ival, lit, nl, cur_wco, stmt, pos, iscoll)
#define SQLI_stop()			sqli_stop_whenever()
#define SQLI_connect(kw, dbenv, name, spec, trusted_tx)			\
	sqli_connect_open(ESQLINTVERSION, kw, dbenv, name, spec, trusted_tx)
#define	SQLI_disconnect(kw, name, flag, reassoc)		\
	sqli_connect_close(kw, name, flag, reassoc)
#define	SQLI_setconnect(kw, name, dormant)			\
	sqli_connect_set(kw, name, dormant)

#define	SQLI_iec_ibc(cnt)		sqli_mt_ibc(cnt)
#define	SQLI_iec_ibind(type, address, length, itype, iaddress, ilength, ownerlen, owner, udtlen, udtname, complexlen, complexname, sourcetype, sourceid) \
	sqli_mt_ibind(type, address, length, itype, iaddress, ilength, ownerlen, owner, udtlen, udtname, complexlen, complexname, sourcetype, sourceid)
#define SQLI_iec_obc(cnt)		sqli_mt_obc(cnt)
#define	SQLI_iec_obind(type, address, length, itype, iaddress, ilength, ownerlen, owner, udtlen, udtname, complexlen, complexname, sourcetype, sourceid) \
	sqli_mt_obind(type, address, length, itype, iaddress, ilength, ownerlen, owner, udtlen, udtname, complexlen, complexname, sourcetype, sourceid)
#define	SQLI_iec_stmnt(txt, cnt)	sqli_mt_stmnt(txt, cnt)
#define	SQLI_iec_slct(txt, icnt, ocnt, chk)			\
	sqli_mt_slct(txt, icnt, ocnt, chk)
#define SQLI_iec_copen(cname, incnt, desc, dname, flag, reopt)	\
	sqli_mt_copen(ESQLINTVERSION, cname, incnt, desc, dname, flag, reopt)
#define	SQLI_iec_nftch(cname, ocnt, icnt, type, val, odesc, idesc, chk, oname) \
	sqli_mt_nftch(ESQLINTVERSION, cname, ocnt, icnt, type, val, odesc, idesc, chk, oname)
#define	SQLI_iec_free(name)		sqli_mt_free(name)
#define	SQLI_iec_close(name)		sqli_mt_close(name)
#define	SQLI_iec_flush(name)		sqli_mt_flush(name)
#define	SQLI_iec_insput(curname, incnt, desc, dname)		\
	sqli_mt_insput(ESQLINTVERSION, curname, incnt, desc, dname)
#define	SQLI_iec_dclcur(curname, sqlcmdtxt, incnt, outcnt, scrflag, lit, namelist, stmttype, position, collstmt)				\
	sqli_mt_dclcur(ESQLINTVERSION, curname, sqlcmdtxt, incnt, outcnt, scrflag, lit, namelist, stmttype, position, collstmt)
#define SQLI_iec_prepare(name, from)	sqli_mt_prepare(name, from)
#define	SQLI_iec_execute(name, icnt, indname, outcnt, outdname, chkind)	\
	sqli_mt_execute(name, icnt, indname, outcnt, outdname, chkind)
#define	SQLI_iec_dyndcl(cname, sname, flg)			\
	sqli_mt_dyndcl(cname, sname, flg)
#define	SQLI_iec_describe(sname, desc, dname)			\
	sqli_mt_describe(ESQLINTVERSION, sname, desc, dname)
#define	SQLI_iec_describe_input(sname, desc, dname)			\
	sqli_mt_describe_input(ESQLINTVERSION, sname, desc, dname)
#define	SQLI_iec_describe_output(sname, desc, dname)			\
	sqli_mt_describe_output(ESQLINTVERSION, sname, desc, dname)
#define SQLI_iec_database(name, excl)	sqli_mt_database(name, excl)
#define	SQLI_iec_exproc(stmt, icnt, ocnt, chk)			\
	sqli_mt_exproc(stmt, icnt, ocnt, chk)
#define	SQLI_iec_connect(kw, dbenv, name, spec, trusted_tx)		\
	sqli_mt_connect(ESQLINTVERSION, kw, dbenv, name, spec, trusted_tx)
#define	SQLI_iec_disconnect(kw, name)	sqli_mt_disconnect(kw, name)
#define	SQLI_iec_setconnect(kw, name)	sqli_mt_setconnect(kw, name)
#define	SQLI_iec_rerror(msg)		sqli_mt_rerror(msg)
#define	SQLI_iec_alloc_isqlda(cnt)	sqli_mt_alloc_isqlda(ESQLINTVERSION, cnt)
#define	SQLI_iec_alloc_literal(cnt)	sqli_mt_alloc_literal(ESQLINTVERSION, cnt)
#define	SQLI_iec_alloc_osqlda(cnt)	sqli_mt_alloc_osqlda(ESQLINTVERSION, cnt)
#define	SQLI_iec_hostbind(htab, vnum, type, qualifier, length, addr)	\
	sqli_mt_hostbind(ESQLINTVERSION, htab, vnum, type, qualifier, length, addr)
#define	SQLI_iec_litbind(lit, addr, type, len, qual, literal)		\
	sqli_mt_litbind(ESQLINTVERSION, lit, addr, type, len, qual, literal)

#ifdef __cplusplus
}
#endif

#endif /* _SQLIAPI_H */
