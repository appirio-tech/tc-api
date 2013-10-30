#include "exception.h"

nodejs_db::Exception::Exception(const char* message) throw() : exception() {
    this->setMessage(message);
}

nodejs_db::Exception::Exception(const std::string& message) throw() : exception() {
    this->setMessage(message.c_str());
}

nodejs_db::Exception::~Exception() throw() {
}

void nodejs_db::Exception::setMessage(const char* message) throw() {
    this->message = message;
}

const char* nodejs_db::Exception::what() const throw() {
    return (!this->message.empty() ? this->message.c_str() : NULL);
}

std::string::size_type nodejs_db::Exception::size() throw() {
    return (!this->message.empty() ? this->message.size() : 0);
}
