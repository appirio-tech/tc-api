/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1997, 2010
 *
 *  Title:       mitypes.h
 *  Description: MIAPI data types and accessors
 *
 ***************************************************************************
 */

#ifndef _MITYPES_H_
#define _MITYPES_H_

#include "ifxtypes.h"

#ifndef _MICONV_H_
#include "miconv.h"
#endif /* _MICONV_H_  */

#ifndef _INT8_H
#include "int8.h"
#endif /* _INT8_H */

#ifndef _DECIMAL_H_
#include "decimal.h"
#endif /* _DECIMAL_H_  */

#ifndef _DATETIME_H_
#include "datetime.h"
#endif /* _DATETIME_H_ */

/* This version of struct shld be used in client APIs */
/* public version of mi_typeid */
#if !defined(MI_CLIENTP_H) && !defined(MI_FPARAM_H)

#ifndef _MI_TYPEID_INCL

struct mi_typeid
{
        int4    dummmy[2];
};

#endif /* _MI_TYPEID_INCL */

#endif /* !defined(MI_CLIENTP_H) && !defined(MI_FPARAM_H) */

/*
 * SQL Data Types
 */

typedef uint1           mi_int1;
typedef int1            mi_sint1;

typedef int1            mi_char1;
typedef uint1           mi_unsigned_char1;

typedef uint2           mi_wchar;

typedef int2            mi_smallint;
typedef uint2           mi_unsigned_smallint;

typedef int4            mi_integer;
typedef uint4           mi_unsigned_integer;

typedef ifx_int8_t      mi_int8;
typedef ifx_int8_t      mi_unsigned_int8;

#ifndef NOBIGINT
typedef bigint            mi_bigint;
typedef ubigint           mi_unsigned_bigint;
#endif

/* floating point */

typedef float           mi_real;
typedef double          mi_double_precision;

typedef int1            mi_boolean;

/* Numeric and Decimal have the same representation. */

typedef dec_t           mi_numeric;
typedef mi_numeric      mi_decimal;

typedef char            mi_char;
typedef char            mi_string;
typedef dec_t           mi_money;

typedef intrvl_t        interval;
typedef interval        mi_interval;

typedef int4            mi_date;

typedef dtime_t         datetime;
typedef datetime        mi_datetime;

#define MI_REFSIZE      16
typedef int1            mi_ref[MI_REFSIZE];

typedef void *          mi_pointer;
typedef void *          MI_DATUM;

/*
 * Utility Macro
 */

#define MI_ALIGNBYTES(LEN, NBYTES) \
    ((((mintptr)(LEN)) + ((NBYTES) - 1)) & ~(((mintptr)(NBYTES)) - 1))

#ifdef NT_MI_SAPI
#define UDREXPORT __declspec(dllexport)
#endif /* NT_MI_SAPI */

#endif /* _MITYPES_H_ */
