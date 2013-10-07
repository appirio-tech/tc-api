#include "binding.h"

nodejs_db::Binding::Binding(): nodejs_db::EventEmitter(), connection(NULL), cbConnect(NULL) {
}

nodejs_db::Binding::~Binding() {
    if (this->cbConnect != NULL) {
        node::cb_destroy(this->cbConnect);
    }
}

void nodejs_db::Binding::Init(v8::Handle<v8::Object> target,
        v8::Persistent<v8::FunctionTemplate> constructorTemplate)
{
    NODE_ADD_CONSTANT(constructorTemplate, COLUMN_TYPE_STRING,
            nodejs_db::Result::Column::STRING);
    NODE_ADD_CONSTANT(constructorTemplate, COLUMN_TYPE_BOOL,
            nodejs_db::Result::Column::BOOL);
    NODE_ADD_CONSTANT(constructorTemplate, COLUMN_TYPE_INT,
            nodejs_db::Result::Column::INT);
    NODE_ADD_CONSTANT(constructorTemplate, COLUMN_TYPE_NUMBER,
            nodejs_db::Result::Column::NUMBER);
    NODE_ADD_CONSTANT(constructorTemplate, COLUMN_TYPE_DATE,
            nodejs_db::Result::Column::DATE);
    NODE_ADD_CONSTANT(constructorTemplate, COLUMN_TYPE_TIME,
            nodejs_db::Result::Column::TIME);
    NODE_ADD_CONSTANT(constructorTemplate, COLUMN_TYPE_DATETIME,
            nodejs_db::Result::Column::DATETIME);
    NODE_ADD_CONSTANT(constructorTemplate, COLUMN_TYPE_TEXT,
            nodejs_db::Result::Column::TEXT);
    NODE_ADD_CONSTANT(constructorTemplate, COLUMN_TYPE_SET,
            nodejs_db::Result::Column::SET);

    NODE_ADD_PROTOTYPE_METHOD(constructorTemplate, "connect", Connect);
    NODE_ADD_PROTOTYPE_METHOD(constructorTemplate, "disconnect", Disconnect);
    NODE_ADD_PROTOTYPE_METHOD(constructorTemplate, "isConnected", IsConnected);
    NODE_ADD_PROTOTYPE_METHOD(constructorTemplate, "escape", Escape);
    NODE_ADD_PROTOTYPE_METHOD(constructorTemplate, "name", Name);
    NODE_ADD_PROTOTYPE_METHOD(constructorTemplate, "query", Query);
}

v8::Handle<v8::Value> nodejs_db::Binding::Connect(const v8::Arguments& args) {
    v8::HandleScope scope;

    nodejs_db::Binding* binding =
        node::ObjectWrap::Unwrap<nodejs_db::Binding>(args.This());
    assert(binding);

    bool async = true;
    int optionsIndex = -1,
        callbackIndex = -1;

    if (args.Length() > 0) {
        if (args.Length() > 1) {
            ARG_CHECK_OBJECT(0, options);
            ARG_CHECK_FUNCTION(1, callback);
            optionsIndex = 0;
            callbackIndex = 1;
        } else if (args[0]->IsFunction()) {
            ARG_CHECK_FUNCTION(0, callback);
            callbackIndex = 0;
        } else {
            ARG_CHECK_OBJECT(0, options);
            optionsIndex = 0;
        }

        if (optionsIndex >= 0) {
            v8::Local<v8::Object> options = args[optionsIndex]->ToObject();

            v8::Handle<v8::Value> set = binding->set(options);
            if (!set.IsEmpty()) {
                return scope.Close(set);
            }

            ARG_CHECK_OBJECT_ATTR_OPTIONAL_BOOL(options, async);

            if (options->Has(async_key) && options->Get(async_key)->IsFalse()) {
                async = false;
            }
        }

        if (callbackIndex >= 0) {
            binding->cbConnect = node::cb_persist(args[callbackIndex]);
        }
    }

    connect_request_t* request = new connect_request_t();
    if (request == NULL) {
        THROW_EXCEPTION("Could not create EIO request")
    }

    request->context = v8::Persistent<v8::Object>::New(args.This());
    request->binding = binding;
    request->error = NULL;

    if (async) {
        request->binding->Ref();
        eio_custom(eioConnect, EIO_PRI_DEFAULT, eioConnectFinished, request);
        ev_ref(EV_DEFAULT_UC);
    } else {
        connect(request);
        connectFinished(request);
    }

    return scope.Close(v8::Undefined());
}

void nodejs_db::Binding::connect(connect_request_t* request) {
    try {
        request->binding->connection->open();
    } catch(const nodejs_db::Exception& exception) {
        request->error = exception.what();
    }
}

void nodejs_db::Binding::connectFinished(connect_request_t* request) {
    bool connected = request->binding->connection->isAlive();
    v8::Local<v8::Value> argv[2];

    if (connected) {
        v8::Local<v8::Object> server = v8::Object::New();
        server->Set(v8::String::New("version"), v8::String::New(request->binding->connection->version().c_str()));
        server->Set(v8::String::New("hostname"), v8::String::New(request->binding->connection->getHostname().c_str()));
        server->Set(v8::String::New("user"), v8::String::New(request->binding->connection->getUser().c_str()));
        server->Set(v8::String::New("database"), v8::String::New(request->binding->connection->getDatabase().c_str()));

        argv[0] = v8::Local<v8::Value>::New(v8::Null());
        argv[1] = server;

        request->binding->Emit("ready", 1, &argv[1]);
    } else {
        argv[0] = v8::String::New(request->error != NULL ? request->error : "(unknown error)");

        request->binding->Emit("error", 1, argv);
    }

    if (request->binding->cbConnect != NULL && !request->binding->cbConnect->IsEmpty()) {
        v8::TryCatch tryCatch;
        (*(request->binding->cbConnect))->Call(request->context, connected ? 2 : 1, argv);
        if (tryCatch.HasCaught()) {
            node::FatalException(tryCatch);
        }
    }

    request->context.Dispose();

    delete request;
}

#if NODE_VERSION_AT_LEAST(0, 5, 0)
void
#else
int
#endif
nodejs_db::Binding::eioConnect(eio_req* eioRequest) {
    connect_request_t* request = static_cast<connect_request_t*>(eioRequest->data);
    assert(request);

    connect(request);
#if !NODE_VERSION_AT_LEAST(0, 5, 0)
    return 0;
#endif
}

int nodejs_db::Binding::eioConnectFinished(eio_req* eioRequest) {
    v8::HandleScope scope;

    connect_request_t* request = static_cast<connect_request_t*>(eioRequest->data);
    assert(request);

    ev_unref(EV_DEFAULT_UC);
    request->binding->Unref();

    connectFinished(request);

    return 0;
}

v8::Handle<v8::Value> nodejs_db::Binding::Disconnect(const v8::Arguments& args) {
    v8::HandleScope scope;

    nodejs_db::Binding* binding = node::ObjectWrap::Unwrap<nodejs_db::Binding>(args.This());
    assert(binding);

    binding->connection->close();

    return scope.Close(v8::Undefined());
}

v8::Handle<v8::Value> nodejs_db::Binding::IsConnected(const v8::Arguments& args) {
    v8::HandleScope scope;

    nodejs_db::Binding* binding = node::ObjectWrap::Unwrap<nodejs_db::Binding>(args.This());
    assert(binding);

    return scope.Close(binding->connection->isAlive() ? v8::True() : v8::False());
}

v8::Handle<v8::Value> nodejs_db::Binding::Escape(const v8::Arguments& args) {
    v8::HandleScope scope;

    ARG_CHECK_STRING(0, string);

    nodejs_db::Binding* binding = node::ObjectWrap::Unwrap<nodejs_db::Binding>(args.This());
    assert(binding);

    std::string escaped;

    try {
        v8::String::Utf8Value string(args[0]->ToString());
        std::string unescaped(*string);
        escaped = binding->connection->escape(unescaped);
    } catch(const nodejs_db::Exception& exception) {
        THROW_EXCEPTION(exception.what())
    }

    return scope.Close(v8::String::New(escaped.c_str()));
}

v8::Handle<v8::Value> nodejs_db::Binding::Name(const v8::Arguments& args) {
    v8::HandleScope scope;

    ARG_CHECK_STRING(0, table);

    nodejs_db::Binding* binding = node::ObjectWrap::Unwrap<nodejs_db::Binding>(args.This());
    assert(binding);

    std::ostringstream escaped;

    try {
        v8::String::Utf8Value string(args[0]->ToString());
        std::string unescaped(*string);
        escaped << binding->connection->escapeName(unescaped);
    } catch(const nodejs_db::Exception& exception) {
        THROW_EXCEPTION(exception.what())
    }

    return scope.Close(v8::String::New(escaped.str().c_str()));
}

/**
 * Bind the query object
 */
v8::Handle<v8::Value> nodejs_db::Binding::Query(const v8::Arguments& args) {
    v8::HandleScope scope;

    nodejs_db::Binding* binding = node::ObjectWrap::Unwrap<nodejs_db::Binding>(args.This());
    assert(binding);

    v8::Persistent<v8::Object> query = binding->createQuery();
    if (query.IsEmpty()) {
        THROW_EXCEPTION("Could not create query");
    }

    nodejs_db::Query* queryInstance = node::ObjectWrap::Unwrap<nodejs_db::Query>(query);
    queryInstance->setConnection(binding->connection);

    v8::Handle<v8::Value> set = queryInstance->set(args);
    if (!set.IsEmpty()) {
        return scope.Close(set);
    }

    return scope.Close(query);
}
