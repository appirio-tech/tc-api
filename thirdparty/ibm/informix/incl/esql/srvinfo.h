/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1997, 2008. All rights reserved.
 *
 *  Title:       srvinfo.h
 *  Description: Server information structure and its related macros
 *
 ***************************************************************************
 */

#ifndef SRVINFO_H
#define SRVINFO_H

#include "ifxtypes.h"

#ifdef __cplusplus
extern "C" {
#endif

#define PVNAMELEN	80

typedef struct SrvInfo
	{
	uint4 SQLIVersion;		/* version of SQLI, see sqlmtype.h */
	uint4 TypeList;			/* type of server, bit map */
	uint4 CapList;			/* server's capabilities, bit map */
	uint4 DBList;			/* database characteristics */
	uint4 Reserved1;		/* reserved */
	uint4 Reserved2;		/* reserved */
	char ProdVersion[PVNAMELEN+1];	/* product name */
	} ifx_srvinfo_t;

#define TYP_SE		0x00000001L	/* on if SE, off OnLine */
#define TYP_MT		0x00000002L	/* on if multithreaded */
#define TYP_RDA		0x00000004L	/* on if RDA gateway */
#define TYP_DRDA 	0x00000008L	/* on if DRDA gateway */

/* From OWS group */
#define TYP_OWS       0x00000010L     /* on if OnLine Workgroup Server */

/* From Gateway group - UDJ 01/16/96 */
#define TYP_EDASQL    0x00000020L     /* on if EDA/SQL gateway */
#define TYP_EGM       0x00000040L     /* on if Enterprise Gateway Manager */

#define CAP_NLS		0x00000001L	/* on if NLS ready */
#define CAP_NCHAR	0x00000002L	/* on if able to treat CHAR */
					/* as NCHAR */
#define CAP_MCOLL	0x00000004L	/* on if multiple coll seq */
#define CAP_MLANG	0x00000008L	/* on if multiple lang */
#define CAP_MBYTE	0x00000010L	/* on if multiple byte */
#define CAP_STAR	0x00000020L	/* on if distributed capable */
#define CAP_XA		0x00000040L	/* on if XA capable */

/*
 * Public IFX functions to obtain server info.
 */

extern	mint ifx_srvinfo(ifx_srvinfo_t *info);

#ifdef __cplusplus
}
#endif /* __cplusplus */

#endif /* SRVINFO_H */
