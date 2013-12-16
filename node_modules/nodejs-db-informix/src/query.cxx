#include "query.h"

v8::Persistent<v8::FunctionTemplate> nodejs_db_informix::Query::constructorTemplate;

void nodejs_db_informix::Query::Init(v8::Handle<v8::Object> target) {
    v8::HandleScope scope;

    v8::Local<v8::FunctionTemplate> t = v8::FunctionTemplate::New(New);

    constructorTemplate = v8::Persistent<v8::FunctionTemplate>::New(t);
    constructorTemplate->InstanceTemplate()->SetInternalFieldCount(1);

    nodejs_db::Query::Init(target, constructorTemplate);

    target->Set(v8::String::NewSymbol("Query"), constructorTemplate->GetFunction());
}

/**
 * Constructor Template
 */
v8::Handle<v8::Value> nodejs_db_informix::Query::New(const v8::Arguments& args) {
    v8::HandleScope scope;

    nodejs_db_informix::Query* query = new nodejs_db_informix::Query();
    if (query == NULL) {
        THROW_EXCEPTION("Can't create query object")
    }

    if (args.Length() > 0) {
        v8::Handle<v8::Value> set = query->set(args);
        if (!set.IsEmpty()) {
            return scope.Close(set);
        }
    }

    query->Wrap(args.This());

    return scope.Close(args.This());
}
