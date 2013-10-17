/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1998, 2008. All rights reserved.
 *
 *  Title:       locator.h
 *
 *  Description: Type definitions for both BYTE/TEXT and BLOB/CLOB blobs
 *
 ***************************************************************************
 */

#ifndef LOCATOR_INCL		/* avoid multiple includes */
#define LOCATOR_INCL

#include "ifxtypes.h"

#include "int8.h"

/*
Locators are used to store TEXT or BYTE fields (blobs) in ESQL
programs.  The "loc_t" structure is described below.  Fields denoted
USER should be set by the user program and will be examined by the DBMS
system.  Those denoted SYSTEM are set by the system and may be examined
by the user program.  Those denoted INTERNAL contain data only the
system manipulates and examines.

If "loc_loctype" is set to LOCMEMORY, then the blob is stored in
primary memory.  The memory buffer is pointed to by the variant
"loc_buffer".  The field "loc_bufsize" gives the size of "loc_buffer".
If the "loc_bufsize" is set to "-1" and "loc_mflags" is set to "0"
and the locator is used for a fetch, memory is obtained using "malloc"
and "loc_buffer" and "loc_bufsize" are set.

If "loc_loctype" is set to LOCFILE, then the blob is stored in a file.
The file descriptor of an open operating system file is specified in
"loc_fd".

If "loc_loctype" is set to LOCFNAME, the the blob is stored in a file
and the name of the file is given.  The DBMS will open or create the
file at the correct time and in the correct mode.

If the "loc_loctype" is set to LOCUSER, "loc_(open/close/read/write)"
are called.  If the blob is an input to a SQL statement, "loc_open" is
called with the parameter "LOC_RONLY".  If the blob is an output target
for an SQL statement, "loc_open" is called with the parameter
"LOC_WONLY".

"loc_size" specifies the maximum number of bytes to use when the
locator is an input target to an SQL statement. It specifies the number
of bytes returned if the locator is an output target.  If "loc_loctype"
is LOCFILE or LOCUSER, it can be set to -1 to indicate transfer until
end-of-file.

"loc_indicator" is set by the user to -1 to indicate a NULL blob.  It
will be  set to -1 if a NULL blob is retrieved.  If the blob to be
retrieved will not fit in the space provided, the indicator contains
the size of the blob.

"loc_status" is the status return of locator operations.

"loc_type" is the "blob" type (SQLTEXT, SQLBYTES, ...).

"loc_user_env" is a pointer for the user's private use. It is neither
set nor examined by the system.  "loc_user_env" as well as the
"loc_union" fieds may be used by user supplied routines to store and
communicate information.
*/

typedef struct tag_loc_t
    {
    int2 loc_loctype;		/* USER: type of locator - see below	*/
    union			/* variant on 'loc'                     */
	{
	struct			/* case LOCMEMORY                       */
	    {
	    int4  lc_bufsize;	/* USER: buffer size */
	    char *lc_buffer;	/* USER: memory buffer to use		*/
	    char *lc_currdata_p;/* INTERNAL: current memory buffer	*/
	    mint   lc_mflags;	/* USER/INTERNAL: memory flags		*/
				/*			(see below)	*/
	    } lc_mem;

	struct			/* cases L0CFNAME & LOCFILE		*/
	    {
	    char *lc_fname;	/* USER: file name			*/
	    mint  lc_mode;	/* USER: perm. bits used if creating	*/
	    mint  lc_fd;	/* USER: os file descriptior		*/
	    int4  lc_position;	/* INTERNAL: seek position		*/
	    } lc_file;
	} lc_union;

    int4  loc_indicator;	/* USER SYSTEM: indicator		*/
    int4  loc_type;		/* USER SYSTEM: type of blob		*/
    int4  loc_size;		/* USER SYSTEM: num bytes in blob or -1	*/
    mint  loc_status;		/* SYSTEM: status return of locator ops	*/
    char *loc_user_env;		/* USER: for the user's PRIVATE use	*/
    int4  loc_xfercount;	/* INTERNAL/SYSTEM: Transfer count	*/

    mint (*loc_open)(struct tag_loc_t *loc, mint flag, mint bsize);
    mint (*loc_close)(struct tag_loc_t *loc);
    mint (*loc_read)(struct tag_loc_t *loc, char *buffer, mint buflen);
    mint (*loc_write)(struct tag_loc_t *loc, char *buffer, mint buflen);

    mint   loc_oflags;		/* USER/INTERNAL: see flag definitions below */
	} ifx_loc_t;

#if !defined(IFX_DISABLE_LOC_T)
#if !defined(_AIX) || defined(IFX_COL_T) || !defined(_H_LOCALEDEF)

typedef  ifx_loc_t loc_t;

#if defined(_AIX)
/* ensure that col_t is taken from catalog.h */
#ifndef IFX_LOC_T
#define IFX_LOC_T
#endif /* IFX_LOC_T */

/* prevent the including /usr/include/sys/localedef31.h after locator.h */
#ifndef _H_LOCALEDEF
#define _H_LOCALEDEF
#endif /* _H_LOCALEDEF */
#endif /* _AIX */

#endif /* !_AIX || !_H_LOCALEDEF */
#endif /* !IFX_DISABLE_LOC_T */

    #define loc_fname	lc_union.lc_file.lc_fname
    #define loc_fd		lc_union.lc_file.lc_fd
    #define loc_position	lc_union.lc_file.lc_position
    #define loc_bufsize	lc_union.lc_mem.lc_bufsize
    #define loc_buffer	lc_union.lc_mem.lc_buffer
    #define loc_currdata_p	lc_union.lc_mem.lc_currdata_p
    #define loc_mflags	lc_union.lc_mem.lc_mflags

    /* Enumeration literals for loc_loctype */

    #define LOCMEMORY	1		/* memory storage */
    #define LOCFNAME	2		/* File storage with file name */
    #define LOCFILE		3		/* File storage with fd */
    #define LOCUSER		4		/* User define functions */

    /* passed to loc_open and stored in loc_oflags */
    #define LOC_RONLY	0x1		/* read only */
    #define LOC_WONLY	0x2		/* write only */

    /* LOC_APPEND can be set when the locator is created
     * if the file is to be appended to instead of created
     */
    #define LOC_APPEND	0x4		/* write with append */
    #define LOC_TEMPFILE	0x8		/* 4GL tempfile blob */

/* LOC_USEALL can be set to force the maximum size of the blob to always be
 * used when the blob is an input source.  This is the same as setting the
 * loc_size field to -1.  Good for LOCFILE or LOCFNAME blobs only.
 */
#define LOC_USEALL	0x10		/* ignore loc_size field */
#define LOC_DESCRIPTOR	0x20		/* BLOB is optical descriptor */

/* length of the encoded descriptor text */
#define LOC_DESCRIPTOR_SIZE 112

/* passed to loc_open and stored in loc_mflags */
#define LOC_ALLOC	0x1		/* free and alloc memory */

/*******************************************************************************
 *
 * Smartblob Definitions
 *
 ******************************************************************************/

/* Flags to indicate if file is on the server or client */
#define LO_CLIENT_FILE  0x20000000
#define LO_SERVER_FILE  0x10000000

/*******************************************************************************
 * File open flags used for operating system file open via
 *	- ifx_lo_copy_to_lo
 *	- ifx_lo_copy_to_file
 *	- ifx_file_to_file
 *
 ******************************************************************************/

#define LO_O_EXCL             0x00000001 /* fail if file exists */
#define LO_O_APPEND           0x00000002 /* append to end of file */
#define LO_O_TRUNC            0x00000004 /* turncate to 0 if file exists */
#define LO_O_RDWR             0x00000008 /* read/write (default) */
#define LO_O_RDONLY           0x00000010 /* read-only (from-flags only) */
#define LO_O_WRONLY           0x00000020 /* write-only (to-flags only) */
#define LO_O_BINARY           0x00000040 /* binary-mode (default) */
#define LO_O_TEXT             0x00000080 /* text-mode (default off)*/

/******************************************************************************
 * Open flags: see ESQL/C documentation for further explanation.
 *
 * LO_APPEND - Positions the seek position to end-of-file + 1. Affects write
 * operations. Reads can still seek anywhere in the LO. Writes always append.
 *
 * LO_SEQUENTIAL - If set overrides optimizer decision. Indicates that
 * reads are sequential in either forward or reverse direction.
 *
 * LO_RANDOM - If set overrides optimizer decision. Indicates that I/O is
 * random and that the system should not read-ahead.
 * LO_FORWARD - Only used for sequential access. Indicates that the sequential
 * access will be in a forward direction, i.e. from low offset to higher offset.
 * LO_REVERSE - Only used for sequential access. Indicates that the sequential
 * access will be in a reverse direction.
 *
 * LO_BUFFER - If set overrides optimizer decision. I/O goes through the
 * buffer pool.
 *
 * LO_NOBUFFER - If set then I/O does not use the buffer pool.
 ******************************************************************************/

#define LO_APPEND	0x1
#define LO_WRONLY 	0x2
#define LO_RDONLY 	0x4	/* default */
#define LO_RDWR   	0x8
#define LO_DIRTY_READ	0x10

#define LO_RANDOM	0x20	/* default is determined by optimizer */
#define LO_SEQUENTIAL	0x40	/* default is determined by optimizer */

#define LO_FORWARD	0x80	/* default */
#define LO_REVERSE	0x100

#define LO_BUFFER	0x200	/* default is determined by optimizer */
#define LO_NOBUFFER	0x400	/* default is determined by optimizer */
#define LO_NODIRTY_READ 0x800

#define	LO_LOCKALL	0x1000	/* default */
#define	LO_LOCKRANGE	0x2000

#ifndef REMOVE_VECTORIO
#define LO_VECTORIO     0x4000
#endif

/*
 *  Another set of open flags are defined to make the flags more meaningful
 */

#define LO_OPEN_APPEND       LO_APPEND
#define LO_OPEN_WRONLY       LO_WRONLY
#define LO_OPEN_RDONLY       LO_RDONLY     /* default */
#define LO_OPEN_RDWR         LO_RDWR
#define LO_OPEN_DIRTY_READ   LO_DIRTY_READ

#define LO_OPEN_RANDOM       LO_RANDOM      /* default is determined by optimizer */
#define LO_OPEN_SEQUENTIAL   LO_SEQUENTIAL  /* default is determined by optimizer */

#define LO_OPEN_FORWARD      LO_FORWARD    /* default */
#define LO_OPEN_REVERSE      LO_REVERSE

#define LO_OPEN_BUFFER       LO_BUFFER     /* default is determined by optimizer */
#define LO_OPEN_NOBUFFER     LO_NOBUFFER   /* default is determined by optimizer */
#define LO_OPEN_NODIRTY_READ LO_NODIRTY_READ

#define LO_OPEN_LOCKALL      LO_LOCKALL  /* default */
#define LO_OPEN_LOCKRANGE    LO_LOCKRANGE

/* When setting the MI_LO_NOBUFFER flag for write operations, please
 * don't set this flag if the object is small. It usually causes a synchronous
 * flush of the log and a synchronous flush of pages written - this is
 * very slow. Instead use buffered I/O for small writes.
 */
#define LO_NOBUFFER_SIZE_THRESHOLD 8080

/*see Informix internal use file /vobs/tristarp/incl/sblob.h for other flags*/

/*******************************************************************************
 * LO create-time flags:
 *
 * Bitmask - Set/Get via ifx_lo_specset_flags() on ifx_lo_create_spec_t.
 *
 * New applications should use the flags which begin LO_ATTR_
 * The second set of flags are defined for backward compatibility only.
 ******************************************************************************/

#define LO_ATTR_LOG                          0x0001
#define LO_ATTR_NOLOG                        0x0002
#define LO_ATTR_DELAY_LOG                    0x0004
#define LO_ATTR_KEEP_LASTACCESS_TIME         0x0008
#define LO_ATTR_NOKEEP_LASTACCESS_TIME       0x0010
#define LO_ATTR_HIGH_INTEG                   0x0020
#define LO_ATTR_MODERATE_INTEG               0x0040
#define LO_ATTR_TEMP                         0x0080

/* these 7 values are defined for backward compatibility only */
#define LO_LOG                          0x0001
#define LO_NOLOG                        0x0002
#define LO_DELAY_LOG                    0x0004
#define LO_KEEP_LASTACCESS_TIME         0x0008
#define LO_NOKEEP_LASTACCESS_TIME       0x0010
#define LO_HIGH_INTEG                   0x0020
#define LO_MODERATE_INTEG               0x0040
#define LO_TEMP                         0x0080

/* these flags are defined to make the create flags more meaningful */
#define LO_CREATE_LOG                          0x0001
#define LO_CREATE_NOLOG                        0x0002
#define LO_CREATE_DELAY_LOG                    0x0004
#define LO_CREATE_KEEP_LASTACCESS_TIME         0x0008
#define LO_CREATE_NOKEEP_LASTACCESS_TIME       0x0010
#define LO_CREATE_HIGH_INTEG                   0x0020
#define LO_CREATE_MODERATE_INTEG               0x0040
#define LO_CREATE_TEMP                         0x0080

/*******************************************************************************
 * Symbolic constants for the "lseek" routine
 ******************************************************************************/

#define LO_SEEK_SET 0   /* Set curr. pos. to "offset"           */
#define LO_SEEK_CUR 1   /* Set curr. pos. to current + "offset" */
#define LO_SEEK_END 2   /* Set curr. pos. to EOF + "offset"     */

/*******************************************************************************
 * Symbolic constants for lo_lock and lo_unlock routines.
 ******************************************************************************/

#define	LO_SHARED_MODE		1	/* ISSLOCK */
#define	LO_EXCLUSIVE_MODE	2	/* ISXLOCK */

#define	LO_MAX_END		-1
#define	LO_CURRENT_END		-2

/*******************************************************************************
 * ifx_lo_create_spec_t:
 *
 * This is an opaque structure used for creating smartblobs. The
 * user may examine and/or set certain fields herein by using
 * ifx_lo_spec[set|get]_* accessor functions. Prototypes for these accessors
 * are in sqlhdr.h
 *
 ******************************************************************************/

typedef struct ifx_lo_create_spec_s ifx_lo_create_spec_t;

/*******************************************************************************
 * ifx_lo_t: A dummy opaque representation of the smartblob structure
 *
 * This can be used for stack or in-line structure declarations.
 *
 ******************************************************************************/
#define SB_LOCSIZE 72 /* length of ifx_lo_t */

typedef struct ifx_lo_ts
{
    char dummy[SB_LOCSIZE];
} ifx_lo_t;

/*******************************************************************************
 * ifx_lo_stat:
 *
 * This is an opaque structure used in querying attributes of smartblobs. The
 * user may examine fields herein by using ifx_lo_stat_* accessor functions.
 * Prototypes for these accessors are in sqlhdr.h
 *
 * The accessors are defined as follows:
 *     ifx_lo_stat_size: contains the size of the LO in bytes.
 *     ifx_lo_stat_uid: reserved for future use: the user id for the
 *         owner of the LO.
 *     ifx_lo_stat_atime: the time of last access. This is only maintained if
 *         the LO_KEEP_LASTACCESS_TIME flag is set for the LO.
 *         Resolution is seconds.
 *     ifx_lo_stat_mtime: the time of last modification. Resolution is
 *         seconds.
 *     ifx_lo_stat_ctime: the time of the last status change (this includes
 *         updates, changes in ownership, and changes to the number of
 *         references).  Resolution is seconds. See Appendix B2.11,
 *         Future Embedded- language feature issues, Smartblob API
 *         functions using lofd, for enhancements that extend support
 *         for named and external LOs.
 *     ifx_lo_stat_refcnt: the number of pointers to this LO - when 0 the LO is
 *         typically deleted. See deletion criteria.
 *     ifx_lo_stat_cspec: a pointer to the opaque create spec for this object.
 *         (see ifx_lo_spec[get|set]_ accessors for details.)
 *     ifx_lo_stat_type: the 8 byte code for the LO's type
 *
 ******************************************************************************/

typedef struct ifx_lo_stat_s ifx_lo_stat_t;

#endif	/* LOCATOR_INCL */
