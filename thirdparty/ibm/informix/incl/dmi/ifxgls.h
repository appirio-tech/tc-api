/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1997, 2008. All rights reserved.
 *
 *  Title:       ifxgls.h
 *  Description: IDS interface to GLS API
 *
 ***************************************************************************/

#ifndef _IFXGLS_API_HEADER_INCLUDED
#define _IFXGLS_API_HEADER_INCLUDED

#include "ifxtypes.h"
#include "gls.h"
#include "datetime.h"

#ifdef __cplusplus
extern "C" {
#endif

/*
 * The following defines determine whether gl_locale implies a session
 * locale or a db_locale/client_locale combination depending on server/client
 * initialisation.
 */
#ifdef NT_MI_SAPI /* NT Server/Blade */
#ifdef MI_SERVBUILD
#ifdef NT_SERVER  /* NT Server */
#else             /* NT Blade  */
__declspec(dllimport) gl_lc_t **mi_get_locale();
#define gl_locale ** mi_get_locale()
#endif /* NT_SERVER */
#endif /* MI_SERVBUILD */

#else /*  UNIX/Win32 Client - Default */

/* ifx_get_gl_locale_thread() is defined in genlib/ginitkey.c */
/* The C source code there says: void *ifx_get_gl_locale_thread() */
#ifdef MI_SERVBUILD
extern gl_lc_t *scb;
#define gl_locale (*scb)
#elif defined(__STDC__)
MI_EXT_DECL void *ifx_get_gl_locale_thread(void);
extern gl_lc_t gls_env;
#define gl_locale (ifx_get_gl_locale_thread())
#else
/* C++ compilation - affects HP-UX build in /client/c++if/impl/src */
/* Note the blatant lie - the function does *not* return a 'char *' */
MI_EXT_DECL char *ifx_get_gl_locale_thread(void);
extern gl_lc_t gls_env;
#define gl_locale (ifx_get_gl_locale_thread())
#endif /* MI_SERVBUILD */

#endif /* NT_MI_SAPI */

/*
 * Locale initialisation function.
 */
MI_EXT_DECL mint ifx_gl_init (void);

/*
 * Codeset conversion functions.
 */
MI_EXT_DECL mint ifx_gl_cv_mconv (gl_cv_state_t *state,
                            gl_mchar_t **dst,
                            mint *dstbytes,
                            char *dst_codeset,
                            gl_mchar_t **src,
                            mint *srcbytes,
                            char *src_codeset);

MI_EXT_DECL mint ifx_gl_cv_outbuflen (char *dst_codeset,
                                char *src_codeset,
                                mint  srcbytes);

MI_EXT_DECL mint ifx_gl_conv_needed (char *dst_codeset,
                               char *src_codeset);

MI_EXT_DECL mint ifx_gl_cv_sb2sb_table(char *dstcs,
                                 char *srccs,
                                 unsigned char **array);

/*
 * Built-in Data Type Conversion.
 */
MI_EXT_DECL mint ifx_gl_convert_date(int4 *date,
                                char *datestr,
                                char *format);

MI_EXT_DECL mint ifx_gl_format_date(char *datestr,
                               mint len,
                               int4 *date,
                               char *format);

MI_EXT_DECL mint ifx_gl_convert_datetime(dtime_t *dt,
                                    char *datetimestr,
                                    char *format);

MI_EXT_DECL mint ifx_gl_format_datetime(char *datetimestr,
                                   mint len,
                                   dtime_t *dt,
                                   char *format);

MI_EXT_DECL mint ifx_gl_convert_double(double *d,
                                 char *dstr,
                                 char *format);

MI_EXT_DECL mint ifx_gl_format_double(char *dstr,
                                mint len,
                                double d,
                                char *format);

MI_EXT_DECL mint ifx_gl_convert_money(dec_t *mon,
                                 char *monstr,
                                 char *format);

MI_EXT_DECL mint ifx_gl_format_money(char *monstr,
                                mint len,
                                dec_t *mon,
                                char *format);

MI_EXT_DECL mint ifx_gl_convert_number(dec_t *dec,
                                  char *decstr,
                                  char *format);

MI_EXT_DECL mint ifx_gl_format_number(char *decstr,
                                 mint len,
                                 dec_t *dec,
                                 char *format);

/* The following functions allow users to set GLS/NLS env. variable
 * values in a thread-specific 'save area' which can be used with the
 * current glsenv (by calling ifx_execute_GLS_change().)
 */
MI_EXT_DECL mint ifx_set_CLIENT_LOCALE(char *env_val);

MI_EXT_DECL mint ifx_set_DB_LOCALE(char *env_val);

MI_EXT_DECL mint ifx_set_DBNLS(char *env_val);

MI_EXT_DECL mint ifx_set_DBLANG(char *env_val);

MI_EXT_DECL mint ifx_set_LC_CTYPE(char *env_val);

MI_EXT_DECL mint ifx_set_LC_COLLATE(char *env_val);

MI_EXT_DECL mint ifx_set_LC_NUMERIC(char *env_val);

MI_EXT_DECL mint ifx_set_LC_MONETARY(char *env_val);

MI_EXT_DECL mint ifx_set_LC_TIME(char *env_val);

MI_EXT_DECL mint ifx_set_DBTIME(char *env_val);

MI_EXT_DECL mint ifx_set_DBDATE(char *env_val);

MI_EXT_DECL mint ifx_set_DBMONEY(char *env_val);

MI_EXT_DECL mint ifx_set_GL_DATE(char *env_val);

MI_EXT_DECL mint ifx_set_GL_DATETIME(char *env_val);

MI_EXT_DECL mint ifx_execute_GLS_change(mint type);

MI_EXT_DECL mint ifx_gl_reset_GLS_env(void);

/* A copy from glsenv.h:
 * Defines used by ifx_execute_GLS_change(). When ifx_execute_GLS_change() is
 * with GLS_IMMED, the stored glsenv (glsenv_savearea) becomes the current
 * glsenv * for the given thread immediately. If GLS_NEXT_CONN is passed, the
 * glsenv savearea becomes current only when a new connection is established.
 * NOTE: GLS_IMMED is currently not supported.
 */
#define GLS_IMMED       1
#define GLS_NEXT_CONN   2

#ifdef __cplusplus
}
#endif

#endif /* _IFXGLS_API_HEADER_INCLUDED */

