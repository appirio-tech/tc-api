{
  'targets': [
    {
      'target_name': 'informix_bindings',
      'informixdir': '<!(echo ${INFORMIXDIR:-/opt/informix})',
      'sources': [
            'lib/nodejs-db/binding.cxx',
            'lib/nodejs-db/connection.cxx',
            'lib/nodejs-db/events.cxx',
            'lib/nodejs-db/exception.cxx',
            'lib/nodejs-db/query.cxx',
            'lib/nodejs-db/result.cxx',
            'src/connection.cxx',
            'src/informix.cxx',
            'src/result.cxx',
            'src/query.cxx',
            'src/informix_bindings.cxx',
      ],
      'include_dirs': [
        '<!(echo $INFORMIXDIR/incl)',
        '<!(echo $INFORMIXDIR/incl/dmi)',
        '<!(echo $INFORMIXDIR/incl/esql)',
        '<!(echo $INFORMIXDIR/incl/c++)',
        'lib',
      ],
      'defines': [
        'LINUX',
        'IT_HAS_DISTINCT_LONG_DOUBLE',
        'IT_COMPILER_HAS_LONG_LONG',
        'IT_DLLIB',
        'MITRACE_OFF',
      ],
      'cflags': [
        '-Wall',
        '-g',
        '-fsigned-char',
      ],
      'cflags_cc': [
        '-fexceptions',
        '-std=c++11',
      ],
      'ldflags': [
        '-lpthread',
        '-lm',
        '-ldl',
        '-lcrypt',
        '-lnsl',
        '-lifsql',
        '-lifasf',
        '-lifgen',
        '-lifos',
        '-lifgls',
        '-lifglx',
        '-lifc++',
        '-lifdmi',
        '<!(echo $INFORMIXDIR/lib/esql/checkapi.o)'
      ],
      'libraries': [
        '-L<!(echo $INFORMIXDIR/lib)',
        '-L<!(echo $INFORMIXDIR/lib/esql)',
        '-L<!(echo $INFORMIXDIR/lib/dmi)',
        '-L<!(echo $INFORMIXDIR/lib/c++)',
      ],
      'conditions': [
        ['OS=="win"', {
          # no Windows support yet...
        }, {
          'libraries': [
          ],
        }],
        ['OS=="mac"', {
          # no Mac support yet...
          'xcode_settings': {
            'OTHER_CFLAGS': [
            ]
          }
        }, {
          'cflags': [
          ],
        }]
      ]
    }
  ]
}
