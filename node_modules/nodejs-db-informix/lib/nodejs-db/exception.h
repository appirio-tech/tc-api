#ifndef __EXCEPTION_H_INCLUDED__
#define __EXCEPTION_H_INCLUDED__

#include <exception>
#include <string>

namespace nodejs_db {
class Exception : public std::exception {
    public:
        explicit Exception(const char* message) throw();
        explicit Exception(const std::string& message) throw();
        ~Exception() throw();
        const char* what() const throw();
        std::string::size_type size() throw();
        void setMessage(const char* message) throw();
    protected:
        std::string message;
};
}

#endif  // __EXCEPTION_H_INCLUDED__
