#include "informix.h"

v8::Persistent<v8::FunctionTemplate> nodejs_db_informix::Informix::constructorTemplate;

nodejs_db_informix::Informix::Informix(): nodejs_db::Binding() {
    this->connection = new nodejs_db_informix::Connection();
    assert(this->connection);
}

nodejs_db_informix::Informix::~Informix() {
    if (this->connection != NULL) {
        delete this->connection;
    }
}

void nodejs_db_informix::Informix::Init(v8::Handle<v8::Object> target) {
    v8::HandleScope scope;

    v8::Local<v8::FunctionTemplate> t = v8::FunctionTemplate::New(New);

    constructorTemplate = v8::Persistent<v8::FunctionTemplate>::New(t);
    constructorTemplate->InstanceTemplate()->SetInternalFieldCount(1);

    nodejs_db::Binding::Init(target, constructorTemplate);

    target->Set(v8::String::NewSymbol("Informix"), constructorTemplate->GetFunction());
}

v8::Handle<v8::Value> nodejs_db_informix::Informix::New(const v8::Arguments& args) {
    v8::HandleScope scope;

    nodejs_db_informix::Informix* binding = new nodejs_db_informix::Informix();
    if (binding == NULL) {
        THROW_EXCEPTION("Can't create client object")
    }

    if (args.Length() > 0) {
        ARG_CHECK_OBJECT(0, options);

        v8::Handle<v8::Value> set = binding->set(args[0]->ToObject());
        if (!set.IsEmpty()) {
            return scope.Close(set);
        }
    }

    binding->Wrap(args.This());

    return scope.Close(args.This());
}

v8::Handle<v8::Value> nodejs_db_informix::Informix::set(const
        v8::Local<v8::Object> options)
{
    ARG_CHECK_OBJECT_ATTR_OPTIONAL_STRING(options, hostname);
    ARG_CHECK_OBJECT_ATTR_OPTIONAL_STRING(options, user);
    ARG_CHECK_OBJECT_ATTR_OPTIONAL_STRING(options, password);
    ARG_CHECK_OBJECT_ATTR_OPTIONAL_STRING(options, database);
    ARG_CHECK_OBJECT_ATTR_OPTIONAL_UINT32(options, port);
    ARG_CHECK_OBJECT_ATTR_OPTIONAL_STRING(options, charset);
    ARG_CHECK_OBJECT_ATTR_OPTIONAL_BOOL(options, compress);
    ARG_CHECK_OBJECT_ATTR_OPTIONAL_STRING(options, initCommand);
    ARG_CHECK_OBJECT_ATTR_OPTIONAL_UINT32(options, readTimeout);
    ARG_CHECK_OBJECT_ATTR_OPTIONAL_BOOL(options, reconnect);
    ARG_CHECK_OBJECT_ATTR_OPTIONAL_STRING(options, socket);
    ARG_CHECK_OBJECT_ATTR_OPTIONAL_BOOL(options, sslVerifyServer);
    ARG_CHECK_OBJECT_ATTR_OPTIONAL_UINT32(options, timeout);
    ARG_CHECK_OBJECT_ATTR_OPTIONAL_UINT32(options, writeTimeout);

    // c is connection
    nodejs_db_informix::Connection* c =
        static_cast<nodejs_db_informix::Connection*>(this->connection);

    v8::String::Utf8Value hostname(options->Get(hostname_key)->ToString());
    v8::String::Utf8Value user(options->Get(user_key)->ToString());
    v8::String::Utf8Value password(options->Get(password_key)->ToString());
    v8::String::Utf8Value database(options->Get(database_key)->ToString());

    if (options->Has(hostname_key)) {
        c->setHostname(*hostname);
    }

    if (options->Has(user_key)) {
        c->setUser(*user);
    }

    if (options->Has(password_key)) {
        c->setPassword(*password);
    }

    if (options->Has(database_key)) {
        c->setDatabase(*database);
    }

    if (options->Has(port_key)) {
        c->setPort(options->Get(port_key)->ToUint32()->Value());
    }

    if (options->Has(charset_key)) {
        v8::String::Utf8Value charset(options->Get(charset_key)->ToString());
        c->setCharset(*charset);
    }

    if (options->Has(compress_key)) {
        c->setCompress(options->Get(compress_key)->IsTrue());
    }

    if (options->Has(initCommand_key)) {
        v8::String::Utf8Value initCommand(options->Get(initCommand_key)->ToString());
        c->setInitCommand(*initCommand);
    }

    if (options->Has(readTimeout_key)) {
        c->setReadTimeout(options->Get(readTimeout_key)->ToUint32()->Value());
    }

    if (options->Has(reconnect_key)) {
        c->setReconnect(options->Get(reconnect_key)->IsTrue());
    }

    if (options->Has(socket_key)) {
        v8::String::Utf8Value socket(options->Get(socket_key)->ToString());
        c->setSocket(*socket);
    }

    if (options->Has(sslVerifyServer_key)) {
        c->setSslVerifyServer(options->Get(sslVerifyServer_key)->IsTrue());
    }

    if (options->Has(timeout_key)) {
        c->setTimeout(options->Get(timeout_key)->ToUint32()->Value());
    }

    if (options->Has(writeTimeout_key)) {
        c->setWriteTimeout(options->Get(writeTimeout_key)->ToUint32()->Value());
    }

    return v8::Handle<v8::Value>();
}

v8::Persistent<v8::Object> nodejs_db_informix::Informix::createQuery() const {
    v8::Persistent<v8::Object> query(
        nodejs_db_informix::Query::constructorTemplate->GetFunction()->NewInstance());
    return query;
}
