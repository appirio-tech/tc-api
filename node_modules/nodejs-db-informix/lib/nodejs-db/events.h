#ifndef __EVENTS_H_INCLUDED__
#define __EVENTS_H_INCLUDED__

#include <v8.h>
#include <node_object_wrap.h>
#include <node_version.h>
#include "node_defs.h"

namespace nodejs_db {
class EventEmitter : public node::ObjectWrap {
    public:
        static void Init();

    protected:
#if !NODE_VERSION_AT_LEAST(0, 5, 0)
        static v8::Persistent<v8::String> syEmit;
#endif

        EventEmitter();
        bool Emit(const char* event, int argc,  v8::Handle<v8::Value> argv[]);
};
}

#endif  // __EVENTS_H_INCLUDED__
