/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1997, 2008. All rights reserved.
 *
 *  Title:       miloback.h
 *  Description: MIAPI large object interface (backward compatible)
 *
 ***************************************************************************
 */

#ifndef _MILOBACK_H_
#define _MILOBACK_H_

#include "miback.h"

/*
 * Data Structures
 */

typedef MI_LO_HANDLE	MI_LOHANDLE;
typedef MI_LO_FD	MI_LODESC;

typedef struct mi_lo_info
{
    mi_integer          minfo_len;
    mi_integer          minfo_smgr;
    mi_integer          minfo_asmgr;
    mi_integer          minfo_cnt;
    mi_integer          minfo_lastmod;
    mi_integer          minfo_lastmodusec;
    mi_integer          minfo_archcnt;
    void MI_FAR         *minfo_dummy1;  /* linfo_storage */
    void MI_FAR         *minfo_dummy2;  /* linfo_astorage */
#if !defined(ALPHA_OSF)
    void MI_FAR         *minfo_dummy3;  /* XXX pad */
    void MI_FAR         *minfo_dummy4;  /* XXX pad */
#endif /* !ALPHA_OSF */
} MI_LOINFO;

/* struct returned by mi_large_object_stat */
typedef struct mi_lostat
{
    mi_integer          mist_len;
    MI_LOINFO           mist_loinfo;
    mi_integer          mist_ino;
    mi_integer          mist_mode;
    mi_unsigned_integer mist_size;
    mi_unsigned_integer mist_sizehigh;
    mi_integer          mist_uid;
    mi_integer          mist_atime;
    mi_integer          mist_mtime;
    mi_integer          mist_ctime;
    char                mist_type;
    char                mist_spare1;
    char                mist_spare2;
    char                mist_spare3;
} MI_LOSTAT;

/* Create and Copy Flag */
#define MI_LO_INTERNAL_LO	0x00000000

/* Storage Manager  */
#define MI_LO_NOSMGR		(-1)
#define MI_LO_DEFAULT_SMGR	0

/* Prot flags for Map */
#define MI_LO_PROT_READ		1
#define MI_LO_PROT_WRITE	2

/* flags for Map ('shared' not supported in UDS) */
#define MI_LO_MAP_PRIVATE	2

/* File transfer flags */
#define MI_LO_CLIENT_FILE	MI_O_CLIENT_FILE
#define MI_LO_SERVER_FILE	MI_O_SERVER_FILE

/*
 * Large Object Interface: Function Prototypes
 */

EXTERNC_BEGIN

MI_DECL
MI_LOHANDLE * MI_PROC_EXPORT
mi_large_object_create ARGS((MI_CONNECTION *conn_desc,
                       const char *filename,
                       mi_integer flags,
                       mi_integer mode,
                       mi_integer smgr,
                       mi_integer asmgr));

MI_DECL
MI_LOHANDLE * MI_PROC_EXPORT
mi_large_object_create_opts ARGS((MI_CONNECTION *conn_desc,
                            const char *filename,
                            mi_integer flags,
                            mi_integer mode,
                            mi_integer smgr,
                            mi_integer asmgr,
                            const char *smgropts,
                            const char *asmgropts));

MI_DECL
MI_LODESC MI_PROC_EXPORT
mi_large_object_open ARGS((MI_CONNECTION *conn_desc,
                     MI_LOHANDLE *lo_handle,
                     mi_integer flags));

MI_DECL
MI_LOHANDLE * MI_PROC_EXPORT
mi_large_object_copy ARGS((MI_CONNECTION *conn_desc,
                     MI_LOHANDLE *lo_handle,
                     const char *filename,
                     mi_integer flags,
                     mi_integer mode,
                     mi_integer smgr,
                     mi_integer asmgr));

MI_DECL
MI_LOHANDLE * MI_PROC_EXPORT
mi_large_object_copy_opts ARGS((MI_CONNECTION *conn_desc,
                          MI_LOHANDLE *lo_handle,
                          const char *filename,
                          mi_integer flags,
                          mi_integer mode,
                          mi_integer smgr,
                          mi_integer asmgr,
                          const char *smgropts,
                          const char *asmgropts));

MI_DECL
MI_LOHANDLE * MI_PROC_EXPORT
mi_file_to_large_object ARGS((MI_CONNECTION *conn_desc,
                        char *filename,
                        mi_integer flags,
                        mi_integer smgr,
                        mi_integer asmgr,
                        const char *smgropts,
                        const char *asmgropts));

#if 0 /* not supported */
MI_DECL
MI_LOHANDLE * MI_PROC_EXPORT
mi_large_object_to_lohandle ARGS((mi_large_object *lo));
#endif /* 0 - not supported */

MI_DECL
MI_LOINFO * MI_PROC_EXPORT
mi_large_object_info ARGS((MI_CONNECTION *conn_desc,
                     MI_LOHANDLE *lo_handle));

MI_DECL
MI_LOSTAT * MI_PROC_EXPORT
mi_large_object_stat ARGS((MI_CONNECTION *conn_desc,
                     MI_LODESC lodesc));

MI_DECL
char * MI_PROC_EXPORT
mi_file_to_file ARGS((MI_CONNECTION *conn_desc,
                const char *fromfile,
                mi_integer fromflags,
                const char *tofile,
                mi_integer toflags));

MI_DECL
const char * MI_PROC_EXPORT
mi_large_object_filename ARGS((MI_CONNECTION *conn_desc,
                         MI_LOHANDLE *lohandle,
                         const char *spec));

MI_DECL
const char * MI_PROC_EXPORT
mi_large_object_to_file ARGS((MI_CONNECTION *conn_desc,
                        MI_LOHANDLE *lohandle,
                        const char *spec,
                        mi_integer flags));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_large_object_close ARGS((MI_CONNECTION *conn_desc,
                      MI_LODESC lodesc));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_large_object_decrefcount ARGS((MI_CONNECTION *conn_desc,
                            MI_LOHANDLE *lo_handle));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_large_object_increfcount ARGS((MI_CONNECTION *conn_desc,
                            MI_LOHANDLE *lo_handle));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_large_object_read ARGS((MI_CONNECTION *conn_desc,
                     MI_LODESC lodesc,
                     char *buf,
                     mi_integer nbytes));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_large_object_readwithseek ARGS((MI_CONNECTION *conn_desc,
                             MI_LODESC lodesc,
                             char *buf,
                             mi_integer nbytes,
                             mi_integer off,
                             mi_integer whence));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_large_object_seek ARGS((MI_CONNECTION *conn_desc,
                     MI_LODESC lodesc,
                     mi_integer offset,
                     mi_integer whence));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_large_object_tell ARGS((MI_CONNECTION *conn_desc,
                     MI_LODESC lodesc));

MI_DECL
char * MI_PROC_EXPORT
mi_large_object_map ARGS((MI_CONNECTION *mi_conn,
                    MI_LODESC lodesc,
                    mi_integer len,
                    mi_integer prot,
                    mi_integer off,
                    mi_integer flags));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_large_object_unmap ARGS((MI_CONNECTION *conn_desc,
                      MI_LODESC lodesc,
                      char *addr));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_large_object_write ARGS((MI_CONNECTION *conn_desc,
                      MI_LODESC lodesc,
                      const char *buf,
                      mi_integer len));

#if 0 /* not supported */
MI_DECL
mi_large_object * MI_PROC_EXPORT
mi_lohandle_to_large_object ARGS((MI_LOHANDLE *lohandle));

MI_DECL
mi_varlena * MI_PROC_EXPORT
mi_large_object_handles ARGS((MI_CONNECTION *conn_desc,
                        MI_LOHANDLE * mi_lohandle[],
                        mi_integer cnt));
#endif /* 0 - not supported */

MI_DECL
MI_LOHANDLE * MI_PROC_EXPORT
mi_large_object_expand ARGS((MI_CONNECTION *conn_desc,
                       MI_MULTIREP_DATA *multidata,
                       mi_integer len,
                       mi_integer smgr,
                       mi_integer asmgr,
                       const char *smgropts,
                       const char *asmgropts));

MI_DECL
void * MI_PROC_EXPORT
mi_large_object_pin ARGS((MI_CONNECTION *mi_conn,
                    MI_MULTIREP_SIZE size,
                    MI_MULTIREP_DATA *mptr));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_large_object_unpin ARGS((MI_CONNECTION *mi_conn,
                      MI_MULTIREP_SIZE,
                      MI_MULTIREP_DATA *mptr));

EXTERNC_END

#endif /* _MILOBACK_H_ */
