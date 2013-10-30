/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1997, 2010. All rights reserved.
 *
 *  Title:       decimal.h
 *  Description: DECIMAL (and MONEY) data type.
 *
 ***************************************************************************
 */

#ifndef _DECIMAL_H
#define _DECIMAL_H

#include "ifxtypes.h"

#ifdef NT_MI_SAPI
#ifdef NT_SERVER /* NT Server */
#define MI_EXT_DECL __declspec(dllexport)
#else            /* NT Blade */
#define MI_EXT_DECL __declspec(dllimport)
#endif /* NT_SERVER */
#else            /* UNIX Blade & Server - Default */
#define MI_EXT_DECL extern
#endif /* !NT_MI_SAPI */

#ifdef __cplusplus
extern "C" {
#endif

/*
 * Unpacked Format (format for program usage)
 *
 *    Signed exponent "dec_exp" ranging from  -64 to +63
 *    Separate sign of mantissa "dec_pos"
 *    Base 100 digits (range 0 - 99) with decimal point
 *	immediately to the left of first digit.
 */

#define DECSIZE 16
#define DECUNKNOWN -2

struct decimal
    {
    int2 dec_exp;		/* exponent base 100		*/
    int2 dec_pos;		/* sign: 1=pos, 0=neg, -1=null	*/
    int2 dec_ndgts;		/* number of significant digits	*/
    char  dec_dgts[DECSIZE];	/* actual digits base 100	*/
    };
typedef struct decimal dec_t;

/*
 *  A decimal null will be represented internally by setting dec_pos
 *  equal to DECPOSNULL
 */

#define DECPOSNULL	(-1)

#define DECPOSPOS       +1
#define DECPOSNEG        0
#define DECEXPZERO     -64
#define DECEXPNULL	 0
#define DECEXPMAX      +63
#define DECEXPMIN      -64

/*
 * DECLEN calculates minumum number of bytes
 * necessary to hold a decimal(m,n)
 * where m = total # significant digits and
 *	 n = significant digits to right of decimal
 */

#define DECLEN(m,n)	(((m)+((n)&1)+3)/2)
#define DECLENGTH(len)	DECLEN(PRECTOT(len),PRECDEC(len))

/*
 * DECPREC calculates a default precision given
 * number of bytes used to store number
 */

#define DECPREC(size)	(((size-1)<<9)+2)

/* macros to look at and make encoded decimal precision
 *
 *  PRECTOT(x)		return total precision (digits total)
 *  PRECDEC(x) 		return decimal precision (digits to right)
 *  PRECMAKE(x,y)	make precision from total and decimal
 */

#define PRECTOT(x)	(((x)>>8) & 0xff)
#define PRECDEC(x)	((x) & 0xff)
#define PRECMAKE(x,y)	(((x)<<8) + (y))

/*
 * Packed Format  (format in records in files)
 *
 *    First byte =
 *	  top 1 bit = sign 0=neg, 1=pos
 *	  low 7 bits = Exponent in excess 64 format
 *    Rest of bytes = base 100 digits in 100 complement format
 *    Notes --	This format sorts numerically with just a
 *		simple byte by byte unsigned comparison.
 *		Zero is represented as 80,00,00,... (hex).
 *		Negative numbers have the exponent complemented
 *		and the base 100 digits in 100's complement
 */

/*
** DECIMALTYPE Functions
*/
MI_EXT_DECL mint decadd(struct decimal *n1, struct decimal *n2, struct decimal *n3);
MI_EXT_DECL mint decsub(struct decimal *n1, struct decimal *n2, struct decimal *n3);
MI_EXT_DECL mint decmul(struct decimal *n1, struct decimal *n2, struct decimal *n3);
MI_EXT_DECL mint decdiv(struct decimal *n1, struct decimal *n2, struct decimal *n3);
MI_EXT_DECL mint deccmp(struct decimal *n1, struct decimal *n2);
MI_EXT_DECL void deccopy(struct decimal *n1, struct decimal *n2);
MI_EXT_DECL mint deccvasc(char *cp, mint len, struct decimal *np);
MI_EXT_DECL mint deccvdbl(double dbl, struct decimal *np);
MI_EXT_DECL mint deccvint(mint in, struct decimal *np);
MI_EXT_DECL mint deccvlong(int4 lng, struct decimal *np);
MI_EXT_DECL char *dececvt(struct decimal *np, mint ndigit, mint *decpt, mint *sign);
MI_EXT_DECL char *decfcvt(struct decimal *np, mint ndigit, mint *decpt, mint *sign);
MI_EXT_DECL void decround(struct decimal *np, mint dec_round);
MI_EXT_DECL mint dectoasc(struct decimal *np, char *cp, mint len, mint right);
MI_EXT_DECL mint dectodbl(struct decimal *np, double *dblp);
MI_EXT_DECL mint dectoint(struct decimal *np, mint *ip);
MI_EXT_DECL mint dectolong(struct decimal *np, int4 *lngp);
MI_EXT_DECL void dectrunc(struct decimal *np, mint trunc);
MI_EXT_DECL mint deccvflt(double source, struct decimal *destination);
MI_EXT_DECL mint dectoflt(struct decimal *source, float *destination);

#ifdef __cplusplus
}
#endif

#endif /* _DECIMAL_H */
