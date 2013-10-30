/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1997, 2008. All rights reserved.
 *
 *  Title:       int8.h
 *  Description: INT8 data type.
 *
 ***************************************************************************
 */

#ifndef _INT8_H
#define _INT8_H

#include "ifxtypes.h"

#define INT8SIZE 2	   /* number of unsigned int4's in struct ifx_int8 */
#define INT8UNKNOWN -2     /* Value returned by int8 comparison function if one
			    * of the operands is NULL.
			    */

#define INT8NULL	0  /* A int8 null will be represented internally by setting
			    * sign equal to INT8NULL
			    */

typedef struct ifx_int8
    {
    uint4 data[INT8SIZE];
    int2 sign;		/* 0 = NULL, 1 = positive, -1 = negative */
    } ifx_int8_t;

#endif /* _INT8_H */
