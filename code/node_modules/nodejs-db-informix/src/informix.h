#ifndef __INFORMIX_H_INCLUDED__
#define __INFORMIX_H_INCLUDED__

#include "nodejs-db/node_defs.h"
#include "nodejs-db/binding.h"
#include "connection.h"
#include "query.h"

namespace nodejs_db_informix {
class Informix : public nodejs_db::Binding {
    public:
        static void Init(v8::Handle<v8::Object> target);

    protected:
        static v8::Persistent<v8::FunctionTemplate> constructorTemplate;

        Informix();
        ~Informix();
        static v8::Handle<v8::Value> New(const v8::Arguments& args);
        v8::Handle<v8::Value> set(const v8::Local<v8::Object> options);
        v8::Persistent<v8::Object> createQuery() const;
};
}

#endif  // __INFORMIX_H_INCLUDED__
