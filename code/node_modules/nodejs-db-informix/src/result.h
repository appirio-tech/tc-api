#ifndef __INF_RESULT_H_INCLUDED__
#define __INF_RESULT_H_INCLUDED__

#include <it.h>
#include <string>
#include <vector>
#include <stdexcept>
#include "nodejs-db/exception.h"
#include "nodejs-db/result.h"

#include <ostream>

namespace nodejs_db_informix {
class Result : public nodejs_db::Result {
    public:
        class Column : public nodejs_db::Result::Column {
            public:
                explicit Column(const std::string n, const ITTypeInfo *column) throw(nodejs_db::Exception&);
                ~Column();
                bool isBinary() const;
                std::string getName() const;
                std::string getTypeName() const;
                nodejs_db::Result::Column::type_t getType() const;

                friend std::ostream& operator<< (std::ostream &o, const Column &c) {
                    o   << "Column { name: " << c.name
                        << ", typeName: " << c.typeName
                        << ", type: " << c.type
                        << ", binary: " << c.binary
                        << " }"
                        ;

                    return o;
                }

            protected:
                std::string name;
                std::string typeName;
                type_t type;
                bool binary;
        };

        explicit Result(ITBool b, long re = 0)  throw(nodejs_db::Exception&);
        explicit Result(ITSet* rs, long re = 0) throw(nodejs_db::Exception&);
        explicit Result(ITSet* rs, const ITTypeInfo *cti, long re = 0) throw(nodejs_db::Exception&);
        ~Result();
        void release() throw();
        bool hasNext() const throw();
        std::vector<std::string>* next() throw(nodejs_db::Exception&);
        unsigned long* columnLengths() throw(nodejs_db::Exception&);
        uint64_t index() const throw(std::out_of_range&);
        Column* column(uint16_t i) const throw(std::out_of_range&);
        uint64_t insertId() const throw();
        uint16_t columnCount() const throw();
        uint64_t affectedCount() const throw();
        uint16_t warningCount() const throw();
        uint64_t count() const throw(nodejs_db::Exception&);
        bool isBuffered() const throw();
        bool isEmpty() const throw();

    protected:
        std::vector<Column*> columns;
        std::vector<std::string> columnNames;
        unsigned long *colLengths;
        uint16_t totalColumns;
        uint64_t rowNumber;
        long rowsAffected;
        bool empty;

        std::vector<std::string>* row() throw(nodejs_db::Exception&);
        void free() throw();

    private:
        ITSet* resultSet;
        std::vector<std::string>* previousRow;
        std::vector<std::string>* nextRow;
};
}

#endif  // __INF_RESULT_H_INCLUDED__
