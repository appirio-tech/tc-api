#!/bin/bash -e

CURRENTPWD=${PWD}
CLASSPATH=${PWD}/build/lib/gson-2.2.4.jar
JAVA_VERSION=1.6
JAVAC_OPTS="-classpath ${CLASSPATH} -source ${JAVA_VERSION} -target ${JAVA_VERSION} -bootclasspath ${JAVA_HOME}/jre/lib/rt.jar"

cd ./src/com/topcoder/node/jdbc/
javac ${JAVAC_OPTS} *.java

cd ${CURRENTPWD}/src
jar cf ../build/lib/informix-wrapper.jar .
