/**
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 */
package com.topcoder.node.jdbc;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;

/**
 * A class to handle query execution.
 *
 * @author pvmagacho
 * @version 1.0
 */
public class InformixWrapper {
    /**
     * The date iso8601 format.
     */
    private static final String DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";

    /**
     * Object to build the result JSON string.
     */
    private static final Gson GSON_OBJECT = new GsonBuilder().setDateFormat(DATE_FORMAT).create();

    /**
     * Object used to parse date in iso8601 format.
     */
    private static final SimpleDateFormat DATE_PARSER = new SimpleDateFormat(DATE_FORMAT);

    /**
     * The database connection.
     */
    private Connection connection;

    /**
     * Constructor.

     * @param connection
     *            the database connection object
     */
    public InformixWrapper(Connection connection)  {
        this.connection = connection;
    }

    /**
     * Execute query selector.
     *
     * @param sql
     *            the SQL string to be executed
     * @return
     *            the JSON string representation of the ResultSet data.
     * @throws SQLException
     *            if something went wrong updating the data.
     */
    public String executeQuery(String sql) throws SQLException {
        List<Map<String, Object>> rows = null;
        Statement st = null;
        ResultSet resultSet = null;

        try {
            st = this.connection.createStatement();
            resultSet = st.executeQuery(sql);

            if (resultSet == null) {
                return "";
            }

            rows = getRows(resultSet);
        } finally {
            if (resultSet != null) {
                resultSet.close();
            }
            if (st != null) {
                st.close();
            }
        }

        return GSON_OBJECT.toJson(rows);
    }

    /**
     * Execute prepared query selector.
     *
     * @param sql
     *            the SQL string to be executed
     * @param jsonParams
     *            the SQL parameters in JSON format
     * @return
     *            the JSON string representation of the ResultSet data.
     * @throws Exception
     *            if something went wrong updating the data.
     */
    public String executePreparedQuery(String sql, String jsonParams) throws Exception {
        List<Map<String, Object>> rows = null;
        PreparedStatement st = null;
        ResultSet resultSet = null;

        try {
            st = this.getPreparedStatement(sql, jsonParams);
            resultSet = st.executeQuery();

            if (resultSet == null) {
                return "";
            }

            rows = getRows(resultSet);
        } finally {
            if (resultSet != null) {
                resultSet.close();
            }
            if (st != null) {
                st.close();
            }
        }

        return GSON_OBJECT.toJson(rows);
    }

    /**
     * Execute query update (INSERT/DELETE/UPDATE).
     *
     * @param sql
     *            the SQL string to be executed
     * @return
     *            the row count for SQL Data Manipulation Language
     * @throws SQLException
     *            if something went wrong updating the data.
     */
    public Integer executeUpdate(String sql) throws SQLException {
        Statement st = null;
        Integer count = 0;

        try {
            st = this.connection.createStatement();
            count = st.executeUpdate(sql);
        } finally {
            if (st != null) {
                st.close();
            }
        }

        return count;
    }

    /**
     * Execute prepared query update (INSERT/DELETE/UPDATE).
     *
     * @param sql
     *            the SQL string to be executed
     * @param jsonParams
     *            the SQL parameters in JSON format
     * @return
     *            the row count for SQL Data Manipulation Language
     * @throws Exception
     *            if something went wrong updating the data.
     */
    public Integer executePreparedUpdate(String sql, String jsonParams) throws Exception {
        PreparedStatement st = null;
        Integer count = 0;

        try {
            st = this.getPreparedStatement(sql, jsonParams);
            count = st.executeUpdate();
        } finally {
            if (st != null) {
                st.close();
            }
        }

        return count;
    }

    /**
     * Get the rows from SQL results.
     *
     * @param resultSet
     *            the SQL result set
     * @return
     *            the rows list with data
     * @throws SQLException
     *            if something went wrong updating the data.
     */
    private List<Map<String, Object>> getRows(ResultSet resultSet) throws SQLException {
        List<Map<String, Object>> rows = new ArrayList<Map<String, Object>>();

        ResultSetMetaData resultSetMetaData = resultSet.getMetaData();
        while (resultSet.next()) {
            Map<String, Object> row = new HashMap<String, Object>();

            for (int column = 1; column <= resultSetMetaData.getColumnCount(); column++) {
                String columnName = resultSetMetaData.getColumnName(column);
                Object columnValue = resultSet.getObject(column);

                row.put(columnName, columnValue);
            }

            rows.add(row);
        }

        return rows;
    }

    /**
     * Get the prepared statement with the parameters set.
     *
     * @param sql
     *            the SQL string to be executed
     * @param jsonParams
     *            the SQL parameters in JSON format
     * @return
     *            the prepared SQL statement
     * @throws Exception
     *            if something went wrong updating the data.
     */
    private PreparedStatement getPreparedStatement(String sql, String jsonParams) throws Exception {
        PreparedStatement st = this.connection.prepareStatement(sql);

        List<Map<String, String>> parameters = GSON_OBJECT.fromJson(jsonParams,
                                    new TypeToken<List<Map<String, String>>>(){}.getType());
        for (int i = 0; i < parameters.size(); i++) {
            Map<String, String> map = parameters.get(i);
            String type = map.get("type");
            String value = map.get("value");

            if (type.toLowerCase().equals("int")) {
                st.setInt(i + 1, Integer.parseInt(value));
            } else if (type.toLowerCase().equals("float")) {
                st.setFloat(i + 1, Float.parseFloat(value));
            } else if (type.toLowerCase().equals("date")) {
            	Date parsed = DATE_PARSER.parse(value);
                st.setDate(i + 1, new java.sql.Date(parsed.getTime()));
            } else if (type.toLowerCase().equals("boolean")) {
            	st.setBoolean(i + 1, Boolean.parseBoolean(value));
            } else {
                st.setString(i + 1, value);
            }
        }

        return st;
    }
}
