database tcs_catalog;

create procedure platform_list( i_project_id decimal(12)  )
    returning lvarchar(1000);

    define o_cat_list lvarchar(1000);
    define t_cat_desc lvarchar(1000);

    let o_cat_list = "";

    foreach

        select ppl.name
            into t_cat_desc
        from project_platform_lu ppl
        inner join  project_platform pp
        on ppl.project_platform_id = pp.project_platform_id
        where pp.project_id = i_project_id
        order by ppl.name

        if length(o_cat_list) = 0 then
            let o_cat_list = t_cat_desc;
        else
            let o_cat_list = o_cat_list || ", " || t_cat_desc;
        end if

    end foreach

return o_cat_list;

end procedure;

grant execute on platform_list to public as informix;
