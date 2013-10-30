#include "connection.h"
#include <sstream>

nodejs_db_informix::Connection::Connection()
    : compress(false),
      readTimeout(0),
      reconnect(true),
      sslVerifyServer(false),
      timeout(0),
      writeTimeout(0)
{
    this->port = 0;

    // construct connection from environment variables
    this->connection = new ITConnection();
}

nodejs_db_informix::Connection::Connection(
        std::string h,
        std::string u,
        std::string pw,
        std::string d,
        uint32_t p
) {
    this->setHostname(h);
    this->setUser(u);
    this->setPassword(pw);
    this->setDatabase(d);
    this->setPort(p);
}

nodejs_db_informix::Connection::~Connection() {
    this->close();
}

void nodejs_db_informix::Connection::setCharset(const std::string& charset) throw() {
    this->charset = charset;
}

void nodejs_db_informix::Connection::setCompress(const bool compress) throw() {
    this->compress = compress;
}

void nodejs_db_informix::Connection::setInitCommand(const std::string& initCommand) throw() {
    this->initCommand = initCommand;
}

void nodejs_db_informix::Connection::setReadTimeout(const uint32_t readTimeout) throw() {
    this->readTimeout = readTimeout;
}

void nodejs_db_informix::Connection::setReconnect(const bool reconnect) throw() {
    this->reconnect = reconnect;
}

void nodejs_db_informix::Connection::setSocket(const std::string& socket) throw() {
    this->socket = socket;
}

void nodejs_db_informix::Connection::setSslVerifyServer(const bool sslVerifyServer) throw() {
    this->sslVerifyServer = sslVerifyServer;
}

void nodejs_db_informix::Connection::setTimeout(const uint32_t timeout) throw() {
    this->timeout = timeout;
}

void nodejs_db_informix::Connection::setWriteTimeout(const uint32_t writeTimeout) throw() {
    this->writeTimeout = writeTimeout;
}

bool nodejs_db_informix::Connection::isAlive(bool ping) throw() {
    if (this->alive) {
        this->alive = this->connection->IsOpen();
    }

#ifdef DEV
    std::cout << "IsAlive() == " << this->alive << std::endl;
#endif

    return this->alive;
}

/**
 * XXX: do we really need to pass dbInfo?
 */
bool
nodejs_db_informix::Connection::_prepareITDBInfo(ITDBInfo& dbInfo) {
    // dbInfo = new ITDBInfo();

    // setup any custom parameters passed
    std::string db = this->getDatabase();
    if (db.c_str()
            && !db.empty()
            && !dbInfo.SetDatabase(ITString(db.c_str()))) {
        std::cerr << "Failed to set database " << db << std::endl;
    }

    std::string u = this->getUser();
    if (u.c_str()
            && !u.empty()
            && !dbInfo.SetUser(ITString(u.c_str()))) {
        std::cerr << "Failed to set username " << u << std::endl;
    }

    std::string h = this->getHostname();
    if (h.c_str()
            && !h.empty()
            && !dbInfo.SetSystem(ITString(h.c_str()))) {
        std::cerr << "Failed to set hostname " << h << std::endl;
    }

    std::string pw = this->getPassword();
    if (pw.c_str()
            && !pw.empty()
            && !dbInfo.SetPassword(ITString(pw.c_str()))) {
        std::cerr << "Failed to set password " << pw << std::endl;
    }

    return true;
}

void
nodejs_db_informix::Connection::open() throw(nodejs_db::Exception&) {
    // close connection if any
    // and don't worry about the return of this close
    this->close();

    if (this->connection->IsOpen()) {
        throw nodejs_db::Exception("Database connection is alreay open");
    }

    ITDBInfo dbInfo = this->connection->GetDBInfo();

    if (dbInfo.Frozen()) {
        throw nodejs_db::Exception("Database connection is alreay open");
    }

    if (dbInfo.GetSystem().IsNull()) {
        throw nodejs_db::Exception("Which system to connect to?");
    }

    if (dbInfo.GetDatabase().IsNull()) {
        throw nodejs_db::Exception("No database name specified");
    }

    if (dbInfo.GetUser().IsNull()) {
        throw nodejs_db::Exception("No database username specified");
    }

    // prepare dbInfo
    if (!this->_prepareITDBInfo(dbInfo)) {
        throw nodejs_db::Exception("Could not prepare ITDBInfo");
    }

#ifdef DEV
    std::cout << "Connecting with " << std::endl
        << "User: " << dbInfo.GetUser().Data() << std::endl
        << "System: " << dbInfo.GetSystem().Data() << std::endl
        << "Database: " << dbInfo.GetDatabase().Data() << std::endl
        ;
#endif

    // setup the dbInfo
    if (!this->connection->SetDBInfo(dbInfo)) {
        throw nodejs_db::Exception("Could not set the ITDBINfo");
    }

    // open connection
    if (!(this->alive = this->connection->Open())) {
        throw nodejs_db::Exception("Connection failed!");
    }

    // check if everything went ok.
    if (!this->connection->IsOpen()) {
        this->alive = false;
        throw nodejs_db::Exception("Cannot create Informix connection");
    }
}

void
nodejs_db_informix::Connection::close() {
    if (this->alive) {
        if(this->connection->Close()) {
            this->alive = false;
        }
    }
    this->alive = false;
}

std::string
nodejs_db_informix::Connection::escape(const std::string& s) const throw(nodejs_db::Exception&) {
    return s;
}

std::string
nodejs_db_informix::Connection::version() const {
    return std::string("0.0.1");
}



#ifdef DEV
void
nodejs_db_informix::Connection::_testExecForIteration() const {
    ITQuery q_tmp(*(this->connection));
    std::string qry("select * from sysmaster:sysdatabases");

    if (!q_tmp.ExecForIteration(qry.c_str())) {
        std::cerr << "Could not execute query: " << qry << std::endl;
        return;
    }

    const ITTypeInfo *ti = q_tmp.RowType();
    for (long cc = 0; cc < ti->ColumnCount(); ++cc) {
        if (!ti->ColumnName(cc).IsNull()) {
            std::cout << "Column " << cc << ": "
                << ti->ColumnName(cc).Data() << std::endl;
        } else {
            std::cerr << "Column " << cc << ": Error!" << std::endl;
        }
    }

    ITRow *row;
    int rc = 0;
    while ((row = q_tmp.NextRow()) != NULL) {
        ++rc;
        std::cout << row->Printable() << std::endl;
        row->Release();
    }
    std::cout << rc << " rows returned" << std::endl
        << "Query: " << qry << std::endl;

    return;
}
#endif



ITCallbackResult
// nodejs_db_informix::Connection::_QueryErrorHandler(
_QueryErrorHandler(
    const ITErrorManager& err
    , void* args
    , long errCode
) {
    std::ostream *s = (std::ostream*) args;
    (*s) << "Query: [" << errCode << "]"
        << err.SqlState().Data() << ' '
        << err.ErrorText().Data()
        << std::endl;

    return IT_NOTHANDLED;
}



/**
 * execute select query
 */
nodejs_db::Result*
nodejs_db_informix::Connection::query(const std::string& query) const throw(nodejs_db::Exception&) {

#ifdef DEV
    this->_testExecForIteration();
#endif

    ITQuery q(*(this->connection));

    q.AddCallback(_QueryErrorHandler, (void*) &std::cerr);

    ITSet *rs = q.ExecToSet(query.c_str());

    if (rs == NULL || q.RowCount() <= 0) {
        std::stringstream err;

        if (q.Warn()) {
            err << "sqlstate: "
                << q.SqlState().Data()
                << ", warn: "
                << q.WarningText().Data()
                << ", "
                ;
        }

        if (q.Error()) {
            err << "sqlstate: "
                << q.SqlState().Data()
                << ", error: "
                << q.ErrorText().Data()
                << ", "
                ;
        }

        err << "msg: Could not execute query.";
        throw nodejs_db::Exception(err.str());
    }

    // let the caller handle problems with q.RowType()
    return new nodejs_db_informix::Result(rs, q.RowType(), q.RowCount());
}



/**
 * For insert, update, delete etc. we need a different ITQuery object
 * Therefore, we need a new function
 */
nodejs_db::Result*
nodejs_db_informix::Connection::query_x(const std::string& query) const throw(nodejs_db::Exception&) {
    ITQuery q(*(this->connection));

    q.AddCallback(_QueryErrorHandler, (void*) &std::cerr);

    ITBool s = q.ExecForStatus(query.c_str());

    if (!s) {
        std::stringstream err;

        if (q.Warn()) {
            err << "sqlstate: "
                << q.SqlState().Data()
                << ", warn: "
                << q.WarningText().Data()
                << ", "
                ;
        }

        if (q.Error()) {
            err << "sqlstate: "
                << q.SqlState().Data()
                << ", error: "
                << q.ErrorText().Data()
                << ", "
                ;
        }

        err << "msg: Could not execute query.";
        throw nodejs_db::Exception(err.str());
    }

#ifdef DEBUG
    // query type
    ITString qt = q.Command();

    std::cout << "Type of query: " << qt.Data() << std::endl;
    std::cout << "Result of DML: " << s << std::endl;
#endif

    return new nodejs_db_informix::Result(s, q.RowCount());
}
