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
 *  Title:       milo.h
 *  Description: New Large Object Interface for MIAPI
 *
 ***************************************************************************
 */

#ifndef _MILO_H_
#define _MILO_H_

#include "sqlhdr.h"
#include "locator.h"

/* Open Flags
 *
 * Use locator.h values + a couple of our own
 * ifx bits start from low-order, so libmi-specific bits start at high-order
 */
#define MI_LO_APPEND	LO_APPEND
#define MI_LO_WRONLY	LO_WRONLY
#define MI_LO_RDONLY	LO_RDONLY	/* default */
#define MI_LO_RDWR	LO_RDWR
#define MI_LO_DIRTY_READ	LO_DIRTY_READ
#define MI_LO_NODIRTY_READ	LO_NODIRTY_READ

#define MI_LO_RANDOM 	LO_RANDOM	/* default is determined by optimizer */
#define MI_LO_SEQUENTIAL LO_SEQUENTIAL	/* default is determined by optimizer */

#define MI_LO_FORWARD	LO_FORWARD	/* default */
#define MI_LO_REVERSE	LO_REVERSE

#define MI_LO_BUFFER	LO_BUFFER	/* default */
#define MI_LO_NOBUFFER	LO_NOBUFFER

#define MI_LO_LOCKALL	LO_LOCKALL	/* default */
#define MI_LO_LOCKRANGE	LO_LOCKRANGE

#define MI_LO_TRUNC	0x10000000	/* truncate upon open */
#define MI_LO_NOBUFFER_SIZE_THRESHOLD LO_NOBUFFER_SIZE_THRESHOLD

#define MI_LO_OPEN_FLAGS \
    ( LO_APPEND | LO_WRONLY | LO_RDONLY | LO_RDWR | LO_DIRTY_READ \
    | LO_RANDOM | LO_SEQUENTIAL | LO_FORWARD | LO_REVERSE | LO_BUFFER \
    | LO_NOBUFFER | MI_LO_TRUNC | LO_LOCKALL | LO_LOCKRANGE )

/* Symbolic constants for lo_lock and lo_unlock routines */

#define	MI_LO_SHARED_MODE	LO_SHARED_MODE		/* ISSLOCK */
#define	MI_LO_EXCLUSIVE_MODE	LO_EXCLUSIVE_MODE	/* ISXLOCK */
#define	MI_LO_CURRENT_END	LO_CURRENT_END	        /* SB_CURR_LOEND */
#define MI_LO_MAX_END           LO_MAX_END              /* SB_MAX_LOEND */

/* Whence flags for seek */
#define MI_LO_SEEK_SET LO_SEEK_SET /* Set curr. pos. to "offset"           */
#define MI_LO_SEEK_CUR LO_SEEK_CUR /* Set curr. pos. to current + "offset" */
#define MI_LO_SEEK_END LO_SEEK_END /* Set curr. pos. to EOF + "offset"     */

/* File create & transfer flags
 *
 * Use values from locator.h + overload with file location
 * semantics.
 */
#define MI_O_EXCL		LO_O_EXCL    /* fail if file exists */
#define MI_O_APPEND		LO_O_APPEND  /* append to end of file */
#define MI_O_TRUNC		LO_O_TRUNC   /* turncate to 0 if file exists */
#define MI_O_RDWR		LO_O_RDWR    /* read/write (default) */
#define MI_O_RDONLY		LO_O_RDONLY  /* read-only (from-flags only) */
#define MI_O_WRONLY		LO_O_WRONLY  /* write-only (to-flags only) */
#define MI_O_BINARY		LO_O_BINARY  /* write-only (to-flags only) */
#define MI_O_TEXT		LO_O_TEXT    /* text-mode (default off)*/

#define MI_O_CLIENT_FILE	LO_CLIENT_FILE /* default: file is on client */
#define MI_O_SERVER_FILE	LO_SERVER_FILE /* file is on server */

/* Filename Specification */
#define MI_LO_WILDCARD	   '?'
#define MI_LO_NOSUFFIX	   '!'

/* multirep data */
typedef mi_integer MI_MULTIREP_SIZE;
#define MI_MULTIREP_SMALL  0
#define MI_MULTIREP_LARGE  1

#define mi_issmall_data(size)   (!((size) & MI_MULTIREP_LARGE))
#define mi_set_large(size)      ((void) ((size) |= MI_MULTIREP_LARGE))

/* Data Structures */

/* Large Object handle: opaque struct of declared size */
#define MI_LO_SIZE SB_LOCSIZE
typedef struct mi_lo
{
  char dummy[MI_LO_SIZE];
} MI_LO_HANDLE;

/* UUID: opaque struct of declared size */
#define MI_UUID_SIZE 16
typedef struct mi_uuid
{
  char dummy[MI_UUID_SIZE];
} MI_UUID;

/* Descriptor for an open Large Object */
typedef mi_integer MI_LO_FD;

/*
 * MI_MUTLIREP_DATA -
 *
 * Allows user to represent data in a UDT as in-memory or as
 * a large object reference. Calling multirep interface with
 * MI_MULTIREP_SMALL/LARGE indicates which incarnation the
 * given multi-rep obejct is assuming.
 *
 * The mr_pin_addr is for the backwards compatible mi_large_object_pin/unpin
 * calls. It represents the address to reference 'pin'd large object data.
 * The caller is responsible for balancing pin/unpin calls. Failure to do
 * so can result in resource (i.e., memory) leakage.
 *
 * For convenience, #defines are given to allow programers to use
 *
 *	MI_MULTIREP_DATA mr;
 *	...
 *	my_mrlo_func(mr.mr_lo,...);		// uses #define
 *	my_mrdata_func(mr.mr_data,...);
 *	my_mrpindata_func(mr.mr_pin_data,...);	// uses #define
 */
typedef union
{
    void         * mr_data;
    struct _mr_lo_struct
	{
	MI_LO_HANDLE   mr_s_lo;
	void	     * mr_s_pin_addr;
	} mr_lo_struct;
} MI_MULTIREP_DATA;

#define mr_lo		mr_lo_struct.mr_s_lo
#define mr_lo_pin_data	mr_lo_struct.mr_s_pin_addr

#define MI_OLD_LO_IDENSIZE 18
#define MI_LO_IDENSIZE 128

/* stat type */
#define MI_STATMAXLEN 256

typedef struct mi_statretval
{
    mi_unsigned_smallint stattype;
    mi_unsigned_smallint tid;
    mi_unsigned_integer xid;
    MI_MULTIREP_SIZE szind;		/* MI_MULTIREP_SMALL or LARGE */
    mi_unsigned_integer align;
    union _statdata
         {
         MI_MULTIREP_DATA mr;
         mi_char buffer[MI_STATMAXLEN];
         } statdata;
} mi_statret;

#define mi_stat_buf	statdata.buffer
#define mi_stat_mr  	statdata.mr
#define mi_stat_hdrsize	(sizeof(mi_statret)-sizeof(union _statdata))

/* MI_LO_SPEC -- Large Object create-time attributes
 *  Always call mi_lo_spec_init() to allocate and initialize to default values
 *  Call mi_lo_spec_free() to free.
 * The user-accessible fields are:
 *  flags; estimated size in bytes; max size in bytes;
 *  size of extent in kilobytes; sbspace name
 */

typedef struct ifx_lo_create_spec_s MI_LO_SPEC;

/* estimated size [bytes]
 *  mi_integer                              // returns 0 or error
 *  mi_lo_specget_estbytes (MI_LO_SPEC *cspec, mi_int8 *out);
 *  mi_integer                              // returns 0 or error
 *  mi_lo_specset_estbytes (MI_LO_SPEC *cspec, mi_int8 *val);
 */

/* maximum size [bytes]
 *  mi_integer                              // returns 0 or error
 *  mi_lo_specget_maxbytes (MI_LO_SPEC *cspec, mi_int8 *out);
 *  mi_integer                              // returns 0 or error
 *  mi_lo_specset_maxbytes (MI_LO_SPEC *cspec, mi_int8 *val);
 */

/* extent size [kilobytes]
 *  mi_integer                              // returns the size
 *  mi_lo_specget_extsz (MI_LO_SPEC *cspec);
 *  mi_integer                              // returns 0 or error
 *  mi_lo_specset_extsz (MI_LO_SPEC *cspec, mi_integer val);
 */

/* sbspace name
 *  mi_integer                              // returns 0 or error
 *  mi_lo_specget_sbspace (MI_LO_SPEC *cspec, char *outbuf, int outbufsize);
 *  mi_integer                              // returns 0 or error
 *  mi_lo_specset_sbspace (MI_LO_SPEC *cspec, const char *val);
 */

/* flags
 *  mi_integer                              // returns the flags
 *  mi_lo_specget_flags (MI_LO_SPEC *cspec);
 *  mi_integer                              // returns 0 or error
 *  mi_lo_specset_flags (MI_LO_SPEC *cspec, mi_integer flags);
 */

/* the bitflags */
#define MI_LO_ATTR_LOG				LO_ATTR_LOG
#define MI_LO_ATTR_NO_LOG			LO_ATTR_NOLOG
#define MI_LO_ATTR_DELAY_LOG			LO_ATTR_DELAY_LOG
#define MI_LO_ATTR_KEEP_LASTACCESS_TIME		LO_ATTR_KEEP_LASTACCESS_TIME
#define MI_LO_ATTR_NOKEEP_LASTACCESS_TIME	LO_ATTR_NOKEEP_LASTACCESS_TIME
#define MI_LO_ATTR_HIGH_INTEG			LO_ATTR_HIGH_INTEG
#define MI_LO_ATTR_MODERATE_INTEG		LO_ATTR_MODERATE_INTEG
#define MI_LO_ATTR_TEMP				LO_ATTR_TEMP

/* (implemented directly by standard informix library) */
#define mi_lo_specset_flags     ifx_lo_specset_flags
#define mi_lo_specset_def_open_flags     ifx_lo_specset_def_open_flags
#define mi_lo_specset_estbytes  ifx_lo_specset_estbytes
#define mi_lo_specset_maxbytes  ifx_lo_specset_maxbytes
#define mi_lo_specset_extsz     ifx_lo_specset_extsz
#define mi_lo_specset_sbspace	ifx_lo_specset_sbspace

#define mi_lo_specget_flags     ifx_lo_specget_flags
#define mi_lo_specget_def_open_flags     ifx_lo_specget_def_open_flags
#define mi_lo_specget_estbytes  ifx_lo_specget_estbytes
#define mi_lo_specget_maxbytes  ifx_lo_specget_maxbytes
#define mi_lo_specget_extsz     ifx_lo_specget_extsz
#define mi_lo_specget_sbspace	ifx_lo_specget_sbspace

/* MI_LO_STAT -- Large Object dynamic status
 *  Allocated by mi_lo_stat(); call mi_lo_stat_free() to free.
 *  Matches struct ifx_lo_stat from locator.h
 * The user-readable fields are:
 *  current size in bytes; owner uid; last access time;
 *  last modification time; last status change time;
 *  reference count; UDT type code.
 */

typedef struct ifx_lo_stat_s MI_LO_STAT;

/* size --
 *    mi_int8 * mi_lo_stat_size (MI_LO_STAT *stat, mi_int8 *out); // returns out
 * owner --
 *    mi_integer mi_lo_stat_uid (MI_LO_STAT *stat);
 * access time --
 *    mi_integer mi_lo_stat_atime (MI_LO_STAT *stat);
 * mod time --
 *    mi_integer mi_lo_stat_mtime_sec (MI_LO_STAT *stat);
 *    mi_integer mi_lo_stat_mtime_usec (MI_LO_STAT *stat);
 * status change time --
 *    mi_integer mi_lo_stat_ctime (MI_LO_STAT *stat);
 * ref ct --
 *    mi_integer mi_lo_stat_refcnt (MI_LO_STAT *stat);
 * get create spec from the stat --
 *    MI_LO_SPEC * mi_lo_stat_cspec (MI_LO_STAT *stat);
 */

/* (implemented directly by standard informix library) */
#define mi_lo_stat_size         ifx_lo_stat_size
#define mi_lo_stat_uid		ifx_lo_stat_uid
#define mi_lo_stat_atime	ifx_lo_stat_atime
#define mi_lo_stat_mtime_sec	ifx_lo_stat_mtime_sec
#define mi_lo_stat_mtime_usec	ifx_lo_stat_mtime_usec
#define mi_lo_stat_ctime	ifx_lo_stat_ctime
#define mi_lo_stat_refcnt	ifx_lo_stat_refcnt
#define mi_lo_stat_cspec	ifx_lo_stat_cspec

/*
** This is the C binding for the lolist type. Used
** in the lohandles() support function.
*/
typedef struct _mi_lolist
{
    mi_integer lol_cnt;             /* number of handles */
    MI_LO_HANDLE lol_handles[1];    /* array of lol_cnt handles */
} MI_LO_LIST;

/* Function Prototypes */
EXTERNC_BEGIN

/* constructor */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_spec_init ARGS((MI_CONNECTION *conn, MI_LO_SPEC **cspecp));

/* destructor */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_spec_free ARGS((MI_CONNECTION *conn, MI_LO_SPEC *cspec));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_colinfo_by_name ARGS((MI_CONNECTION *conn,
                            const char    *column_spec,
                            MI_LO_SPEC    *cspec));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_colinfo_by_ids ARGS((MI_CONNECTION *conn,
                           MI_ROW	 *row,
                           mi_integer    column_num,
                           MI_LO_SPEC    *cspec));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_validate ARGS((MI_CONNECTION *conn,
		     MI_LO_HANDLE *lohndl));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_invalidate ARGS((MI_CONNECTION *conn,
		       MI_LO_HANDLE *lohndl));

/* Make a new large object; leave open for i/o.
 * Return value is LO descriptor.
 * Also returns LO handle: if (*hbuf) is a (MI_LO_HANDLE *) pointing
 * to a handle buffer, and copy the handle to the buffer.
 * Or, if input (*hbuf == 0), allocate a handle buffer, set (*hbuf) to
 * its address, and copy the handle to the buffer.
 */
MI_DECL
MI_LO_FD MI_PROC_EXPORT                 /* on error returns MI_ERROR */
mi_lo_create ARGS((MI_CONNECTION *conn,
                   MI_LO_SPEC    *spec,   /* in: attributes */
                   mi_integer    flags,  /* in: i/o modes, LO_RDONLY etc */
                   MI_LO_HANDLE **hbuf));  /* in/out - double indirection */

MI_DECL
MI_LO_FD MI_PROC_EXPORT                 /* on error returns MI_ERROR */
mi_lo_copy ARGS((MI_CONNECTION *conn,
		   MI_LO_HANDLE  *srclo,  /* in: source LO for copy */
                   MI_LO_SPEC    *spec,   /* in: attributes */
                   mi_integer    flags,  /* in: i/o modes, LO_RDONLY etc */
                   MI_LO_HANDLE **destlo));  /* in/out - double indirection */

/* open an existing lg obj for i/o */
MI_DECL
MI_LO_FD MI_PROC_EXPORT
mi_lo_open ARGS((MI_CONNECTION *conn,
                 MI_LO_HANDLE  *loptr,   /* in:  establishes the LO to open */
                 mi_integer    flags));   /* in:  access options */

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_close ARGS((MI_CONNECTION *conn, MI_LO_FD lofd));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_release ARGS((MI_CONNECTION *conn,
                    MI_LO_HANDLE *lohandle));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_delete_immediate ARGS((MI_CONNECTION *conn,
			     MI_LO_HANDLE *lohandle));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_delete_immediate ARGS((MI_CONNECTION *conn,
			     MI_LO_HANDLE *lohandle));

/* 0 if equal, 1 if no equal, MI_ERROR on error */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_ptr_cmp ARGS((MI_CONNECTION *conn,
                    MI_LO_HANDLE *loptr1, MI_LO_HANDLE *loptr2));

/* Lock routines */

MI_DECL
mi_integer MI_PROC_EXPORT		/* returns MI_OK or MI_ERROR */
mi_lo_lock ARGS((MI_CONNECTION *conn,
                 MI_LO_FD      lofd,
                 mi_int8       *offset,
		 mi_integer    whence,
                 mi_int8       *range,
                 mi_integer    lockmode));

MI_DECL
mi_integer MI_PROC_EXPORT		/* returns MI_OK or MI_ERROR */
mi_lo_unlock ARGS((MI_CONNECTION *conn,
                 MI_LO_FD      lofd,
		 mi_int8       *offset,
                 mi_integer    whence,
		 mi_int8       *range));

/* I/O routines */

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_seek ARGS((MI_CONNECTION *conn,
                 MI_LO_FD      lofd,
                 mi_int8       *offset,
                 mi_integer    whence,
                 mi_int8       *posn)); /* result */

MI_DECL
mi_integer MI_PROC_EXPORT               /* returns 0 or MI_ERROR */
mi_lo_tell ARGS((MI_CONNECTION *conn,
                 MI_LO_FD      lofd,
                 mi_int8       *posn)); /* result */

MI_DECL
mi_integer MI_PROC_EXPORT               /* returns # bytes read */
mi_lo_read ARGS((MI_CONNECTION *conn,
                 MI_LO_FD      lofd,
                 char          *buf,
                 mi_integer    nbytes));

MI_DECL
mi_integer MI_PROC_EXPORT               /* returns # bytes written */
mi_lo_write ARGS((MI_CONNECTION *conn,
                  MI_LO_FD      lofd,
                  const char    *src,
                  mi_integer    nbytes));

/* combo of seek & (read or write): */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_readwithseek ARGS((MI_CONNECTION *conn,
                         MI_LO_FD      lofd,
                         char          *buf,
                         mi_integer    nbytes,
                         mi_int8       *offset,
                         mi_integer    whence));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_writewithseek ARGS((MI_CONNECTION *conn,
                          MI_LO_FD      lofd,
                          const char    *src,
                          mi_integer    nbytes,
                          mi_int8       *offset,
                          mi_integer    whence));

/* expand and open: returns both FD and HANDLE like mi_lo_create */
MI_DECL
MI_LO_FD MI_PROC_EXPORT                 /* on error returns MI_ERROR */
mi_lo_expand ARGS((MI_CONNECTION    *conn,
                   MI_LO_HANDLE    **hbuf, /* in/out */
                   MI_MULTIREP_DATA *mrptr,  /* in */
                   mi_integer       len,
                   mi_integer       openflags,
                   MI_LO_SPEC       *spec));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_truncate ARGS((MI_CONNECTION *conn,
                     MI_LO_FD      lofd,
                     mi_int8       *offset));

MI_DECL
const char * MI_PROC_EXPORT
mi_lo_filename ARGS((MI_CONNECTION *conn,
                     MI_LO_HANDLE  *loptr,
                     const char    *fname_spec));

/* make a new LO from a file: leaves open.
 * returns both FD and HANDLE like mi_lo_create */
MI_DECL
MI_LO_FD MI_PROC_EXPORT
mi_lo_from_file ARGS((MI_CONNECTION *conn,
                      MI_LO_HANDLE **hbuf,
                      const char    *fname,
                      mi_integer    flags,
                      mi_integer    offset,
                      mi_integer    amount,
                      MI_LO_SPEC    *lospec));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_from_file_by_lofd ARGS((MI_CONNECTION *conn,
			MI_LO_FD lofd,
			const char *fspec,
			mi_integer flags,
			mi_integer offset,
			mi_integer amount));

MI_DECL
const char * MI_PROC_EXPORT
mi_lo_to_file ARGS((MI_CONNECTION *conn,
                    MI_LO_HANDLE  *loptr,
                    const char    *fname_spec,
                    mi_integer    flags,
		    mi_integer	  *size));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_alter ARGS((MI_CONNECTION *conn,
                  MI_LO_HANDLE  *loptr,
                  MI_LO_SPEC    *lospec));

/* constructor */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_stat ARGS((MI_CONNECTION *conn,
                 MI_LO_FD      lofd,
                 MI_LO_STAT    **lostat)); /* out */

/* destructor */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_stat_free ARGS((MI_CONNECTION *conn,
                 MI_LO_STAT    *lostat)); /* in */

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_is_remote ARGS((MI_CONNECTION *conn, MI_LO_HANDLE *loptr,
						mi_integer *is_remote));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_get_server ARGS((MI_CONNECTION *conn, MI_LO_HANDLE *loptr,
						mi_string *servername));
MI_DECL
mi_integer MI_PROC_EXPORT
mi_get_guid ARGS((mi_lvarchar *servername,
					MI_UUID *serverguid));
mi_integer MI_PROC_EXPORT
mi_get_servername_from_guid ARGS((MI_UUID *serverguid,
					mi_lvarchar *servername));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_decrefcount ARGS((MI_CONNECTION *conn, MI_LO_HANDLE *loptr));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_increfcount ARGS((MI_CONNECTION *conn, MI_LO_HANDLE *loptr));

MI_DECL
char MI_PROC_EXPORT
*mi_lo_to_string ARGS((MI_LO_HANDLE *lo));

MI_DECL
MI_LO_HANDLE MI_PROC_EXPORT
*mi_lo_from_string ARGS((char *str));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_lolist_create ARGS( (MI_CONNECTION *conn,
		mi_integer   locnt,
		MI_LO_HANDLE **loptrs,
		MI_LO_LIST   **lolist));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_lo_handle ARGS((mi_unsigned_char1 *datap,
		 MI_LO_HANDLE *refp));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_lo_handle ARGS((mi_unsigned_char1 *datap,
		 MI_LO_HANDLE *refp));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_to_buffer ARGS( (MI_CONNECTION *conn,
			MI_LO_HANDLE	*lop,
			mi_integer	size,
			char		**buffer) );

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_from_buffer ARGS( (MI_CONNECTION *conn,
			MI_LO_HANDLE	*lop,
			mi_integer	size,
			char		*buffer) );

MI_DECL
mi_integer MI_PROC_EXPORT
mi_lo_utimes ARGS((MI_CONNECTION *conn,
                   MI_LO_HANDLE *lop,
                   mi_integer access_sec,
                   mi_integer access_usec,
                   mi_integer mod_sec,
                   mi_integer mod_usec) );

EXTERNC_END

#endif /* _MILO_H_ */

