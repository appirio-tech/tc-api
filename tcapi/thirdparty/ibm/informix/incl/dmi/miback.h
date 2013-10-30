/****************************************************************************
 *
 * Licensed Material - Property Of IBM
 *
 * "Restricted Materials of IBM"
 *
 * IBM Informix Client SDK
 * Copyright IBM Corporation 1997, 2008. All rights reserved.
 *
 *  Title:       miback.h
 *  Description: MIAPI backward compatible definitions
 *
 ***************************************************************************
 */

#ifndef _MIBACK_H_
#define _MIBACK_H_

/*
 * SQL Data Types
 */

typedef mi_string     MI_STRING;
typedef MI_ROW *      mi_composite;

/*
 * NOTE for the mi_oid typedef below -
 * Not Supported in IUS! This has no function but to allow certain special
 * case code to compile. See mi_typeoid and mi_funcoid for IUS supported
 * types.
 */

typedef mi_ref        mi_oid;

typedef void (MI_PROC_CALLBACK * MI_VOID) ARGS((MI_EVENT_TYPE type,
                                                MI_CONNECTION MI_FAR *conn,
                                                void MI_FAR *cb_data,
                                                void MI_FAR *user_data));

/*
 * Variable Length Data Types
 */

typedef mi_lvarchar         mi_varlena;
typedef mi_lvarchar         mi_text;
typedef mi_lvarchar         mi_bytea;

/*
 * mi_oid type from LIBMI is now an mi_typeoid for storing type id
 * and an mi_funcoid for storing function id within the MI_FPARAM structure
 */

typedef MI_TYPEID     mi_typeoid;
typedef mi_funcid     mi_funcoid;

/*
 * Varchar Macros: now map to functions
 */

#define MI_GET_TEXTLEN		    mi_get_varlen
#define MI_GET_TEXTDATA		    mi_get_vardata
#define MI_GET_TEXTDATA_ALIGN	    mi_get_vardata_align
#define MI_SET_TEXTLEN		    mi_set_varlen
#define MI_SET_TEXTDATA		    mi_set_vardata
#define MI_SET_TEXTDATA_ALIGN	    mi_set_vardata_align

#define mi_text_to_string	    mi_lvarchar_to_string
#define mi_string_to_text	    mi_string_to_lvarchar
#define mi_varlena_copy		    mi_var_copy
#define mi_text_to_buffer	    mi_var_to_buffer

#define MI_NEW_VAR		    mi_new_var
#define MI_SET_VARPTR		    mi_set_varptr

#define MI_GET_VARLEN		    mi_get_varlen
#define MI_GET_VARDATA              mi_get_vardata
#define MI_GET_VARDATA_ALIGN	    mi_get_vardata_align

#define MI_SET_VARLEN		    mi_set_varlen
#define MI_SET_VARDATA		    mi_set_vardata
#define MI_SET_VARDATA_ALIGN	    mi_set_vardata_align

/*
 * MI_FPARAM Accessors: now map to functions
 */

#define MI_FP_FUNCSTATE                  mi_fp_funcstate
#define MI_FP_SETFUNCSTATE               mi_fp_setfuncstate

#define MI_FP_REQUEST                    mi_fp_request

#define MI_FP_SETISDONE                  mi_fp_setisdone

#define MI_FP_RETURNISNULL(fp)           mi_fp_returnisnull((fp), 0)
#define MI_FP_SETRETURNISNULL(fp, val)   mi_fp_setreturnisnull((fp), 0, (val))

#define MI_FP_NARGS                      mi_fp_nargs
#define MI_FP_SETNARGS                   mi_fp_setnargs

#define MI_FP_ARGISNULL                  mi_fp_argisnull
#define MI_FP_SETARGISNULL               mi_fp_setargisnull

#define MI_FP_SETFUNCOID                 mi_fp_setfuncid

#define MI_FP_ARGTYPEOID                 mi_fp_argtype
#define MI_FP_SETARGTYPEOID              mi_fp_setargtype

#define MI_FP_RETTYPEOID(fparamPtr)      mi_fp_rettype(fparamPtr, 0)
#define MI_FP_SETRETTYPEOID(fparamPtr,typeID) \
                                         mi_fp_setrettype(fparamPtr, 0, typeID)

EXTERNC_BEGIN

/*
 * Callback Functions
 */

MI_DECL
mi_integer MI_PROC_EXPORT
mi_add_callback ARGS((MI_EVENT_TYPE event_type,
                      MI_VOID func,
                      void MI_FAR *user_data));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_delete_callback ARGS((MI_EVENT_TYPE event_type));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_get_callback ARGS((MI_EVENT_TYPE event_type,
                      MI_VOID *ret_function,
                      void MI_FAR * MI_FAR *ret_user_data));

EXTERNC_END

/*
 * Error and Exception Handling
 */

#define mi_error_sql_code mi_error_sql_state

/* server state transitions */

MI_DECL
void  MI_PROC_EXPORT
mi_xact_levels ARGS((void *xe,
		     mi_integer *oldlevel,
		     mi_integer *newlevel));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_xact_state ARGS((void *xe));

#endif /* _MIBACK_H_ */
