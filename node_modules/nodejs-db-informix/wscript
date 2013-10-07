#! /usr/bin/env python
# encoding: utf-8

#
# Report bugs to Amit Kumar (amitkr [at] rocketmail.com)
#

import Options, Utils
from os import unlink, symlink, chdir, environ
from os.path import exists

APPNAME = 'nodejs-db-informix'
VERSION = '0.0.7'

top = '.'
out = 'build'

def set_options(opt):
    opt.tool_options('compiler_cxx')
    opt.add_option('--debug', action='store_true', help='Compile with -DDEBUG. Run tests with nodeunit_g')
    opt.add_option('--dev', action='store_true', help='Compile with -DDEV')
    opt.add_option('--info', action='store_true', help='Compile with -DINFO')
    opt.add_option('--error', action='store_true', help='Compile with -DERROR')
    opt.add_option('--warn', action='store_true', help='Enable extra -W* compiler flags')

def configure(conf):
    conf.check_tool('compiler_cxx')
    conf.check_tool('node_addon')
    
    conf.env.append_unique('THREADLIB', ['POSIX'])

    # Informix flags and libraries
    # esql = conf.find_program('esql', var='ESQL', mandatory=True)

    informixdir = environ['INFORMIXDIR']
    # assume informix is installed in /opt/informix if environment variable is
    # not set
    if informixdir == "":
        informixdir = '/opt/informix'

    # Enables all the warnings that are easy to avoid
    conf.env.append_unique('CXXFLAGS', ['-Wall', '-std=c++11'])

    if Options.options.warn:
        # Extra warnings
        conf.env.append_unique('CXXFLAGS', ['-Wextra'])
        # Extra warnings, gcc 4.4
        conf.env.append_unique('CXXFLAGS', ['-Wconversion', '-Wshadow', '-Wsign-conversion', '-Wunreachable-code', '-Wredundant-decls', '-Wcast-qual'])

    # include paths
    conf.env.append_unique('INCLUDES', ['-I'+informixdir+'/incl/dmi', '-I'+informixdir+'/incl', '-I'+informixdir+'/incl/esql', '-I'+informixdir+'/incl/c++', '-Ilib/'])

    # defines
    conf.env.append_unique('CDEFS',    ['-DLINUX', '-DIT_HAS_DISTINCT_LONG_DOUBLE', '-DIT_COMPILER_HAS_LONG_LONG', '-DIT_DLLIB', '-DMITRACE_OFF', '-fPIC'])

    if Options.options.debug:
        conf.env.append_unique('CDEFS', ['-DDEBUG'])

    if Options.options.dev:
        conf.env.append_unique('CDEFS', ['-DDEV'])

    if Options.options.info:
        conf.env.append_unique('CDEFS', ['-DINFO'])

    if Options.options.error:
        conf.env.append_unique('CDEFS', ['-DERROR'])

    # cflags
    conf.env.append_unique('CFLAGS',   ['-g', '-fsigned-char'])
    conf.env.CFLAGS += conf.env.CDEFS

    conf.env.CXXFLAGS += conf.env.CFLAGS + conf.env.INCLUDES

    conf.env.append_unique('LIBS_SYSTEM', ['-lpthread', '-lm', '-ldl', '-lcrypt', '-lnsl'])
    conf.env.append_unique('LIBS_ESQL',   ['-L'+informixdir+'/lib/esql', '-L'+informixdir+'/lib'])
    conf.env.append_unique('LIBS_ESQL',   ['-lifsql', '-lifasf', '-lifgen', '-lifos', '-lifgls', informixdir+'/lib/esql/checkapi.o', '-lifglx', ])
    # conf.env.append_unique('LIBS_ESQL',   Utils.cmd_output('env THREADLIB=POSIX ' + esql + ' -thread -libs').split())
    conf.env.append_unique('LIBS_LIBMI',  ['-L'+informixdir+'/lib/dmi', "-lifdmi"])
    conf.env.append_unique('LIBS_CPPIF',  ['-L'+informixdir+'/lib/c++', '-lifc++'])
    conf.env.LINKFLAGS += conf.env.LIBS_CPPIF + conf.env.LIBS_LIBMI + conf.env.LIBS_ESQL + conf.env.LIBS_SYSTEM
    # conf.env.LINKFLAGS += conf.env.LIBS_SYSTEM + conf.env.LIBS_LIBMI + conf.env.LIBS_CPPIF + conf.env.LIBS_ESQL
    # conf.check_cxx(lib="", errmsg="Missing lib")

def build(bld):
    obj = bld.new_task_gen('cxx', 'shlib', 'node_addon')
    obj.target = 'informix_bindings'
    obj.includes = 'lib/'
    obj.userlib = 'informix'
    # obj.source = 'src/informix_bindings.cxx'
    obj.source = 'lib/nodejs-db/binding.cxx \
            lib/nodejs-db/connection.cxx \
            lib/nodejs-db/events.cxx \
            lib/nodejs-db/exception.cxx \
            lib/nodejs-db/query.cxx \
            lib/nodejs-db/result.cxx \
            src/connection.cxx \
            src/informix.cxx \
            src/result.cxx \
            src/query.cxx \
            src/informix_bindings.cxx'

def package(pkg):
    print('Package');

def test(tst):
    test_binary = 'nodeunit'
    if Options.options.debug:
        test_binary = 'nodeunit_g'
    
    Utils.exec_command(test_binary + ' tests/tests.js')

def lint(lnt):
    # Bindings C++ source code
    print('Run CPPLint:')
    Utils.exec_command('splint --filter=-whitespace/line_length ./lib/nodejs-db/*.h ./lib/nodejs-db/*.cxx src/*.h src/*.cxx')
    # Bindings javascript code, and tools
    print('Run Nodelint for javascript sources:')
    Utils.exec_command('nodelint ./package.json ./nodejs-db-informix.js')
