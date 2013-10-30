/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1997, 2008. All rights reserved.
 *
 *  Title:       value.h
 *  Description: Value header include file; multi-purpose value struct
 *
 ***************************************************************************
 */

#ifndef _VALUE
#define _VALUE

#include "ifxtypes.h"

#include "decimal.h"
#include "locator.h"
#include "blob.h"
#include "int8.h"
#include "collct.h"
#include "datetime.h"
#ifdef TURBO
#include "rsam.h"
#endif

/* !null && blob type */
#define ISBLOBVALUE(val)	((val).v_ind != -1 && ISBLOBTYPE((val).v_type))

#define MAXADDR		14
#define NULL_FLAG       0x80     /* This flag should define that user used NULL
                                  * in sql statement.
                                  */

#ifdef TURBO
/* move here from catalog.h */
typedef struct sqcolumn_t
    {
    column_t		*sqcl_columnts;
    int2		sqcl_ncols;
    int2		sqcl_length;
    int2		sqcl_start;
    int2		sqcl_align;
    struct sqcolumn_t	*sqcl_child;
    struct sqcolumn_t	*sqcl_next;
    } sqcolumn_t;

#define ROW_COMMON_HDR \
        /* common fields shared by row_value_t and tab_t */ \
        mint    magic_number;   /* keep the user honest */ \
        int4    td_rowflags;    /* flags for row */ \
        struct ddtabdesc *td_ddinfo;     /* pointer to DD info */ \
        struct coldesc   *td_cols;       /* columns in row */ \
        int2   td_ncols;       /* number of columns */ \
        int2   td_rowsize;     /* row size in bytes */ \
        int4    td_rowtype;     /* row type */ \
        char    *td_row;        /* pointer to row buffer */ \
        uint4   td_isrecnum;    /* rowid */ \
        int4    td_fragid;      /* fragid */ \
        struct ddxtdtype *td_typedesc; /* row type desc */ \
        struct value *td_values;     /* used by mi_value to return col info */ \
        struct tabdesc *td_child; /* row descs for subtypes or
				     tab descs for subtables*/ \
        int2   td_thsubscript; /* index into thread's table buffer array */
#else /* TURBO */
#define ROW_COMMON_HDR \
	void *dummy;	/* dummy place holder */
#endif /* TURBO */

typedef struct rowvaluet row_desc_t;
typedef struct rowvaluet row_value_t;

/* flags for td_rowflags */
#define TD_ROWREF       0x00000001L     /* to be REFed, keep fragid and rowid */
#define TD_ROWTYPE      0x00000002L     /* row is typed */
#define TD_ROWLOCAL     0x00000004L     /* row data is in td_row */
#define TD_ROWDYNA      0x00000008L     /* row value in sqt_dtab */
#define TD_ROWSAVED     0x00000010L     /* row in save set */
#define TD_ROWCONV      0x00000020L     /* binary or ascii conv. required */
#define TD_ROWBINARY    0x00000040L     /* binary result requested */
#define TD_ROWCMDDUR    0x00000080L     /* Indicates that the row descriptor
                                         * is allocated in PER_COMMAND dur.
					 */

#define TD_ROWEXECDUR   0x00000100L     /* Indicates that the row descriptor
                                         * is allocated in PER_STTMT_EXEC dur.
					 */
#define TD_ROWPREPDUR   0x00000200L     /* row descriptor is PER_STMT_PREP */
#define TD_ROWS92DUR    0x00000400L     /* row descripto is PER_STMT_92    */

#define TD_ROWDESTROY   0x80000000      /* processing rowdestroy */

/* Macros for getting/setting rowdesc duration  If no flags are set it
 is PER_ROUTINE. PER_TRANSACTION is not handled (bug?)*/
#define GET_ROWDESC_DURATION(rowdesc)				\
 ((rowdesc)->td_rowflags & TD_ROWCMDDUR) ? PER_COMMAND :		\
 ((rowdesc)->td_rowflags & TD_ROWEXECDUR) ? PER_STMT_EXEC :		\
 ((rowdesc)->td_rowflags & TD_ROWPREPDUR) ? PER_STMT_PREP :		\
 ((rowdesc)->td_rowflags & TD_ROWS92DUR) ? PER_STMT_92 :		\
 PER_ROUTINE

#define SET_ROWDESC_DURATION(rowdesc,duration)				\
 do {									\
     (rowdesc)->td_rowflags &= 						\
      ~(TD_ROWCMDDUR|TD_ROWEXECDUR|TD_ROWPREPDUR|TD_ROWS92DUR);	       	\
     switch (duration)							\
       {								\
        case PER_COMMAND    :						\
	    (rowdesc)->td_rowflags |= TD_ROWCMDDUR;			\
	     break;							\
        case PER_STMT_EXEC  :						\
	    (rowdesc)->td_rowflags |= TD_ROWEXECDUR;		     	\
	     break;							\
        case PER_STMT_PREP  :						\
	    (rowdesc)->td_rowflags |= TD_ROWPREPDUR;			\
	     break;							\
       case PER_STMT_92    :						\
	   (rowdesc)->td_rowflags |= TD_ROWS92DUR;			\
	     break;							\
       default		   :						\
	     break;							\
       }								\
     } while(0)

struct rowvaluet
    {
    ROW_COMMON_HDR
#ifdef TURBO
    sqcolumn_t *ct_columnts;  /* array of column_t's for rsrowcompress.
                               * moved from ct_desc to rowvaluet since,
                               * info contained in ct_desc is specific
                               * to the supertype.
                               */
    void * td_jcache;       /* used in jvti to cache java objects */
    void * td_jtd;          /* used in jvti for set read/write */
#endif
    };

#ifdef TURBO
#define	cd_columnts	cd_rowdesc->ct_columnts
#endif

/* flag to switch_rowtype() on whether to create the rowdesc
 * and how to link it with existing cd_rowdesc chain
 */
#define R_NCREATE  0  /* Flag error if rowdesc does not exist in
                       * td_child list
                       */
#define R_LTAIL    1  /* If created now, link to tail of list */
#define R_LHEAD    2  /* Put rowdesc at the head of the list */

#define VCHAR_COMMON_HDR \
    char *vcp;		/* data start 			*/ \
    int4 vlen;		/* data length 			*/ \
    int2 vflgs;	/* flags - see below 		*/ \
    int2 valign;	/* UDT (SQLROW, SQLUDTFIXED/VAR) alignment */

/*
 * col_t cd_coll_desc cache of cl_*typeinfo
 * and cl_data for val{load/store/ldout}
 */
typedef struct _coll_desc
    {
    ifx_cltypeinfo_t	*cld_typeinfo;	/* collection cl_svr_typeinfo */
    int4		cld_typesize;	/* size of typeinfo	*/
    } coll_desc_t;

/*
** vchar_t is shared by the value_t and udt_t
*/

typedef struct _vchar
    {
    VCHAR_COMMON_HDR
    int4 vidx;		/* string+UDT: data block size 	*/
    int4 vsstart;	/* substring start for 4GL-RDS 	*/
    int4 vsend;		/* substring end for 4GL-RDS 	*/
    int4 fixedLen;	/* Length of fixedStr		*/
#if MI_PTR_SIZE == 64
    mulong vbyvaluedata;      /* data store for byvalue UDTs for 64-bit */
#else
    int4 vbyvaluedata;        /* data store for byvalue UDTs  */
#endif
    char *fixedStr;	/* Fixed str for FSSEARCH	*/
    unsigned char *shiftTbl;/* Shift table for FSSEARCH	*/
    } vchar_t;

typedef struct value
    {
    short v_type;
    short v_ind;		/* null indicator		*/
    int4  v_xid;
    short v_prec;		/* decimal precision		*/
    union			/* data value			*/
	{			/*  depending on v_type		*/
	vchar_t vchar;		/* char and udts		*/
	mint vint;		/* SQLSMINT			*/
	int4 vlng;		/* SQLINT			*/
	ifx_int8_t vint8;	/* SQLINT8			*/
#ifndef NOBIGINT
        bigint vbigint;         /* SQLBIGINT                    */
#define v_bigint        v_val.vbigint
#endif
	float vflo;		/* SQLSMFLOAT			*/
	double vdub;		/* SQLFLOAT			*/
	struct
	    {
	    dec_t vdec;		/* SQLDECIMAL			*/
	    union
		{
		dtime_t vdatetime;
		intrvl_t vintrvl;
		} vtme;
	    } vdecstruct;
	short vaddr[MAXADDR];	/* 4GL address modifiers	*/
	tblob_t vtblob;		/* BLOB as stored in tuple	*/
	ifx_loc_t *vlocator;	/* blobs locator 		*/
	ifx_collection_t vcollection;	          /* collection */
        ifx_collval_t vtree;  /* value_t tree of collection/ROW */
	struct
	    {
	    VCHAR_COMMON_HDR
	    row_value_t vrow;	/* row descriptor and data */
	    } vrowstruct;	/* for row values */
	} v_val;
    } value_t;

#define CASTVALP	(struct value *)

/*
 * defines to make the union transparent
 */

#define v_charp		v_val.vchar.vcp
#define v_index		v_val.vchar.vidx
#define v_align		v_val.vchar.valign
#define v_len		v_val.vchar.vlen
#define v_flags		v_val.vchar.vflgs
#define v_sstart	v_val.vchar.vsstart
#define v_send		v_val.vchar.vsend
#define v_fixedLen	v_val.vchar.fixedLen
#define v_fixedStr	v_val.vchar.fixedStr
#define v_shiftTbl	v_val.vchar.shiftTbl
#define v_byvaluedata	v_val.vchar.vbyvaluedata

#define v_int		v_val.vint
#define v_long		v_val.vlng
#define v_int8	        v_val.vint8
#define v_float		v_val.vflo
#define v_double	v_val.vdub
#define v_decimal	v_val.vdecstruct.vdec
#define v_idesc		v_ind
#define v_naddr		v_prec
#define v_addr		v_val.vaddr

#define v_datetime	v_val.vdecstruct.vtme.vdatetime
#define v_intrvl	v_val.vdecstruct.vtme.vintrvl

#define v_tblob		v_val.vtblob
#define v_blocator	v_val.vlocator

#define v_coll		v_val.vcollection
/* tchan : add macro for items in vtree */
#define v_child         v_val.vtree.ct_child
#define v_vtcoll        v_val.vtree.ct_coll

#define v_row		v_val.vrowstruct.vrow

/*
 * flags for v_flags (For FE programs)
 * used by the 4GL Debugger and Pcode Run Time
 */
#define	V_BREAK		0x1		/* break when variable is updated */
#define	V_SUBSTR	0x2		/* char value is a substring */
#define	V_QUOTED	0x4		/* char value is from quoted string */
#define V_ASCII0	0x8		/* ascii 0 value */
/*
 * flags for v_flags (For BE programs)
 * used for FS_[N]SEARCH patterns
 */
#define	V_FSANSIESCWARN 0x1 /* Fixed string contained a non-ANSI escape */
                             /* sequence in an non-ANSI database */
#define V_NOHASH	0x2 /* UDT not hashable */
#define V_FIXED		0x4 /* UDT is fixed length (SQLROW type only) */
#define V_BYVAL		0x8 /* UDT is by value */
#define V_QUAL          0x10 /* v_char contains qualifier
			      * (used with char type on client,
			      * and SQLUDTVAR (XID_LVARCHAR) type on server)
			      */
#define V_ENCRYPTED	0x100	/* encrypted by ENCRYPT_AES */
#define V_MDED		0x200	/* Degisted by ENCRYPT_AES */

/* This flag is used in rvaldata(), but mainly used by the FE to null
 * terminate the SQLCHAR data rather than blank padding it as for normal
 * SQLCHAR column.
 */
#define V_NTERM		0x20	/* null terminated the SQLCHAR data */

#define FRCBOOL(x)	if (x->v_ind >= 0)\
			    switch (x->v_type) \
				{\
				case SQLSMINT: break;\
				case SQLDATE:\
				case SQLSERIAL:\
				case SQLINT: if (x->v_long != 0)\
						{\
						SET_BOOLOP_RESULT(x, 1);\
						}\
					     else\
						SET_BOOLOP_RESULT(x, 0);\
					     SET_BOOLOP_TYPE(x); \
					     break;\
			        default:     cvtosmint(x);\
					     break;\
				} \
			else \
			    { \
			    SET_BOOLOP_RESULT(x, 0);\
			    SET_BOOLOP_TYPE(x); \
			    }

#define init_int_value(valptr) \
    (valptr)->v_type = SQLSMINT; \
    (valptr)->v_ind = 0; \
    (valptr)->v_prec = 0; \
    (valptr)->v_int = 0;

#define ISLVARCHARTYPE(valp) \
        (\
        ISUDTVARTYPE((valp)->v_type) &&\
        (valp)->v_xid == XID_LVARCHAR\
        )

#define ISBOOLEANTYPE(valp) \
        (\
        ISUDTFIXEDTYPE((valp)->v_type) &&\
        (valp)->v_xid == XID_BOOLEAN\
        )

#ifdef TURBO  /* TURBO */
#define SET_NULL_VALUE(valp, type, xid) \
	{ \
            short typ = (type); \
            (valp)->v_type = typ; \
	    (valp)->v_ind  = -1; \
            (valp)->v_xid  = (xid); \
            (valp)->v_prec = 0; \
	    if (ISCOLLTYPE(typ)) \
		byfill(&((valp)->v_val), sizeof((valp)->v_val), 0); \
	}
#endif /* TURBO */

/*
 * macros for evaluating boolean expressions results.
 */

#ifdef TURBO  /* TURBO */

#define SET_BOOLOP_RESULT(valp, value) 	\
	{\
	(valp)->v_val.vchar.vcp = (char *) &((valp)->v_val.vchar.vbyvaluedata);\
	*((valp)->v_val.vchar.vcp) = (char) (value);\
        (valp)->v_len = 1;\
        (valp)->v_align = 1;\
	(valp)->v_flags = V_BYVAL; \
	}
#define SET_BOOLOP_TYPE(valp) 		\
	{\
	(valp)->v_type = SQLUDTFIXED;\
	(valp)->v_xid = XID_BOOLEAN;\
	}

/* Check for v_ind seperately if you want to find out if the boolean result
   is null. The following check for v_ind is here to prevent looking into
   an uninitialized vcp of a null boolean value.*/
#define BOOLOP_RESULT(val) 	((val.v_ind <0)? 0 : *((val).v_val.vchar.vcp))
#define BOOLOP_RESULTP(valp) 	((valp->v_ind<0)? 0: *((valp)->v_val.vchar.vcp))
#define IS_BOOLOP_TYPEP(valp) 		\
	(\
	ISUDTFIXEDTYPE((valp)->v_type) &&\
	(valp)->v_xid == XID_BOOLEAN\
	)
/* check for a valid boolean value  only 0 or 1 or valid values */
#define INVALID_BOOLEAN(inval)  (!(BOOLOP_RESULT(inval)==0||\
				   BOOLOP_RESULT(inval)==1))

extern void copy_value(value_t *fval, value_t *tval);

#else /* TURBO */

#define SET_BOOLOP_RESULT(valp, value) 	(valp)->v_int = value
#define SET_BOOLOP_TYPE(valp) 		(valp)->v_type = SQLSMINT
#define BOOLOP_RESULT(val) 		(val).v_int
#define BOOLOP_RESULTP(valp) 		(valp)->v_int
#define IS_BOOLOP_TYPEP(valp) 		(valp)->v_type == SQLSMINT

#define copy_value(fromP, toP) bycopy((char*)(fromP), (char *)(toP), \
				      sizeof(struct value));

#endif /* TURBO */

#endif  /* _VALUE */
