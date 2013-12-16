#include "result.h"

nodejs_db::Result::Column::~Column() {
}

bool nodejs_db::Result::Column::isBinary() const {
    return false;
}

uint64_t nodejs_db::Result::count() const throw(Exception&) {
    throw nodejs_db::Exception("Not implemented");
}

uint64_t nodejs_db::Result::insertId() const throw(nodejs_db::Exception&) {
    throw nodejs_db::Exception("Not implemented");
}

uint16_t nodejs_db::Result::warningCount() const throw(nodejs_db::Exception&){
    throw nodejs_db::Exception("Not implemented");
}

nodejs_db::Result::~Result() {
}

void nodejs_db::Result::release() throw() {
}
