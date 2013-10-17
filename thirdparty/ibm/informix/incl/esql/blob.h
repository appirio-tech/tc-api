/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 *
 * Copyright IBM Corporation 1997, 2008. All rights reserved.
 *
 *  Title:       blob.h
 *  Description: Structure for BYTE/TEXT blobs, including Optical
 *
 ***************************************************************************
 */

#ifndef BLOB_DOT_H	/* To handle multiple includes */
#define BLOB_DOT_H

#include "ifxtypes.h"

/*
 * Structure of the BlobLocation
 */

/*
 * blob definitions
 * tblob_t is the data that is stored in the tuple - it describes the blob
 * NOTE: tb_fd is expected to be the first member and TB_FLAGS gives offset
 *       to the tb_flags member.
 */

typedef struct tblob
    {
    int2	tb_fd;		/* blob file descriptor	(must be first) */
    int2        tb_coloff;      /* Blob column offset in row    	*/
    int4	tb_tblspace;	/* blob table space			*/
    int4	tb_start;	/* starting byte			*/
    int4	tb_end;		/* ending byte-0 for end of blob 	*/
    int4        tb_size;        /* Size of blob                 	*/
    int4        tb_addr;        /* Starting Sector or BlobPage  	*/
    int4        tb_family;      /* Family ID                    	*/
    int4        tb_volume;      /* Family Volume                	*/
    int2        tb_medium;      /* Medium - odd if removable    	*/
    uint2       tb_bstamp;      /* first BlobPage Blob stamp    	*/
    int2	tb_sockid;	/* socket id of remote blob		*/
    int2	tb_flags;	/* flags - see below			*/
    int4	tb_reserved1;	/* used tb_sysid			*/
    int4	tb_reserved2;	/* used tb_lockid			*/
    int4	tb_reserved3;	/* used tb_threadid 			*/
    int4	tb_reserved4;	/* used as tb_label			*/
    } tblob_t;

#ifdef OPTICAL
/**
 * for optical blobs, the system id (of the system where the blob was
 * created) is stored in the blob descriptor
 **/
#define tb_sysid        tb_reserved1
#endif /* OPTICAL */

/*
 * for alien blobs a lock id for fragmented tables is required since only a
 * single fragment of the table is being opened
 */
#define tb_lockid        tb_reserved2

/*
 * used by PDQ to determine if the blob row was read by the same thread the
 * blob is being retrieved by
 */
#define tb_threadid         tb_reserved3

/*
 * for identifying the level of the blob. This filed is the partition
 * number of the labeld tablespace, which indicates the level of tuple blob.
*/

#define tb_label	tb_reserved4

#define TB_FAMILY		(2*INTSIZE+5*LONGSIZE)
#define TB_VOLUME		(2*INTSIZE+6*LONGSIZE)
#define TB_FLAGS		(2*INTSIZE+7*LONGSIZE+3*INTSIZE)
#define SIZTBLOB		(11*LONGSIZE + 6*INTSIZE)

/* 'flags' definitions */
#define BLOBISNULL	(0x0001)	/* BLOB is NULL */
#define BLOBALIEN	(0x0002)	/* BLOB is ALIEN */
#define BL_BSBLOB       (0x0004)        /* blob is stored in blobspace */
#define BL_PNBLOB       (0x0008)        /* store in tablespace */
#define BL_DESCRIPTOR	(0x0010)	/* optical BLOB descriptor */
#define BL_CACHE	(0x0040)	/* blob reside in optical cache */
#define BL_FLUSH	(0x0080)	/* blob didn't fit in cache */

#ifdef OPTICAL
#define BL_SUBBLOB      (0x0010)        /* store in Optical Subsystem */
#define BL_BLOBID       (0x0020)        /* transfer the tblob (blob id) */
#endif /* OPTICAL */

#define BL_LOCALBLOB	(0x0040)	/* "remote" blob is actually local */

#ifdef CDR
#define BL_NOCHANGE	(0x0100)	/* blob unchanged after row update */
#endif /* CDR */

#define BL_LOG_ADDR     (0x0200)        /* tb_addr is logical address */
					/* only valid on blobspace blobs */

/*
 * this struture is used to pass "useful" information back to
 * the user.
 */

typedef struct blobinfo
    {
    int4	bi_size;		/* Size of blob			*/
    int4	bi_addr;		/* Starting Sector or BlobPage	*/
    int4 	bi_family;		/* Family ID			*/
    int4 	bi_volume;		/* Family Volume		*/
    int2 	bi_flags;		/* flags 			*/
    int2 	bi_medium;		/* Medium - odd if removable	*/
    } blobinfo_t;

#endif  /* BLOB_DOT_H : To handle multiple includes */

