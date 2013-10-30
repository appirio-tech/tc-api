/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1997, 2008. All rights reserved.
 *
 *  Title:       mitrace.h
 *  Description: Public tracing header
 *
 ***************************************************************************
 */

#ifndef _MITRACE_H_
#define _MITRACE_H_

/*   INCLUDES   */

#ifndef FILE
#include <stdio.h>
#endif /* FILE */

#define MI_IDENTSIZE    128
#define MI_OLDIDENTSIZE    18
#define MI_LOCALESIZE   36
#define MI_MSGSIZE      256
#define MI_LIST_END     (char *)NULL

/*   TYPE DEFINITIONS   */

#ifndef _MI_TRACE_STRUCTURES_
#define _MI_TRACE_STRUCTURES_

/* Trace vector internal structure   */

typedef struct _classRec
{
  mi_string    className[MI_OLDIDENTSIZE];
  mi_integer   classID;
  mi_integer   level;
}  MI_CLASS_RECORD;

typedef struct mi_tracevect
{
    mi_integer		tv_numel;
    FILE		*tv_file;
    mi_integer          (*tv_prfunc)
				ARGS((const char *fmt, ...));
    MI_CONNECTION	*tv_conn;
    MI_CLASS_RECORD 	tv_vect[1];
} MI_TRACE_VECTOR;

/* Trace messages internal structure */

typedef struct _traceMsg
{
  mi_string    msgName[MI_IDENTSIZE];
  mi_integer   msgID;
  mi_string    locale[MI_LOCALESIZE];
  mi_string    message[MI_MSGSIZE];
} MI_TRACE_MSG;

typedef struct _mi_tracemsg_list
{
  mi_integer    tml_numel;
  mi_string     traceLocale[MI_LOCALESIZE];
  MI_TRACE_MSG  msgEl[1];
} MI_TRACEMSG_LIST;

#endif /* _MI_TRACE_STRUCTURES_ */

/*    FUNCTION PROTOTYPES    */

EXTERNC_BEGIN

MI_DECL void MI_PROC_EXPORT         mi_trace ARGS((const char *s));
MI_DECL mi_integer MI_PROC_EXPORT   mi_tracelevel_set ARGS((const mi_string   *setCommands));
MI_DECL mi_integer MI_PROC_EXPORT   mi_tracefile_set  ARGS((const mi_string   *fname));
MI_DECL mi_integer MI_PROC_VAEXPORT   mi_def_tprintf ARGS((const char *fmt, ...));
MI_DECL mi_integer MI_PROC_VAEXPORT   mi_gl_tprintf ARGS((const char *fmt, ...));
MI_DECL MI_TRACE_VECTOR MI_PROC_EXPORT ** mi_trace_getvect ARGS((void));
MI_DECL MI_TRACEMSG_LIST MI_PROC_EXPORT ** mi_tracemsg_getlist ARGS((void));
MI_DECL mi_integer MI_PROC_EXPORT   be_mapsym(char *s);
MI_DECL mi_boolean MI_PROC_EXPORT   mi_thresh_reached ARGS((const mi_string *codeClass,
						    mi_integer codeLevel));

EXTERNC_END

/*    MACRO DEFINITIONS   */

#ifndef MI_TV
#define MI_TV   (*(mi_trace_getvect()))
#endif /* ! MI_TV */

#ifndef MI_ML
#define MI_ML   (*(mi_tracemsg_getlist()))
#endif /* ! MI_ML */

/* Printing function */
#ifndef __cplusplus
#define MI_TPRINTF ((MI_TV != NULL) && (MI_TV->tv_prfunc != NULL) ? MI_TV->tv_prfunc : mi_def_tprintf)
#define MI_GL_TPRINTF  mi_gl_tprintf
#else /* __cplusplus */
#define MI_TPRINTF mi_def_tprintf
#define MI_GL_TPRINTF mi_gl_tprintf
#endif /* __cplusplus */

#ifndef MITRACE_OFF

/* flag is at least rev */
#define MI_TFLAG(flag, lev)   ((MI_TV != NULL && be_mapsym(flag) <= MI_TV->tv_numel) ? MI_TV->tv_vect[be_mapsym(flag)].level >= lev : 0)

/* return the level of flag */
#define MI_TFLEV(flag)     ((MI_TV != NULL && be_mapsym(flag) <= MI_TV->tv_numel) ? MI_TV->tv_vect[be_mapsym(flag)].level : 0)

#define MI_DPRINTF(flag, level, args) if (MI_TFLAG(flag, level)) MI_TPRINTF args
#define MI_GL_DPRINTF(flag, level, args) if (MI_TFLAG(flag, level)) MI_GL_TPRINTF  args
#else /* MITRACE_OFF */

#define MI_TFLAG(flag, lev)		MI_FALSE
#define MI_TFLEV(flag)			0
#define MI_DPRINTF(flag, level, args)	/* do nothing */
#define MI_GL_DPRINTF(flag, level, args)  /* do nothing */

#endif /* MITRACE_OFF */

#define tf	MI_TFLAG
#define tflev	MI_TFLEV
#define DPRINTF	MI_DPRINTF
#define GL_DPRINTF MI_GL_DPRINTF
#define tprintf	MI_TPRINTF
#define gl_tprintf MI_GL_TPRINTF

#endif /* _MITRACE_H_ */

