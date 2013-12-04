LD_LIBRARY_PATH=""
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

INFORMIXDIR="${DIR}/thirdparty/ibm/informix"
INFORMIXSERVER='informixoltp_tcp'
ONCONFIG="onconfig.${INFORMIXSERVER}"

INFORMIXSQLHOSTS="${INFORMIXDIR}/etc/sqlhosts.${INFORMIXSERVER}"

TC_DATABASE_LIST=(TC_DB TC_DW)

for i in "${TC_DATABASE_LIST[@]}"
do
	nameSuffix='_NAME'
	name='$i$nameSuffix'
	eval name=$name
   	name=\$$name   
	eval name=$name

	hostSuffix="_HOST"
	host='$i$hostSuffix'
	eval host=$host
   	host=\$$host   
	eval host=$host

	portSuffix="_PORT"
   	port='$i$portSuffix'
	eval port=$port
   	port=\$$port   
	eval port=$port

   	hostFile="${INFORMIXDIR}/etc/sqlhosts.$name"

   	printf "$name onsoctcp $host $port" > "$hostFile"
done

INFORMIXLIBDIR="${INFORMIXDIR}/lib"
INFORMIXLIBS=${INFORMIXLIBDIR}
INFORMIXCONTIME=20
INFORMIXCONRETRY=1

for d in c++ cli client client/csm csm dmi esql ; do
    if [[ -d "${INFORMIXLIBDIR}/${d}" ]]; then
        INFORMIXLIBS=${INFORMIXLIBS}:${INFORMIXLIBDIR}/${d}
    fi
done

LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:${INFORMIXLIBS}

PATH=${INFORMIXDIR}/bin:${PATH}
IFMX_HISTORY_SIZE=10000

export INFORMIXSERVER INFORMIXDIR ONCONFIG INFORMIXSQLHOSTS INFORMIXCONTIME INFORMIXCONRETRY LD_LIBRARY_PATH PATH IFMX_HISTORY_SIZE
