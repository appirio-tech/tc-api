#include "connection.h"

nodejs_db::Connection::Connection()
    :quoteString('\''),
    alive(false),
    quoteName('\'') {
    pthread_mutex_init(&(this->connectionLock), NULL);
}

nodejs_db::Connection::~Connection() {
    pthread_mutex_destroy(&(this->connectionLock));
}

std::string nodejs_db::Connection::getHostname() const {
    return this->hostname;
}

void nodejs_db::Connection::setHostname(const std::string& h) {
    this->hostname = h;
}

std::string nodejs_db::Connection::getUser() const {
    return this->user;
}

void nodejs_db::Connection::setUser(const std::string& u) {
    this->user = u;
}

std::string nodejs_db::Connection::getPassword() const {
    return this->password;
}

void nodejs_db::Connection::setPassword(const std::string& pw) {
    this->password = pw;
}

std::string nodejs_db::Connection::getDatabase() const {
    return this->database;
}

void nodejs_db::Connection::setDatabase(const std::string& db) {
    this->database = db;
}

uint32_t nodejs_db::Connection::getPort() const {
    return this->port;
}

void nodejs_db::Connection::setPort(uint32_t p) {
    this->port = p;
}

bool nodejs_db::Connection::isAlive(bool ping) {
    return this->alive;
}

/**
 * \fn std::string nodejs_db::Connection::escapeName
 * escape the given string.
 * e.g. first.second is escaped as 'first'.'second' is escapeChar is "'"
 *
 * \param[in] string String to be escaped
 * \exception Exception&
 */
std::string nodejs_db::Connection::escapeName(const std::string& string) const throw(Exception&) {
    std::string escaped;
    if (string.find_first_of('.') != string.npos) {
        char* original = reinterpret_cast<char*>(const_cast<char*>(string.c_str()));
        char* token;
        char* rest;
        bool first = true;

        while ((token = strtok_r(original, ".", &rest))) {
            if (!first) {
                escaped += '.';
            } else {
                first = false;
            }
            if (token[0] != '*') {
                escaped += this->quoteName;
                escaped += token;
                escaped += this->quoteName;
            } else {
                escaped += token;
            }
            original = rest;
        }
    } else {
        escaped = this->quoteName + string + this->quoteName;
    }
    return escaped;
}

void nodejs_db::Connection::lock() {
    pthread_mutex_lock(&(this->connectionLock));
}

void nodejs_db::Connection::unlock() {
    pthread_mutex_unlock(&(this->connectionLock));
}
