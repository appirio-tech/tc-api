#ifndef __BINDING_H_INCLUDED__
#define __BINDING_H_INCLUDED__

#include <node.h>
#include <node_version.h>
#include <string>
#include "node_defs.h"
#include "connection.h"
#include "events.h"
#include "exception.h"
#include "query.h"

namespace nodejs_db {
class Binding : public EventEmitter {
    public:
        Connection* connection;

    protected:
        struct connect_request_t {
            v8::Persistent<v8::Object> context;
            Binding* binding;
            const char* error;
        };
        v8::Persistent<v8::Function>* cbConnect;

        Binding();
        ~Binding();
        static void Init(v8::Handle<v8::Object> target, v8::Persistent<v8::FunctionTemplate> constructorTemplate);
        static v8::Handle<v8::Value> Connect(const v8::Arguments& args);
        static v8::Handle<v8::Value> Disconnect(const v8::Arguments& args);
        static v8::Handle<v8::Value> IsConnected(const v8::Arguments& args);
        static v8::Handle<v8::Value> Escape(const v8::Arguments& args);
        static v8::Handle<v8::Value> Name(const v8::Arguments& args);
        static v8::Handle<v8::Value> Query(const v8::Arguments& args);
#if NODE_VERSION_AT_LEAST(0, 7, 8)
        static uv_async_t g_async;
        static void uvConnect(uv_work_t* uvRequest);
        static void uvConnectFinished(uv_work_t* uvRequest, int status);
#else
        static
#if NODE_VERSION_AT_LEAST(0, 5, 0)
        void
#else
        int
#endif // NODE_VERSION_AT_LEAST(0, 5, 0)
        eioConnect(eio_req* req);
        static int eioConnectFinished(eio_req* eioRequest);
#endif // NODE_VERSION_AT_LEAST(0, 7, 8)
        static void connect(connect_request_t* request);
        static void connectFinished(connect_request_t* request);
        virtual v8::Handle<v8::Value> set(const v8::Local<v8::Object> options) = 0;
        virtual v8::Persistent<v8::Object> createQuery() const = 0;
};
}

#endif  // __BINDING_H_INCLUDED__
