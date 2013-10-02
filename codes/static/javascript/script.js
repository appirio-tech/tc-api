/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Proof Of Concept - TopCoder REST API NodeJS with OAuth Integration
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */
$(document).ready(function () {
    $("#get-contests").on('click', function () {
        $("#return-text").text('');
        $.ajax({
            url: '/contests/categories/get',
            headers: {
                Authorization: 'Bearer ' + $("#access-token").val()
            },
            dataType: 'text',
            success: function (data) {
                $("#return-text").text(data);
            },
            error: function (xhr, status, errorThrown) {
                $("#return-text").text(xhr.responseText);
            }
        });
    });
});