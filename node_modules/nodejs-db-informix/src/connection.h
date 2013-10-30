#ifndef __INF_CONNECTION_H_INCLUDED__
#define __INF_CONNECTION_H_INCLUDED__

#include <it.h>
#include <string>
#include <ostream>
#include "nodejs-db/connection.h"
#include "result.h"

namespace nodejs_db_informix {
class Connection : public nodejs_db::Connection {
    public:
        Connection();
        Connection(std::string, std::string, std::string, std::string, uint32_t = 0);
        ~Connection();
        void setCharset(const std::string& charset) throw();
        void setCompress(const bool compress) throw();
        void setInitCommand(const std::string& initCommand) throw();
        void setReadTimeout(const uint32_t readTimeout) throw();
        void setReconnect(const bool reconnect) throw();
        void setSocket(const std::string& socket) throw();
        void setSslVerifyServer(const bool sslVerifyServer) throw();
        void setTimeout(const uint32_t timeout) throw();
        void setWriteTimeout(const uint32_t writeTimeout) throw();
        bool isAlive(bool = false) throw();
        void open() throw(nodejs_db::Exception&);
        void close();
        std::string escape(const std::string& string) const throw(nodejs_db::Exception&);
        std::string version() const;
        nodejs_db::Result* query(const std::string& query) const throw(nodejs_db::Exception&);
        nodejs_db::Result* query_x(const std::string& query) const throw(nodejs_db::Exception&);

    protected:
        std::string charset;
        bool compress;
        std::string initCommand;
        uint32_t readTimeout;
        bool reconnect;
        std::string socket;
        bool sslVerifyServer;
        uint32_t timeout;
        uint32_t writeTimeout;

    private:
        ITConnection* connection;

    private:
        bool _prepareITDBInfo(ITDBInfo&);
        // ITCallBackFuncPtr _QueryErrorHandler;
        /*
        ITCallbackResult _QueryErrorHandler(
                const ITErrorManager&
                , void*
                , long
        );
        */

#ifdef DEV
        void _testExecForIteration() const;
#endif
};
}

#endif  // __INF_CONNECTION_H_INCLUDED__
