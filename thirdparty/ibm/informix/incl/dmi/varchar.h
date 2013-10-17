/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1997, 2008. All rights reserved.
 *
 *  Title:       varchar.h
 *  Description: Definitions for VARCHAR and NVARCHAR
 *
 ***************************************************************************
 */

#ifndef VARCHAR_H_INCLUDED
#define VARCHAR_H_INCLUDED

/*
 * VARCHAR macros
 */

#define MAXVCLEN		(255)
#define VCLENGTH(len)		(VCMAX(len)+1)
#define VCMIN(size)		(((size) >> 8) & 0x00ff)
#define VCMAX(size)		((size) & 0x00ff)
#define VCSIZ(max, min)		((((min) << 8) & 0xff00) + ((max) & 0x00ff))

#endif /* VARCHAR_H_INCLUDED */
