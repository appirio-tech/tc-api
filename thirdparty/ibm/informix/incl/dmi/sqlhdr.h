/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 *
 * Copyright IBM Corporation 1997, 2012
 *
 *  Title:       sqlhdr.h
 *  Description: header file for all embedded sql programs
 *
 ***************************************************************************
 */

#ifndef _SQLHDR
#define _SQLHDR

#include "ifxtypes.h"
#include "sqlda.h"
#include "sqlca.h"
#include "collct.h"
#include "int8.h"
#include "locator.h"
#include "datetime.h"
#include "value.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct _ifx_squlist
    {
    char **_SQUulist;			/* columns to be updated */
    struct _squlist *_SQUnext;		/* next update list */
    mint _SQUid;				/* update list id */
    } ifx_squlist_t;

typedef struct _ifx_cursor
    {
    struct _ifx_cursor  *_SQCcursptr;   /* pointer to the statement/cursor
                                         * block.
                                         */
    int2 _SQCstmttype;			/* SQ_SELECT, SQ_INSERT, etc. */
    int2 _SQCsqlid;			/* SQL's id for this cursor */
    int2 _SQCnfields;			/* number of result fields
					 * (number supplied by SQL)
					 */
    int2 _SQCnibind;			/* number of input args */
    int2 _SQCnobind;			/* number of output args */
    int2 _SQCnrettype;			/* number of fields sent for the
					 * rettype msg
					 */
    int4 _SQCtcount;			/* tuples remaining in buffer */
    int4 _SQCtsize;			/* length of data expected from
					 * SQL
					 */
    int4 _SQCtbsize;			/* tuple buffer size */
    int4 _SQCflags;			/* CROPEN, CREOF, CRSINGLE, CRPREPARE*/
		/* used for scroll cursors */
    int4 _SQCfirst;			/* rowid of 1st tuple in buffer */
    int4 _SQClast;			/* rowid of last tuple in buffer */

    ifx_sqlvar_t *_SQCibind;	/* pointer to first in array of
					 * binding structures for arguments
					 * to be taken from the user
					 * program and sent to SQL;
					 */
    ifx_sqlvar_t *_SQCobind;	/* pointer to first in array of
					 * binding structures for values
					 * to be received from SQL and
					 * supplied to the user program;
					 */
    ifx_sqlvar_t *_SQCrettype;	/* pointer to first in array of
					 * binding structure for values
					 * to be sent thru the rettype
					 * msg
					 */
    ifx_sqlvar_t *_SQCfields;	/* pointer to first in array of
					 * structures describing the data
					 * to be received from SQL;
					 * (fields described by SQL)
					 */
    ifx_sqlda_t  *_SQCsqlda;		/* pointer to sqlda */
    char **_SQCcommand;			/* pointer to ptrs to pieces of
					 * the command
					 */
    char *_SQCstrtab;			/* pointer to table of strings - the
					 * names of the attributes to be
					 * received from SQL
					 * (table supplied by SQL)
					 */
    char *_SQCtbuf;			/* tuple buffer */
    char *_SQCtuple;			/* pointer to current tuple within
					 * buffer
					 */
    char *_SQCname;			/* cursor name */

    char *_SQCapiname;			/* column name buffer when */
					/* DBAPICODE is set */
    mint _SQCposition;			/* Used only for INSERT AT stmts */
    mint _SQCiscollstmt;		/* Set if cursor or stmt is for  */
					/* collection table */
    int4 _SQCcl_putcnt;			/* Number of variable length rows
					 * inserted using an insert cursor.
					 */
    ifx_collection_t *_SQCcollection;	/* pointer to collection var    */
    ifx_coll_cur_t _SQCcollcur;         /* collection manager cursor block */
    ifx_cl_tupinfo_t *_SQCcl_tupleinfo; /* collection tuple information */
    ifx_literal_t *_SQClitvalues;	/* pointer to the input values
					 * specified for the collection table */
    ifx_literal_t *_SQC_savlitvalues;	/* pointer to the saved
					 * literal values that have
					 * the QMARKBIND entries in
					 * it */
    ifx_namelist_t *_SQCnamelist;	/* Pointer to column names
					 * specified in the projection
					 * list for SELECT, UPDATE, INSERT
					 * and DELETE			*/
    int2 _SQCcl_num; 			/* number of collection columns */
	/* the following 4 fields are for open-fetch-close optimization */
    int2 _SQCopen_state;               /* see open_state below		*/
    char *_SQCdesc_name;	        /* saved sql desc name 		*/
    ifx_sqlda_t *_SQCidesc;            /* saved idesc value 		*/
    int2 _SQCreopt;			/* saved reoptimization flag 	*/
    void *_SQCcls;			/* reserved for fast path */
    void *_SQCcur7;			/* points to the corresponding
					 * 7.x cursor structure		*/
    int4 _SQCflags3;			/* reserved flag for future use */
    void *_SQCreserved;			/* reserved for future use */
    } ifx_cursor_t;

typedef struct _ifx_statement
    {
    int2 _SQSstmttype;			/* SQ_SELECT, SQ_INSERT, etc. */
    int2 _SQSsqlid;			/* SQL's id for this cursor */
    void  *_SQSreserved;		/* reserved for future use */
    } ifx_statement_t;

typedef struct _ifx_hostvar {
    char *hostaddr;    			/* address of host variable */
    int2 fieldtype;			/* field entry requested by GET */
    int2 hosttype;			/* host type */
    int4 hostlen;			/* length of field type */
    int2 qualifier;			/* qualifier for DATETIME/INTERVAL */
    char *btname;                       /* Base type name if provided in */
                                        /* host variable declaration */
    char *btownername;                  /* Base type owner name */
    char *cstr;                         /* collection or row host string */
    void *reserved;			/* reserved for future use */
    } ifx_hostvar_t;

/*
 * CURSOR state when (OPTOFC) Open-Fetch-Close Optimization is being used
 */
#define CURSOR_NOT_OPEN		0
#define CURSOR_USER_OPEN	1
#define CURSOR_OPEN_FETCH	2
#define CURSOR_FETCHING		3

/*
 * SQL field type codes
 */
#define XSQLD 		0
#define XSQLTYPE 	1
#define XSQLLEN 	2
#define XSQLPRECISION	3
#define XSQLNULLABLE	4
#define XSQLIND		5
#define XSQLDATA	6
#define XSQLNAME	7
#define XSQLSCALE	8
#define XSQLILEN	9
#define XSQLITYPE	10
#define XSQLIDATA	11
#define XSQLXID         12
#define XSQLTYPENAME    13
#define XSQLTYPELEN     14
#define XSQLOWNERLEN    15
#define XSQLOWNERNAME   16
#define XSQLSOURCETYPE	17
#define XSQLSOURCEID	18

/*
 * Specifications for FETCH
 */
typedef struct _fetchspec
    {
    int4 fval;			/* scroll quantity */
    mint fdir;			/* direction of FETCH (NEXT, PREVIOUS..) */
    mint findchk;		/* check for indicator? */
    } _FetchSpec;

/*
 * Connection type
 */

#define	IFX_CONN_TYPE_NO_AUTH	0x0
#define	IFX_CONN_TYPE_USER_AUTH	0x1
#define	IFX_CONN_TYPE_CRED_AUTH	0x2

/*
 * User connection structure
 */
typedef struct ifx_user_struct
    {
    char	*name;
    char	*passwd;
    } ifx_user_t;

/*
 * ASF connection structure
 */
typedef struct ifx_connect_struct
    {
    int2	conn_type;		/* connection type */
    void	*conn_cred_hdl;		/* connection credential handle */
					/* could be pointer to ifx_user_t */
					/* or any CSS supported credentials */
    } ifx_conn_t;

/*
 * Types stored in csblock_t (iqutil.c)
 */
#define IQ_CURSOR	   0x0000
#define IQ_STMT		   0x0001
#define IQ_ALL		   0x0002
#define IQ_SKIP_CUR_CHK	   0x0100
#define IQ_SKIP_DOWNSHIFT  0x0200

/*
 * The following defines will be used to check the installed version of
 * the libraries against the ones used during compilation. A handshaking
 * method was introduced with shared libraries to indicate if the
 * API changed between one release of the library to the other.
 */
#define IFX_GENLIB_ID  1    /* identifier for libgen.so */
#define IFX_OSLIB_ID   2    /* identifier for libos.so  */
#define IFX_SQLILIB_ID 3    /* identifier for libsql.so */
#define IFX_GLSLIB_ID  4    /* identifier for libgls.so */

/*
 * provide macro definition for the library versions
 * being used while generating client's application executable.
 */
#define CLIENT_GEN_VER		710	/* libgen.so used for compiling application */
#define CLIENT_OS_VER		710	/* libos.so used for compiling application  */
#define CLIENT_SQLI_VER		720	/* libsql.so used for compiling application */
#define CLIENT_GLS_VER		710	/* libgls.so used for compiling application */

/*
 * provide error message codes if apis of library installed is different
 * than the one with which the application was compiled.
 */
#define GEN_FAIL_CODE   -1280   /* generate error message code for genlib */
#define OS_FAIL_CODE    -1281   /* generate error message code for oslib */
#define SQLI_FAIL_CODE  -1282   /* generate error message code for libsql */
#define GLS_FAIL_CODE   -1283   /* generate error message code for libgls */

#ifdef IFX_THREAD

/* defines for dynamic thread functions */
#define TH_ONCE                 0
#define TH_MUTEXATTR_CREATE     1
#define TH_MUTEXATTR_SETKIND    2
#define TH_MUTEXATTR_DELETE     3
#define TH_MUTEX_INIT           4
#define TH_MUTEX_DESTROY        5
#define TH_MUTEX_LOCK           6
#define TH_MUTEX_UNLOCK         7
#define TH_MUTEX_TRYLOCK        8
#define TH_CONDATTR_CREATE      9
#define TH_CONDATTR_DELETE      10
#define TH_COND_INIT            11
#define TH_COND_DESTROY         12
#define TH_COND_TIMEDWAIT       13
#define TH_KEYCREATE            14
#define TH_GETSPECIFIC          15
#define TH_SETSPECIFIC          16
#define TH_SELF                 17

/* Number of dynamic thread functions */
#define TH_MAXIMUM              18

MI_EXT_DECL mint ifxOS_set_thrfunc(mint func, mulong (*funcptr)());

#endif  /* IFX_THREAD */

/* defines for SqlFreeMem, FreeType */
#define CURSOR_FREE 1
#define STRING_FREE 2
#define SQLDA_FREE  3
#define CONN_FREE   4
#define LOC_BUFFER_FREE 5

#ifndef USEMEMCPY
#ifndef NT
MI_EXT_DECL void (byfill)(void *s, int n, char c);
#endif /* !NT */
#endif /* !USEMEMCPY */

#ifdef NT_MI_SAPI
#ifndef NT_SERVER /*  byfill macro definition only for NT Blades */
#define byfill(s,n,c) memset(s,c,n)
#endif /* NT_SERVER */
#endif /* NT_MI_SAPI */

#ifndef USEMEMCPY
MI_EXT_DECL void (bycopy)(char *s1, char *s2, mint n);
#endif /* !USEMEMCPY */

#ifdef NT /* We need this declaration on NT to export it */
MI_EXT_DECL void (bycopy)(char *s1, char *s2, mint n);
#endif /*NT */

#ifdef USEMEMCPY
#ifndef byfill
#define byfill(s, n, c)         memset(s, c, n)
#endif /* byfill */
#endif /* USEMEMCPY */

MI_EXT_DECL mlong ifx_get_row_xid(ifx_collection_t *collp, mint *colnum);
MI_EXT_DECL char *ifx_get_row_extended_name(ifx_collection_t *collp);
MI_EXT_DECL mint ifx_checkAPI(mint libver, mint libid);
MI_EXT_DECL mint bycmpr(char *st1, char *st2, mint count);
MI_EXT_DECL mint byleng(char *beg, mint cnt);
MI_EXT_DECL void ldchar(char *from, mint count, char *to);

MI_EXT_DECL void rdownshift(char *s);
MI_EXT_DECL void rupshift(char *s);
#ifndef USE_STRFUNS
MI_EXT_DECL void stcat(char *src, char *dst);
MI_EXT_DECL void stcopy(char *src, char *dst);
MI_EXT_DECL mint stleng(char *src);
#endif /* !USE_STRFUNS */
MI_EXT_DECL mint stcmpr(char *s1, char *s2);
MI_EXT_DECL void stchar(char *from, char *to, mint count);

MI_EXT_DECL mint rstoi(char *s, mint *val);

MI_EXT_DECL mint rdatestr(int4 jdate, char *str);
MI_EXT_DECL mint rdayofweek(int4 date);
MI_EXT_DECL mint rdefmtdate(int4 *pdate, char *fmtstring, char *input);
MI_EXT_DECL mint ifx_defmtdate(int4 *pdate, char *fmtstring, char *input, char db_century);
MI_EXT_DECL mint rfmtdate(int4 date, char *fmtstring, char *result);
MI_EXT_DECL mint rfmtdec(struct decimal *dec, char *format, char *outbuf);
MI_EXT_DECL mint rfmtdouble(double dvalue, char *format, char *outbuf);
MI_EXT_DECL mint rfmtlong(int4 lvalue, char *format, char *outbuf);
MI_EXT_DECL mint rgetmsg(mint msgnum, char *s, mint maxsize);
MI_EXT_DECL mint rgetlmsg(int4 msgnum, char *s, mint maxsize, mint *msg_length);
MI_EXT_DECL mint risnull(mint vtype, char *pcvar);
MI_EXT_DECL mint rjulmdy(int4 jdate, int2 mdy[3]);
MI_EXT_DECL mint rleapyear(mint year);
MI_EXT_DECL mint rmdyjul(int2 mdy[3], int4 *jdate);
MI_EXT_DECL mint rsetnull(mint vtype, char *pcvar);
MI_EXT_DECL mint rstod(char *str, double *val);
MI_EXT_DECL mint rstol(char *s, mlong *val);
MI_EXT_DECL mint rstrdate(char *str, int4 *jdate);
MI_EXT_DECL mint ifx_strdate(char *str, int4 *jdate, char db_century);
MI_EXT_DECL void rtoday(int4 *today);

#if MI_PTR_SIZE == 64  /* 64-bit pointer */
MI_EXT_DECL mintptr rtypalign(mintptr offset, mint type);
#else /* 32-bit pointer */
MI_EXT_DECL mint rtypalign(mint offset, mint type);
#endif /* MI_PTR_SIZE == 64 */

MI_EXT_DECL mint rtypmsize(mint type, mint len);
MI_EXT_DECL char *rtypname(mint type);
MI_EXT_DECL mint rtypwidth(mint type, mint len);

MI_EXT_DECL mint ifx_int8cmp(ifx_int8_t *op1, ifx_int8_t *op2);
MI_EXT_DECL mint ifx_int8cvlong(int4 lng, ifx_int8_t *int8p);
MI_EXT_DECL mint ifx_int8tolong(ifx_int8_t *int8p, int4 *lngp);
MI_EXT_DECL mint ifx_int8toint4(ifx_int8_t *int8p, int4 *lngp);
MI_EXT_DECL mint ifx_int8cvint(mint in, ifx_int8_t *int8p);
MI_EXT_DECL mint ifx_int8toint(ifx_int8_t *int8p, mint *intp);
MI_EXT_DECL mint ifx_int8toint2(ifx_int8_t *int8p, int2 *intp);
MI_EXT_DECL mint ifx_int8cvasc(char *cp, mint len, ifx_int8_t *int8p);
MI_EXT_DECL mint ifx_int8toasc(ifx_int8_t *int8p, char *cp, mint len);
MI_EXT_DECL mint ifx_int8cvdec(dec_t *decp, ifx_int8_t *int8p);
MI_EXT_DECL mint ifx_int8todec(ifx_int8_t *int8p, dec_t *decp);
MI_EXT_DECL mint ifx_int8cvdbl(double dbl, ifx_int8_t *int8p);
MI_EXT_DECL mint ifx_int8todbl(ifx_int8_t *int8p, double *dblp);
MI_EXT_DECL mint ifx_int8cvflt(double flt, ifx_int8_t *int8p);
MI_EXT_DECL mint ifx_int8toflt(ifx_int8_t *int8p, float *fltp);
MI_EXT_DECL mint deccvint8(ifx_int8_t *int8p, dec_t *decp);
MI_EXT_DECL mint ifx_int8sub(ifx_int8_t *int8op1, ifx_int8_t *int8op2, ifx_int8_t *int8result);
MI_EXT_DECL mint ifx_int8add(ifx_int8_t *int8op1, ifx_int8_t *int8op2, ifx_int8_t *int8result);
MI_EXT_DECL mint ifx_int8mul(ifx_int8_t *int8op1, ifx_int8_t *int8op2, ifx_int8_t *int8result);
MI_EXT_DECL mint ifx_int8div(ifx_int8_t *int8op1, ifx_int8_t *int8op2, ifx_int8_t *int8result);
MI_EXT_DECL void ifx_int8copy(ifx_int8_t *sint8p, ifx_int8_t *dint8p);
#ifndef NOBIGINT
MI_EXT_DECL mint biginttoint2(const bigint bigintv, int2 *int2p);

MI_EXT_DECL mint bigintcvint2(const int2 int2v, bigint *bigintp);

MI_EXT_DECL mint biginttoint4(const bigint bigintv, int4 *int4p);

MI_EXT_DECL mint bigintcvint4(const int4 int4v, bigint *bigintp);

MI_EXT_DECL mint biginttoasc(const bigint bigintv, char *cp, mint len, mint base);

MI_EXT_DECL mint bigintcvasc(const char *cp, mint len, bigint *bigintp);

MI_EXT_DECL mint bigintcvdec(const dec_t *decp, bigint *bigintp);

MI_EXT_DECL mint biginttodec(const bigint bigintv, dec_t *decp);

MI_EXT_DECL mint biginttodbl(const bigint bigintv, double *dbl);

MI_EXT_DECL mint bigintcvdbl(const double dbl, bigint *bigintp);

MI_EXT_DECL mint biginttoflt(const bigint bigintv, float *fltp);

MI_EXT_DECL mint bigintcvflt(const double dbl, bigint *bigintp);

MI_EXT_DECL mint bigintcvifx_int8(const ifx_int8_t *int8p, bigint  *bigintp);

MI_EXT_DECL void biginttoifx_int8(const bigint bigintv, ifx_int8_t *int8p);

MI_EXT_DECL void ifx_getbigserial(bigint *bigintp);
#endif /* NOBIGINT */
MI_EXT_DECL void ifx_getserial8(ifx_int8_t *int8p);

MI_EXT_DECL 	mint sqlbreak(void);

MI_EXT_DECL 	char *ifx_getcur_conn_name(void);
MI_EXT_DECL 	char *ifx_getcur_dbenv(void);
MI_EXT_DECL 	mint sqldetach(void);
MI_EXT_DECL     mint sqldone(void);
MI_EXT_DECL 	mint sqlexit(void);
MI_EXT_DECL 	mint sqlstart(void);
MI_EXT_DECL void sqlsignal(mint sigvalue,
                    void (*ldv)(void),
                    mint mode);
MI_EXT_DECL mint sqlbreakcallback(int4 timeout,
		     void(*)(mint));
MI_EXT_DECL mint sqlbreakcallback_withparams(int4 timeout,
            void(*)(mint, void *), void *);
/* PAM callback function */
MI_EXT_DECL mint ifx_pam_callback(mint (*callbackfunc_ptr)(char *challenge,
                                             char *response, mint msg_style));

MI_EXT_DECL mint ifx_cl_dealloc(ifx_collection_t **collection);
MI_EXT_DECL mint ifx_xactevent(void *);
MI_EXT_DECL mint ifx_getserowner(char *serowner);
MI_EXT_DECL mint ifx_isius(void);
MI_EXT_DECL char * ifx_get_msg_param(void);

/*
 * Set of ifx_var_* functions for Fixed and Var Binary host vars.
 */
MI_EXT_DECL mint ifx_var_flag(void **variable, int2 alloc_flag);
MI_EXT_DECL mint ifx_var_alloc(void **variable, int4 size);
MI_EXT_DECL mint ifx_var_dealloc(void **variable);
MI_EXT_DECL mint ifx_var_freevar(void **variable);
MI_EXT_DECL mint ifx_var_setdata(void **variable, char *data, int4 size);
MI_EXT_DECL mint ifx_var_isnull(void **variable);
MI_EXT_DECL mint ifx_var_setnull(void **variable, mint flag);
MI_EXT_DECL mint ifx_var_setlen(void **variable, int4 size);
MI_EXT_DECL void *ifx_var_getdata(void **variable);
MI_EXT_DECL mint ifx_var_init(void **variable);
MI_EXT_DECL mint ifx_var_getlen(void **variable);
MI_EXT_DECL mint ifx_lvar_alloc(mint alloc);

/*
 * Set of ifx_lo_* accessors for opaque data types:
 *	- ifx_lo_create_spec_t
 *	- ifx_lo_stat_t
 *
 * See also: locator.h for description of possible values for arguments
 */

/* smartblob create spec SET accessors: */
MI_EXT_DECL mint ifx_lo_specset_flags(ifx_lo_create_spec_t *cspec, mint flags);
MI_EXT_DECL mint ifx_lo_specset_def_open_flags(ifx_lo_create_spec_t *cspec,
                                              mint def_open_flags);
MI_EXT_DECL mint ifx_lo_specset_estbytes(ifx_lo_create_spec_t *cspec,
				    ifx_int8_t *size);
MI_EXT_DECL mint ifx_lo_specset_maxbytes(ifx_lo_create_spec_t *cspec,
				    ifx_int8_t *size);
MI_EXT_DECL mint ifx_lo_specset_extsz(ifx_lo_create_spec_t *cspec, mint n);
MI_EXT_DECL mint ifx_lo_specset_sbspace(ifx_lo_create_spec_t *cspec, const char *str);

/* smartblob create spec GET accessors: */
MI_EXT_DECL mint ifx_lo_specget_flags(ifx_lo_create_spec_t *cspec);
MI_EXT_DECL mint ifx_lo_specget_def_open_flags(ifx_lo_create_spec_t *cspec);
MI_EXT_DECL mint ifx_lo_specget_estbytes(ifx_lo_create_spec_t *cspec,
					    ifx_int8_t *size);
MI_EXT_DECL mint ifx_lo_specget_maxbytes(ifx_lo_create_spec_t *cspec,
					    ifx_int8_t *size);
MI_EXT_DECL mint ifx_lo_specget_extsz(ifx_lo_create_spec_t *cspec);
MI_EXT_DECL mint ifx_lo_specget_sbspace(ifx_lo_create_spec_t *cspec,
				    char *str,
				    mint len);

/* smartblob stat GET accessors: */
MI_EXT_DECL mint ifx_lo_stat_size(ifx_lo_stat_t *lostat, ifx_int8_t *size);
MI_EXT_DECL mint ifx_lo_stat_uid(ifx_lo_stat_t *lostat);
MI_EXT_DECL mint ifx_lo_stat_atime(ifx_lo_stat_t *lostat);
MI_EXT_DECL mint ifx_lo_stat_mtime_sec(ifx_lo_stat_t *lostat);
MI_EXT_DECL mint ifx_lo_stat_mtime_usec(ifx_lo_stat_t *lostat);
MI_EXT_DECL mint ifx_lo_stat_ctime(ifx_lo_stat_t *lostat);
MI_EXT_DECL mint ifx_lo_stat_refcnt(ifx_lo_stat_t *lostat);
MI_EXT_DECL ifx_lo_create_spec_t *ifx_lo_stat_cspec(ifx_lo_stat_t *lostat);

/* smartblob spec and stat destructors: */
MI_EXT_DECL mint ifx_lo_spec_free(ifx_lo_create_spec_t *cspec);
MI_EXT_DECL mint ifx_lo_stat_free(ifx_lo_stat_t *lostat);
/*
 * Set of ifx_lo_ functions for support of Large Objects
 */
MI_EXT_DECL mint ifx_lo_col_info(char *column_name, ifx_lo_create_spec_t *create_spec);
MI_EXT_DECL mint ifx_lo_def_create_spec(ifx_lo_create_spec_t **cspec);
MI_EXT_DECL mint ifx_lo_create(ifx_lo_create_spec_t *create_spec, mint flags,
	ifx_lo_t *loptr, mint *error);
MI_EXT_DECL mint ifx_lo_open(ifx_lo_t *loptr, mint flags, mint *error);
MI_EXT_DECL mint ifx_lo_close(mint lofd);
MI_EXT_DECL mint ifx_lo_seek(mint lofd, ifx_int8_t *off, mint whence,
	ifx_int8_t *seek_pos);
MI_EXT_DECL mint ifx_lo_lock(mint lofd, ifx_int8_t *off, mint whence,
        ifx_int8_t *range, mint lockmode);
MI_EXT_DECL mint ifx_lo_unlock(mint lofd, ifx_int8_t *off, mint whence,
	ifx_int8_t *range);
MI_EXT_DECL mint ifx_lo_tell(mint lofd, ifx_int8_t *seek_pos);
MI_EXT_DECL mint ifx_lo_truncate(mint lofd, ifx_int8_t *off);
MI_EXT_DECL mint ifx_lo_filename(ifx_lo_t *loptr, char *fname,
	char *result, mint result_buffer_nbytes);
MI_EXT_DECL mint ifx_lo_alter(ifx_lo_t *loptr, ifx_lo_create_spec_t *create_spec);
MI_EXT_DECL mint ifx_lo_stat(mint lofd, ifx_lo_stat_t **lostat);
MI_EXT_DECL mint ifx_lo_read(mint lofd, char *buf, mint nbytes, mint *error);
MI_EXT_DECL mint ifx_lo_readwithseek(mint lofd, char *buf, mint nbytes,
	ifx_int8_t *off, mint whence, mint *error);
MI_EXT_DECL mint ifx_lo_write(mint lofd, char *buf, mint nbytes, mint *error);
MI_EXT_DECL mint ifx_lo_writewithseek(mint lofd, char *buf, mint nbytes,
	ifx_int8_t *off, mint whence, mint *error);
MI_EXT_DECL mint ifx_lo_copy_to_lo(mint lofd, char *fname, mint flags);
MI_EXT_DECL mint ifx_lo_copy_to_file(ifx_lo_t *loptr, char *fname, mint flags,
	char *result);
MI_EXT_DECL mint ifx_lo_to_buffer(ifx_lo_t  *loptr, mint size, char **buffer,
                                 mint  *error);
MI_EXT_DECL mint ifx_lo_from_buffer(ifx_lo_t *loptr, mint size, char *buffer,
                                   mint  *error);
MI_EXT_DECL mint ifx_lo_release(ifx_lo_t *loptr);
MI_EXT_DECL int4 ifx_lo_numbytes_written(void);
MI_EXT_DECL void * ifx_alloc_conn_user(const char *username, const char *passwd);
MI_EXT_DECL void ifx_free_conn_user(ifx_conn_t **);
MI_EXT_DECL void * ifx_alloc_conn_cred(void *);
MI_EXT_DECL void ifx_free_conn_cred(ifx_conn_t **);
MI_EXT_DECL mint ifx_cl_card(ifx_collection_t *colt, mint *isnull);

#ifdef _REENTRANT
MI_EXT_DECL int4 * ifx_sqlcode(void);
MI_EXT_DECL char * ifx_sqlstate(void);
MI_EXT_DECL struct sqlca_s *ifx_sqlca(void);
#endif /* _REENTRANT */

/*
 * This global variable FetBufSize (Fetch Buffer Size) will allow
 * the application to over-ride cursor->_SQCtbsize which dictates the
 * size of the buffer that holds the data that the BE will fill.
 */
extern int2 FetBufSize;

/* for 2GB Fetch buffer size support */
extern int4 BigFetBufSize;

/* FetArrSize is used to indicate the array size in in Array Fetch */
extern int2 FetArrSize;

/* OptMsg is used in conjunction with env. var. OPTMSG to activate OPTMSG */
extern int2 OptMsg;

#ifdef __cplusplus
}
#endif

#endif	/* _SQLHDR */
