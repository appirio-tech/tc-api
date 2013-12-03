LD_LIBRARY_PATH=""
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

INFORMIXDIR="${DIR}/thirdparty/ibm/informix"
INFORMIXSERVER='informixoltp_tcp'
ONCONFIG="onconfig.${INFORMIXSERVER}"

INFORMIXSQLHOSTS="${INFORMIXDIR}/etc/sqlhosts.${INFORMIXSERVER}"

for (( i=1; i<=$TC_DB_COUNT; i++ ))
do
	name='TC_DB_NAME_$i'
	eval name=$name
   	name=\$$name   
	eval name=$name
   	
   	echo $name

	host='TC_DB_HOST_$i'
	eval host=$host
   	host=\$$host   
	eval host=$host
   	
   	echo $host

   	port='TC_DB_PORT_$i'
	eval port=$port
   	port=\$$port   
	eval port=$port
   	
   	echo $port

   	INFORMIXSQLHOSTS="${INFORMIXDIR}/etc/sqlhosts.$name"

   	printf "$name onsoctcp $host $port" > "$INFORMIXSQLHOSTS"
done

#printf "informixoltp_tcp onsoctcp ${TC_DB_HOST} ${TC_DB_PORT}" > "$INFORMIXSQLHOSTS"

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
