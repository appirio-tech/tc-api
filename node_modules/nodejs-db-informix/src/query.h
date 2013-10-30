#ifndef __SRC_QUERY_H_INCLUDED__
#define __SRC_QUERY_H_INCLUDED__

#include "nodejs-db/node_defs.h"
#include "nodejs-db/query.h"

namespace nodejs_db_informix {
class Query : public nodejs_db::Query {
    public:
        static v8::Persistent<v8::FunctionTemplate> constructorTemplate;
        static void Init(v8::Handle<v8::Object> target);

    protected:
        static v8::Handle<v8::Value> New(const v8::Arguments& args);
};
}

#endif  // __SRC_QUERY_H_INCLUDED__
