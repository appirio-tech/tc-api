/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 *
 * (c)  Copyright IBM Corporation 1998-2007. All rights reserved.
 *
 *
 *  Title      : ifxtypes.h
 *  Description: Informix integer data types
 *
 ***************************************************************************
 */

#ifndef _IFXTYPES_H_
#define _IFXTYPES_H_

#ifndef _MITYPES_INCL

#define _MITYPES_INCL

/* Warning: Do not delete line below. Delimits ESQL/C predefined types */
/* ESQLC_PREDEFS */
/* typedef's in this section must start with "typedef" in the first column */
/* and the have the complete statement on one line. */

/************************************************************************
 * Define standard 1 byte, 2 byte, and 4 byte integers
 */
/* The int4/int2/int1 types are defined under _MITYPES_INCL 
 * to ensure compatibilty with 9.14
 */
typedef int             int4;
typedef short           int2;
typedef char            int1;

typedef int             mint;
typedef long            mlong;

/************************************************************************
 * Define standard machine dependent types - a way of mapping data types
 * to various machine specific data types. One of the reasons is to
 * support write atomicity for all primary data types. For example,
 * write atomicities for short and char are not supported on DEC ALPHA.
 * If write atomicity is required for some variables or components of data
 * structures, one can define them as MSHORT or MCHAR and map MSHORT or
 * MCHAR in ifxtypes.h to other type for which write atomicity is supported.
 *
 */
typedef short           MSHORT;
typedef char            MCHAR;

/* ESQLC_PREDEFS */
/* Warning: Do not delete line above. Delimits ESQL/C predefined types */

typedef long            mintptr;   /* An integer type which has the same
                                    * size as that of a pointer
                                    */

 
/************************************************************************
 * Define standard unsigned integers.
 */

/* The unsigned int4/int2/int1 types are defined under _MITYPES_INCL 
 * to ensure compatibilty with 9.14
 */
typedef unsigned int    uint4;
typedef unsigned short  uint2;
typedef unsigned char   uint1;

#endif /* _MITYPES_INCL */

typedef unsigned int    muint;
typedef unsigned long   mulong;
typedef unsigned long   muintptr;  /* An unsigned integer type which has
                                    * the same size as that of a pointer
                                    */


/************************************************************************
 * Define standard unsigned machine dependent types.
 */
typedef unsigned short  MUSHORT;
typedef unsigned char   MUCHAR;

#define MI_INT_SIZE     32
#define MI_LONG_SIZE    64
#define MI_PTR_SIZE     64

/* bigint define for native 64bit integer */
typedef long            bigint;
typedef unsigned long   ubigint;

#define MAXBIGINT          ((bigint)0x7fffffffffffffffL)
#define BIGINTNULL         ((bigint)0x8000000000000000L)

#endif /* _IFXTYPES_H_ */
