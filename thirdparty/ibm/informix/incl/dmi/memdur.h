/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1997, 2008. All rights reserved.
 *
 *  Title:      memdur.h
 *  Description:
 * 		Memory duration definitions used by mi_* memory routines
 *		(defined in milib.h) and server internal sapi memory
 *		routines.
 *
 ***************************************************************************
 */

#ifndef _MEMDUR_H_
#define _MEMDUR_H_

/*
 * Memory Durations
 *   These values are used to indicate which memory pool an allocation
 *   should come from. For historical reasons they were assigned as unique
 *   bits, and there is not yet any reason to change this.
 */

typedef enum
{
    PER_NONE	    = 0,	/* none - unused */
    PER_ROUTINE     = 1,    	/* for routine life */
    PER_COMMAND     = 2,     	/* for duration of individual SQL command,
                        	   statements contain commands */
    PER_STMT_92     = 4,        /* reserved */
    PER_TRANSACTION = 8,	/* reserved */
    PER_EXCEPTION   = 16,	/* reserved */
    PER_SESSION     = 32,	/* reserved */
    PER_SYSTEM      = 64,	/* reserved */
    PER_STMT_EXEC   = 128,      /* reserved */
    PER_STMT_PREP   = 256,      /* reserved */
    PER_CURSOR      = 512,	/* reserved */
    PER_CONNECTION  = 1024	/* reserved */
} MI_MEMORY_DURATION;

/* Alias for PER_FUNCTION */
#define PER_FUNCTION 	PER_ROUTINE

#define PER_STATEMENT PER_STMT_92

#endif /* _MEMDUR_H_ */

