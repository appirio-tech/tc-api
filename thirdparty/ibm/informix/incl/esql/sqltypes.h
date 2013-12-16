/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 *
 * Copyright IBM Corporation 1985, 2012
 *
 *  Title:	  sqltypes.h
 *  Description:  type definition
 *
 ***************************************************************************
 */

#ifndef CCHARTYPE

#include "ifxtypes.h"

/***********************
 * ++++ CAUTION ++++
 * Any new type to be added to the following lists should not
 * have the following bit pattern (binary short):
 *
 *	xxxxx111xxxxxxxx
 *
 * where x can be either 0 or 1.
 *
 * This is due to the use of the bits as SQLNONULL, SQLHOST and SQLNETFLT
 * (see below).
 *
 * FAILURE TO DO SO WOULD RESULT IN POSSIBLE ERRORS DURING CONVERSIONS.
 *
 ***********************/

 /* C language types */

#define CCHARTYPE	100
#define CSHORTTYPE	101
#define CINTTYPE	102
#define CLONGTYPE	103
#define CFLOATTYPE	104
#define CDOUBLETYPE	105
#define CDECIMALTYPE	107
#define CFIXCHARTYPE	108
#define CSTRINGTYPE	109
#define CDATETYPE	110
#define CMONEYTYPE	111
#define CDTIMETYPE	112
#define CLOCATORTYPE    113
#define CVCHARTYPE	114
#define CINVTYPE	115
#define CFILETYPE	116
#define CINT8TYPE	117
#define CCOLLTYPE       118   
#define CLVCHARTYPE     119
#define CFIXBINTYPE     120
#define CVARBINTYPE     121
#define CBOOLTYPE       122
#define CROWTYPE        123
#define CLVCHARPTRTYPE  124
#define CBIGINTTYPE     125
#define CTYPEMAX	26

#define USERCOLL(x)	((x))

#define COLLMASK        0x007F  /* mask out CTYPEDCOLL or CCLIENTCOLL */
                                /* bit set for CCOLLTYPE or CROWTYPE */
#define ISCOLLECTIONVAR(n)  (((n) & COLLMASK) == CCOLLTYPE)
#define ISROWVAR(n)         (((n) & COLLMASK) == CROWTYPE)
#define ISCOLL_OR_ROWVAR(n)   ((ISCOLLECTIONVAR(n)) || (ISROWVAR(n)))
#define CCLIENTCOLL     SQLCLIENTCOLL /* client collection bit */
#define ISCLIENTCOLLECTION(n) (ISCOLLECTIONVAR(n) && ((n) & CCLIENTCOLL))
#define ISCLIENTCOMPLEX(n)    ((ISCLIENTCOLLECTION(n)) || (ISROWVAR(n)))

/* 
 * The following are for client side only. They are included here
 * because of the above related definitions.
 */
#define CTYPEDCOLL       0x0080  /* typed collection bit */
#define CTYPEDCOLLUNMASK 0xFF7F  /* unmask typed collection bit */
#define ISTYPEDCOLLECTION(n)  (ISCOLLECTIONVAR(n) && ((n) & CTYPEDCOLL))
#define ISTYPEDROW(n)         (ISROWVAR(n) && ((n) & CTYPEDCOLL))
#define ISTYPEDCOLL_OR_ROW(n)  ( (ISTYPEDCOLLECTION(n)) || (ISTYPEDROW(n)) )

/*
 * Define all possible database types
 *   include C-ISAM types here as well as in isam.h
 */

#define SQLCHAR		0
#define SQLSMINT	1
#define SQLINT		2
#define SQLFLOAT	3
#define SQLSMFLOAT	4
#define SQLDECIMAL	5
#define SQLSERIAL	6
#define SQLDATE		7
#define SQLMONEY	8
#define SQLNULL		9
#define SQLDTIME	10
#define SQLBYTES	11
#define SQLTEXT		12
#define SQLVCHAR	13
#define SQLINTERVAL	14
#define SQLNCHAR	15
#define SQLNVCHAR	16
#define SQLINT8		17
#define SQLSERIAL8	18
#define SQLSET          19
#define SQLMULTISET     20
#define SQLLIST         21
#define SQLROW          22
#define SQLCOLLECTION   23
#define SQLROWREF   	24
/*
 * Note: SQLXXX values from 25 through 39 are reserved to avoid collision
 *       with reserved PTXXX values in that same range. See p_types_t.h
 *
 * REFSER8: create tab with ref: referenced serial 8 rsam counter
 *	this is essentially a SERIAL8, but is an additional rsam counter
 *	this type only lives in the system catalogs and when read from
 *	disk is converted to SQLSERIAL8 with CD_REFSER8 set in ddcol_t 
 *      ddc_flags we must distinguish from SERIAL8 to allow both 
 *      counters in one tab
 */
#define SQLUDTVAR   	40
#define SQLUDTFIXED   	41
#define SQLREFSER8   	42

/* These types are used by FE, they are not real major types in BE */
#define SQLLVARCHAR     43
#define SQLSENDRECV     44
#define SQLBOOL         45
#define SQLIMPEXP       46
#define SQLIMPEXPBIN    47

/* This type is used by the UDR code to track default parameters,
   it is not a real major type in BE */
#define SQLUDRDEFAULT   48
#define SQLDBSENDRECV   49
#define SQLSRVSENDRECV  50
  
/* Type used by DESCRIBE INPUT stmt to indicate input parameters whose
   types cannot be determined by the server */
#define SQLUNKNOWN   	51

#define SQLINFXBIGINT   52 /* Changing to avoid collision with ODBC */
#define SQLBIGSERIAL    53

#define SQLMAXTYPES     54

#define SQLLABEL        SQLINT

#define SQLTYPE		0xFF	/* type mask		*/

#define SQLNONULL	0x0100	/* disallow nulls	*/
/* a bit to show that the value is from a host variable */
#define SQLHOST		0x0200	/* Value is from host var. */
#define SQLNETFLT	0x0400	/* float-to-decimal for networked backend */
#define SQLDISTINCT	0x0800	/* distinct bit		*/
#define SQLNAMED	0x1000	/* Named row type vs row type */
#define SQLDLVARCHAR    0x2000  /* Distinct of lvarchar */
#define SQLDBOOLEAN     0x4000  /* Distinct of boolean */
#define SQLCLIENTCOLL   0x8000  /* Collection is processed on client */

/* we are overloading SQLDBOOLEAN for use with row types */
#define SQLVARROWTYPE   0x4000  /* varlen row type */

/* We overload SQLNAMED for use with constructor type, this flag
 * distinguish constructor types from other UDT types.
 *
 * Please do not test this bit directly, use macro ISCSTTYPE() instead.
 */
#define SQLCSTTYPE	0x1000	/* constructor type flag */

#define TYPEIDMASK      (SQLTYPE | SQLDISTINCT | SQLNAMED | \
                         SQLDLVARCHAR | SQLDBOOLEAN )

#define SIZCHAR		1
#define SIZSMINT	2
#define SIZINT		4
#define SIZFLOAT	(sizeof(double))
#define SIZSMFLOAT	(sizeof(float))
#define SIZDECIMAL	17	/* decimal(32) */
#define SIZSERIAL	4
#define SIZDATE		4
#define SIZMONEY	17	/* decimal(32) */
#define SIZDTIME	7	/* decimal(12,0) */
#define SIZVCHAR	1
#define SIZINT8         (sizeof(short) + sizeof(muint) * 2)
#define SIZSERIAL8	SIZINT8
#define SIZBIGINT    8
#define SIZBIGSERIAL 8
#define SIZCOLL		sizeof (ifx_collection_t) 
#define SIZSET		SIZCOLL
#define SIZMULTISET	SIZCOLL
#define SIZLIST		SIZCOLL
#define SIZROWREF	sizeof (ifx_ref_t) 

#define MASKNONULL(t)	((t) & (SQLTYPE))

/*
 * As part of an sqlda structure from DESCRIBE, you can test whether a
 * column accepts or can return nulls, using the expression:
 *     ISCOLUMNULLABLE(ud->sqlvar[n].sqlflags)
 * (for sqlda structure pointer ud and column number n).
 */

#define ISCOLUMNULLABLE(t)	(((t) & (SQLNONULL)) ? 0 : 1)
#define ISSQLTYPE(t)	(MASKNONULL(t) >= SQLCHAR && MASKNONULL(t) < SQLMAXTYPES)

#define DECCOLLEN       8192    /* decimal size definition for DEC(32,0) in syscolumns */


/*
 * SQL types macros
 */
#define ISDECTYPE(t)		(MASKNONULL(t) == SQLDECIMAL || \
				 MASKNONULL(t) == SQLMONEY || \
				 MASKNONULL(t) == SQLDTIME || \
				 MASKNONULL(t) == SQLINTERVAL)
#define ISNUMERICTYPE(t)	(MASKNONULL(t) == SQLSMINT || \
				 MASKNONULL(t) == SQLINT || \
				 MASKNONULL(t) == SQLINT8 || \
				 MASKNONULL(t) == SQLFLOAT || \
				 MASKNONULL(t) == SQLSMFLOAT || \
				 MASKNONULL(t) == SQLMONEY || \
				 MASKNONULL(t) == SQLSERIAL || \
				 MASKNONULL(t) == SQLSERIAL8 || \
  				 MASKNONULL(t) == SQLDECIMAL || \
				 MASKNONULL(t) == SQLINFXBIGINT || \
				 MASKNONULL(t) == SQLBIGSERIAL)
#define ISBLOBTYPE(type)	(ISBYTESTYPE (type) || ISTEXTTYPE(type))
#define ISBYTESTYPE(type)	(MASKNONULL(type) == SQLBYTES)
#define ISTEXTTYPE(type)	(MASKNONULL(type) == SQLTEXT)
#define ISSQLHOST(t)            (((t) & SQLHOST) == SQLHOST)
    
#ifndef NLS
#define ISVCTYPE(t)		(MASKNONULL(t) == SQLVCHAR)
#define ISCHARTYPE(t)		(MASKNONULL(t) == SQLCHAR)
#else
#define ISVCTYPE(t)		(MASKNONULL(t) == SQLVCHAR || \
				 MASKNONULL(t) == SQLNVCHAR)
#define ISCHARTYPE(t)		(MASKNONULL(t) == SQLCHAR || \
				 MASKNONULL(t) == SQLNCHAR)
#define ISNSTRINGTYPE(t)	(MASKNONULL(t) == SQLNCHAR || \
				 MASKNONULL(t) == SQLNVCHAR)
#endif /* NLS */

#define ISSTRINGTYPE(t)		(ISVCTYPE(t) || ISCHARTYPE(t))

#define	ISUDTVARTYPE(t)		(MASKNONULL(t) == SQLUDTVAR)
#define	ISUDTFIXEDTYPE(t)	(MASKNONULL(t) == SQLUDTFIXED)
#define	ISUDTTYPE(t)		(ISUDTVARTYPE(t) || ISUDTFIXEDTYPE(t))

#define	ISCOMPLEXTYPE(t)	(ISROWTYPE(t) || ISCOLLTYPE(t))
#define	ISROWTYPE(t)		(MASKNONULL(t) == SQLROW)
#define	ISLISTTYPE(t)		(MASKNONULL(t) == SQLLIST)
#define	ISMULTISETTYPE(t)	(MASKNONULL(t) == SQLMULTISET)
#define	ISREFTYPE(t)		(MASKNONULL(t) == SQLROWREF)
#define	ISREFSER8(t)		(MASKNONULL(t) == SQLREFSER8)
#define	ISSERIAL(t)		(MASKNONULL(t) == SQLSERIAL)
#define	ISSERIAL8(t)		(MASKNONULL(t) == SQLSERIAL8)
#define ISBIGSERIAL(t)          (MASKNONULL(t) == SQLBIGSERIAL)
#define ISBIGINT(t)             (MASKNONULL(t) == SQLINFXBIGINT)
#define	ISSETTYPE(t)		(MASKNONULL(t) == SQLSET)
#define	ISCOLLECTTYPE(t)	(MASKNONULL(t) == SQLCOLLECTION)
#define ISCOLLTYPE(t)		(ISSETTYPE(t) || ISMULTISETTYPE(t) ||\
				 ISLISTTYPE(t) || ISCOLLECTTYPE(t))

#define ISSERIALTYPE(t)               (((t) & SQLTYPE) == SQLSERIAL || \
                                ((t) & SQLTYPE) == SQLSERIAL8 || \
                                ((t) & SQLTYPE) == SQLREFSER8 ||\
                                ((t) & SQLTYPE) == SQLBIGSERIAL)

#define ISDISTINCTTYPE(t)	((t) & SQLDISTINCT)
#define ISCSTTYPE(t)		(ISUDTTYPE(t) && ((t) & SQLCSTTYPE))
    
/* these macros are used to distinguish NLS char types and non-nls (ASCII)
 * char types
 */
#define ISNONNLSCHAR(t)		(MASKNONULL(t) == SQLCHAR || \
				 MASKNONULL(t) == SQLVCHAR)

/* these macros should be used in case statements
 */
#ifndef NLS
#define CHARCASE		SQLCHAR
#define VCHARCASE		SQLVCHAR
#else
#define CHARCASE		SQLCHAR: case SQLNCHAR
#define VCHARCASE		SQLVCHAR: case SQLNVCHAR
#endif /* NLS */

#define UDTCASE		 	SQLUDTVAR: case SQLUDTFIXED

/*
 * C types macros
 */
#define ISBLOBCTYPE(type)	(ISLOCTYPE(type) || ISFILETYPE(type)) 
#define ISLOCTYPE(type)		(MASKNONULL(type) == CLOCATORTYPE) 
#define ISFILETYPE(type)	(MASKNONULL(type) == CFILETYPE) 
#define ISLVCHARCTYPE(type)     (MASKNONULL(type) == CLVCHARTYPE)
#define ISLVCHARCPTRTYPE(type)  (MASKNONULL(type) == CLVCHARPTRTYPE)
#define ISFIXBINCTYPE(type)     (MASKNONULL(type) == CFIXBINTYPE)
#define ISVARBINCTYPE(type)     (MASKNONULL(type) == CVARBINTYPE)
#define ISBOOLCTYPE(type)       (MASKNONULL(type) == CBOOLTYPE)


#define ISOPTICALCOL(type)	(type == 'O')

#define DEFDECIMAL	9	/* default decimal(16) size */
#define DEFMONEY	9	/* default decimal(16) size */

#define SYSPUBLIC	"public"

/*
 * if an SQL type is specified, convert to default C type
 *  map C int to either short or long
 */


#define TYPEMAX	SQLMAXTYPES

extern int2 sqlctype[];

#define toctype(ctype, type) \
    { \
    if (type == CINTTYPE) \
    { \
      if (sizeof(mint) == sizeof(mlong)) \
          { ctype = type = CLONGTYPE; } \
      else if (sizeof(mint) == sizeof(int2)) \
          { ctype = type = CSHORTTYPE; } \
      else \
          { ctype = CLONGTYPE; type = CINTTYPE; } \
    } \
    else if (type >= 0 && type < TYPEMAX) \
        ctype = sqlctype[type]; \
    else \
        ctype = type; \
    }



/* Extended ID definitions for predefined UDT's */
/* These can not be changed because sqli is using
 * them.  If we change them, the client has to recompile.
 * NOTE: This order must match the definitions in boot90.sql
 */

#define XID_LVARCHAR            1
#define XID_SENDRECV            2
#define XID_IMPEXP              3
#define XID_IMPEXPBIN           4
#define XID_BOOLEAN             5
#define XID_POINTER             6
#define XID_INDEXKEYARRAY       7
#define XID_RTNPARAMTYPES	8
#define XID_SELFUNCARGS         9
#define XID_BLOB                10
#define XID_CLOB                11
#define XID_LOLIST              12
#define XID_IFX_LO_SPEC		13
#define XID_IFX_LO_STAT		14
#define XID_STAT                15
#define XID_CLIENTBINVAL        16
#define XID_UDTMODIFIERS	17
#define XID_AGGMODIFIERS	18
#define XID_UDRMODIFIERS	19
#define XID_GUID        	20
#define XID_DBSENDRECV          21
#define XID_SRVSENDRECV         22
#define XID_FUNCARG		23
#define LASTBUILTINXTDTYPE      XID_FUNCARG 

/* Max size definitions for the predefined UDT's.
 * Only a few are currently defined.
 */
#define SIZINDEXKEYARRAY	1024
#define SIZLVARCHAR		2048
#define SIZRTNPARAMTYPES	4096
#define SIZSTAT                 272
#define SIZGUID			16

/* Alignment required by predefined UDT's.
 * Only a few are currently defined.  At a minimum,
 * all with alignment not 1 should be defined here
 * and used throughout the code.
 */
#define ALNINDEXKEYARRAY	4
#define ALNSTAT                 8


#define USER_XTDTYPEID_START	2048

/* These macros should be used to test lvarchar and distinct of lvarchar */

#define ISLVARCHARXTYPE(t, xid)  (ISUDTTYPE((t)) && (xid) == XID_LVARCHAR)
#define ISDISTINCTLVARCHAR(t)	((t) & SQLDLVARCHAR)
#define LIKELVARCHARXTYPE(t,xid) ((ISLVARCHARXTYPE(t,xid))||\
				   ISDISTINCTLVARCHAR(t))

#define ISSMARTBLOB(type, xid)  (ISUDTTYPE((type)) && \
				    ((xid == XID_CLOB) || (xid == XID_BLOB)))

/* These macros should be used to test boolean and distinct of boolean */
#define ISBOOLEANXTYPE(t, xid)  (ISUDTTYPE((t)) && (xid) == XID_BOOLEAN)
#define ISDISTINCTBOOLEAN(t)	(((t) & SQLDBOOLEAN) && \
				    (ISUDTTYPE(t)))
#define LIKEBOOLEANXTYPE(t,xid) ((ISBOOLEANXTYPE(t,xid))||\
				  ISDISTINCTBOOLEAN(t))

#define ISFIXLENGTHTYPE(t)	(!ISBYTESTYPE(t) && !ISTEXTTYPE(t) \
					&& !ISCOMPLEXTYPE(t) \
					&& !ISUDTVARTYPE(t) \
					&& !ISVCTYPE(t)) 
#endif /* CCHARTYPE */
