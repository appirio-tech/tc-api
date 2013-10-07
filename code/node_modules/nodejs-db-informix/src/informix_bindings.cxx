#include "nodejs-db/binding.h"
#include "informix.h"
#include "query.h"

extern "C" {
    void init(v8::Handle<v8::Object> target) {
        nodejs_db::EventEmitter::Init();
        nodejs_db_informix::Informix::Init(target);
        nodejs_db_informix::Query::Init(target);
    }

    NODE_MODULE(informix_bindings, init);
}
