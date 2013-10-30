/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Proof Of Concept - TopCoder REST API NodeJS with OAuth Integration
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */
$(document).ready(function () {
    $("#call-api").on('click', function () {

        var data = {};
        $("#apiForm input[type='text']").each(function(){
           var el = $(this);
           data[el.attr('id')] = el.val();
        });
    
        $("#return-text").text('');
        $.ajax({
            type : "POST",
            url: "/callAPI",
            data : data,
            success: function (data) {
                $("#return-text").text(data);
            },
            error: function (xhr, status, errorThrown) {
                $("#return-text").text(xhr.responseText);
            }
        });
        return false;
    });
});