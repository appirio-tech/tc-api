/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1997, 2008. All rights reserved.
 *
 *  Title:       collct.h
 *  Description: Definitions for collection types
 *
 ***************************************************************************
 */

#ifndef _COLLECTION_H
#define _COLLECTION_H

#include "ifxtypes.h"

/* special position value IFX_COLL_USE_CURSOR_POSITION */
#define IFX_COLL_USE_CURSOR_POSITION	-5999

/* size of the identifier. SHOULD BE SAME AS IN THE SERVER. */
#ifndef IDENTSIZE
#define	IDENTSIZE	128
#endif	/* IDENTSIZE */

typedef enum chlog_type
{
    CH_INSERT,
    CH_UPDATE,
    CH_DELETE,
    CH_CLDATA
}   chlog_type_t;

/* this structure is used when a DML is performed on a collection to store
 * the change.
 */
typedef struct ifx_changelog_struct
    {
    mint		ch_rownum;	/* row number */
    chlog_type_t 	ch_modtype;	/* modification type */
    char 	        *ch_newrow;	/* pointer to new row */
    mint                ch_newrowlen;   /* new row length */
    mint                ch_flag;        /* is changelog associated with data?*/
    struct ifx_changelog_struct *ch_next; /* next pointer */
    mint                ch_maxrowlen;   /* actual allocated size */
    }ifx_changelog_t;

typedef struct _ifx_collection_struct ifx_collection_t;

/* this is the structure every one registers with a collection manager */
typedef struct ifx_coll_cur_struct ifx_coll_cur_t;
struct ifx_coll_cur_struct
    {
    mint		cur_position;	/* position number */
    char 		*cur_elem;	/* pointer to the current row in
					** the data part
					*/
    char		*cur_row;	/* current row to be updated */
					/* client collections need this */
    ifx_collection_t	*cur_coll;	/* current collection */
    ifx_changelog_t	*cur_changelog;	/* current change log entry */
    int2		cur_flags; 	/* for internal use only  */
    ifx_coll_cur_t	*cur_next; /* for use of collection manager */
    mint			cur_run;	/* for internal use only */
    };

/* this is the structure that maps to one row of SYSATTR system table */
typedef	struct	ifx_typerow_struct
    {
    int2		seqno;
    int2		level_no;
    int2		parent_no;
    int2		fieldnmlen;
#ifdef ALLOW_CPP
    char		fieldname[IDENTSIZE + 1];
#else
    char		fieldname[IDENTSIZE];
#endif
    int2		field_no;
    int2		type;
    int2		length;
    int4                xid;
    int2                flags;
    int2                xtype_nm_len;
#ifdef ALLOW_CPP
    char                xtype_name[IDENTSIZE + 1];
#else
    char                xtype_name[IDENTSIZE];
#endif
    int2                xtype_owner_len;
#ifdef ALLOW_CPP
    char                xtype_owner_name[IDENTSIZE + 1];
#else
    char                xtype_owner_name[IDENTSIZE];
#endif
    int2                alignment;
    int4                sourcetype;
    }ifx_typerow_t;

/* this is the structure that holds the type information for a collection */
typedef struct ifx_cltypeinfo_struct
    {
    /*
     * clt_datumbuf, used to return datums, keep 1st to align.
     */

    double		clt_datumbuf[20];

    /* full type info for udt/collections this is a ddxtype_t */
    void		*clt_ddxtype;
    int4		clt_typeid;	/* type id */
    int2 		clt_namelen;	/* length of the type name */
#ifdef ALLOW_CPP
    char		clt_typename[IDENTSIZE + 1 ]; /* name of the type */
#else
    char		clt_typename[IDENTSIZE]; /* name of the type */
#endif
    int2 		clt_numrows;	/* number of rows */

    /* THIS LINE HAS TO BE LAST DO NOT ADD ANYTHING AFTER IT */
    ifx_typerow_t	clt_rows[1];	/* to make this struct contiguous */
    } ifx_cltypeinfo_t;

/*
 * Since collections are of variable size, each tuple can be of variable
 * size. This structure holds the size of each tuple in the tuple buffer.
 */
typedef struct ifx_cl_tupinfo
    {
    mint cti_current;                    /* current tuple */
    mint cti_totalsize;                  /* total tuple size */
    mint cti_maxsize;                    /* maximum array size */
    mint cti_tuplesize[1];               /* array containing each tuple size
*/
    } ifx_cl_tupinfo_t;

/*
 * This can be extended later to support other kinds iterator collections
 */
typedef struct ifx_coll_iter
    {
    void *subq_expr;
    } ifx_coll_iter_t;

/*
 * note: whenever members are added/changed in ifx_collection_struct
 * remember to update ifx_coll_copy().
 */

struct _ifx_collection_struct
    {
    mint		cl_magic;	/* see CL_MAGIC */
    mint                cl_handle;     /* 0 if collection is
					 * procesed on client
					 * !0 if processed on server
				         */

    ifx_coll_cur_t	*cl_curs;	/* cursors specific data for all cursors
					** declared on this collection.
					*/
    mint		cl_len;		/* length of the collection. This at
					** any time will maintain the total
					** length required to hold
					** the collection
					*/
    mint		cl_cardinality;	/* #of elements in the collection */
    int2 		cl_isfixed;	/* 1 if elements are fixed size
					** 0 otherwise.
					*/
    mint		cl_elsize;	/* size of each element,if fixed size.
					** otherwise, size of the fixed part
					*/
    mint		cl_flags;	/* flags */
    ifx_changelog_t 	*cl_lastlog;   /* Last log entry;to make append easy */
    ifx_changelog_t	*cl_log;         /* list of change log structures */
    union
	{
	char		*cldata;        /* actual collection column as
					 * retrieved from RSAM */
	ifx_coll_iter_t *cliter;        /* opaque structure for iterator
					 * collections */
	} cl_val;

  /* NOTE: cl_hashvalue must be an unsigned 32-bit integer. */
  /* on 16-bit platform, use unsigned long for cl_hashvalue */
    muint       	cl_hashvalue;   /* hash value */
    mint		cl_datalen;	/* length of the data. This is the
					** the length of the data field when
					** the collection_t was first built
					*/
    int2 	 	cl_typed;	/* 1 if type defined explicitly */
    mint		cl_typelen;	/* length of below pointer */
    ifx_cltypeinfo_t 	*cl_svr_typeinfo;/* Type information provided
					** by the server.
					*/
    ifx_cltypeinfo_t 	*cl_typeinfo;	/* Type information returned by
					** the server. or defined by user
					*/
    struct heap		*cl_heap;       /* indicates the heap from which cldata
					   and chlogs are allocated when the
					   collection is initially created.
					   note: in some cases, cldata may be
					   allocated from outside the collctn */
    ifx_changelog_t   	*cl_freelst;    /* sorted free list of change logs */
					/* it may be more efficient to use a
					   binary search tree for the freelst */
    ifx_changelog_t   	*cl_data_hdr;   /* info about the cl_data in use */
    };

/*
 * defines for union between existing collections and subquery
 * collections.
 */

#define cl_data cl_val.cldata
#define cl_iter cl_val.cliter

/*
 * This structure is used to record the names of the columns
 * in the projection list of an SQL statement.
 */
typedef struct ifx_namelist{
        char col_name[150];
        }ifx_namelist_t;

/*
 * This structure is used to insert data into the collection variable
 */
typedef struct ifx_literal {
    char *litaddr;                     /* address of host variable */
    int2 littype;                      /* host type */
    int2 litlen;                       /* length of field type */
    int2 litqual;                      /* qualifier for DATETIME/INTERVAL */
    int2 literal;		       /* 1 if literal string 0 otherwise */
    }ifx_literal_t;

/*
   used within value_t to store a tree of value_t.
   For example,
   the value_t tree for SET{1,2,3} looks like the following:

   value_t(SET)
       --(ct_child)--> value_t(1)
                         --(v_next)--> value_t(2)
                                          --(v_next)--> value_t(3)

*/
typedef struct
{
   ifx_collection_t  ct_coll;       /* collection_t for collection/ROW */
   struct value   *ct_child;      /* 1st element in the collection/ROW */
} ifx_collval_t;

#endif /* _COLLECTION_H */
