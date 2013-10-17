//***************************************************************************
//
//  Licensed Materials - Property of IBM
//
//  "Restricted Materials of IBM"
//
//  IBM Informix Client SDK
//
//  Copyright IBM Corporation 1997, 2007. All rights reserved.
//
//***************************************************************************
//
//               INFORMIX SOFTWARE, INC.
//
//                  PROPRIETARY DATA
//
//  THIS DOCUMENT CONTAINS TRADE SECRET DATA WHICH IS THE PROPERTY OF
//  INFORMIX SOFTWARE, INC.  THIS DOCUMENT IS SUBMITTED TO RECIPIENT IN
//  CONFIDENCE.  INFORMATION CONTAINED HEREIN MAY NOT BE USED, COPIED OR
//  DISCLOSED IN WHOLE OR IN PART EXCEPT AS PERMITTED BY WRITTEN AGREEMENT
//  SIGNED BY AN OFFICER OF INFORMIX SOFTWARE, INC.
//
//  THIS MATERIAL IS ALSO COPYRIGHTED AS AN UNPUBLISHED WORK UNDER
//  SECTIONS 104 AND 408 OF TITLE 17 OF THE UNITED STATES CODE.
//  UNAUTHORIZED USE, COPYING OR OTHER REPRODUCTION IS PROHIBITED BY LAW.
//
//  Title:       it.h
//  Description: Global header file for IBM Informix OIC++ Library
//
//***************************************************************************

#ifndef _IT_H_
#define _IT_H_

// PORTABILITY DEFINITIONS

// To be sure about whether you are compiling under Windows, specify
// IT_WINDOWS; otherwise we will attempt to infer it from the other
// defines.
#if defined(IT_WINDOWS) || defined(_WINDOWS) || defined(_CONSOLE) || defined(_MSC_VER) || defined(WIN32) || defined(_WINDLL)

#ifndef IT_WINDOWS
#define IT_WINDOWS
#endif

#ifndef IT_COM_COMPATIBLE
#define IT_COM_COMPATIBLE
#endif

#ifndef IT_COMPILER_HAS_LONG_LONG
#define IT_COMPILER_HAS_LONG_LONG
#endif
#define IT_LONG_LONG  __int64

#ifndef IT_STATICLIB
#ifdef IT_LIBCOMPILE
#define IT_EXPORTCLASS __declspec(dllexport)
#else // LIBCOMPILE
#define IT_EXPORTCLASS __declspec(dllimport)
#endif // LIBCOMPILE
#else
#define IT_EXPORTCLASS
#endif

#pragma warning(disable : 4355)

#ifdef IT_COM_COMPATIBLE
// For definition of ID_IUnknownID
#pragma comment(lib,"uuid.lib")
#endif

#else // WINDOWS

#define IT_EXPORTCLASS

#ifdef IT_COMPILER_HAS_LONG_LONG
#define IT_LONG_LONG  long long
#endif

#endif // WINDOWS

// Macros to translate compiler specific datatypes correctly,
// e.g. 'bool' and 'long double'.
#ifndef IT_WINDOWS
typedef  bool  ITBool;
#else // WINDOWS
typedef  int  ITBool;
#endif // WINDOWS


#ifndef NULL
#define NULL 0
#endif // NULL

// Some of the classes of the interface refer to LibMI data types
// defined in the mi.h header file
extern "C"
{
#include <mi.h>
}
#undef IGNORE

// Interface forward definitions
#ifndef IT_COM_COMPATIBLE
#define IT_INTERFACE class
#else
#define IT_INTERFACE interface
#endif

#include <itcppval.h>
#include <itcppop.h>

#endif // _IT_H_
