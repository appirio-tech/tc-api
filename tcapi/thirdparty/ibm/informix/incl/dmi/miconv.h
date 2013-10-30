/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * (c)  Copyright IBM Corporation 1997, 2008. All rights reserved.
 *
 *  Title:       miconv.h
 *  Description: MIAPI conventions and compiler specific switches
 *
 ***************************************************************************
 */

#ifndef	_MICONV_H_
#define	_MICONV_H_

#include "ifxtypes.h"

/*
 *  New defines are MI_WINNT and MI_WIN31.
 *  We still support WIN32 and MI_WIN31_PORT.
 */

#ifdef WIN32
#ifndef MI_WINNT
#define MI_WINNT
#endif /* MI_WINNT */
#endif /* WIN32 */

#ifdef MI_WIN31
#ifndef MI_WIN31_PORT
#define MI_WIN31_PORT
#endif /*  MI_WIN31_PORT */
#endif /* MI_WIN31 */

/*
 *  Compiler-specific switches.
 */

#if defined(_MSC_VER) || defined(__TURBOC__) || defined(WIN32) || defined(_WINDOWS) || defined(_WINDLL)

#if !defined(MI_WINNT) && !defined(MI_WIN31)
#define MI_WINNT
#endif /* !WIN32 && !MI_WIN31_PORT */

#endif /* PC compilers */

/*
 *  Microsoft compilers do not define __STDC__ if compiled with
 *  microsoft extensions.
 */

#if defined(MI_WINNT) || defined(MI_WIN31)

#ifndef MI_HAS_STDC
#define MI_HAS_STDC
#endif /* MI_HAS_STDC */

#endif /* pc compilers */

#ifdef __STDC__

#if __STDC__ > 0

#if !defined(MI_HAS_STDC) && !defined(MI_NO_STDC)

#define MI_HAS_STDC
#define	MI_HAS_SIGNED

#ifndef MI_NO_STDARG
#define MI_USE_STDARG
#endif /* MI_NO_STDARG */

#endif /* !MI_HAS_STDC && !MI_NO_STDC */

#endif /* __STDC__ > 0 */

#if !defined(MI_NO_STDC)

#define	MI_HAS_CONST

#ifndef MI_NO_PROTOTYPES
#define	MI_HAS_PROTOTYPES
#endif /* MI_NO_PROTOTYPES */

#endif /* !MI_NO_STDC */

#endif /* __STDC__ */

#if defined(__cplusplus)

#define	MI_HAS_CONST
#define	MI_HAS_SIGNED
#define	MI_HAS_PROTOTYPES

#ifndef MI_NO_STDARG
#define MI_USE_STDARG
#endif /* MI_NO_STDARG */

#define EXTERNC_BEGIN	extern "C" {
#define EXTERNC_END	}

#else /* __cplusplus */

#define EXTERNC_BEGIN
#define EXTERNC_END

#endif /* __cplusplus */

#if !defined(MI_HAS_CONST)
#define const
#endif /* !defined(MI_HAS_CONST) */

#if !defined(MI_HAS_SIGNED)
#define signed
#endif /* !defined(MI_HAS_SIGNED) */

#ifndef ARGS
#ifdef MI_HAS_PROTOTYPES
#define	ARGS(x)	x
#else /* MI_HAS_PROTOTYPES */
#define ARGS(x)	()
#endif /* MI_HAS_PROTOTYPES */
#endif /* !ARGS */

/* Windows compatibility */
#define MI_FAR
#define MI_PASCAL
#define MI_CDECL
#define MI_EXPORT

/*
 * For a Windows DLL, all public functions are pascal convention.
 * Under UNIX, these just expand to nothing.
 */

#define MI_PROC_EXPORT    MI_FAR MI_PASCAL 	       /* public API */
#define MI_PROC_VAEXPORT  MI_FAR MI_CDECL	       /* public varargs API.*/
#define MI_PROC_CALLBACK  MI_FAR MI_PASCAL MI_EXPORT   /* callback function */
#define MI_PROC_VACALLBACK MI_FAR MI_CDECL MI_EXPORT   /* callback function */

/*
 * On NT we use the macro MI_DECL to export all the SAPI functions and instead of
 * NT flag we use NT_MI_SAPI so that it doesnt affect client builds. For server builds
 * we use NT_SERVER to define MI_DECL to __declspec (dllexport)
 *
*/
#ifndef NT_MI_SAPI
#define MI_DECL
#else /* !NT_MI_SAPI */
#ifdef NT_SERVER
#define MI_DECL	__declspec (dllexport)
#else /* NT_SERVER */
#define MI_DECL	__declspec (dllimport)
#endif /* NT_SERVER */
#endif /* !NT_MI_SAPI */

#endif /* _MICONV_H_ */
