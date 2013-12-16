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
//  Title:       itcppval.h
//  Description: Value class definitions for IBM Informix OIC++ Library
//
//    Interface class definitions for Value classes. The C++ interface
//    Value classes are implemented as "interface only" classes. Note
//    that these class have no constructors or destructors, and all
//    their member functions are defined to be pure virtual.
//
//    The goal of this design is to let users implement new client
//    objects to represent server datatypes, without creating
//    dependencies on a particular implementation of an interface. By
//    exposing common interfaces to these objects, existing
//    applications can treat all Value objects uniformly, while still
//    providing a framework for applications that understand any
//    user-defined interfaces.
//
//    On platforms that support Microsoft's COM interface model, these
//    interfaces are directly compatible with COM. This allows us to
//    create Value objects for OLE server objects. A number of
//    documents explain the motivation and benefits of the COM
//    interface model.
//
//***************************************************************************

#ifndef _ITCPPVAL_H_
#define _ITCPPVAL_H_
class ITConnection;
class ITTypeInfo;
class IT_FRAMESTRCLASS;
class ITString;
class ITInt8;

enum ITPosition { ITPositionNext     = MI_CURSOR_NEXT,
                  ITPositionPrior    = MI_CURSOR_PRIOR,
                  ITPositionFirst    = MI_CURSOR_FIRST,
                  ITPositionLast     = MI_CURSOR_LAST,
                  ITPositionAbsolute = MI_CURSOR_ABSOLUTE,
                  ITPositionRelative = MI_CURSOR_RELATIVE,
                  ITPositionCurrent  = MI_CURSOR_RELATIVE };

// This is a simple interface, one can preserve the data pointed to
// by vf_data by AddRef against the vf_preservedata member.  Release to signal
// that you are done.  Only needed if your datatype copies to vf_data
// pointer only, not the underlying data.

class IT_EXPORTCLASS ITPreserveData
{
public:
    virtual unsigned long AddRef() = 0;
    virtual unsigned long Release() = 0;
};

// Obsolete
#define ITPreserveRow ITPreserveData

// ITEssential
//
// This is the base class of all interfaces. On systems that support
// COM, it is an alias for the IUnknown interface; on systems that do
// not, the IUnknown interface is simulated
//
// Interface identifier codes. COM interface identifiers are 128-bit
// values. On COM systems, the C++ Interface Value interface
// identifers are 128 bit GUIDs that follow COM conventions; the
// sub-id listed below is the distinct component of the GUID. On
// non-COM systems, they are a long integers; the sub-id listed below
// is the entire identifier.

#define ITNoSuchSID       0
#define ITEssentialSID    1
#define ITValueSID        2
#define ITRowSID          3
#define ITRawDataSID      4
#define ITConversionsSID  5
#define ITLargeObjectSID  6
#define ITSetSID          7
#define ITSeqSetSID       7
#define ITOidSID          8
#define ITRefSID          8
#define ITDateTimeSID     9
#define ITContainerSID   10
#define ITErrorInfoSID   11
#define ITContainCvtSID  13
#define ITMutexSID       14
#define ITDatumSID       15
#define ITCollectionSID  16

//    The following error code mapping is for tranparent support of
//    error codes between COM and non-COM systems. COM interfaces
//    return HRESULT error codes. The ITOpError macro can be used to
//    detect errors portably.

#ifdef  IT_COM_COMPATIBLE

#include <objbase.h>

#define  IT_STDCALL  STDAPICALLTYPE

#define  ITOpError(x)  (FAILED(x))

// Return value for a successfully executed QueryInterface call
// For COM platforms use the predefined HRESULT macro for this purpose.
#define IT_QUERYINTERFACE_SUCCESS  S_OK
#define IT_QUERYINTERFACE_FAILED   S_FALSE

typedef GUID ITInterfaceID;
typedef HRESULT ITOpErrorCode;

#define ITEssentialIID IID_IUnknown

IT_EXPORTCLASS extern const ITInterfaceID ITValueIID;
IT_EXPORTCLASS extern const ITInterfaceID ITRowIID;
IT_EXPORTCLASS extern const ITInterfaceID ITRawDataIID;
IT_EXPORTCLASS extern const ITInterfaceID ITConversionsIID;
IT_EXPORTCLASS extern const ITInterfaceID ITLargeObjectIID;
IT_EXPORTCLASS extern const ITInterfaceID ITSetIID;
IT_EXPORTCLASS extern const ITInterfaceID ITOidIID;
IT_EXPORTCLASS extern const ITInterfaceID ITRefIID;
IT_EXPORTCLASS extern const ITInterfaceID ITDateTimeIID;
IT_EXPORTCLASS extern const ITInterfaceID ITContainerIID;
IT_EXPORTCLASS extern const ITInterfaceID ITErrorInfoIID;
IT_EXPORTCLASS extern const ITInterfaceID ITSeqSetIID;
IT_EXPORTCLASS extern const ITInterfaceID ITContainCvtIID;
IT_EXPORTCLASS extern const ITInterfaceID ITMutexIID;
IT_EXPORTCLASS extern const ITInterfaceID ITDatumIID;
IT_EXPORTCLASS extern const ITInterfaceID ITCollectionIID;

unsigned long IT_EXPORTCLASS IT_STDCALL ITIIDtoSID(const ITInterfaceID &id);

#define ITEssential IUnknown

#else // IT_COM_COMPATIBLE

#define IT_STDCALL

#define ITOpError(x) (x)

typedef unsigned long ITInterfaceID;
typedef long ITOpErrorCode;

// Return value for a successfully executed QueryInterface call
#define IT_QUERYINTERFACE_SUCCESS TRUE
#define IT_QUERYINTERFACE_FAILED FALSE


const ITInterfaceID ITEssentialIID=ITEssentialSID;
const ITInterfaceID ITValueIID=ITValueSID;
const ITInterfaceID ITRowIID=ITRowSID;
const ITInterfaceID ITRawDataIID=ITRawDataSID;
const ITInterfaceID ITConversionsIID=ITConversionsSID;
const ITInterfaceID ITLargeObjectIID=ITLargeObjectSID;
const ITInterfaceID ITSetIID=ITSetSID;
const ITInterfaceID ITOidIID=ITOidSID;
const ITInterfaceID ITRefIID=ITRefSID;
const ITInterfaceID ITDateTimeIID=ITDateTimeSID;
const ITInterfaceID ITContainerIID=ITContainerSID;
const ITInterfaceID ITErrorInfoIID=ITErrorInfoSID;
const ITInterfaceID ITSeqSetIID=ITSeqSetSID;
const ITInterfaceID ITContainCvtIID=ITContainCvtSID;
const ITInterfaceID ITMutexIID=ITMutexSID;
const ITInterfaceID ITDatumIID=ITDatumSID;
const ITInterfaceID ITCollectionIID=ITCollectionSID;

inline unsigned long IT_STDCALL ITIIDtoSID(const ITInterfaceID &id) { return id; }

//    The Essential interface definition for non-COM systems.

IT_INTERFACE ITEssential
{
public:
    virtual ITOpErrorCode IT_STDCALL QueryInterface(const ITInterfaceID &ifiid,
        void **resultif) = 0;
    virtual unsigned long IT_STDCALL AddRef() = 0;
    virtual unsigned long IT_STDCALL Release() = 0;
};

#endif

// Backwards compatibility
#define ITComposite  ITRow
#define ITComositeIID  ITRowIID
#define ITCompositeSID  ITRowSID

#ifdef __sgi
#define IT_DEFAULT_INT_IS_UNSIGNED
#endif

#ifdef IT_DEFAULT_INT_IS_UNSIGNED
#define IT_SIGNED signed
#else
#define IT_SIGNED
#endif

//  ITValue -- base Value class
//
//      All database classes should support at least the following
//      interface. This interface allows API programmers to detect if
//      the value is NULL, to get a printable representation of
//      the data, and get database type information via ITTypeInfo.
//
IT_INTERFACE ITValue : public ITEssential
{
public:
    virtual const ITString & IT_STDCALL Printable() = 0;
    virtual const ITTypeInfo & IT_STDCALL TypeOf() = 0;
    virtual ITBool IT_STDCALL IsNull() = 0;
    virtual ITBool IT_STDCALL SameType(ITValue *) = 0;
    virtual ITBool IT_STDCALL CompatibleType(ITValue *) = 0;
    virtual ITBool IT_STDCALL Equal(ITValue *) = 0;
    virtual ITBool IT_STDCALL LessThan(ITValue *) = 0;
    virtual ITBool IT_STDCALL IsUpdated() = 0;
    virtual ITBool IT_STDCALL FromPrintable(const ITString &) = 0;
    virtual ITBool IT_STDCALL SetNull() = 0;
};

//  ITDatum -- Value class that supports access to datum
//
//      All database classes should support this interface if
//      they want to provide access to the underlying data.
//      This interface allows API programmers to retrieve or
//      set the underlying datum and determine its length. In
//      addition, access to the value object's connection is available.
//
IT_INTERFACE ITDatum : public ITValue
{
public:
    virtual MI_DATUM IT_STDCALL Data() = 0;
    virtual long     IT_STDCALL DataLength() = 0;
    virtual ITBool   IT_STDCALL SetData
        (MI_DATUM data,long dataLen,ITPreserveData *preservedata = NULL) = 0;
    virtual const ITConnection& IT_STDCALL Connection() = 0;
};

//  ITConversions -- convert value to C++ base types
//
//      This class provides conversions of a given object to a C++
//      base type.
//
IT_INTERFACE ITConversions : public ITEssential
{
public:
    // Convert interfaces
    virtual ITBool IT_STDCALL ConvertTo(short &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(short) = 0;
    virtual ITBool IT_STDCALL ConvertTo(int &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(int) = 0;
    virtual ITBool IT_STDCALL ConvertTo(long &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(long) = 0;
    virtual ITBool IT_STDCALL ConvertTo(float &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(float) = 0;
    virtual ITBool IT_STDCALL ConvertTo(double &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(double) = 0;
    virtual ITBool IT_STDCALL ConvertTo(long double &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(long double) = 0;
    virtual ITBool IT_STDCALL ConvertTo(const char * &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(const char *) = 0;
    virtual ITBool IT_STDCALL ConvertTo(ITString &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(const ITString &) = 0;
    virtual ITBool IT_STDCALL ConvertTo(ITInt8 &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(ITInt8) = 0;
    virtual ITBool IT_STDCALL ConvertTo(bool &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(bool) = 0;
};

//  ITLargeObject -- large object interface
//
//      This class provides an interface for manipulating server large
//      objects. Client Value objects that are, in the server, based
//      on large objects, should expose an ITLargeObject interface;
//      users creating such client Value objects will typically want
//      to do so using the ITLargeObjectManager class, which
//      implements much of the functionality for accessing large
//      objects.
//
IT_INTERFACE ITLargeObject : public ITEssential
{
public:
    virtual const MI_LO_HANDLE * IT_STDCALL Handle() = 0;
    virtual ITBool IT_STDCALL SetHandle(const MI_LO_HANDLE *,
                                    int flags = MI_LO_RDWR) = 0;
    virtual int IT_STDCALL Read(char *buf,int cnt) = 0;
    virtual int IT_STDCALL Write(const char *buf,int cnt) = 0;
    virtual ITInt8 IT_STDCALL Seek(ITInt8,int cntl = 0) = 0;
    virtual ITInt8 IT_STDCALL Size() = 0;
    virtual ITBool IT_STDCALL SetSize(ITInt8) = 0;
};

//  ITDateTime -- interface for date-time objects
//
//      Any object that has a specific date associated should expose
//      an ITDateTime interface. This interface allows the API
//      programmer to access this date and time information.
//
IT_INTERFACE ITDateTime : public ITValue
{
public:
    virtual int IT_STDCALL Year() = 0;
    virtual int IT_STDCALL Month() = 0;
    virtual int IT_STDCALL Day() = 0;
    virtual int IT_STDCALL Hour() = 0;
    virtual int IT_STDCALL Minute() = 0;
    virtual float IT_STDCALL Second() = 0;
    virtual ITBool IT_STDCALL FromDate(int year,int month,int day) = 0;
    virtual ITBool IT_STDCALL FromTime(int hour,int minute,float second) = 0;
};

//  ITRow -- row data interface
//
//      A Value object that is a database row should expose an
//      ITRow interface. This interface allows access to the
//      columns in a row object.
//
IT_INTERFACE ITRow : public ITValue
{
public:
    virtual long IT_STDCALL NumColumns() = 0;
    virtual ITValue * IT_STDCALL Column(long,ITEssential **unknwn = NULL) = 0;
    virtual ITValue * IT_STDCALL Column(const ITString &,ITEssential **unknwn = NULL) = 0;
};

//  ITRef -- dereference ref objects
//
//      If a Value object is or contains ref, expose the ITRef
//      interface to let API programmers to dereference the ref and
//      get the row value associated with the object.
//
IT_INTERFACE ITRef : public ITValue
{
public:
    virtual ITRef * IT_STDCALL GetTableId() = 0;
    virtual ITRow * IT_STDCALL DeRef(ITEssential **unknwn = NULL) = 0;
};
typedef ITRef ITOid;

//  ITRawData -- fallback Value interface
//
//      If the class factory cannot find a factory for a given
//      database type, it returns an object which supports the ITRawData
//      interface. This interface allows low-level binary data access.
//      This object does support the ITValue interface but the semantics
//      of those methods on unknown types are undefined.
//
IT_INTERFACE ITRawData : public ITEssential
{
public:
    virtual const char * IT_STDCALL Data() = 0;
    virtual long IT_STDCALL DataLength() = 0;
    virtual ITBool IT_STDCALL SetData(const char *data,long dataLength) = 0;
};

//  ITContainer -- base class for interfaces that contain Value objects
//
//      Objects that in turn contain other objects can expose the
//      ITContainer interface on the object. This allows API
//      programmers to use an ITContainerIter iterator to iterate over
//      the subobjects.
//
IT_INTERFACE ITContainer : public ITEssential
{
public:
    virtual ITValue * IT_STDCALL GetItem(long position,ITEssential **unknwn = NULL) = 0;
    virtual long IT_STDCALL NumItems() = 0;
};

//  ITSet -- set-value interface
//
//      The ITSet interface is primarily for collections
//
IT_INTERFACE ITSet : public ITValue
{
public:
    virtual ITBool IT_STDCALL IsScrollable() = 0;
    virtual ITBool IT_STDCALL IsReadOnly() = 0;
    virtual ITBool IT_STDCALL Open() = 0;
    virtual ITBool IT_STDCALL Close() = 0;
    virtual ITBool IT_STDCALL Delete(enum ITPosition pos = ITPositionCurrent,
        long jump = 0) = 0;
    virtual ITBool IT_STDCALL Insert(ITDatum *item,
        enum ITPosition = ITPositionCurrent,long jump = 0) = 0;
    virtual ITValue * IT_STDCALL Fetch(ITEssential **outerunkn = NULL,
        enum ITPosition pos = ITPositionNext,long jump = 0) = 0;
    virtual ITValue * IT_STDCALL MakeItem(ITEssential **outerunkn = NULL) = 0;
};

#define ITSeqSet ITSet

//  ITContainCvt -- decompose value into C++ base types
//
//      This interface allows an object to be decomposed into C++
//      base type instanes. It is used by the ITContainerIter class to
//      extract values from an object. It should be used for objects
//      that are naturally represented by base type arrays, like
//      a point list.
//
IT_INTERFACE ITContainCvt : public ITEssential
{
public:
    // Meta data
    virtual long IT_STDCALL NumItems() = 0;

    // Convert interfaces
    virtual ITBool IT_STDCALL ConvertTo(long,short &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(long,short) = 0;
    virtual ITBool IT_STDCALL ConvertTo(long,int &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(long,int) = 0;
    virtual ITBool IT_STDCALL ConvertTo(long,long &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(long,long) = 0;
    virtual ITBool IT_STDCALL ConvertTo(long,float &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(long,float) = 0;
    virtual ITBool IT_STDCALL ConvertTo(long,double &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(long,double) = 0;
    virtual ITBool IT_STDCALL ConvertTo(long,long double &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(long,long double) = 0;
    virtual ITBool IT_STDCALL ConvertTo(long,const char * &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(long,const char *) = 0;
    virtual ITBool IT_STDCALL ConvertTo(long,ITString &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(long,const ITString &) = 0;
    virtual ITBool IT_STDCALL ConvertTo(long,ITInt8 &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(long,ITInt8) = 0;
    virtual ITBool IT_STDCALL ConvertTo(long,bool &) = 0;
    virtual ITBool IT_STDCALL ConvertFrom(long,bool) = 0;
};

//  ITErrorInfo -- extract information about an error from an object
//
//  Some value objects, such as sets and large objects can produce
//  SQL level errors since SQL operations may be used
//  to get the actual data values.  Those SQL operations can cause
//  SQL errors.  If a value object can produce an SQL error, it
//  should support this interface to let a program see the SQL error.
//
IT_INTERFACE ITErrorInfo : public ITEssential
{
public:
    virtual ITBool IT_STDCALL Error() = 0;
    virtual const ITString & IT_STDCALL SqlState() = 0;
    virtual const ITString & IT_STDCALL ErrorText() = 0;
    virtual ITBool IT_STDCALL IsamError() = 0;
    virtual const ITString & IT_STDCALL IsamErrorText() = 0;
};

//  ITMVDesc -- data descriptor used by class factories.
//
//      This is the data descriptor passed into value factory
//      functions. Value objects must provide a static function that
//      takes a single argument, an ITMVDesc *, to create the object out
//      of a database row or column. This function then returns an ITValue
//      interface pointer. This class factory function is registered
//      to the class factory list by creating static instances of the
//      ITFactoryList class below.
//
struct ITMVDesc
{
    long          vf_datalength;       // Data Length
    ITConnection *vf_connection;       // Connection
    int           vf_libmivaluetype;   // return value of mi_value {null/row/normal/...}
    char         *vf_data;             // data
    ITTypeInfo   *vf_origtypeinfo;     // typeinfo
    ITEssential  *vf_outerunknown;     // unknown pointer for delegation
    ITPreserveData *vf_preservedata;   // preserve data interface
    MI_TYPE_DESC *vf_typedesc;         // obsolete; always NULL
};


#endif // _ITCPPVAL_H_
