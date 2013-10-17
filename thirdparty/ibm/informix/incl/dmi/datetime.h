/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1997, 2008. All rights reserved.
 *
 *  Title:       datetime.h
 *  Description: DATETIME and INTERVAL types
 *
 ***************************************************************************
 */

#ifndef _DATETIME_H
#define _DATETIME_H

#include "ifxtypes.h"

#include "decimal.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct dtime
	{
	int2 dt_qual;
	dec_t dt_dec;
	}	dtime_t;

typedef struct intrvl
	{
	int2 in_qual;
	dec_t in_dec;
	}	intrvl_t;

/* time units for datetime qualifier */

#define TU_YEAR 0
#define TU_MONTH 2
#define TU_DAY 4
#define TU_HOUR 6
#define TU_MINUTE 8
#define TU_SECOND 10
#define TU_FRAC 12
#define TU_F1 11
#define TU_F2 12
#define TU_F3 13
#define TU_F4 14
#define TU_F5 15

/* TU_END - end time unit in datetime qualifier */
/* TU_START - start time unit in datetime qualifier */
/* TU_LEN - length in  digits of datetime qualifier */

#define TU_END(qual) (qual & 0xf)
#define TU_START(qual) ((qual>>4) & 0xf)
#define TU_LEN(qual) ((qual>>8) & 0xff)

/* TU_ENCODE - encode length, start and end time unit to form qualifier */
/* TU_DTENCODE - encode datetime qual */
/* TU_IENCODE - encode interval qual */

#define TU_ENCODE(len,s,e) (((len)<<8) | ((s)<<4) | (e))
#define TU_DTENCODE(s,e) TU_ENCODE(((e)-(s)+((s)==TU_YEAR?4:2)), s, e)
#define TU_IENCODE(len,s,e) TU_ENCODE(((e)-(s)+(len)),s,e)
#define TU_FLEN(len) (TU_LEN(len)-(TU_END(len)-TU_START(len)))

/* TU_FIELDNO - field number of the given TU_ macro.
   (e.g. year is 0, month is 1, day is 2, TU_F1 is  7, TU_F5 is 11)
 */

#define TU_FIELDNO(f)   (f > TU_SECOND ? (5+(f-TU_SECOND)) : (f/2))

/* TU_CURRQUAL - default qualifier used by current */

#define TU_CURRQUAL TU_ENCODE(17,TU_YEAR,TU_F3)

MI_EXT_DECL mint dtaddinv(struct dtime *d, struct intrvl *i, struct dtime *r);
MI_EXT_DECL void dtcurrent(struct dtime *d);
MI_EXT_DECL mint dtcvasc(char *str, struct dtime *d);
MI_EXT_DECL mint ifx_dtcvasc(char *str,struct dtime *d, char db_century);
MI_EXT_DECL mint dtcvfmtasc(char *input, char *fmt, struct dtime *d);
MI_EXT_DECL mint ifx_dtcvfmtasc(char *input,char *fmt,struct dtime *d, char db_century);
MI_EXT_DECL mint dtextend(struct dtime *id, struct dtime *od);
MI_EXT_DECL mint dtsub(struct dtime *d1, struct dtime *d2, struct intrvl *i);
MI_EXT_DECL mint dtsubinv(struct dtime *d, struct intrvl *i, struct dtime *r);
MI_EXT_DECL mint dttoasc(struct dtime *d, char *str);
MI_EXT_DECL mint dttofmtasc(struct dtime *d, char *output, mint str_len, char *fmtstr);
MI_EXT_DECL mint ifx_dttofmtasc(struct dtime *d,char *output,mint str_len,char *fmtstr, char db_century);
MI_EXT_DECL mint incvasc(char *str, struct intrvl *i);
MI_EXT_DECL mint incvfmtasc(char *input, char *fmt, struct intrvl *intvl);
MI_EXT_DECL mint intoasc(struct intrvl *i, char *str);
MI_EXT_DECL mint intofmtasc(struct intrvl *i, char *output, mint str_len, char *fmtstr);
MI_EXT_DECL mint invdivdbl(struct intrvl *iv, double dbl, struct intrvl *ov);
MI_EXT_DECL mint invdivinv(struct intrvl *i1, struct intrvl *i2, double *res);
MI_EXT_DECL mint invextend(struct intrvl *i, struct intrvl *o);
MI_EXT_DECL mint invmuldbl(struct intrvl *iv, double dbl, struct intrvl *ov);
MI_EXT_DECL mint ifx_to_gl_datetime(char *source_str, char *target_str, mint maxlen);

#ifdef __cplusplus
}
#endif

/* GL_DATETIME length */
#define GLDT_LEN        80

#endif /* _DATETIME_H */
