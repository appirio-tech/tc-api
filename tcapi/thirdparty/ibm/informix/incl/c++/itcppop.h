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
//  Title:       itcppop.h
//  Description: Operations classes for IBM Informix OIC++ Library
//
//  Operations classes are classes not representing database value types.
//
//  Applications using dynamically-linked C++ Interface library should
//  make sure that ITVersion() return value is not smaller than IT_VERSION
//
//***************************************************************************

#ifndef _ITCPPOP_H_
#define _ITCPPOP_H_

#define IT_VERSION "2.80"

// Extract version information from the library
IT_EXPORTCLASS const char * ITVersion();
IT_EXPORTCLASS const char * const * ITFileVersions();

// Class forward definitions
class ITErrorManager;
class ITQuery;
class ITConnection;
class ITTypeInfo;
class ITImpl;
class ITAlerter;
struct ITMVDesc;

#ifndef FALSE
#define FALSE 0
#endif
#ifndef TRUE
#define TRUE 1
#endif

// class ITLocale refers to GLS API type gl_wchar_t defined in gls.h
extern "C"
{
#include <ifxgls.h>
}
////////////////////////////////////////////////////////////////
// CLASSES
////////////////////////////////////////////////////////////////
//
//  ITObject -- base class of operation class interface objects
//
//  Instances of operation interface classes
//  each contain a pointer to an object derived from ITImpl, a
//  non-pubic implementation base class. This structuring of
//  implementation and interface classes helps ensure that
//  applications developed with one version of the C++ Interface will
//  continue to work with subsequent versions. It also help improve
//  performance of copy operations.
class IT_EXPORTCLASS ITObject
{
friend class ITImpl;
public:
    // Constructor
    ITObject(const ITObject &);
    virtual ~ITObject();
protected:
    ITObject &operator=(const ITObject &);
    ITObject();
    ITImpl *impl;
};

////////////////////////////////////////////////////////////////
// OPERATING SYSTEM AND FRAMEWORK ENCAPSULATION CLASSES
////////////////////////////////////////////////////////////////

#include <iostream>
//using namespace std;

// The ITString class is reference counted to minimize
// expensive memory allocation. Unlike the other operation classes,
// it can have null implementation instances, i.e., impl set to NULL,
// in the case where it is assigned or initialized with NULL values.

////////////////////////////////////////////////////////////////
// C++ Interface library string class
////////////////////////////////////////////////////////////////

class ITSSString;
class IT_EXPORTCLASS ITString
{
    ITSSString *impl;
public:
    // Constructors
    ITString();
    ITString(const char *str);
    ITString(const char *str,ITBool in_server_codeset);
    ITString(const ITString &);
    ~ITString();

    // Operations
    operator const char *() const;    // return C style raw string data
    const char *Data() const;         // return C style raw string data
    ITString &operator =(const std::string &);
    ITString &operator =(const ITString &);
    ITString &operator =(const char *);
    int Length() const;    // number of multibyte chars in a string
    int Size() const;    // count of bytes not including trailing null
    ITString &Trim(const char *);    // remove trailing characters
    ITString &TrimWhite();    // remove trailing white space
    ITBool Equal(const ITString &) const;
    ITBool Equal(const char *) const;
    ITBool EqualNoCase(const ITString &) const;
    ITBool EqualNoCase(const char *) const;
    ITBool LessThan(const ITString &) const;
    ITBool LessThanNoCase(const ITString &) const;
    ITBool LessThan(const char *) const;
    ITBool LessThanNoCase(const char *) const;
    long Hash() const;
    ITString &Append(const ITString &);
    ITString &Append(const char *);
    ITString GetToken(int &) const;
    ITBool IsQuoted() const;
    ITBool Unquote();
    const char *Scan(const char *) const;

    static const ITString Null;
    inline ITBool IsNull() const;

    friend int operator==(const ITString &,const ITString &);
    friend int operator==(const char *,const ITString &);
    friend int operator!=(const ITString &,const ITString &);
    friend int operator<(const ITString &,const ITString &);
    friend int operator<=(const ITString &,const ITString &);
    friend int operator>(const ITString &,const ITString &);
    friend int operator>=(const ITString &,const ITString &);
};

inline ITBool
ITString::IsNull() const
{
    return impl == NULL;
}

inline int
operator==(const ITString &s1,const ITString &s2)
{
    return s1.Equal(s2);
}

inline int
operator==(const char *s1,const ITString &s2)
{
    return s2.Equal(s1);
}

inline int
operator!=(const ITString &s1,const ITString &s2)
{
    return !s1.Equal(s2);
}

inline int
operator<(const ITString &s1,const ITString &s2)
{
    return s1.LessThan(s2);
}

inline int
operator<=(const ITString &s1,const ITString &s2)
{
    return !s2.LessThan(s1);
}

inline int
operator>(const ITString &s1,const ITString &s2)
{
    return s2.LessThan(s1);
}

inline int
operator>=(const ITString &s1,const ITString &s2)
{
    return !s1.LessThan(s2);
}

IT_EXPORTCLASS std::ostream &operator<<(std::ostream &,const ITString &);
IT_EXPORTCLASS std::istream &operator>>(std::istream &,ITString &);

// ITint8 is an 8-byte integer.
// When created and after arithmetic errors is Null.

class IT_EXPORTCLASS ITInt8
{
    mi_int8 v;
public:
    ITInt8();
    ITInt8(const int);
    ITInt8(const long);
    ITInt8(const float);
    ITInt8(const double);
    ITInt8(const mi_int8);
    ITInt8(const ITString &);
#ifdef IT_COMPILER_HAS_LONG_LONG
    ITInt8(const IT_LONG_LONG);
#endif

    ITInt8 &operator+=(const ITInt8&);
    ITInt8 &operator-=(const ITInt8&);
    ITInt8 &operator*=(const ITInt8&);
    ITInt8 &operator/=(const ITInt8&);
    ITInt8 &operator-();
    ITInt8 &operator++();
    ITInt8 &operator--();
    ITInt8 operator++(int);
    ITInt8 operator--(int);

    friend IT_EXPORTCLASS ITInt8 operator+(const ITInt8&,const ITInt8&);
    friend IT_EXPORTCLASS ITInt8 operator-(const ITInt8&,const ITInt8&);
    friend IT_EXPORTCLASS ITInt8 operator*(const ITInt8&,const ITInt8&);
    friend IT_EXPORTCLASS ITInt8 operator/(const ITInt8&,const ITInt8&);
    friend IT_EXPORTCLASS int operator==(const ITInt8& ,const ITInt8&);
    friend IT_EXPORTCLASS int operator!=(const ITInt8&,const ITInt8&);
    friend IT_EXPORTCLASS int operator<(const ITInt8&,const ITInt8&);
    friend IT_EXPORTCLASS int operator<=(const ITInt8&,const ITInt8&);
    friend IT_EXPORTCLASS int operator>(const ITInt8&,const ITInt8&);
    friend IT_EXPORTCLASS int operator>=(const ITInt8&,const ITInt8&);

    friend IT_EXPORTCLASS std::ostream& operator<<(std::ostream&,const ITInt8 &);
    friend IT_EXPORTCLASS std::istream& operator>>(std::istream&,ITInt8 &);

    operator int() const;
    operator long() const;
    operator float() const;
    operator double() const;
    operator mi_int8() const;
    operator ITString() const;
#ifdef IT_COMPILER_HAS_LONG_LONG
    operator IT_LONG_LONG () const;
#endif
    ITBool IsNull() const;
};

////////////////////////////////////////////////////////////////
// OPERATION EXTENSION INTERFACES
////////////////////////////////////////////////////////////////

// These functions are used to set and get the operating system
// encapsulation object. This object can be defined by the user and
// set into the interface library to allow the interface to take
// advantage of specific operating system features in an abstract way.

// The ITSetOSObject function may only be called once in an
// application.
IT_EXPORTCLASS ITBool ITSetOSObject(ITEssential *object);
IT_EXPORTCLASS ITEssential *ITGetOSObject();

// This is the only interface currently defined for the operation
// extension object. This interface is used by the library to acquire
// a lock on the global data of the interface.
IT_INTERFACE ITMutex : public ITEssential
{
  public:
    // get mutex and wait until acquired
    virtual void IT_STDCALL GetMutex(ITErrorManager &errobj) = 0;

    // release mutex
    virtual void IT_STDCALL ReleaseMutex(ITErrorManager &errobj) = 0;

    // Is mutex busy?  Inquiry only
    virtual int IT_STDCALL InquireMutex(ITErrorManager &errobj) = 0;

    // attempt get and error if not available
    virtual int IT_STDCALL AttemptGetMutex(ITErrorManager &errorobj) = 0;
};


//
//  ITErrorManager -- base class functionality for managing error callbacks
//
//      ITErrorManager defines functionality used by a number of
//      subclasses for managing and dispatching errors for different
//      operations,such as issuing queries and retrieving results.
//

// This enum should match the definition of MI_CALLBACK_STATUS
typedef enum { IT_NOTHANDLED = 0,IT_HANDLED = 1} ITCallbackResult;

typedef  ITCallbackResult
    (*ITCallBackFuncPtr)(const ITErrorManager &errorobject,
                         void *userdata,long errorlevel);

// callback_function() is a C++ function with a C interface suitable for
// use with mi_register_callback().
extern "C" MI_CALLBACK_STATUS MI_PROC_CALLBACK
callback_function(MI_EVENT_TYPE et, MI_CONNECTION *cn, void *cd, void *ud);


class IT_EXPORTCLASS ITErrorManager : public ITObject
{
public:
    ITErrorManager(const ITConnection &);
    ITErrorManager(const ITErrorManager &);
    virtual ~ITErrorManager();
    ITErrorManager &operator=(const ITErrorManager &);
    ITBool Error() const;
    const ITString &SqlState() const;
    const ITString &ErrorText() const;
    ITBool AddCallback(ITCallBackFuncPtr userfunc,void *userdata);
    ITBool DelCallback(ITCallBackFuncPtr userfunc,void *userdata);
    ITBool Warn() const;
    const ITString &WarningText() const;
    ITBool DispatchErrorText(const ITString &message);
    ITBool DispatchError(int code,...);
protected:
    ITBool AddErrorManager(ITErrorManager *em);
    ITBool RemoveErrorManager(ITErrorManager *em);

protected:
    // Constructor for derived objects to use
    ITErrorManager(ITImpl *);

public:
    ITBool IsamError() const;
    const ITString &IsamErrorText() const;
};


//
//  ITDBInfo -- database information placeholder
//
//      This class is used to gather up information necessary to
//      establish connections to an Illustra server into a single
//      object. By placing this information in a single class future
//      implementations of the interface can enforce tighter security
//      restrictions on database access by adding derived classes which
//      define different and/or new properties.
//

class IT_EXPORTCLASS ITDBInfo : public ITErrorManager
{
public:
    typedef enum { Default,Log,BufferedLog,ANSIMode } CreateFlags;

    ITDBInfo();
    ITDBInfo(const ITString &db,
             const ITString &user = ITString(),
             const ITString &system = ITString(),
             const ITString &passwd = ITString());
    ITDBInfo(const ITDBInfo &);
    virtual ~ITDBInfo();
    ITDBInfo &operator=(const ITDBInfo &);
    ITBool operator==(const ITDBInfo &) const;
    ITBool Frozen() const;
    ITBool Freeze();
    ITBool SetUser(const ITString &);
    ITBool SetDatabase(const ITString &);
    ITBool SetSystem(const ITString &);
    ITBool SetPassword(const ITString &);
    const ITString &GetUser() const;
    const ITString &GetSystem() const;
    const ITString &GetDatabase() const;
    const ITString &GetDBLocaleName() const;
    ITBool CreateDatabase(int flags = ITDBInfo::Default,
                          const ITString &dbspace=ITString::Null);
    ITBool DropDatabase();
};


typedef  void (*ITRowCallBackPtr)(const ITErrorManager &errorobject,
                                  ITRow *rowdata,void *userdata);
//
//  ITQuery -- interface for issuing SQL queries to an Illustra server
//
//      ITQuery contains a number of methods for issuing queries to
//      the server, each of which processes results in different
//      ways. The ExecForStatus method executes the query and flushes
//      all results. This is useful for issuing non-SELECT
//      statements. The ExecOneRow executes a statement and returns a
//      row, but flushes any subsequent results. This is useful for
//      quickly issuing "SELECT UNIQUE" queries. The ExecForIteration
//      method provides a simple way of retrieving results from a
//      query, providing sequential access to the results of the
//      query. The ExecToSet method adds random access to these
//      capabilities: this method opens a cursor on the result set of
//      the query. The Set method has the advantage that other
//      database operations on the same connection can be interleaved
//      between the calls to Fetch, which is not possible with the
//      ExecForIteration method. You must be in a transaction to use
//      the ExecToSet method. The ExecForCallbacks method (initiality
//      implemented synchronously) can be used to issue queries
//      asynchronously: the callback function supplied will be called
//      for every row in the result set as it is received. The
//      ExecOneRow method is a simple interface for querys which
//      should return only one row, it will keep the first row and
//      drop the rest.
//

class IT_EXPORTCLASS ITQuery : public ITErrorManager
{
public:
    ITQuery(const ITConnection &);
    ITQuery(const ITQuery &);
    virtual ~ITQuery();
    ITQuery &operator=(const ITQuery &);
    ITBool ExecForStatus(const ITString &);
    ITRow *ExecOneRow(const ITString &,ITEssential **unknwn = NULL);
    ITSet *ExecToSet(const ITString &,ITEssential **unknwn = NULL);
    long RowCount();
    const ITString &Command();
    const ITString &QueryText();
    ITRef *ResultRef();
    ITBool ExecForIteration(const ITString &);
    ITRow *NextRow(ITEssential **unknwn = NULL);
    const ITTypeInfo *RowType();
    ITBool ExecForCallbacks(const ITString &,ITRowCallBackPtr func,
                            void *userdata,ITEssential **unknwn = NULL);
    ITBool Finish();
    ITInt8 LastSerial() const;
};

//
//  ITConnectionStamp -- maintain stamp information about a connection
//
//  Connection events can invalidate objects that the application
//  still has references to. Objects can check to see if an event
//  occurred on a connection by getting an ITConnectionStamp when
//  it is created, and checking to see if the stamp is still valid
//  later. ITConnectionStamps should be released like all other
//  objects.
//
class ITConnectionImpl;

class IT_EXPORTCLASS ITConnectionStamp : public ITObject
{
    // Connection stamps are created by the Interface on behalf of the
    // user.
protected:
    friend class ITConnectionImpl;
    ITConnectionStamp(ITConnectionImpl *);

public:
    ITConnectionStamp &operator=(const ITConnectionStamp &);

    // Most stringent test
    ITBool Equal(const ITConnectionStamp &) const;
    // Same connection instance?
    ITBool EqualConnInstance(const ITConnectionStamp &) const;
    // Same Transaction Instance?
    ITBool EqualTransactionInstance(const ITConnectionStamp &) const;

    ITConnectionStamp(const ITConnectionStamp &);
    virtual ~ITConnectionStamp();
};


//
//  ITConnection -- manage a database connection
//
//      The ITConnection class is used to open a connection to the
//      database server and to manage error control objects and
//      transaction states
//
class IT_EXPORTCLASS ITConnection : public ITErrorManager
{
public:
    // All-caps state names are obsolete
    enum ITTransactionState
    {
        None,NONE = None,
        Auto,AUTO = Auto,
        Begin,BEGIN = Begin,
        Commit,COMMIT = Commit,
        Abort,ABORT = Abort
    };
    ITConnection();
    ITConnection(const ITDBInfo &); // deprecated, do not use
    ITConnection(const ITConnection &);
    ITConnection(MI_CONNECTION *); // deprecated
    ITConnection(MI_CONNECTION *,enum ITTransactionState tstate);
    virtual ~ITConnection();
    ITConnection &operator=(const ITConnection &);
    ITBool Open();
    ITBool Open(const ITDBInfo &);
    ITBool Close();
    ITBool SetTransaction(enum ITTransactionState,ITCallBackFuncPtr func=NULL,
                          void *userdata=NULL);
    enum ITTransactionState GetTransactionState();
    MI_CONNECTION *CheckOutConn();
    ITBool CheckInConn();
    const ITDBInfo &GetDBInfo();

    // Get a copy of the transaction stamp
    const ITConnectionStamp &GetStamp();
    ITBool SetDBInfo(const ITDBInfo &);
    ITBool IsOpen() const;

    // used internally by C++ API
    MI_CONNECTION *GetConn();
};

//
// ITStatement -- encapsulates prepared DML statement.
//
class IT_EXPORTCLASS ITStatement : public ITErrorManager
{
public:
    ITStatement(const ITConnection &);
    ITStatement(const ITStatement &);
    virtual ~ITStatement();
    ITStatement &operator=(const ITStatement &);
    ITBool Prepare(const ITString &,int nargs = 0,
						 const ITString *typeNames = 0,
                   ITEssential **outerunkns = 0);
    ITBool Drop();
    const ITString &Command() const;
    const ITString &QueryText() const;
    int NumParams() const;
    ITValue *Param(int);
    ITBool Exec();
    long RowCount() const;
    ITBool SetParam(int,ITDatum *);
    ITInt8 LastSerial() const;
};

//
// ITCursor -- encapsulates the cursor
//

class IT_EXPORTCLASS ITCursor : public ITErrorManager
{
public:
    enum Flags {Sensitive = 2,ReadOnly = 4,Scrollable = 8,
                Reopt = 16,Hold = 32};
    ITCursor(const ITConnection &);
    ITCursor(const ITCursor &);
    virtual ~ITCursor();
    ITCursor &operator=(const ITCursor &);
    ITBool Prepare(const ITString &,int nargs = 0,
                   const ITString *typeNames = 0,
                   ITEssential **outerunkns = 0);
    ITBool Drop();
    const ITString &Command() const;
    const ITString &QueryText() const;
    int NumParams() const;
    ITValue *Param(int);
    ITBool IsScrollable() const;
    ITBool IsReadOnly() const;
    ITBool Open(int flags = 0,const ITString &tableName = ITString::Null);
    ITBool Close();
    ITValue *Fetch(ITEssential **outerunkn = NULL,
                   enum ITPosition pos = ITPositionNext,
                   long jump = 0);
    const ITString &Name() const;
    ITRow *NextRow(ITEssential **outerunkn = NULL,
                   enum ITPosition pos = ITPositionNext,
                   long jump = 0);
    ITBool UpdateCurrent();
    ITBool DeleteCurrent();
    ITBool Define(const ITString &sql,ITBool updatable = FALSE,
                  ITBool scrollable = FALSE)
        {
        return updatable ? FALSE // No table name parameter
            : !Prepare(sql) ? FALSE
                : Open(scrollable ? Scrollable | ReadOnly : ReadOnly);
        }
    const ITTypeInfo *RowType() const;
    ITBool SetParam(int,ITDatum *);
};

//
//  ITLargeObjectManager -- interface for large object support
//
//      This class provides an interface for manipulating server large
//      objects. Client Value objects that are, in the server, based
//      on large objects, should expose an ITLargeObject interface;
//      users creating such client Value objects will typically want
//      to do so using the ITLargeObjectManager class, which
//      implements much of the functionality for accessing large
//      objects.
//

#define IT_LO_RDONLY     MI_LO_RDONLY
#define IT_LO_APPEND     MI_LO_APPEND
#define IT_LO_WRONLY     MI_LO_WRONLY
#define IT_LO_RDWR       MI_LO_RDWR
#define IT_LO_DIRTY_READ MI_LO_DIRTY_READ

class IT_EXPORTCLASS ITLargeObjectManager : public ITErrorManager
{
public:
    ITLargeObjectManager(const ITConnection &);
    ITLargeObjectManager(const ITLargeObjectManager &);
    virtual ~ITLargeObjectManager();
    ITLargeObjectManager &operator=(const ITLargeObjectManager &);
    int Read(char *buf,int cnt);
    int Write(const char *buf,int cnt);
    ITInt8 Seek(ITInt8,int cntl = 0);
    ITInt8 Size();
    ITBool SetSize(ITInt8);
    const ITString &HandleText();
    const MI_LO_HANDLE *Handle();
    ITBool SetHandle(const MI_LO_HANDLE *handle,int flags = MI_LO_RDWR);
    ITBool SetHandleText(const ITString &handleText,int flags = MI_LO_RDWR);
    int Read(char *buf,int cnt,ITCallBackFuncPtr func,void *userdata);
    int Write(const char *buf,int cnt,ITCallBackFuncPtr func,
              void *userdata);
    ITBool CreateLO(int flags = IT_LO_WRONLY|IT_LO_APPEND);
    ITBool CreateLO(MI_LO_SPEC *,int flags=IT_LO_WRONLY |
        IT_LO_APPEND);
    ITBool Close();
};


//
//  ITTypeInfo -- encapsulates the type information
//
class IT_EXPORTCLASS ITTypeInfo : public ITObject
{
public:
    ITTypeInfo(const MI_TYPE_DESC *);
    ITTypeInfo(const MI_ROW_DESC *);
    // used by C++ API internaly
    ITTypeInfo(const ITConnection &,MI_ROW_DESC *);
    ITTypeInfo(const ITConnection &,MI_TYPE_DESC *);
    // can be used by the applications
    ITTypeInfo(                 // opaque types
        const ITConnection &conn,const ITString &type_name,
        long size,long precision,long scale,long qualifier,
        ITBool byvalue,const MI_TYPEID *ptypeid = 0);
    ITTypeInfo(                 // row types
        const ITConnection &conn,const ITString &type_name,
        long ncols,ITTypeInfo **colps,const ITString *colnames,
        const MI_TYPEID *ptypeid = 0);
    ITTypeInfo(                 // collection types
        const ITConnection &conn,const ITString &type_name,
        const ITString &quality,const ITTypeInfo &memberType,
        const MI_TYPEID *ptypeid = 0);
    ITTypeInfo(                 // constructed types
        const ITConnection &conn,const ITString &type_name,
        const ITTypeInfo &consType,const ITTypeInfo &memberType,
        const MI_TYPEID *ptypeid = 0);
    ITTypeInfo(                 // distinct types
        const ITConnection &conn,const ITString &type_name,
        const ITTypeInfo &source,const MI_TYPEID *ptypeid = 0);
    ITTypeInfo(                 // gets the type by name from the server
        ITConnection &,const ITString &,
        long precision = -1,long  scale = -1,long qualifier = -1);
    ITTypeInfo(const ITTypeInfo &);
    virtual ~ITTypeInfo();
    ITTypeInfo &operator=(const ITTypeInfo &);

    virtual const ITString &Name() const;
    virtual ITRef *TypeId() const;
    virtual ITBool IsSimple() const;
    virtual ITBool IsRow() const;
    virtual ITBool IsConstructed() const;
    virtual ITBool IsRef() const;
    virtual ITBool IsCollection() const;
    virtual ITBool IsDistinct() const;
    virtual ITBool SameType(const ITTypeInfo &) const;
    virtual ITBool CompatibleType(const ITTypeInfo &) const;
    ITBool IsComposite() const { return IsRow(); } // Backwards compatibility
    const MI_TYPEID *MiTypeId();

    // Distinct
    // Note that for backwards compatibility for collections only it returns
    // the member type. Still, new code should use MemberType().
    const ITTypeInfo *Source() const;

    // Simple type methods
    long Size() const;
    long Precision() const;
    long Scale() const;
    ITBool Variable() const;
    ITBool ByValue() const;
    long Qualifier() const;
    long Bound() const;
    long Parameter() const;

    // Row type methods
    long ColumnCount() const;
    const ITString &ColumnName(long) const;
    long ColumnId(const ITString &) const;
    const ITTypeInfo *ColumnType(long) const;
    const ITTypeInfo *ColumnType(const ITString &) const;

    // Container/Constructed type info
    const ITString &Quality() const; // constructor/collection name
    const ITTypeInfo *ConstructorType() const; // does not work for collections
    const ITTypeInfo *MemberType() const;

protected:
    ITTypeInfo(ITImpl *);       // for derived objects...
};

//
//  ITContainerIter
//
//      The ITContainerIter interface provides a common interface for
//      iterating over a result set, either a server setof() object or
//      a row row, and extracting C++ base-type values from the
//      set. It is useful for rapidly extracting data from a result
//      set.
//

class IT_EXPORTCLASS ITContainerIter : public ITObject
{
public:
    typedef enum {StateUninitialized,StateOK,StateOutOfBounds,
                  StateConversionFailed} StateCode;

    ITContainerIter(ITContainer *);     // object is object container
    ITContainerIter(ITContainCvt *);    // object is base-type container
    ITContainerIter(ITEssential *);     // Let iterator figure it out
    ITContainerIter(const ITContainerIter &);
    virtual ~ITContainerIter();

    virtual ITContainerIter &operator>>(ITValue * &); // no operator<<()
    virtual ITContainerIter &operator>>(long &);
    virtual ITContainerIter &operator>>(int &);
    virtual ITContainerIter &operator>>(short &);
    virtual ITContainerIter &operator>>(float &);
    virtual ITContainerIter &operator>>(double &);
    virtual ITContainerIter &operator>>(long double &);
    virtual ITContainerIter &operator>>(const char * &);
    virtual ITContainerIter &operator>>(ITString &);
    virtual ITContainerIter &operator<<(long);
    virtual ITContainerIter &operator<<(int);
    virtual ITContainerIter &operator<<(short);
    virtual ITContainerIter &operator<<(float);
    virtual ITContainerIter &operator<<(double);
    virtual ITContainerIter &operator<<(long double);
    virtual ITContainerIter &operator<<(const char *);
    virtual ITContainerIter &operator<<(const ITString &);
    virtual ITContainerIter &operator>>(ITInt8 &);
    virtual ITContainerIter &operator<<(ITInt8);
    virtual ITContainerIter &operator>>(bool &);
    virtual ITContainerIter &operator<<(bool);

    virtual StateCode State();
    virtual int Index();
    virtual void Reset();
};

////////////////
//ITDBNameList
///////////////
class  IT_EXPORTCLASS ITDBNameList : public ITErrorManager
{
public:
    ITDBNameList();
    ITBool Create();
    ITBool Create(const ITString &);
    ITBool Create(ITConnection &);
    ITDBNameList(const ITDBNameList &);
    virtual ~ITDBNameList();
    ITDBNameList &operator=(const ITDBNameList &);
    const ITString &NextDBName();
    const ITString &PreviousDBName();
    void Reset();
    ITBool IsDBName(const ITString &);
};

//////////////////////////
//ITSystemNameList
//////////////////////////

class  IT_EXPORTCLASS ITSystemNameList : public ITErrorManager
{
public:
    ITSystemNameList();
    ITSystemNameList(const ITSystemNameList &);
    virtual ~ITSystemNameList();
    ITSystemNameList &operator=(const ITSystemNameList &);
    ITBool Create();
    const ITString &NextSystemName();
    const ITString &PreviousSystemName();
    void Reset();
    ITBool IsSystemName(const ITString &);
};

//
// ITWChar is a synonym for the GLS wide character (2 bytes) type gl_wchar_t
// and is used in the ITLocale methods for wide characters
// and wide character strings. Note that depending on GLS library build
// it may not correspond to wchar_t.
//
typedef gl_wchar_t ITWChar;

//
//  ITLocale -- encapsulation of the Informix GLS API
//
//   This class encapsulates the GLS API functions and is the
//   public interface to expose the GLS API.
//
class IT_EXPORTCLASS ITLocale : public ITErrorManager
{
private:
    ITLocale();

public:
    enum { ScanToNul = IFX_GL_NULL,ScanNoLimit = IFX_GL_NO_LIMIT,
    MaxMCharBytes = IFX_GL_MB_MAX };

    // get the client locale
    static const ITLocale *Current();

    // error handling
    int GetError() const;

    // string collation
    int MCollate(const char *s1,const char *s2,
                 int nbytes1 = ITLocale::ScanToNul,
                 int nbytes2 = ITLocale::ScanToNul) const;
    int WCollate(const ITWChar *s1,const ITWChar *s2,
                 int nwchars1 = ITLocale::ScanToNul,
                 int nwchars2 = ITLocale::ScanToNul) const;

    // string operations
    int MConcatenate(char *s1,const char *s2,
                     int nbytes1 = ITLocale::ScanToNul,
                     int nbytes2 = ITLocale::ScanToNul) const;
    char *MScan(const char *s,const char *mchar,
                int nstrbytes = ITLocale::ScanToNul,
                int nmcharbytes = ITLocale::ScanNoLimit) const;
    int MCopy(char *to,const char *from,
              int nfrombytes = ITLocale::ScanToNul) const;
    int MComplSpanSize(const char *s1,const char *s2,
                       int nbytes1 = ITLocale::ScanToNul,
                       int nbytes2 = ITLocale::ScanToNul) const;
    int MLength(const char *s,int nbytes = ITLocale::ScanToNul) const;
    char *MFindSubstr(const char *s1,const char *s2,
                       int nbytes1 = ITLocale::ScanToNul,
                       int nbytes2 = ITLocale::ScanToNul) const;
    int MNConcatenate(char *to,const char *from,int limit,
                       int ntobytes = ITLocale::ScanToNul,
                       int nfrombytes = ITLocale::ScanToNul) const;
    int MNCopy(char *to,const char *from,int limit,
               int nfrombytes = ITLocale::ScanToNul) const;
    int MNTSBytes(const char *s,int nbytes = ITLocale::ScanToNul) const;
    int MNTSLength(const char *s,int nbytes = ITLocale::ScanToNul) const;
    char *MSpan(const char *s1,const char *s2,
                int nbytes1 = ITLocale::ScanToNul,
                int nbytes2 = ITLocale::ScanToNul) const;
    char *MRScan(const char *s,const char *c,
                 int nsbytes = ITLocale::ScanToNul,
                 int ncbytes = ITLocale::ScanNoLimit) const;
    int MSpanSize(const char *s1,const char *s2,
                  int nbytes1 = ITLocale::ScanToNul,
                  int nbytes2 = ITLocale::ScanToNul) const;
    int WConcatenate(ITWChar *to,const ITWChar *from,
                     int nfromwchars = ITLocale::ScanToNul,
                     int ntowchars = ITLocale::ScanToNul) const;
    ITWChar *WScan(const ITWChar *s,ITWChar c,
                   int nswchars = ITLocale::ScanToNul) const;
    int WCopy(ITWChar *to,const ITWChar *from,
              int nfromwchars = ITLocale::ScanToNul) const;
    int WComplSpanSize(const ITWChar *s1,const ITWChar *s2,
                       int nwchars1 = ITLocale::ScanToNul,
                       int nwchars2 = ITLocale::ScanToNul) const;
    int WLength(const ITWChar *s) const;
    int WNConcatenate(ITWChar *to,const ITWChar *from,int limit,
                      int nfromwchars = ITLocale::ScanToNul,
                      int ntowchars = ITLocale::ScanToNul) const;
    int WNCopy(ITWChar *to,const ITWChar *from,int limit,
               int nfromwchars = ITLocale::ScanToNul) const;
    int WNTSLength(const ITWChar *s,
                   int nwchars = ITLocale::ScanToNul) const;
    ITWChar *WSpan(const ITWChar *s1,const ITWChar *s2,
                   int nwchars1 = ITLocale::ScanToNul,
                   int nwchars2 = ITLocale::ScanToNul) const;
    ITWChar *WRScan(const ITWChar *s,ITWChar c,
                    int nswchars = ITLocale::ScanToNul) const;
    int WSpanSize(const ITWChar *s1,const ITWChar *s2,
                  int nwchars1 = ITLocale::ScanToNul,
                  int nwchars2 = ITLocale::ScanToNul) const;
    ITWChar *WFindSubstr(const ITWChar *s1,const ITWChar *s2,
                         int nwchars1 = ITLocale::ScanToNul,
                         int nwchars2 = ITLocale::ScanToNul) const;

    // codeset conversion
    const char *LocaleName() const;
    int ConvertCodeset(char *to,const char *from,
                       const char *toLocaleName,
                       const char *fromLocaleName) const;
    int NeedToConvertCodeset(const char *toLocaleName,
                             const char *fromLocaleName) const;
    int SizeForCodesetConversion(const char *toLocaleName,
                                 const char *fromLocaleName,
                                 int nfrombytes) const;

    // character classification (one character)
    ITBool IsAlnum(const char *c,
                   int nbytes = ITLocale::ScanNoLimit) const;
    ITBool IsAlpha(const char *c,
                   int nbytes = ITLocale::ScanNoLimit) const;
    ITBool IsBlank(const char *c,
                   int nbytes = ITLocale::ScanNoLimit) const;
    ITBool IsCntrl(const char *c,
                   int nbytes = ITLocale::ScanNoLimit) const;
    ITBool IsDigit(const char *c,
                   int nbytes = ITLocale::ScanNoLimit) const;
    ITBool IsGraph(const char *c,
                   int nbytes = ITLocale::ScanNoLimit) const;
    ITBool IsLower(const char *c,
                   int nbytes = ITLocale::ScanNoLimit) const;
    ITBool IsPrint(const char *c,
                   int nbytes = ITLocale::ScanNoLimit) const;
    ITBool IsPunct(const char *c,
                   int nbytes = ITLocale::ScanNoLimit) const;
    ITBool IsSpace(const char *c,
                   int nbytes = ITLocale::ScanNoLimit) const;
    ITBool IsUpper(const char *c,
                   int nbytes = ITLocale::ScanNoLimit) const;
    ITBool IsXDigit(const char *c,
                    int nbytes = ITLocale::ScanNoLimit) const;
    ITBool IsAlnum(ITWChar c) const;
    ITBool IsAlpha(ITWChar c) const;
    ITBool IsBlank(ITWChar c) const;
    ITBool IsCntrl(ITWChar c) const;
    ITBool IsDigit(ITWChar c) const;
    ITBool IsGraph(ITWChar c) const;
    ITBool IsLower(ITWChar c) const;
    ITBool IsPrint(ITWChar c) const;
    ITBool IsPunct(ITWChar c) const;
    ITBool IsSpace(ITWChar c) const;
    ITBool IsUpper(ITWChar c) const;
    ITBool IsXDigit(ITWChar c) const;

    // case conversion (one character)
    unsigned short ToUpper(char *to,const char *from,
                           unsigned short &nfrombytes,
                           int nbytes = ITLocale::ScanNoLimit) const;
    unsigned short ToLower(char *to,const char *from,
                           unsigned short &nfrombytes,
                           int nbytes = ITLocale::ScanNoLimit) const;
    ITWChar ToUpper(ITWChar c) const;
    ITWChar ToLower(ITWChar c) const;

    // locale-sensitive conversions
    mi_date ConvertDate(const ITString &str,
                        const ITString &format = ITString::Null) const;
    ITString FormatDate(const mi_date *d,
                        const ITString &format = ITString::Null) const;
    mi_datetime ConvertDatetime(const ITString &str,
                                const ITString &format = ITString::Null) const;
    ITString FormatDatetime(const mi_datetime *dt,
                            const ITString &format = ITString::Null) const;
    mi_decimal ConvertNumber(const ITString &str,
                             const ITString &format = ITString::Null) const;
    ITString FormatNumber(const mi_decimal *dec,
                          const ITString &format = ITString::Null) const;
    mi_money ConvertMoney(const ITString &str,
                          const ITString &format = ITString::Null) const;
    ITString FormatMoney(const mi_money *m,
                         const ITString &format = ITString::Null) const;

    // conversions between multibyte and wide representations
    int MToWString(ITWChar *to,const char *from,int limit,
                   int nfrombytes = ITLocale::ScanToNul) const;
    ITWChar MToWChar(const char *from,
                     int nfrombytes = ITLocale::ScanNoLimit) const;
    int WToMString(char *to,const ITWChar *from,int limit,
                   int nfromsize = ITLocale::ScanToNul) const;
    int WToMChar(char *to,const ITWChar from) const;

    // max multibyte char size in the locale
    int MCharBytes() const;

    // navigation in multibyte strings
    int MCharLen(const char *s,
                 int nbytes = ITLocale::ScanNoLimit) const;
    char *MNextChar(const char *s,
                    int nbytes = ITLocale::ScanNoLimit) const;
    char *MPrevChar(const char *s,const char *c) const;
};

//
// ITRoutineManager -- encapsulates function descriptor
//
class IT_EXPORTCLASS ITRoutineManager : public ITErrorManager
{
public:
    ITRoutineManager(ITConnection &);
    virtual ~ITRoutineManager();
    ITRoutineManager(const ITRoutineManager &);
    ITRoutineManager &operator=(const ITRoutineManager &);

    ITBool GetRoutine(const ITString &signature);
    // Gets from the server the descriptor for the routine with
    // the given signature; retuns TRUE if succeedes, else - FALSE.
    const ITTypeInfo *ResultType() const;
    // Returns the pointer to the result's typeinfo, NULL
    // if did not get the routine
    int NumParams() const;
    // Returns the number of parameters, -1 if
    // did not get the routine.
    const ITTypeInfo *ParamType(int paramno) const;
    // Returns the pointer to the parameter type, NULL if
    // did not get the routine or if argument
    // is out of bounds.
    ITValue *Param(int paramno) const;
    // Returns the pointer to the parameter value object,
    // NULL if did not get the routine or if
    // argument is out of bounds.
    ITBool SetParam(int paramno,ITDatum *pdatum);
    // Sets the parameter value object for a specified parameter.
    // Returns TRUE on success, FALSE if did not get
    // the routine or if paramno is out
    // of bounds.
    ITValue *ExecForValue(ITEssential **outerunkn = NULL);
    // Executes the routine with the set parameters.
    // Returns the pointer to ITValue interface of
    // the value object, instantiated for the return
    // value, NULL if did not get the routine
    // or if execution failed.
};

//
// Extensible Class Factory Manager
//
// Code to support extended server datatypes can be added
// to this c++ interface by writing a factory construction method
// and registering it with the ITFactoryList constructor.  This constructor
// is safe to use as a file scope constructor which allows link time
// addition of new datatypes to this interface.  See documentation
// for details on writing these types
//
typedef  ITValue *(*ITFactoryFuncPtr)(ITMVDesc *);

class IT_EXPORTCLASS ITFactoryList
{
protected:
    ITString dtypename;
    ITFactoryFuncPtr funcptr;
    ITBool flushable;
    ITFactoryList *smaller,*bigger;
    static ITFactoryList *Head;
    static ITFactoryList *DynamicHead;

    // Used to return the factory function pointer. If this is a
    // symbol in a dynamically loaded library this is the point at
    // which the library will be loaded
    virtual ITFactoryFuncPtr GetFuncPtr(ITErrorManager &);

    // Internal function that forms the tree of ITFactoryList instances
    // starting with Head for searching in GetFactory()
    ITFactoryList *push(ITFactoryList *);

    // Internal function that searches subtree for a factory by name.
    static ITFactoryList *findFactory(ITFactoryList *,const char *);

    // Internal function to flush the factory subtree
    static void flush(ITFactoryList *);

public:
    // Internal helper function
    static ITFactoryFuncPtr GetFactory(const ITString &,ITConnection *);

    static ITValue *DatumToValue(ITMVDesc &);

    // This function can be used to initialize the built-in factory
    // list in the event that the compiler does not perform this
    // initialization automatically.
    static void Init();

    // These are the built-in factory list initialization state values
    enum InitState { NOTINIT,INITING,INITED };

    // This function can be used to determine if the built-in factory
    // list initialized properly. It returns ITFactoryList::NOTINIT
    // if initialization failed.
    static InitState GetInitState();

    // This constructor should be used by application globals to add a
    // map to the factory list
    ITFactoryList(const char *name,
                  ITFactoryFuncPtr func,
                  ITBool flushable = false);

    // Used internally to look up a class factory from the global list
    static ITFactoryFuncPtr GetFactory(const ITMVDesc *);

    // Used by an application when it wants to force a reload of the
    // object map files. The object map files map from server types to
    // dynamically loadable libraries that contain functions for
    // building value objects. If the application decides the map has
    // changed it can call this procedure to reload the maps.
    static void ReloadMapFiles(ITErrorManager *errobj);

    // Used by an application in case it wants to force an unload of
    // all the dynamically loaded libraries and clear the list of
    // factories of any dynamic entries. Unless the application does
    // not want to scan the map files after dumping, it should not
    // call this method: use ReloadMapFiles() instead, which
    // implicitly does a flush.
    static ITBool FlushDynamicFactories(ITErrorManager *errobj);

    virtual ~ITFactoryList();
};

#endif // _ITCPPOP_H_



