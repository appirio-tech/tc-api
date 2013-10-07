/*
 * Result set
 */

#include "result.h"

/*
Col: 0, name: boolean_val, type: boolean
Col: 1, name: char_val, type: char
Col: 2, name: character_val, type: char
Col: 3, name: date_val, type: date
Col: 4, name: datetime_val, type: datetime
Col: 5, name: dec_val, type: decimal
Col: 6, name: decimal_val, type: decimal
Col: 7, name: double_val, type: float
Col: 8, name: float_val, type: float
Col: 9, name: int_val, type: integer
Col: 10, name: int8_val, type: int8
Col: 11, name: integer_val, type: integer
Col: 12, name: interval_ds_val, type: interval
Col: 13, name: interval_ym_val, type: interval
Col: 14, name: lvarchar_val, type: lvarchar
Col: 15, name: numeric_val, type: decimal
Col: 16, name: money_val, type: money
Col: 17, name: real_val, type: smallfloat
Col: 18, name: serial_val, type: serial
Col: 19, name: smallfloat_val, type: smallfloat
Col: 20, name: smallint_val, type: smallint
Col: 21, name: text_val, type: text
Col: 22, name: byte_val, type: byte
Col: 23, name: varchar_val, type: varchar
Col: 24, name: large_object_val, type: blob
Col: 25, name: large_text_val, type: clob
Col: 26, name: cnstr_val, type: cnstr_type
Col: 27, name: setof_base_val, type: SET(integer not null)
Col: 28, name: setof_cnstr, type: SET(cnstr_type not null)
Col: 29, name: boolean_null, type: boolean
Col: 30, name: char_null, type: char
Col: 31, name: character_null, type: char
Col: 32, name: date_null, type: date
Col: 33, name: datetime_null, type: datetime
Col: 34, name: dec_null, type: decimal
Col: 35, name: decimal_null, type: decimal
Col: 36, name: double_null, type: float
Col: 37, name: float_null, type: float
Col: 38, name: int_null, type: integer
Col: 39, name: int8_null, type: int8
Col: 40, name: integer_null, type: integer
Col: 41, name: interval_ds_null, type: interval
Col: 42, name: interval_ym_null, type: interval
Col: 43, name: lvarchar_null, type: lvarchar
Col: 44, name: numeric_null, type: decimal
Col: 45, name: money_null, type: money
Col: 46, name: real_null, type: smallfloat
Col: 47, name: smallfloat_null, type: smallfloat
Col: 48, name: smallint_null, type: smallint
Col: 49, name: text_null, type: text
Col: 50, name: varchar_null, type: varchar
*/

/*
 * \n column name
 * \ti ITTypeInfo of the column
 */
nodejs_db_informix::Result::Column::Column(
        const std::string n,
        const ITTypeInfo *ti) throw (nodejs_db::Exception&)
{
    if (ti == NULL) {
        throw nodejs_db::Exception("Null column type");
    }

    this->name = n;
    // assume its not binary for now
    this->binary = 0;
    this->typeName = std::string(ti->Name().Data());

    if (this->typeName == "blob") {
        this->binary = 0;
        this->type   = BLOB;
    }
    else
    if (this->typeName == "boolean") {
        this->binary = 0;
        this->type   = BOOL;
    }
    else
    if (this->typeName == "byte") {
        this->binary = 0;
        this->type   = INT;
    }
    else
    if (this->typeName == "char") {
        this->binary = 0;
        this->type   = STRING;
    }
    else
    if (this->typeName == "clob") {
        this->binary = 0;
        this->type   = TEXT;
    }
    else
    if (this->typeName == "date") {
        this->binary = 0;
        this->type   = DATE;
    }
    else
    if (this->typeName == "datetime") {
        this->binary = 0;
        this->type   = DATETIME;
    }
    else
    if (this->typeName == "decimal") {
        this->binary = 0;
        this->type   = NUMBER;
    }
    else
    if (this->typeName == "float") {
        this->binary = 0;
        this->type   = NUMBER;
    }
    else
    if (this->typeName == "int8") {
        this->binary = 0;
        this->type   = INT;
    }
    else
    if (this->typeName == "integer") {
        this->binary = 0;
        this->type   = INT;
    }
    else
    if (this->typeName == "interval") {
        this->binary = 0;
        this->type   = INTERVAL;
    }
    else
    if (this->typeName == "lvarchar") {
        this->binary = 0;
        this->type   = STRING;
    }
    else
    if (this->typeName == "money") {
        this->binary = 0;
        this->type   = MONEY;
    }
    else
    if (this->typeName == "serial") {
        this->binary = 0;
        this->type   = INT;
    }
    else
    if (this->typeName == "smallfloat") {
        this->binary = 0;
        this->type   = NUMBER;
    }
    else
    if (this->typeName == "smallint") {
        this->binary = 0;
        this->type   = NUMBER;
    }
    else
    if (this->typeName == "text") {
        this->binary = 0;
        this->type   = TEXT;
    }
    else
    if (this->typeName == "varchar") {
        this->binary = 0;
        this->type   = STRING;
    }
    else {
        // sub-columns
        if (ti->IsRow()) {
            this->typeName = "row";
            this->type = ROW;
            this->binary = 0;
        }
        else
        if (ti->IsCollection()) {
            this->typeName = "collection";
            this->type = COLLECTION;
            this->binary = 0;
        }
        else
        if (ti->IsConstructed()) {
            this->typeName = "constructed";
            this->type = CONSTRUCTED;
            this->binary = 0;
        }
    }
}

nodejs_db_informix::Result::Column::~Column() {
}

bool nodejs_db_informix::Result::Column::isBinary() const {
    return this->binary;
}

std::string nodejs_db_informix::Result::Column::getName() const {
    return this->name;
}

nodejs_db::Result::Column::type_t
nodejs_db_informix::Result::Column::getType() const {
    return this->type;
}

std::string
nodejs_db_informix::Result::Column::getTypeName() const {
    return this->typeName;
}


nodejs_db_informix::Result::Result(ITBool b, long re) throw (nodejs_db::Exception&) :
    columns(),
    columnNames(),
    totalColumns(0),
    rowNumber(0),
    rowsAffected(re),
    empty(true),
    previousRow(NULL),
    nextRow(NULL)
{
    empty = bool(b);
}

/**
 *
 * \rs Record set of type ITSet*
 * \cti Column Type Information of type ITTypeInfo
 */
nodejs_db_informix::Result::Result(ITSet* rs, const ITTypeInfo *cti, long re) throw(nodejs_db::Exception&) :
    columns(),
    columnNames(),
    totalColumns(0),
    rowNumber(0),
    rowsAffected(re),
    empty(true),
    previousRow(NULL),
    nextRow(NULL)
{
    // check the column info and populate column data-structure
    if (rs == NULL || cti == NULL) {
        throw nodejs_db::Exception("Could not retreive column information");
    }

    columns.clear();
    columnNames.clear();

    this->resultSet = rs;
    this->totalColumns = static_cast<uint16_t>(cti->ColumnCount());

    if (this->totalColumns > 0) {
        // populate the Columns
        for (uint16_t c = 0; c < this->totalColumns; ++c) {
            std::string n = cti->ColumnName(c).Data();

            Column *col = new Column(n, cti->ColumnType(c));

            this->columns.push_back(col);
            this->columnNames.push_back(n);
        }

        this->empty = false;
    }

    this->nextRow = this->row();
}

/**
 *
 *
 */
nodejs_db_informix::Result::Result(ITSet* rs, long re) throw(nodejs_db::Exception&) :
    columns(),
    columnNames(),
    totalColumns(0),
    rowNumber(0),
    rowsAffected(re),
    empty(true),
    previousRow(NULL),
    nextRow(NULL)
{
    if (rs == NULL) {
        throw nodejs_db::Exception("Null ResultSet");
    }

    columns.clear();
    columnNames.clear();

    // construct the column name, values from first row

    this->empty = false;
    this->resultSet = rs;
    this->nextRow = this->row();
}

nodejs_db_informix::Result::~Result() {
    this->free();
}

void nodejs_db_informix::Result::free() throw() {
    this->release();
    this->columns.clear();
    this->columnNames.clear();
}

void nodejs_db_informix::Result::release() throw() {
}

bool nodejs_db_informix::Result::hasNext() const throw() {
    return (this->nextRow != NULL);
}

std::vector<std::string>*
nodejs_db_informix::Result::next() throw(nodejs_db::Exception&) {
    if (this->nextRow == NULL) {
        return NULL;
    }

    this->rowNumber++;
    this->previousRow = this->nextRow;
    this->nextRow = this->row();

    return this->previousRow;
}

unsigned long* nodejs_db_informix::Result::columnLengths() throw(nodejs_db::Exception&) {
    return this->colLengths;
}

std::vector<std::string>*
nodejs_db_informix::Result::row() throw(nodejs_db::Exception&) {
    std::vector<std::string> *row = new std::vector<std::string>();

    ITValue *v = this->resultSet->Fetch();
    if (v == NULL) {
        // throw nodejs_db::Exception("Cannot fetch ITValue for next row");
        return NULL;
    }

    ITRow *r; //ITRow is an abstract class
    if (v->QueryInterface(ITRowIID, (void**) &r) == IT_QUERYINTERFACE_FAILED) {
        throw nodejs_db::Exception("Couldn't fetch ITRow for next row");
    } else {
        long nc = r->NumColumns(); // number of columns
        this->colLengths = new unsigned long[nc];
        for (long i = 0; i < nc; ++i) {
            ITValue *cv = r->Column(i); // column value
            if (cv->IsNull()) {
                // append null
                row->push_back(std::string("null"));
                this->colLengths[i] = strlen("null");
            } else {
                row->push_back(std::string(cv->Printable().Data()));
                this->colLengths[i] = cv->Printable().Length();
            }
        }
    }

    return row;
}

uint64_t nodejs_db_informix::Result::index() const throw(std::out_of_range&) {
    if (this->rowNumber == 0) {
        throw std::out_of_range("Not standing on a row");
    }
    return (this->rowNumber - 1);
}

nodejs_db_informix::Result::Column*
nodejs_db_informix::Result::column(uint16_t i) const throw(std::out_of_range&) {
    if (i >= this->totalColumns) {
        throw std::out_of_range("Wrong column index");
    }

#ifdef DEV
    std::cout << *(this->columns[i]) << std::endl;
#endif

    return this->columns[i];
}

uint64_t nodejs_db_informix::Result::insertId() const throw() {
    return 0;
}

uint64_t nodejs_db_informix::Result::affectedCount() const throw() {
    return rowsAffected;
}

uint16_t nodejs_db_informix::Result::warningCount() const throw() {
    return 0;
}

uint16_t nodejs_db_informix::Result::columnCount() const throw() {
    return this->totalColumns;
}

uint64_t nodejs_db_informix::Result::count() const throw(nodejs_db::Exception&) {
    if (!this->isBuffered()) {
        throw nodejs_db::Exception("Result is not buffered");
    }
    return 0;
}

bool nodejs_db_informix::Result::isBuffered() const throw() {
    return false;
}

bool nodejs_db_informix::Result::isEmpty() const throw() {
    return this->empty;
}
