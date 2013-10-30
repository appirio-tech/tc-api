/*                                                                        *
 *  Licensed Materials - Property of IBM                                  *
 *                                                                        *
 *  "Restricted Materials of IBM"                                         *
 *                                                                        *
 *  IBM Informix Dynamic Server                                           *
 *  (c) Copyright IBM Corporation 1996, 2008 All rights reserved.         *
 *                                                                        *
***************************************************************************
 *
 *  Title:      milib.h
 *  Description:
 *              MIAPI constants, enums, data structures, and prototypes
 *
 ***************************************************************************
 */

#ifndef _MILIB_H_
#define _MILIB_H_


#ifndef _MITYPES_H_
#include "mitypes.h"
#endif /* _MITYPES_H_ */

#ifndef _MEMDUR_H_
#include "memdur.h"
#endif /* _MEMDUR_H_ */


/* 
 * Define NULL if we don't have it yet 
 */
#ifndef NULL
#define NULL	0
#endif /* NULL */

/*
 * Asynchronous action possibilities
 */

typedef enum mi_async_action
{
    MI_AS_NONE,
    MI_AS_RESULT,
    MI_AS_ROW,
    MI_AS_ERROR,
    MI_AS_DEAD,
    MI_AS_UNKNOWN
} MI_ASYNC_ACTION;


/*
 * Callbacks
 */

typedef enum mi_event_type
{
    MI_EVENT_SAVEPOINT  	  = -3, /* For new savepoint CB Test */
    MI_EVENT_COMMIT_ABORT         = -2, /* Reserved */
    MI_All_Events                 = -1,	/* Special All Events flag */
    MI_Exception	  	  = 0,	/* an exception, (server error) */
    MI_Alerter_Fire_Msg	          = 1,	/* An alerter callback */
    MI_Delivery_Status_Msg        = 2,	/* A Delivery Status callback */
    MI_Query_Interrupt_Ack        = 3,	/* A Query Interrupt acknowledgement */
    MI_Client_Library_Error       = 4,	/* Client-side library errors */
    MI_Xact_State_Change	  = 5,	/* Transaction State Change */
    MI_Print    		  = 6,	/* print a text string */
    MI_Request		          = 7,	/* prompt for & get a user response */
    MI_EVENT_END_STMT             = 8,  /* Callback event for end of
					   statement */
    MI_EVENT_END_SESSION          = 9,  /* Callback event for end of session */
    MI_EVENT_END_XACT             = 10, /* Callback event end of transaction 
					   when memory is freed */
    MI_EVENT_POST_XACT            = 11, /* Reserved */
    MI_EVENT_MAX                  = 12,


     /* synonyms, for backwards compatibility: */
    MI_EVENT_ALL_EVENTS           = MI_All_Events,
    MI_EVENT_EXCEPTION            = MI_Exception,
    MI_EVENT_ALERTER_FIRE_MSG     = MI_Alerter_Fire_Msg,
    MI_EVENT_DELIVERY_STATUS_MSG  = MI_Delivery_Status_Msg,
    MI_EVENT_QUERY_INTERRUPT_ACK  = MI_Query_Interrupt_Ack,
    MI_EVENT_CLIENT_LIBRARY_ERROR = MI_Client_Library_Error,
    MI_EVENT_XACT_STATE_CHANGE    = MI_Xact_State_Change,
    MI_EVENT_PRINT                = MI_Print,
    MI_EVENT_REQUEST              = MI_Request 
  
} MI_EVENT_TYPE;

/* 
 * Valid Callback Retcodes 
 */


typedef enum mi_callback_status 
{ 
    MI_CB_CONTINUE    = 0,
    MI_CB_EXC_HANDLED = 1
} MI_CALLBACK_STATUS;


/*
 * Cursors
 */


/* Masks for cursor definition */

#define MI_BINARY               0x0001   /* return result in binary  */ 
#define MI_SEND_SENSITIVE       0x0002   /* cursor is sensitive      */ 
#define MI_SEND_READ            0x0004   /* cursor is readonly       */ 
#define MI_SEND_SCROLL          0x0008   /* cursor is scrollable     */ 
#define MI_SEND_REOPT           0x0010   /* reoptimizing cursor      */ 
#define MI_SEND_HOLD            0x0020   /* hold cursor              */ 

/* Used with parameterized queries and cursors. */

typedef enum mi_cursor_action
{
    MI_CURSOR_NEXT,
    MI_CURSOR_PRIOR,
    MI_CURSOR_FIRST,
    MI_CURSOR_LAST,
    MI_CURSOR_ABSOLUTE,
    MI_CURSOR_RELATIVE,
    MI_CURSOR_CURRENT
} MI_CURSOR_ACTION;

/* 
 * Different types of ID's
 */
typedef enum mi_id
{
    MI_SESSION_ID,
    MI_STATEMENT_ID
} MI_ID;


/*
 * Func Call (Client Function Types)
 */


typedef enum mi_functype
{
    MI_C_FUNC,
    MI_VISUAL_BASIC_FUNC,
    MI_PASCAL_FUNC
} MI_FUNCTYPE;


/*
 * Error Raise Levels
 */


#define MI_MESSAGE	1 
#define MI_NOTICE       MI_MESSAGE
#define MI_EXCEPTION	2
#define MI_WARN         MI_EXCEPTION
#define MI_SQL	        3
#define MI_FATAL        4


/*
 * Library Errors
 */


#define MI_LIB_BADARG	5	/* Bad arg to LIBMI function */
#define MI_LIB_USAGE	6	/* Bad LIB usage sequence  */
#define MI_LIB_INTERR	7	/* Internal error */
#define MI_LIB_NOIMP	8	/* feature not implemented */
#define MI_LIB_DROPCONN	9	/* Connection to server lost */
#define MI_LIB_BADSERV	10	/* Can't connect to server */


/*
 * Execution modes
 */


/* Masks for mi_exec() */

#define MI_QUERY_NORMAL		0x0000	/* string rep return values */
#define MI_QUERY_BINARY		0x0001	/* binary return values */


/*
 * Return values from mi_get_result()
 */


#define MI_ERROR		(mi_integer)(-1)
#define MI_NO_MORE_RESULTS	(mi_integer)0
#define MI_ROWS		        (mi_integer)1
#define MI_DML		        (mi_integer)3
#define MI_DDL		        (mi_integer)4
#define MI_FUNCTION_RESULTS	(mi_integer)5
#define MI_END_OF_DATA		(mi_integer)6
#define MI_OK		        (mi_integer)0
#define MI_TIMEOUT		(mi_integer)7

/*
 * Special return value for the streamwrite() and streamread() support
 * UDR's.  These UDR's should return MI_MISSING_DATA instead of MI_OK or
 * MI_ERROR when the streamwrite() routine could not access out-of-row
 * data.
 */

#define MI_MISSING_DATA     (mi_integer) -2

/*
 * Return values for mi_tab_check_msg
 */
#define MI_INVALID_CALL         (mi_integer)1


/*
 * Return values for mi_value()
 */


#define MI_NORMAL_VALUE		        0x0000
#define MI_NULL_VALUE		        0x0001
#define MI_ROW_VALUE		        0x0002
#define MI_COLLECTION_VALUE             0x0003

/*
 * Return value for mi_call routine
 */
 
#define MI_MAXARGS             (mi_integer)10
#define MI_NOMEM               (mi_integer)-1  /* Same as defined in mt.h */
#define MI_DONE                (mi_integer)0   /* Same as defined in mt.h */
#define MI_CONTINUE            (mi_integer)1
#define MI_TOOMANY             (mi_integer)2   /* Too many argments */

/*
 * Return values for: (also use MI_ERROR and MI_OK)
 *
 *	mi_named_alloc()
 *	mi_named_zalloc()
 *	mi_named_get()
 *	mi_lock_memory()
 *	mi_unlock_memory()
 *	mi_try_lock_memory()
 * 
 */
#define MI_NAME_ALREADY_EXISTS	(mi_integer)1
#define MI_NO_SUCH_NAME	        (mi_integer)2
#define MI_LOCK_IS_BUSY		(mi_integer)3
#define MI_POTENTIAL_DEADLOCK	(mi_integer)4


/*
 * Set Requests
 */


typedef enum mi_setrequest
{
    SET_INIT,
    SET_RETONE,
    SET_END,
    SET_INVALID
} MI_SETREQUEST;


/*
 * Miscellaneous
 */


#define MI_TRUE          ((mi_boolean) 1)
#define MI_FALSE         ((mi_boolean) 0)
#define MI_READ_ALL_ROWS -999
#define MI_CURRENT_CLASS -999	


/*
 * Transition states for callbacks
 */
typedef enum
{
    MI_BEGIN,
    MI_NORMAL_END,
    MI_ABORT_END
} MI_TRANSITION_TYPE;

#define MI_XACT_BEGIN  MI_BEGIN
#define MI_XACT_END    MI_NORMAL_END
#define MI_XACT_ABORT  MI_ABORT_END


/*
 * Return values for mi_transaction_state
 */
#define MI_NO_XACT       0
#define MI_EXPLICIT_XACT 1
#define MI_IMPLICIT_XACT 2


/*
 * Cast Status values set in mi_cast_get()
 */

#define MI_NO_CAST       0
#define MI_NOP_CAST      1
#define MI_SYSTEM_CAST   2
#define MI_UDR_CAST      3
#define MI_EXPLICIT_CAST 4
#define MI_IMPLICIT_CAST 5
#define MI_ERROR_CAST    6

/* Errors for ax_reg() */

#define MI_INVALID_XANAME          (mi_integer) -9265
#define MI_NOTINTX                 (mi_integer) -9266
#define MI_NOSUCH_XASOURCE         (mi_integer) -9267
#define MI_NOSUCH_XASRC_REGISTERED (mi_integer) -9268
#define MI_XAOPEN_ERROR            (mi_integer) -9269

/*
 * Values for udr_type in mi_routine_get_by_typeid()
 */

typedef enum mi_udr_type
{ 
    MI_FUNC,
    MI_PROC
} MI_UDR_TYPE;

/*
 * Flags for mi_routine_get
 */
#define MI_RG_CACHE_REMOTE	0x1


/* flag values for mi_dbcreate() */
typedef enum mi_dbcreate_flags
{
    MI_DBCREATE_DEFAULT,
    MI_DBCREATE_LOG,
    MI_DBCREATE_LOG_BUFFERED,
    MI_DBCREATE_LOG_ANSI
} MI_DBCREATE_FLAGS;


/*
 * Parameter types for function argument API
 */
typedef enum mi_funcarg_type
{
    MI_FUNCARG_COLUMN,
    MI_FUNCARG_CONSTANT,
    MI_FUNCARG_PARAM
} MI_FUNCARG_TYPE;


/*
 * option selectors for mi_get_connection_option()
 */

/* True if current DB is an ANSI DB */
#define MI_IS_ANSI_DB		1000
/* True if current DB is in exclusive mode */
#define MI_IS_EXCLUSIVE_DB	1001
/* True if current DB is unlogged */
#define MI_IS_LOGGED_DB		1002

/*
 * CloudSync specific flags
 */
#define MI_CLOUDSYNC_CB1	0x00010000

/*
 * options bitmasks
 */
#define MI_CALLBACK_GENERIC	0x00000000
#define MI_CALLBACK_LAST	0x00000001
#define MI_CALLBACK_NODUPS	0x00000002
#define MI_CALLBACK_IDMASK	MI_CLOUDSYNC_CB1

/*
 * Trigger Events.
 */


#define MI_TRIGGER_NOT_IN_EVENT   0x0000
#define MI_TRIGGER_INSERT_EVENT   0x0001
#define MI_TRIGGER_DELETE_EVENT   0x0002
#define MI_TRIGGER_UPDATE_EVENT   0x0004
#define MI_TRIGGER_SELECT_EVENT   0x0008
#define MI_TRIGGER_BEFORE_EVENT   0x0010
#define MI_TRIGGER_AFTER_EVENT    0x0020
#define MI_TRIGGER_FOREACH_EVENT  0x0040
#define MI_TRIGGER_INSTEAD_EVENT  0x0080
#define MI_TRIGGER_REMOTE_EVENT   0x0100

/*
 * Option for mi_trigger_tabname.
 *
 */
#define MI_TRIGGER_CURRENTTABLE	0x0000
#define MI_TRIGGER_TOPTABLE	0x0001
#define MI_TRIGGER_TABLENAME	0x0002
#define MI_TRIGGER_OWNERNAME	0x0004
#define MI_TRIGGER_DBASENAME	0x0008
#define MI_TRIGGER_SERVERNAME	0x0010
#define MI_TRIGGER_FULLNAME	0x0020

/*
 * HDR states.
 */

#define MI_HDR_ON               0x01
#define MI_HDR_PRIMARY          0x02
/* 
 * Both MI_HDR_SECONDARY and MI_SECONDARY designate if the server is any kind
 * of secondary node.  Prior to IDS 11.50 there was only one secondary type, 
 * the HDR secondary.
 */
#define MI_HDR_SECONDARY        0x04 /* for backwards compatibility */ 
#define MI_SECONDARY            0x04 /* recommended over MI_HDR_SECONDARY */
/* 
 * MI_HDR_SEC_NODE designates if the server is exactly and only an HDR 
 * secondary node (and not another secondary type node).
 */
#define MI_HDR_SEC_NODE         0x08
#define MI_RSS_SECONDARY        0x10
#define MI_SDS_SECONDARY        0x20
#define MI_UPDATABLE_SECONDARY  0x40


/*
 * Data structures.
 */


/* Type Information */

typedef struct mi_type_desc     MI_TYPE_DESC;
#ifndef MI_TYPEID
typedef struct mi_typeid        MI_TYPEID;
#endif /* MI_TYEPID */

/* Variable Length Data Types */

/* SQL types-expose lowercase structure names, all the rest-expose uppercase */

typedef struct MI_BITVARYING     mi_bitvarying;
typedef struct MI_LVARCHAR       mi_lvarchar;             
typedef struct MI_SENDRECV       mi_sendrecv; 
typedef struct MI_DBSENDRECV     mi_dbsendrecv;
typedef struct MI_SRVSENDRECV    mi_srvsendrecv;
typedef struct MI_IMPEXP         mi_impexp;
typedef struct MI_IMPEXPBIN      mi_impexpbin;

/* Rows, Columns and Composites and SaveSets */

typedef struct mi_save_set     MI_SAVE_SET;


typedef struct   mi_statement       MI_STATEMENT;
typedef struct   mi_querydesc       MI_QUERYDESC;
typedef struct   mi_error_desc      MI_ERROR_DESC;
typedef struct   mi_callback_handle MI_CALLBACK_HANDLE;
typedef struct   mi_row        	    MI_ROW;
typedef struct   mi_row_desc        MI_ROW_DESC;

/* MI_FPARAM, Function Descriptor and Callbacks */

typedef struct mi_fp_typeinfo    MI_FP_TYPEINFO;
typedef mi_integer               mi_funcid;
typedef struct mi_func_desc      MI_FUNC_DESC;
typedef struct mi_fparam         MI_FPARAM;
typedef struct srvfp_rtnlist     MI_SRVFP_RTNLIST;
typedef struct fpproc_info       MI_FPPROC_INFO;


/* MI_CONNECTION_INFO & MI_DATABASE_INFO */

typedef struct mi_connection MI_CONNECTION;

typedef struct mi_connection_info
    {
    char   *server_name; /* INFORMIXSERVER */
    mi_integer server_port;  /* SERVERNUM */
    char   *locale;      /* Processing locale */
    mi_integer reserved1;    /* reserved for future */
    mi_integer reserved2;    /* reserved for future */
    } MI_CONNECTION_INFO;

typedef struct mi_database_info
    {
    char *database_name;
    char *user_name;
    char *password;
    } MI_DATABASE_INFO;

#define MI_CONN_RETERR ((MI_CONNECTION *)0x6d6e6e6f)

/* Collections */

typedef struct mi_collection         MI_COLLECTION;
typedef struct mi_coll_desc          MI_COLL_DESC;

/* Server Transition Descriptor */

typedef struct mi_transition_desc    MI_TRANSITION_DESC;

/* Client only */

typedef struct mi_parameter_info
    {
    mi_integer callbacks_enabled;
    mi_integer pointer_checks_enabled;
    } MI_PARAMETER_INFO;

/* Selectivity */

typedef struct mi_funcarg MI_FUNCARG;


/*
 * Function Pointer Types
 */


typedef void * (MI_PROC_VACALLBACK *MI_C_FUNC_PTR) ();
typedef MI_CALLBACK_STATUS (MI_PROC_CALLBACK *MI_CALLBACK_FUNC)
    ARGS((MI_EVENT_TYPE type, 
	  MI_CONNECTION *conn, 
	  void *cb_data, 
	  void *user_data));


/*
 * Public function prototypes.
 */


EXTERNC_BEGIN


/*
 * New routines for variable length data types
 */

MI_DECL
mi_lvarchar * MI_PROC_EXPORT
mi_new_var ARGS((mi_integer datalen));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_var_free ARGS((mi_lvarchar *varptr));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_get_varlen ARGS((mi_lvarchar *varptr));

MI_DECL
char * MI_PROC_EXPORT
mi_get_vardata ARGS((mi_lvarchar *varptr));

MI_DECL
char * MI_PROC_EXPORT
mi_get_vardata_align ARGS((mi_lvarchar *varptr,
			   mi_integer align));

MI_DECL
void MI_PROC_EXPORT
mi_set_varlen ARGS((mi_lvarchar *varptr, 
		    mi_integer datalen));
MI_DECL
void MI_PROC_EXPORT
mi_set_vardata ARGS((mi_lvarchar *varptr,
		     char *dataptr));

MI_DECL
void MI_PROC_EXPORT
mi_set_vardata_align ARGS((mi_lvarchar *varptr,
			   char *dataptr,
			   mi_integer align));

MI_DECL
void MI_PROC_EXPORT
mi_set_varptr ARGS((mi_lvarchar *varptr,
		    char *dataptr));

/* add this function to fix the datablade related problems */
MI_DECL
mi_smallint MI_PROC_EXPORT
mi_set_optcompind ARGS((mi_smallint optcompind));

MI_DECL
mi_lvarchar * MI_PROC_EXPORT
mi_var_copy ARGS((mi_lvarchar *lv));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_lvarchar_to_string ARGS((mi_lvarchar *lv));

MI_DECL
mi_lvarchar * MI_PROC_EXPORT
mi_string_to_lvarchar ARGS((mi_string *str));

MI_DECL
void MI_PROC_EXPORT
mi_var_to_buffer ARGS((mi_lvarchar *varptr,
		       char *buffer));


/*
 * Converting and Copying (server only)
 */

MI_DECL
mi_unsigned_integer  MI_PROC_EXPORT
mi_fix_integer ARGS((mi_unsigned_integer val));

MI_DECL
mi_unsigned_integer  MI_PROC_EXPORT
mi_fix_smallint ARGS((mi_unsigned_integer val));


/*
 * Get and put byte routines
 */

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_bytes ARGS((mi_unsigned_char1 *iodata, 
		   char  *valp, 
		   mi_integer nbytes));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_bytes ARGS((mi_unsigned_char1 *iodata, 
		   char  *valp, 
		   mi_integer nbytes));


/*
 * Get/put routines for standard datatypes
 */

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_double_precision ARGS((mi_unsigned_char1 *datap, 
			      mi_double_precision *valp));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_double_precision ARGS((mi_unsigned_char1 *datap, 
			      mi_double_precision *valp));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_real ARGS((mi_unsigned_char1 *datap, 
		     mi_real  *mi_realp));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_real ARGS((mi_unsigned_char1 *datap, 
		     mi_real *mi_realval));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_integer ARGS((mi_unsigned_char1 *datap, 
		     mi_integer  *mi_integerp));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_integer ARGS((mi_unsigned_char1 *datap, 
		     mi_integer mi_integerval));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_smallint ARGS((mi_unsigned_char1 *datap, 
		      mi_smallint *smallintp));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_smallint ARGS((mi_unsigned_char1 *datap, 
		      mi_integer smallintval));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_date ARGS((mi_unsigned_char1 *datap, 
		  mi_date *datep));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_date ARGS((mi_unsigned_char1 *datap, 
		  mi_date *datep));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_int8 ARGS((mi_unsigned_char1 *datap, 
		      mi_int8 *int8p));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_int8 ARGS((mi_unsigned_char1 *datap,
		      mi_int8 *int8p));
#ifndef NOBIGINT
MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_bigint ARGS((mi_unsigned_char1 *datap, 
		      mi_bigint *bintp));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_bigint ARGS((mi_unsigned_char1 *datap,
		      mi_bigint *bintp));
MI_DECL
mi_integer MI_PROC_EXPORT
mi_last_bigserial ARGS((MI_CONNECTION *conn, mi_bigint *out));

MI_DECL
mi_unsigned_bigint  MI_PROC_EXPORT
mi_fix_bigint ARGS((mi_unsigned_bigint val));

#endif

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_datetime ARGS((mi_unsigned_char1 *datap, 
		      mi_datetime *dtp));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_datetime ARGS((mi_unsigned_char1 *datap,
		      mi_datetime *dtp));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_interval ARGS((mi_unsigned_char1 *datap, 
		      mi_interval *ip));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_interval ARGS((mi_unsigned_char1 *datap, 
		      mi_interval *ip));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_money ARGS((mi_unsigned_char1 *datap,
		   mi_money *moneyp));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_money ARGS((mi_unsigned_char1 *datap,
		   mi_money *moneyp));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_decimal ARGS((mi_unsigned_char1 *datap,
		     mi_decimal *decimalp));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_decimal ARGS((mi_unsigned_char1 *datap,
		     mi_decimal *decimalp));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_ref ARGS((mi_unsigned_char1 *datap, 
		 mi_ref *refp));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_ref ARGS((mi_unsigned_char1 *datap, 
		 mi_ref *refp));


/*
 * Get/put string functions
 */

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_string ARGS((mi_unsigned_char1 *datap, 
		    mi_string **stringp, 
		    mi_integer srcbytes));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_string ARGS((mi_unsigned_char1 **datap, 
		    mi_string *valp,
		    mi_integer srcbytes));


/*
 * Old and deprecated Code conversion functions
 */

MI_DECL
mi_date  MI_PROC_EXPORT
mi_date_to_binary ARGS((mi_lvarchar *date_string));

MI_DECL
mi_lvarchar * MI_PROC_EXPORT
mi_binary_to_date ARGS((mi_date date_data));

MI_DECL
mi_datetime * MI_PROC_EXPORT
mi_datetime_to_binary ARGS((mi_lvarchar *dttime));

MI_DECL
mi_lvarchar * MI_PROC_EXPORT
mi_binary_to_datetime ARGS((mi_datetime *dttime));

MI_DECL
mi_money * MI_PROC_EXPORT
mi_money_to_binary ARGS((mi_lvarchar *money_string));

MI_DECL
mi_lvarchar * MI_PROC_EXPORT
mi_binary_to_money ARGS((mi_money *money_data));

MI_DECL
mi_decimal * MI_PROC_EXPORT
mi_decimal_to_binary ARGS((mi_lvarchar *decimal_string));

MI_DECL
mi_lvarchar * MI_PROC_EXPORT
mi_binary_to_decimal ARGS((mi_decimal *decimal_data));

/*
 * New Code conversion functions
 */

MI_DECL
mi_date  MI_PROC_EXPORT
mi_string_to_date ARGS((mi_string *date_string));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_date_to_string ARGS((mi_date date_data));

MI_DECL
mi_datetime * MI_PROC_EXPORT
mi_string_to_datetime ARGS((mi_string *datetime_string, mi_string *tynm));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_datetime_to_string ARGS((mi_datetime *dttime));

MI_DECL
mi_money * MI_PROC_EXPORT
mi_string_to_money ARGS((mi_string *money_string));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_money_to_string ARGS((mi_money *money_data));

MI_DECL
mi_decimal * MI_PROC_EXPORT
mi_string_to_decimal ARGS((mi_string *decimal_string));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_decimal_to_string ARGS((mi_decimal *decimal_data));

MI_DECL
mi_interval * MI_PROC_EXPORT
mi_string_to_interval ARGS((mi_string *interval_string, mi_string *tynm));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_interval_to_string ARGS((mi_interval *intime));


/*
 * Function prototypes for type information
 */

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_typeid_is_builtin ARGS((MI_TYPEID *typeptr));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_typeid_is_complex ARGS((MI_TYPEID *typeptr));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_typeid_is_row ARGS((MI_TYPEID *typeptr));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_typeid_is_list ARGS((MI_TYPEID *typeptr));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_typeid_is_multiset ARGS((MI_TYPEID *typeptr));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_typeid_is_set ARGS((MI_TYPEID *typeptr));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_typeid_is_collection ARGS((MI_TYPEID *typeptr));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_typeid_is_reference ARGS((MI_TYPEID *typeptr));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_typeid_is_distinct ARGS((MI_TYPEID *typeptr));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_typeid_is_userUDT ARGS((MI_TYPEID *typeptr));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_typeid_is_constructor ARGS((MI_TYPEID *typeptr));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_type_typename ARGS((MI_TYPE_DESC *td));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_type_owner ARGS((MI_TYPE_DESC *td));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_type_full_name ARGS((MI_TYPE_DESC *td));

MI_DECL
MI_TYPE_DESC * MI_PROC_EXPORT
mi_type_element_typedesc ARGS((MI_TYPE_DESC *td));

MI_DECL
MI_TYPE_DESC * MI_PROC_EXPORT
mi_type_constructor_typedesc ARGS((MI_TYPE_DESC *td));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_type_align ARGS((MI_TYPE_DESC *td));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_type_byvalue ARGS((MI_TYPE_DESC *td));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_type_length ARGS((MI_TYPE_DESC *td));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_type_maxlength ARGS((MI_TYPE_DESC *td));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_type_scale ARGS((MI_TYPE_DESC *td));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_type_precision ARGS((MI_TYPE_DESC *td));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_type_qualifier ARGS((MI_TYPE_DESC *td));

MI_DECL
MI_TYPE_DESC * MI_PROC_EXPORT
mi_get_type_source_type ARGS((MI_TYPE_DESC *td));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_typeid_equals ARGS((MI_TYPEID *typeone, MI_TYPEID *typetwo));


/* Fetch a typeid from a null terminated string or an lvarchar 
 * and get a type descriptor from an id
 */


MI_DECL
MI_TYPEID * MI_PROC_EXPORT
mi_typename_to_id ARGS((MI_CONNECTION *conn, 
			mi_lvarchar *name));

MI_DECL
MI_TYPEID * MI_PROC_EXPORT
mi_typestring_to_id ARGS((MI_CONNECTION *conn, 
			  mi_string *name));

MI_DECL
MI_TYPE_DESC * MI_PROC_EXPORT
mi_typename_to_typedesc ARGS((MI_CONNECTION *conn, 
			mi_lvarchar *name));

MI_DECL
MI_TYPE_DESC * MI_PROC_EXPORT
mi_typestring_to_typedesc ARGS((MI_CONNECTION *conn, 
			  mi_string *name));

MI_DECL
MI_TYPE_DESC * MI_PROC_EXPORT
mi_type_typedesc ARGS((MI_CONNECTION *conn, MI_TYPEID *tid));

MI_DECL
MI_TYPEID * MI_PROC_EXPORT
mi_typedesc_typeid ARGS((MI_TYPE_DESC *tdesc));


/*
 * Prototypes for MI_FUNC_DESC accessor functions
 */

MI_DECL
mi_integer MI_PROC_EXPORT
mi_func_handlesnulls ARGS((MI_FUNC_DESC  *func_desc));

MI_DECL
char * MI_PROC_EXPORT
mi_func_commutator ARGS((MI_FUNC_DESC  *func_desc));

MI_DECL
char * MI_PROC_EXPORT
mi_func_negator ARGS((MI_FUNC_DESC  *func_desc));

/*
 * Its a Server Only function 
 */

MI_DECL
mi_integer MI_PROC_EXPORT
mi_func_isvariant ARGS((MI_FUNC_DESC *func_desc));


/*
 * Prototypes for MI_FPARAM accessor functions
 */


MI_DECL
mi_boolean MI_PROC_EXPORT
mi_fp_usr_fparam ARGS((MI_FPARAM *fparamPtr));

MI_DECL
void * MI_PROC_EXPORT
mi_fp_funcstate ARGS((MI_FPARAM *fparamPtr));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setfuncstate ARGS((MI_FPARAM *fparamPtr,
			 void *value));

MI_DECL
MI_SETREQUEST MI_PROC_EXPORT
mi_fp_request ARGS((MI_FPARAM *fparamPtr));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_fp_nrets ARGS((MI_FPARAM *fparamPtr));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setnrets ARGS((MI_FPARAM *fparamPtr,
		     mi_integer value));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_fp_returnisnull ARGS((MI_FPARAM *fparamPtr, mi_integer nth));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setreturnisnull ARGS((MI_FPARAM *fparamPtr,
			    mi_integer  nth,
			    mi_integer value));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setisdone ARGS((MI_FPARAM *fparamPtr,
		      mi_integer value));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_fp_nargs ARGS((MI_FPARAM *fparamPtr));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setnargs ARGS((MI_FPARAM *fparamPtr,
		     mi_integer value));

MI_DECL
mi_unsigned_char1 MI_PROC_EXPORT
mi_fp_argisnull ARGS((MI_FPARAM *fparamPtr,
		      mi_integer arg));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setargisnull ARGS((MI_FPARAM *fparamPtr,
			 mi_integer arg,
			 mi_integer value));

MI_DECL
MI_TYPEID * MI_PROC_EXPORT
mi_fp_argtype ARGS((MI_FPARAM *fparamPtr,
		    mi_integer nth));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setargtype ARGS((MI_FPARAM *fparamPtr,
		       mi_integer nth,
		       MI_TYPEID *type_id));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_fp_arglen ARGS((MI_FPARAM *fparamPtr,
		    mi_integer nth));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setarglen ARGS((MI_FPARAM *fparamPtr,
		       mi_integer nth,
		       mi_integer len));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_fp_argprec ARGS((MI_FPARAM *fparamPtr,
		    mi_integer nth));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setargprec ARGS((MI_FPARAM *fparamPtr,
		       mi_integer nth,
		       mi_integer prec));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_fp_argscale ARGS((MI_FPARAM *fparamPtr,
		    mi_integer nth));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setargscale ARGS((MI_FPARAM *fparamPtr,
		       mi_integer nth,
		       mi_integer scale));

MI_DECL
MI_TYPEID * MI_PROC_EXPORT
mi_fp_rettype ARGS((MI_FPARAM *fparamPtr,
		    mi_integer nth));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setrettype ARGS((MI_FPARAM *fparamPtr,
		       mi_integer nth,
		       MI_TYPEID *type_id));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_fp_retlen ARGS((MI_FPARAM *fparamPtr,
		    mi_integer nth));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setretlen ARGS((MI_FPARAM *fparamPtr,
		       mi_integer nth,
		       mi_integer len));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_fp_retprec ARGS((MI_FPARAM *fparamPtr,
                    mi_integer nth));
 
MI_DECL
void MI_PROC_EXPORT
mi_fp_setretprec ARGS((MI_FPARAM *fparamPtr,
                       mi_integer nth,
                       mi_integer prec));
 
MI_DECL
mi_integer MI_PROC_EXPORT
mi_fp_retscale ARGS((MI_FPARAM *fparamPtr,
                    mi_integer nth));

MI_DECL 
void MI_PROC_EXPORT
mi_fp_setretscale ARGS((MI_FPARAM *fparamPtr,
                       mi_integer nth,
                       mi_integer scale));
                       


MI_DECL
mi_funcid MI_PROC_EXPORT
mi_fp_getfuncid ARGS((MI_FPARAM *fparamPtr));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setfuncid ARGS((MI_FPARAM *fparamPtr,
		      mi_funcid func));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_fp_getcolid ARGS((MI_FPARAM *fparamPtr));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setcolid ARGS((MI_FPARAM *fparamPtr,
		     mi_integer value));

MI_DECL
MI_ROW * MI_PROC_EXPORT
mi_fp_getrow ARGS((MI_FPARAM *fparamPtr));

MI_DECL
void MI_PROC_EXPORT
mi_fp_setrow ARGS((MI_FPARAM *fparamPtr,
		     MI_ROW *row));


/*
 * Create (and free) a row based on the row descriptor and data info.
 */

MI_DECL
MI_ROW * MI_PROC_EXPORT
mi_row_create ARGS((MI_CONNECTION *conn, 
		    MI_ROW_DESC *rowdesc, 
		    MI_DATUM coldata[], 
		    mi_boolean colisnull[]));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_row_free ARGS((MI_ROW *row));


/*
 * Create (and free) a row descriptor, based on the row type information.
 */

MI_DECL
MI_ROW_DESC * MI_PROC_EXPORT
mi_row_desc_create ARGS((MI_TYPEID *type_id));

MI_DECL
void MI_PROC_EXPORT
mi_row_desc_free ARGS((MI_ROW_DESC *rowdesc));

MI_DECL
MI_ROW * MI_PROC_EXPORT
mi_next_row ARGS((MI_CONNECTION *conn, 
		  mi_integer *error));

MI_DECL
mint  MI_PROC_EXPORT
mi_set_row_desc_duration ARGS((MI_ROW *row,
                  MI_MEMORY_DURATION duration));

/*
 * Fetch the row descriptor based on the row or the current row 
 * in the specified connection.
 */

MI_DECL
MI_ROW_DESC * MI_PROC_EXPORT
mi_get_row_desc ARGS((MI_ROW *row));

MI_DECL
MI_ROW_DESC * MI_PROC_EXPORT
mi_get_row_desc_without_row ARGS((MI_CONNECTION *conn));

MI_DECL
MI_ROW_DESC *
mi_get_row_desc_from_type_desc ARGS((MI_TYPE_DESC *type_desc_Ptr));


/*
 * Get column information by number or name.
 */

MI_DECL
mi_string * MI_PROC_EXPORT
mi_column_name ARGS((MI_ROW_DESC *idesc, 
		     mi_integer value_no));

MI_DECL
MI_TYPE_DESC * MI_PROC_EXPORT
mi_column_typedesc ARGS((MI_ROW_DESC *rd, 
			 mi_integer colno));

MI_DECL
MI_TYPEID * MI_PROC_EXPORT
mi_column_type_id ARGS((MI_ROW_DESC *idesc, 
			mi_integer value_no));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_column_count ARGS((MI_ROW_DESC *idesc)); 

MI_DECL
mi_integer MI_PROC_EXPORT
mi_column_id ARGS((MI_ROW_DESC *idesc, 
		   mi_string *colname));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_value ARGS((MI_ROW *row, 
	       mi_integer column_no, 
	       MI_DATUM *retbuf,
	       mi_integer *retlen));

/* Same as mi_value() but uses column name */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_value_by_name ARGS((MI_ROW *row, 
		       char *column_name, 
		       MI_DATUM *retbuf,
		       mi_integer *retlen));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_value_length ARGS((MI_ROW *row, 
		      mi_integer value_no));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_column_precision ARGS((MI_ROW_DESC *idesc, 
		      mi_integer value_no));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_column_nullable ARGS((MI_ROW_DESC *idesc, 
			 mi_integer value_no));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_column_scale ARGS((MI_ROW_DESC *idesc, 
		      mi_integer value_no));


/*
 * Data Handling Routines - Parameters and Environment
 */
		 
MI_DECL
char * MI_PROC_EXPORT
mi_sysname ARGS((char *name));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_get_connection_info ARGS((MI_CONNECTION  *conn, 
			     MI_CONNECTION_INFO  *ret));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_get_connection_user_data ARGS((MI_CONNECTION *conn, 
				  void **user_data));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_get_database_info ARGS((MI_CONNECTION  *conn, 
			   MI_DATABASE_INFO  *ret));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_get_default_connection_info ARGS((MI_CONNECTION_INFO  *ret));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_get_default_database_info ARGS((MI_DATABASE_INFO  *ret));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_get_parameter_info ARGS((MI_PARAMETER_INFO *ret));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_set_connection_user_data ARGS((MI_CONNECTION *conn, 
				  void *conn_info));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_set_default_connection_info ARGS((MI_CONNECTION_INFO *cinfo));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_set_default_database_info ARGS((MI_DATABASE_INFO *dinfo));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_set_parameter_info ARGS((const MI_PARAMETER_INFO *set));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_get_connection_option ARGS((MI_CONNECTION *conn,
                              const mi_integer which_option,
			      mi_integer *result));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_get_serverenv ARGS((const char *name, char **value));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_server_version ARGS((MI_CONNECTION *conn, char *buf, mi_integer buflen));


/*
 * Prototypes for collections
 */

/* open */
MI_DECL
MI_COLL_DESC * MI_PROC_EXPORT
mi_collection_open ARGS((MI_CONNECTION *conn, 
			 MI_COLLECTION *coll));


/* open with options */
MI_DECL
MI_COLL_DESC * MI_PROC_EXPORT
mi_collection_open_with_options ARGS((MI_CONNECTION *conn,
				      MI_COLLECTION *coll,
				      mi_integer flags));
/* Possible values for flags */
#define MI_COLL_NOSCROLL 0x1
#define MI_COLL_READONLY 0x2

/* flags for MI_CONNECTION.conn_flags */
#define MI_CONN_TD_BOUND 0x1       /* indicate that the conn is embedded
                                      in a table descriptor. It and all its
                                      sub-structures must have at least the
                                      same lifespan */

/* close */
MI_DECL
mi_integer  MI_PROC_EXPORT
mi_collection_close ARGS((MI_CONNECTION *conn, 
			  MI_COLL_DESC *colldesc));

/* create */
MI_DECL
MI_COLLECTION * MI_PROC_EXPORT
mi_collection_create ARGS((MI_CONNECTION *conn, 
			   MI_TYPEID *type_id));

/* free */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_collection_free ARGS((MI_CONNECTION *conn, 
			 MI_COLLECTION *coll));

/* copy */
MI_DECL
MI_COLLECTION * MI_PROC_EXPORT
mi_collection_copy ARGS((MI_CONNECTION *conn,
			 MI_COLLECTION *from));

/* fetch */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_collection_fetch ARGS((MI_CONNECTION *conn,
		    	  MI_COLL_DESC *colldesc,
		    	  MI_CURSOR_ACTION action, 
		    	  mi_integer jump,
		    	  MI_DATUM *retbuf, 
		    	  mi_integer *ret_len));

/* insert */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_collection_insert ARGS(( MI_CONNECTION *conn,
			    MI_COLL_DESC *colldesc,
			    MI_DATUM val,
			    MI_CURSOR_ACTION action,
			    mi_integer jump));

/* delete */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_collection_delete ARGS((MI_CONNECTION *conn, 
			   MI_COLL_DESC *colldesc,
			   MI_CURSOR_ACTION action,
			   mi_integer jump));

/* update */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_collection_update ARGS((MI_CONNECTION *conn,
			   MI_COLL_DESC *colldesc,
        		   MI_DATUM val,
			   MI_CURSOR_ACTION action,
			   mi_integer jump));

/* cardinality */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_collection_card ARGS((MI_COLLECTION *coll,
			 mi_boolean *isnull));


/*
 * Functions for conversion to and from a codeset for any locale specific
 * DataBlades
 */

MI_DECL
mi_integer MI_PROC_EXPORT
mi_convert_to_codeset ARGS((char *string, 
			    char *locale_name));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_convert_from_codeset ARGS((char *string, 
			      char *locale_name));


/*
 * Miscellaneous functions
 */

MI_DECL
mi_integer MI_PROC_EXPORT
mi_library_version ARGS((char *buf, 
			 mi_integer buflen));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_get_client_home ARGS((char *client_home_path, 
			 mi_integer client_home_path_length));

MI_DECL
char * MI_PROC_EXPORT
mi_client_locale ARGS((void));


MI_DECL
mi_integer MI_PROC_EXPORT
mi_get_next_sysname ARGS((mi_integer *phandle, char *nameb, 
			  mi_integer namebsize));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_get_dbnames ARGS((MI_CONNECTION *conn,
		     char *dbnameps[], mi_integer dbnamepssize,
		     char *dbnamesb, mi_integer dbnamesbsize));

MI_DECL 
mi_integer MI_PROC_EXPORT 
mi_transaction_state ARGS((void));


/*
 * Memory management
 */

MI_DECL
MI_MEMORY_DURATION  MI_PROC_EXPORT
mi_switch_mem_duration ARGS((MI_MEMORY_DURATION duration)); 

MI_DECL
mi_integer MI_PROC_EXPORT
mi_get_duration_size ARGS((MI_MEMORY_DURATION duration));

MI_DECL
MI_MEMORY_DURATION MI_PROC_EXPORT
mi_get_memptr_duration ARGS((void * memptr));

MI_DECL
void * MI_PROC_EXPORT
mi_alloc ARGS((mi_integer len));

MI_DECL
void * MI_PROC_EXPORT
mi_realloc ARGS((void *ptr, mi_integer size));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_stack_limit ARGS((mi_integer size));

MI_DECL
void * MI_PROC_EXPORT
mi_dalloc ARGS((mi_integer len, 
		MI_MEMORY_DURATION duration));

MI_DECL
void * MI_PROC_EXPORT
mi_zalloc ARGS((mi_integer len));

MI_DECL
void  MI_PROC_EXPORT
mi_free ARGS((void *ptr));

MI_DECL
void MI_PROC_EXPORT
mi_set_conn_flags ARGS((MI_CONNECTION *conn, mi_integer flags));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_get_conn_flags ARGS((MI_CONNECTION *conn, mi_integer flags));
/*
 * Client specific Routines 
 */

MI_DECL
mi_integer MI_PROC_EXPORT
mi_init_library ARGS((mi_integer flags));

MI_DECL
MI_CONNECTION * MI_PROC_EXPORT
mi_server_connect ARGS((MI_CONNECTION_INFO *conn_info));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_login ARGS((MI_CONNECTION *conn, 
	       const MI_DATABASE_INFO *dobbin));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_dbcreate ARGS((MI_CONNECTION *conn, 
                  const MI_DATABASE_INFO *dbinfo, 
                  const char *dbspace, 
                  MI_DBCREATE_FLAGS flag));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_dbdrop ARGS((MI_CONNECTION *conn, const MI_DATABASE_INFO *dbinfo));


MI_DECL
mi_integer MI_PROC_EXPORT
mi_server_reconnect ARGS((MI_CONNECTION *conn));

MI_DECL
void MI_PROC_EXPORT
mi_cleanup ARGS((void));

MI_DECL
MI_ASYNC_ACTION MI_PROC_EXPORT
mi_processing_needed ARGS((MI_CONNECTION *miconn, 
			   mi_integer flags));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_event_pending ARGS((MI_CONNECTION *miconn));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_unix_connection ARGS((MI_CONNECTION *miconn));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_client ARGS((void));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_register_function ARGS((MI_CONNECTION *conn,
			   MI_FUNCTYPE functype,
			   MI_C_FUNC_PTR func,
			   const mi_string *fsqlname,
			   const mi_string *functag,
			   mi_integer nargs,
			   mi_string *typenamearray[]));


/*
 * Session, Thread, and Transaction Management
 */

MI_DECL
MI_CONNECTION * MI_PROC_EXPORT
mi_open ARGS((const char *database_name, 
	      const char *user_name, 
	      const char *user_passwd));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_close ARGS((MI_CONNECTION *conn));

/* For multi threaded environment - yield processing to other threads and 
   reschedule  */

MI_DECL
void  MI_PROC_EXPORT
mi_yield ARGS((void));

/* Expose mt_call routine */
MI_DECL
mi_integer MI_PROC_VAEXPORT
mi_call ARGS ((mi_integer *retval,
               mi_integer (*func)(),
               mi_integer nargs,
               ...));

/* Expose mt_call_size routine */
MI_DECL
mi_integer MI_PROC_VAEXPORT
mi_call_size ARGS ((mulong stack_size, 
		    mulong *retval, 
		    muintptr (*func)(void), 
		    mi_integer nargs, 
		    ...));

/* check for user interrupt */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_interrupt_check ARGS((void));

/* server state transitions */
MI_DECL
MI_TRANSITION_TYPE MI_PROC_EXPORT
mi_transition_type ARGS((MI_TRANSITION_DESC *data));


/*
 * Query Processing
 */


/* Parameterized queries and cursors */

MI_DECL
MI_STATEMENT * MI_PROC_EXPORT
mi_prepare ARGS((MI_CONNECTION *conn_desc, 
		 mi_string *query, 
		 mi_string *name));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_exec_prepared_statement ARGS((MI_STATEMENT *stmtptr, 
				 mi_integer   control, 
				 mi_integer   are_binary, 
				 mi_integer   n_params, 
				 MI_DATUM     values[],
				 mi_integer   lengths[],
				 mi_integer   nulls[], 
				 mi_string    *types[], 
				 mi_integer   retlen, 
				 mi_string    *rettypes[]));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_open_prepared_statement ARGS((MI_STATEMENT *stmt, 
				 mi_integer   control, 
				 mi_integer   are_binary, 
				 mi_integer   n_params, 
				 MI_DATUM     values[], 
				 mi_integer   lengths[], 
				 mi_integer   nulls[], 
				 mi_string    *types[], 
				 mi_string    *name, 
				 mi_integer   retlen, 
				 mi_string    *rettypes[]));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_fetch_statement ARGS((MI_STATEMENT *stmtptr, 
			 MI_CURSOR_ACTION orient, 
			 mi_integer jump, 
			 mi_integer count));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_close_statement ARGS((MI_STATEMENT *stmtPtr)); 

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_recycle_statement ARGS((MI_STATEMENT *stmtPtr)); 

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_reset_statement ARGS((MI_STATEMENT *stmtPtr)); 

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_drop_prepared_statement ARGS((MI_STATEMENT *stmtPtr));

/* Implemented only in Client */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_estimated_statement_row_count ARGS((MI_STATEMENT *));

/* Implemented only in Client */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_estimated_statement_cost ARGS((MI_STATEMENT *));



MI_DECL
MI_ROW_DESC * MI_PROC_EXPORT
mi_get_statement_row_desc ARGS((MI_STATEMENT *stmtPtr));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_parameter_count ARGS((MI_STATEMENT *stmtPtr));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_parameter_type_name ARGS((MI_STATEMENT *stmtPtr, 
			     mi_integer paramNo));

MI_DECL
MI_TYPEID * MI_PROC_EXPORT
mi_parameter_type_id ARGS((MI_STATEMENT *stmtPtr, 
			   mi_integer paramNo));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_parameter_precision ARGS((MI_STATEMENT *stmtPtr, 
			 mi_integer paramNo));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_parameter_scale ARGS((MI_STATEMENT *stmtPtr, 
			 mi_integer paramNo));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_parameter_nullable ARGS((MI_STATEMENT *stmtPtr, 
			    mi_integer paramNo));


/* Sending Commands */

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_exec ARGS((MI_CONNECTION *conn, 
	      const mi_string *command, 
	      mi_integer control));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_query_finish ARGS((MI_CONNECTION *conn));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_query_interrupt ARGS((MI_CONNECTION *conn, 
			 mi_integer block_until_acknowledged)); 


/* Information about the current command */

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_binary_query ARGS((MI_CONNECTION *conn));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_command_is_finished ARGS((MI_CONNECTION *conn));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_current_command_name ARGS((MI_CONNECTION *conn));


/* General information about the results */
MI_DECL
char * MI_PROC_EXPORT
mi_result_command_name ARGS((MI_CONNECTION *conn));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_statement_command_name ARGS((MI_STATEMENT *stmt));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_get_result ARGS((MI_CONNECTION *conn));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_result_row_count ARGS((MI_CONNECTION *conn));

/* return SERIAL of latest insert */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_last_serial ARGS((MI_CONNECTION *conn, mi_integer *out));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_last_serial8 ARGS((MI_CONNECTION *conn, mi_int8 *out));


/*
 * Savesets
 */

MI_DECL
MI_ROW * MI_PROC_EXPORT
mi_save_set_get_first ARGS((MI_SAVE_SET *save_set, 
			    mi_integer *error));

MI_DECL
MI_ROW * MI_PROC_EXPORT
mi_save_set_get_last ARGS((MI_SAVE_SET *save_set, 
			   mi_integer *error));

MI_DECL
MI_ROW * MI_PROC_EXPORT
mi_save_set_get_next ARGS((MI_SAVE_SET *save_set, 
			   mi_integer *error));

MI_DECL
MI_ROW * MI_PROC_EXPORT
mi_save_set_get_previous ARGS((MI_SAVE_SET *save_set, 
			       mi_integer *error));

MI_DECL
MI_ROW * MI_PROC_EXPORT
mi_save_set_insert ARGS((MI_SAVE_SET *save_set, 
			 MI_ROW *row));

MI_DECL
MI_SAVE_SET * MI_PROC_EXPORT
mi_save_set_create ARGS((MI_CONNECTION *conn));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_save_set_count ARGS((MI_SAVE_SET *save_set));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_save_set_delete ARGS((MI_ROW *row));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_save_set_destroy ARGS((MI_SAVE_SET *save_set));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_save_set_member ARGS((MI_ROW *row));

/*
 *  Get id (currently for session and statement)
 */

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_get_id ARGS((MI_CONNECTION *conn_desc, MI_ID id));
   
MI_DECL
mi_char*  MI_PROC_EXPORT
mi_get_db_locale ARGS((void));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_get_transaction_id ARGS((void));

/*
 * Error and exception handling
 */

MI_DECL
MI_ERROR_DESC * MI_PROC_EXPORT
mi_error_desc_copy ARGS((MI_ERROR_DESC *source));

MI_DECL
MI_CALLBACK_HANDLE * MI_PROC_EXPORT
mi_register_callback_with_options ARGS((MI_CONNECTION *conn,
			   MI_EVENT_TYPE event_type,
			   MI_CALLBACK_FUNC func,
			   void *user_data,
			   MI_CALLBACK_HANDLE *parent,
			   mi_integer flags));

MI_DECL
MI_CALLBACK_HANDLE * MI_PROC_EXPORT
mi_register_callback ARGS((MI_CONNECTION *conn,
			   MI_EVENT_TYPE event_type,
			   MI_CALLBACK_FUNC func,
			   void *user_data,
			   MI_CALLBACK_HANDLE *parent));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_retrieve_callback ARGS((MI_CONNECTION *conn,
			   MI_EVENT_TYPE event_type,
			   MI_CALLBACK_HANDLE *handle,
			   MI_CALLBACK_FUNC *retfunc,
			   void **ret_user_data));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_unregister_callback ARGS((MI_CONNECTION *conn,
			     MI_EVENT_TYPE event_type,
			     MI_CALLBACK_HANDLE *handle));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_disable_callback ARGS((MI_CONNECTION *conn,
			  MI_EVENT_TYPE event_type,
			  MI_CALLBACK_HANDLE *handle));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_disable_callbacks ARGS((void));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_enable_callback ARGS((MI_CONNECTION *conn,
			 MI_EVENT_TYPE event_type,
			 MI_CALLBACK_HANDLE *handle));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_enable_callbacks ARGS((void));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_error_desc_destroy ARGS((MI_ERROR_DESC *desc));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_error_desc_is_copy ARGS((MI_ERROR_DESC *desc));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_error_level ARGS((MI_ERROR_DESC *estruct));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_error_sqlcode ARGS((MI_ERROR_DESC *desc, 
		       mi_integer *sqlcodep));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_error_sql_state ARGS((MI_ERROR_DESC *desc, 
			 char *buf, 
			 mi_integer buflen));

MI_DECL
mi_integer  MI_PROC_VAEXPORT
mi_db_error_raise ARGS((MI_CONNECTION *conn, 
			mi_integer msg_type, 
			char *msg,
			...));

MI_DECL
mi_integer  MI_PROC_VAEXPORT
mi_vti_error_raise ARGS((MI_CONNECTION *conn, 
			mi_integer sqlcode, 
			mi_integer isamcode
			));

MI_DECL
void  MI_PROC_EXPORT
mi_default_callback ARGS((MI_EVENT_TYPE type, 
			  MI_CONNECTION *conn, 
			  void *cb_data, 
			  void *user_data));
MI_DECL
void  MI_PROC_EXPORT
mi_errmsg ARGS((MI_ERROR_DESC *desc, 
		char *buf, 
		mi_integer buflen));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_error_desc_finish ARGS((MI_ERROR_DESC *desc));

MI_DECL
MI_ERROR_DESC * MI_PROC_EXPORT
mi_error_desc_next ARGS((MI_ERROR_DESC *desc));

/* Implemented only in Client */
MI_DECL
mi_integer MI_PROC_EXPORT
mi_timeout_query_callback ARGS((MI_CONNECTION *conn,
                void (*timeout_callback)(void *),
                mi_integer timeout, void *timeout_callback_data));


/*
 * Special secret interfaces for internal development
 *  Use at your own risk.
 */
MI_DECL
mi_integer  MI_PROC_EXPORT
mi_funcmap_get ARGS((MI_FUNC_DESC *fdesc, void **mhandle, void **fhandle));

MI_DECL
MI_C_FUNC_PTR MI_PROC_EXPORT
mi_funcaddr_get ARGS((void *mhandle, void *fhandle));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_funcaddr_release ARGS((void *mhandle, void *fhandle));

/*
 * Operating System File Interface
 */

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_file_allocate ARGS((mi_integer n));

MI_DECL
mi_string *  MI_PROC_EXPORT
mi_file_srv_send ARGS((const mi_string *namePtr, 
		   mi_integer *error)); 

MI_DECL
mi_string *  MI_PROC_EXPORT
mi_file_srv_recv ARGS((const mi_string *namePtr, 
		   mi_integer *error)); 

MI_DECL
mi_string *  MI_PROC_EXPORT
mi_file_get_server ARGS((const mi_string *namePtr, 
		   mi_integer *error)); 

MI_DECL
mi_string *  MI_PROC_EXPORT
mi_file_get_filename ARGS((const mi_string *namePtr, 
		   mi_integer *error)); 

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_file_is_remote ARGS((const mi_string *namePtr));


MI_DECL
mi_integer  MI_PROC_EXPORT
mi_file_open ARGS((const char *name, 
		   mi_integer flags, 
		   mi_integer mode)); 

MI_DECL
mi_integer MI_PROC_EXPORT
mi_file_errno(void);

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_file_read ARGS((mi_integer fd, 
		   char *buf, 
		   mi_integer amnt));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_file_seek ARGS((mi_integer fd, 
		   mi_integer offset, 
		   mi_integer whence));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_file_sync ARGS((mi_integer fd));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_file_tell ARGS((mi_integer fd));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_file_unlink ARGS((mi_integer fd));

MI_DECL
mi_integer  MI_PROC_EXPORT
mi_file_write ARGS((mi_integer fd, 
		    const char *buf, 
		    mi_integer amnt));

MI_DECL
void  MI_PROC_EXPORT
mi_file_close ARGS((mi_integer fd));


/*
 * Fastpath
 */

MI_DECL
MI_DATUM MI_PROC_VAEXPORT
mi_routine_exec ARGS((MI_CONNECTION *conn,
		      MI_FUNC_DESC *fdesc,
		      mi_integer *error,
		      ...));                

MI_DECL
mi_integer MI_PROC_EXPORT
mi_routine_end ARGS((MI_CONNECTION *conn,
		     MI_FUNC_DESC *fdesc));

MI_DECL
MI_FUNC_DESC * MI_PROC_EXPORT
mi_routine_get ARGS((MI_CONNECTION *conn,
		     mi_integer flags,
		     char *sig));

MI_DECL
MI_FUNC_DESC * MI_PROC_EXPORT
mi_routine_get_by_typeid ARGS((MI_CONNECTION *conn,
			       MI_UDR_TYPE udr_type,
			       char *udr_name,
			       char *owner,
			       mi_integer arg_count,
			       MI_TYPEID *arg_types));


MI_DECL
MI_FUNC_DESC * MI_PROC_EXPORT
mi_routine_get_by_db_typeid ARGS((MI_CONNECTION *conn,
			       char *dbname,
			       MI_UDR_TYPE udr_type,
			       char *udr_name,
			       char *owner,
			       mi_integer arg_count,
			       MI_TYPEID *arg_types));

MI_DECL
MI_FUNC_DESC * MI_PROC_EXPORT
mi_routine_get_by_typeid ARGS((MI_CONNECTION *conn,
			       MI_UDR_TYPE udr_type,
			       char *udr_name,
			       char *owner,
			       mi_integer arg_count,
			       MI_TYPEID *arg_types));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_routine_id_get ARGS((MI_CONNECTION *conn,
		        MI_FUNC_DESC *func_desc));

MI_DECL
MI_FUNC_DESC * MI_PROC_EXPORT
mi_func_desc_by_typeid ARGS((MI_CONNECTION *conn,
			     mi_funcid routine_id));

MI_DECL
MI_FUNC_DESC * MI_PROC_EXPORT
mi_cast_get ARGS((MI_CONNECTION *conn,
		  MI_TYPEID *from_type,
		  MI_TYPEID *to_type,
		  mi_char *cast_status));

MI_DECL
MI_FUNC_DESC * MI_PROC_EXPORT
mi_td_cast_get ARGS((MI_CONNECTION *conn,
		  MI_TYPE_DESC *from_tdesc,
		  MI_TYPE_DESC *to_tdesc,
		  mi_char *cast_status));

MI_DECL
MI_FPARAM * MI_PROC_EXPORT
mi_fparam_get ARGS((MI_CONNECTION *conn,
		    MI_FUNC_DESC *func_desc));

MI_DECL
MI_FPARAM * MI_PROC_EXPORT
mi_fparam_get_current ARGS((void));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_fp_funcname ARGS((MI_FPARAM *fparamPtr));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_get_type ARGS((mi_unsigned_char1 *dataPtr, MI_TYPEID *typePtr));

MI_DECL
mi_unsigned_char1 * MI_PROC_EXPORT
mi_put_type ARGS((mi_unsigned_char1 *dataPtr, MI_TYPEID *typePtr));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_create_signature ARGS((mi_string *type, mi_string *server, mi_string *database, mi_string *owner, mi_string *routine, mi_string *args));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_conn_is_remote ARGS((void));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_get_coordinator ARGS((mi_string **name));



/*
 * MI_FPARAM allocating, copying, and freeing routines
 */


MI_DECL
MI_FPARAM * MI_PROC_EXPORT
mi_fparam_allocate ARGS((mi_integer nargs));

MI_DECL
MI_FPARAM * MI_PROC_EXPORT
mi_fparam_copy ARGS((MI_FPARAM *fp_in));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_fparam_free ARGS((MI_FPARAM *fp));


/*
 * Routines for function argument API.
 */

MI_DECL
mi_integer MI_PROC_EXPORT
mi_funcarg_get_routine_id ARGS((MI_FUNCARG *fa));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_funcarg_get_routine_name ARGS((MI_FUNCARG *fa));

MI_DECL
MI_FUNCARG_TYPE MI_PROC_EXPORT
mi_funcarg_get_argtype ARGS((MI_FUNCARG *fa));

MI_DECL
MI_TYPEID *MI_PROC_EXPORT
mi_funcarg_get_datatype ARGS((MI_FUNCARG *fa));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_funcarg_get_datalen ARGS((MI_FUNCARG *fa));

MI_DECL
mi_boolean MI_PROC_EXPORT
mi_funcarg_isnull ARGS((MI_FUNCARG *fa));

MI_DECL
MI_DATUM MI_PROC_EXPORT
mi_funcarg_get_constant ARGS((MI_FUNCARG *fa));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_funcarg_get_tabid ARGS((MI_FUNCARG *fa));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_funcarg_get_colno ARGS((MI_FUNCARG *fa));

MI_DECL
mi_bitvarying * MI_PROC_EXPORT
mi_funcarg_get_distrib ARGS((MI_FUNCARG *fa));

/* dlopen wrapper prototypes */
MI_DECL
void *  MI_PROC_EXPORT
mi_so_load ARGS((char *name, char *vpclass ));

MI_DECL
void *  MI_PROC_EXPORT
mi_so_handle ARGS(( char *name ));

MI_DECL
void MI_PROC_EXPORT
mi_so_unload ARGS(( void *mhandle ));

MI_DECL
void *  MI_PROC_EXPORT
mi_so_symbol ARGS(( void *mhandle, char *symbol ));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_udr_lock ARGS(( mi_integer action ));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_vpinfo_vpid ARGS ((void));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_vpinfo_classid ARGS ((void));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_vpinfo_isnoyield ARGS ((void));

MI_DECL
const char * MI_PROC_EXPORT
mi_class_name ARGS ((mi_integer classid));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_class_id ARGS ((const char * classname));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_class_maxvps ARGS ((mi_integer classid, mi_integer * error));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_class_numvp ARGS ((mi_integer classid));


MI_DECL
mi_integer MI_PROC_EXPORT
mi_call_on_vp ARGS (( mi_integer vpid, mi_integer *retval,
		    mi_integer (*func)(), mi_integer nargs, ... ));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_switch_vpid ARGS (( mi_integer vpid));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_process_exec ARGS (( char* argv[] ));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_system ARGS ((const mi_char* cmd));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_module_lock ARGS(( mi_integer action ));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_trigger_tabname ARGS ((mi_integer flags));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_trigger_event ARGS ((void));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_trigger_level ARGS ((void));

MI_DECL
mi_string * MI_PROC_EXPORT
mi_trigger_name ARGS ((void));

MI_DECL
MI_ROW * MI_PROC_EXPORT
mi_trigger_get_old_row ARGS ((void));


MI_DECL
MI_ROW * MI_PROC_EXPORT
mi_trigger_get_new_row ARGS ((void));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_hdr_status ARGS ((void));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_hdr_exefunc ARGS((MI_CONNECTION *conn,
		        mi_char *func_name,
			mi_char	*data));

/*
 * Prototype for stack estimation function
 */
 
MI_DECL
mi_integer MI_PROC_EXPORT
mi_print_stack(void);

/*
 * Others
 */

MI_DECL
mi_integer MI_PROC_EXPORT
mi_make_current_conn ARGS(( MI_CONNECTION *conn ));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_make_connection_dormant ARGS(( MI_CONNECTION *conn ));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_enable_current_connection_concept ARGS(( MI_CONNECTION *conn ));
 
MI_DECL
mi_integer MI_PROC_EXPORT
mi_disable_current_connection_concept ARGS(( MI_CONNECTION *conn ));

 
MI_DECL
mi_integer MI_PROC_EXPORT
mi_xa_register_xadatasource ARGS ((mi_string *));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_xa_unregister_xadatasource ARGS ((mi_string *));

MI_DECL
mi_integer MI_PROC_EXPORT
mi_xa_get_xadatasource_rmid ARGS ((mi_string *));

MI_DECL
int MI_PROC_EXPORT
ax_unreg ARGS ((int rmid, int4 flags));

MI_DECL
mi_integer  MI_PROC_VAEXPORT
mi_sql_error_raise ARGS((MI_CONNECTION *conn, 
			mi_integer sqlcode, 
			char *msg
			));

EXTERNC_END

#endif /* _MILIB_H_ */

